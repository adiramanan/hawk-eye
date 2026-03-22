import {
  Node,
  Project,
  type JsxAttribute,
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  type ObjectLiteralExpression,
  type SourceFile,
} from 'ts-morph';
import type { MutationWarning } from '../../../shared/protocol';
import type {
  ElementMutation,
  PropertyMutation,
  SourceWriteResult,
} from './mutations';
import { resolveWorkspaceFile } from './path-security';
import {
  findJsxElementAtPosition as findJsxElementAtPositionFromAnalyzer,
  type StyleMode,
} from './style-analyzer';
import {
  cssToTailwindClass,
  isTailwindRoundTripSupported,
  tailwindClassToCss,
} from './tailwind-map';

type JsxOpeningLike = JsxOpeningElement | JsxSelfClosingElement;
type AttributeName = 'class' | 'className';
type SupportedAttributeName = AttributeName | 'style';
type ClassAttributeState = 'dynamic' | 'literal' | 'missing';
type StyleAttributeState = 'dynamic' | 'expression' | 'missing' | 'object';

interface ClassAttributeInfo {
  attribute: JsxAttribute | null;
  classNames: string[];
  name: AttributeName;
  state: ClassAttributeState;
}

interface StyleAttributeInfo {
  attribute: JsxAttribute | null;
  expressionText: string | null;
  objectLiteral: ObjectLiteralExpression | null;
  state: StyleAttributeState;
}

interface LoadedSourceFile {
  originalText: string;
  relativeFile: string;
  sourceFile: SourceFile;
}

interface ClassMutationResult {
  fellBackToInline: boolean;
  handledByClass: boolean;
}

const JSX_EMIT_PRESERVE = 1;
const SCRIPT_TARGET_ES2020 = 7;
const IDENTIFIER_PATTERN = /^[$A-Z_][0-9A-Z_$]*$/i;
const WIDTH_SIZE_MODE_CSS_PROPERTY = '--hawk-eye-width-mode';
const HEIGHT_SIZE_MODE_CSS_PROPERTY = '--hawk-eye-height-mode';

function createProject() {
  return new Project({
    compilerOptions: {
      allowJs: true,
      jsx: JSX_EMIT_PRESERVE,
      target: SCRIPT_TARGET_ES2020,
    },
    skipAddingFilesFromTsConfig: true,
  });
}

function splitClassNames(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getNamedAttribute(node: JsxOpeningLike, ...names: SupportedAttributeName[]) {
  return (
    node
      .getAttributes()
      .find(
        (attribute): attribute is JsxAttribute =>
          Node.isJsxAttribute(attribute) &&
          names.some((name) => name === attribute.getNameNode().getText())
      ) ?? null
  );
}

function getLiteralAttributeValue(attribute: JsxAttribute | null) {
  if (!attribute) {
    return undefined;
  }

  const initializer = attribute.getInitializer();

  if (!initializer) {
    return '';
  }

  if (Node.isStringLiteral(initializer)) {
    return initializer.getLiteralText();
  }

  if (!Node.isJsxExpression(initializer)) {
    return null;
  }

  const expression = initializer.getExpression();

  if (!expression) {
    return '';
  }

  if (Node.isStringLiteral(expression) || Node.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.getLiteralText();
  }

  return null;
}

function readClassAttribute(node: JsxOpeningLike): ClassAttributeInfo {
  const attribute = getNamedAttribute(node, 'className', 'class');

  if (!attribute) {
    return {
      attribute: null,
      classNames: [],
      name: 'className',
      state: 'missing',
    };
  }

  const literalValue = getLiteralAttributeValue(attribute);

  if (literalValue === null) {
    return {
      attribute,
      classNames: [],
      name: attribute.getNameNode().getText() === 'class' ? 'class' : 'className',
      state: 'dynamic',
    };
  }

  return {
    attribute,
    classNames: splitClassNames(literalValue ?? ''),
    name: attribute.getNameNode().getText() === 'class' ? 'class' : 'className',
    state: 'literal',
  };
}

function readStyleAttribute(node: JsxOpeningLike): StyleAttributeInfo {
  const attribute = getNamedAttribute(node, 'style');

  if (!attribute) {
    return {
      attribute: null,
      expressionText: null,
      objectLiteral: null,
      state: 'missing',
    };
  }

  const initializer = attribute.getInitializer();

  if (!initializer || !Node.isJsxExpression(initializer)) {
    return {
      attribute,
      expressionText: null,
      objectLiteral: null,
      state: 'dynamic',
    };
  }

  const expression = initializer.getExpression();

  if (!expression || !Node.isObjectLiteralExpression(expression)) {
    return {
      attribute,
      expressionText: expression?.getText() ?? null,
      objectLiteral: null,
      state: expression ? 'expression' : 'dynamic',
    };
  }

  return {
    attribute,
    expressionText: null,
    objectLiteral: expression,
    state: 'object',
  };
}

function toReactStylePropertyName(cssProperty: string) {
  if (cssProperty.startsWith('--')) {
    return cssProperty;
  }

  return cssProperty
    .trim()
    .toLowerCase()
    .replace(/-([a-z])/g, (_match, character: string) => character.toUpperCase());
}

function toObjectLiteralPropertyName(propertyName: string) {
  return IDENTIFIER_PATTERN.test(propertyName) ? propertyName : JSON.stringify(propertyName);
}

function normalizePropertyName(propertyName: string) {
  return propertyName.replace(/^['"`]|['"`]$/g, '');
}

function getStyleObjectProperty(objectLiteral: ObjectLiteralExpression, propertyName: string) {
  return (
    objectLiteral.getProperties().find((property) => {
      if (!Node.isPropertyAssignment(property)) {
        return false;
      }

      return normalizePropertyName(property.getName()) === propertyName;
    }) ?? null
  );
}

function renderStyleDeclarations(mutations: PropertyMutation[]) {
  return mutations.map((mutation) => {
    const propertyName = toReactStylePropertyName(mutation.cssProperty);
    return `${toObjectLiteralPropertyName(propertyName)}: ${JSON.stringify(mutation.newValue)}`;
  });
}

function renderStyleInitializer(mutations: PropertyMutation[]) {
  const declarations = renderStyleDeclarations(mutations);

  return `{{ ${declarations.join(', ')} }}`;
}

function renderWrappedStyleInitializer(expressionText: string, mutations: PropertyMutation[]) {
  const declarations = renderStyleDeclarations(mutations);

  if (declarations.length === 0) {
    return `{{ ...${expressionText} }}`;
  }

  return `{{ ...${expressionText}, ${declarations.join(', ')} }}`;
}

function addUnsupportedDynamicStyleWarnings(
  mutation: ElementMutation,
  inlineMutations: PropertyMutation[],
  warnings: MutationWarning[]
) {
  for (const propertyMutation of inlineMutations) {
    warnings.push({
      code: 'unsupported-dynamic-style',
      file: mutation.file,
      line: mutation.line,
      column: mutation.column,
      propertyId: propertyMutation.propertyId,
      message: `Skipped ${propertyMutation.propertyId} because the style prop is not an object literal.`,
    });
  }
}

function upsertInlineStyles(
  node: JsxOpeningLike,
  mutation: ElementMutation,
  inlineMutations: PropertyMutation[],
  warnings: MutationWarning[],
  options: {
    allowStyleExpressionWrap: boolean;
  }
) {
  if (inlineMutations.length === 0) {
    return;
  }

  const styleAttribute = readStyleAttribute(node);

  if (styleAttribute.state === 'dynamic') {
    addUnsupportedDynamicStyleWarnings(mutation, inlineMutations, warnings);
    return;
  }

  if (styleAttribute.state === 'expression') {
    if (!options.allowStyleExpressionWrap || !styleAttribute.attribute || !styleAttribute.expressionText) {
      addUnsupportedDynamicStyleWarnings(mutation, inlineMutations, warnings);
      return;
    }

    styleAttribute.attribute.setInitializer(
      renderWrappedStyleInitializer(styleAttribute.expressionText, inlineMutations)
    );

    return;
  }

  if (styleAttribute.state === 'missing') {
    node.addAttribute({
      initializer: renderStyleInitializer(inlineMutations),
      name: 'style',
    });
    return;
  }

  const objectLiteral = styleAttribute.objectLiteral;

  if (!objectLiteral) {
    return;
  }

  for (const propertyMutation of inlineMutations) {
    const propertyName = toReactStylePropertyName(propertyMutation.cssProperty);
    const existingProperty = getStyleObjectProperty(objectLiteral, propertyName);

    if (existingProperty && Node.isPropertyAssignment(existingProperty)) {
      existingProperty.setInitializer(JSON.stringify(propertyMutation.newValue));
      continue;
    }

    objectLiteral.addPropertyAssignment({
      initializer: JSON.stringify(propertyMutation.newValue),
      name: toObjectLiteralPropertyName(propertyName),
    });
  }
}

function setClassAttribute(node: JsxOpeningLike, info: ClassAttributeInfo, classNames: string[]) {
  if (classNames.length === 0) {
    info.attribute?.remove();
    return;
  }

  const nextValue = JSON.stringify(classNames.join(' '));

  if (info.attribute) {
    info.attribute.setInitializer(nextValue);
    return;
  }

  node.addAttribute({
    initializer: nextValue,
    name: info.name,
  });
}

function getMatchingClassIndexes(classNames: string[], cssProperty: string) {
  const normalizedProperty = cssProperty.trim().toLowerCase();
  const indexes: number[] = [];

  for (let index = 0; index < classNames.length; index += 1) {
    const declaration = tailwindClassToCss(classNames[index]);

    if (declaration?.property === normalizedProperty) {
      indexes.push(index);
    }
  }

  return indexes;
}

function applyClassMutation(classNames: string[], propertyMutation: PropertyMutation): ClassMutationResult {
  const matchingIndexes = getMatchingClassIndexes(classNames, propertyMutation.cssProperty);

  if (matchingIndexes.length === 0) {
    return {
      fellBackToInline: false,
      handledByClass: false,
    };
  }

  const nextClassName = cssToTailwindClass(propertyMutation.cssProperty, propertyMutation.newValue);

  for (let index = matchingIndexes.length - 1; index > 0; index -= 1) {
    classNames.splice(matchingIndexes[index], 1);
  }

  const targetIndex = matchingIndexes[0];

  if (!nextClassName) {
    classNames.splice(targetIndex, 1);

    return {
      fellBackToInline: true,
      handledByClass: false,
    };
  }

  classNames[targetIndex] = nextClassName;

  return {
    fellBackToInline: false,
    handledByClass: true,
  };
}

function addDynamicClassWarning(
  mutation: ElementMutation,
  propertyMutation: PropertyMutation,
  warnings: MutationWarning[]
) {
  warnings.push({
    code: 'unsupported-dynamic-class',
    file: mutation.file,
    line: mutation.line,
    column: mutation.column,
    propertyId: propertyMutation.propertyId,
    message: `Fell back to inline styles for ${propertyMutation.propertyId} because className is dynamic.`,
  });
}

function addInlineFallbackWarning(
  mutation: ElementMutation,
  propertyMutation: PropertyMutation,
  warnings: MutationWarning[]
) {
  warnings.push({
    code: 'inline-fallback',
    file: mutation.file,
    line: mutation.line,
    column: mutation.column,
    propertyId: propertyMutation.propertyId,
    message: `Fell back to inline styles for ${propertyMutation.propertyId} because no Tailwind class could represent ${propertyMutation.newValue}.`,
  });
}

function addUnsupportedTailwindPropertyWarning(
  mutation: ElementMutation,
  propertyMutation: PropertyMutation,
  warnings: MutationWarning[]
) {
  warnings.push({
    code: 'unsupported-tailwind-property',
    file: mutation.file,
    line: mutation.line,
    column: mutation.column,
    propertyId: propertyMutation.propertyId,
    message: `Persisted ${propertyMutation.propertyId} as inline styles because Tailwind class round-tripping is not supported for ${propertyMutation.cssProperty}.`,
  });
}

function usesTailwindClasses(styleMode: StyleMode) {
  return styleMode === 'mixed' || styleMode === 'tailwind';
}

function getSizeModeInlineMutations(mutation: ElementMutation): PropertyMutation[] {
  const nextMutations: PropertyMutation[] = [];

  if (mutation.sizeModeMetadata?.width) {
    nextMutations.push({
      propertyId: 'widthMode',
      cssProperty: WIDTH_SIZE_MODE_CSS_PROPERTY,
      oldValue: '',
      newValue: mutation.sizeModeMetadata.width,
    });
  }

  if (mutation.sizeModeMetadata?.height) {
    nextMutations.push({
      propertyId: 'heightMode',
      cssProperty: HEIGHT_SIZE_MODE_CSS_PROPERTY,
      oldValue: '',
      newValue: mutation.sizeModeMetadata.height,
    });
  }

  return nextMutations;
}

function getCompanionInlineMutations(mutation: ElementMutation): PropertyMutation[] {
  const nextMutations: PropertyMutation[] = [];
  const hasBackgroundColorMutation = mutation.properties.some(
    (propertyMutation) =>
      propertyMutation.propertyId === 'backgroundColor' &&
      propertyMutation.newValue.trim() !== propertyMutation.oldValue.trim()
  );

  if (hasBackgroundColorMutation) {
    nextMutations.push({
      propertyId: 'backgroundImage',
      cssProperty: 'background-image',
      oldValue: '',
      newValue: 'none',
    });
  }

  return nextMutations;
}

function applyElementMutation(
  node: JsxOpeningLike,
  mutation: ElementMutation,
  warnings: MutationWarning[]
) {
  const classInfo = readClassAttribute(node);
  const nextClassNames = [...classInfo.classNames];
  const inlineMutations: PropertyMutation[] = [];
  const companionInlineMutations = getCompanionInlineMutations(mutation);
  const sizeModeInlineMutations = getSizeModeInlineMutations(mutation);

  if (mutation.detached) {
    classInfo.attribute?.remove();
    inlineMutations.push(...mutation.properties);
    upsertInlineStyles(
      node,
      mutation,
      [...inlineMutations, ...companionInlineMutations, ...sizeModeInlineMutations],
      warnings,
      {
        allowStyleExpressionWrap: false,
      }
    );
    return;
  }

  if (!usesTailwindClasses(mutation.styleMode)) {
    inlineMutations.push(...mutation.properties);
    upsertInlineStyles(
      node,
      mutation,
      [...inlineMutations, ...companionInlineMutations, ...sizeModeInlineMutations],
      warnings,
      {
        allowStyleExpressionWrap: true,
      }
    );
    return;
  }

  for (const propertyMutation of mutation.properties) {
    if (classInfo.state === 'dynamic') {
      addDynamicClassWarning(mutation, propertyMutation, warnings);
      inlineMutations.push(propertyMutation);
      continue;
    }

    if (!isTailwindRoundTripSupported(propertyMutation.cssProperty)) {
      addUnsupportedTailwindPropertyWarning(mutation, propertyMutation, warnings);
      inlineMutations.push(propertyMutation);
      continue;
    }

    const result = applyClassMutation(nextClassNames, propertyMutation);

    if (result.handledByClass) {
      continue;
    }

    if (result.fellBackToInline) {
      addInlineFallbackWarning(mutation, propertyMutation, warnings);
    }

    inlineMutations.push(propertyMutation);
  }

  if (classInfo.state === 'literal') {
    setClassAttribute(node, classInfo, nextClassNames);
  }

  upsertInlineStyles(
    node,
    mutation,
    [...inlineMutations, ...companionInlineMutations, ...sizeModeInlineMutations],
    warnings,
    {
      allowStyleExpressionWrap: true,
    }
  );
}

function getOrLoadSourceFile(
  project: Project,
  loadedFiles: Map<string, LoadedSourceFile>,
  absoluteFile: string,
  relativeFile: string
) {
  const existing = loadedFiles.get(absoluteFile);

  if (existing) {
    return existing;
  }

  const sourceFile = project.addSourceFileAtPath(absoluteFile);
  const loadedSourceFile = {
    originalText: sourceFile.getFullText(),
    relativeFile,
    sourceFile,
  } satisfies LoadedSourceFile;

  loadedFiles.set(absoluteFile, loadedSourceFile);

  return loadedSourceFile;
}

export function findJsxElementAtPosition(sourceFile: SourceFile, line: number, column: number) {
  return findJsxElementAtPositionFromAnalyzer(sourceFile, line, column);
}

export function writeSourceMutations(
  root: string,
  payload: { mutations: ElementMutation[] }
): SourceWriteResult {
  const project = createProject();
  const loadedFiles = new Map<string, LoadedSourceFile>();
  const warnings: MutationWarning[] = [];

  for (const mutation of payload.mutations) {
    const resolvedFile = resolveWorkspaceFile(root, mutation.file);

    if (!resolvedFile.ok) {
      warnings.push({
        code: 'path-outside-root',
        file: mutation.file,
        line: mutation.line,
        column: mutation.column,
        message:
          resolvedFile.reason === 'symlink-not-allowed'
            ? `Skipped ${mutation.file} because symlinked source targets are not allowed.`
            : `Skipped ${mutation.file} because it is not a valid workspace source path.`,
      });
      continue;
    }

    const loadedSourceFile = getOrLoadSourceFile(
      project,
      loadedFiles,
      resolvedFile.value.absoluteFile,
      mutation.file
    );
    const jsxElement = findJsxElementAtPosition(
      loadedSourceFile.sourceFile,
      mutation.line,
      mutation.column
    );

    if (!jsxElement) {
      warnings.push({
        code: 'element-not-found',
        file: mutation.file,
        line: mutation.line,
        column: mutation.column,
        message: `Could not find a JSX element at ${mutation.file}:${mutation.line}:${mutation.column}.`,
      });
      continue;
    }

    applyElementMutation(jsxElement, mutation, warnings);
  }

  const modifiedFiles: string[] = [];

  for (const loadedSourceFile of loadedFiles.values()) {
    if (loadedSourceFile.sourceFile.getFullText() === loadedSourceFile.originalText) {
      continue;
    }

    loadedSourceFile.sourceFile.saveSync();
    modifiedFiles.push(loadedSourceFile.relativeFile);
  }

  return {
    appliedMutationCount: payload.mutations.length,
    modifiedFiles,
    warnings,
  };
}
