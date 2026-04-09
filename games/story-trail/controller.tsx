import { renderToString } from '@remix-run/component/server'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameHeaderPill, GameScreen, GameTabbedModal, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { storyTrailInfo } from './info.js'

export async function storyTrailAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const infoPagePath = withBasePath('/story-trail/info/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Story Trail"
      description="Read, explore, and solve puzzles on five adventure trails."
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
        leftContent={<GameHeaderPill icon="📖" value={<span id="badge-counter">0/5</span>} />}
        rightContent={
          <button id="menu-btn" className="menu-btn" data-settings-open="true" aria-label="Open menu" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false" type="button">☰</button>
        }
      />

      <div id="game-area" data-active-screen="trail-map">
        <GameScreen id="trail-map" labelledBy="trail-heading">
          <h1 id="trail-heading">Story Trail</h1>
          <div id="trail-stops"></div>
        </GameScreen>

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
            <SettingsToggle id="music-enabled-toggle" label="Music" helpId="music-enabled-help" defaultChecked={true} />
            <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpId="sfx-enabled-help" defaultChecked={true} />
            <SettingsToggle id="reduce-motion-toggle" label="Reduce Motion" helpId="reduce-motion-help" />
          </SettingsSection>
          <SettingsSection title="Controls">
            <ul className="story-trail-controls-list">
              <li>Tap any trail stop to start a story.</li>
              <li>Tap a choice to keep reading. Locked choices give hints.</li>
              <li><kbd>Arrow keys</kbd> or <kbd>D-pad</kbd> move. <kbd>Enter</kbd>, <kbd>Space</kbd>, or <kbd>A</kbd> choose.</li>
              <li>Press <kbd>I</kbd> for your bag. Press <kbd>Start</kbd> for the menu.</li>
            </ul>
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
