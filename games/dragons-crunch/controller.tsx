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

import { dragonsCrunchAttribution } from './attributions.js'
import { dragonsCrunchInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.92)',
}

export async function dragonsCrunchAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Dragon's Crunch"
      description="Catch falling fruit by moving near it. Fire breath celebration at the end!"
      path="/dragons-crunch/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/dragons-crunch.css']}
      scripts={[`/client/dragons-crunch/main.js?v=__BUILD_SHA__`]}
      bodyClass="dragons-crunch-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/dragons-crunch/manifest.json"
      serviceWorkerPath="/dragons-crunch/sw.js"
      serviceWorkerScope="/dragons-crunch/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="dragons-crunch-title" padded>
          <div className="dc-screen-panel dc-start-panel">
            <GameHeader
              headingId="dragons-crunch-title"
              className="dc-header"
              leftContent={<>
                <h1 id="dragons-crunch-title" className="dc-title">Dragon's Crunch</h1>
              </>}
              rightContent={<button
                type="button"
                className="dc-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="dc-subtitle">Move near the food to catch it as it falls!</p>

            <div className="dc-pose-list" id="pose-list">
              <p className="dc-pose-list-title">How to play:</p>
              <div className="dc-pose-chips">
                <span className="dc-pose-chip">🎯 Stand in front of camera</span>
                <span className="dc-pose-chip">🍎 Move near food to eat it</span>
                <span className="dc-pose-chip">⭐ Small food = 1 point</span>
                <span className="dc-pose-chip">🌟 Big food = 5 points</span>
                <span className="dc-pose-chip">🔥 Fire breath celebration at the end!</span>
              </div>
            </div>

            <div className="dc-camera-prompt" id="camera-denied-msg">
              <p>Camera access is required for motion tracking.</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="dc-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="dragons-crunch-game-heading">
          <div className="dc-screen-panel dc-game-panel">
            <GameHeader
              headingId="dragons-crunch-game-heading"
              className="dc-header"
              leftContent={<>
                <h2 id="dragons-crunch-game-heading" className="dc-title dc-title-small">Dragon's Crunch</h2>
              </>}
              rightContent={<button
                type="button"
                className="dc-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="dc-hud">
              <span className="dc-hud-item" id="score-display">Score: 0</span>
              <span className="dc-hud-item" id="food-display">Food: 0/100</span>
            </div>

            <div className="dc-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
              <div id="celebration-overlay" className="dc-celebration-overlay" hidden>
                <div className="dc-celebration-inner">
                  <p id="celebration-msg">All food served! Great catches!</p>
                  <p className="dc-celebration-sub">Enjoy the fire breath celebration!</p>
                  <p id="celebration-countdown" className="dc-countdown">10</p>
                </div>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="dragons-crunch-end-heading" padded>
          <div className="dc-screen-panel dc-end-panel">
            <GameHeader
              headingId="dragons-crunch-end-heading"
              className="dc-header"
              leftContent={<>
                <h2 id="dragons-crunch-end-heading" className="dc-title">Dragon's Crunch</h2>
              </>}
              rightContent={<button
                type="button"
                className="dc-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p id="end-score-msg" className="dc-completion-msg">Final score: 0</p>

            <div>
              <button id="replay-btn" type="button" className="dc-primary-btn">Play again</button>
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
              <div className="dc-controls-help">
                <p><strong>Eat:</strong> Move near falling food to catch it.</p>
                <p><strong>Fire:</strong> Fire breath happens automatically at the end to celebrate!</p>
                <p><strong>Menu:</strong> Use the Menu button for settings and help.</p>
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
            <InfoSection title="About Dragon's Crunch">
              <p>{dragonsCrunchInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {dragonsCrunchAttribution.entries.map((entry) => <InfoAttribution attribution={{
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
        <div className="noscript-message noscript-message-dc">
          <p>Dragon's Crunch needs JavaScript and camera access to track your moves. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
