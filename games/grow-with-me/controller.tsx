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

import { growWithMeAttribution } from './attributions.js'
import { growWithMeInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(10, 30, 15, 0.92)',
}

export async function growWithMeAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Grow With Me"
      description="Move in front of your camera to grow a garden! Plant seeds, add water, speed up the sun, and watch your flowers bloom."
      path="/grow-with-me/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/grow-with-me.css']}
      scripts={['/client/grow-with-me/main.js?v=__BUILD_SHA__']}
      bodyClass="grow-with-me-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/grow-with-me/manifest.json"
      serviceWorkerPath="/grow-with-me/sw.js"
      serviceWorkerScope="/grow-with-me/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="grow-with-me-title" padded>
          <div className="gwm-screen-panel gwm-start-panel">
            <GameHeader
              headingId="grow-with-me-title"
              className="gwm-header"
              leftContent={<>
                <div className="gwm-heading-block">
                  <h1 id="grow-with-me-title" className="gwm-title">Grow With Me</h1>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="gwm-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="gwm-subtitle">Move in front of your camera to grow a living garden!</p>

            <div className="gwm-instructions" id="instructions">
              <p className="gwm-instructions-title">How to play:</p>
              <div className="gwm-instruction-chips">
                <span className="gwm-chip">🌱 Move left to plant seeds</span>
                <span className="gwm-chip">💧 Move in the water lane to add moisture</span>
                <span className="gwm-chip">☀️ Move sun lane to speed up daylight</span>
                <span className="gwm-chip">💨 Move wind lane to bring rain</span>
                <span className="gwm-chip">🌸 Plants bloom during the day!</span>
              </div>
            </div>

            <div className="gwm-camera-prompt" id="camera-denied-msg">
              <p>Camera access is required for motion tracking.</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="gwm-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="grow-with-me-game-heading">
          <div className="gwm-screen-panel gwm-game-panel">
            <GameHeader
              headingId="grow-with-me-game-heading"
              className="gwm-header"
              leftContent={<>
                <div className="gwm-heading-block">
                  <h2 id="grow-with-me-game-heading" className="gwm-title gwm-title-small">Grow With Me</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="gwm-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="gwm-hud">
              <div className="gwm-hud-left">
                <span id="day-phase-display">☀️ Day</span>
              </div>
              <div className="gwm-hud-center">
                <span id="moisture-display">💧 30%</span>
              </div>
              <div className="gwm-hud-right">
                <span id="bloom-count-display">🌸 0 bloomed</span>
              </div>
            </div>

            <div id="pixi-stage" className="gwm-pixi-stage" aria-hidden="true"></div>

            <video
              id="camera-preview"
              className="gwm-camera-preview"
              autoPlay
              playsInline
              muted
              aria-hidden="true"
            />
          </div>
        </GameScreen>

        <GameScreen id="celebrating-screen" labelledBy="grow-with-me-celebrate-heading" padded>
          <div className="gwm-screen-panel gwm-celebrate-panel">
            <GameHeader
              headingId="grow-with-me-celebrate-heading"
              className="gwm-header"
              leftContent={<>
                <div className="gwm-heading-block">
                  <p className="gwm-kicker">Garden Thriving!</p>
                  <h2 id="grow-with-me-celebrate-heading" className="gwm-title">Grow With Me</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="gwm-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="gwm-celebrate-card">
              <span className="gwm-celebrate-emoji" aria-hidden="true">🌸</span>
              <p className="gwm-celebrate-msg">Your garden is thriving with beautiful blooms!</p>
              <button id="replay-btn" type="button" className="gwm-primary-btn">Grow again</button>
              <a href={homePath} className="gwm-secondary-link">Quit</a>
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
            <InfoSection title="About Grow With Me">
              <p>{growWithMeInfo.summary}</p>
            </InfoSection>
            <InfoSection title="How to play">
              <p>Stand in front of your camera. The screen is divided into five vertical lanes. Moving in different lanes affects the garden in different ways:</p>
              <ul>
                <li><strong>Seed lane (leftmost):</strong> Plant new seeds.</li>
                <li><strong>Water lane:</strong> Add moisture to the soil.</li>
                <li><strong>Sun lane (center):</strong> Speed up the day/night cycle.</li>
                <li><strong>Wind lane:</strong> Bring rain clouds.</li>
                <li><strong>Bloom lane (rightmost):</strong> Encourage flowers.</li>
              </ul>
              <p>Plants grow during the day. Rain boosts growth for a while after it ends. Keep your garden watered and watch it bloom!</p>
            </InfoSection>
            <InfoSection title="Credits">
              {growWithMeAttribution.entries.map((entry) => (
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
              {growWithMeAttribution.entries.length === 0 && <p>All game content is original.</p>}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-grow-with-me">
          <p>Grow With Me needs JavaScript for camera motion tracking, audio, and PixiJS rendering. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}