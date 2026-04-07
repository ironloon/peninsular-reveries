import { renderToString } from '@remix-run/component/server'
import { getGameAttribution } from '../data/attributions/index.js'
import { MISSION_CREW_ROSTER } from '../data/mission-orbit-data.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'
import {
  GameHeader,
  GameScreen,
  GameTabbedModal,
  InfoSection,
  InfoAttribution,
  SettingsSection,
  SettingsToggle,
  SrOnly,
} from '../ui/game-shell.js'

const missionOrbitModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(4, 10, 18, 0.7)',
}

export async function missionOrbitAction() {
  const attribution = getGameAttribution('mission-orbit')
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Mission: Orbit"
      description="Guide an Artemis II-inspired trip from countdown to Pacific splashdown, one calm mission step at a time."
      path="/mission-orbit/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/mission-orbit.css']}
      includeDefaultStyles={false}
      scripts={['/client/mission-orbit/main.js']}
      bodyClass="mission-orbit-game"
      viewportFitCover
      manifestPath="/mission-orbit/manifest.json"
      serviceWorkerPath="/mission-orbit/sw.js"
      serviceWorkerScope="/mission-orbit/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="mission-title" padded>
          <div className="start-shell">
            <GameHeader
              leftContent={
                <>
                  <p className="mission-kicker">Artemis II-inspired mission</p>
                  <h1 id="mission-title" className="mission-title">Mission: Orbit</h1>
                </>
              }
              rightContent={
                <button
                  data-settings-open="true"
                  className="mission-btn mission-btn-secondary"
                  aria-haspopup="dialog"
                  aria-controls="settings-modal"
                  aria-expanded="false"
                >
                  Menu
                </button>
              }
            />
            <p className="mission-subtitle">A guided trip from the pad to the Moon and back home.</p>

            <section className="crew-picker-panel" aria-labelledby="crew-roster-title">
              <h2 id="crew-roster-title" className="crew-picker-title">Artemis II crew</h2>
              <p className="crew-picker-copy">These four astronauts ride with you through launch, lunar flyby, and recovery.</p>
              <div className="crew-picker-grid">
                {MISSION_CREW_ROSTER.map((crew) => (
                  <article
                    className="crew-option crew-option-static"
                    aria-label={`${crew.name}, ${crew.role}, ${crew.agency}`}
                  >
                    <div className="crew-option-body">
                      <span
                        className="crew-option-badge"
                        style={`--crew-accent:${crew.accent};--crew-accent-soft:${crew.accentSoft}`}
                        data-crew-badge={crew.id}
                      >
                        {crew.badge}
                      </span>
                      <span className="crew-option-copy">
                        <strong>{crew.name}</strong>
                        <span>{crew.role} · {crew.agency}</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="start-actions">
              <button id="start-btn" className="mission-btn mission-btn-primary">Begin Mission</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="scene-progress-label">
          <div className="game-screen-inner">
            <GameHeader
              leftContent={
                <span id="scene-progress-label" className="mission-progress-pill">Scene 1 of 8</span>
              }
              rightContent={
                <button
                  data-settings-open="true"
                  className="mission-btn mission-btn-secondary"
                  aria-haspopup="dialog"
                  aria-controls="settings-modal"
                  aria-expanded="false"
                >
                  Menu
                </button>
              }
            />
            <div className="mission-content">
              <div id="cinematic-pane" aria-hidden="true" data-cinematic="launch-pad"></div>
              <div id="narrative-pane">
                <h2 id="scene-title" className="scene-title" aria-hidden="true"></h2>
                <p id="briefing-text" className="briefing-text"></p>
                <p id="interaction-prompt" className="interaction-prompt" hidden></p>
                <div id="interaction-area" className="interaction-area">
                  <button id="tap-btn" type="button" className="tap-btn" aria-label="Take action" hidden>
                    Take action
                  </button>
                  <div id="tap-count-display" className="tap-count-display" hidden aria-live="polite"></div>
                  <div id="hold-progress" className="hold-progress" hidden aria-hidden="true">
                    <div id="hold-progress-bar" className="hold-progress-bar"></div>
                  </div>
                </div>
                <div id="observe-display" className="observe-display" hidden aria-live="polite"></div>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="mission-end-heading" padded>
          <div className="end-shell">
            <p className="mission-kicker">Pacific splashdown</p>
            <h2 id="mission-end-heading" className="mission-title mission-title-end">Mission Complete!</h2>
            <p className="mission-subtitle">The crew has returned safely from their journey around the Moon.</p>
            <div className="crew-picker-grid">
              {MISSION_CREW_ROSTER.map((crew) => (
                <article
                  className="crew-option crew-option-static"
                  aria-label={`${crew.name}, ${crew.role}`}
                >
                  <div className="crew-option-body">
                    <span
                      className="crew-option-badge"
                      style={`--crew-accent:${crew.accent};--crew-accent-soft:${crew.accentSoft}`}
                    >
                      {crew.badge}
                    </span>
                    <span className="crew-option-copy">
                      <strong>{crew.name}</strong>
                      <span>{crew.role}</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="start-actions">
              <button id="play-again-btn" className="mission-btn mission-btn-primary">Play Again</button>
              <a href={homePath} className="mission-btn mission-btn-secondary">Quit</a>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={missionOrbitModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="🎵 Audio">
              <SettingsToggle id="music-enabled-toggle" label="Music" helpId="music-enabled-help" defaultChecked={true} />
              <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpId="sfx-enabled-help" defaultChecked={true} />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="controls-grid mission-controls-grid">
                <div>
                  <h4>Touch / mouse</h4>
                  <ul className="controls-list">
                    <li>Tap or hold the action button for each scene.</li>
                    <li>Read the mission brief and continue when ready.</li>
                  </ul>
                </div>
                <div>
                  <h4>Keyboard</h4>
                  <ul className="controls-list">
                    <li><kbd>Space</kbd> or <kbd>Enter</kbd> fires the action.</li>
                    <li>The mission waits at each step until you move on.</li>
                  </ul>
                </div>
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
            <InfoSection title="About Mission: Orbit">
              <p>{attribution.summary}</p>
            </InfoSection>
            {attribution.entries.map((entry) => (
              <InfoAttribution attribution={{ title: entry.title, author: entry.creator, license: entry.license, url: entry.sourceUrl, notes: entry.notes }} />
            ))}
          </>}
        />
      </div>

      <SrOnly id="sr-announcer" ariaLive="polite" ariaAtomic />

      <noscript>
        <div className="noscript-message">
          <p>Mission: Orbit needs JavaScript to run. Enable JavaScript and reload to fly the mission.</p>
        </div>
      </noscript>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
