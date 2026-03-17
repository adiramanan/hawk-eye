import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { analyzeStyleAtPosition } from '../packages/vite-plugin/src/style-analyzer';

const tempRoots: string[] = [];

function writeFixture(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'hawk-eye-style-analyzer-'));
  const filePath = join(root, 'Fixture.tsx');
  writeFileSync(filePath, source, 'utf8');
  tempRoots.push(root);

  return filePath;
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

describe('style analyzer', () => {
  const fixtureSource = `
    export function Fixture() {
      return (
        <section>
          <div className="px-4 py-2 bg-white text-gray-900 rounded-lg shadow-sm">Card</div>
          <button style={{ backgroundColor: '#112233', fontSize: 18 }}>Inline</button>
          <span className="p-4 text-sm" style={{ color: '#fff' }}>Mixed</span>
          <article className="w-full rounded-lg" style={{ '--hawk-eye-width-mode': 'relative', '--hawk-eye-height-mode': 'fill' }}>Metadata</article>
          <p className={getClassName()}>Dynamic class</p>
          <img className="card card--hero" />
        </section>
      );
    }
  `;

  it('detects tailwind, inline, mixed, and unknown strategies', () => {
    const filePath = writeFixture(fixtureSource);
    const divPosition = getLineAndColumn(fixtureSource, '<div');
    const buttonPosition = getLineAndColumn(fixtureSource, '<button');
    const spanPosition = getLineAndColumn(fixtureSource, '<span');
    const articlePosition = getLineAndColumn(fixtureSource, '<article');
    const dynamicPosition = getLineAndColumn(fixtureSource, '<p');
    const customPosition = getLineAndColumn(fixtureSource, '<img');

    expect(analyzeStyleAtPosition(filePath, divPosition.line, divPosition.column)).toEqual({
      mode: 'tailwind',
      classNames: ['px-4', 'py-2', 'bg-white', 'text-gray-900', 'rounded-lg', 'shadow-sm'],
      inlineStyles: {},
    });
    expect(analyzeStyleAtPosition(filePath, buttonPosition.line, buttonPosition.column)).toEqual({
      mode: 'inline',
      classNames: [],
      inlineStyles: {
        'background-color': '#112233',
        'font-size': '18',
      },
    });
    expect(analyzeStyleAtPosition(filePath, spanPosition.line, spanPosition.column)).toEqual({
      mode: 'mixed',
      classNames: ['p-4', 'text-sm'],
      inlineStyles: {
        color: '#fff',
      },
    });
    expect(analyzeStyleAtPosition(filePath, articlePosition.line, articlePosition.column)).toEqual({
      mode: 'tailwind',
      classNames: ['w-full', 'rounded-lg'],
      inlineStyles: {},
    });
    expect(analyzeStyleAtPosition(filePath, dynamicPosition.line, dynamicPosition.column)).toEqual({
      mode: 'unknown',
      classNames: [],
      inlineStyles: {},
    });
    expect(analyzeStyleAtPosition(filePath, customPosition.line, customPosition.column)).toEqual({
      mode: 'unknown',
      classNames: ['card', 'card--hero'],
      inlineStyles: {},
    });
  });
});
