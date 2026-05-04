/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'

import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameTabbedModal, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'

import { chompersImmersiveAttribution } from './attributions.js'
import { chompersImmersiveInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(10, 22, 40, 0.92)',
}

export async function chompersImmersiveAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Chompers Immersive"
      description="Feed the hippo the right fruit using your camera! A motion-powered math game."
      path="/chompers-immersive/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/chompers-immersive.css']}
      scripts={['/client/chompers-immersive/main.js?v=__BUILD_SHA__']}
      bodyClass="chompers-immersive-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/chompers-immersive/manifest.json"
      serviceWorkerPath="/chompers-immersive/sw.js"
      serviceWorkerScope="/chompers-immersive/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="ci-start-panel">
            <GameHeader
              headingId="start-heading"
              className="ci-header"
              leftContent={<>
                <h1 id="start-heading" className="ci-title">Chompers Immersive</h1>
              </>}
              rightContent={<button
                type="button"
                className="ci-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >Menu</button>}
            />

            <p className="ci-subtitle">Feed the hippo the right fruit using your camera!</p>
            <p className="ci-camera-prompt" id="camera-prompt">Requesting camera access…</p>

            <button id="start-btn" type="button" className="ci-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true" aria-labelledby="game-heading">
          <div className="ci-game-panel">
            <GameHeader
              headingId="game-heading"
              className="ci-header"
              leftContent={<>
                <span id="score-display">Score: 0</span>
              </>}
              rightContent={<button
                type="button"
                className="ci-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >Menu</button>}
            />

            <div className="ci-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="end-screen" className="game-screen" hidden aria-hidden="true" aria-labelledby="end-heading">
          <div className="ci-end-panel">
            <h2 id="end-heading" className="ci-title">Nice Work!</h2>
            <dl className="ci-results">
              <div><dt>Score</dt><dd id="end-score">0</dd></div>
              <div><dt>Accuracy</dt><dd id="end-accuracy">0%</dd></div>
            </dl>
            <button id="replay-btn" type="button" className="ci-primary-btn">Play Again</button>
          </div>
        </section>

        <GameTabbedModal
          title="Menu"
          overlayStyles={modalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
              <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
            </SettingsSection>
            <SettingsSection title="Controls">
              <p>Move your hand to point at a fruit. Raise your hand to select it!</p>
            </SettingsSection>
            <SettingsSection title="Accessibility">
              <SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Defaults to your device setting." helpId="reduce-motion-help" />
            </SettingsSection>
          </>}
          infoContent={<>
            <InfoSection title="About Chompers Immersive">
              <p>{chompersImmersiveInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {chompersImmersiveAttribution.entries.map((entry) => <p key={entry.title}>{entry.title} by {entry.creator} — {entry.license}</p>)}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <p>Please enable JavaScript and camera access to play Chompers Immersive.</p>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}