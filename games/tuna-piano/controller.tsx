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

import { tunaPianoAttribution } from './attributions.js'
import { tunaPianoInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.92)',
}

export async function tunaPianoAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Tuna Piano"
      description="Play a translucent piano with your hands using the camera. Open hand plays a note, closed hand sustains it."
      path="/tuna-piano/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/tuna-piano.css']}
      scripts={[`/client/tuna-piano/main.js?v=__BUILD_SHA__`]}
      bodyClass="tuna-piano-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/tuna-piano/manifest.json"
      serviceWorkerPath="/tuna-piano/sw.js"
      serviceWorkerScope="/tuna-piano/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="tuna-piano-title" padded>
          <div className="tp-screen-panel tp-start-panel">
            <GameHeader
              headingId="tuna-piano-title"
              className="tp-header"
              leftContent={<>
                <h1 id="tuna-piano-title" className="tp-title">Tuna Piano🎹🐟</h1>
              </>}
              rightContent={<button
                type="button"
                className="tp-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="tp-subtitle">Play a translucent piano with your hands!</p>

            <div className="tp-pose-list" id="pose-list">
              <p className="tp-pose-list-title">How to play:</p>
              <div className="tp-pose-chips">
                <span className="tp-pose-chip">👋 Open hand on a key = play note</span>
                <span className="tp-pose-chip">✊ Closed hand on a key = sustain note</span>
                <span className="tp-pose-chip">🐟 Closed hand on the tuna = go home</span>
                <span className="tp-pose-chip">🎹 Two octaves of piano keys</span>
                <span className="tp-pose-chip">🎥 Camera sees through the keys</span>
              </div>
            </div>

            <div className="tp-camera-prompt" id="camera-denied-msg">
              <p>Camera access makes motion tracking work. Grant permission or press Start anyway!</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="tp-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="tuna-piano-game-heading">
          <div className="tp-screen-panel tp-game-panel">
            <div className="tp-camera-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
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
                label="Ambience"
                helpText="Underwater ambience is on until you change it here."
                helpId="music-enabled-help"
              />
              <SettingsToggle
                id="sfx-enabled-toggle"
                label="Piano notes"
                helpText="Piano sounds are on until you change it here."
                helpId="sfx-enabled-help"
              />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="tp-controls-help">
                <p><strong>Play keys:</strong> Move your hand over a piano key.</p>
                <p><strong>Open hand:</strong> Plays the note normally (short).</p>
                <p><strong>Closed hand:</strong> Sustains the note until you open or move away.</p>
                <p><strong>Go home:</strong> Hold a closed hand on the tuna fish in the top corner for 1.5 seconds.</p>
                <p><strong>Menu:</strong> Use the Menu button for settings and help, or press Escape.</p>
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
            <InfoSection title="About Tuna Piano">
              <p>{tunaPianoInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {tunaPianoAttribution.entries.map((entry) => <InfoAttribution attribution={{
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
        <div className="noscript-message noscript-message-tp">
          <p>Tuna Piano needs JavaScript and camera access to track your hands. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}