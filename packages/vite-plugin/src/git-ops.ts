import { spawnSync } from 'node:child_process';

interface RunGitOptions {
  allowFailure?: boolean;
}

function runGit(cwd: string, args: string[], options: RunGitOptions = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0 && !options.allowFailure) {
    const message = result.stderr.trim() || result.stdout.trim() || `git ${args.join(' ')} failed`;
    throw new Error(message);
  }

  return result.stdout.trim();
}

export function getGitRoot(cwd: string) {
  return runGit(cwd, ['rev-parse', '--show-toplevel']);
}

export function hasUncommittedChanges(cwd: string) {
  return runGit(cwd, ['status', '--porcelain']).length > 0;
}

export function getCurrentBranch(cwd: string) {
  return runGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
}

export function createBranch(cwd: string, branchName: string) {
  runGit(cwd, ['checkout', '-b', branchName]);
}

export function commitChanges(cwd: string, files: string[], message: string) {
  runGit(cwd, ['add', '--', ...files]);
  runGit(cwd, [
    '-c',
    'user.name=Hawk Eye',
    '-c',
    'user.email=hawk-eye@local',
    '-c',
    'commit.gpgSign=false',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-m',
    message,
  ]);

  return runGit(cwd, ['rev-parse', 'HEAD']);
}

export function restoreOriginalBranch(cwd: string, branchName: string) {
  runGit(cwd, ['checkout', branchName]);
}
