#!/usr/bin/env node

import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';

const SCHEMA_VERSION = 1;
const PROTOCOL_VERSION = 'repo-native-v1';
const MEMORY_DIR = '.memory';
const LEGACY_DIR = '.agents';
const RUNTIME_ONLY_MANIFEST_FIELDS = ['projectKey', 'repoRoot', 'localStoreRoot'];
const RECEIPTS_FILE = 'receipts.jsonl';
const CURRENT_CONTEXT_FILE = 'CURRENT_CONTEXT.md';
const BRIDGE_FILES = ['AGENTS.md', 'CLAUDE.md', 'CODEX.md', 'GEMINI.md'];
const CANONICAL_FILE_MAP = {
  blockers: `${MEMORY_DIR}/BLOCKERS.md`,
  currentContext: `${MEMORY_DIR}/CURRENT_CONTEXT.md`,
  decisions: `${MEMORY_DIR}/DECISIONS.md`,
  memory: `${MEMORY_DIR}/MEMORY.md`,
  patterns: `${MEMORY_DIR}/PATTERNS.md`,
  phaseStatus: `${MEMORY_DIR}/PHASE_STATUS.md`,
  preferences: `${MEMORY_DIR}/PREFERENCES.md`,
};
const PROTOCOL_MANIFEST = {
  schemaVersion: SCHEMA_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  canonicalFiles: CANONICAL_FILE_MAP,
  sessionDirectory: `${MEMORY_DIR}/sessions`,
  notesDirectory: `${MEMORY_DIR}/notes`,
  receiptLog: `${MEMORY_DIR}/${RECEIPTS_FILE}`,
  attachmentsDirectory: `${MEMORY_DIR}/attachments`,
  legacySources: [
    '.agents/',
    'legacy-cli-store (derived from repo realpath and HAWK_MEMORY_HOME or ~/.hawk-eye/projects)',
  ],
  bridgeFiles: BRIDGE_FILES,
};
const LEGACY_IMPORTS = {
  'BLOCKERS.md': 'BLOCKERS.md',
  'CURRENT_CONTEXT.md': 'CURRENT_CONTEXT.md',
  'DECISIONS.md': 'DECISIONS.md',
  'MEMORY.md': 'MEMORY.md',
  'PHASE_STATUS.md': 'PHASE_STATUS.md',
};
const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yml',
  '.yaml',
]);
const DEFAULT_CANONICAL_FILES = {
  'BLOCKERS.md': `# Blockers

## Current Blockers
- None recorded.

## Known Limitations
- Record durable limitations or migration caveats here.
`,
  'CURRENT_CONTEXT.md': `# Current Session Context

## Last Agent
- No repo-native session has been closed yet.

## Current Status
- The canonical memory protocol is file-native under \`.memory/\`.

## Next Steps
- Create or continue a session file in \`.memory/sessions/\`.

## Touched Areas
- None recorded.
`,
  'DECISIONS.md': `# Memory Decisions

## D1: Repo-Native Protocol
- Canonical shared memory lives entirely in \`.memory/\`.
`,
  'MEMORY.md': `# Hawk-Eye Shared Memory

## Memory Protocol
- The shared project memory is file-native and lives under \`.memory/\`.
`,
  'PATTERNS.md': `# Patterns

## Repo Memory Patterns
- Create or continue one session file per workstream in \`.memory/sessions/\`.
`,
  'PHASE_STATUS.md': `# Phase Status

## Memory Track
- Repo-native, command-independent memory protocol.
`,
  'PREFERENCES.md': `# Preferences

## Memory Workflow
- \`.memory/\` is canonical and helper commands are optional.
`,
};
const SESSION_TEMPLATE = `---
sessionId: "20260319T120000000Z--agent"
agent: "Agent Name"
startedAt: "2026-03-19T12:00:00.000Z"
endedAt: null
status: "open"
branch: null
goal: ""
touched: []
---

## Context

- Capture the repo state, branch, and memory you reviewed before starting.

## Actions

- Record substantive work and outcomes.

## Decisions

- Record durable decisions here and promote stable ones to \`.memory/DECISIONS.md\`.

## Open Threads

- Track unresolved questions or risks here.

## Summary

Pending session close.
`;
const NOTE_TEMPLATE = `---
id: "20260319T120000000Z--note"
kind: "decision"
title: "Note title"
createdAt: "2026-03-19T12:00:00.000Z"
agent: "Agent Name"
tags: []
sourceType: "manual"
sourcePath: null
sessionId: null
---

Write the durable note body here.
`;

function main() {
  const [command, ...argv] = process.argv.slice(2);

  try {
    switch (command) {
      case 'migrate':
        handleMigrate(argv, { compatAlias: false });
        break;
      case 'doctor':
        handleDoctor(argv);
        break;
      case 'init':
        handleMigrate(argv, { compatAlias: true });
        break;
      case 'session:start':
        handleSessionStart(argv);
        break;
      case 'session:end':
        handleSessionEnd(argv);
        break;
      case 'note':
        handleNote(argv);
        break;
      case 'file':
        handleFile(argv);
        break;
      case undefined:
      case '--help':
      case 'help':
        printUsage();
        process.exitCode = command ? 0 : 1;
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`hawk-memory error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

function handleMigrate(argv, { compatAlias }) {
  assertNoExtraArgs(argv, compatAlias ? 'init' : 'migrate');

  const ctx = getContext();
  ensureProtocol(ctx, { upgradeManifest: true });

  const legacyFiles = importLegacyRepoFiles(ctx);
  const legacyStore = importLegacyStore(ctx);

  if (compatAlias) {
    console.log('Compatibility alias: `init` now routes to repo-native migration.');
  }

  console.log(`Repo-native memory is ready at ${ctx.memoryRoot}`);
  console.log(`Imported legacy repo files: ${legacyFiles.imported.length}`);
  console.log(`Skipped legacy repo file collisions: ${legacyFiles.skipped.length}`);
  console.log(`Imported legacy sessions: ${legacyStore.sessionsImported.length}`);
  console.log(`Skipped legacy session collisions: ${legacyStore.sessionsSkipped.length}`);
  console.log(`Imported legacy notes: ${legacyStore.notesImported.length}`);
  console.log(`Skipped legacy note collisions: ${legacyStore.notesSkipped.length}`);
  console.log(`Imported legacy attachments: ${legacyStore.attachmentsImported.length}`);
  console.log(`Skipped legacy attachment collisions: ${legacyStore.attachmentsSkipped.length}`);
  console.log(`Imported legacy receipts: ${legacyStore.receiptsImported}`);
  console.log(`Skipped legacy duplicate receipts: ${legacyStore.receiptsSkipped}`);
}

function handleDoctor(argv) {
  assertNoExtraArgs(argv, 'doctor');

  const ctx = getContext();
  const warnings = [];
  const errors = [];

  if (!existsSync(ctx.memoryRoot)) {
    errors.push('Missing .memory directory.');
  }

  if (!existsSync(ctx.manifestPath)) {
    errors.push('Missing .memory/manifest.json.');
  } else {
    const manifestRaw = readFileSync(ctx.manifestPath, 'utf8');

    if (manifestRaw.includes('<run-pnpm-memory:init>')) {
      errors.push('Manifest still contains bootstrap placeholders.');
    }

    const manifest = readJsonFile(ctx.manifestPath);

    if (manifest.schemaVersion !== SCHEMA_VERSION) {
      errors.push(`Manifest schema mismatch: expected ${SCHEMA_VERSION}, received ${manifest.schemaVersion}`);
    }

    if (manifest.protocolVersion !== PROTOCOL_VERSION) {
      errors.push(
        `Manifest protocol version mismatch: expected ${PROTOCOL_VERSION}, received ${manifest.protocolVersion}`
      );
    }

    for (const key of [
      'canonicalFiles',
      'sessionDirectory',
      'notesDirectory',
      'receiptLog',
      'attachmentsDirectory',
      'legacySources',
      'bridgeFiles',
    ]) {
      if (!(key in manifest)) {
        errors.push(`Manifest is missing required field: ${key}`);
      }
    }

    for (const runtimeField of RUNTIME_ONLY_MANIFEST_FIELDS) {
      if (runtimeField in manifest) {
        errors.push(`Manifest still contains runtime-only field: ${runtimeField}`);
      }
    }
  }

  for (const filePath of Object.values(CANONICAL_FILE_MAP)) {
    if (!existsSync(join(ctx.repoRoot, filePath))) {
      errors.push(`Missing canonical memory file: ${filePath}`);
    }
  }

  for (const directory of [ctx.sessionsRoot, ctx.notesRoot, ctx.attachmentsRoot, ctx.templatesRoot]) {
    if (!existsSync(directory)) {
      errors.push(`Missing protocol directory: ${normalizeRepoPath(ctx, directory)}`);
    }
  }

  if (!existsSync(ctx.receiptsPath)) {
    errors.push(`Missing ${MEMORY_DIR}/${RECEIPTS_FILE}.`);
  }

  for (const bridgeFile of BRIDGE_FILES) {
    if (!existsSync(join(ctx.repoRoot, bridgeFile))) {
      errors.push(`Missing bridge file: ${bridgeFile}`);
    }
  }

  for (const templatePath of [ctx.sessionTemplatePath, ctx.noteTemplatePath]) {
    if (!existsSync(templatePath)) {
      errors.push(`Missing template: ${normalizeRepoPath(ctx, templatePath)}`);
    }
  }

  if (existsSync(ctx.legacyRoot)) {
    warnings.push('Legacy .agents directory detected. Use `pnpm memory:migrate` if any content still matters.');
  }

  if (existsSync(ctx.legacyStoreRoot)) {
    warnings.push(
      `Legacy helper store detected at ${ctx.legacyStoreRoot}. Use \`pnpm memory:migrate\` to import it.`
    );
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log('hawk-memory doctor: OK');
    return;
  }

  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }

  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

function handleSessionStart(argv) {
  const { options } = parseArgs(argv);
  const agent = requireOption(options, 'agent');
  const goal = normalizeOptionalString(options.goal);
  const branch = normalizeOptionalString(options.branch);
  const ctx = getContext();

  ensureProtocol(ctx, { upgradeManifest: true });

  const openSessions = listSessionDocuments(ctx).filter((session) => session.frontmatter.status === 'open');

  if (openSessions.length > 0) {
    throw new Error('An open session already exists. Close it first or continue it directly in `.memory/sessions/`.');
  }

  const startedAt = new Date().toISOString();
  const sessionId = createId('session', startedAt);
  const fileName = buildSessionFileName(startedAt, agent);
  const sessionPath = uniquePath(join(ctx.sessionsRoot, fileName), sessionId.slice(-6));
  const sessionRecord = {
    sessionId,
    agent,
    startedAt,
    endedAt: null,
    status: 'open',
    branch,
    goal: goal ?? '',
    touched: [],
  };

  writeFileSync(sessionPath, renderFrontmatterDocument(sessionRecord, defaultSessionBody()), 'utf8');
  appendReceipt(ctx, {
    event: 'open',
    sessionId,
    agent,
    timestamp: startedAt,
    touchedFiles: [],
    memoryWrites: [normalizeRepoPath(ctx, sessionPath), `${MEMORY_DIR}/${RECEIPTS_FILE}`],
    summary: goal ?? 'Session opened.',
  });

  console.log(`Started repo-native session ${basename(sessionPath)}`);
}

function handleSessionEnd(argv) {
  const { options } = parseArgs(argv);
  const summary = requireOption(options, 'summary');
  const touched = parseCsv(options.touched);
  const sessionSelector = normalizeOptionalString(options.session);
  const ctx = getContext();

  ensureProtocol(ctx, { upgradeManifest: true });

  const sessionEntry = resolveSessionEntry(ctx, sessionSelector);

  if (sessionEntry.frontmatter.status !== 'open') {
    throw new Error('Session is already closed.');
  }

  const endedAt = new Date().toISOString();
  const frontmatter = {
    ...sessionEntry.frontmatter,
    endedAt,
    status: 'closed',
    touched,
  };
  const nextBody = replaceMarkdownSection(sessionEntry.body, 'Summary', summary);

  writeFileSync(sessionEntry.filePath, renderFrontmatterDocument(frontmatter, nextBody), 'utf8');
  writeFileSync(
    ctx.currentContextPath,
    renderCurrentContext({
      agent: String(frontmatter.agent ?? 'unknown'),
      endedAt,
      sessionId: String(frontmatter.sessionId ?? basename(sessionEntry.filePath, '.md')),
      summary,
      touched,
    }),
    'utf8'
  );
  appendReceipt(ctx, {
    event: 'closed',
    sessionId: String(frontmatter.sessionId ?? basename(sessionEntry.filePath, '.md')),
    agent: String(frontmatter.agent ?? 'unknown'),
    timestamp: endedAt,
    touchedFiles: touched,
    memoryWrites: [
      normalizeRepoPath(ctx, sessionEntry.filePath),
      `${MEMORY_DIR}/${CURRENT_CONTEXT_FILE}`,
      `${MEMORY_DIR}/${RECEIPTS_FILE}`,
    ],
    summary,
  });

  console.log(`Closed repo-native session ${basename(sessionEntry.filePath)}`);
}

function handleNote(argv) {
  const { options } = parseArgs(argv);
  const kind = requireOption(options, 'kind');
  const title = requireOption(options, 'title');
  const inlineBody = normalizeOptionalString(options.body);
  const bodyFile = normalizeOptionalString(options['body-file']);

  if (!inlineBody && !bodyFile) {
    throw new Error('Provide either --body <text> or --body-file <path>.');
  }

  if (inlineBody && bodyFile) {
    throw new Error('Use either --body or --body-file, not both.');
  }

  const ctx = getContext();

  ensureProtocol(ctx, { upgradeManifest: true });

  const createdAt = new Date().toISOString();
  const id = createId('note', createdAt);
  const sourcePath = bodyFile ? resolve(process.cwd(), bodyFile) : null;
  const body = inlineBody ?? readFileSync(sourcePath, 'utf8');
  const noteRecord = {
    id,
    kind,
    title,
    createdAt,
    agent: detectAgent(),
    tags: parseCsv(options.tags),
    sourceType: bodyFile ? 'body-file' : 'manual',
    sourcePath: sourcePath ? normalizeSourcePath(ctx.repoRoot, sourcePath) : null,
    sessionId: inferOpenSessionId(ctx),
  };
  const notePath = uniquePath(join(ctx.notesRoot, buildNoteFileName(createdAt, title)), id.slice(-6));

  writeFileSync(notePath, renderFrontmatterDocument(noteRecord, body), 'utf8');
  console.log(`Wrote repo-native note ${basename(notePath)}`);
}

function handleFile(argv) {
  const { options, positional } = parseArgs(argv);
  const inputPath = positional[0];

  if (!inputPath) {
    throw new Error('Provide a local file path to ingest.');
  }

  const absoluteInputPath = resolve(process.cwd(), inputPath);

  if (!existsSync(absoluteInputPath)) {
    throw new Error(`File not found: ${absoluteInputPath}`);
  }

  const ctx = getContext();

  ensureProtocol(ctx, { upgradeManifest: true });

  const createdAt = new Date().toISOString();
  const id = createId('note', createdAt);
  const title = normalizeOptionalString(options.title) ?? basename(absoluteInputPath);
  const sourcePath = normalizeSourcePath(ctx.repoRoot, absoluteInputPath);
  const raw = readFileSync(absoluteInputPath);
  const checksum = createHash('sha256').update(raw).digest('hex');
  const binary = isBinaryFile(raw, absoluteInputPath);
  const notePath = uniquePath(join(ctx.notesRoot, buildNoteFileName(createdAt, title)), id.slice(-6));
  const frontmatter = {
    id,
    kind: 'file-ingest',
    title,
    createdAt,
    agent: detectAgent(),
    tags: parseCsv(options.tags),
    sourceType: binary ? 'file-binary' : 'file-text',
    sourcePath,
    sessionId: inferOpenSessionId(ctx),
  };
  let body = raw.toString('utf8');

  if (binary) {
    const attachmentName = `${formatUtcTimestamp(createdAt)}--${slugify(basename(absoluteInputPath, extname(absoluteInputPath))) || 'attachment'}${extname(absoluteInputPath) || '.bin'}`;
    const attachmentPath = uniquePath(join(ctx.attachmentsRoot, attachmentName), id.slice(-6));

    copyFileSync(absoluteInputPath, attachmentPath);
    frontmatter.attachmentPath = normalizeRepoPath(ctx, attachmentPath);
    frontmatter.checksum = checksum;
    body = [
      'Binary file captured as metadata only.',
      '',
      `- Original path: ${sourcePath}`,
      `- Attachment: ${normalizeRepoPath(ctx, attachmentPath)}`,
      `- Size: ${raw.byteLength} bytes`,
    ].join('\n');
  } else {
    frontmatter.checksum = checksum;
  }

  writeFileSync(notePath, renderFrontmatterDocument(frontmatter, body), 'utf8');
  console.log(`Captured file into repo-native note ${basename(notePath)}`);
}

function getContext() {
  const repoRoot = realpathSync(process.cwd());
  const memoryRoot = join(repoRoot, MEMORY_DIR);
  const memoryHome = resolve(process.env.HAWK_MEMORY_HOME || join(homedir(), '.hawk-eye'));

  return {
    attachmentsRoot: join(memoryRoot, 'attachments'),
    currentContextPath: join(memoryRoot, CURRENT_CONTEXT_FILE),
    legacyRoot: join(repoRoot, LEGACY_DIR),
    legacyStoreRoot: join(memoryHome, 'projects', createLegacyProjectKey(repoRoot)),
    manifestPath: join(memoryRoot, 'manifest.json'),
    memoryRoot,
    noteTemplatePath: join(memoryRoot, 'templates', 'note.md'),
    notesRoot: join(memoryRoot, 'notes'),
    receiptsPath: join(memoryRoot, RECEIPTS_FILE),
    repoRoot,
    sessionTemplatePath: join(memoryRoot, 'templates', 'session.md'),
    sessionsRoot: join(memoryRoot, 'sessions'),
    templatesRoot: join(memoryRoot, 'templates'),
  };
}

function ensureProtocol(ctx, { upgradeManifest }) {
  ensureDirectory(ctx.memoryRoot);
  ensureDirectory(ctx.sessionsRoot);
  ensureDirectory(ctx.notesRoot);
  ensureDirectory(ctx.attachmentsRoot);
  ensureDirectory(ctx.templatesRoot);

  for (const [fileName, contents] of Object.entries(DEFAULT_CANONICAL_FILES)) {
    const targetPath = join(ctx.memoryRoot, fileName);

    if (!existsSync(targetPath)) {
      writeFileSync(targetPath, contents.trimEnd() + '\n', 'utf8');
    }
  }

  if (!existsSync(ctx.receiptsPath)) {
    writeFileSync(ctx.receiptsPath, '', 'utf8');
  }

  if (!existsSync(ctx.sessionTemplatePath)) {
    writeFileSync(ctx.sessionTemplatePath, `${SESSION_TEMPLATE.trimEnd()}\n`, 'utf8');
  }

  if (!existsSync(ctx.noteTemplatePath)) {
    writeFileSync(ctx.noteTemplatePath, `${NOTE_TEMPLATE.trimEnd()}\n`, 'utf8');
  }

  for (const fileName of ['.gitkeep']) {
    for (const directory of [ctx.sessionsRoot, ctx.notesRoot, ctx.attachmentsRoot]) {
      const targetPath = join(directory, fileName);

      if (!existsSync(targetPath)) {
        writeFileSync(targetPath, '\n', 'utf8');
      }
    }
  }

  const shouldWriteManifest =
    !existsSync(ctx.manifestPath) ||
    (upgradeManifest && manifestNeedsRewrite(readJsonFile(ctx.manifestPath)));

  if (shouldWriteManifest) {
    writeJsonFile(ctx.manifestPath, PROTOCOL_MANIFEST);
  }
}

function importLegacyRepoFiles(ctx) {
  const imported = [];
  const skipped = [];

  if (!existsSync(ctx.legacyRoot)) {
    return {
      imported,
      skipped,
    };
  }

  for (const [legacyName, canonicalName] of Object.entries(LEGACY_IMPORTS)) {
    const sourcePath = join(ctx.legacyRoot, legacyName);
    const targetPath = join(ctx.memoryRoot, canonicalName);

    if (!existsSync(sourcePath)) {
      continue;
    }

    if (existsSync(targetPath)) {
      skipped.push(canonicalName);
      continue;
    }

    copyFileSync(sourcePath, targetPath);
    imported.push(canonicalName);
  }

  return {
    imported,
    skipped,
  };
}

function importLegacyStore(ctx) {
  const results = {
    attachmentsImported: [],
    attachmentsSkipped: [],
    notesImported: [],
    notesSkipped: [],
    receiptsImported: 0,
    receiptsSkipped: 0,
    sessionsImported: [],
    sessionsSkipped: [],
  };

  if (!existsSync(ctx.legacyStoreRoot)) {
    return results;
  }

  const legacyAttachmentsRoot = join(ctx.legacyStoreRoot, 'attachments');
  const legacyNotesRoot = join(ctx.legacyStoreRoot, 'notes');
  const legacyReceiptsPath = join(ctx.legacyStoreRoot, 'receipts', RECEIPTS_FILE);
  const legacySessionsRoot = join(ctx.legacyStoreRoot, 'sessions');

  if (existsSync(legacyAttachmentsRoot)) {
    for (const fileName of listNonDotFiles(legacyAttachmentsRoot)) {
      const sourcePath = join(legacyAttachmentsRoot, fileName);
      const targetPath = join(ctx.attachmentsRoot, fileName);

      if (existsSync(targetPath)) {
        results.attachmentsSkipped.push(fileName);
        continue;
      }

      copyFileSync(sourcePath, targetPath);
      results.attachmentsImported.push(fileName);
    }
  }

  if (existsSync(legacySessionsRoot)) {
    for (const fileName of listNonDotFiles(legacySessionsRoot)) {
      const sourcePath = join(legacySessionsRoot, fileName);
      const parsed = parseFrontmatterDocument(readFileSync(sourcePath, 'utf8'));
      const startedAt =
        typeof parsed.frontmatter.startedAt === 'string' ? parsed.frontmatter.startedAt : new Date().toISOString();
      const agent = typeof parsed.frontmatter.agent === 'string' ? parsed.frontmatter.agent : 'legacy-agent';
      const sessionId =
        typeof parsed.frontmatter.sessionId === 'string'
          ? parsed.frontmatter.sessionId
          : createId('session', startedAt);
      const destinationName = buildSessionFileName(startedAt, agent);
      const destinationPath = join(ctx.sessionsRoot, destinationName);

      if (existsSync(destinationPath)) {
        results.sessionsSkipped.push(destinationName);
        continue;
      }

      writeFileSync(
        destinationPath,
        renderFrontmatterDocument(
          {
            ...parsed.frontmatter,
            sessionId,
            startedAt,
            agent,
          },
          parsed.body
        ),
        'utf8'
      );
      results.sessionsImported.push(destinationName);
    }
  }

  if (existsSync(legacyNotesRoot)) {
    for (const fileName of listNonDotFiles(legacyNotesRoot)) {
      const sourcePath = join(legacyNotesRoot, fileName);
      const destinationPath = join(ctx.notesRoot, fileName);

      if (existsSync(destinationPath)) {
        results.notesSkipped.push(fileName);
        continue;
      }

      const parsed = parseFrontmatterDocument(readFileSync(sourcePath, 'utf8'));
      const nextFrontmatter = {
        ...parsed.frontmatter,
      };

      if (typeof nextFrontmatter.attachmentPath === 'string' && !nextFrontmatter.attachmentPath.startsWith('.memory/')) {
        nextFrontmatter.attachmentPath = `${MEMORY_DIR}/${String(nextFrontmatter.attachmentPath).replace(/^\.?\//, '')}`;
      }

      writeFileSync(destinationPath, renderFrontmatterDocument(nextFrontmatter, parsed.body), 'utf8');
      results.notesImported.push(fileName);
    }
  }

  if (existsSync(legacyReceiptsPath)) {
    const existingReceipts = readReceiptLines(ctx.receiptsPath);
    const seen = new Set(existingReceipts.map((line) => receiptKey(JSON.parse(line))));

    for (const line of readReceiptLines(legacyReceiptsPath)) {
      const parsed = JSON.parse(line);
      const key = receiptKey(parsed);

      if (seen.has(key)) {
        results.receiptsSkipped += 1;
        continue;
      }

      appendFileSync(ctx.receiptsPath, `${JSON.stringify(parsed)}\n`, 'utf8');
      seen.add(key);
      results.receiptsImported += 1;
    }
  }

  return results;
}

function listSessionDocuments(ctx) {
  return listNonDotFiles(ctx.sessionsRoot).map((fileName) => {
    const filePath = join(ctx.sessionsRoot, fileName);
    const parsed = parseFrontmatterDocument(readFileSync(filePath, 'utf8'));

    return {
      ...parsed,
      fileName,
      filePath,
    };
  });
}

function resolveSessionEntry(ctx, selector) {
  const sessions = listSessionDocuments(ctx);

  if (selector) {
    const match = sessions.find((session) => {
      const sessionId = session.frontmatter.sessionId;
      return (
        session.fileName === selector ||
        basename(session.fileName, '.md') === selector ||
        (typeof sessionId === 'string' && sessionId === selector)
      );
    });

    if (!match) {
      throw new Error(`Could not resolve session selector: ${selector}`);
    }

    return match;
  }

  const openSessions = sessions.filter((session) => session.frontmatter.status === 'open');

  if (openSessions.length === 1) {
    return openSessions[0];
  }

  if (openSessions.length === 0) {
    throw new Error('No open session found. Pass --session <id> or edit the session file directly.');
  }

  throw new Error('Multiple open sessions found. Pass --session <id> to choose one explicitly.');
}

function inferOpenSessionId(ctx) {
  const openSessions = listSessionDocuments(ctx).filter((session) => session.frontmatter.status === 'open');

  if (openSessions.length === 1 && typeof openSessions[0].frontmatter.sessionId === 'string') {
    return openSessions[0].frontmatter.sessionId;
  }

  return null;
}

function manifestNeedsRewrite(manifest) {
  if (!manifest || manifest.schemaVersion !== SCHEMA_VERSION || manifest.protocolVersion !== PROTOCOL_VERSION) {
    return true;
  }

  for (const field of RUNTIME_ONLY_MANIFEST_FIELDS) {
    if (field in manifest) {
      return true;
    }
  }

  for (const field of [
    'canonicalFiles',
    'sessionDirectory',
    'notesDirectory',
    'receiptLog',
    'attachmentsDirectory',
    'legacySources',
    'bridgeFiles',
  ]) {
    if (!(field in manifest)) {
      return true;
    }
  }

  return false;
}

function defaultSessionBody() {
  return [
    '## Context',
    '',
    '- Capture the repo state, branch, and memory you reviewed before starting.',
    '',
    '## Actions',
    '',
    '- Record substantive work and outcomes.',
    '',
    '## Decisions',
    '',
    '- Record durable decisions here and promote stable ones to `.memory/DECISIONS.md`.',
    '',
    '## Open Threads',
    '',
    '- Track unresolved questions or risks here.',
    '',
    '## Summary',
    '',
    'Pending session close.',
  ].join('\n');
}

function renderCurrentContext({ agent, endedAt, sessionId, summary, touched }) {
  const touchedLines = touched.length > 0 ? touched.map((item) => `- ${item}`).join('\n') : '- None recorded.';

  return `# Current Session Context

## Last Agent
- ${agent}

## Last Session
- ${endedAt} (${sessionId})

## Current Status
- ${summary}

## Next Steps
- Continue with the next repo-native session in \`.memory/sessions/\`.

## Touched Areas
${touchedLines}
`;
}

function appendReceipt(ctx, receipt) {
  appendFileSync(ctx.receiptsPath, `${JSON.stringify(receipt)}\n`, 'utf8');
}

function readReceiptLines(filePath) {
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function receiptKey(receipt) {
  return [receipt.event, receipt.sessionId, receipt.timestamp].join('|');
}

function buildSessionFileName(startedAt, agent) {
  return `${formatUtcTimestamp(startedAt)}--${slugify(agent) || 'agent'}.md`;
}

function buildNoteFileName(createdAt, title) {
  return `${formatUtcTimestamp(createdAt)}--${slugify(title) || 'note'}.md`;
}

function uniquePath(basePath, suffix) {
  if (!existsSync(basePath)) {
    return basePath;
  }

  const extension = extname(basePath);
  const stem = basePath.slice(0, basePath.length - extension.length);
  return `${stem}--${suffix}${extension}`;
}

function createLegacyProjectKey(repoRoot) {
  const slug = slugify(basename(repoRoot)) || 'project';
  const hash = createHash('sha256').update(repoRoot).digest('hex').slice(0, 12);
  return `${slug}--${hash}`;
}

function createId(prefix, isoTimestamp = new Date().toISOString()) {
  return `${formatUtcTimestamp(isoTimestamp)}--${prefix}-${randomUUID().slice(0, 8)}`;
}

function formatUtcTimestamp(isoTimestamp) {
  return isoTimestamp.replace(/[-:]/g, '').replace(/\./g, '').replace(/Z$/, 'Z').replace('T', 'T');
}

function detectAgent() {
  return process.env.HAWK_MEMORY_AGENT || process.env.ANTHROPIC_AGENT_NAME || 'unknown';
}

function listNonDotFiles(directoryPath) {
  if (!existsSync(directoryPath)) {
    return [];
  }

  return readdirSync(directoryPath).filter((fileName) => !fileName.startsWith('.'));
}

function parseArgs(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[index + 1];

    if (nextToken === undefined || nextToken.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = nextToken;
    index += 1;
  }

  return {
    options,
    positional,
  };
}

function requireOption(options, key) {
  const value = normalizeOptionalString(options[key]);

  if (!value) {
    throw new Error(`Missing required option --${key}`);
  }

  return value;
}

function assertNoExtraArgs(argv, command) {
  const { options, positional } = parseArgs(argv);

  if (positional.length > 0 || Object.keys(options).length > 0) {
    throw new Error(`${command} does not accept additional arguments.`);
  }
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseCsv(value) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function renderFrontmatterDocument(frontmatter, body) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }

  lines.push('---', '', body.trimEnd(), '');
  return lines.join('\n');
}

function parseFrontmatterDocument(content) {
  if (!content.startsWith('---\n')) {
    return {
      body: content,
      frontmatter: {},
    };
  }

  const lines = content.split('\n');
  let boundaryIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === '---') {
      boundaryIndex = index;
      break;
    }
  }

  if (boundaryIndex === -1) {
    return {
      body: content,
      frontmatter: {},
    };
  }

  const frontmatter = {};
  const frontmatterLines = lines.slice(1, boundaryIndex);

  for (let index = 0; index < frontmatterLines.length; index += 1) {
    const line = frontmatterLines[index];

    if (!line.trim()) {
      continue;
    }

    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!rawValue) {
      const blockItems = [];

      while (index + 1 < frontmatterLines.length && /^\s*-\s+/.test(frontmatterLines[index + 1])) {
        index += 1;
        blockItems.push(parseFrontmatterValue(frontmatterLines[index].replace(/^\s*-\s+/, '')));
      }

      frontmatter[key] = blockItems.length > 0 ? blockItems : null;
      continue;
    }

    frontmatter[key] = parseFrontmatterValue(rawValue);
  }

  return {
    body: lines.slice(boundaryIndex + 1).join('\n').replace(/^\n/, ''),
    frontmatter,
  };
}

function parseFrontmatterValue(rawValue) {
  if (!rawValue) {
    return null;
  }

  if (rawValue === 'null') {
    return null;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(rawValue)) {
    return Number(rawValue);
  }

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith('[') && rawValue.endsWith(']')) ||
    (rawValue.startsWith('{') && rawValue.endsWith('}'))
  ) {
    return JSON.parse(rawValue);
  }

  if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

function replaceMarkdownSection(body, sectionName, replacement) {
  const heading = `## ${sectionName}`;
  const replacementBlock = `${heading}\n\n${replacement.trim()}\n`;

  if (!body.includes(heading)) {
    return `${body.trimEnd()}\n\n${replacementBlock}`;
  }

  const sectionPattern = new RegExp(`## ${escapeRegExp(sectionName)}\\n[\\s\\S]*?(?=\\n## |$)`);
  return body.replace(sectionPattern, replacementBlock).trimEnd() + '\n';
}

function normalizeSourcePath(repoRoot, targetPath) {
  const absoluteTarget = resolve(targetPath);
  const relativePath = relative(repoRoot, absoluteTarget);

  if (!relativePath.startsWith('..') && relativePath !== '') {
    return toPosix(relativePath);
  }

  return toPosix(absoluteTarget);
}

function normalizeRepoPath(ctx, targetPath) {
  return normalizeSourcePath(ctx.repoRoot, targetPath);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPosix(value) {
  return value.split('\\').join('/');
}

function ensureDirectory(directoryPath) {
  mkdirSync(directoryPath, { recursive: true });
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function isBinaryFile(buffer, filePath) {
  if (buffer.includes(0)) {
    return true;
  }

  if (TEXT_EXTENSIONS.has(extname(filePath).toLowerCase())) {
    return false;
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
  let suspicious = 0;

  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13) {
      continue;
    }

    if (byte < 32 || byte > 126) {
      suspicious += 1;
    }
  }

  return sample.length > 0 && suspicious / sample.length > 0.3;
}

function printUsage() {
  console.log(`hawk-memory usage:

  node scripts/hawk-memory.mjs migrate
  node scripts/hawk-memory.mjs doctor
  node scripts/hawk-memory.mjs init
  node scripts/hawk-memory.mjs session:start --agent <name> [--goal <text>] [--branch <name>]
  node scripts/hawk-memory.mjs session:end [--session <id|file>] --summary <text> [--touched <csv>]
  node scripts/hawk-memory.mjs note --kind <kind> --title <text> [--tags <csv>] (--body <text> | --body-file <path>)
  node scripts/hawk-memory.mjs file <path> [--title <text>] [--tags <csv>]
`);
}

main();
