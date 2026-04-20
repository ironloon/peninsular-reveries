import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'

import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import {
  GameHeader,
  GameScreen,
  GameTabbedModal,
  InfoSection,
  SettingsSection,
  SettingsToggle,
  SrOnly,
} from '../../app/ui/game-shell.js'

import { trainSoundsInfo } from './info.js'

const trainSoundsModalOverlayStyles = {
  zIndex: 120,
  background: 'rgba(9, 20, 36, 0.82)',
}

export async function trainSoundsAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Train Sounds"
      description="Tap playful trains and hear the parts that whistle, click, and rumble."
      path="/train-sounds/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/train-sounds.css']}
      scripts={['/client/train-sounds/main.js']}
      bodyClass="train-sounds"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/train-sounds/manifest.json"
      serviceWorkerPath="/train-sounds/sw.js"
      serviceWorkerScope="/train-sounds/"
    >
      <div className="train-shell">
        <GameScreen
          id="start-screen"
          className="active train-sounds-screen train-sounds-screen--start"
          labelledBy="train-sounds-title"
        >
          <div className="train-panel train-panel--start">
            <GameHeader
              headingId="train-sounds-title"
              className="train-header"
              leftContent={<h1 id="train-sounds-title" className="train-title">Train Sounds</h1>}
              rightContent={<button
                type="button"
                className="train-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="train-start-body">
              <p className="train-subtitle">Tap the train. Hear the parts.</p>
              <button id="start-btn" type="button" className="train-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen
          id="game-screen"
          className="train-sounds-screen train-sounds-screen--game"
          labelledBy="train-sounds-game-heading"
        >
          <div className="train-panel train-panel--game">
            <GameHeader
              headingId="train-sounds-game-heading"
              className="train-header"
              leftContent={<h2 id="train-sounds-game-heading" className="train-title train-title--small">Train Sounds</h2>}
              rightContent={<button
                type="button"
                className="train-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="train-selector-bar" role="group" aria-label="Choose a train">
              <button
                id="train-prev-btn"
                type="button"
                className="train-switch-btn train-switch-btn--prev"
                aria-label="Previous train"
              >
                <span className="train-switch-icon" aria-hidden="true">&lt;</span>
                <span className="train-switch-label">Prev</span>
              </button>

              <div id="train-name" className="train-name" aria-live="polite" aria-atomic="true">Steam Train</div>

              <button
                id="train-next-btn"
                type="button"
                className="train-switch-btn train-switch-btn--next"
                aria-label="Next train"
              >
                <span className="train-switch-label">Next</span>
                <span className="train-switch-icon" aria-hidden="true">&gt;</span>
              </button>
            </div>

            <div id="train-scene" className="train-scene" data-train-preset="steam" data-scene-state="idle">
              <div className="train-scene-sky" aria-hidden="true">
                <span className="train-sun"></span>
                <span className="train-cloud train-cloud--one"></span>
                <span className="train-cloud train-cloud--two"></span>
                <span className="train-hill train-hill--far"></span>
                <span className="train-hill train-hill--near"></span>
              </div>

              <div className="train-display-frame" aria-hidden="true">
                <div className="train-display">
                  <div className="train-locomotive">
                    <span className="train-stack"></span>
                    <span className="train-headlight"></span>
                    <span className="train-cab"></span>
                  </div>
                  <span className="train-coupler train-coupler--one"></span>
                  <div className="train-car train-car--first"></div>
                  <span className="train-coupler train-coupler--two"></span>
                  <div className="train-car train-car--second"></div>
                  <div className="train-track">
                    <span className="train-sleeper"></span>
                    <span className="train-sleeper"></span>
                    <span className="train-sleeper"></span>
                    <span className="train-sleeper"></span>
                    <span className="train-sleeper"></span>
                    <span className="train-sleeper"></span>
                  </div>
                </div>
              </div>

              <div id="train-hotspots" className="train-hotspots" role="group" aria-label="Train parts"></div>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={trainSoundsModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle
                id="sfx-enabled-toggle"
                label="Sound effects"
                helpText="Sound effects are on until you change them here."
                helpId="sfx-enabled-help"
              />
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
            <InfoSection title="About Train Sounds">
              <p>{trainSoundsInfo.summary}</p>
            </InfoSection>

            <InfoSection title="Credits">
              <div id="train-credits" className="train-credits"></div>
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="train-sounds-noscript">
          <p>Train Sounds needs JavaScript to switch trains and play each part. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}