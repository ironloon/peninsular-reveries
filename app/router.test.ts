import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAppRouter } from './router'

test('createAppRouter returns a truthy router object with a fetch method', () => {
  const router = createAppRouter()
  assert.ok(router, 'router should be truthy')
  assert.equal(typeof router.fetch, 'function', 'router should have a fetch method')
})

test('unknown path returns 404', async () => {
  const router = createAppRouter()
  const response = await router.fetch(new Request('http://localhost/does-not-exist/'))
  assert.equal(response.status, 404)
})
