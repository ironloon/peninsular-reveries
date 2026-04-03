import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf-8')

test('deploy workflow still triggers on pushes to main and publishes Pages artifacts', () => {
  assert.match(workflow, /push:/)
  assert.match(workflow, /branches: \[main\]/)
  assert.match(workflow, /actions\/upload-pages-artifact/)
  assert.match(workflow, /actions\/deploy-pages/)
})

test('workflow separates fast static checks from browser checks', () => {
  assert.match(workflow, /npm run check/)
  assert.match(workflow, /npm run test:unit/)
  assert.match(workflow, /npm run test:e2e/)
  assert.match(workflow, /playwright install --with-deps chromium/)
})

test('workflow keeps Pages and Lighthouse URLs dynamic and repository-safe', () => {
  assert.match(workflow, /SITE_BASE_PATH: \/\$\{\{ github\.event\.repository\.name \}\}/)
  assert.match(workflow, /SITE_ORIGIN: https:\/\/\$\{\{ github\.repository_owner \}\}\.github\.io/)
  assert.match(workflow, /\$\{\{ needs\.deploy\.outputs\.page_url \}\}/)
  assert.match(workflow, /\$\{\{ needs\.deploy\.outputs\.page_url \}\}super-word\//)
})