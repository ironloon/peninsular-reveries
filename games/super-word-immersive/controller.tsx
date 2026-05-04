/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameTabbedModal, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { superwordimmersiveAttribution } from './attributions.js'
import { superwordimmersiveInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: '#1a1a33ee' }

export async function superwordimmersiveAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Super Word Immersive"
      description="Find hidden letters with your camera!"
      path="/super-word-immersive/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/super-word-immersive.css']}
      scripts={['/client/super-word-immersive/main.js?v=__BUILD_SHA__']}
      bodyClass="super-word-immersive-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/super-word-immersive/manifest.json"
      serviceWorkerPath="/super-word-immersive/sw.js"
      serviceWorkerScope="/super-word-immersive/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="swi-start-panel">
            <h1 id="start-heading" className="swi-title">🪄 Super Word Immersive</h1>
            <p className="swi-subtitle">Find hidden letters with your camera!</p>
            <p className="swi-camera-prompt" id="camera-prompt">Requesting camera access…</p>
            <button id="start-btn" type="button" className="swi-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true">
          <div className="swi-game-panel">
            <div className="swi-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="end-screen" className="game-screen" hidden aria-hidden="true">
          <div className="swi-end-panel">
            <h2 className="swi-title">Great session!</h2>
            <p id="score-display">Score: 0</p>
            <button id="replay-btn" type="button" className="swi-primary-btn">Play Again</button>
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
            <p>{superwordimmersiveInfo.summary}</p>
            {superwordimmersiveAttribution.entries.map((e) => <p key={e.title}>{e.title} — {e.license}</p>)}
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript><p>Enable JavaScript and camera to play Super Word Immersive.</p></noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
