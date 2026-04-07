import { renderToString } from '@remix-run/component/server'
import { DESTINATIONS } from '../../client/pixel-passport/destinations.js'
import { getGameAttribution } from '../data/attributions/index.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'
import { GameHeader, GameHeaderPill, GameScreen, GameTabbedModal, InfoSection, InfoAttribution, SettingsSection, SettingsToggle, SrOnly } from '../ui/game-shell.js'

const pixelPassportModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(4, 10, 20, 0.72)',
  backdropFilter: 'blur(8px)',
}

function renderMarkerButtons(group: 'globe' | 'mystery') {
  return DESTINATIONS.map((destination) => (
    <button
      id={`${group}-marker-${destination.id}`}
      className="destination-marker"
      data-destination-id={destination.id}
      data-marker-group={group}
      style={`--marker-color:${destination.markerColor};left:${destination.coords.x}%;top:${destination.coords.y}%;`}
      aria-label={destination.name}
      type="button"
    >
      <span className="destination-marker-icon" aria-hidden="true">{destination.markerEmoji}</span>
      <span className="destination-marker-label">{destination.name}</span>
    </button>
  ))
}

export async function pixelPassportAction() {
  const attribution = getGameAttribution('pixel-passport')
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Pixel Passport"
      description="Ride a magic bus around the world, learn simple facts, and solve kid-friendly destination mysteries."
      path="/pixel-passport/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/pixel-passport.css']}
      includeDefaultStyles={false}
      scripts={['/client/pixel-passport/main.js']}
      bodyClass="pixel-passport-game"
      viewportFitCover
      manifestPath="/pixel-passport/manifest.json"
      serviceWorkerPath="/pixel-passport/sw.js"
      serviceWorkerScope="/pixel-passport/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="passport-title" padded>
          <div className="start-shell passport-panel">
            <div className="start-copy">
              <p className="screen-kicker">Magic bus world trip</p>
              <h1 id="passport-title" className="passport-title">Pixel Passport</h1>
              <p className="passport-subtitle">Spin the world. Find a place. Solve a clue. Save a memory.</p>

              <div className="title-stats" aria-label="Game progress">
                <span id="title-memory-count" className="passport-pill">0 memories</span>
                <span id="title-mystery-count" className="passport-pill">0 mysteries</span>
              </div>

              <div className="guide-card guide-card-title" aria-live="polite">
                <div id="title-pip" className="guide-sprite" aria-hidden="true"></div>
                <p id="title-guide-text" className="guide-text">Pip says: Let's roll!</p>
              </div>

              <div className="start-actions">
                <button id="start-explore-btn" className="passport-btn passport-btn-primary" type="button">Explore! <span aria-hidden="true">🌍</span></button>
                <button id="start-mystery-btn" className="passport-btn passport-btn-secondary" type="button">Mystery! <span aria-hidden="true">🔍</span></button>
                <button data-settings-open="true" className="passport-btn passport-btn-ghost" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
              </div>

              <ul className="start-notes" aria-label="Quick tips">
                <li>Pick a place and ride there.</li>
                <li>Listen to Pip's short facts.</li>
                <li>Solve clues in Mystery Mode.</li>
              </ul>
            </div>

            <div className="start-stage" aria-hidden="true">
              <div className="world-globe world-globe-start">
                <div className="globe-map-shell">
                  <div id="title-map-track" className="globe-map-track"></div>
                </div>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="globe-screen" labelledBy="globe-heading" padded>
          <div className="globe-shell passport-panel">
            <GameHeader
              className="passport-topbar"
              headingId="globe-heading"
              leftContent={<>
                <p className="screen-kicker">Explore Mode</p>
                <h2 id="globe-heading" className="screen-title">Choose a place</h2>
                <p id="globe-location-copy" className="screen-copy">Home base</p>
              </>}
              rightContent={<>
                <GameHeaderPill value={<span id="globe-memory-pill">0 memories</span>} />
                <GameHeaderPill value={<span id="globe-mystery-pill">0 mysteries</span>} />
              </>}
            />

            <div className="globe-stage">
              <div className="world-globe" role="group" aria-label="Destination globe">
                <div className="globe-map-shell" aria-hidden="true">
                  <div id="globe-map-track" className="globe-map-track"></div>
                </div>
                <div id="globe-markers" className="destination-markers">{renderMarkerButtons('globe')}</div>
              </div>

              <div className="globe-side-panel">
                <div className="guide-card">
                  <div id="globe-pip" className="guide-sprite" aria-hidden="true"></div>
                  <p id="globe-selected-copy" className="guide-text">Pick a place on the globe.</p>
                </div>

                <div className="globe-actions">
                  <button id="globe-room-btn" className="passport-btn passport-btn-secondary" type="button">Room <span aria-hidden="true">🏠</span></button>
                  <button id="globe-mystery-btn" className="passport-btn passport-btn-secondary" type="button">Mystery <span aria-hidden="true">🔍</span></button>
                  <button data-settings-open="true" className="passport-btn passport-btn-ghost" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
                </div>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="travel-screen" labelledBy="travel-heading" padded>
          <div className="travel-shell passport-panel">
            <GameHeader
              className="passport-topbar"
              headingId="travel-heading"
              leftContent={<>
                <p className="screen-kicker">Travel time</p>
                <h2 id="travel-heading" className="screen-title">Magic ride</h2>
                <p className="screen-copy"><span id="travel-from">Home</span> → <span id="travel-to">Somewhere new</span></p>
              </>}
              rightContent={<GameHeaderPill value={<span id="travel-mode-pill">By plane</span>} />}
            />

            <div id="travel-stage" className="travel-stage" data-transport="bus">
              <div id="travel-background" className="travel-background" aria-hidden="true"></div>
              <div className="travel-clouds travel-layer" aria-hidden="true"></div>
              <div className="travel-midground travel-layer" aria-hidden="true"></div>
              <div className="travel-foreground travel-layer" aria-hidden="true"></div>
              <div id="travel-vehicle-shadow" className="travel-vehicle-shadow" aria-hidden="true"></div>
              <div id="travel-vehicle" className="travel-vehicle pixel-art" aria-hidden="true"></div>
              <div className="travel-guide-card guide-card">
                <div id="travel-pip" className="guide-sprite" aria-hidden="true"></div>
                <p id="travel-copy" className="guide-text">The magic bus is on the move!</p>
              </div>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="explore-screen" labelledBy="explore-heading" padded>
          <div className="explore-shell passport-panel">
            <GameHeader
              className="passport-topbar"
              headingId="explore-heading"
              leftContent={<>
                <p className="screen-kicker">Destination</p>
                <h2 id="explore-heading" className="screen-title">World stop</h2>
                <p id="explore-progress" className="screen-copy">1 / 3 facts</p>
              </>}
              rightContent={<button data-settings-open="true" className="passport-btn passport-btn-ghost passport-btn-small" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>}
            />

            <div className="explore-stage">
              <div id="explore-scene" className="pixel-art scene-art" aria-hidden="true"></div>

              <div className="guide-card explore-guide-card">
                <div id="explore-pip" className="guide-sprite" aria-hidden="true"></div>
                <p id="explore-guide-text" className="guide-text">Pip is ready to tell a fact.</p>
              </div>
            </div>

            <div className="screen-actions">
              <button id="explore-next-btn" className="passport-btn passport-btn-primary" type="button">Next fact <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="memory-screen" labelledBy="memory-heading" padded>
          <div className="memory-shell passport-panel">
            <p className="screen-kicker">Memory found</p>
            <h2 id="memory-heading" className="screen-title">Souvenir time</h2>

            <div className="memory-stage">
              <div className="memory-token" aria-hidden="true">
                <span id="memory-emoji">🎒</span>
              </div>
              <p id="memory-label" className="memory-label">memory</p>
            </div>

            <div className="guide-card">
              <div id="memory-pip" className="guide-sprite" aria-hidden="true"></div>
              <p id="memory-copy" className="guide-text">Pip found a new memory.</p>
            </div>

            <div className="screen-actions">
              <button id="memory-continue-btn" className="passport-btn passport-btn-primary" type="button">Back to globe <span aria-hidden="true">→</span></button>
              <button data-settings-open="true" className="passport-btn passport-btn-ghost" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="room-screen" labelledBy="room-heading" padded>
          <div className="room-shell passport-panel">
            <GameHeader
              className="passport-topbar"
              headingId="room-heading"
              leftContent={<>
                <p className="screen-kicker">Your cozy room</p>
                <h2 id="room-heading" className="screen-title">Memory shelf</h2>
                <p id="room-count" className="screen-copy">0 memories</p>
              </>}
              rightContent={<button data-settings-open="true" className="passport-btn passport-btn-ghost passport-btn-small" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>}
            />

            <div className="room-stage">
              <div id="room-pip" className="guide-sprite room-pip" aria-hidden="true"></div>
              <div className="room-shelf-grid">
                {DESTINATIONS.map((destination) => (
                  <div className="memory-slot" data-memory-slot={destination.id} aria-label={`${destination.name} memory slot`}>
                    <span className="memory-slot-emoji" aria-hidden="true">☆</span>
                    <span className="memory-slot-label">{destination.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="guide-card">
              <p id="room-copy" className="guide-text">Pip says: Your keepsakes live here.</p>
            </div>

            <div className="screen-actions">
              <button id="room-back-btn" className="passport-btn passport-btn-primary" type="button">Back to globe <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="mystery-screen" labelledBy="mystery-heading" padded>
          <div className="mystery-shell passport-panel">
            <GameHeader
              className="passport-topbar"
              headingId="mystery-heading"
              leftContent={<>
                <p className="screen-kicker">Mystery Mode</p>
                <h2 id="mystery-heading" className="screen-title">Where on Earth?</h2>
                <p id="mystery-attempt-pill" className="screen-copy">Clue 1 of 3</p>
              </>}
              rightContent={<button data-settings-open="true" className="passport-btn passport-btn-ghost passport-btn-small" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>}
            />

            <div className="mystery-stage">
              <div className="mystery-card">
                <div id="mystery-pip" className="guide-sprite" aria-hidden="true"></div>
                <p id="mystery-clue-text" className="guide-text">Pip has a clue for you.</p>
              </div>

              <div className="world-globe mystery-globe" role="group" aria-label="Mystery globe">
                <div className="globe-map-shell" aria-hidden="true">
                  <div id="mystery-map-track" className="globe-map-track"></div>
                </div>
                <div id="mystery-markers" className="destination-markers">{renderMarkerButtons('mystery')}</div>
              </div>

              <p id="mystery-selected-copy" className="screen-copy mystery-selected-copy">Tap the place you think fits the clue.</p>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="mystery-result-screen" labelledBy="mystery-result-heading" padded>
          <div className="result-shell passport-panel">
            <p className="screen-kicker">Mystery result</p>
            <h2 id="mystery-result-heading" className="screen-title">Let's see!</h2>

            <div className="guide-card">
              <div id="mystery-result-pip" className="guide-sprite" aria-hidden="true"></div>
              <p id="mystery-result-copy" className="guide-text">Pip is checking the clue.</p>
            </div>

            <div className="screen-actions">
              <button id="mystery-result-btn" className="passport-btn passport-btn-primary" type="button">Next clue <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </GameScreen>
      </div>

      <GameTabbedModal
        title="Menu"
        overlayStyles={pixelPassportModalOverlayStyles}
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="🎵 Audio">
            <SettingsToggle id="music-enabled-toggle" label="Music" helpId="music-enabled-help" defaultChecked={true} />
            <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpId="sfx-enabled-help" defaultChecked={true} />
          </SettingsSection>

          <SettingsSection title="🗺️ Controls">
            <ul className="settings-list">
              <li>Tap a place on the globe to ride there.</li>
              <li>Arrow keys or D-pad move between places.</li>
              <li>Enter, Space, or A picks the highlighted place.</li>
            </ul>
          </SettingsSection>

          <SettingsSection title="🌍 Modes">
            <p>Explore Mode lets you roam the world. Mystery Mode gives you three clues and asks you to guess the place.</p>
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
          <InfoSection title="About Pixel Passport">
            <p>{attribution.summary}</p>
          </InfoSection>
          {attribution.entries.map((entry) => (
            <InfoAttribution attribution={{ title: entry.title, author: entry.creator, license: entry.license }} />
          ))}
        </>}
      />

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message">
          <p>Pixel Passport needs JavaScript to spin the globe, ride the magic bus, and solve mysteries. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}