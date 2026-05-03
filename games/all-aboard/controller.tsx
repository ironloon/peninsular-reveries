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

import { allAboardAttribution } from './attributions.js'
import { allAboardInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(10, 20, 40, 0.93)',
}

export async function allAboardAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="All Aboard"
      description="Raise your hand to whistle and rotate your arm to drive the steam engine across the screen! Use your camera to control the train."
      path="/all-aboard/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/all-aboard.css']}
      scripts={[`/client/all-aboard/main.js?v=__BUILD_SHA__`]}
      bodyClass="all-aboard-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/all-aboard/manifest.json"
      serviceWorkerPath="/all-aboard/sw.js"
      serviceWorkerScope="/all-aboard/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="all-aboard-title" padded>
          <div className="aa-screen-panel aa-start-panel">
            <GameHeader
              headingId="all-aboard-title"
              className="aa-header"
              leftContent={<>
                <h1 id="all-aboard-title" className="aa-title">🚂 All Aboard</h1>
              </>}
              rightContent={<button
                type="button"
                className="aa-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >Menu</button>}
            />

            <p className="aa-subtitle">Raise your hand to blow the whistle and rotate your arm to chugga chugga choo choo!</p>

            <div className="aa-pose-list" id="pose-list">
              <p className="aa-pose-list-title">How to play:</p>
              <div className="aa-pose-chips">
                <span className="aa-pose-chip">👋 Hand up = Whistle "All Aboard!"</span>
                <span className="aa-pose-chip">🔄 Rotate arm = Chugga chugga choo choo!</span>
                <span className="aa-pose-chip">🚂 Train moves across the screen</span>
                <span className="aa-pose-chip">⌨️ Keyboard: W = whistle, hold C = chug</span>
              </div>
            </div>

            <div className="aa-camera-prompt" id="camera-denied-msg">
              <p>Camera access is required for motion tracking.</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="aa-primary-btn">🚂 All Aboard!</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="all-aboard-game-heading">
          <div className="aa-screen-panel aa-game-panel">
            <GameHeader
              headingId="all-aboard-game-heading"
              className="aa-header"
              leftContent={<>
                <h2 id="all-aboard-game-heading" className="aa-title aa-title-small">🚂 All Aboard</h2>
              </>}
              rightContent={<>
                <span className="aa-hud-item" id="score-display">0 pts</span>
                <span className="aa-hud-item" id="trip-display">Trips: 0</span>
                <button
                  type="button"
                  className="aa-menu-btn"
                  data-settings-open="true"
                  aria-haspopup="dialog"
                  aria-controls="settings-modal"
                  aria-expanded="false"
                >Menu</button>
              </>}
            />

            <p id="pose-display" className="aa-pose-display" aria-live="polite"></p>

            <div className="aa-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="all-aboard-end-heading" padded>
          <div className="aa-screen-panel aa-end-panel">
            <GameHeader
              headingId="all-aboard-end-heading"
              className="aa-header"
              leftContent={<>
                <h2 id="all-aboard-end-heading" className="aa-title">🚂 All Aboard</h2>
              </>}
              rightContent={<button
                type="button"
                className="aa-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >Menu</button>}
            />

            <p id="end-score-msg" className="aa-completion-msg">Great ride!</p>

            <div>
              <button id="replay-btn" type="button" className="aa-primary-btn">Play again</button>
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
              <div className="aa-controls-help">
                <p><strong>Whistle:</strong> Raise your hand up to blow the whistle and shout "All Aboard!"</p>
                <p><strong>Chug:</strong> Rotate your arm in a circle to make the train go "chugga chugga choo choo!"</p>
                <p><strong>Keyboard:</strong> W = whistle, hold C = chug.</p>
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
            <InfoSection title="About All Aboard">
              <p>{allAboardInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {allAboardAttribution.entries.map((entry) => <InfoAttribution attribution={{
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
        <div className="noscript-message noscript-message-aa">
          <p>All Aboard needs JavaScript and camera access to track your moves. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}