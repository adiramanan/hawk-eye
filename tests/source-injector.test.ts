import { describe, expect, it } from 'vitest';
import { injectSourceMetadata } from '../packages/vite-plugin/src/source-injector';

const repoRoot = '/repo';

describe('source injector', () => {
  it('injects data-source into intrinsic JSX elements', () => {
    const code = `export function App() {\n  return <div><span /></div>;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/App.jsx', repoRoot);

    expect(result?.code).toContain('data-source="src/App.jsx:2:10"');
    expect(result?.code).toContain('data-source="src/App.jsx:2:15"');
  });

  it('does not inject data-source into React components', () => {
    const code = `export function App() {\n  return <Card />;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/App.jsx', repoRoot);

    expect(result?.code).not.toContain('data-source=');
  });

  it('preserves existing data-source attributes', () => {
    const code = `export function App() {\n  return <div data-source="custom-token" />;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/App.jsx', repoRoot);

    expect(result?.code).toContain('data-source="custom-token"');
    expect(result?.code?.match(/data-source=/g)).toHaveLength(1);
  });

  it('generates file, line, and column tokens for TSX input', () => {
    const code = `type Props = { title: string };\nexport function Card(props: Props) {\n  return <section>{props.title}</section>;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/Card.tsx', repoRoot);

    expect(result?.code).toContain('data-source="src/Card.tsx:3:10"');
  });
});
