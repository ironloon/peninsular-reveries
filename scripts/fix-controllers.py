#!/usr/bin/env python3
"""Regenerate controller.tsx files for immersive games to fix template issues."""
import os

BASE = os.getcwd()

GAMES = {
    'mission-orbit-immersive': {'name': 'Mission: Orbit Immersive', 'desc': 'Time the key Artemis II burns using your camera!', 'cls': 'moi', 'icon': '🚀', 'bg': '#0a0a2e', 'accent': '#ff6600'},
    'peekaboo-immersive': {'name': 'Peekaboo Immersive', 'desc': 'Find the hidden character using your camera!', 'cls': 'pi', 'icon': '🙈', 'bg': '#1a1a2e', 'accent': '#ff88cc'},
    'pixel-passport-immersive': {'name': 'Pixel Passport Immersive', 'desc': 'Explore world destinations with your camera!', 'cls': 'ppi', 'icon': '🌍', 'bg': '#0a2040', 'accent': '#ffd166'},
    'spot-on-immersive': {'name': 'Spot On Immersive', 'desc': 'Tidy up cozy rooms using your camera!', 'cls': 'soi', 'icon': '🧹', 'bg': '#1a2428', 'accent': '#44ccaa'},
    'squares-immersive': {'name': 'Squares Immersive', 'desc': 'Flip tiles by gesturing at them!', 'cls': 'sqi', 'icon': '🔳', 'bg': '#254653', 'accent': '#f59e0b'},
    'story-trail-immersive': {'name': 'Story Trail Immersive', 'desc': 'Read and explore stories with your camera!', 'cls': 'sti', 'icon': '📖', 'bg': '#1a1a2e', 'accent': '#88ccff'},
    'super-word-immersive': {'name': 'Super Word Immersive', 'desc': 'Find hidden letters with your camera!', 'cls': 'swi', 'icon': '🪄', 'bg': '#1a1a33', 'accent': '#ce93d8'},
    'train-sounds-immersive': {'name': 'Train Sounds Immersive', 'desc': 'Point at train parts with your camera to hear them!', 'cls': 'tsi', 'icon': '🚆', 'bg': '#1a2233', 'accent': '#ff6644'},
    'waterwall-immersive': {'name': 'Waterwall Immersive', 'desc': 'Use your camera to place barriers and redirect water!', 'cls': 'wi', 'icon': '🌊', 'bg': '#0a1a2a', 'accent': '#44aaff'},
}

TEMPLATE = '''/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameTabbedModal, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { ATTR_NAME } from './attributions.js'
import { INFO_NAME } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: 'BG_COLee' }

export async function FUNC_NAME() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="GAME_NAME"
      description="GAME_DESC"
      path="/SLUG/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/SLUG.css']}
      scripts={['/client/SLUG/main.js?v=__BUILD_SHA__']}
      bodyClass="SLUG-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/SLUG/manifest.json"
      serviceWorkerPath="/SLUG/sw.js"
      serviceWorkerScope="/SLUG/"
    >
      <div className="scene-track">
        <section id="start-screen" className="game-screen active" aria-labelledby="start-heading">
          <div className="CLS-start-panel">
            <h1 id="start-heading" className="CLS-title">ICON GAME_NAME</h1>
            <p className="CLS-subtitle">GAME_DESC</p>
            <p className="CLS-camera-prompt" id="camera-prompt">Requesting camera access…</p>
            <button id="start-btn" type="button" className="CLS-primary-btn">Start</button>
          </div>
        </section>

        <section id="game-screen" className="game-screen" hidden aria-hidden="true">
          <div className="CLS-game-panel">
            <div className="CLS-game-area">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="end-screen" className="game-screen" hidden aria-hidden="true">
          <div className="CLS-end-panel">
            <h2 className="CLS-title">Great session!</h2>
            <p id="score-display">Score: 0</p>
            <button id="replay-btn" type="button" className="CLS-primary-btn">Play Again</button>
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
            <p>{INFO_NAME.summary}</p>
            {ATTR_NAME.entries.map((e) => <p key={e.title}>{e.title} — {e.license}</p>)}
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript><p>Enable JavaScript and camera to play GAME_NAME.</p></noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
'''

for slug, info in GAMES.items():
    attr_slug = slug.replace('-', '')
    content = TEMPLATE
    content = content.replace('ATTR_NAME', f'{attr_slug}Attribution')
    content = content.replace('INFO_NAME', f'{attr_slug}Info')
    content = content.replace('FUNC_NAME', f'{attr_slug}Action')
    content = content.replace('BG_COL', info['bg'])
    content = content.replace('GAME_NAME', info['name'])
    content = content.replace('GAME_DESC', info['desc'])
    content = content.replace('SLUG', slug)
    content = content.replace('CLS', info['cls'])
    content = content.replace('ICON', info['icon'])

    path = os.path.join(BASE, 'games', slug, 'controller.tsx')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Generated: {slug}/controller.tsx')