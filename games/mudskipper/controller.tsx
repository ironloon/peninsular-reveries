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

import { mudskipperAttribution } from './attributions.js'
import { mudskipperInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(12, 8, 4, 0.92)',
}

export async function mudskipperAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Mudskipper"
      description="One mudskipper follows your movements. Jump to make it leap and splash mud everywhere! Don't let the splatters fill the screen!"
      path="/mudskipper/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/mudskipper.css']}
      scripts={[`/client/mudskipper/main.js?v=__BUILD_SHA__`]}
      bodyClass="mudskipper-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/mudskipper/manifest.json"
      serviceWorkerPath="/mudskipper/sw.js"
      serviceWorkerScope="/mudskipper/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="mudskipper-title" padded>
          <div className="ms-screen-panel ms-start-panel">
            <GameHeader
              headingId="mudskipper-title"
              className="ms-header"
              leftContent={<>
                <div className="ms-heading-block">
                  <h1 id="mudskipper-title" className="ms-title">Mudskipper</h1>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="ms-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="ms-subtitle">Jump to make your mudskipper leap — mud splatters everywhere when it lands!</p>

            <div className="ms-instructions" id="instructions">
              <p className="ms-instructions-title">How to play:</p>
              <div className="ms-instruction-chips">
                <span className="ms-chip">🐟 One mudskipper follows you</span>
                <span className="ms-chip">⬆️ Jump to leap</span>
                <span className="ms-chip">💦 Splatters fill the screen</span>
                <span className="ms-chip">🏆 Don't let it overflow!</span>
              </div>
            </div>

            <div className="ms-camera-prompt" id="camera-denied-msg">
              <p>Camera access is required for motion tracking.</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="ms-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="mudskipper-game-heading">
          <div className="ms-screen-panel ms-game-panel">
            <GameHeader
              headingId="mudskipper-game-heading"
              className="ms-header"
              leftContent={<>
                <div className="ms-heading-block">
                  <h2 id="mudskipper-game-heading" className="ms-title ms-title-small">Mudskipper</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="ms-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="ms-hud">
              <div className="ms-hud-left">
                <span id="mud-level-display">Mud: 0%</span>
              </div>
              <div className="ms-hud-right">
                <span id="skipper-count-display">Mudskippers: 0</span>
              </div>
            </div>

            <div id="pixi-stage" className="ms-pixi-stage" aria-hidden="true"></div>

            <video
              id="camera-preview"
              className="ms-camera-preview"
              autoPlay
              playsInline
              muted
              aria-hidden="true"
            />
          </div>
        </GameScreen>

        <GameScreen id="gameover-screen" labelledBy="mudskipper-over-heading" padded>
          <div className="ms-screen-panel ms-gameover-panel">
            <GameHeader
              headingId="mudskipper-over-heading"
              className="ms-header"
              leftContent={<>
                <div className="ms-heading-block">
                  <p className="ms-kicker">Mudded Over!</p>
                  <h2 id="mudskipper-over-heading" className="ms-title">Mudskipper</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="ms-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="ms-gameover-card">
              <span className="ms-gameover-emoji" aria-hidden="true">🐟</span>
              <p className="ms-gameover-msg">The mud filled the whole screen!</p>
              <button id="replay-btn" type="button" className="ms-primary-btn">Play again</button>
              <a href={homePath} className="ms-secondary-link">Quit</a>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={modalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
              <SettingsToggle id="sfx-enabled-toggle" label="Sound effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
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
            <InfoSection title="About Mudskipper">
              <p>{mudskipperInfo.summary}</p>
            </InfoSection>
            <InfoSection title="How to play">
              <p>One mudskipper follows your movements. Jump to make it leap out of the mud. When it lands, mud splatters across the screen in random spots. The more you jump, the more the screen fills with splatters. When the splatters cover the screen, the game ends!</p>
            </InfoSection>
            <InfoSection title="Credits">
              {mudskipperAttribution.entries.map((entry) => (
                <InfoAttribution
                  attribution={{
                    title: entry.title,
                    author: entry.creator,
                    license: entry.license,
                    url: entry.sourceUrl,
                    notes: entry.notes,
                  }}
                />
              ))}
              {mudskipperAttribution.entries.length === 0 && <p>All game content is original.</p>}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-mudskipper">
          <p>Mudskipper needs JavaScript for camera motion tracking, audio, and PixiJS rendering. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
