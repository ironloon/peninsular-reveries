import * as React from '@remix-run/component'
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

import { blockAttackAttribution } from './attributions.js'
import { blockAttackInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.92)',
}

export async function blockAttackAction() {
  const homePath = withBasePath('/', getSiteBasePath())

  const html = await renderToString(
    <Document
      title="Block Attack"
      description="Smash procedurally generated block towers using your camera. Destroy everything in your path!"
      path="/block-attack/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/block-attack.css']}
      scripts={['/client/block-attack/main.js?v=__BUILD_SHA__']}
      bodyClass="block-attack-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/block-attack/manifest.json"
      serviceWorkerPath="/block-attack/sw.js"
      serviceWorkerScope="/block-attack/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="block-attack-title" padded>
          <div className="ba-screen-panel ba-start-panel">
            <GameHeader
              headingId="block-attack-title"
              className="ba-header"
              leftContent={<>
                <h1 id="block-attack-title" className="ba-title">Block Attack</h1>
              </>}
              rightContent={<button
                type="button"
                className="ba-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="ba-subtitle">Move your body to smash block towers! Destroy everything!</p>

            <div className="ba-pose-list" id="pose-list">
              <p className="ba-pose-list-title">How to play:</p>
              <div className="ba-pose-chips">
                <span className="ba-pose-chip">🏗️ Towers appear on screen</span>
                <span className="ba-pose-chip">💥 Move near blocks to smash them</span>
                <span className="ba-pose-chip">🔗 Destroy supporting blocks to topple towers</span>
                <span className="ba-pose-chip">⚡ Chain hits for combo multipliers!</span>
                <span className="ba-pose-chip">🖱️ No camera? Move your mouse instead!</span>
              </div>
            </div>

            <div className="ba-camera-prompt" id="camera-denied-msg">
              <p>Camera access is optional — you can also use your mouse or touch.</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="ba-primary-btn">💥 Start Smash!</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="block-attack-game-heading">
          <div className="ba-screen-panel ba-game-panel">
            <GameHeader
              headingId="block-attack-game-heading"
              className="ba-header"
              leftContent={<>
                <button id="hud-restart-btn" type="button" className="ba-icon-btn" aria-label="Restart" title="Restart">↻</button>
                <span id="wave-display" className="ba-hud-item">Wave: 1</span>
              </>}
              rightContent={<>
                <span id="score-display" className="ba-hud-item">Score: 0</span>
                <span id="combo-display" className="ba-hud-item ba-combo" />
                <button id="quit-btn" type="button" className="ba-icon-btn ba-quit-btn" aria-label="Quit" title="Quit">✕</button>
              </>}
            />

            <div className="ba-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="block-attack-end-heading" padded>
          <div className="ba-screen-panel ba-end-panel">
            <GameHeader
              headingId="block-attack-end-heading"
              className="ba-header"
              leftContent={<>
                <h2 id="block-attack-end-heading" className="ba-title">Block Attack</h2>
              </>}
              rightContent={<button
                type="button"
                className="ba-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p id="end-score-msg" className="ba-completion-msg">Great smashing!</p>

            <div>
              <button id="replay-btn" type="button" className="ba-primary-btn">Play again</button>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={modalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle
                id="music-enabled-toggle"
                label="Sound"
                helpText="Sound is on until you change it here."
                helpId="music-enabled-help"
              />
              <SettingsToggle
                id="sfx-enabled-toggle"
                label="Effects"
                helpText="Sound effects are on until you change it here."
                helpId="sfx-enabled-help"
              />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="ba-controls-help">
                <p><strong>Move:</strong> Move your body near blocks to smash them. Or use your mouse!</p>
                <p><strong>Combo:</strong> Hit blocks quickly for score multipliers.</p>
                <p><strong>Restart:</strong> Press ↻ or use the menu.</p>
                <p><strong>Quit:</strong> Press ✕ or use the menu.</p>
              </div>
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
            <InfoSection title="About Block Attack">
              <p>{blockAttackInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {blockAttackAttribution.entries.map((entry) => <InfoAttribution attribution={{
                title: entry.title,
                author: entry.creator,
                license: entry.license,
                url: entry.sourceUrl,
                notes: entry.notes,
              }} />)}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-ba">
          <p>Block Attack needs JavaScript and camera access to track your moves. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}