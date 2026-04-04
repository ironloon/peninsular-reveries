import { renderToString } from 'remix/component/server'
import { getGameAttribution } from '../data/attributions.js'
import { Document } from '../ui/document.js'

export async function chompersAction() {
  const attribution = getGameAttribution('chompers')
  const html = await renderToString(
    <Document
      title="Chompers"
      description="Guide a geometric hippo and chomp falling fruit before it splats."
      path="/chompers/"
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
        <section id="start-screen" className="screen active" aria-labelledby="start-heading">
          <div className="start-shell">
            <p className="screen-kicker">Fruit Drop Frenzy</p>
            <h1 id="start-heading" className="start-title">Chompers</h1>
            <p className="start-subtitle">Slide the hippo under the fruit storm, click fast, and snap up anything juicy before it hits the floor.</p>

            <fieldset className="mode-picker" aria-labelledby="mode-picker-heading">
              <legend id="mode-picker-heading">Pick a mode</legend>

              <label className="mode-card" htmlFor="mode-rush" aria-label="Rush mode">
                <input id="mode-rush" type="radio" name="game-mode" value="rush" checked />
                <span className="mode-card-copy">
                  <strong>Rush</strong>
                  <span>60 seconds. Missed fruit is just a lost chance.</span>
                </span>
              </label>

              <label className="mode-card" htmlFor="mode-survival" aria-label="Survival mode">
                <input id="mode-survival" type="radio" name="game-mode" value="survival" />
                <span className="mode-card-copy">
                  <strong>Survival</strong>
                  <span>3 hearts. Miss a fruit or bite a bomb and you pay for it.</span>
                </span>
              </label>
            </fieldset>

            <div className="start-actions">
              <button id="start-btn" className="chomp-btn chomp-btn-primary">Start Chomping</button>
              <button id="settings-open" className="chomp-btn chomp-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">How To Play</button>
            </div>

            <ul className="start-notes" aria-label="Quick tips">
              <li>Move with your pointer or the arrow keys.</li>
              <li>Click, tap, or press Space to chomp.</li>
              <li>Golden stars are rare and worth a lot.</li>
            </ul>
          </div>
        </section>

        <section id="game-screen" className="screen" aria-labelledby="game-screen-heading">
          <div className="game-shell">
            <h2 id="game-screen-heading" className="sr-only">Chompers game screen</h2>

            <div className="game-hud" aria-label="Game status">
              <div className="hud-group">
                <span id="mode-chip" className="hud-chip">Rush</span>
                <span id="score" className="hud-score" aria-label="Score: 0">0</span>
              </div>
              <div className="hud-group hud-group-right">
                <span id="timer-readout" className="hud-pill" role="timer">60.0s</span>
                <span id="lives-readout" className="hud-pill" hidden>♥♥♥</span>
                <span id="combo-readout" className="hud-pill">Combo x0</span>
              </div>
            </div>

            <p id="arena-instructions" className="arena-instructions">Move underneath the falling fruit, then chomp upward. Arrow keys move left and right. Space chomps.</p>

            <div id="game-arena" className="game-arena" role="group" aria-label="Fruit drop arena" aria-describedby="arena-instructions">
              <div className="arena-sunburst" aria-hidden="true"></div>
              <div className="arena-grid" aria-hidden="true"></div>
              <div id="item-layer" className="item-layer" aria-hidden="true"></div>
              <div id="effect-layer" className="effect-layer" aria-hidden="true"></div>
              <div id="chomp-column" className="chomp-column" aria-hidden="true"></div>
              <div className="ground-band" aria-hidden="true"></div>
              <div id="hippo" className="hippo" aria-hidden="true">
                <div className="hippo-neck"></div>
                <div className="hippo-head">
                  <span className="hippo-ear hippo-ear-left"></span>
                  <span className="hippo-ear hippo-ear-right"></span>
                  <span className="hippo-eye hippo-eye-left"><span className="hippo-pupil"></span></span>
                  <span className="hippo-eye hippo-eye-right"><span className="hippo-pupil"></span></span>
                  <span className="hippo-nostril hippo-nostril-left"></span>
                  <span className="hippo-nostril hippo-nostril-right"></span>
                  <div className="hippo-jaw">
                    <span className="hippo-tooth hippo-tooth-left"></span>
                    <span className="hippo-tooth hippo-tooth-right"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="game-toolbar">
              <button id="chomp-btn" className="chomp-btn chomp-btn-primary">Chomp!</button>
              <button id="game-settings-open" className="chomp-btn chomp-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Settings</button>
            </div>
          </div>
        </section>

        <section id="end-screen" className="screen" aria-labelledby="end-heading">
          <div className="end-shell">
            <p className="screen-kicker">Round Complete</p>
            <h2 id="end-heading" className="end-title">Nice Chomping.</h2>
            <p id="end-summary" className="end-summary">The orchard barely stood a chance.</p>

            <dl className="results-grid">
              <div className="result-card">
                <dt>Score</dt>
                <dd id="final-score">0</dd>
              </div>
              <div className="result-card">
                <dt>Fruit Chomped</dt>
                <dd id="final-chomped">0</dd>
              </div>
              <div className="result-card">
                <dt>Misses</dt>
                <dd id="final-missed">0</dd>
              </div>
              <div className="result-card">
                <dt>Best Combo</dt>
                <dd id="final-combo">0</dd>
              </div>
            </dl>

            <div className="start-actions">
              <button id="replay-btn" className="chomp-btn chomp-btn-primary">Play Again</button>
              <button id="menu-btn" className="chomp-btn chomp-btn-secondary">Pick Another Mode</button>
            </div>
          </div>
        </section>
      </div>

      <div id="settings-modal" className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-heading" tabIndex={-1} hidden>
        <div className="settings-content">
          <h2 id="settings-heading">How To Play</h2>

          <section className="settings-section">
            <h3>Controls</h3>
            <ul className="settings-list">
              <li>Pointer or touch: move under the fruit and tap to chomp.</li>
              <li>Keyboard: Arrow keys move, Space or Enter chomps.</li>
              <li>Gamepad: left stick or D-pad moves, A chomps.</li>
            </ul>
          </section>

          <section className="settings-section">
            <h3>Modes</h3>
            <p>Rush is a 60-second score sprint. Survival gives you 3 hearts and ends when you run out.</p>
          </section>

          <section className="settings-section">
            <h3>Credits &amp; License</h3>
            <p className="settings-copy"><span className="settings-label">Code license:</span> {attribution.codeLicense}</p>
            <p className="settings-copy">{attribution.summary}</p>
            {attribution.entries.map((entry) => (
              <article className="settings-attribution" aria-label={`${entry.title} credit`}>
                <h4>{entry.title}</h4>
                <p className="settings-copy"><span className="settings-label">Type:</span> {entry.type}</p>
                <p className="settings-copy"><span className="settings-label">Creator:</span> {entry.creator}</p>
                <p className="settings-copy"><span className="settings-label">Used in:</span> {entry.usedIn}</p>
                <p className="settings-copy"><span className="settings-label">Source:</span> {entry.source}</p>
                <p className="settings-copy"><span className="settings-label">License:</span> {entry.license}</p>
              </article>
            ))}
          </section>

          <div className="settings-actions">
            <button id="settings-close" className="chomp-btn chomp-btn-primary">Close</button>
          </div>
        </div>
      </div>

      <div id="game-status" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      <div id="game-feedback" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

      <noscript>
        <div className="noscript-message">
          <p>Chompers needs JavaScript to animate the falling fruit and the hippo. Enable JavaScript and refresh to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}