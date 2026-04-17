import { renderToString } from '@remix-run/component/server'
import { DESTINATIONS } from './destinations.js'
import { getGameAttribution } from '../../app/data/attribution-index.js'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameHeaderPill, GameScreen, GameTabbedModal, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'

const pixelPassportModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(4, 10, 20, 0.72)',
  backdropFilter: 'blur(8px)',
}

function renderMarkerButtons() {
  return DESTINATIONS.map((destination) => (
    <button
      id={`globe-marker-${destination.id}`}
      className="destination-marker"
      data-destination-id={destination.id}
      data-marker-group="globe"
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
  const infoPagePath = withBasePath('/pixel-passport/info/', siteBasePath)
  const html = await renderToString(
    <Document
      title="Pixel Passport"
      description="Ride a magic bus around the world and learn simple facts about each place."
      path="/pixel-passport/"
      includeNav={false}
      includeFooter={false}
      stylesheets={['/styles/pixel-passport.css']}
      includeDefaultStyles={false}
      scripts={['/client/pixel-passport/main.js']}
      bodyClass="pixel-passport-game"
      viewportFitCover
      manifestPath="/pixel-passport/manifest.json"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="passport-title" padded>
          <div className="start-shell passport-panel">
            <div className="start-copy">
              <p className="screen-kicker">Magic bus world trip</p>
              <h1 id="passport-title" className="passport-title">Pixel Passport</h1>
              <p className="passport-subtitle">Spin the world. Pick a place. Discover something new.</p>

              <div className="start-actions">
                <button id="start-explore-btn" className="passport-btn passport-btn-primary" type="button">Start <span aria-hidden="true">🌍</span></button>
                <button data-settings-open="true" className="passport-btn passport-btn-ghost" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
              </div>

              <p id="gamepad-start-hint" className="gamepad-start-hint" hidden>Ⓐ to explore · Start for menu</p>
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
                <p className="screen-kicker">Explore</p>
                <h2 id="globe-heading" className="screen-title">Choose a place</h2>
                <p id="globe-location-copy" className="screen-copy">Pick a place for your first ride.</p>
              </>}
              rightContent={<button data-settings-open="true" className="passport-btn passport-btn-ghost passport-btn-small" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>}
            />

            <div className="globe-stage">
              <div className="world-globe" role="group" aria-label="Destination globe">
                <div className="globe-map-shell" aria-hidden="true">
                  <div id="globe-map-track" className="globe-map-track"></div>
                </div>
                <div id="globe-markers" className="destination-markers">{renderMarkerButtons()}</div>
              </div>

              <div className="globe-side-panel">
                <p id="globe-selected-copy" className="globe-selected-text">Pick a place on the globe.</p>
                <button data-settings-open="true" className="passport-btn passport-btn-ghost" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>
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
              <div id="travel-vehicle-halo" className="travel-vehicle-halo" aria-hidden="true"></div>
              <div id="travel-vehicle-shadow" className="travel-vehicle-shadow" aria-hidden="true"></div>
              <div id="travel-vehicle" className="travel-vehicle pixel-art" aria-hidden="true"></div>
              <div className="travel-caption">
                <p id="travel-copy" className="travel-caption-text">The magic bus is on the move!</p>
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
                <p id="explore-progress" className="screen-copy">1 / 3</p>
              </>}
              rightContent={<button data-settings-open="true" className="passport-btn passport-btn-ghost passport-btn-small" type="button" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>}
            />

            <div className="explore-stage">
              <div id="explore-scene" className="pixel-art scene-art" aria-hidden="true"></div>
              <p id="explore-fact-text" className="explore-fact">Loading fact…</p>
            </div>

            <div className="screen-actions">
              <button id="explore-next-btn" className="passport-btn passport-btn-primary" type="button">Next <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </GameScreen>
      </div>

      <GameTabbedModal
        title="Menu"
        overlayStyles={pixelPassportModalOverlayStyles}
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="Audio">
            <SettingsToggle id="music-enabled-toggle" label="Music" helpText="Music is off until you change it here." helpId="music-enabled-help" />
            <div id="music-track-picker-slot"></div>
            <SettingsToggle id="sfx-enabled-toggle" label="Sound Effects" helpText="Sound effects are on until you change it here." helpId="sfx-enabled-help" />
          </SettingsSection>

          <SettingsSection title="🗺️ Controls">
            <ul className="settings-list">
              <li>Tap a place on the globe to ride there.</li>
              <li>Tap the place that says you are here to discover it again.</li>
              <li>Arrow keys or D-pad move between places.</li>
              <li>Enter, Space, or A picks the highlighted place. Start opens Menu.</li>
            </ul>
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
          <p className="info-more-link"><a href={infoPagePath}>More info, credits &amp; attributions →</a></p>
        </>}
      />

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message">
          <p>Pixel Passport needs JavaScript to spin the globe and ride the magic bus. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}