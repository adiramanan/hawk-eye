import { relative, resolve } from 'node:path';
import { transformSync, types as t } from '@babel/core';
import type { NodePath, PluginObj } from '@babel/core';

const SUPPORTED_SOURCE_PATTERN = /\.[jt]sx?$/;
const EXCLUDED_SEGMENTS = ['/node_modules/', '/dist/', '/build/', '/coverage/'];

function stripQuery(id: string) {
  return id.split('?')[0];
}

function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

function isIntrinsicElementName(
  name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName
) {
  if (!t.isJSXIdentifier(name)) {
    return false;
  }

  const firstCharacter = name.name.charAt(0);

  return firstCharacter === firstCharacter.toLowerCase();
}

function hasDataSourceAttribute(attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>) {
  return attributes.some(
    (attribute) =>
      t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name: 'data-source' })
  );
}

function toRootRelativePath(root: string, id: string) {
  const cleanId = normalizePath(stripQuery(id));
  const relativePath = normalizePath(relative(resolve(root), cleanId));

  if (!relativePath || relativePath.startsWith('../') || relativePath === '..') {
    return null;
  }

  return relativePath;
}

export function shouldTransformSource(id: string) {
  if (!id || id.startsWith('\0')) {
    return false;
  }

  const cleanId = normalizePath(stripQuery(id));

  if (!SUPPORTED_SOURCE_PATTERN.test(cleanId)) {
    return false;
  }

  return !EXCLUDED_SEGMENTS.some((segment) => cleanId.includes(segment));
}

export function injectSourceMetadata(code: string, id: string, root: string) {
  if (!shouldTransformSource(id)) {
    return null;
  }

  const relativePath = toRootRelativePath(root, id);

  if (!relativePath) {
    return null;
  }

  const result = transformSync(code, {
    ast: false,
    babelrc: false,
    code: true,
    configFile: false,
    filename: stripQuery(id),
    parserOpts: {
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
    },
    sourceMaps: true,
    plugins: [
      () =>
        ({
          name: 'hawk-eye-source-injector',
          visitor: {
            JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
              if (!isIntrinsicElementName(path.node.name)) {
                return;
              }

              if (hasDataSourceAttribute(path.node.attributes)) {
                return;
              }

              const start = path.node.loc?.start;

              if (!start) {
                return;
              }

              const sourceToken = `${relativePath}:${start.line}:${start.column + 1}`;

              path.node.attributes.push(
                t.jsxAttribute(t.jsxIdentifier('data-source'), t.stringLiteral(sourceToken))
              );
            },
          },
        }) satisfies PluginObj,
    ],
  });

  if (!result?.code) {
    return null;
  }

  return {
    code: result.code,
    map: result.map ?? null,
  };
}
