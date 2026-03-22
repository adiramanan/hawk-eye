import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  Node,
  Project,
  QuoteKind,
  SyntaxKind,
  type ArrayLiteralExpression,
  type ArrowFunction,
  type Expression,
  type FunctionExpression,
  type ObjectLiteralExpression,
  type SourceFile,
} from 'ts-morph';

const SUPPORTED_VITE_CONFIG_FILES = [
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mts',
  'vite.config.mjs',
] as const;

const SUPPORTED_REACT_ENTRY_FILES = [
  'src/main.tsx',
  'src/main.jsx',
  'src/index.tsx',
  'src/index.jsx',
] as const;

interface LoggerLike {
  error(message: string): void;
  log(message: string): void;
}

export interface InstallerRunOptions {
  cwd?: string;
  logger?: LoggerLike;
}

export interface InstallerRunResult {
  changed: boolean;
  changedFiles: string[];
  message: string;
  success: boolean;
}

interface PatchResult {
  changed: boolean;
  reason?: string;
}

interface ConsumerPackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function createProject() {
  return new Project({
    compilerOptions: {
      allowJs: true,
      jsx: 1,
      target: 7,
    },
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    skipAddingFilesFromTsConfig: true,
  });
}

function readJsonFile(filePath: string): ConsumerPackageJson | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as ConsumerPackageJson;
  } catch {
    return null;
  }
}

function hasPackage(
  packageJson: ConsumerPackageJson | null,
  packageName: string
) {
  if (!packageJson) {
    return false;
  }

  return Boolean(
    packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName] ||
      packageJson.peerDependencies?.[packageName]
  );
}

function findExistingFile(cwd: string, candidates: readonly string[]) {
  for (const candidate of candidates) {
    const filePath = join(cwd, candidate);

    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function createSourceFile(project: Project, filePath: string) {
  return project.createSourceFile(filePath, readFileSync(filePath, 'utf8'), {
    overwrite: true,
  });
}

function writeSourceFileIfChanged(sourceFile: SourceFile, originalText: string) {
  const nextText = sourceFile.getFullText();

  if (nextText === originalText) {
    return false;
  }

  writeFileSync(sourceFile.getFilePath(), nextText, 'utf8');
  return true;
}

function collectIdentifiers(sourceFile: SourceFile) {
  return new Set(
    sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .map((identifier) => identifier.getText())
  );
}

function getUniqueIdentifier(sourceFile: SourceFile, preferredName: string) {
  const identifiers = collectIdentifiers(sourceFile);

  if (!identifiers.has(preferredName)) {
    return preferredName;
  }

  let counter = 2;
  let nextName = `${preferredName}${counter}`;

  while (identifiers.has(nextName)) {
    counter += 1;
    nextName = `${preferredName}${counter}`;
  }

  return nextName;
}

function ensureDefaultImport(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  preferredName: string
) {
  const existingImport = sourceFile.getImportDeclaration(moduleSpecifier);

  if (existingImport) {
    const existingDefaultImport = existingImport.getDefaultImport();

    if (existingDefaultImport) {
      return existingDefaultImport.getText();
    }

    const importName = getUniqueIdentifier(sourceFile, preferredName);
    existingImport.setDefaultImport(importName);
    return importName;
  }

  const importName = getUniqueIdentifier(sourceFile, preferredName);
  sourceFile.addImportDeclaration({
    defaultImport: importName,
    moduleSpecifier,
  });
  return importName;
}

function ensureNamedImport(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  importName: string
) {
  const existingImport = sourceFile.getImportDeclaration(moduleSpecifier);

  if (existingImport) {
    const hasNamedImport = existingImport
      .getNamedImports()
      .some((namedImport) => namedImport.getName() === importName);

    if (!hasNamedImport) {
      existingImport.addNamedImport(importName);
    }

    return;
  }

  sourceFile.addImportDeclaration({
    moduleSpecifier,
    namedImports: [importName],
  });
}

function unwrapParenthesizedExpression(expression: Expression): Expression {
  let currentExpression = expression;

  while (Node.isParenthesizedExpression(currentExpression)) {
    currentExpression = currentExpression.getExpression();
  }

  return currentExpression;
}

function findReturnedObjectLiteral(
  expression: ArrowFunction | FunctionExpression
) {
  const body = expression.getBody();

  if (Node.isObjectLiteralExpression(body)) {
    return body;
  }

  if (Node.isParenthesizedExpression(body)) {
    const innerExpression = unwrapParenthesizedExpression(body.getExpression());

    if (Node.isObjectLiteralExpression(innerExpression)) {
      return innerExpression;
    }
  }

  if (!Node.isBlock(body)) {
    return null;
  }

  return (
    body
      .getDescendantsOfKind(SyntaxKind.ReturnStatement)
      .map((statement) => statement.getExpression())
      .find((candidate): candidate is ObjectLiteralExpression =>
        Boolean(candidate && Node.isObjectLiteralExpression(candidate))
      ) ?? null
  );
}

function extractConfigObject(expression: Expression): ObjectLiteralExpression | null {
  const unwrappedExpression = unwrapParenthesizedExpression(expression);

  if (Node.isObjectLiteralExpression(unwrappedExpression)) {
    return unwrappedExpression;
  }

  if (!Node.isCallExpression(unwrappedExpression)) {
    return null;
  }

  const callee = unwrappedExpression.getExpression().getText();

  if (callee !== 'defineConfig') {
    return null;
  }

  const [firstArgument] = unwrappedExpression.getArguments();

  if (!firstArgument || Node.isSpreadElement(firstArgument)) {
    return null;
  }

  const unwrappedArgument = unwrapParenthesizedExpression(firstArgument as Expression);

  if (Node.isObjectLiteralExpression(unwrappedArgument)) {
    return unwrappedArgument;
  }

  if (Node.isArrowFunction(unwrappedArgument) || Node.isFunctionExpression(unwrappedArgument)) {
    return findReturnedObjectLiteral(unwrappedArgument);
  }

  return null;
}

function findViteConfigObject(sourceFile: SourceFile) {
  const exportAssignment = sourceFile
    .getDescendantsOfKind(SyntaxKind.ExportAssignment)
    .find((assignment) => !assignment.isExportEquals());

  if (!exportAssignment) {
    return null;
  }

  const expression = exportAssignment.getExpression();

  if (!expression) {
    return null;
  }

  return extractConfigObject(expression);
}

function findPropertyAssignment(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
) {
  const property = objectLiteral.getProperty(propertyName);

  if (!property || !Node.isPropertyAssignment(property)) {
    return null;
  }

  return property;
}

function ensurePluginsArray(
  configObject: ObjectLiteralExpression
): ArrayLiteralExpression | null {
  const pluginsProperty = findPropertyAssignment(configObject, 'plugins');

  if (!pluginsProperty) {
    const nextProperty = configObject.addPropertyAssignment({
      initializer: '[]',
      name: 'plugins',
    });
    const nextInitializer = nextProperty.getInitializer();

    return nextInitializer && Node.isArrayLiteralExpression(nextInitializer)
      ? nextInitializer
      : null;
  }

  const initializer = pluginsProperty.getInitializer();

  return initializer && Node.isArrayLiteralExpression(initializer) ? initializer : null;
}

function patchViteConfig(filePath: string): PatchResult {
  const project = createProject();
  const sourceFile = createSourceFile(project, filePath);
  const originalText = sourceFile.getFullText();
  const pluginIdentifier = ensureDefaultImport(sourceFile, 'hawk-eye/vite', 'hawkeyePlugin');
  const configObject = findViteConfigObject(sourceFile);

  if (!configObject) {
    return {
      changed: false,
      reason: `Could not find a supported default-exported Vite config object in ${filePath}.`,
    };
  }

  const pluginsArray = ensurePluginsArray(configObject);

  if (!pluginsArray) {
    return {
      changed: false,
      reason: `Could not find or create a literal plugins array in ${filePath}.`,
    };
  }

  const hasPlugin = pluginsArray
    .getElements()
    .some((element) => element.getText().includes(pluginIdentifier));

  if (!hasPlugin) {
    pluginsArray.addElement(`${pluginIdentifier}()`);
  }

  return {
    changed: writeSourceFileIfChanged(sourceFile, originalText),
  };
}

function isJsxRenderableExpression(expression: Expression) {
  return (
    Node.isJsxElement(expression) ||
    Node.isJsxSelfClosingElement(expression) ||
    Node.isJsxFragment(expression)
  );
}

function findRootRenderCall(sourceFile: SourceFile) {
  return (
    sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .find((callExpression) => {
        const expression = callExpression.getExpression();

        return Node.isPropertyAccessExpression(expression) && expression.getName() === 'render';
      }) ?? null
  );
}

function renderWithDesignTool(expression: Expression) {
  const renderableExpression = unwrapParenthesizedExpression(expression);
  const existingTree = isJsxRenderableExpression(renderableExpression)
    ? renderableExpression.getText()
    : `{${renderableExpression.getText()}}`;

  return `<>
  ${existingTree}
  {import.meta.env.DEV ? <DesignTool /> : null}
</>`;
}

function patchReactEntry(filePath: string): PatchResult {
  const project = createProject();
  const sourceFile = createSourceFile(project, filePath);
  const originalText = sourceFile.getFullText();

  if (originalText.includes('<DesignTool')) {
    return { changed: false };
  }

  ensureNamedImport(sourceFile, 'hawk-eye', 'DesignTool');

  const renderCall = findRootRenderCall(sourceFile);

  if (!renderCall) {
    return {
      changed: false,
      reason: `Could not find a React root render() call in ${filePath}.`,
    };
  }

  const [renderArgument] = renderCall.getArguments();

  if (!renderArgument || Node.isSpreadElement(renderArgument)) {
    return {
      changed: false,
      reason: `Could not find a render tree argument in ${filePath}.`,
    };
  }

  renderArgument.replaceWithText(renderWithDesignTool(renderArgument as Expression));

  return {
    changed: writeSourceFileIfChanged(sourceFile, originalText),
  };
}

function buildManualFallback(cwd: string, viteConfigPath: string | null, entryFilePath: string | null) {
  const viteTarget = viteConfigPath ?? '<vite.config.ts>';
  const entryTarget = entryFilePath ?? '<src/main.tsx>';

  return [
    `Hawk-Eye could not patch this project automatically in ${cwd}.`,
    `Manual fallback:`,
    `1. Add \`import hawkeyePlugin from 'hawk-eye/vite'\` to ${viteTarget} and include \`hawkeyePlugin()\` in the Vite plugins array.`,
    `2. Add \`import { DesignTool } from 'hawk-eye'\` to ${entryTarget}.`,
    `3. Render \`{import.meta.env.DEV ? <DesignTool /> : null}\` alongside the app root tree.`,
  ].join('\n');
}

function detectSupportedProject(packageJson: ConsumerPackageJson | null) {
  return (
    hasPackage(packageJson, 'react') &&
    hasPackage(packageJson, 'react-dom') &&
    hasPackage(packageJson, 'vite')
  );
}

export function runInstaller({
  cwd = process.cwd(),
  logger = console,
}: InstallerRunOptions = {}): InstallerRunResult {
  const packageJsonPath = join(cwd, 'package.json');
  const packageJson = readJsonFile(packageJsonPath);
  const viteConfigPath = findExistingFile(cwd, SUPPORTED_VITE_CONFIG_FILES);
  const reactEntryPath = findExistingFile(cwd, SUPPORTED_REACT_ENTRY_FILES);

  if (!existsSync(packageJsonPath) || !detectSupportedProject(packageJson)) {
    const message = buildManualFallback(cwd, viteConfigPath, reactEntryPath);
    logger.error(message);
    return {
      changed: false,
      changedFiles: [],
      message,
      success: false,
    };
  }

  if (!viteConfigPath || !reactEntryPath) {
    const message = buildManualFallback(cwd, viteConfigPath, reactEntryPath);
    logger.error(message);
    return {
      changed: false,
      changedFiles: [],
      message,
      success: false,
    };
  }

  const vitePatch = patchViteConfig(viteConfigPath);

  if (vitePatch.reason) {
    const message = `${vitePatch.reason}\n\n${buildManualFallback(cwd, viteConfigPath, reactEntryPath)}`;
    logger.error(message);
    return {
      changed: false,
      changedFiles: [],
      message,
      success: false,
    };
  }

  const reactPatch = patchReactEntry(reactEntryPath);

  if (reactPatch.reason) {
    const message = `${reactPatch.reason}\n\n${buildManualFallback(cwd, viteConfigPath, reactEntryPath)}`;
    logger.error(message);
    return {
      changed: false,
      changedFiles: [],
      message,
      success: false,
    };
  }

  const changedFiles = [
    ...(vitePatch.changed ? [viteConfigPath] : []),
    ...(reactPatch.changed ? [reactEntryPath] : []),
  ];

  const message =
    changedFiles.length > 0
      ? `Hawk-Eye init patched:\n${changedFiles.map((filePath) => `- ${filePath}`).join('\n')}`
      : 'Hawk-Eye init found an existing setup. No changes were needed.';

  logger.log(message);

  return {
    changed: changedFiles.length > 0,
    changedFiles,
    message,
    success: true,
  };
}
