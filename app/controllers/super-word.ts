import { html } from 'remix/html-template'
import { createHtmlResponse } from 'remix/response/html'
import { document } from '../ui/document.js'

export function superWordAction() {
  const content = html.raw`
    <div class="scene-track">

    <!-- Start Screen -->
    <div id="start-screen" class="screen active">
      <div class="title" aria-hidden="true">
        <span class="title-bounce">S</span><span class="title-bounce">U</span><span class="title-bounce">P</span><span class="title-bounce">E</span><span class="title-bounce">R</span>
        <br>
        <span class="title-bounce">W</span><span class="title-bounce">O</span><span class="title-bounce">R</span><span class="title-bounce">D</span><span class="title-bounce">!</span>
      </div>
      <p class="subtitle">Find hidden letters and solve the word puzzle!</p>
      <button id="start-btn" class="btn btn-primary">Let's Go! 🚀</button>
      <p id="gamepad-start-hint" class="gamepad-start-hint" hidden>Press Ⓐ to Start</p>
      <button id="settings-open" class="settings-toggle-btn" aria-label="Settings">⚙️ Settings</button>
      <p class="inspiration">Inspired by <a href="https://pbskids.org/superwhy" target="_blank" rel="noopener">Super Why!</a> from PBS Kids</p>
    </div>

    <!-- Game Screen -->
    <div id="game-screen" class="screen">
      <div class="game-header">
        <div class="game-header-left">
          <span id="puzzle-counter" class="puzzle-counter" aria-label="Puzzle progress">1 / 5</span>
          <span id="score" class="score" aria-label="Score: 0">⭐ 0</span>
        </div>
        <div class="game-header-right">
          <span id="letters-count" class="letters-count">0 / 3</span>
        </div>
      </div>
      <div class="prompt-bubble">
        <span id="prompt-text" role="status">Find the letters!</span>
      </div>
      <div id="scene-wrapper">
        <div id="scene" role="group" aria-label="Find letters in the scene"></div>
      </div>
      <div class="collection-area notepad">
        <span class="collection-label notepad-label">Super Letters</span>
        <div id="letter-slots" role="listbox" aria-label="Collected letters — arrange to spell the word"></div>
        <div class="button-row">
          <button id="check-btn" class="btn btn-check" disabled>✓ Check Word!</button>
        </div>
      </div>
    </div>

    <!-- Celebration Popup (overlay on game-screen) -->
    <div id="celebration-popup" class="celebration-popup" aria-live="polite" hidden>
      <div class="celebration-content">
        <div class="celebration-stars" aria-hidden="true">⭐⭐⭐</div>
        <h2 class="celebration-heading">Amazing!</h2>
        <div id="celebration-word" class="celebration-word"></div>
        <button id="celebration-continue-btn" class="btn btn-primary celebration-continue">Continue →</button>
      </div>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="settings-modal" hidden>
      <div class="settings-content">
        <h2 class="settings-heading">⚙️ Settings</h2>

        <!-- Controls Reference -->
        <div class="settings-section">
          <h3 class="settings-section-title">🎮 Controls</h3>
          <div class="controls-grid">
            <div class="controls-column">
              <h4>Keyboard / Touch</h4>
              <ul class="controls-list">
                <li>Click or tap items to collect</li>
                <li>Arrow keys to navigate</li>
                <li>Drag tiles to reorder</li>
              </ul>
            </div>
            <div class="controls-column">
              <h4>Gamepad</h4>
              <ul class="controls-list">
                <li><kbd>D-pad</kbd> Move between all items, tiles &amp; buttons</li>
                <li><kbd>A</kbd> Pick up / Select / Check</li>
                <li><kbd>Start</kbd> Play / Settings</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Puzzle Creator -->
        <div class="settings-section">
          <h3 class="settings-section-title">🛠️ Puzzle Creator</h3>
          <label for="puzzle-words">Words (comma-separated):</label>
          <input type="text" id="puzzle-words" class="puzzle-input" placeholder="CAT, DOG, SUN" autocomplete="off">
          <div id="puzzle-suggestions" class="puzzle-suggestions"></div>
          <div class="puzzle-options-row">
            <label for="puzzle-difficulty-select">Difficulty:</label>
            <select id="puzzle-difficulty-select" class="puzzle-select">
              <option value="">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <label for="puzzle-count-input">Count:</label>
            <input type="number" id="puzzle-count-input" class="puzzle-input puzzle-input-small" min="1" max="50" placeholder="5">
          </div>
        </div>

        <div class="settings-actions">
          <button id="settings-play-btn" class="btn btn-primary settings-play-btn">▶️ Play!</button>
          <button id="settings-close" class="btn settings-close-btn">Close</button>
        </div>
      </div>
    </div>

    <!-- Level Complete Screen -->
    <div id="complete-screen" class="screen">
      <div class="complete-stars" aria-hidden="true">⭐⭐⭐</div>
      <h2 class="complete-heading">Amazing!</h2>
      <p class="complete-body">You spelled it correctly! 🎉</p>
      <div id="solved-word"></div>
      <button id="next-btn" class="btn btn-primary">Next Puzzle! →</button>
    </div>

    <!-- Win Screen -->
    <div id="win-screen" class="screen">
      <div class="win-trophy" aria-hidden="true">🏆</div>
      <h2 class="win-heading">Super Reader!</h2>
      <p class="win-body">You solved all the puzzles! 🎊</p>
      <div id="final-score"></div>
      <div class="win-stars" aria-hidden="true">⭐⭐⭐⭐⭐</div>
      <button id="replay-btn" class="btn btn-primary">Play Again! 🔄</button>
    </div>

    </div><!-- /.scene-track -->

    <!-- Accessibility: aria-live regions -->
    <div id="game-status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
    <div id="game-feedback" aria-live="assertive" aria-atomic="true" class="sr-only"></div>

    <noscript>
      <div class="noscript-message">
        <p>Super Word needs JavaScript to run — it's a game after all! Enable JavaScript in your browser settings and refresh to play.</p>
      </div>
    </noscript>`

  return createHtmlResponse(
    document(
      {
        title: 'Super Word',
        description: 'Find hidden letters and spell the secret word.',
        path: '/super-word/',
        stylesheets: ['/styles/game.css'],
        scripts: ['/client/super-word/main.js'],
        bodyAttrs: 'class="super-word-game"',
      },
      content,
    ),
  )
}
