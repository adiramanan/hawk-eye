#!/usr/bin/env node

import { runInstaller } from './installer';

function printHelp() {
  console.log(`Hawk-Eye CLI

Usage:
  hawk-eye init

Commands:
  init    Patch a React + Vite app to enable Hawk-Eye with no manual mount step.
  help    Show this message.
`);
}

function main(argv: string[]) {
  const [command] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }

  if (command !== 'init') {
    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  }

  const result = runInstaller();
  return result.success ? 0 : 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
