import assert from 'node:assert/strict'
import test from 'node:test'
import { buildIndexedPixelArt, decodeCodepoints, formatTypeScriptSnippet } from '../scripts/generate-pixel-art'

test('codepoint input converts into an emoji string', () => {
  assert.equal(decodeCodepoints('1F5FC'), '🗼')
  assert.equal(decodeCodepoints('1F3F0 FE0F'), '🏰️')
})

test('indexed pixel art keeps transparent zero and stable row strings', () => {
  const art = buildIndexedPixelArt([
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 240, g: 40, b: 40, a: 255 },
    { r: 240, g: 40, b: 40, a: 255 },
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 240, g: 40, b: 40, a: 255 },
    { r: 40, g: 80, b: 220, a: 255 },
  ], 3, 2, 3, 0.1)

  assert.deepEqual(art.palette, ['transparent', '#f02828', '#2850dc'])
  assert.deepEqual(art.rows, ['011', '012'])
})

test('typescript output is ready to paste into buildSceneArt callers', () => {
  const snippet = formatTypeScriptSnippet('Paris Tower', {
    palette: ['transparent', '#f02828', '#2850dc'],
    rows: ['011', '012'],
  })

  assert.match(snippet, /const parisTowerPalette = \['transparent', '#f02828', '#2850dc'\] as const/)
  assert.match(snippet, /const parisTowerRows = \[/)
  assert.match(snippet, /const parisTowerArt = buildSceneArt\(parisTowerPalette, parisTowerRows\)/)
})