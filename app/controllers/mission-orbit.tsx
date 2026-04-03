import { renderToString } from 'remix/component/server'
import { getGameAttribution } from '../data/attributions.js'
import { Document } from '../ui/document.js'

export async function missionOrbitAction() {
  const attribution = getGameAttribution('mission-orbit')
  const html = await renderToString(
    <Document
      title="Mission: Orbit"
      description="Time the key Artemis II burns from countdown to Pacific splashdown."
      path="/mission-orbit/"
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

            <div className="start-actions">
              <button id="start-btn" className="mission-btn mission-btn-primary">Begin countdown</button>
              <button data-settings-open="true" className="mission-btn mission-btn-secondary" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Mission settings</button>
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
                <path id="mission-free-return" d="M 33 69 C 49 49, 60 28, 73 21 S 90 24, 82 36 C 69 53, 56 63, 35 73" />
                <ellipse id="mission-orbit-path" cx="22" cy="76" rx="23" ry="14" />

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
              </svg>

              <div id="countdown-overlay" className="countdown-overlay" aria-hidden="true">10</div>
            </div>

            <section id="timing-panel" className="timing-panel" aria-labelledby="timing-title">
              <div className="timing-header">
                <h3 id="timing-title">Cue signal</h3>
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
            <h2 id="settings-heading" className="settings-heading">Mission settings</h2>

            <section className="settings-section">
              <h3 className="settings-section-title">Controls</h3>
              <div className="controls-grid mission-controls-grid">
                <div>
                  <h4>Touch / mouse</h4>
                  <ul className="controls-list">
                    <li>Tap or hold the action button.</li>
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
              <p className="settings-help">Cue tones and sound effects stay on. Ambient pads only play when you turn them on.</p>
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