import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { type TestContext } from 'node:test';

const script = fileURLToPath(new URL('../scripts/deploy.ts', import.meta.url));
const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'blog-deploy-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const work = join(root, 'work');
  const remote = join(root, 'origin.git');
  const bin = join(root, 'bin');
  const log = join(root, 'commands.jsonl');
  mkdirSync(work);
  mkdirSync(bin);
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...args: string[]) => execFileSync(realGit, args, { cwd: work, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'production');
  git('config', 'user.name', 'Deployment test');
  git('config', 'user.email', 'test@example.invalid');
  writeFileSync(join(work, 'post.md'), 'First post');
  git('add', 'post.md');
  git('commit', '-m', 'Initial content');
  git('clone', '--bare', work, remote);
  git('remote', 'add', 'origin', remote);
  writeFileSync(join(work, 'post.md'), 'Updated post');
  git('commit', '-am', 'Update content');

  writeFileSync(join(bin, 'pnpm'), `#!${process.execPath}
    const { appendFileSync, writeFileSync } = require('node:fs');
    const args = process.argv.slice(2);
    appendFileSync(process.env.DEPLOY_TEST_LOG, JSON.stringify(['pnpm', ...args]) + '\\n');
    if (process.env.DIRTY_DURING_CHECK) writeFileSync('unfinished.md', 'Private writing');
    if (args.at(-1) === 'check' && process.env.CHANGE_DURING_CHECK) {
      const { execFileSync } = require('node:child_process');
      const gitArgs = process.env.CHANGE_DURING_CHECK === 'branch'
        ? ['switch', '-c', 'mitja/unfinished']
        : ['commit', '--allow-empty', '-m', 'New unchecked commit'];
      execFileSync(${JSON.stringify(realGit)}, gitArgs, { stdio: 'ignore' });
    }
    if (args.at(-1) === process.env.FAIL_CHECK) process.exit(1);
  `, { mode: 0o755 });
  // Keep real Git for reads and the local fetch. Record the push boundary;
  // these tests never execute a Git push or contact a remote service.
  writeFileSync(join(bin, 'git'), `#!${process.execPath}
    const { appendFileSync } = require('node:fs');
    const { spawnSync } = require('node:child_process');
    const args = process.argv.slice(2);
    if (args[0] === 'push') {
      appendFileSync(process.env.DEPLOY_TEST_LOG, JSON.stringify(['git', ...args]) + '\\n');
      process.exit(0);
    }
    const result = spawnSync(${JSON.stringify(realGit)}, args, { stdio: 'inherit' });
    process.exit(result.status ?? 1);
  `, { mode: 0o755 });
  const run = (args: string[] = [], extraEnv: NodeJS.ProcessEnv = {}) => spawnSync(process.execPath, [script, ...args], {
    cwd: work, encoding: 'utf8',
    env: { ...env, PATH: `${bin}${delimiter}${env.PATH}`, DEPLOY_TEST_LOG: log, ...extraEnv },
  });
  const commands = (): string[][] => {
    try { return readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line)); }
    catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []; throw error; }
  };
  return { work, git, run, commands };
}

test('deploy runs CI checks and pushes only the verified commit to production without tags', (t) => {
  const { git, run, commands } = fixture(t);
  const commit = git('rev-parse', 'HEAD');
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(commands(), [
    ['pnpm', 'run', 'check'], ['pnpm', 'run', 'test:drafts'], ['pnpm', 'run', 'test'],
    ['git', 'push', '--no-follow-tags', 'origin', `${commit}:refs/heads/production`],
  ]);
});

test('dry run performs checks but never reaches the push boundary', (t) => {
  const { run, commands } = fixture(t);
  const result = run(['--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry run/i);
  assert.equal(commands().length, 3);
  assert.ok(commands().every(([command]) => command === 'pnpm'));
});

test('deploy rejects another branch and uncommitted writing before running checks', (t) => {
  const { work, git, run, commands } = fixture(t);
  git('switch', '-c', 'mitja/private-writing');
  let result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /production/);
  git('switch', 'production');
  writeFileSync(join(work, 'unfinished.md'), 'Private writing');
  result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit|clean/i);
  assert.deepEqual(commands(), []);
});

test('deploy rejects a production branch behind the remote', (t) => {
  const { git, run, commands } = fixture(t);
  git('reset', '--hard', 'HEAD~1');
  git('commit', '--allow-empty', '-m', 'Remote update');
  // Move the local bare remote without pushing, then leave the checkout behind it.
  const remote = git('remote', 'get-url', 'origin');
  git('--git-dir', remote, 'fetch', '--no-tags', '.', 'production:production');
  git('reset', '--hard', 'HEAD~1');
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /behind|latest|pull/i);
  assert.deepEqual(commands(), []);
});

test('failed checks and edits made during checks prevent publishing', (t) => {
  const { run, commands } = fixture(t);
  let result = run([], { FAIL_CHECK: 'check' });
  assert.notEqual(result.status, 0);
  assert.deepEqual(commands(), [['pnpm', 'run', 'check']]);
  result = run([], { DIRTY_DURING_CHECK: '1' });
  assert.notEqual(result.status, 0);
  assert.ok(commands().every(([command]) => command !== 'git'));
});

test('changing the branch or commit during checks prevents publishing', (t) => {
  for (const change of ['branch', 'commit']) {
    const { run, commands } = fixture(t);
    const result = run([], { CHANGE_DURING_CHECK: change });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /production|commit changed/i);
    assert.ok(commands().every(([command]) => command !== 'git'));
  }
});
