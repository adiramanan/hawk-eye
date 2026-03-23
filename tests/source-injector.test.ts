import { describe, expect, it } from 'vitest';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../shared/protocol';
import { createHawkEyeServerState } from '../packages/vite-plugin/src/plugin-state';
import { injectSourceMetadata } from '../packages/vite-plugin/src/source-injector';

const repoRoot = '/repo';
const serverState = createHawkEyeServerState();

describe('source injector', () => {
  it('injects signed Hawk-Eye source metadata into intrinsic JSX elements', () => {
    const code = `export function App() {\n  return <div><span /></div>;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/App.jsx', repoRoot, serverState);

    expect(result?.code).toMatch(
      new RegExp(`${HAWK_EYE_SOURCE_ATTRIBUTE}="src/App.jsx:2:10:[a-f0-9]{16}"`)
    );
    expect(result?.code).toMatch(
      new RegExp(`${HAWK_EYE_SOURCE_ATTRIBUTE}="src/App.jsx:2:15:[a-f0-9]{16}"`)
    );
  });

  it('does not inject Hawk-Eye source metadata into React components', () => {
    const code = `export function App() {\n  return <Card />;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/App.jsx', repoRoot, serverState);

    expect(result?.code).not.toContain(HAWK_EYE_SOURCE_ATTRIBUTE);
  });

  it('overwrites existing Hawk-Eye source metadata attributes', () => {
    const code = `export function App() {\n  return <div ${HAWK_EYE_SOURCE_ATTRIBUTE}="custom-token" />;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/App.jsx', repoRoot, serverState);

    expect(result?.code).not.toContain('custom-token');
    expect(result?.code).toMatch(
      new RegExp(`${HAWK_EYE_SOURCE_ATTRIBUTE}="src/App.jsx:2:10:[a-f0-9]{16}"`)
    );
    expect(result?.code?.match(new RegExp(`${HAWK_EYE_SOURCE_ATTRIBUTE}=`, 'g'))).toHaveLength(1);
  });

  it('generates file, line, and column tokens for TSX input', () => {
    const code = `type Props = { title: string };\nexport function Card(props: Props) {\n  return <section>{props.title}</section>;\n}\n`;
    const result = injectSourceMetadata(code, '/repo/src/Card.tsx', repoRoot, serverState);

    expect(result?.code).toMatch(
      new RegExp(`${HAWK_EYE_SOURCE_ATTRIBUTE}="src/Card.tsx:3:10:[a-f0-9]{16}"`)
    );
  });

  it('fails closed when Babel cannot parse the source', () => {
    const code = `export function App() {\n  return <div>\n}\n`;

    expect(injectSourceMetadata(code, '/repo/src/Broken.tsx', repoRoot, serverState)).toBeNull();
  });
});
