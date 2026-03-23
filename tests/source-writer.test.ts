import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { getEditableCssProperty } from '../shared/property-map';
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

function createPropertyMutation(propertyId: string, oldValue: string, newValue: string) {
  const cssProperty = getEditableCssProperty(propertyId);

  if (!cssProperty) {
    throw new Error(`Missing editable CSS property mapping for ${propertyId}`);
  }

  return {
    propertyId,
    cssProperty,
    oldValue,
    newValue,
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
            createPropertyMutation('paddingTop', '0.5rem', '1rem'),
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('<button className="pt-4">Primary</button>');
    expect(nextSource).toContain('<button className="pt-4">Secondary</button>');
  });

  it('swaps matching Tailwind utilities and falls back to inline styles for unsupported ones', () => {
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

    const result = writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            createPropertyMutation('paddingTop', '1rem', '1.5rem'),
            createPropertyMutation('opacity', '1', '0.75'),
          ],
        },
      ],
    });
    const nextSource = readFixture(filePath);

    expect(result.modifiedFiles).toEqual(['src/App.tsx']);
    expect(result.warnings).toEqual([
      {
        code: 'unsupported-tailwind-property',
        file: 'src/App.tsx',
        line: position.line,
        column: position.column,
        propertyId: 'opacity',
        message:
          'Persisted opacity as inline styles because Tailwind class round-tripping is not supported for opacity.',
      },
    ]);
    expect(nextSource).toContain('className="pt-6 bg-white text-sm rounded-lg shadow-sm"');
    expect(nextSource).toContain('style={{ opacity: "0.75" }}');
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
            createPropertyMutation('fontSize', '16px', '20px'),
            createPropertyMutation('borderRadius', '0px', '0.5rem'),
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('fontSize: "20px"');
    expect(nextSource).toContain('borderRadius: "0.5rem"');
    expect(nextSource).toContain('backgroundColor: "#112233"');
  });

  it('persists fill edits by flattening background images inline', () => {
    const source = `
      export function App() {
        return (
          <div style={{ backgroundImage: "linear-gradient(red, blue)" }}>Inline</div>
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
          styleMode: 'inline',
          detached: false,
          properties: [
            createPropertyMutation('backgroundColor', 'transparent', '#112233'),
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('backgroundColor: "#112233"');
    expect(nextSource).toContain('backgroundImage: "none"');
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
            createPropertyMutation('fontSize', '0.875rem', '1.25rem'),
            createPropertyMutation('boxShadow', 'none', '0 4px 12px rgba(15,23,42,0.18)'),
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
            createPropertyMutation('paddingTop', '1rem', '1rem'),
            createPropertyMutation('backgroundColor', '#ffffff', '#ffffff'),
            createPropertyMutation('color', '#111827', '#111827'),
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
            createPropertyMutation('borderRadius', '0px', '0.5rem'),
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

  it('merges inline styles when className is dynamic and style is an object literal', () => {
    const source = `
      export function App() {
        return (
          <button className={getClassName()} style={{ ...styles, color: '#111827' }}>Dynamic</button>
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
            createPropertyMutation('borderRadius', '0px', '0.5rem'),
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
    expect(nextSource).toContain(`...styles`);
    expect(nextSource).toContain(`style={{ ...styles, color: '#111827'`);
    expect(nextSource).toContain(`borderRadius: "0.5rem"`);
  });

  it('wraps dynamic style expressions when className is dynamic and inline fallback is needed', () => {
    const source = `
      export function App() {
        return (
          <button className={getClassName()} style={styles}>Wrapped</button>
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
            createPropertyMutation('fontWeight', '600', '550'),
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
        propertyId: 'fontWeight',
        message:
          'Fell back to inline styles for fontWeight because className is dynamic.',
      },
    ]);
    expect(nextSource).toContain('className={getClassName()}');
    expect(nextSource).toContain('style={{ ...styles, fontWeight: "550" }}');
  });

  it('wraps call-expression style values before appending persisted inline properties', () => {
    const source = `
      export function App(props) {
        return (
          <button className={getClassName()} style={getStyles(props)}>Wrapped</button>
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
            createPropertyMutation('paddingTop', '1rem', '1.5rem'),
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
        propertyId: 'paddingTop',
        message:
          'Fell back to inline styles for paddingTop because className is dynamic.',
      },
    ]);
    expect(nextSource).toContain('className={getClassName()}');
    expect(nextSource).toContain('style={{ ...getStyles(props), paddingTop: "1.5rem" }}');
  });

  it('updates previously wrapped style expressions without re-wrapping them', () => {
    const source = `
      export function App() {
        return (
          <button className={getClassName()} style={styles}>Wrapped</button>
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
          styleMode: 'tailwind',
          detached: false,
          properties: [
            createPropertyMutation('borderRadius', '0px', '0.5rem'),
          ],
        },
      ],
    });

    writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            createPropertyMutation('borderRadius', '0.5rem', '1rem'),
          ],
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(nextSource).toContain('className={getClassName()}');
    expect(nextSource).toContain('borderRadius: "1rem"');
    expect(nextSource).not.toContain('borderRadius: "0.5rem"');
    expect(nextSource.match(/\.\.\.styles/g)?.length ?? 0).toBe(1);
  });

  it('persists size mode metadata as inline custom properties', () => {
    const source = `
      export function App() {
        return (
          <div className="w-full h-full">Metadata</div>
        );
      }
    `;
    const { filePath, root } = writeFixture(source);
    const position = getLineAndColumn(source, '<div');
    const result = writeSourceMutations(root, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [],
          sizeModeMetadata: {
            width: 'relative',
            height: 'fill',
          },
        },
      ],
    });

    const nextSource = readFixture(filePath);

    expect(result.warnings).toEqual([]);
    expect(nextSource).toContain('className="w-full h-full"');
    expect(nextSource).toContain('"--hawk-eye-width-mode": "relative"');
    expect(nextSource).toContain('"--hawk-eye-height-mode": "fill"');
  });
});
