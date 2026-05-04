/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameTabbedModal, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { storytrailimmersiveAttribution } from './attributions.js'
import { storytrailimmersiveInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: '#1a1a2eee' }

export async function storytrailimmersiveAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Story Trail Immersive"
      description="Read and explore stories with your camera!"
      path="/story-trail-immersive/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/story-trail-immersive.css']}
      scripts={['/client/story-trail-immersive/main.js?v=__BUILD_SHA__']}
      bodyClass="story-trail-immersive-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/story-trail-immersive/manifest.json"
      serviceWorkerPath="/story-trail-immersive/sw.js"
      serviceWorkerScope="/story-trail-immersive/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="sti-start-panel">
            <h1 id="start-heading" className="sti-title">📖 Story Trail Immersive</h1>
            <p className="sti-subtitle">Read and explore stories with your camera!</p>
            <p className="sti-camera-prompt" id="camera-prompt">Requesting camera access…</p>
            <button id="start-btn" type="button" className="sti-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true">
          <div className="sti-game-panel">
            <div className="sti-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="end-screen" className="game-screen" hidden aria-hidden="true">
          <div className="sti-end-panel">
            <h2 className="sti-title">Great session!</h2>
            <p id="score-display">Score: 0</p>
            <button id="replay-btn" type="button" className="sti-primary-btn">Play Again</button>
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
            <p>{storytrailimmersiveInfo.summary}</p>
            {storytrailimmersiveAttribution.entries.map((e) => <p key={e.title}>{e.title} — {e.license}</p>)}
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript><p>Enable JavaScript and camera to play Story Trail Immersive.</p></noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
