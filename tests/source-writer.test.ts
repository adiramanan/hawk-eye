import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import type { SavePayload } from '../packages/vite-plugin/src/mutations';
import { writeSourceMutations } from '../packages/vite-plugin/src/source-writer';

const tempRoots: string[] = [];

function writeFixture(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'hawk-eye-source-writer-'));
  const srcDir = join(root, 'src');
  const filePath = join(srcDir, 'App.tsx');

  mkdirSync(srcDir, { recursive: true });
  writeFileSync(filePath, source, 'utf8');
  tempRoots.push(root);

  return {
    filePath,
    root,
  };
}

function readFixture(filePath: string) {
  return readFileSync(filePath, 'utf8');
}

function getLineAndColumn(source: string, search: string) {
  const index = source.indexOf(search);

  if (index === -1) {
    throw new Error(`Could not find search token: ${search}`);
  }

  const precedingText = source.slice(0, index);
  const lines = precedingText.split('\n');

  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();

    if (root) {
      rmSync(root, { force: true, recursive: true });
    }
  }
});

describe('source writer', () => {
  it('targets the JSX element that matches the injected 1-indexed source coordinates', () => {
    const source = `
      export function App() {
        return (
          <section>
            <button className="pt-4">Primary</button>
            <button className="pt-2">Secondary</button>
          </section>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const secondButtonPosition = getLineAndColumn(source, '<button className="pt-2">');

    writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: secondButtonPosition.line,
          column: secondButtonPosition.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            {
              propertyId: 'paddingTop',
              cssProperty: 'padding-top',
              oldValue: '0.5rem',
              newValue: '1rem',
            },
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('<button className="pt-4">Primary</button>');
    expect(nextSource).toContain('<button className="pt-4">Secondary</button>');
  });

  it('swaps matching Tailwind utilities and falls back to inline styles for missing ones', () => {
    const source = `
      export function App() {
        return (
          <main>
            <button className="pt-4 bg-white text-sm rounded-lg shadow-sm">Save</button>
          </main>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const position = getLineAndColumn(source, '<button');
    const payload: SavePayload = {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            {
              propertyId: 'paddingTop',
              cssProperty: 'padding-top',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
            {
              propertyId: 'marginLeft',
              cssProperty: 'margin-left',
              oldValue: '0px',
              newValue: 'auto',
            },
          ],
        },
      ],
    };

    const result = writeSourceMutations(root, payload);
    const nextSource = readFixture(filePath);

    expect(result.modifiedFiles).toEqual(['src/App.tsx']);
    expect(result.warnings).toEqual([]);
    expect(nextSource).toContain('className="pt-6 bg-white text-sm rounded-lg shadow-sm"');
    expect(nextSource).toContain('style={{ marginLeft: "auto" }}');
  });

  it('updates and creates inline style properties in object literals', () => {
    const source = `
      export function App() {
        return (
          <button style={{ backgroundColor: "#112233", fontSize: "16px" }}>Inline</button>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const position = getLineAndColumn(source, '<button');

    writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'inline',
          detached: false,
          properties: [
            {
              propertyId: 'fontSize',
              cssProperty: 'font-size',
              oldValue: '16px',
              newValue: '20px',
            },
            {
              propertyId: 'borderRadius',
              cssProperty: 'border-radius',
              oldValue: '0px',
              newValue: '0.5rem',
            },
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('fontSize: "20px"');
    expect(nextSource).toContain('borderRadius: "0.5rem"');
    expect(nextSource).toContain('backgroundColor: "#112233"');
  });

  it('keeps mixed-mode class swaps in className and writes the rest inline', () => {
    const source = `
      export function App() {
        return (
          <span className="text-sm text-gray-900" style={{ color: "#ffffff" }}>Mixed</span>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const position = getLineAndColumn(source, '<span');

    writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'mixed',
          detached: false,
          properties: [
            {
              propertyId: 'fontSize',
              cssProperty: 'font-size',
              oldValue: '0.875rem',
              newValue: '1.25rem',
            },
            {
              propertyId: 'boxShadow',
              cssProperty: 'box-shadow',
              oldValue: 'none',
              newValue: '0 4px 12px rgba(15,23,42,0.18)',
            },
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('className="text-xl text-gray-900"');
    expect(nextSource).toContain('boxShadow: "0 4px 12px rgba(15,23,42,0.18)"');
    expect(nextSource).toContain('color: "#ffffff"');
  });

  it('removes className entirely in detached mode and writes focused properties inline', () => {
    const source = `
      export function App() {
        return (
          <div className="pt-4 bg-white text-gray-900 rounded-lg shadow-sm">Detached</div>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const position = getLineAndColumn(source, '<div');

    writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'detached',
          detached: true,
          properties: [
            {
              propertyId: 'paddingTop',
              cssProperty: 'padding-top',
              oldValue: '1rem',
              newValue: '1rem',
            },
            {
              propertyId: 'backgroundColor',
              cssProperty: 'background-color',
              oldValue: '#ffffff',
              newValue: '#ffffff',
            },
            {
              propertyId: 'color',
              cssProperty: 'color',
              oldValue: '#111827',
              newValue: '#111827',
            },
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).not.toContain('className=');
    expect(nextSource).toContain(
      'style={{ paddingTop: "1rem", backgroundColor: "#ffffff", color: "#111827" }}'
    );
  });

  it('warns and falls back to inline styles when className is dynamic', () => {
    const source = `
      export function App() {
        return (
          <button className={getClassName()}>Dynamic</button>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const position = getLineAndColumn(source, '<button');
    const result = writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            {
              propertyId: 'borderRadius',
              cssProperty: 'border-radius',
              oldValue: '0px',
              newValue: '0.5rem',
            },
          ],
        },
      ],
    });
    const nextSource = readFixture(filePath);

    expect(result.warnings).toEqual([
      {
        code: 'unsupported-dynamic-class',
        file: 'src/App.tsx',
        line: position.line,
        column: position.column,
        propertyId: 'borderRadius',
        message:
          'Fell back to inline styles for borderRadius because className is dynamic.',
      },
    ]);
    expect(nextSource).toContain('className={getClassName()}');
    expect(nextSource).toContain('style={{ borderRadius: "0.5rem" }}');
  });

  it('warns when inline fallback is blocked by a dynamic style expression', () => {
    const source = `
      export function App() {
        return (
          <button className="font-semibold" style={styles}>Blocked</button>
        );
      }
    `;
    const { root } = writeFixture(source);
    const position = getLineAndColumn(source, '<button');
    const result = writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            {
              propertyId: 'fontWeight',
              cssProperty: 'font-weight',
              oldValue: '600',
              newValue: '550',
            },
          ],
        },
      ],
    });

    expect(result.warnings).toEqual([
      {
        code: 'inline-fallback',
        file: 'src/App.tsx',
        line: position.line,
        column: position.column,
        propertyId: 'fontWeight',
        message:
          'Fell back to inline styles for fontWeight because no Tailwind class could represent 550.',
      },
      {
        code: 'unsupported-dynamic-style',
        file: 'src/App.tsx',
        line: position.line,
        column: position.column,
        propertyId: 'fontWeight',
        message: 'Skipped fontWeight because the style prop is not an object literal.',
      },
    ]);
  });
});
