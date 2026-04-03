import { chmodSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const gitDir = resolve(repoRoot, '.git')
const hookPath = resolve(repoRoot, '.githooks', 'pre-commit')

if (!existsSync(gitDir)) {
  process.exit(0)
}

if (!existsSync(hookPath)) {
  console.error('Missing .githooks/pre-commit hook file.')
  process.exit(1)
}

chmodSync(hookPath, 0o755)
execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  cwd: repoRoot,
  stdio: 'ignore',
})