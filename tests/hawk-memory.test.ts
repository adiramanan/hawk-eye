import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = resolve(workspaceRoot, 'scripts/hawk-memory.mjs');
const readmePath = resolve(workspaceRoot, 'README.md');
const contributingPath = resolve(workspaceRoot, 'CONTRIBUTING.md');
const agentsPath = resolve(workspaceRoot, 'AGENTS.md');
const claudePath = resolve(workspaceRoot, 'CLAUDE.md');
const codexPath = resolve(workspaceRoot, 'CODEX.md');
const geminiPath = resolve(workspaceRoot, 'GEMINI.md');
const tempRoots: string[] = [];
const protocolFixturePaths = [
  'AGENTS.md',
  'CLAUDE.md',
  'CODEX.md',
  'GEMINI.md',
  '.memory/BLOCKERS.md',
  '.memory/CURRENT_CONTEXT.md',
  '.memory/DECISIONS.md',
  '.memory/MEMORY.md',
  '.memory/PATTERNS.md',
  '.memory/PHASE_STATUS.md',
  '.memory/PREFERENCES.md',
  '.memory/manifest.json',
  '.memory/receipts.jsonl',
  '.memory/templates/session.md',
  '.memory/templates/note.md',
];

function createTempRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), 'hawk-memory-test-'));
  const memoryHome = mkdtempSync(join(tmpdir(), 'hawk-memory-home-'));

  tempRoots.push(repoRoot, memoryHome);
  return {
    memoryHome,
    repoRoot,
  };
}

function writeRepoFile(repoRoot: string, relativePath: string, contents: string | Buffer) {
  const filePath = join(repoRoot, relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function copyRepoFile(repoRoot: string, relativePath: string) {
  const sourcePath = join(workspaceRoot, relativePath);
  const targetPath = join(repoRoot, relativePath);

  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

function seedProtocolRepo(repoRoot: string) {
  for (const relativePath of protocolFixturePaths) {
    copyRepoFile(repoRoot, relativePath);
  }

  for (const relativePath of ['.memory/sessions/.gitkeep', '.memory/notes/.gitkeep', '.memory/attachments/.gitkeep']) {
    copyRepoFile(repoRoot, relativePath);
  }
}

function runCli(repoRoot: string, memoryHome: string, args: string[]) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      HAWK_MEMORY_HOME: memoryHome,
    },
  });
}

function expectSuccess(result: ReturnType<typeof runCli>) {
  expect(result.status, [result.stdout, result.stderr].join('\n')).toBe(0);
}

function renderFrontmatterDocument(frontmatter: Record<string, unknown>, body: string) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }

  lines.push('---', '', body.trimEnd(), '');
  return lines.join('\n');
}

function parseFrontmatterDocument(content: string) {
  const lines = content.split('\n');

  expect(lines[0]).toBe('---');

  const endIndex = lines.indexOf('---', 1);
  const frontmatter: Record<string, unknown> = {};

  for (const line of lines.slice(1, endIndex)) {
    if (!line.trim()) {
      continue;
    }

    const separator = line.indexOf(':');
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    frontmatter[key] = JSON.parse(rawValue);
  }

  return {
    body: lines.slice(endIndex + 1).join('\n').replace(/^\n/, ''),
    frontmatter,
  };
}

function listSessionFiles(repoRoot: string) {
  return readdirSync(join(repoRoot, '.memory', 'sessions')).filter((fileName) => !fileName.startsWith('.'));
}

function listNoteFiles(repoRoot: string) {
  return readdirSync(join(repoRoot, '.memory', 'notes')).filter((fileName) => !fileName.startsWith('.'));
}

function readSession(repoRoot: string, fileName: string) {
  return parseFrontmatterDocument(readFileSync(join(repoRoot, '.memory', 'sessions', fileName), 'utf8'));
}

function readNote(repoRoot: string, fileName: string) {
  return parseFrontmatterDocument(readFileSync(join(repoRoot, '.memory', 'notes', fileName), 'utf8'));
}

function readReceipts(repoRoot: string) {
  return readFileSync(join(repoRoot, '.memory', 'receipts.jsonl'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function legacyProjectKey(repoRoot: string) {
  const canonicalRepoRoot = realpathSync(repoRoot);
  const slug = basename(canonicalRepoRoot)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  const hash = createHash('sha256').update(canonicalRepoRoot).digest('hex').slice(0, 12);
  return `${slug || 'project'}--${hash}`;
}

function legacyStoreRoot(repoRoot: string, memoryHome: string) {
  return join(memoryHome, 'projects', legacyProjectKey(repoRoot));
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();

    if (root) {
      rmSync(root, { force: true, recursive: true });
    }
  }
});

describe('hawk-memory repo-native protocol', () => {
  it('ships a static manifest and protocol layout with no bootstrap placeholders', () => {
    const manifestRaw = readFileSync(resolve(workspaceRoot, '.memory', 'manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw);

    expect(manifestRaw).not.toContain('<run-pnpm-memory:init>');
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.protocolVersion).toBe('repo-native-v1');
    expect(manifest.sessionDirectory).toBe('.memory/sessions');
    expect(manifest.notesDirectory).toBe('.memory/notes');
    expect(manifest.receiptLog).toBe('.memory/receipts.jsonl');
    expect(manifest.attachmentsDirectory).toBe('.memory/attachments');
    expect(manifest.bridgeFiles).toEqual(['AGENTS.md', 'CLAUDE.md', 'CODEX.md', 'GEMINI.md']);
    expect('projectKey' in manifest).toBe(false);
    expect('repoRoot' in manifest).toBe(false);
    expect('localStoreRoot' in manifest).toBe(false);

    for (const relativePath of [
      'AGENTS.md',
      'CLAUDE.md',
      'CODEX.md',
      'GEMINI.md',
      '.memory/BLOCKERS.md',
      '.memory/CURRENT_CONTEXT.md',
      '.memory/DECISIONS.md',
      '.memory/MEMORY.md',
      '.memory/PATTERNS.md',
      '.memory/PHASE_STATUS.md',
      '.memory/PREFERENCES.md',
      '.memory/manifest.json',
      '.memory/receipts.jsonl',
      '.memory/templates/session.md',
      '.memory/templates/note.md',
      '.memory/sessions',
      '.memory/notes',
      '.memory/attachments',
    ]) {
      expect(existsSync(resolve(workspaceRoot, relativePath))).toBe(true);
    }
  });

  it('supports the file-native session workflow without invoking the CLI', () => {
    const { repoRoot } = createTempRepo();
    seedProtocolRepo(repoRoot);

    const sessionFileName = '20260319T120000000Z--claude-code.md';
    const openReceipt = {
      event: 'open',
      sessionId: '20260319T120000000Z--claude-code',
      agent: 'Claude Code',
      timestamp: '2026-03-19T12:00:00.000Z',
      touchedFiles: [],
      memoryWrites: ['.memory/sessions/20260319T120000000Z--claude-code.md', '.memory/receipts.jsonl'],
      summary: 'Session opened.',
    };
    const closedReceipt = {
      event: 'closed',
      sessionId: '20260319T120000000Z--claude-code',
      agent: 'Claude Code',
      timestamp: '2026-03-19T12:30:00.000Z',
      touchedFiles: ['README.md', 'AGENTS.md'],
      memoryWrites: [
        '.memory/sessions/20260319T120000000Z--claude-code.md',
        '.memory/CURRENT_CONTEXT.md',
        '.memory/receipts.jsonl',
      ],
      summary: 'Closed repo-native workflow manually.',
    };

    writeRepoFile(
      repoRoot,
      '.memory/sessions/20260319T120000000Z--claude-code.md',
      renderFrontmatterDocument(
        {
          sessionId: '20260319T120000000Z--claude-code',
          agent: 'Claude Code',
          startedAt: '2026-03-19T12:00:00.000Z',
          endedAt: null,
          status: 'open',
          branch: 'main',
          goal: 'Stress test file-native sessions',
          touched: [],
        },
        [
          '## Context',
          '',
          '- Reviewed the canonical memory files.',
          '',
          '## Actions',
          '',
          '- Opened a session manually.',
          '',
          '## Decisions',
          '',
          '- Keep the protocol file-native.',
          '',
          '## Open Threads',
          '',
          '- None.',
          '',
          '## Summary',
          '',
          'Pending session close.',
        ].join('\n')
      )
    );
    writeRepoFile(repoRoot, '.memory/receipts.jsonl', `${JSON.stringify(openReceipt)}\n`);

    const openedSession = readSession(repoRoot, sessionFileName);
    expect(openedSession.frontmatter.status).toBe('open');
    expect(openedSession.frontmatter.goal).toBe('Stress test file-native sessions');

    writeRepoFile(
      repoRoot,
      '.memory/sessions/20260319T120000000Z--claude-code.md',
      renderFrontmatterDocument(
        {
          ...openedSession.frontmatter,
          endedAt: '2026-03-19T12:30:00.000Z',
          status: 'closed',
          touched: ['README.md', 'AGENTS.md'],
        },
        openedSession.body.replace('Pending session close.', 'Closed repo-native workflow manually.')
      )
    );
    writeRepoFile(
      repoRoot,
      '.memory/CURRENT_CONTEXT.md',
      `# Current Session Context

## Last Agent
- Claude Code

## Last Session
- 2026-03-19T12:30:00.000Z (20260319T120000000Z--claude-code)

## Current Status
- Closed repo-native workflow manually.

## Touched Areas
- README.md
- AGENTS.md
`
    );
    writeRepoFile(
      repoRoot,
      '.memory/receipts.jsonl',
      `${JSON.stringify(openReceipt)}\n${JSON.stringify(closedReceipt)}\n`
    );

    const closedSession = readSession(repoRoot, sessionFileName);
    expect(closedSession.frontmatter.status).toBe('closed');
    expect(closedSession.frontmatter.touched).toEqual(['README.md', 'AGENTS.md']);
    expect(closedSession.body).toContain('Closed repo-native workflow manually.');

    const receipts = readReceipts(repoRoot);
    expect(receipts).toHaveLength(2);
    expect(receipts[0].event).toBe('open');
    expect(receipts[1].event).toBe('closed');
    expect(readFileSync(join(repoRoot, '.memory', 'CURRENT_CONTEXT.md'), 'utf8')).toContain(
      'Closed repo-native workflow manually.'
    );
  });

  it('supports direct note files and attachment-backed capture without helper commands', () => {
    const { repoRoot } = createTempRepo();
    seedProtocolRepo(repoRoot);

    writeRepoFile(
      repoRoot,
      '.memory/notes/20260319T130000000Z--decision.md',
      renderFrontmatterDocument(
        {
          id: '20260319T130000000Z--decision',
          kind: 'decision',
          title: 'Keep memory file-native',
          createdAt: '2026-03-19T13:00:00.000Z',
          agent: 'Codex',
          tags: ['memory', 'protocol'],
          sourceType: 'manual',
          sourcePath: null,
          sessionId: '20260319T120000000Z--codex',
        },
        'Direct manual note.'
      )
    );
    writeRepoFile(repoRoot, '.memory/attachments/example.bin', Buffer.from([1, 2, 3, 4]));
    writeRepoFile(
      repoRoot,
      '.memory/notes/20260319T131500000Z--attachment.md',
      renderFrontmatterDocument(
        {
          id: '20260319T131500000Z--attachment',
          kind: 'reference',
          title: 'Capture a binary artifact',
          createdAt: '2026-03-19T13:15:00.000Z',
          agent: 'Claude Code',
          tags: ['artifact'],
          sourceType: 'file-binary',
          sourcePath: 'fixtures/example.bin',
          sessionId: '20260319T120000000Z--claude-code',
          attachmentPath: '.memory/attachments/example.bin',
        },
        'Binary artifact captured by directly adding an attachment-backed note.'
      )
    );

    const noteFiles = listNoteFiles(repoRoot);
    expect(noteFiles).toHaveLength(2);

    const manualNote = readNote(repoRoot, '20260319T130000000Z--decision.md');
    expect(manualNote.frontmatter.kind).toBe('decision');
    expect(manualNote.frontmatter.sourceType).toBe('manual');
    expect(manualNote.frontmatter.tags).toEqual(['memory', 'protocol']);

    const attachmentNote = readNote(repoRoot, '20260319T131500000Z--attachment.md');
    expect(attachmentNote.frontmatter.attachmentPath).toBe('.memory/attachments/example.bin');
    expect(readFileSync(join(repoRoot, '.memory', 'attachments', 'example.bin'))).toEqual(
      Buffer.from([1, 2, 3, 4])
    );
  });

  it('migrates legacy local-store sessions, notes, attachments, and receipts into `.memory/`', () => {
    const { repoRoot, memoryHome } = createTempRepo();
    seedProtocolRepo(repoRoot);

    const legacyRoot = legacyStoreRoot(repoRoot, memoryHome);

    mkdirSync(join(legacyRoot, 'attachments'), { recursive: true });
    mkdirSync(join(legacyRoot, 'notes'), { recursive: true });
    mkdirSync(join(legacyRoot, 'receipts'), { recursive: true });
    mkdirSync(join(legacyRoot, 'sessions'), { recursive: true });

    writeFileSync(join(legacyRoot, 'attachments', 'legacy.bin'), Buffer.from([9, 8, 7]));
    writeFileSync(
      join(legacyRoot, 'sessions', 'legacy-session.md'),
      renderFrontmatterDocument(
        {
          sessionId: 'legacy-session',
          agent: 'Codex',
          startedAt: '2026-03-19T14:00:00.000Z',
          endedAt: '2026-03-19T14:10:00.000Z',
          status: 'closed',
          branch: 'main',
          goal: 'Legacy helper session',
          touched: ['README.md'],
        },
        'Legacy session body.'
      ),
      'utf8'
    );
    writeFileSync(
      join(legacyRoot, 'notes', 'legacy-note.md'),
      renderFrontmatterDocument(
        {
          id: 'legacy-note',
          kind: 'reference',
          title: 'Legacy note',
          createdAt: '2026-03-19T14:05:00.000Z',
          agent: 'Codex',
          tags: ['legacy'],
          sourceType: 'file-binary',
          sourcePath: 'legacy/source.bin',
          sessionId: 'legacy-session',
          attachmentPath: 'attachments/legacy.bin',
        },
        'Legacy note body.'
      ),
      'utf8'
    );
    writeFileSync(
      join(legacyRoot, 'receipts', 'receipts.jsonl'),
      `${JSON.stringify({
        event: 'closed',
        sessionId: 'legacy-session',
        agent: 'Codex',
        timestamp: '2026-03-19T14:10:00.000Z',
        touchedFiles: ['README.md'],
        memoryWrites: ['legacy-session.md'],
        summary: 'Imported from the legacy helper store.',
      })}\n`,
      'utf8'
    );

    writeRepoFile(
      repoRoot,
      '.memory/notes/legacy-note.md',
      renderFrontmatterDocument(
        {
          id: 'repo-note',
          kind: 'decision',
          title: 'Repo-native note wins collisions',
          createdAt: '2026-03-19T14:06:00.000Z',
          agent: 'Codex',
          tags: ['repo'],
          sourceType: 'manual',
          sourcePath: null,
          sessionId: null,
        },
        'Keep the repo-native copy.'
      )
    );

    const migrate = runCli(repoRoot, memoryHome, ['migrate']);
    expectSuccess(migrate);
    expect(migrate.stdout).toContain('Imported legacy sessions: 1');
    expect(migrate.stdout).toContain('Skipped legacy note collisions: 1');
    expect(migrate.stdout).toContain('Imported legacy attachments: 1');
    expect(migrate.stdout).toContain('Imported legacy receipts: 1');

    const importedSessions = listSessionFiles(repoRoot);
    expect(importedSessions.some((fileName) => readSession(repoRoot, fileName).frontmatter.sessionId === 'legacy-session')).toBe(true);
    expect(readFileSync(join(repoRoot, '.memory', 'notes', 'legacy-note.md'), 'utf8')).toContain(
      'Keep the repo-native copy.'
    );
    expect(readFileSync(join(repoRoot, '.memory', 'attachments', 'legacy.bin'))).toEqual(Buffer.from([9, 8, 7]));
    expect(readReceipts(repoRoot).some((receipt) => receipt.sessionId === 'legacy-session')).toBe(true);
  });

  it('keeps helper commands optional by writing only to `.memory/` and not recreating the old local store', () => {
    const { repoRoot, memoryHome } = createTempRepo();
    seedProtocolRepo(repoRoot);

    const doctor = runCli(repoRoot, memoryHome, ['doctor']);
    expectSuccess(doctor);
    expect(doctor.stdout).toContain('hawk-memory doctor: OK');

    writeRepoFile(repoRoot, 'reference.txt', 'Reference body\n');
    writeRepoFile(repoRoot, 'asset.bin', Buffer.from([5, 4, 3]));

    expectSuccess(runCli(repoRoot, memoryHome, ['session:start', '--agent', 'Codex', '--goal', 'Helper smoke test']));
    expectSuccess(
      runCli(repoRoot, memoryHome, [
        'note',
        '--kind',
        'decision',
        '--title',
        'Helper note',
        '--body',
        'Compatibility helpers now target `.memory/` only.',
      ])
    );
    expectSuccess(runCli(repoRoot, memoryHome, ['file', 'reference.txt']));
    expectSuccess(runCli(repoRoot, memoryHome, ['file', 'asset.bin', '--title', 'Binary asset']));
    expectSuccess(
      runCli(repoRoot, memoryHome, [
        'session:end',
        '--summary',
        'Closed the helper-smoke session.',
        '--touched',
        'scripts/hawk-memory.mjs,README.md',
      ])
    );

    expect(listSessionFiles(repoRoot)).toHaveLength(1);
    expect(listNoteFiles(repoRoot)).toHaveLength(3);

    const session = readSession(repoRoot, listSessionFiles(repoRoot)[0]);
    expect(session.frontmatter.status).toBe('closed');

    const notes = listNoteFiles(repoRoot).map((fileName) => readNote(repoRoot, fileName));
    expect(notes.some((note) => note.frontmatter.title === 'Helper note')).toBe(true);
    expect(notes.some((note) => note.frontmatter.sourceType === 'file-text')).toBe(true);
    expect(notes.some((note) => note.frontmatter.sourceType === 'file-binary')).toBe(true);

    const attachments = readdirSync(join(repoRoot, '.memory', 'attachments')).filter((fileName) => !fileName.startsWith('.'));
    expect(attachments).toHaveLength(1);
    expect(existsSync(join(memoryHome, 'projects'))).toBe(false);
  });

  it('allows helper commands to read manually edited YAML-style session frontmatter', () => {
    const { repoRoot, memoryHome } = createTempRepo();
    seedProtocolRepo(repoRoot);
    writeRepoFile(repoRoot, '.memory/receipts.jsonl', '');

    writeRepoFile(
      repoRoot,
      '.memory/sessions/20260319T120000000Z--manual.md',
      [
        '---',
        'sessionId: "20260319T120000000Z--manual"',
        'agent: "Codex"',
        'startedAt: "2026-03-19T12:00:00.000Z"',
        'endedAt: "2026-03-19T12:15:00.000Z"',
        'status: "closed"',
        'branch: "dev"',
        'goal: "Manually edit the session file"',
        'touched:',
        '  - "README.md"',
        '  - "AGENTS.md"',
        '---',
        '',
        '## Context',
        '',
        '- Manual session file.',
        '',
        '## Actions',
        '',
        '- Closed directly in `.memory/sessions/`.',
        '',
        '## Decisions',
        '',
        '- None.',
        '',
        '## Open Threads',
        '',
        '- None.',
        '',
        '## Summary',
        '',
        'Closed manually.',
        '',
      ].join('\n')
    );

    const result = runCli(repoRoot, memoryHome, [
      'session:start',
      '--agent',
      'Claude Code',
      '--goal',
      'Open a follow-up session after a manual close.',
    ]);

    expectSuccess(result);
    expect(listSessionFiles(repoRoot)).toHaveLength(2);
    expect(readReceipts(repoRoot)).toHaveLength(1);
  });

  it('rejects starting a second session while an open session already exists', () => {
    const { repoRoot, memoryHome } = createTempRepo();
    seedProtocolRepo(repoRoot);

    writeRepoFile(
      repoRoot,
      '.memory/sessions/20260319T120000000Z--existing.md',
      renderFrontmatterDocument(
        {
          sessionId: '20260319T120000000Z--existing',
          agent: 'Codex',
          startedAt: '2026-03-19T12:00:00.000Z',
          endedAt: null,
          status: 'open',
          branch: 'dev',
          goal: 'Keep a session active',
          touched: [],
        },
        [
          '## Context',
          '',
          '- Existing open session.',
          '',
          '## Actions',
          '',
          '- Left open intentionally for the guard test.',
          '',
          '## Decisions',
          '',
          '- None.',
          '',
          '## Open Threads',
          '',
          '- None.',
          '',
          '## Summary',
          '',
          'Pending session close.',
        ].join('\n')
      )
    );

    const result = runCli(repoRoot, memoryHome, ['session:start', '--agent', 'Claude Code']);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'An open session already exists. Close it first or continue it directly in `.memory/sessions/`.'
    );
    expect(listSessionFiles(repoRoot)).toHaveLength(1);
  });

  it('rejects closing a session that is already closed', () => {
    const { repoRoot, memoryHome } = createTempRepo();
    seedProtocolRepo(repoRoot);
    writeRepoFile(repoRoot, '.memory/receipts.jsonl', '');

    writeRepoFile(
      repoRoot,
      '.memory/sessions/20260319T120000000Z--closed.md',
      renderFrontmatterDocument(
        {
          sessionId: '20260319T120000000Z--closed',
          agent: 'Codex',
          startedAt: '2026-03-19T12:00:00.000Z',
          endedAt: '2026-03-19T12:30:00.000Z',
          status: 'closed',
          branch: 'dev',
          goal: 'Already closed',
          touched: ['README.md'],
        },
        [
          '## Context',
          '',
          '- Closed session.',
          '',
          '## Actions',
          '',
          '- No-op.',
          '',
          '## Decisions',
          '',
          '- None.',
          '',
          '## Open Threads',
          '',
          '- None.',
          '',
          '## Summary',
          '',
          'Already closed.',
        ].join('\n')
      )
    );

    const result = runCli(repoRoot, memoryHome, [
      'session:end',
      '--session',
      '20260319T120000000Z--closed',
      '--summary',
      'Should not rewrite a closed session.',
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Session is already closed.');
    expect(readReceipts(repoRoot)).toHaveLength(0);

    const session = readSession(repoRoot, '20260319T120000000Z--closed.md');
    expect(session.frontmatter.endedAt).toBe('2026-03-19T12:30:00.000Z');
    expect(session.body).toContain('Already closed.');
  });

  it('documents bridge files and the file-native protocol as the primary workflow', () => {
    const readme = readFileSync(readmePath, 'utf8');
    const contributing = readFileSync(contributingPath, 'utf8');
    const agents = readFileSync(agentsPath, 'utf8');
    const claude = readFileSync(claudePath, 'utf8');
    const codex = readFileSync(codexPath, 'utf8');
    const gemini = readFileSync(geminiPath, 'utf8');

    expect(readme).toContain('No bootstrap command is required');
    expect(readme).toContain('pnpm memory:migrate');
    expect(readme).toContain('CLAUDE.md');
    expect(contributing).toContain('No bootstrap command is required');
    expect(contributing).toContain('.memory/sessions/');
    expect(contributing).toContain('pnpm memory:migrate');

    for (const bridge of [claude, codex, gemini]) {
      expect(bridge).toContain('Follow [AGENTS.md]');
      expect(bridge).toContain('.memory/');
    }

    expect(agents).toContain('No bootstrap command is required');
    expect(agents).toContain('.memory/sessions/');
    expect(agents).toContain('.memory/receipts.jsonl');
    expect(agents).toContain('Helper commands are optional');
  });
});
