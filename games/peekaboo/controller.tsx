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

import { peekabooAttribution } from './attributions.js'
import { peekabooInfo } from './info.js'

const peekabooModalOverlayStyles = {
  zIndex: 100,
  background: 'var(--peekaboo-modal-overlay, rgba(5, 8, 14, 0.92))',
}

export async function peekabooAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Peekaboo"
      description="Find the hidden character! Look through the fog to discover who's hiding."
      path="/peekaboo/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/peekaboo.css']}
      scripts={['/client/peekaboo/main.js']}
      bodyClass="peekaboo-game"
      viewportFitCover
      faviconPath="/favicon-game-peekaboo.svg"
      manifestPath="/peekaboo/manifest.json"
      serviceWorkerPath="/peekaboo/sw.js"
      serviceWorkerScope="/peekaboo/"
    >
      <div id="peekaboo-game-area" data-active-screen="meet-screen" className="scene-track">
        <GameScreen id="peekaboo-meet-screen" className="active" labelledBy="peekaboo-meet-heading" padded>
          <div className="peekaboo-screen-panel peekaboo-meet-panel">
            <GameHeader
              headingId="peekaboo-meet-heading"
              className="peekaboo-header"
              leftContent={<>
                <div className="peekaboo-heading-block">
                  <p className="peekaboo-kicker">Hidden character</p>
                  <h1 id="peekaboo-meet-heading" className="peekaboo-title">Peekaboo</h1>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="peekaboo-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="peekaboo-meet-hero">
              <span id="peekaboo-meet-target-emoji" className="peekaboo-meet-emoji" aria-hidden="true"></span>
              <p className="peekaboo-meet-subtitle">Can you find who's hiding?</p>
            </div>

            <button type="button" className="peekaboo-primary-btn peekaboo-proceed-btn">Ready!</button>
          </div>
        </GameScreen>

        <GameScreen id="peekaboo-enter-screen" labelledBy="peekaboo-enter-heading">
          <div className="peekaboo-screen-panel peekaboo-enter-panel">
            <GameHeader
              headingId="peekaboo-enter-heading"
              className="peekaboo-header"
              leftContent={<>
                <div className="peekaboo-heading-block">
                  <h2 id="peekaboo-enter-heading" className="peekaboo-title peekaboo-title-small">Peekaboo</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="peekaboo-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div id="peekaboo-enter-scene" className="peekaboo-enter-scene" aria-hidden="true"></div>
            <div className="peekaboo-enter-content">
              <div className="peekaboo-enter-body">
                <p id="peekaboo-enter-hint">Someone is hiding in the scene...</p>
              </div>

              <button type="button" className="peekaboo-primary-btn peekaboo-proceed-btn">Find them!</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="peekaboo-playing-screen" labelledBy="peekaboo-playing-heading">
          <div className="peekaboo-screen-panel peekaboo-playing-panel">
            <GameHeader
              headingId="peekaboo-playing-heading"
              className="peekaboo-header"
              leftContent={<>
                <div className="peekaboo-heading-block">
                  <h2 id="peekaboo-playing-heading" className="peekaboo-title peekaboo-title-small">Peekaboo</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="peekaboo-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="peekaboo-game-body">
              <div id="peekaboo-scene-layer" className="peekaboo-scene-layer" aria-hidden="true"></div>
              <div id="peekaboo-fog-grid" className="peekaboo-fog-grid" role="grid" aria-label="Fog grid"></div>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="peekaboo-found-screen" labelledBy="peekaboo-found-heading" padded>
          <div className="peekaboo-screen-panel peekaboo-found-panel">
            <GameHeader
              headingId="peekaboo-found-heading"
              className="peekaboo-header"
              leftContent={<>
                <div className="peekaboo-heading-block">
                  <p className="peekaboo-kicker">Found!</p>
                  <h2 id="peekaboo-found-heading" className="peekaboo-title">Peekaboo</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="peekaboo-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="peekaboo-found-card">
              <span id="peekaboo-found-target-emoji" className="peekaboo-found-emoji" aria-hidden="true"></span>
              <button type="button" className="peekaboo-primary-btn peekaboo-play-again-btn">Play again</button>
              <a href={homePath} className="peekaboo-secondary-link">Quit</a>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={peekabooModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
              <SettingsToggle id="sfx-enabled-toggle" label="Sound effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
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
            <InfoSection title="About Peekaboo">
              <p>{peekabooInfo.summary}</p>
            </InfoSection>
            <InfoSection title="How to play">
              <p>Look at the character, then watch the fog roll in. Tap fog cells to clear them. If you see scenery, tap it to peek behind — the character might be hiding there!</p>
            </InfoSection>
            <InfoSection title="Credits">
              {peekabooAttribution.entries.map((entry) => <InfoAttribution attribution={{
                title: entry.title,
                author: entry.creator,
                license: entry.license,
                url: entry.sourceUrl,
                notes: entry.notes,
              }} />)}
              {peekabooAttribution.entries.length === 0 && <p>All game content is original. Emoji are standard Unicode.</p>}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-peekaboo">
          <p>Peekaboo needs JavaScript for the fog grid, audio, and interactions. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}