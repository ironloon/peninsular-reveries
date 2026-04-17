import { renderToString } from '@remix-run/component/server'
import { getGameAttribution } from '../../app/data/attribution-index.js'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameHeaderPill, GameTabbedModal, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'

const chompersModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(5, 16, 14, 0.82)',
}

export async function chompersAction() {
  const attribution = getGameAttribution('chompers')
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const infoPagePath = withBasePath('/chompers/info/', siteBasePath)
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
    >
      <div className="scene-track">

        {/* Start Screen */}
        <section id="start-screen" className="game-screen" aria-labelledby="start-heading">
          <div className="start-shell">
            <h1 id="start-heading" className="start-title">Chompers</h1>
            <p className="start-kicker">Pick the right answer and feed the hippo!</p>

          <div className="area-picker">
              <h2 className="area-picker-heading">Choose a math area:</h2>

              <div className="area-picker-grid">
                <button className="area-card-btn" data-area="matching" aria-label="Matching: Find the displayed number">
                  <span className="area-card-icon" aria-hidden="true">⭐</span>
                  <span className="area-card-copy">
                    <strong>Matching</strong>
                    <span>Find the number</span>
                  </span>
                </button>

                <button className="area-card-btn" data-area="counting" aria-label="Counting: Count the objects">
                  <span className="area-card-icon" aria-hidden="true">🔢</span>
                  <span className="area-card-copy">
                    <strong>Counting</strong>
                    <span>Count the objects</span>
                  </span>
                </button>

                <button className="area-card-btn" data-area="addition" aria-label="Addition: Add numbers together">
                  <span className="area-card-icon" aria-hidden="true">➕</span>
                  <span className="area-card-copy">
                    <strong>Addition</strong>
                    <span>Add numbers together</span>
                  </span>
                </button>

                <button className="area-card-btn" data-area="subtraction" aria-label="Subtraction: Take numbers away">
                  <span className="area-card-icon" aria-hidden="true">➖</span>
                  <span className="area-card-copy">
                    <strong>Subtraction</strong>
                    <span>Take numbers away</span>
                  </span>
                </button>

                <button className="area-card-btn" data-area="multiplication" aria-label="Multiplication: Times tables">
                  <span className="area-card-icon" aria-hidden="true">✖️</span>
                  <span className="area-card-copy">
                    <strong>Multiplication</strong>
                    <span>Times tables</span>
                  </span>
                </button>

                <button className="area-card-btn" data-area="division" aria-label="Division: Split numbers up">
                  <span className="area-card-icon" aria-hidden="true">➗</span>
                  <span className="area-card-copy">
                    <strong>Division</strong>
                    <span>Split numbers up</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="start-actions">
              <button data-settings-open="true" className="chomp-btn chomp-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
            </div>

            <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Ⓐ choose · Start for menu</p>
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
              <GameHeaderPill className="hud-chip" value={<span id="area-chip">matching · Level 1 ★</span>} />
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

          <div id="game-arena" className="game-arena" role="group" aria-label="Answer choices">
            <div id="scene-items" className="scene-items"></div>

            <div id="hippo" aria-hidden="true">
              <div className="hippo-head">
                <div className="hippo-ear-left"></div>
                <div className="hippo-ear-right"></div>
                <div className="hippo-eye-left"></div>
                <div className="hippo-eye-right"></div>
                <div className="hippo-nostril-left"></div>
                <div className="hippo-nostril-right"></div>
                <div className="hippo-jaw">
                  <div className="hippo-tooth-left"></div>
                  <div className="hippo-tooth-right"></div>
                </div>
              </div>
              <div className="hippo-neck"></div>
              <div className="hippo-body"></div>
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
              <button id="menu-btn" className="chomp-btn chomp-btn-secondary">Choose Area</button>
            </div>
          </div>
        </section>
      </div>

      <GameTabbedModal
        title="Menu"
        overlayStyles={chompersModalOverlayStyles}
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="Audio">
            <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
            <div id="music-track-picker-slot"></div>
            <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
          </SettingsSection>

          <SettingsSection title="Controls">
            <p className="settings-copy">Tap or click a fruit to choose your answer. Use arrow keys or D-pad to navigate, Enter/Space or A to select, and Start to open the menu.</p>
          </SettingsSection>

          <SettingsSection title="Accessibility">
            <SettingsToggle
              id="reduce-motion-toggle"
              label="Reduce motion"
              helpText="Defaults to your device setting until you change it here."
              helpId="reduce-motion-help"
            />
          </SettingsSection>
        </>}
        infoContent={<>
          <InfoSection title="About Chompers">
            <p>{attribution.summary}</p>
          </InfoSection>
          <p className="info-more-link"><a href={infoPagePath}>More info, credits &amp; attributions →</a></p>
        </>}
      />

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
