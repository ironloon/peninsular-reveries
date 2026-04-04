import { renderToString } from 'remix/component/server'
import { getGameAttribution } from '../data/attributions.js'
import { DEFAULT_CREW_IDS, MISSION_CREW_ROSTER } from '../data/mission-orbit-crew.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'

export async function missionOrbitAction() {
  const attribution = getGameAttribution('mission-orbit')
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Mission: Orbit"
      description="Time the key Artemis II burns from countdown to Pacific splashdown."
      path="/mission-orbit/"
      includeNav={false}
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
        <section id="start-screen" className="screen active" aria-labelledby="mission-title">
          <div className="start-shell">
            <p className="mission-kicker">Artemis II-inspired mission</p>
            <h1 id="mission-title" className="mission-title">Mission: Orbit</h1>
            <p className="mission-subtitle">A one-button flight from the pad to lunar flyby and back home.</p>

            <ol className="mission-outline" aria-label="Mission outline">
              <li>Count down and ride the climb to orbit.</li>
              <li>Time the burns that send Orion around the Moon.</li>
              <li>Jettison, deploy parachutes, and splash down in the Pacific.</li>
            </ol>

            <fieldset className="crew-picker-panel" aria-describedby="crew-picker-help">
              <legend className="crew-picker-title">Pick three crew members</legend>
              <p className="crew-picker-copy">The selected crew will appear during boarding, lunar flyby, and recovery.</p>
              <div className="crew-picker-grid">
                {MISSION_CREW_ROSTER.map((crew) => (
                  <label className="crew-option" aria-label={`${crew.name}, ${crew.role}`}>
                    <input
                      type="checkbox"
                      name="mission-crew"
                      value={crew.id}
                      checked={DEFAULT_CREW_IDS.includes(crew.id as (typeof DEFAULT_CREW_IDS)[number])}
                    />
                    <span className="crew-option-body">
                      <span
                        className="crew-option-badge"
                        style={`--crew-accent:${crew.accent};--crew-accent-soft:${crew.accentSoft}`}
                        data-crew-badge={crew.id}
                      >
                        {crew.badge}
                      </span>
                      <span className="crew-option-copy">
                        <strong>{crew.name}</strong>
                        <span>{crew.role}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p id="crew-picker-help" className="settings-help">Crew locked in. They will appear during boarding, lunar flyby, and recovery.</p>
            </fieldset>

            <div className="start-actions">
              <button id="start-btn" className="mission-btn mission-btn-primary">Begin countdown</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
            </div>

            <p id="gamepad-start-hint" className="start-hint" hidden>Controller A starts the mission.</p>
          </div>
        </section>

        <section id="mission-screen" className="screen" aria-labelledby="mission-phase-label">
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

            <div className="mission-copy">
              <p id="mission-status-line" className="mission-status-line">Kennedy Space Center is live.</p>
              <p id="mission-prompt" className="mission-prompt" role="status">Stand by for the countdown.</p>
            </div>

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
              <div id="mission-crew-overlay" className="mission-crew-overlay" aria-hidden="true" hidden></div>
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
                <h3 id="timing-title">Flight cue</h3>
                <span id="timing-mode-chip" className="timing-mode-chip">Manual</span>
              </div>
              <div id="timing-meter" className="timing-meter" aria-hidden="true">
                <div id="timing-good-zone" className="timing-good-zone"></div>
                <div id="timing-sweet-zone" className="timing-sweet-zone"></div>
                <div id="timing-cursor" className="timing-cursor"></div>
              </div>
              <p id="timing-hint" className="timing-hint">Listen for the cue swell, then act on the flare.</p>
              <p id="mission-outcome" className="mission-outcome" aria-live="polite"></p>
            </section>

            <div className="mission-toolbar">
              <button id="mission-action-btn" className="mission-btn mission-btn-primary mission-action-btn">Hold engines</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Settings</button>
            </div>
          </div>
        </section>

        <section id="end-screen" className="screen" aria-labelledby="mission-end-heading">
          <div className="end-shell">
            <p className="mission-kicker">Pacific splashdown</p>
            <h2 id="mission-end-heading" className="mission-title mission-title-end">Welcome home, astronaut!</h2>
            <p id="end-summary" className="end-summary">You brought the astronaut home safe, and the recovery crew is ready with a hero's welcome.</p>
            <div className="start-actions">
              <button id="replay-btn" className="mission-btn mission-btn-primary">Run mission again</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Settings</button>
            </div>
          </div>
        </section>

        <div id="settings-modal" className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-heading" tabIndex={-1} hidden>
          <div className="settings-content mission-settings-content">
            <h2 id="settings-heading" className="settings-heading">Menu</h2>

            <section className="settings-section">
              <h3 className="settings-section-title">Controls</h3>
              <div className="controls-grid mission-controls-grid">
                <div>
                  <h4>Touch / mouse</h4>
                  <ul className="controls-list">
                    <li>Tap or hold the spacecraft directly.</li>
                    <li>The action button stays available as a backup control.</li>
                    <li>Listen for the cue tone and act on the flare.</li>
                    <li>Use the settings buttons any time.</li>
                  </ul>
                </div>
                <div>
                  <h4>Keyboard / controller</h4>
                  <ul className="controls-list">
                    <li><kbd>Space</kbd> or <kbd>Enter</kbd> fires the action.</li>
                    <li>Bright cue tones signal the strike moment.</li>
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
                <span>Physical sound intensity</span>
                <select id="sound-intensity-select" defaultValue="heavy">
                  <option value="heavy">Heavy</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <p className="settings-help">Cue tones and sound effects stay on. Ambient pads only play when you turn them on.</p>
              <p className="settings-help">Heavy is the default mix and swaps in fuller light/heavy sample variants across launch, burns, reentry, parachute, splashdown, ambience, and celebration. Light keeps every physical sound gentler.</p>
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
            </section>

            <div className="settings-actions">
              <a href={homePath} className="mission-btn mission-btn-secondary settings-home-link">Home</a>
              <button id="settings-close" className="mission-btn mission-btn-secondary">Close</button>
            </div>
          </div>
        </div>
      </div>

      <div id="game-status" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      <div id="game-feedback" aria-live="assertive" aria-atomic="true" className="sr-only"></div>
      <div id="phase-description" aria-live="polite" aria-atomic="true" className="sr-only"></div>

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