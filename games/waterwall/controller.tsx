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

import { waterwallAttribution } from './attributions.js'
import { waterwallInfo } from './info.js'
import { WATERWALL_THEMES } from './types.js'

export async function waterwallAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Waterwall"
      description="A zen waterfall sandbox. Place barriers to redirect falling water and listen as the sound follows the flow."
      path="/waterwall/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/waterwall.css']}
      scripts={['/client/waterwall/main.js']}
      bodyClass="waterwall-game"
      viewportFitCover
      faviconPath="/favicon-game-waterwall.svg"
      manifestPath="/waterwall/manifest.json"
      serviceWorkerPath="/waterwall/sw.js"
      serviceWorkerScope="/waterwall/"
    >
      <GameScreen id="waterwall-game-screen" className="active" labelledBy="waterwall-title">
        <GameHeader
          headingId="waterwall-title"
          leftContent={<>
            <h1 id="waterwall-title" className="waterwall-title">Waterwall</h1>
          </>}
          rightContent={<button
            type="button"
            id="waterwall-menu-btn"
            className="waterwall-menu-btn"
            data-settings-open="true"
            aria-haspopup="dialog"
            aria-controls="settings-modal"
            aria-expanded="false"
          >
            Menu
          </button>}
        />

        <div id="waterwall-canvas-container"></div>
      </GameScreen>

      <GameTabbedModal
        title="Waterwall"
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="Background theme">
            <label className="waterwall-field" htmlFor="waterwall-theme-select">
              <span>Theme</span>
              <select id="waterwall-theme-select" defaultValue={WATERWALL_THEMES[0].id}>
                {WATERWALL_THEMES.map((theme) => <option value={theme.id}>{theme.label}</option>)}
              </select>
            </label>
          </SettingsSection>

          <SettingsSection title="Audio">
            <SettingsToggle id="sfx-toggle" label="Sound effects" defaultChecked />
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
          <InfoSection title="About Waterwall">
            <p>{waterwallInfo.summary}</p>
          </InfoSection>
          <InfoSection title="Credits">
            {waterwallAttribution.entries.map((entry) => <InfoAttribution attribution={{
              title: entry.title,
              author: entry.creator,
              license: entry.license,
              url: entry.sourceUrl,
              notes: entry.notes,
            }} />)}
          </InfoSection>
        </>}
      />

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-waterwall">
          <p>Waterwall needs JavaScript for the canvas simulation, audio, and input. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
