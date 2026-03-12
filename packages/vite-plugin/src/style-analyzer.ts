import {
  Node,
  Project,
  SyntaxKind,
  type JsxAttribute,
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  type SourceFile,
} from 'ts-morph';

export type StyleMode = 'inline' | 'tailwind' | 'mixed' | 'detached' | 'unknown';

export interface StyleAnalysisResult {
  mode: StyleMode;
  classNames: string[];
  inlineStyles: Record<string, string>;
}

type JsxOpeningLike = JsxOpeningElement | JsxSelfClosingElement;

const JSX_EMIT_PRESERVE = 1;
const SCRIPT_TARGET_ES2020 = 7;

const EXACT_TAILWIND_TOKENS = new Set([
  'absolute',
  'block',
  'fixed',
  'flex',
  'grid',
  'hidden',
  'inline',
  'inline-block',
  'inline-flex',
  'relative',
  'shadow',
  'static',
  'sticky',
  'transition',
  'visible',
]);

const TAILWIND_PREFIXES = [
  'align-',
  'backdrop-',
  'bg-',
  'border-',
  'bottom-',
  'col-span-',
  'column-gap-',
  'cursor-',
  'duration-',
  'ease-',
  'filter-',
  'font-',
  'from-',
  'gap-',
  'gap-x-',
  'gap-y-',
  'grid-cols-',
  'h-',
  'hover:',
  'items-',
  'justify-',
  'leading-',
  'left-',
  'm-',
  'max-h-',
  'max-w-',
  'mb-',
  'min-h-',
  'min-w-',
  'ml-',
  'mr-',
  'mt-',
  'mx-',
  'my-',
  'object-',
  'opacity-',
  'overflow-',
  'p-',
  'pb-',
  'place-',
  'pl-',
  'pointer-events-',
  'pr-',
  'pt-',
  'px-',
  'py-',
  'right-',
  'rounded-',
  'row-gap-',
  'row-span-',
  'select-',
  'self-',
  'shadow-',
  'space-x-',
  'space-y-',
  'text-',
  'top-',
  'to-',
  'tracking-',
  'via-',
  'w-',
  'z-',
];

function createUnknownAnalysis(
  overrides: Partial<Pick<StyleAnalysisResult, 'classNames' | 'inlineStyles'>> = {}
): StyleAnalysisResult {
  return {
    mode: 'unknown',
    classNames: overrides.classNames ?? [],
    inlineStyles: overrides.inlineStyles ?? {},
  };
}

function getLineAndColumn(sourceFile: SourceFile, node: JsxOpeningLike) {
  return sourceFile.getLineAndColumnAtPos(node.getStart());
}

function getNamedAttribute(node: JsxOpeningLike, ...names: string[]) {
  return node
    .getAttributes()
    .find(
      (attribute): attribute is JsxAttribute =>
        Node.isJsxAttribute(attribute) && names.includes(attribute.getNameNode().getText())
    );
}

function getAttributeLiteralValue(attribute: JsxAttribute | undefined) {
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

function splitClassNames(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getLastVariantIndex(token: string) {
  let squareDepth = 0;
  let roundDepth = 0;
  let lastIndex = -1;

  for (let index = 0; index < token.length; index += 1) {
    const char = token[index];

    if (char === '[') {
      squareDepth += 1;
      continue;
    }

    if (char === ']') {
      squareDepth = Math.max(0, squareDepth - 1);
      continue;
    }

    if (char === '(') {
      roundDepth += 1;
      continue;
    }

    if (char === ')') {
      roundDepth = Math.max(0, roundDepth - 1);
      continue;
    }

    if (char === ':' && squareDepth === 0 && roundDepth === 0) {
      lastIndex = index;
    }
  }

  return lastIndex;
}

function normalizeTailwindToken(token: string) {
  const withoutImportant = token.startsWith('!') ? token.slice(1) : token;
  const variantIndex = getLastVariantIndex(withoutImportant);

  return variantIndex === -1 ? withoutImportant : withoutImportant.slice(variantIndex + 1);
}

function isLikelyTailwindClass(token: string) {
  const normalizedToken = normalizeTailwindToken(token);

  if (!normalizedToken) {
    return false;
  }

  if (EXACT_TAILWIND_TOKENS.has(normalizedToken)) {
    return true;
  }

  return TAILWIND_PREFIXES.some((prefix) => normalizedToken.startsWith(prefix));
}

function toCssPropertyName(propertyName: string) {
  const normalizedProperty = propertyName.replace(/^['"`]|['"`]$/g, '');

  if (!normalizedProperty || normalizedProperty.startsWith('--')) {
    return normalizedProperty;
  }

  if (normalizedProperty.includes('-')) {
    return normalizedProperty.toLowerCase();
  }

  return normalizedProperty
    .replace(/([A-Z])/g, '-$1')
    .replace(/^ms-/, '-ms-')
    .replace(/^webkit-/, '-webkit-')
    .replace(/^moz-/, '-moz-')
    .toLowerCase();
}

function getLiteralExpressionValue(node: Node | undefined): string | null {
  if (!node) {
    return null;
  }

  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralText();
  }

  if (Node.isNumericLiteral(node)) {
    return node.getText();
  }

  if (Node.isTrueLiteral(node)) {
    return 'true';
  }

  if (Node.isFalseLiteral(node)) {
    return 'false';
  }

  if (Node.isPrefixUnaryExpression(node) && Node.isNumericLiteral(node.getOperand())) {
    return node.getText();
  }

  return null;
}

function analyzeInlineStyles(node: JsxOpeningLike) {
  const styleAttribute = getNamedAttribute(node, 'style');

  if (!styleAttribute) {
    return {
      dynamic: false,
      hasInlineStyle: false,
      inlineStyles: {} as Record<string, string>,
    };
  }

  const initializer = styleAttribute.getInitializer();

  if (!initializer || !Node.isJsxExpression(initializer)) {
    return {
      dynamic: true,
      hasInlineStyle: true,
      inlineStyles: {},
    };
  }

  const expression = initializer.getExpression();

  if (!expression) {
    return {
      dynamic: false,
      hasInlineStyle: true,
      inlineStyles: {},
    };
  }

  if (!Node.isObjectLiteralExpression(expression)) {
    return {
      dynamic: true,
      hasInlineStyle: true,
      inlineStyles: {},
    };
  }

  const inlineStyles: Record<string, string> = {};

  for (const property of expression.getProperties()) {
    if (!Node.isPropertyAssignment(property)) {
      continue;
    }

    const name = toCssPropertyName(property.getName());
    const value = getLiteralExpressionValue(property.getInitializer());

    if (!name || value === null) {
      continue;
    }

    inlineStyles[name] = value;
  }

  return {
    dynamic: false,
    hasInlineStyle: true,
    inlineStyles,
  };
}

function analyzeClassNames(node: JsxOpeningLike) {
  const classAttribute = getNamedAttribute(node, 'className', 'class');
  const literalValue = getAttributeLiteralValue(classAttribute);

  if (literalValue === undefined) {
    return {
      classNames: [] as string[],
      dynamic: false,
      hasClassNames: false,
      supported: false,
    };
  }

  if (literalValue === null) {
    return {
      classNames: [],
      dynamic: true,
      hasClassNames: true,
      supported: false,
    };
  }

  const classNames = splitClassNames(literalValue);

  return {
    classNames,
    dynamic: false,
    hasClassNames: classNames.length > 0,
    supported: classNames.length > 0 && classNames.every(isLikelyTailwindClass),
  };
}

export function findJsxElementAtPosition(sourceFile: SourceFile, line: number, column: number) {
  const candidates = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  return (
    candidates.find((candidate) => {
      const position = getLineAndColumn(sourceFile, candidate);

      return position.line === line && position.column === column;
    }) ?? null
  );
}

export function analyzeStyleAtPosition(
  filePath: string,
  line: number,
  column: number
): StyleAnalysisResult {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      jsx: JSX_EMIT_PRESERVE,
      target: SCRIPT_TARGET_ES2020,
    },
    skipAddingFilesFromTsConfig: true,
  });
  const sourceFile = project.addSourceFileAtPath(filePath);
  const jsxElement = findJsxElementAtPosition(sourceFile, line, column);

  if (!jsxElement) {
    return createUnknownAnalysis();
  }

  const classAnalysis = analyzeClassNames(jsxElement);
  const inlineAnalysis = analyzeInlineStyles(jsxElement);

  if (classAnalysis.dynamic || inlineAnalysis.dynamic) {
    return createUnknownAnalysis({
      classNames: classAnalysis.classNames,
      inlineStyles: inlineAnalysis.inlineStyles,
    });
  }

  if (classAnalysis.hasClassNames && !classAnalysis.supported) {
    return createUnknownAnalysis({
      classNames: classAnalysis.classNames,
      inlineStyles: inlineAnalysis.inlineStyles,
    });
  }

  if (classAnalysis.supported && inlineAnalysis.hasInlineStyle) {
    return {
      mode: 'mixed',
      classNames: classAnalysis.classNames,
      inlineStyles: inlineAnalysis.inlineStyles,
    };
  }

  if (classAnalysis.supported) {
    return {
      mode: 'tailwind',
      classNames: classAnalysis.classNames,
      inlineStyles: inlineAnalysis.inlineStyles,
    };
  }

  if (inlineAnalysis.hasInlineStyle) {
    return {
      mode: 'inline',
      classNames: classAnalysis.classNames,
      inlineStyles: inlineAnalysis.inlineStyles,
    };
  }

  return createUnknownAnalysis({
    classNames: classAnalysis.classNames,
    inlineStyles: inlineAnalysis.inlineStyles,
  });
}
