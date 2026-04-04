import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf-8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  scripts: Record<string, string>
}
const preCommitHook = readFileSync('.githooks/pre-commit', 'utf-8')
const installScript = readFileSync('scripts/install-git-hooks.mjs', 'utf-8')

test('deploy workflow still triggers on pushes to main and publishes Pages artifacts', () => {
  assert.match(workflow, /push:/)
  assert.match(workflow, /branches: \[main\]/)
  assert.match(workflow, /actions\/upload-pages-artifact/)
  assert.match(workflow, /actions\/deploy-pages/)
})

test('workflow keeps deploy verification fast and leaves browser checks local', () => {
  assert.match(workflow, /npm run check/)
  assert.match(workflow, /npm run test:unit/)
  assert.doesNotMatch(workflow, /npm run test:e2e/)
  assert.doesNotMatch(workflow, /playwright install --with-deps chromium/)
})

test('local git hooks install from prepare and run the full validation gate', () => {
  assert.equal(packageJson.scripts.prepare, 'node scripts/install-git-hooks.mjs')
  assert.equal(packageJson.scripts['test:local'], 'npm run check && npm run test')
  assert.match(preCommitHook, /npm run test:local/)
  assert.match(installScript, /core\.hooksPath', '\.githooks'/)
})

test('workflow keeps Pages and Lighthouse URLs dynamic and repository-safe', () => {
  assert.match(workflow, /SITE_BASE_PATH: \/\$\{\{ github\.event\.repository\.name \}\}/)
  assert.match(workflow, /SITE_ORIGIN: https:\/\/\$\{\{ github\.repository_owner \}\}\.github\.io/)
  assert.match(workflow, /\$\{\{ needs\.deploy\.outputs\.page_url \}\}/)
  assert.match(workflow, /\$\{\{ needs\.deploy\.outputs\.page_url \}\}super-word\//)
})