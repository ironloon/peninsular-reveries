import { renderToString } from 'remix/component/server'
import { attributionsPagePath, getGameAttribution } from '../data/attributions/index.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'
import { GameHeader, GameHeaderPill, GameSettingsModal, SettingsActions, SettingsSection, SettingsToggle, SrOnly } from '../ui/game-shell.js'

const chompersModalOverlayStyles = {
  zIndex: 100,
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

            {/* Mode selector */}
            <div className="mode-selector" role="group" aria-label="Game mode">
              <button id="mode-normal-btn" className="mode-toggle-btn" aria-pressed="true" type="button">Normal</button>
              <button id="mode-frenzy-btn" className="mode-toggle-btn" aria-pressed="false" type="button">Frenzy ⚡</button>
            </div>

            {/* Frenzy config — hidden until Frenzy mode selected */}
            <div id="frenzy-config" hidden>
              <fieldset className="frenzy-fieldset">
                <legend>Opponents</legend>
                <div className="mode-radio-group">
                  <label><input type="radio" name="npc-count" value="1" checked /><span>1</span></label>
                  <label><input type="radio" name="npc-count" value="3" /><span>3</span></label>
                  <label><input type="radio" name="npc-count" value="5" /><span>5</span></label>
                </div>
              </fieldset>
              <fieldset className="frenzy-fieldset">
                <legend>Match type</legend>
                <div className="mode-radio-group">
                  <label><input type="radio" name="team-mode" value="ffa" checked /><span>Free-for-all</span></label>
                  <label><input type="radio" name="team-mode" value="team" /><span>Teams</span></label>
                </div>
              </fieldset>
              <div className="frenzy-field">
                <p className="frenzy-field-label">Your color</p>
                <div id="player-color-picker">
                  <button className="color-swatch active" data-color="#FF6B6B" style={{ background: '#FF6B6B' }} aria-label="Select color 1" type="button"></button>
                  <button className="color-swatch" data-color="#4ECDC4" style={{ background: '#4ECDC4' }} aria-label="Select color 2" type="button"></button>
                  <button className="color-swatch" data-color="#45B7D1" style={{ background: '#45B7D1' }} aria-label="Select color 3" type="button"></button>
                  <button className="color-swatch" data-color="#96CEB4" style={{ background: '#96CEB4' }} aria-label="Select color 4" type="button"></button>
                  <button className="color-swatch" data-color="#FFEAA7" style={{ background: '#FFEAA7' }} aria-label="Select color 5" type="button"></button>
                  <button className="color-swatch" data-color="#DDA0DD" style={{ background: '#DDA0DD' }} aria-label="Select color 6" type="button"></button>
                  <button className="color-swatch" data-color="#98D8C8" style={{ background: '#98D8C8' }} aria-label="Select color 7" type="button"></button>
                  <button className="color-swatch" data-color="#F7DC6F" style={{ background: '#F7DC6F' }} aria-label="Select color 8" type="button"></button>
                </div>
              </div>
            </div>

            <div className="start-actions">
              <button id="start-btn" className="chomp-btn chomp-btn-primary">Start Chomping</button>
              <button data-settings-open="true" className="chomp-btn chomp-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
            </div>
          </div>
        </section>

        {/* Game Screen */}
        <section id="game-screen" className="game-screen game-screen-play" aria-labelledby="game-screen-label" hidden aria-hidden="true">
          <h2 id="game-screen-label" className="sr-only">Chompers</h2>

          <GameHeader
            className="game-hud"
            leftContent={<>
              <GameHeaderPill label="Score" className="hud-score" value={<span id="score">0</span>} />
              <GameHeaderPill className="hud-pill" value={<span id="round-progress">1 / 10</span>} />
              <GameHeaderPill label="Lives" className="hud-lives" value={<span id="lives">♥♥♥</span>} />
              <span id="streak" className="hud-streak" hidden>🔥0</span>
              <GameHeaderPill className="hud-chip" value={<span id="area-chip">matching · L1</span>} />
            </>}
            rightContent={
              <button
                id="settings-btn"
                className="chomp-btn chomp-btn-icon"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
                aria-label="Menu"
              >☰</button>
            }
          />

          <p id="problem-prompt" className="problem-prompt" role="status" aria-live="polite">Loading…</p>

          {/* Frenzy round timer bar */}
          <div id="round-timer-bar" hidden><div id="round-timer-fill"></div></div>

          <div id="game-arena" className="game-arena" role="group" aria-label="Answer choices">
            <div id="scene-items" className="scene-items"></div>

            {/* Frenzy NPC hippos (hidden until frenzy mode active) */}
            <div className="hippo npc-hippo" id="npc-hippo-0" hidden aria-hidden="true"></div>
            <div className="hippo npc-hippo" id="npc-hippo-1" hidden aria-hidden="true"></div>
            <div className="hippo npc-hippo" id="npc-hippo-2" hidden aria-hidden="true"></div>
            <div className="hippo npc-hippo" id="npc-hippo-3" hidden aria-hidden="true"></div>
            <div className="hippo npc-hippo" id="npc-hippo-4" hidden aria-hidden="true"></div>

            {/* Frenzy scoreboard */}
            <div id="frenzy-scoreboard" hidden aria-hidden="true"></div>

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

            {/* Frenzy end results (populated by JS in frenzy mode) */}
            <div id="frenzy-result" hidden></div>

            <div className="start-actions">
              <button id="replay-btn" className="chomp-btn chomp-btn-primary">Play Again</button>
              <button id="menu-btn" className="chomp-btn chomp-btn-secondary">Change Level</button>
            </div>
          </div>
        </section>
      </div>

      <GameSettingsModal title="Menu" overlayStyles={chompersModalOverlayStyles}>

        <SettingsSection title="Controls">
          <p className="settings-copy">Tap or click a fruit to choose your answer. Use arrow keys or D-pad to navigate, Enter/Space to select.</p>
        </SettingsSection>

        <SettingsSection title="Math areas">
          <ul className="settings-list">
            <li><strong>Matching ⭐</strong> — Find the displayed number among tiles</li>
            <li><strong>Counting 🔢</strong> — Count objects and tap the matching number</li>
            <li><strong>Addition ➕</strong> — Add numbers together</li>
            <li><strong>Subtraction ➖</strong> — Take numbers away</li>
            <li><strong>Multiplication ✖️</strong> — Times tables</li>
            <li><strong>Division ➗</strong> — Split numbers up</li>
          </ul>
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <SettingsToggle
            id="reduce-motion-toggle"
            label="Reduce motion"
            helpText="Defaults to your device setting until you change it here."
            helpId="reduce-motion-help"
          />
        </SettingsSection>

        <SettingsSection title="Credits & License">
          <p>Code license: {attribution.codeLicense}</p>
          <p>{attribution.summary}</p>
          <a href={withBasePath(`${attributionsPagePath}#${attribution.slug}`, siteBasePath)}>View full credits</a>
        </SettingsSection>

        <SettingsActions quitHref={homePath} quitClassName="chomp-btn chomp-btn-secondary" showRestart={true} />

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
