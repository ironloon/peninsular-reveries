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

import { copycatAttribution } from './attributions.js'
import { copycatInfo } from './info.js'

const copycatModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.92)',
}

export async function copycatAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Copycat"
      description="Mirror the dancer's moves using your camera."
      path="/copycat/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/copycat.css']}
      scripts={[`/client/copycat/main.js?v=__BUILD_SHA__`]}
      bodyClass="copycat-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/copycat/manifest.json"
      serviceWorkerPath="/copycat/sw.js"
      serviceWorkerScope="/copycat/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="copycat-title" padded>
          <div className="copycat-screen-panel copycat-start-panel">
            <GameHeader
              headingId="copycat-title"
              className="copycat-header"
              leftContent={<>
                <h1 id="copycat-title" className="copycat-title">Copycat</h1>
              </>}
              rightContent={<button
                type="button"
                className="copycat-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="copycat-subtitle">Strike a pose to make your cat dance.</p>

            <div className="copycat-camera-prompt" id="camera-denied-msg">
              <p>Camera access is required to play.</p>
            </div>

            <div>
              <button id="start-btn" type="button" className="copycat-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="copycat-game-heading">
          <div className="copycat-screen-panel copycat-game-panel">
            <GameHeader
              headingId="copycat-game-heading"
              className="copycat-header"
              leftContent={<>
                <h2 id="copycat-game-heading" className="copycat-title copycat-title-small">Copycat</h2>
              </>}
              rightContent={<button
                type="button"
                className="copycat-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="copycat-hud">
              <span className="copycat-hud-item" id="round-display">Round 1/3</span>
              <span className="copycat-hud-item" id="progress-display">Progress: 0%</span>
              <span className="copycat-hud-item" id="cat-count">Cats: 1</span>
              <span className="copycat-hud-item" id="pose-indicator">Pose: idle</span>
            </div>

            <div className="dance-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="copycat-end-heading" padded>
          <div className="copycat-screen-panel copycat-end-panel">
            <GameHeader
              headingId="copycat-end-heading"
              className="copycat-header"
              leftContent={<>
                <h2 id="copycat-end-heading" className="copycat-title">Copycat</h2>
              </>}
              rightContent={<button
                type="button"
                className="copycat-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div id="round-break-overlay" className="copycat-round-break" hidden>
              <div className="copycat-round-break-inner">
                <p id="round-break-msg">Round 1 complete!</p>
                <p id="round-break-countdown" className="copycat-countdown">3</p>
              </div>
            </div>

            <div id="end-screen-content" hidden>
              <p className="copycat-completion-msg">Great dancing! The song is complete.</p>
              <div>
                <button id="replay-btn" type="button" className="copycat-primary-btn">Play again</button>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={copycatModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle
                id="music-enabled-toggle"
                label="Music"
                helpText="Music is on until you change it here."
                helpId="music-enabled-help"
              />
              <SettingsToggle
                id="sfx-enabled-toggle"
                label="Sound effects"
                helpText="Sound effects are on until you change it here."
                helpId="sfx-enabled-help"
              />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="copycat-controls-help">
                <p><strong>Move:</strong> Stand in front of the camera and mirror the on-screen dancer.</p>
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
            <InfoSection title="About Copycat">
              <p>{copycatInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {copycatAttribution.entries.map((entry) => <InfoAttribution attribution={{
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
        <div className="noscript-message noscript-message-copycat">
          <p>Copycat needs JavaScript and camera access to track your moves. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
