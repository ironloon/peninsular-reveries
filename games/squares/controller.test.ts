import assert from 'node:assert/strict'
import test from 'node:test'

test('Squares controller renders the full page shell and required UI hooks', async () => {
  ;(globalThis as typeof globalThis & { React?: unknown }).React = await import('@remix-run/component')
  const { squaresAction } = await import('./controller.js')
  const response = await squaresAction()
  const html = await response.text()

  assert.match(html, /id="start-screen"/)
  assert.match(html, /id="game-screen"/)
  assert.match(html, /id="win-screen"/)
  assert.match(html, /id="settings-modal"/)
  assert.match(html, /id="restart-btn"/)
  assert.match(html, /id="settings-close-btn"/)
  assert.match(html, /id="hud-high-score-value"/)
  assert.match(html, /id="settings-high-score-value"/)
  assert.match(html, /id="game-status"/)
  assert.match(html, /id="game-feedback"/)
  assert.match(html, /href="\/squares\/manifest\.json"/)
  assert.match(html, /href="\/favicon-game-squares\.svg"/)
})