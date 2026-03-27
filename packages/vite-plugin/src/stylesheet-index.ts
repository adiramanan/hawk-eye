import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { AuthoredClassTarget } from '../../../shared/protocol';

export interface AuthoredClassTargetRecord extends AuthoredClassTarget {
  absoluteFile: string;
}

interface CachedClassTargetIndex {
  byClassName: Map<string, AuthoredClassTargetRecord>;
  byId: Map<string, AuthoredClassTargetRecord>;
  targets: AuthoredClassTargetRecord[];
}

const STYLE_FILE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', '.cache']);
const INDEX_CACHE = new Map<string, CachedClassTargetIndex>();

function normalizePath(value: string) {
  return value.replace(/\\/g, '/');
}

function getFileExtension(filePath: string) {
  const dotIndex = filePath.lastIndexOf('.');
  return dotIndex === -1 ? '' : filePath.slice(dotIndex).toLowerCase();
}

function shouldInspectFile(filePath: string) {
  return STYLE_FILE_EXTENSIONS.has(getFileExtension(filePath));
}

function createFingerprint(filePath: string, selector: string, bodyText: string) {
  return createHash('sha256')
    .update(`${filePath}:${selector}:${bodyText}`)
    .digest('hex')
    .slice(0, 16);
}

function getLineAndColumn(text: string, index: number) {
  const precedingText = text.slice(0, index);
  const lines = precedingText.split('\n');

  return {
    column: (lines.at(-1)?.length ?? 0) + 1,
    line: lines.length,
  };
}

function isIdentifierStart(char: string) {
  return /[A-Za-z_]/.test(char);
}

function isIdentifierChar(char: string) {
  return /[A-Za-z0-9_-]/.test(char);
}

function extractSimpleClassNames(selectorText: string) {
  const selectors = selectorText
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  const classNames: string[] = [];

  for (const selector of selectors) {
    const match = /^\.([A-Za-z_][A-Za-z0-9_-]*)$/.exec(selector);

    if (match?.[1]) {
      classNames.push(match[1]);
    }
  }

  return classNames;
}

function findMatchingBrace(text: string, openIndex: number) {
  let depth = 0;
  let mode: 'normal' | 'single' | 'double' | 'line-comment' | 'block-comment' = 'normal';

  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] ?? '';

    if (mode === 'line-comment') {
      if (char === '\n') {
        mode = 'normal';
      }
      continue;
    }

    if (mode === 'block-comment') {
      if (char === '*' && next === '/') {
        mode = 'normal';
        index += 1;
      }
      continue;
    }

    if (mode === 'single') {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === "'") {
        mode = 'normal';
      }
      continue;
    }

    if (mode === 'double') {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === '"') {
        mode = 'normal';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      mode = 'line-comment';
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      mode = 'block-comment';
      index += 1;
      continue;
    }

    if (char === "'") {
      mode = 'single';
      continue;
    }

    if (char === '"') {
      mode = 'double';
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return null;
}

function parseStyleBlocks(
  text: string,
  start: number,
  end: number,
  onRule: (selectorText: string, selectorStart: number, bodyStart: number, bodyEnd: number) => void
) {
  let index = start;
  let mode: 'normal' | 'single' | 'double' | 'line-comment' | 'block-comment' = 'normal';

  while (index < end) {
    const char = text[index];
    const next = text[index + 1] ?? '';

    if (mode === 'line-comment') {
      if (char === '\n') {
        mode = 'normal';
      }
      index += 1;
      continue;
    }

    if (mode === 'block-comment') {
      if (char === '*' && next === '/') {
        mode = 'normal';
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (mode === 'single') {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === "'") {
        mode = 'normal';
      }
      index += 1;
      continue;
    }

    if (mode === 'double') {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === '"') {
        mode = 'normal';
      }
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      mode = 'line-comment';
      index += 2;
      continue;
    }

    if (char === '/' && next === '*') {
      mode = 'block-comment';
      index += 2;
      continue;
    }

    if (char === "'") {
      mode = 'single';
      index += 1;
      continue;
    }

    if (char === '"') {
      mode = 'double';
      index += 1;
      continue;
    }

    if (char === '{') {
      const selectorEnd = index;
      const selectorStart = (() => {
        let cursor = index - 1;

        while (cursor >= start) {
          const current = text[cursor];
          if (current === '}' || current === ';') {
            return cursor + 1;
          }
          cursor -= 1;
        }

        return start;
      })();
      const selectorText = text.slice(selectorStart, selectorEnd).trim();
      const bodyEnd = findMatchingBrace(text, index);

      if (bodyEnd == null) {
        return;
      }

      onRule(selectorText, selectorStart, index + 1, bodyEnd);

      if (selectorText.startsWith('@')) {
        parseStyleBlocks(text, index + 1, bodyEnd, onRule);
      } else {
        parseStyleBlocks(text, index + 1, bodyEnd, onRule);
      }

      index = bodyEnd + 1;
      continue;
    }

    index += 1;
  }
}

function splitTopLevelDeclarations(bodyText: string) {
  const declarations: Array<{ end: number; start: number; text: string }> = [];
  let segmentStart = 0;
  let mode: 'normal' | 'single' | 'double' | 'line-comment' | 'block-comment' = 'normal';
  let braceDepth = 0;

  for (let index = 0; index < bodyText.length; index += 1) {
    const char = bodyText[index];
    const next = bodyText[index + 1] ?? '';

    if (mode === 'line-comment') {
      if (char === '\n') {
        mode = 'normal';
      }
      continue;
    }

    if (mode === 'block-comment') {
      if (char === '*' && next === '/') {
        mode = 'normal';
        index += 1;
      }
      continue;
    }

    if (mode === 'single') {
      if (char === '\\') {
        index += 1;
      } else if (char === "'") {
        mode = 'normal';
      }
      continue;
    }

    if (mode === 'double') {
      if (char === '\\') {
        index += 1;
      } else if (char === '"') {
        mode = 'normal';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      mode = 'line-comment';
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      mode = 'block-comment';
      index += 1;
      continue;
    }

    if (char === "'") {
      mode = 'single';
      continue;
    }

    if (char === '"') {
      mode = 'double';
      continue;
    }

    if (char === '{') {
      braceDepth += 1;
      continue;
    }

    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (char === ';' && braceDepth === 0) {
      const segment = bodyText.slice(segmentStart, index + 1);
      declarations.push({
        end: index + 1,
        start: segmentStart,
        text: segment,
      });
      segmentStart = index + 1;
    }
  }

  if (segmentStart < bodyText.length) {
    declarations.push({
      end: bodyText.length,
      start: segmentStart,
      text: bodyText.slice(segmentStart),
    });
  }

  return declarations;
}

function getDeclarationIndentation(bodyText: string) {
  const lines = bodyText.split('\n');

  for (const line of lines) {
    if (line.trim()) {
      const indentMatch = /^(\s+)/.exec(line);
      return indentMatch?.[1] ?? '  ';
    }
  }

  return '  ';
}

function updateDeclarationValue(bodyText: string, propertyName: string, nextValue: string) {
  const declarations = splitTopLevelDeclarations(bodyText);

  for (const declaration of declarations) {
    const match = /^\s*([-\w]+)\s*:\s*([\s\S]*?)\s*;?\s*$/.exec(declaration.text);

    if (!match?.[1] || !match[2]) {
      continue;
    }

    if (match[1] !== propertyName) {
      continue;
    }

    const valueStart = declaration.start + declaration.text.indexOf(match[2]);
    const valueEnd = valueStart + match[2].length;

    return {
      nextBodyText:
        bodyText.slice(0, valueStart) + nextValue + bodyText.slice(valueEnd),
      updated: true,
    };
  }

  const indent = getDeclarationIndentation(bodyText);
  const trimmedBody = bodyText.trimEnd();
  const needsLeadingNewline = trimmedBody.length > 0 && !trimmedBody.endsWith('\n');
  const suffix = `${needsLeadingNewline ? '\n' : ''}${indent}${propertyName}: ${nextValue};\n`;

  return {
    nextBodyText: `${bodyText}${suffix}`,
    updated: false,
  };
}

function createTargetRecord(
  root: string,
  absoluteFile: string,
  relativeFile: string,
  selector: string,
  className: string,
  selectorStart: number,
  bodyText: string
): AuthoredClassTargetRecord {
  const location = getLineAndColumn(readFileSync(absoluteFile, 'utf8'), selectorStart);
  const fingerprint = createFingerprint(absoluteFile, selector, bodyText);

  return {
    absoluteFile,
    className,
    file: normalizePath(relativeFile),
    fingerprint,
    id: `${normalizePath(relativeFile)}::${className}`,
    label: `.${className}`,
    line: location.line,
    column: location.column,
    selector,
  };
}

function collectTargetsFromFile(
  root: string,
  absoluteFile: string,
  relativeFile: string
): AuthoredClassTargetRecord[] {
  const text = readFileSync(absoluteFile, 'utf8');
  const targets: AuthoredClassTargetRecord[] = [];

  parseStyleBlocks(text, 0, text.length, (selectorText, selectorStart, bodyStart, bodyEnd) => {
    const classNames = extractSimpleClassNames(selectorText);

    if (classNames.length === 0) {
      return;
    }

    const bodyText = text.slice(bodyStart, bodyEnd);

    for (const className of classNames) {
      targets.push(
        createTargetRecord(root, absoluteFile, relativeFile, selectorText, className, selectorStart, bodyText)
      );
    }
  });

  return targets;
}

function walkStyleFiles(root: string, currentDir: string, results: string[]) {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolutePath = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      walkStyleFiles(root, absolutePath, results);
      continue;
    }

    if (entry.isFile() && shouldInspectFile(entry.name)) {
      results.push(absolutePath);
    }
  }
}

function buildClassTargetIndex(root: string): CachedClassTargetIndex {
  const files: string[] = [];
  walkStyleFiles(root, root, files);
  const byClassName = new Map<string, AuthoredClassTargetRecord>();
  const byId = new Map<string, AuthoredClassTargetRecord>();
  const targets: AuthoredClassTargetRecord[] = [];

  for (const absoluteFile of files) {
    const relativeFile = normalizePath(relative(root, absoluteFile));
    const fileTargets = collectTargetsFromFile(root, absoluteFile, relativeFile);

    for (const target of fileTargets) {
      if (byId.has(target.id)) {
        continue;
      }

      byId.set(target.id, target);
      if (!byClassName.has(target.className)) {
        byClassName.set(target.className, target);
      }
      targets.push(target);
    }
  }

  return {
    byClassName,
    byId,
    targets,
  };
}

function getCachedIndex(root: string) {
  const existing = INDEX_CACHE.get(root);

  if (existing) {
    return existing;
  }

  const built = buildClassTargetIndex(root);
  INDEX_CACHE.set(root, built);
  return built;
}

export function invalidateAuthoredClassTargetIndex(root?: string) {
  if (root) {
    INDEX_CACHE.delete(root);
    return;
  }

  INDEX_CACHE.clear();
}

export function getAuthoredClassTargets(root: string) {
  return getCachedIndex(root).targets.map((target) => ({
    className: target.className,
    column: target.column,
    file: target.file,
    fingerprint: target.fingerprint,
    id: target.id,
    label: target.label,
    line: target.line,
    selector: target.selector,
  }));
}

export function resolveAuthoredClassTargetById(root: string, id: string) {
  const target = getCachedIndex(root).byId.get(id);

  if (!target) {
    return null;
  }

  return {
    className: target.className,
    column: target.column,
    file: target.file,
    fingerprint: target.fingerprint,
    id: target.id,
    label: target.label,
    line: target.line,
    selector: target.selector,
  };
}

export function getAuthoredClassTargetsForClassNames(root: string, classNames: string[]) {
  const index = getCachedIndex(root);
  const seen = new Set<string>();
  const targets = [];

  for (const className of classNames) {
    if (seen.has(className)) {
      continue;
    }

    seen.add(className);
    const target = index.byClassName.get(className);

    if (target) {
      targets.push({
        className: target.className,
        column: target.column,
        file: target.file,
        fingerprint: target.fingerprint,
        id: target.id,
        label: target.label,
        line: target.line,
        selector: target.selector,
      });
    }
  }

  return targets;
}

export function updateAuthoredClassTargetDeclaration(
  root: string,
  targetId: string,
  propertyName: string,
  nextValue: string
) {
  const index = getCachedIndex(root);
  const target = index.byId.get(targetId);

  if (!target) {
    return null;
  }

  const text = readFileSync(target.absoluteFile, 'utf8');
  const selectorStart = text.indexOf(target.selector);

  if (selectorStart === -1) {
    return null;
  }

  const selectorOpenIndex = text.indexOf('{', selectorStart);

  if (selectorOpenIndex === -1) {
    return null;
  }

  const selectorEndIndex = findMatchingBrace(text, selectorOpenIndex);

  if (selectorEndIndex == null) {
    return null;
  }

  const bodyText = text.slice(selectorOpenIndex + 1, selectorEndIndex);
  const updated = updateDeclarationValue(bodyText, propertyName, nextValue);
  const nextText =
    text.slice(0, selectorOpenIndex + 1) +
    updated.nextBodyText +
    text.slice(selectorEndIndex);

  return {
    absoluteFile: target.absoluteFile,
    file: target.file,
    nextText,
    updated: updated.updated,
  };
}

export function updateAuthoredClassTargetDeclarationText(
  target: AuthoredClassTargetRecord,
  text: string,
  propertyName: string,
  nextValue: string
) {
  const selectorStart = text.indexOf(target.selector);

  if (selectorStart === -1) {
    return null;
  }

  const selectorOpenIndex = text.indexOf('{', selectorStart);

  if (selectorOpenIndex === -1) {
    return null;
  }

  const selectorEndIndex = findMatchingBrace(text, selectorOpenIndex);

  if (selectorEndIndex == null) {
    return null;
  }

  const bodyText = text.slice(selectorOpenIndex + 1, selectorEndIndex);
  const updated = updateDeclarationValue(bodyText, propertyName, nextValue);

  return {
    nextText:
      text.slice(0, selectorOpenIndex + 1) +
      updated.nextBodyText +
      text.slice(selectorEndIndex),
    updated: updated.updated,
  };
}
