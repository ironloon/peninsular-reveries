import { renderToString } from '@remix-run/component/server'
import { getGameInfo } from '../../app/data/attribution-index.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameHeaderPill, GameScreen, GameTabbedModal, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'

import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'

const superWordScreenStyles = {
  transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
}

const superWordModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(0, 0, 0, 0.6)',
}

export async function superWordAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const infoPagePath = withBasePath('/super-word/info/', siteBasePath)
  const info = getGameInfo('super-word')
  const html = await renderToString(
    <Document
      title="Super Word"
      description="Find hidden letters and spell the secret word."
      path="/super-word/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/game.css', '/styles/super-word.css']}
      includeDefaultStyles={false}
      scripts={['/client/super-word/main.js']}
      bodyClass="super-word-game"
      viewportFitCover
      faviconPath="/favicon-game-super-word.svg"
      manifestPath="/super-word/manifest.json"
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
          <div className="difficulty-picker">
            <p className="difficulty-heading">Choose your level:</p>
            <div className="difficulty-grid">
              <button className="btn btn-difficulty" data-difficulty="sidekick" type="button">⭐ Sidekick</button>
              <button className="btn btn-difficulty" data-difficulty="hero" type="button">🦸 Hero</button>
              <button className="btn btn-difficulty" data-difficulty="super" type="button">💫 Super</button>
              <button className="btn btn-difficulty" data-difficulty="ultra" type="button">⚡ Ultra</button>
              <button className="btn btn-difficulty" data-difficulty="legend" type="button">🏆 Legend</button>
            </div>
          </div>
          <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Ⓐ to play · Start for menu</p>
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
              <button data-settings-open="true" className="settings-toggle-btn settings-toggle-btn-inline" aria-label="Menu" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">☰</button>
              <GameHeaderPill value={<span id="letters-count" className="letters-count" aria-label="Letters found: 0 of 3">0 / 3</span>} />
            </div>}
          />
          <div className="prompt-bubble">
            <span id="prompt-text" role="status">Find the letters!</span>
          </div>
          <div id="scene-wrapper">
            <canvas id="scene-canvas" role="img" aria-label="Game scene with letters and objects"></canvas>
            <div id="scene-a11y" role="group" aria-label="Interactive scene items" className="sr-overlay"></div>
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
        <GameTabbedModal
          title="Menu"
          overlayStyles={superWordModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
              <div id="music-track-picker-slot"></div>
              <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
            </SettingsSection>
            <SettingsSection title="Controls">
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
            <SettingsSection title="Accessibility">
              <SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Defaults to your device setting until you change it here." helpId="reduce-motion-help" />
            </SettingsSection>
            <SettingsSection title="Level">
              <select id="difficulty-select" className="puzzle-select" defaultValue="hero" aria-label="Level">
                <option value="sidekick">⭐ Sidekick</option>
                <option value="hero">🦸 Hero</option>
                <option value="super">💫 Super</option>
                <option value="ultra">⚡ Ultra</option>
                <option value="legend">🏆 Legend</option>
              </select>
            </SettingsSection>
          </>}
          infoContent={<>
            <InfoSection title="About Super Word">
              <p>{info.summary}</p>
            </InfoSection>
            <p className="info-more-link"><a href={infoPagePath}>More info, credits &amp; attributions →</a></p>
          </>}
        />

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
