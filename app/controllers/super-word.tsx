import { renderToString } from 'remix/component/server'
import { Document } from '../ui/document.js'
import { GameHeader, GameHeaderPill, GameScreen, GameSettingsModal, SettingsActions, SettingsSection, SettingsToggle, SrOnly } from '../ui/game-shell.js'
import { attributionsPagePath, getGameAttribution } from '../data/attributions/index.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'

const superWordScreenStyles = {
  transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
}

const superWordModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(0, 0, 0, 0.6)',
}

export async function superWordAction() {
  const attribution = getGameAttribution('super-word')
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const superWordAttributionsPath = withBasePath(`${attributionsPagePath}#super-word`, siteBasePath)
  const html = await renderToString(
    <Document
      title="Super Word"
      description="Find hidden letters and spell the secret word."
      path="/super-word/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/game.css']}
      includeDefaultStyles={false}
      scripts={['/client/super-word/main.js']}
      bodyClass="super-word-game"
      viewportFitCover
      faviconPath="/favicon-game-super-word.svg"
      manifestPath="/super-word/manifest.json"
      serviceWorkerPath="/super-word/sw.js"
      serviceWorkerScope="/super-word/"
    >
      <div className="scene-track">

        {/* Start Screen */}
        <GameScreen id="start-screen" className="active" as="div" screenStyles={superWordScreenStyles}>
          <h1 className="title" aria-label="Super Word">
            <span className="title-bounce">S</span><span className="title-bounce">U</span><span className="title-bounce">P</span><span className="title-bounce">E</span><span className="title-bounce">R</span>
            <br />
            <span className="title-bounce">W</span><span className="title-bounce">O</span><span className="title-bounce">R</span><span className="title-bounce">D</span><span className="title-bounce">!</span>
          </h1>
          <p className="subtitle">Find hidden letters and solve the word puzzle!</p>
          <div className="start-actions">
            <button id="start-btn" className="btn btn-primary">Let's Go! 🚀</button>
            <div className="start-music-panel">
              <button
                id="start-music-toggle"
                type="button"
                className="music-toggle-btn music-toggle-btn-hero"
                data-music-toggle="true"
                data-music-on-label="Music On"
                data-music-off-label="Music Off"
                aria-pressed="false"
                aria-label="Turn chill music on"
              >
                <span className="music-toggle-glyph" aria-hidden="true">♪</span>
                <span data-music-toggle-label="true">Music Off</span>
              </button>
              <p className="start-music-note">Soft chill music. Tap to try it before you start.</p>
            </div>
          </div>
          <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Press Ⓐ to Start</p>
          <button data-settings-open="true" className="settings-toggle-btn" aria-label="Menu" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
          <p className="inspiration">Inspired by <a href="https://pbskids.org/superwhy" target="_blank" rel="noopener">Super Why!</a> from PBS Kids</p>
        </GameScreen>

        {/* Game Screen */}
        <GameScreen id="game-screen" as="div" screenStyles={superWordScreenStyles}>
          <GameHeader
            className="game-header"
            leftContent={<>
              <GameHeaderPill value={<span id="puzzle-counter" className="puzzle-counter" aria-label="Puzzle progress: 1 of 5">1 / 5</span>} />
              <GameHeaderPill icon="⭐" value={<span id="score" aria-label="Score: 0">0</span>} />
            </>}
            rightContent={<div className="game-header-right">
              <button
                id="hud-music-toggle"
                type="button"
                className="music-toggle-btn music-toggle-btn-inline"
                data-music-toggle="true"
                data-music-on-label="On"
                data-music-off-label="Off"
                aria-pressed="false"
                aria-label="Turn chill music on"
              >
                <span className="music-toggle-glyph" aria-hidden="true">♪</span>
                <span data-music-toggle-label="true">Off</span>
              </button>
              <button data-settings-open="true" className="settings-toggle-btn settings-toggle-btn-inline" aria-label="Menu" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">☰</button>
              <GameHeaderPill value={<span id="letters-count" className="letters-count" aria-label="Letters found: 0 of 3">0 / 3</span>} />
            </div>}
          />
          <div className="prompt-bubble">
            <span id="prompt-text" role="status">Find the letters!</span>
          </div>
          <div id="scene-wrapper">
            <div id="scene" role="group" aria-label="Find letters in the scene"></div>
          </div>
          <div className="collection-area notepad">
            <span id="letter-slots-label" className="collection-label notepad-label">Super Letters</span>
            <div id="letter-slots" role="listbox" aria-labelledby="letter-slots-label" aria-label="Collected letters — arrange to spell the word"></div>
            <div className="button-row">
              <button id="check-btn" className="btn btn-check" disabled>✓ Check Word!</button>
            </div>
          </div>
        </GameScreen>

        {/* Celebration Popup */}
        <div id="celebration-popup" className="celebration-popup" role="dialog" aria-modal="true" aria-labelledby="celebration-heading" aria-live="polite" hidden>
          <div className="celebration-content">
            <div className="celebration-stars" aria-hidden="true">⭐⭐⭐</div>
            <h2 id="celebration-heading" className="celebration-heading">Amazing!</h2>
            <div id="celebration-word" className="celebration-word"></div>
            <button id="celebration-continue-btn" className="btn btn-primary celebration-continue">Continue →</button>
          </div>
        </div>

        {/* Settings Modal */}
        <GameSettingsModal title="Menu" headingClassName="settings-heading" overlayStyles={superWordModalOverlayStyles}>

            <SettingsSection title="🎮 Controls">
              <div className="controls-grid">
                <div className="controls-column">
                  <h4>Keyboard / Touch</h4>
                  <ul className="controls-list">
                    <li>Click or tap items to collect</li>
                    <li>Arrow keys to navigate</li>
                    <li>Drag tiles to reorder</li>
                  </ul>
                </div>
                <div className="controls-column">
                  <h4>Gamepad</h4>
                  <ul className="controls-list">
                    <li><kbd>D-pad</kbd> Move between all items, tiles &amp; buttons</li>
                    <li><kbd>A</kbd> Pick up / Select / Check</li>
                    <li><kbd>Start</kbd> Play / Settings</li>
                  </ul>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="🧩 Game">
              <label htmlFor="puzzle-difficulty-select">Difficulty:</label>
              <select id="puzzle-difficulty-select" className="puzzle-select">
                <option value="starter">Starter · 2 letters</option>
                <option value="easy" selected>Easy · 3 letters</option>
                <option value="medium">Medium · 4 letters</option>
                <option value="hard">Hard · 5 letters</option>
                <option value="expert">Expert · 6 letters</option>
              </select>
              <p className="settings-help">Each round randomly picks 5 words from the selected difficulty, from high-frequency starter words to longer concrete words for fluent early readers.</p>
              <p className="settings-help">The tiers draw on Dolch and Fry high-frequency words, systematic phonics progressions, and Common Core K–3 reading patterns. <a href={superWordAttributionsPath}>See reading notes</a>.</p>
            </SettingsSection>

            <SettingsSection title="🎵 Audio">
              <SettingsToggle
                id="music-enabled-toggle"
                label="Chill music"
                helpText="Soft ambient synth music. It stays off until you turn it on."
              />
              <p className="settings-help">Sound effects stay on by default.</p>
            </SettingsSection>

            <SettingsSection title="Accessibility">
              <SettingsToggle
                id="reduce-motion-toggle"
                label="Reduce motion"
                helpText="Defaults to your device setting until you change it here."
                helpId="reduce-motion-help"
              />
            </SettingsSection>

            <SettingsSection title="© Credits &amp; License">
              <p>Code license: {attribution.codeLicense}</p>
              <p>{attribution.summary}</p>
              <a href={superWordAttributionsPath}>View full credits</a>
            </SettingsSection>

            <SettingsActions quitHref={homePath} showRestart={true} />
        </GameSettingsModal>

        {/* Level Complete Screen */}
        <GameScreen id="complete-screen" as="div" screenStyles={superWordScreenStyles}>
          <div className="complete-stars" aria-hidden="true">⭐⭐⭐</div>
          <h2 className="complete-heading">Amazing!</h2>
          <p className="complete-body">You spelled it correctly! 🎉</p>
          <div id="solved-word"></div>
          <button id="next-btn" className="btn btn-primary">Next Puzzle! →</button>
        </GameScreen>

        {/* Win Screen */}
        <GameScreen id="win-screen" as="div" screenStyles={superWordScreenStyles}>
          <div className="win-trophy" aria-hidden="true">🏆</div>
          <h2 className="win-heading">Super Reader!</h2>
          <p className="win-body">You solved all the puzzles! 🎊</p>
          <div id="final-score"></div>
          <div className="win-stars" aria-hidden="true">⭐⭐⭐⭐⭐</div>
          <button id="replay-btn" className="btn btn-primary">Play Again! 🔄</button>
        </GameScreen>

      </div>

      {/* Accessibility: aria-live regions */}
      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message">
          <p>Super Word needs JavaScript to run — it's a game after all! Enable JavaScript in your browser settings and refresh to play.</p>
        </div>
      </noscript>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
