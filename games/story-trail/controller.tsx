import { renderToString } from '@remix-run/component/server'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameScreen, GameTabbedModal, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { storyTrailInfo } from './info.js'

export async function storyTrailAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const infoPagePath = withBasePath('/story-trail/info/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Story Trail — The Hidden Garden"
      description="Explore a secret garden. Collect items, solve puzzles, and discover different endings."
      path="/story-trail/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/story-trail.css']}
      includeDefaultStyles={false}
      scripts={['/client/story-trail/main.js']}
      bodyClass="story-trail-game"
      viewportFitCover
      faviconPath="/favicon-game-story-trail.svg"
      manifestPath="/story-trail/manifest.json"
    >
      <GameHeader
        leftContent={<></>}
        rightContent={
          <button id="menu-btn" className="menu-btn" data-settings-open="true" aria-label="Open menu" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false" type="button">☰</button>
        }
      />

      <div id="game-area" data-active-screen="start-screen">
        <section id="start-screen" className="trail-start-screen" aria-labelledby="trail-title">
          <div className="trail-start-shell">
            <h1 id="trail-title" className="trail-title">Story Trail</h1>
            <p className="trail-subtitle">Five adventure stories for young readers.</p>
            <div className="start-actions">
              <button id="start-btn" className="trail-btn trail-btn-primary" type="button">Begin</button>
            </div>
            <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Ⓐ to begin · Start for menu</p>
          </div>
        </section>

        <GameScreen id="scene-view" labelledBy="scene-heading">
          <h2 id="scene-heading" className="sr-only">Scene</h2>
          <div id="scene-illustration" className="scene-illustration"></div>
          <p id="scene-text" className="scene-text" aria-live="polite"></p>
          <div id="hint-area" className="hint-area" role="alert" hidden></div>
          <div id="item-flash" className="item-flash" role="status" hidden></div>
          <div id="choices" className="choices"></div>
          <div id="inventory-bar" className="inventory-bar" aria-label="Inventory"></div>
        </GameScreen>

        <GameScreen id="completion-view" labelledBy="completion-heading">
          <h2 id="completion-heading" className="sr-only">Story Complete</h2>
        </GameScreen>

        <div id="inventory-overlay" className="inventory-overlay" role="dialog" aria-modal="true" aria-label="Inventory" hidden></div>
      </div>

      <SrOnly id="game-status" ariaLive="polite" />
      <SrOnly id="game-feedback" ariaLive="assertive" />

      <GameTabbedModal
        title="Menu"
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="Audio">
            <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
            <div id="music-track-picker-slot"></div>
            <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
          </SettingsSection>
          <SettingsSection title="Controls">
            <ul className="story-trail-controls-list">
              <li>Tap a choice to keep reading. Locked choices give hints.</li>
              <li><kbd>Arrow keys</kbd> or <kbd>D-pad</kbd> move. <kbd>Enter</kbd>, <kbd>Space</kbd>, or <kbd>A</kbd> choose.</li>
              <li>Tap an item in the bar or bag to hold it.</li>
              <li>Hold the right item, then tap the matching choice.</li>
              <li>Press <kbd>I</kbd> for your bag. Press <kbd>Start</kbd> for the menu.</li>
            </ul>
          </SettingsSection>
          <SettingsSection title="Accessibility">
            <SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Defaults to your device setting until you change it here." helpId="reduce-motion-help" />
          </SettingsSection>
        </>}
        infoContent={<>
          <InfoSection title="About Story Trail">
            <p>{storyTrailInfo.summary}</p>
          </InfoSection>
          <p className="info-more-link"><a href={infoPagePath}>More info, credits &amp; attributions →</a></p>
        </>}
      />

      <noscript>
        <div className="noscript-message">
          <p>Story Trail needs JavaScript to run — it's a game after all! Enable JavaScript in your browser settings and refresh to play.</p>
        </div>
      </noscript>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
