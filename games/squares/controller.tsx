import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'

import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import {
  GameHeader,
  GameHeaderPill,
  GameScreen,
  GameTabbedModal,
  InfoAttribution,
  InfoSection,
  SettingsSection,
  SettingsToggle,
  SrOnly,
} from '../../app/ui/game-shell.js'

import { squaresAttribution } from './attributions.js'
import { squaresInfo } from './info.js'
import { SQUARES_MODES } from './types.js'

const squaresModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(9, 12, 16, 0.78)',
}

export async function squaresAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Squares"
      description="Flip a calm grid into one shared color with plus and X patterns, local high scores, and synthesized sound."
      path="/squares/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/squares.css']}
      scripts={['/client/squares/main.js']}
      bodyClass="squares-game"
      viewportFitCover
      faviconPath="/favicon-game-squares.svg"
      manifestPath="/squares/manifest.json"
      serviceWorkerPath="/squares/sw.js"
      serviceWorkerScope="/squares/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="squares-title" padded>
          <div className="squares-screen-panel squares-start-panel">
            <GameHeader
              headingId="squares-title"
              className="squares-header"
              leftContent={<>
                <div className="squares-heading-block">
                  <p className="squares-kicker">Pattern puzzle</p>
                  <h1 id="squares-title" className="squares-title">Squares</h1>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="squares-menu-btn"
                data-settings-open="true"
                data-squares-menu-button="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="squares-hero-copy">
              <p className="squares-subtitle">Make the whole board match. Pick a mode and start playing.</p>
            </div>

            <div className="squares-mode-cards">
              {SQUARES_MODES.map((mode) => (
                <div key={mode.id} className="squares-mode-card">
                  <h2 className="squares-mode-label">{mode.label}</h2>
                  <p className="squares-mode-desc">{mode.description}</p>
                  <p className="squares-mode-best"><span className="squares-mode-best-key">Best</span> <strong id={`start-high-${mode.id}`}>No record yet</strong></p>
                  <button id={`start-${mode.id}-btn`} type="button" className="squares-primary-btn">{`Play ${mode.label}`}</button>
                </div>
              ))}
            </div>

            <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Ⓐ to play · Start for menu</p>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="squares-game-heading">
          <div className="squares-screen-panel squares-game-panel">
            <GameHeader
              headingId="squares-game-heading"
              className="squares-header squares-header-game"
              leftContent={<>
                <div className="squares-heading-block squares-heading-block-compact">
                  <h2 id="squares-game-heading" className="squares-title squares-title-small">Squares</h2>
                </div>
                <div className="squares-hud-pill-row">
                  <GameHeaderPill value={<span><span className="hud-pill-key">Mode</span> <strong id="hud-mode-label">{SQUARES_MODES[1].label}</strong></span>} />
                  <GameHeaderPill value={<span><span className="hud-pill-key">Best</span> <strong id="hud-high-score-value">No record yet</strong></span>} />
                  <GameHeaderPill value={<span><span className="hud-pill-key">Moves</span> <strong id="hud-move-count">0</strong></span>} />
                </div>
              </>}
              rightContent={<button
                type="button"
                className="squares-menu-btn"
                data-settings-open="true"
                data-squares-menu-button="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div id="squares-runtime-root" className="squares-runtime-host"></div>
          </div>
        </GameScreen>

        <GameScreen id="win-screen" labelledBy="squares-win-heading" padded>
          <div className="squares-screen-panel squares-win-panel">
            <GameHeader
              headingId="squares-win-heading"
              className="squares-header"
              leftContent={<>
                <div className="squares-heading-block">
                  <p className="squares-kicker">Solved board</p>
                  <h2 id="squares-win-heading" className="squares-title">Tidy finish</h2>
                </div>
              </>}
              rightContent={<button
                type="button"
                className="squares-menu-btn"
                data-settings-open="true"
                data-squares-menu-button="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="squares-win-card">
              <p id="win-summary" className="squares-win-summary">Solved in 0 moves.</p>
              <p id="win-high-score-value" className="squares-win-score">No record yet</p>
              <div className="squares-win-actions">
                <button id="replay-btn" type="button" className="squares-primary-btn" data-squares-restart-button="true">Replay this puzzle</button>
                <button id="new-puzzle-btn" type="button" className="squares-primary-btn">New puzzle</button>
                <button id="change-mode-btn" type="button" className="squares-secondary-btn">Change mode</button>
                <a href={homePath} className="squares-secondary-link">Quit</a>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={squaresModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
              <div id="music-track-picker-slot"></div>
              <SettingsToggle id="sfx-enabled-toggle" label="Sound effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="squares-controls-grid">
                <p><strong>Mouse:</strong> Click a tile to play it. Right-click a tile to switch between plus and X.</p>
                <p><strong>Keyboard:</strong> Arrow keys move. <kbd>Enter</kbd> or <kbd>Space</kbd> plays. <kbd>T</kbd> or <kbd>X</kbd> switches the pattern.</p>
                <p><strong>Touch:</strong> Tap a tile to play it. Press and hold a tile to switch the pattern before you move.</p>
                <p><strong>Controller:</strong> D-pad or stick moves focus. <kbd>A</kbd> plays. <kbd>L1</kbd> switches the pattern. <kbd>Start</kbd> opens the menu.</p>
              </div>
            </SettingsSection>

            <SettingsSection title="Accessibility">
              <SettingsToggle
                id="reduce-motion-toggle"
                label="Reduce motion"
                helpText="Defaults to your device setting until you change it here."
                helpId="reduce-motion-help"
              />
            </SettingsSection>

            <SettingsSection title="High scores">
              <div className="squares-high-score-grid">
                <div>
                  <p className="squares-settings-score-label">1{'\u00d7'}1 best</p>
                  <p id="settings-high-1x1" className="squares-settings-score-value">No record yet</p>
                  <button id="high-score-reset-1x1-btn" type="button" className="squares-secondary-btn squares-secondary-btn-small">Reset</button>
                </div>
                <div>
                  <p className="squares-settings-score-label">+/{'\u00d7'} best</p>
                  <p id="settings-high-plusx" className="squares-settings-score-value">No record yet</p>
                  <button id="high-score-reset-plusx-btn" type="button" className="squares-secondary-btn squares-secondary-btn-small">Reset</button>
                </div>
              </div>
            </SettingsSection>
          </>}
          infoContent={<>
            <InfoSection title="About Squares">
              <p>{squaresInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {squaresAttribution.entries.map((entry) => <InfoAttribution attribution={{
                title: entry.title,
                author: entry.creator,
                license: entry.license,
                url: entry.sourceUrl,
                notes: entry.notes,
              }} />)}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-squares">
          <p>Squares needs JavaScript for the board, audio, and local high scores. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}