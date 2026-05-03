import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import {
  GameHeader,
  GameScreen,
  GameTabbedModal,
  InfoAttribution,
  InfoSection,
  SettingsSection,
  SettingsToggle,
  SrOnly,
} from '../../app/ui/game-shell.js'

import { bakingSimulatorAttribution } from './attributions.js'
import { bakingSimulatorInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(44, 24, 16, 0.92)',
}

export async function bakingSimulatorAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Baking Simulator"
      description="Mix, knead, shape, proof, and bake your way to the perfect loaf!"
      path="/baking-simulator/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/baking-simulator.css']}
      scripts={[`/client/baking-simulator/main.js?v=__BUILD_SHA__`]}
      bodyClass="baking-simulator-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/baking-simulator/manifest.json"
      serviceWorkerPath="/baking-simulator/sw.js"
      serviceWorkerScope="/baking-simulator/"
    >
      <div className="bs-scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="bs-title" padded>
          <div className="bs-screen-panel bs-start-panel">
            <GameHeader
              headingId="bs-title"
              className="bs-header"
              leftContent={<>
                <h1 id="bs-title" className="bs-title">🍞 Baking Simulator</h1>
              </>}
              rightContent={<button
                type="button"
                className="bs-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >Menu</button>}
            />
            <p className="bs-subtitle">Mix, knead, shape, proof, and bake your way to the perfect loaf!</p>
            <div className="bs-start-actions">
              <button id="start-btn" type="button" className="bs-primary-btn">Start Baking 🥖</button>
            </div>
            <p id="gamepad-start-hint" className="bs-start-hint" hidden>Ⓐ start</p>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="bs-game-heading">
          <div className="bs-screen-panel bs-game-panel">
            <GameHeader
              headingId="bs-game-heading"
              className="bs-header"
              leftContent={<>
                <h2 id="bs-game-heading" className="bs-title bs-title-small">🍞 Baking Simulator</h2>
              </>}
              rightContent={<>
                <span className="bs-hud-item" id="score-display">Score: 0%</span>
                <span className="bs-hud-item" id="phase-label"></span>
                <button
                  type="button"
                  className="bs-menu-btn"
                  data-settings-open="true"
                  aria-haspopup="dialog"
                  aria-controls="settings-modal"
                  aria-expanded="false"
                >Menu</button>
              </>}
            />

            <div className="bs-game-area">
              <div id="pixi-stage" aria-hidden="true" />

              <div id="ing-station" className="bs-station-controls hidden" data-phase="ingredients">
                <div className="bs-ingredient-grid">
                  <button data-ingredient="flour" className="bs-ing-btn" aria-label="Add flour">🌾 Flour</button>
                  <button data-ingredient="water" className="bs-ing-btn" aria-label="Add water">💧 Water</button>
                  <button data-ingredient="yeast" className="bs-ing-btn" aria-label="Add yeast">🧫 Yeast</button>
                  <button data-ingredient="salt" className="bs-ing-btn" aria-label="Add salt">🧂 Salt</button>
                  <button data-ingredient="sugar" className="bs-ing-btn" aria-label="Add sugar">🍬 Sugar</button>
                  <button data-ingredient="butter" className="bs-ing-btn" aria-label="Add butter">🧈 Butter</button>
                </div>
                <div className="bs-progress-bar"><div id="ing-bar-fill" className="bs-progress-fill" /></div>
              </div>

              <div id="knead-station" className="bs-station-controls hidden" data-phase="kneading">
                <p className="bs-hint">👆 Tap or click the dough rapidly to knead it!</p>
                <div id="knead-area" className="bs-knead-area" role="button" aria-label="Knead the dough by tapping" tabIndex={0} />
                <div className="bs-progress-bar"><div id="knead-bar-fill" className="bs-progress-fill" /></div>
              </div>

              <div id="shape-station" className="bs-station-controls hidden" data-phase="shaping">
                <div id="shape-choices" className="bs-shape-choices">
                  <button data-shape="round" className="bs-shape-btn">🍞 Round Loaf</button>
                  <button data-shape="baguette" className="bs-shape-btn">🥖 Baguette</button>
                  <button data-shape="roll" className="bs-shape-btn">🥐 Dinner Rolls</button>
                </div>
                <div id="shape-area" className="bs-shape-area hidden" role="application" aria-label="Drag to shape the dough" />
                <div className="bs-progress-bar"><div id="shape-bar-fill" className="bs-progress-fill" /></div>
              </div>

              <div id="proof-station" className="bs-station-controls hidden" data-phase="proofing">
                <p className="bs-hint">🌡️ Adjust temperature — warmer = faster, but don't overproof!</p>
                <div className="bs-slider-container">
                  <span>❄️</span>
                  <div id="proof-slider" className="bs-slider" role="slider" aria-label="Temperature" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
                    <div id="proof-slider-knob" className="bs-slider-knob" />
                  </div>
                  <span>🔥</span>
                </div>
                <p id="proof-temp-label" className="bs-temp-label">72°F</p>
                <p id="proof-status" className="bs-proof-status" />
                <div className="bs-progress-bar"><div id="proof-bar-fill" className="bs-progress-fill" /></div>
              </div>

              <div id="bake-station" className="bs-station-controls hidden" data-phase="baking">
                <div className="bs-bake-controls">
                  <button id="heat-up-btn" className="bs-heat-btn">🔥 +Heat</button>
                  <button id="heat-down-btn" className="bs-heat-btn">❄️ —Heat</button>
                  <button id="pull-btn" className="bs-pull-btn hidden">🧤 Pull Out Bread!</button>
                </div>
                <p id="bake-heat-label" className="bs-temp-label">Heat: 0%</p>
                <div className="bs-progress-bar"><div id="bake-bar-fill" className="bs-progress-fill" /></div>
              </div>

              <button id="next-btn" className="bs-next-btn hidden">Next →</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="result-screen" labelledBy="bs-result-heading" padded>
          <div className="bs-screen-panel bs-result-panel">
            <h2 id="bs-result-heading" className="bs-result-title">🍞 Your Bread!</h2>
            <div id="result-scores" className="bs-result-scores" />
            <p id="result-total" className="bs-result-total" />
            <p id="result-message" className="bs-result-message" />
            <button id="replay-btn" type="button" className="bs-primary-btn">🔄 Bake Again!</button>
          </div>
        </GameScreen>
      </div>

      <div id="toast-area" className="bs-toast-area" aria-live="polite" />

      <GameTabbedModal
        title="Menu"
        overlayStyles={modalOverlayStyles}
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="Audio">
            <SettingsToggle id="music-enabled-toggle" label="Sound" helpText="Sound is on until you change it here." helpId="music-enabled-help" />
            <SettingsToggle id="sfx-enabled-toggle" label="Effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
          </SettingsSection>
          <SettingsSection title="Controls">
            <div className="bs-controls-help">
              <p><strong>Ingredients:</strong> Click each ingredient to add it.</p>
              <p><strong>Kneading:</strong> Tap or click the dough rapidly.</p>
              <p><strong>Shaping:</strong> Choose a shape, then drag on the dough.</p>
              <p><strong>Proofing:</strong> Slide the temperature control to adjust warmth.</p>
              <p><strong>Baking:</strong> Click +Heat to raise temperature, pull when golden!</p>
            </div>
          </SettingsSection>
          <SettingsSection title="Accessibility">
            <SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Defaults to your device setting until you change it here." helpId="reduce-motion-help" />
          </SettingsSection>
        </>}
        infoContent={<>
          <InfoSection title="About Baking Simulator">
            <p>{bakingSimulatorInfo.summary}</p>
          </InfoSection>
          <InfoSection title="Credits">
            {bakingSimulatorAttribution.entries.map((entry) => <InfoAttribution attribution={{
              title: entry.title,
              author: entry.creator,
              license: entry.license,
              url: entry.sourceUrl,
              notes: entry.notes,
            }} />)}
          </InfoSection>
          <p className="info-more-link"><a href={withBasePath('/baking-simulator/info/', siteBasePath)}>More info, credits &amp; attributions →</a></p>
        </>}
      />

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message">
          <p>Baking Simulator needs JavaScript to run. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}