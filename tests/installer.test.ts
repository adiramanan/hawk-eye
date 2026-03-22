import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runInstaller } from '../packages/hawk-eye/src/installer';

const tempDirs: string[] = [];

function createTempProject() {
  const cwd = mkdtempSync(join(tmpdir(), 'hawk-eye-installer-'));
  tempDirs.push(cwd);
  return cwd;
}

function writeProjectFile(cwd: string, relativePath: string, contents: string) {
  const filePath = join(cwd, relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents, 'utf8');
}

function readProjectFile(cwd: string, relativePath: string) {
  return readFileSync(join(cwd, relativePath), 'utf8');
}

function createLogger() {
  const lines: string[] = [];

  return {
    error(message: string) {
      lines.push(`error:${message}`);
    },
    lines,
    log(message: string) {
      lines.push(`log:${message}`);
    },
  };
}

afterEach(() => {
  for (const tempDir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(tempDir, { force: true, recursive: true });
  }
});

describe('hawk-eye installer', () => {
  it('patches a standard React + Vite TypeScript app', () => {
    const cwd = createTempProject();
    const logger = createLogger();

    writeProjectFile(
      cwd,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            react: '^18.3.0',
            'react-dom': '^18.3.0',
          },
          devDependencies: {
            vite: '^5.4.0',
          },
        },
        null,
        2
      )
    );
    writeProjectFile(
      cwd,
      'vite.config.ts',
      `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`
    );
    writeProjectFile(
      cwd,
      'src/main.tsx',
      `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    );

    const result = runInstaller({ cwd, logger });
    const viteConfig = readProjectFile(cwd, 'vite.config.ts');
    const entry = readProjectFile(cwd, 'src/main.tsx');

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    expect(viteConfig).toContain(`import hawkeyePlugin from 'hawk-eye/vite';`);
    expect(viteConfig).toContain('plugins: [react(), hawkeyePlugin()]');
    expect(entry).toContain(`import { DesignTool } from 'hawk-eye';`);
    expect(entry).toContain('{import.meta.env.DEV ? <DesignTool /> : null}');
    expect(entry).toContain('<React.StrictMode>');
  });

  it('patches a standard React + Vite JavaScript app', () => {
    const cwd = createTempProject();
    const logger = createLogger();

    writeProjectFile(
      cwd,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            react: '^18.3.0',
            'react-dom': '^18.3.0',
            vite: '^5.4.0',
          },
        },
        null,
        2
      )
    );
    writeProjectFile(
      cwd,
      'vite.config.js',
      `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
}));
`
    );
    writeProjectFile(
      cwd,
      'src/main.jsx',
      `import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));

root.render(<App />);
`
    );

    const result = runInstaller({ cwd, logger });
    const viteConfig = readProjectFile(cwd, 'vite.config.js');
    const entry = readProjectFile(cwd, 'src/main.jsx');

    expect(result.success).toBe(true);
    expect(viteConfig).toContain(`import hawkeyePlugin from 'hawk-eye/vite';`);
    expect(viteConfig).toContain('plugins: [react(), hawkeyePlugin()]');
    expect(entry).toContain(`import { DesignTool } from 'hawk-eye';`);
    expect(entry).toContain('<>');
    expect(entry).toContain('{import.meta.env.DEV ? <DesignTool /> : null}');
  });

  it('is idempotent when run more than once', () => {
    const cwd = createTempProject();
    const logger = createLogger();

    writeProjectFile(
      cwd,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            react: '^18.3.0',
            'react-dom': '^18.3.0',
            vite: '^5.4.0',
          },
        },
        null,
        2
      )
    );
    writeProjectFile(
      cwd,
      'vite.config.ts',
      `import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
});
`
    );
    writeProjectFile(
      cwd,
      'src/main.tsx',
      `import App from './App';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(<App />);
`
    );

    const firstRun = runInstaller({ cwd, logger });
    const firstVite = readProjectFile(cwd, 'vite.config.ts');
    const firstEntry = readProjectFile(cwd, 'src/main.tsx');
    const secondRun = runInstaller({ cwd, logger });
    const secondVite = readProjectFile(cwd, 'vite.config.ts');
    const secondEntry = readProjectFile(cwd, 'src/main.tsx');

    expect(firstRun.success).toBe(true);
    expect(secondRun.success).toBe(true);
    expect(secondRun.changed).toBe(false);
    expect(firstVite).toBe(secondVite);
    expect(firstEntry).toBe(secondEntry);
    expect((secondVite.match(/hawkeyePlugin\(\)/g) ?? [])).toHaveLength(1);
    expect((secondEntry.match(/<DesignTool/g) ?? [])).toHaveLength(1);
  });

  it('preserves existing plugin config and React root structure', () => {
    const cwd = createTempProject();
    const logger = createLogger();

    writeProjectFile(
      cwd,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            react: '^18.3.0',
            'react-dom': '^18.3.0',
          },
          devDependencies: {
            vite: '^5.4.0',
          },
        },
        null,
        2
      )
    );
    writeProjectFile(
      cwd,
      'vite.config.ts',
      `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ command }) => {
  const extra = command === 'serve' ? [react(), legacy()] : [react()];

  return {
    plugins: extra,
  };
});
`
    );
    writeProjectFile(
      cwd,
      'src/main.tsx',
      `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const tree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

createRoot(document.getElementById('root')!).render(tree);
`
    );

    const result = runInstaller({ cwd, logger });

    expect(result.success).toBe(false);
    expect(logger.lines.join('\n')).toContain('Could not find or create a literal plugins array');
  });

  it('prints a manual fallback when the project is unsupported', () => {
    const cwd = createTempProject();
    const logger = createLogger();

    writeProjectFile(
      cwd,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            vue: '^3.5.0',
          },
        },
        null,
        2
      )
    );

    const result = runInstaller({ cwd, logger });

    expect(result.success).toBe(false);
    expect(result.changed).toBe(false);
    expect(logger.lines.join('\n')).toContain('Manual fallback:');
    expect(logger.lines.join('\n')).toContain(`import hawkeyePlugin from 'hawk-eye/vite'`);
  });
});
