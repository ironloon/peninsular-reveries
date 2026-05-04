/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameTabbedModal, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { peekabooimmersiveAttribution } from './attributions.js'
import { peekabooimmersiveInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: '#1a1a2eee' }

export async function peekabooimmersiveAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Peekaboo Immersive"
      description="Find the hidden character using your camera!"
      path="/peekaboo-immersive/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/peekaboo-immersive.css']}
      scripts={['/client/peekaboo-immersive/main.js?v=__BUILD_SHA__']}
      bodyClass="peekaboo-immersive-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/peekaboo-immersive/manifest.json"
      serviceWorkerPath="/peekaboo-immersive/sw.js"
      serviceWorkerScope="/peekaboo-immersive/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="pi-start-panel">
            <h1 id="start-heading" className="pi-title">🙈 Peekaboo Immersive</h1>
            <p className="pi-subtitle">Find the hidden character using your camera!</p>
            <p className="pi-camera-prompt" id="camera-prompt">Requesting camera access…</p>
            <button id="start-btn" type="button" className="pi-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true">
          <div className="pi-game-panel">
            <div className="pi-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="end-screen" className="game-screen" hidden aria-hidden="true">
          <div className="pi-end-panel">
            <h2 className="pi-title">Great session!</h2>
            <p id="score-display">Score: 0</p>
            <button id="replay-btn" type="button" className="pi-primary-btn">Play Again</button>
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
              <p>Move your hands over the screen to interact with the game!</p>
            </SettingsSection>
            <SettingsSection title="Accessibility">
              <SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Defaults to your device setting." helpId="reduce-motion-help" />
            </SettingsSection>
          </>}
          infoContent={<>
            <p>{peekabooimmersiveInfo.summary}</p>
            {peekabooimmersiveAttribution.entries.map((e) => <p key={e.title}>{e.title} — {e.license}</p>)}
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript><p>Enable JavaScript and camera to play Peekaboo Immersive.</p></noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
