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
import { DEFAULT_SQUARES_MUSIC_PROFILE_ID, SQUARES_MUSIC_PROFILES } from './sounds.js'
import { SQUARES_BOARD_PRESETS, SQUARES_RULESETS, SQUARES_THEME_PRESETS } from './types.js'

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
              <p className="squares-subtitle">Make the whole board match. Switch between plus and X when the rules let you.</p>
              <p className="squares-start-hint">Menu holds setup, controls, audio, reduce motion, high score reset, and credits. Start keeps the current scramble. Restart replays the same scramble.</p>
            </div>

            <section className="squares-summary-card" aria-labelledby="start-setup-heading">
              <div className="squares-summary-row">
                <div>
                  <h2 id="start-setup-heading">Current setup</h2>
                  <p id="start-setup-label" className="squares-summary-value">Pocket 3x3 · Classic Hybrid</p>
                </div>
                <div>
                  <h2>Theme pair</h2>
                  <p id="start-theme-label" className="squares-summary-value">Harbor Dawn</p>
                </div>
              </div>
              <div className="squares-summary-row squares-summary-row-score">
                <div>
                  <h2 id="start-high-score-label">High score for Pocket 3x3 · Classic Hybrid</h2>
                  <p id="start-high-score-value" className="squares-summary-score">No high score yet</p>
                </div>
                <p className="squares-summary-note">High score stays on this device only.</p>
              </div>
            </section>

            <div className="squares-start-actions">
              <button id="start-btn" type="button" className="squares-primary-btn" data-squares-restart-button="true">Start puzzle</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="squares-game-heading">
          <div className="squares-screen-panel squares-game-panel">
            <GameHeader
              headingId="squares-game-heading"
              className="squares-header squares-header-game"
              leftContent={<>
                <div className="squares-heading-block squares-heading-block-compact">
                  <p className="squares-kicker">Calm mode</p>
                  <h2 id="squares-game-heading" className="squares-title squares-title-small">Squares</h2>
                </div>
                <div className="squares-hud-pill-row">
                  <GameHeaderPill value={<span id="hud-setup-label">Pocket 3x3 · Classic Hybrid</span>} />
                  <GameHeaderPill value={<span><span className="hud-pill-key">High score</span> <strong id="hud-high-score-value">No high score yet</strong></span>} />
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

            <p id="hud-high-score-context" className="squares-hud-context">High score bucket: Pocket 3x3 · Classic Hybrid</p>
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
              <p id="win-high-score-context" className="squares-win-context">High score for Pocket 3x3 · Classic Hybrid</p>
              <p id="win-high-score-value" className="squares-win-score">No high score yet</p>
              <div className="squares-win-actions">
                <button id="play-again-btn" type="button" className="squares-primary-btn" data-squares-restart-button="true">Replay this scramble</button>
                <button id="start-over-btn" type="button" className="squares-secondary-btn">Pick a new setup</button>
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
            <SettingsSection title="Setup">
              <p className="squares-settings-note">Board and rules changes update the high score label right away and apply the next time you start.</p>
              <label className="squares-field" htmlFor="board-preset-select">
                <span>Board preset</span>
                <select id="board-preset-select" defaultValue={SQUARES_BOARD_PRESETS[0].id}>
                  {SQUARES_BOARD_PRESETS.map((preset) => <option value={preset.id}>{preset.label}</option>)}
                </select>
              </label>
              <label className="squares-field" htmlFor="ruleset-select">
                <span>Ruleset</span>
                <select id="ruleset-select" defaultValue={SQUARES_RULESETS[0].id}>
                  {SQUARES_RULESETS.map((ruleset) => <option value={ruleset.id}>{ruleset.label}</option>)}
                </select>
              </label>
              <label className="squares-field" htmlFor="theme-preset-select">
                <span>Theme pair</span>
                <select id="theme-preset-select" defaultValue={SQUARES_THEME_PRESETS[0].id}>
                  {SQUARES_THEME_PRESETS.map((preset) => <option value={preset.id}>{preset.label}</option>)}
                </select>
              </label>
            </SettingsSection>

            <SettingsSection title="Audio">
              <label className="squares-field" htmlFor="music-profile-select">
                <span>Music choice</span>
                <select id="music-profile-select" defaultValue={DEFAULT_SQUARES_MUSIC_PROFILE_ID}>
                  {SQUARES_MUSIC_PROFILES.map((profile) => <option value={profile.id}>{profile.label}</option>)}
                </select>
              </label>
              <p id="music-profile-help" className="squares-settings-note">Chill is the default. Tense adds a tighter pulse.</p>
              <SettingsToggle id="music-enabled-toggle" label="Music" helpId="music-enabled-help" defaultChecked={true} />
              <SettingsToggle id="sfx-enabled-toggle" label="Sound effects" helpId="sfx-enabled-help" defaultChecked={true} />
            </SettingsSection>

            <SettingsSection title="High score">
              <p id="settings-high-score-label" className="squares-settings-score-label">High score for Pocket 3x3 · Classic Hybrid</p>
              <p id="settings-high-score-value" className="squares-settings-score-value">No high score yet</p>
              <button id="high-score-reset-btn" type="button" className="squares-secondary-btn">Reset high score</button>
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