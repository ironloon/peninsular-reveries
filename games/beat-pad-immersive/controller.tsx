/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameTabbedModal, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { beatPadImmersiveAttribution } from './attributions.js'
import { beatPadImmersiveInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: 'rgba(13, 13, 26, 0.92)' }

export async function beatPadImmersiveAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Beat Pad Immersive"
      description="Trigger beats and bass with your body! Wave your hands to play pads."
      path="/beat-pad-immersive/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/beat-pad-immersive.css']}
      scripts={['/client/beat-pad-immersive/main.js?v=__BUILD_SHA__']}
      bodyClass="beat-pad-immersive-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/beat-pad-immersive/manifest.json"
      serviceWorkerPath="/beat-pad-immersive/sw.js"
      serviceWorkerScope="/beat-pad-immersive/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="bpi-start-panel">
            <h1 id="start-heading" className="bpi-title">Beat Pad Immersive</h1>
            <p className="bpi-subtitle">Trigger beats and bass with your body!</p>
            <p className="bpi-camera-prompt" id="camera-prompt">Requesting camera access…</p>
            <button id="start-btn" type="button" className="bpi-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true">
          <div className="bpi-game-panel">
            <div className="bpi-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <GameTabbedModal
          title="Menu"
          overlayStyles={modalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it." helpId="sfx-enabled-help" />
            </SettingsSection>
            <SettingsSection title="Controls">
              <p>Wave your hands over the pads to trigger sounds. Two hands can trigger two pads at once!</p>
            </SettingsSection>
          </>}
          infoContent={<>
            <p>{beatPadImmersiveInfo.summary}</p>
            {beatPadImmersiveAttribution.entries.map((e) => <p key={e.title}>{e.title} — {e.license}</p>)}
          </>}
        />
      </div>
      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <noscript><p>Enable JavaScript and camera to play.</p></noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
