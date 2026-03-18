import { relative, resolve } from 'node:path';
import { transformSync, types as t } from '@babel/core';
import type { NodePath, PluginObj } from '@babel/core';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../../../shared/protocol';
import type { HawkEyeServerState } from './plugin-state';
import { createSignedSourceToken } from './plugin-state';

const SUPPORTED_SOURCE_PATTERN = /\.(?:jsx|tsx)$/;
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

function shouldBailBeforeTransform(code: string) {
  return !code.includes('<');
}

export function injectSourceMetadata(
  code: string,
  id: string,
  root: string,
  state: HawkEyeServerState
) {
  if (!shouldTransformSource(id)) {
    return null;
  }

  if (shouldBailBeforeTransform(code)) {
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

              const start = path.node.loc?.start;

              if (!start) {
                return;
              }

              const sourceToken = createSignedSourceToken(
                state,
                relativePath,
                start.line,
                start.column + 1
              );
              const existingIndex = path.node.attributes.findIndex(
                (attribute) =>
                  t.isJSXAttribute(attribute) &&
                  t.isJSXIdentifier(attribute.name, { name: HAWK_EYE_SOURCE_ATTRIBUTE })
              );
              const nextAttribute = t.jsxAttribute(
                t.jsxIdentifier(HAWK_EYE_SOURCE_ATTRIBUTE),
                t.stringLiteral(sourceToken)
              );

              if (existingIndex === -1) {
                path.node.attributes.push(nextAttribute);
                return;
              }

              path.node.attributes[existingIndex] = nextAttribute;
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
