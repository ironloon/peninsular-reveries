import { renderToString } from 'remix/component/server'
import { getGameAttribution } from '../data/attributions/index.js'
import { MISSION_CREW_ROSTER } from '../data/mission-orbit-crew.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'
import { GameScreen, GameSettingsModal, SrOnly } from '../ui/game-shell.js'

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
            <p className="mission-kicker">Artemis II-inspired mission</p>
            <h1 id="mission-title" className="mission-title">Mission: Orbit</h1>
            <p className="mission-subtitle">A guided trip from the pad to the Moon and back home.</p>

            <ol className="mission-outline" aria-label="Mission outline">
              <li>Count down and leave Earth.</li>
              <li>Follow Orion around the Moon.</li>
              <li>Watch splashdown and the recovery boat come in.</li>
            </ol>

            <section className="crew-picker-panel" aria-labelledby="crew-roster-title" aria-describedby="crew-picker-help">
              <h2 id="crew-roster-title" className="crew-picker-title">Artemis II crew</h2>
              <p className="crew-picker-copy">These four astronauts ride with you through launch, lunar flyby, and recovery.</p>
              <div className="crew-picker-grid">
                {MISSION_CREW_ROSTER.map((crew) => (
                  <article className="crew-option crew-option-static" aria-label={`${crew.name}, ${crew.role}, ${crew.agency}`}>
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
              <p id="crew-picker-help" className="settings-help">Crew is locked in. You guide the pace, and the mission waits for you.</p>
            </section>

            <div className="start-actions">
              <button id="start-btn" className="mission-btn mission-btn-primary">Begin countdown</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
            </div>

            <p id="gamepad-start-hint" className="start-hint" hidden>Controller A starts the mission.</p>
          </div>
        </GameScreen>

        <GameScreen id="mission-screen" labelledBy="mission-phase-label" padded>
          <div className="mission-shell">
            <header className="mission-header">
              <div>
                <p className="header-label">Mission phase</p>
                <h2 id="mission-phase-label" className="mission-phase-label">Final countdown</h2>
              </div>
              <div className="mission-header-stats">
                <span id="mission-step-pill" className="mission-pill">Step 1 / 10</span>
                <span id="mission-day-pill" className="mission-pill">Flight Day 1</span>
                <span id="mission-clock" className="mission-pill">00:00</span>
              </div>
            </header>

            <div id="mission-stage-shell" className="mission-stage-shell">
              <svg id="mission-map" className="mission-map" viewBox="0 0 100 100" aria-hidden="true">
                <g id="mission-stars"></g>
                <path id="mission-free-return" d="M 34 69 C 45 58, 58 44, 69 31 C 75 24, 82 20, 87 22 C 92 25, 91 34, 84 40 C 72 49, 58 60, 38 73" />
                <path id="mission-orbit-path" d="M 22 59 C 34 59, 42 66, 42 76 C 42 86, 34 93, 22 93 C 10 93, 2 86, 2 76 C 2 66, 10 59, 22 59 Z" />

                <circle id="mission-earth-glow" cx="22" cy="76" r="20" />
                <circle id="mission-earth" cx="22" cy="76" r="16" />
                <path id="mission-earth-continent-a" d="M 14 75 C 16 68, 23 67, 25 72 C 27 76, 24 81, 19 81 C 15 80, 13 78, 14 75 Z" />
                <path id="mission-earth-continent-b" d="M 26 83 C 28 80, 31 80, 33 83 C 31 86, 28 87, 26 83 Z" />

                <circle id="mission-moon-glow" cx="80" cy="26" r="10" />
                <circle id="mission-moon" cx="80" cy="26" r="7" />
                <circle className="mission-moon-crater" cx="77" cy="24" r="1.3" />
                <circle className="mission-moon-crater" cx="82" cy="28" r="1.1" />
                <circle className="mission-moon-crater" cx="79" cy="30" r="0.9" />

                <rect id="mission-launch-pad" x="17.5" y="84" width="9" height="6" rx="1" />
                <rect id="mission-ocean" x="0" y="85" width="100" height="15" />
                <ellipse id="mission-splash" cx="55" cy="85" rx="7" ry="2" />

                <g id="mission-rocket" transform="translate(22 78)">
                  <circle id="mission-rocket-hit-area" cx="0" cy="0" r="12" />
                  <circle id="mission-rocket-glow" cx="0" cy="0" r="9.6" />
                  <circle id="mission-rocket-cue-ring" cx="0" cy="0" r="7.8" />
                  <g id="mission-rocket-frame">
                    <g id="mission-service-module">
                      <rect x="-1.9" y="3.8" width="3.8" height="6" rx="1.2" />
                    </g>
                    <g id="mission-parachute">
                      <path d="M -7 -10 C -4 -16, 4 -16, 7 -10" />
                      <line x1="-4.5" y1="-10" x2="-2" y2="-2" />
                      <line x1="0" y1="-10.5" x2="0" y2="-2" />
                      <line x1="4.5" y1="-10" x2="2" y2="-2" />
                    </g>
                    <g id="mission-flame">
                      <path d="M -1.3 10 C -3 15, -1 18, 0 20 C 1 18, 3 15, 1.3 10 Z" />
                    </g>
                    <path id="mission-capsule" d="M 0 -8 C 4 -7, 5 -2, 5 3 C 5 8, 2 10, 0 10 C -2 10, -5 8, -5 3 C -5 -2, -4 -7, 0 -8 Z" />
                    <circle id="mission-window" cx="0" cy="-1" r="1.6" />
                    <path id="mission-fin-left" d="M -5 4 L -7 8 L -4 8 Z" />
                    <path id="mission-fin-right" d="M 5 4 L 7 8 L 4 8 Z" />
                  </g>
                </g>
              </svg>

              <div id="mission-stage-target" className="mission-stage-target" aria-hidden="true"></div>
              <div id="mission-countdown-callout" className="mission-countdown-callout" aria-hidden="true" hidden>Go for launch</div>
              <div id="mission-recovery-boat" className="mission-recovery-boat" aria-hidden="true">
                <svg className="mission-recovery-boat-svg" viewBox="0 0 120 48">
                  <path className="mission-boat-wake" d="M 10 36 C 18 30, 30 30, 38 36 C 46 42, 58 42, 66 36" />
                  <path className="mission-boat-wake" d="M 58 38 C 66 32, 78 32, 86 38 C 94 44, 106 44, 114 38" />
                  <path className="mission-boat-hull" d="M 18 32 H 98 L 88 42 H 26 Z" />
                  <rect className="mission-boat-cabin" x="44" y="15" width="24" height="14" rx="4" />
                  <rect className="mission-boat-cabin mission-boat-cabin-top" x="52" y="10" width="10" height="8" rx="3" />
                  <circle className="mission-boat-light" cx="88" cy="28" r="3" />
                </svg>
              </div>
              <div id="countdown-overlay" className="countdown-overlay" aria-hidden="true">10</div>
            </div>

            <section id="timing-panel" className="timing-panel" aria-labelledby="timing-title">
              <div className="timing-header">
                <h3 id="timing-title">Mission log</h3>
                <span id="timing-mode-chip" className="timing-mode-chip">Mission brief</span>
              </div>
              <div className="mission-copy mission-log-copy">
                <p id="mission-status-line" className="mission-status-line">Kennedy Space Center is live.</p>
                <p id="mission-prompt" className="mission-prompt" role="status">Stand by for the countdown.</p>
              </div>
              <div className="timing-activity">
                <div id="timing-meter" className="timing-meter" aria-hidden="true">
                  <div id="timing-good-zone" className="timing-good-zone"></div>
                  <div id="timing-sweet-zone" className="timing-sweet-zone"></div>
                  <div id="timing-cursor" className="timing-cursor"></div>
                </div>
                <div className="timing-activity-copy">
                  <p id="timing-hint" className="timing-hint">Each step tells you what is happening. Continue when you are ready.</p>
                  <p id="mission-outcome" className="mission-outcome" aria-live="polite"></p>
                </div>
              </div>
            </section>

            <div className="mission-toolbar">
              <button id="mission-action-btn" className="mission-btn mission-btn-primary mission-action-btn">Hold engines</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Settings</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="mission-end-heading" padded>
          <div className="end-shell">
            <p className="mission-kicker">Pacific splashdown</p>
            <h2 id="mission-end-heading" className="mission-title mission-title-end">Welcome home, astronaut!</h2>
            <p id="end-summary" className="end-summary">You brought the astronaut home safe, and the recovery crew is ready with a hero's welcome.</p>
            <div className="start-actions">
              <button id="replay-btn" className="mission-btn mission-btn-primary">Run mission again</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Settings</button>
            </div>
          </div>
        </GameScreen>

        <GameSettingsModal title="Menu" headingClassName="settings-heading" contentClassName="settings-content mission-settings-content" overlayStyles={missionOrbitModalOverlayStyles}>

            <section className="settings-section">
              <h3 className="settings-section-title">Controls</h3>
              <div className="controls-grid mission-controls-grid">
                <div>
                  <h4>Touch / mouse</h4>
                  <ul className="controls-list">
                    <li>Tap or hold the spacecraft directly.</li>
                    <li>The action button stays available as a backup control.</li>
                    <li>Read the mission log and continue when you are ready.</li>
                    <li>Use the settings buttons any time.</li>
                  </ul>
                </div>
                <div>
                  <h4>Keyboard / controller</h4>
                  <ul className="controls-list">
                    <li><kbd>Space</kbd> or <kbd>Enter</kbd> fires the action.</li>
                    <li>The mission waits at each step until you move on.</li>
                    <li>Controller <kbd>A</kbd> mirrors the action button.</li>
                    <li>Controller <kbd>Start</kbd> toggles settings.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h3 className="settings-section-title">Audio</h3>
              <label className="settings-toggle-row" htmlFor="music-enabled-toggle">
                <span>Space ambience</span>
                <input type="checkbox" id="music-enabled-toggle" />
              </label>
              <label className="settings-select-row" htmlFor="sound-intensity-select">
                <span>Physical sound effects</span>
                <select id="sound-intensity-select" defaultValue="heavy">
                  <option value="heavy">Heavy</option>
                  <option value="light">Light</option>
                  <option value="off">Off</option>
                </select>
              </label>
              <p className="settings-help">Space ambience stays separate. Turn it on when you want the calm synth bed during coast phases.</p>
              <p className="settings-help">Heavy is the default mix with the full t-7 launch rumble bed and fuller physical textures. Light keeps the same cues gentler. Off mutes menu, countdown, launch, burn, reentry, parachute, splashdown, and celebration sound effects.</p>
            </section>

            <section className="settings-section">
              <h3 className="settings-section-title">Accessibility</h3>
              <label className="settings-toggle-row" htmlFor="reduce-motion-toggle">
                <span>Reduce motion</span>
                <input type="checkbox" id="reduce-motion-toggle" />
              </label>
              <p id="reduce-motion-help" className="settings-help">Defaults to your device setting until you change it here.</p>
            </section>

            <section className="settings-section">
              <h3 className="settings-section-title">Credits</h3>
              <p className="settings-help"><span className="settings-detail-label">Code license:</span> {attribution.codeLicense}</p>
              <p className="settings-help">{attribution.summary}</p>
              <details className="settings-disclosure settings-attributions-disclosure">
                <summary className="settings-disclosure-summary">Source details ({attribution.entries.length})</summary>
                <div className="settings-attributions">
                  {attribution.entries.map((entry) => (
                    <article className="settings-attribution-card" aria-label={`${entry.title} credit`}>
                      <h4 className="settings-attribution-title">{entry.title}</h4>
                      <p className="settings-attribution-meta">{entry.type} · {entry.creator}</p>
                      <p className="settings-attribution-copy"><span className="settings-detail-label">Used in:</span> {entry.usedIn}</p>
                      <p className="settings-attribution-copy"><span className="settings-detail-label">Source:</span> {entry.source}</p>
                      <p className="settings-attribution-copy"><span className="settings-detail-label">License:</span> {entry.license}</p>
                      <p className="settings-attribution-copy"><span className="settings-detail-label">Modifications:</span> {entry.modifications}</p>
                      {entry.notes ? <p className="settings-attribution-copy"><span className="settings-detail-label">Notes:</span> {entry.notes}</p> : null}
                    </article>
                  ))}
                </div>
              </details>
            </section>

            <div className="settings-actions">
              <a href={homePath} className="mission-btn mission-btn-secondary settings-home-link">Home</a>
              <button id="settings-close" className="mission-btn mission-btn-secondary">Close</button>
            </div>
        </GameSettingsModal>
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />
      <SrOnly id="phase-description" ariaLive="polite" ariaAtomic />

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