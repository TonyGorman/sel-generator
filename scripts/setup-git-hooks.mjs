import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const gitDirectory = resolve(repositoryRoot, '.git');
const hooksPath = resolve(repositoryRoot, '.githooks');

if (!existsSync(gitDirectory)) {
  process.exit(0);
}

execFileSync('git', ['config', 'core.hooksPath', hooksPath], {
  cwd: repositoryRoot,
  stdio: 'inherit',
});