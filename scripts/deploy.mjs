import { spawnSync } from 'node:child_process';

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed${capture && result.stderr ? `: ${result.stderr.trim()}` : '.'}`);
  }
  return capture ? result.stdout.trim() : '';
}

const git = (...args) => run('git', args, true);

function assertReady(commit) {
  if (git('branch', '--show-current') !== 'source') {
    throw new Error('Deploy from the source branch. Merge your finished work into source first.');
  }
  if (git('status', '--porcelain', '--untracked-files=all')) {
    throw new Error('Deploy requires a clean working tree. Review and commit your changes first.');
  }
  if (commit && git('rev-parse', 'HEAD') !== commit) {
    throw new Error('The commit changed during verification. Run deploy again to check the new commit.');
  }
}

try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: pnpm run deploy [--dry-run]\nVerify committed source and push it to GitHub Pages. --dry-run runs checks without pushing.');
  } else {
    if (args.some((arg) => arg !== '--dry-run')) throw new Error('Usage: pnpm run deploy [--dry-run]');
    assertReady();
    const commit = git('rev-parse', 'HEAD');
    run('git', ['fetch', '--no-tags', 'origin', 'refs/heads/source:refs/remotes/origin/source']);
    if (Number(git('rev-list', '--count', `${commit}..refs/remotes/origin/source`)) > 0) {
      throw new Error('source does not contain the latest origin/source. Run git pull --ff-only origin source and resolve any divergence before deploying.');
    }

    for (const task of ['check', 'test:drafts', 'test']) run('pnpm', ['run', task]);
    assertReady(commit);
    const push = ['push', '--no-follow-tags', 'origin', `${commit}:refs/heads/source`];
    if (args.includes('--dry-run')) {
      console.log(`Dry run passed. Would run: git ${push.join(' ')}`);
    } else {
      run('git', push);
      console.log('Push complete. Follow the deployment at https://github.com/MitjaBezensek/mitjabezensek.github.io/actions');
    }
  }
} catch (error) {
  console.error(`Deploy stopped: ${error.message}`);
  process.exitCode = 1;
}
