import { renderToString } from 'remix/component/server'
import { getGameAttribution } from '../data/attributions/index.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'
import { GameSettingsModal, SrOnly } from '../ui/game-shell.js'

const chompersModalOverlayStyles = {
  zIndex: 200,
  background: 'rgba(5, 16, 14, 0.82)',
}

export async function chompersAction() {
  const attribution = getGameAttribution('chompers')
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Chompers"
      description="Pick the right answer and feed the hippo a tasty fruit!"
      path="/chompers/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/chompers.css']}
      includeDefaultStyles={false}
      scripts={['/client/chompers/main.js']}
      bodyClass="chompers-game"
      viewportFitCover
      manifestPath="/chompers/manifest.json"
      serviceWorkerPath="/chompers/sw.js"
      serviceWorkerScope="/chompers/"
    >
      <div className="scene-track">

        {/* Start Screen */}
        <section id="start-screen" className="game-screen" aria-labelledby="start-heading">
          <div className="start-shell">
            <h1 id="start-heading" className="start-title">Chompers</h1>
            <p className="start-kicker">Pick the right answer and feed the hippo!</p>

            <fieldset className="area-picker">
              <legend>Choose a math area:</legend>

              <div className="area-picker-grid">
                <label className="area-card" htmlFor="area-matching" aria-label="Matching: Find the displayed number">
                  <input id="area-matching" type="radio" name="area" value="matching" className="area-radio" checked />
                  <span className="area-card-copy">
                    <strong>Matching ⭐</strong>
                    <span>Find the number</span>
                  </span>
                  <div className="level-selector" role="group" aria-label="Level for Matching">
                    <label><input type="radio" name="level-matching" value="1" checked /><span>L1</span></label>
                    <label><input type="radio" name="level-matching" value="2" /><span>L2</span></label>
                    <label><input type="radio" name="level-matching" value="3" /><span>L3</span></label>
                  </div>
                </label>

                <label className="area-card" htmlFor="area-counting" aria-label="Counting: Count the objects">
                  <input id="area-counting" type="radio" name="area" value="counting" className="area-radio" />
                  <span className="area-card-copy">
                    <strong>Counting 🔢</strong>
                    <span>Count the objects</span>
                  </span>
                  <div className="level-selector" role="group" aria-label="Level for Counting">
                    <label><input type="radio" name="level-counting" value="1" checked /><span>L1</span></label>
                    <label><input type="radio" name="level-counting" value="2" /><span>L2</span></label>
                    <label><input type="radio" name="level-counting" value="3" /><span>L3</span></label>
                  </div>
                </label>

                <label className="area-card" htmlFor="area-addition" aria-label="Addition: Add numbers together">
                  <input id="area-addition" type="radio" name="area" value="addition" className="area-radio" />
                  <span className="area-card-copy">
                    <strong>Addition ➕</strong>
                    <span>Add numbers together</span>
                  </span>
                  <div className="level-selector" role="group" aria-label="Level for Addition">
                    <label><input type="radio" name="level-addition" value="1" checked /><span>L1</span></label>
                    <label><input type="radio" name="level-addition" value="2" /><span>L2</span></label>
                    <label><input type="radio" name="level-addition" value="3" /><span>L3</span></label>
                  </div>
                </label>

                <label className="area-card" htmlFor="area-subtraction" aria-label="Subtraction: Take numbers away">
                  <input id="area-subtraction" type="radio" name="area" value="subtraction" className="area-radio" />
                  <span className="area-card-copy">
                    <strong>Subtraction ➖</strong>
                    <span>Take numbers away</span>
                  </span>
                  <div className="level-selector" role="group" aria-label="Level for Subtraction">
                    <label><input type="radio" name="level-subtraction" value="1" checked /><span>L1</span></label>
                    <label><input type="radio" name="level-subtraction" value="2" /><span>L2</span></label>
                    <label><input type="radio" name="level-subtraction" value="3" /><span>L3</span></label>
                  </div>
                </label>

                <label className="area-card" htmlFor="area-multiplication" aria-label="Multiplication: Times tables">
                  <input id="area-multiplication" type="radio" name="area" value="multiplication" className="area-radio" />
                  <span className="area-card-copy">
                    <strong>Multiplication ✖️</strong>
                    <span>Times tables</span>
                  </span>
                  <div className="level-selector" role="group" aria-label="Level for Multiplication">
                    <label><input type="radio" name="level-multiplication" value="1" checked /><span>L1</span></label>
                    <label><input type="radio" name="level-multiplication" value="2" /><span>L2</span></label>
                    <label><input type="radio" name="level-multiplication" value="3" /><span>L3</span></label>
                  </div>
                </label>

                <label className="area-card" htmlFor="area-division" aria-label="Division: Split numbers up">
                  <input id="area-division" type="radio" name="area" value="division" className="area-radio" />
                  <span className="area-card-copy">
                    <strong>Division ➗</strong>
                    <span>Split numbers up</span>
                  </span>
                  <div className="level-selector" role="group" aria-label="Level for Division">
                    <label><input type="radio" name="level-division" value="1" checked /><span>L1</span></label>
                    <label><input type="radio" name="level-division" value="2" /><span>L2</span></label>
                    <label><input type="radio" name="level-division" value="3" /><span>L3</span></label>
                  </div>
                </label>
              </div>
            </fieldset>

            <div className="start-actions">
              <button id="start-btn" className="chomp-btn chomp-btn-primary">Start Chomping</button>
              <button data-settings-open="true" className="chomp-btn chomp-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
            </div>
          </div>
        </section>

        {/* Game Screen */}
        <section id="game-screen" className="game-screen game-screen-play" aria-labelledby="game-screen-label" hidden aria-hidden="true">
          <h2 id="game-screen-label" className="sr-only">Chompers</h2>

          <div id="game-hud" className="game-hud" aria-label="Game status">
            <span id="score" className="hud-score" aria-label="Score: 0">0</span>
            <span id="round-progress" className="hud-pill">1 / 10</span>
            <span id="lives" className="hud-lives" aria-label="Lives: 3">♥♥♥</span>
            <span id="streak" className="hud-streak" hidden>🔥0</span>
            <span id="area-chip" className="hud-chip">matching · L1</span>
            <button
              id="settings-btn"
              className="chomp-btn chomp-btn-icon"
              data-settings-open="true"
              aria-haspopup="dialog"
              aria-controls="settings-modal"
              aria-expanded="false"
              aria-label="Menu"
            >☰</button>
          </div>

          <p id="problem-prompt" className="problem-prompt" role="status" aria-live="polite">Loading…</p>

          <div id="game-arena" className="game-arena" role="group" aria-label="Answer choices">
            <div id="scene-items" className="scene-items"></div>

            <div id="hippo" aria-hidden="true">
              <div className="hippo-ear hippo-ear-left"></div>
              <div className="hippo-ear hippo-ear-right"></div>
              <div className="hippo-body"></div>
              <div className="hippo-neck">
                <img
                  src={withBasePath('/chompers/hippo-head.svg', siteBasePath)}
                  className="hippo-head"
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>

            <div id="effect-layer" aria-hidden="true"></div>
          </div>
        </section>

        {/* End Screen */}
        <section id="end-screen" className="game-screen" aria-labelledby="end-heading" hidden aria-hidden="true">
          <div className="end-shell">
            <h2 id="end-heading" className="end-title">Nice Work!</h2>

            <dl className="results-grid">
              <div className="result-card">
                <dt>Score</dt>
                <dd id="end-score">0</dd>
              </div>
              <div className="result-card">
                <dt>Accuracy</dt>
                <dd id="end-accuracy">0%</dd>
              </div>
              <div className="result-card">
                <dt>Rounds</dt>
                <dd id="end-rounds">0 of 10</dd>
              </div>
              <div className="result-card">
                <dt>Best Streak</dt>
                <dd id="end-streak">0</dd>
              </div>
            </dl>

            <div className="start-actions">
              <button id="replay-btn" className="chomp-btn chomp-btn-primary">Play Again</button>
              <button id="menu-btn" className="chomp-btn chomp-btn-secondary">Change Level</button>
            </div>
          </div>
        </section>
      </div>

      <GameSettingsModal title="Menu" overlayStyles={chompersModalOverlayStyles}>

        <section className="settings-section">
          <h3>Controls</h3>
          <p className="settings-copy">Tap or click a fruit to choose your answer. Use arrow keys or D-pad to navigate, Enter/Space to select.</p>
        </section>

        <section className="settings-section">
          <h3>Math areas</h3>
          <ul className="settings-list">
            <li><strong>Matching ⭐</strong> — Find the displayed number among tiles</li>
            <li><strong>Counting 🔢</strong> — Count objects and tap the matching number</li>
            <li><strong>Addition ➕</strong> — Add numbers together</li>
            <li><strong>Subtraction ➖</strong> — Take numbers away</li>
            <li><strong>Multiplication ✖️</strong> — Times tables</li>
            <li><strong>Division ➗</strong> — Split numbers up</li>
          </ul>
        </section>

        <section className="settings-section">
          <h3>Accessibility</h3>
          <label className="settings-toggle-row" htmlFor="reduce-motion-toggle">
            <span>Reduce motion</span>
            <input type="checkbox" id="reduce-motion-toggle" />
          </label>
          <p id="reduce-motion-help" className="settings-copy settings-help">Defaults to your device setting until you change it here.</p>
        </section>

        <section className="settings-section">
          <h3>Credits &amp; License</h3>
          <p className="settings-copy"><span className="settings-label">Code license:</span> {attribution.codeLicense}</p>
          <p className="settings-copy">{attribution.summary}</p>
          <ul className="settings-list">
            {attribution.entries.map((entry) => (
              <li>Audio: {entry.title} by {entry.creator} ({entry.license})</li>
            ))}
          </ul>
        </section>

        <footer className="settings-actions">
          <button id="restart-btn" type="button" className="chomp-btn chomp-btn-secondary settings-restart-btn">Restart</button>
          <a href={homePath} className="chomp-btn chomp-btn-secondary settings-quit-link">Quit</a>
          <button id="settings-close-btn" type="button" className="chomp-btn chomp-btn-primary">Close</button>
        </footer>

      </GameSettingsModal>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <p>Please enable JavaScript to play Chompers.</p>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
