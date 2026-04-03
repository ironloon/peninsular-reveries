import { renderToString } from 'remix/component/server'
import { Document } from '../ui/document.js'
import { getGameAttribution } from '../data/attributions.js'

export async function superWordAction() {
  const attribution = getGameAttribution('super-word')
  const html = await renderToString(
    <Document
      title="Super Word"
      description="Find hidden letters and spell the secret word."
      path="/super-word/"
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
        <div id="start-screen" className="screen active">
          <h1 className="title" aria-label="Super Word">
            <span className="title-bounce">S</span><span className="title-bounce">U</span><span className="title-bounce">P</span><span className="title-bounce">E</span><span className="title-bounce">R</span>
            <br />
            <span className="title-bounce">W</span><span className="title-bounce">O</span><span className="title-bounce">R</span><span className="title-bounce">D</span><span className="title-bounce">!</span>
          </h1>
          <p className="subtitle">Find hidden letters and solve the word puzzle!</p>
          <button id="start-btn" className="btn btn-primary">Let's Go! 🚀</button>
          <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Press Ⓐ to Start</p>
          <button id="settings-open" className="settings-toggle-btn" aria-label="Settings" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">⚙️ Settings</button>
          <p className="inspiration">Inspired by <a href="https://pbskids.org/superwhy" target="_blank" rel="noopener">Super Why!</a> from PBS Kids</p>
        </div>

        {/* Game Screen */}
        <div id="game-screen" className="screen">
          <div className="game-header">
            <div className="game-header-left">
              <span id="puzzle-counter" className="puzzle-counter" aria-label="Puzzle progress">1 / 5</span>
              <span id="score" className="score" aria-label="Score: 0">⭐ 0</span>
            </div>
            <div className="game-header-right">
              <span id="letters-count" className="letters-count">0 / 3</span>
            </div>
          </div>
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
        </div>

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
        <div id="settings-modal" className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-heading" tabIndex={-1} hidden>
          <div className="settings-content">
            <h2 id="settings-heading" className="settings-heading">⚙️ Settings</h2>

            <div className="settings-section">
              <h3 className="settings-section-title">🎮 Controls</h3>
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
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">🧩 Game</h3>
              <label htmlFor="puzzle-difficulty-select">Difficulty:</label>
              <select id="puzzle-difficulty-select" className="puzzle-select">
                <option value="starter">Starter · 2 letters</option>
                <option value="easy" selected>Easy · 3 letters</option>
                <option value="medium">Medium · 4 letters</option>
                <option value="hard">Hard · 5 letters</option>
                <option value="expert">Expert · 6 letters</option>
              </select>
              <p className="settings-help">Each round randomly picks 5 words from the selected difficulty, from sight-word tiny terms to longer chapter-book words.</p>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">🎵 Audio</h3>
              <label className="settings-toggle-row" htmlFor="music-enabled-toggle">
                <span>Chill music</span>
                <input type="checkbox" id="music-enabled-toggle" />
              </label>
              <p className="settings-help">Soft ambient synth music. It stays off until you turn it on.</p>
              <p className="settings-help">Sound effects stay on by default.</p>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">© Credits &amp; License</h3>
              <p className="settings-help"><span className="settings-detail-label">Code license:</span> {attribution.codeLicense}</p>
              <p className="settings-help">{attribution.summary}</p>
              <div className="settings-attributions">
                {attribution.entries.map((entry) => (
                  <article className="settings-attribution-card" aria-label={`${entry.title} credit`}>
                    <h4 className="settings-attribution-title">{entry.title}</h4>
                    <p className="settings-attribution-meta">{entry.type} · {entry.creator}</p>
                    <p className="settings-attribution-copy"><span className="settings-detail-label">Used in:</span> {entry.usedIn}</p>
                    <p className="settings-attribution-copy">
                      <span className="settings-detail-label">Source:</span>{' '}
                      {entry.sourceUrl
                        ? <a href={entry.sourceUrl} target="_blank" rel="noopener">{entry.source}</a>
                        : entry.source}
                    </p>
                    <p className="settings-attribution-copy">
                      <span className="settings-detail-label">License:</span>{' '}
                      {entry.licenseUrl
                        ? <a href={entry.licenseUrl} target="_blank" rel="noopener">{entry.license}</a>
                        : entry.license}
                    </p>
                    <p className="settings-attribution-copy"><span className="settings-detail-label">Modifications:</span> {entry.modifications}</p>
                    {entry.notes ? <p className="settings-attribution-copy"><span className="settings-detail-label">Notes:</span> {entry.notes}</p> : null}
                  </article>
                ))}
              </div>
            </div>

            <div className="settings-actions">
              <button id="settings-play-btn" className="btn btn-primary settings-play-btn">▶️ Play!</button>
              <button id="settings-close" className="btn settings-close-btn">Close</button>
            </div>
          </div>
        </div>

        {/* Level Complete Screen */}
        <div id="complete-screen" className="screen">
          <div className="complete-stars" aria-hidden="true">⭐⭐⭐</div>
          <h2 className="complete-heading">Amazing!</h2>
          <p className="complete-body">You spelled it correctly! 🎉</p>
          <div id="solved-word"></div>
          <button id="next-btn" className="btn btn-primary">Next Puzzle! →</button>
        </div>

        {/* Win Screen */}
        <div id="win-screen" className="screen">
          <div className="win-trophy" aria-hidden="true">🏆</div>
          <h2 className="win-heading">Super Reader!</h2>
          <p className="win-body">You solved all the puzzles! 🎊</p>
          <div id="final-score"></div>
          <div className="win-stars" aria-hidden="true">⭐⭐⭐⭐⭐</div>
          <button id="replay-btn" className="btn btn-primary">Play Again! 🔄</button>
        </div>

      </div>

      {/* Accessibility: aria-live regions */}
      <div id="game-status" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      <div id="game-feedback" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

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
