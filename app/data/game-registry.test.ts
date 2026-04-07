import assert from 'node:assert/strict'
import { test } from 'node:test'
import { games } from './game-registry'
import { routes } from '../routes'

test('games array is non-empty', () => {
  assert.ok(games.length > 0, 'games array should have at least one entry')
})

test('every game entry has required fields', () => {
  for (const game of games) {
    assert.ok(typeof game.slug === 'string' && game.slug.length > 0, `missing slug in game: ${JSON.stringify(game)}`)
    assert.ok(typeof game.name === 'string' && game.name.length > 0, `missing name for slug: ${game.slug}`)
    assert.ok(typeof game.description === 'string' && game.description.length > 0, `missing description for slug: ${game.slug}`)
    assert.ok(typeof game.icon === 'string' && game.icon.length > 0, `missing icon for slug: ${game.slug}`)
    assert.ok(game.status === 'live' || game.status === 'coming-soon', `invalid status "${game.status}" for slug: ${game.slug}`)
  }
})

test('all slugs are unique', () => {
  const slugs = games.map((g) => g.slug)
  const unique = new Set(slugs)
  assert.equal(unique.size, slugs.length, `Duplicate slugs detected: ${slugs.join(', ')}`)
})

// `route()` from @remix-run/fetch-router returns pattern objects; extract slug text from tokens
function routeSlug(routeObj: unknown): string {
  const tokens: Array<{ type: string; text?: string }> =
    (routeObj as { pattern?: { ast?: { pathname?: { tokens?: Array<{ type: string; text?: string }> } } } })?.pattern?.ast?.pathname?.tokens ?? []
  return tokens
    .filter((t) => t.type === 'text')
    .map((t) => t.text ?? '')
    .join('')
}

test('all live games have a corresponding route', () => {
  const registeredSlugs = Object.values(routes).map(routeSlug)
  for (const game of games.filter((g) => g.status === 'live')) {
    assert.ok(
      registeredSlugs.includes(game.slug),
      `No route found for live game "${game.slug}"; registered slugs: ${registeredSlugs.join(', ')}`,
    )
  }
})
