/**
 * Mission 4: Super Scroller
 * Trains: Scrolling up and down using trackpad (two fingers) or mouse wheel, finding hidden content below the fold.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class ScrollGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.subGame = 'ocean'; // 'ocean' | 'reading'
    this.depthFound = 0;
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper scroll-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">📜 Mission 4: Super Scroller</div>
          <h2 class="game-title" id="scroll-game-title">Deep Sea Submarine Dive!</h2>
          <p class="game-desc" id="scroll-game-desc">Use two fingers on your trackpad or roll your mouse wheel to scroll down into the ocean.</p>
          <div class="game-stats">
            <div class="stat-pill"><span class="stat-icon">🌊</span> <span id="scroll-depth-indicator">Depth: 0m</span></div>
            <div class="submode-toggles">
              <button class="btn-submode ${this.subGame === 'ocean' ? 'active' : ''}" data-sub="ocean">🌊 Deep Sea Dive</button>
              <button class="btn-submode ${this.subGame === 'reading' ? 'active' : ''}" data-sub="reading">📖 MAP Story Passage</button>
            </div>
          </div>
        </div>

        <!-- Visual Gesture Guide for 1st Grader Trackpad / Mouse -->
        <div class="scroll-gesture-guide">
          <span class="gesture-icon">✌️</span>
          <span><strong>Trackpad Secret:</strong> Put <strong>TWO fingers</strong> on the trackpad and slide them UP to scroll DOWN!</span>
          <span class="mouse-icon">🖱️</span>
        </div>

        <div class="game-arena scroll-arena" id="scroll-arena">
          <!-- Scrollable content -->
        </div>

        <div class="game-footer">
          <button class="btn-sound-instruction" id="scroll-speak-btn">
            <span class="icon-speaker">🔊</span> Hear Directions
          </button>
          <div class="helper-hint">💡 <strong>Test Tip:</strong> During MAP tests, always scroll down to make sure you see all the answer choices!</div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startSubGame(this.subGame);
  }

  bindEvents() {
    this.container.querySelectorAll('.btn-submode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sub = e.target.dataset.sub;
        soundManager.playClick();
        this.startSubGame(sub);
      });
    });

    const speakBtn = this.container.querySelector('#scroll-speak-btn');
    speakBtn.addEventListener('click', () => {
      let msg = '';
      if (this.subGame === 'ocean') {
        msg = "Scroll all the way down to the bottom of the ocean to activate the golden submarine button!";
      } else {
        msg = "Read the story by scrolling down, then answer the question at the bottom and click Next!";
      }
      soundManager.speak(msg);
    });
  }

  startSubGame(sub) {
    this.subGame = sub;
    const titleEl = this.container.querySelector('#scroll-game-title');
    const descEl = this.container.querySelector('#scroll-game-desc');
    const arena = this.container.querySelector('#scroll-arena');

    this.container.querySelectorAll('.btn-submode').forEach(b => {
      b.classList.toggle('active', b.dataset.sub === sub);
    });

    if (sub === 'ocean') {
      titleEl.textContent = 'Deep Sea Submarine Dive!';
      descEl.textContent = 'Scroll all the way down to the ocean floor to unlock the submarine treasure hatch!';
      this.initOceanDive(arena);
    } else if (sub === 'reading') {
      titleEl.textContent = 'MAP Story Passage: Read & Scroll!';
      descEl.textContent = 'Scroll down through the passage to find the answer to the question at the bottom.';
      this.initReadingPassage(arena);
    }
  }

  // SUBGAME 1: DEEP SEA DIVE
  initOceanDive(arena) {
    arena.innerHTML = `
      <div class="scroll-tank-outer" id="scroll-tank-outer">
        <div class="scroll-floating-arrow animate-bounce-down">
          ⬇️ SCROLL DOWN ⬇️
        </div>

        <div class="ocean-depth-column">
          <!-- Zone 1: Sunny Surface (0m) -->
          <div class="ocean-depth-zone zone-surface">
            <div class="depth-marker">0 Meters (Surface) ☀️</div>
            <div class="zone-creature">🐬 Friendly Dolphin splashing!</div>
            <div class="zone-instruction">Keep scrolling down... deeper! 🌊</div>
          </div>

          <!-- Zone 2: Coral Reef (200m) -->
          <div class="ocean-depth-zone zone-reef">
            <div class="depth-marker">200 Meters (Coral Reef) 🐠</div>
            <div class="zone-creature">🪸 Sea Turtles & Coral Reefs!</div>
            <div class="zone-instruction">Keep two fingers sliding UP on your trackpad! ⬇️</div>
          </div>

          <!-- Zone 3: Twilight Zone (500m) -->
          <div class="ocean-depth-zone zone-twilight">
            <div class="depth-marker">500 Meters (Twilight Zone) 🌌</div>
            <div class="zone-creature">🦑 Giant Squid & Bioluminescent Jellyfish! 🪼</div>
            <div class="zone-instruction">Almost to the ocean floor! ⬇️</div>
          </div>

          <!-- Zone 4: Ocean Floor (1000m) -->
          <div class="ocean-depth-zone zone-abyss">
            <div class="depth-marker">1000 Meters (Ocean Floor Abyss) 🌋</div>
            <div class="zone-creature">👑 The Golden Submarine Hatch!</div>
            <button class="btn-golden-sub-hatch animate-pulse-glow" id="sub-hatch-btn">
              ⭐ ACTIVATE SUBMARINE HATCH ⭐
            </button>
            <div class="sub-hatch-note">You reached the very bottom! Click this button!</div>
          </div>
        </div>
      </div>
    `;

    const scrollOuter = arena.querySelector('#scroll-tank-outer');
    const depthIndicator = this.container.querySelector('#scroll-depth-indicator');
    const hatchBtn = arena.querySelector('#sub-hatch-btn');
    const arrow = arena.querySelector('.scroll-floating-arrow');

    scrollOuter.addEventListener('scroll', () => {
      const scrollPos = scrollOuter.scrollTop;
      const maxScroll = scrollOuter.scrollHeight - scrollOuter.clientHeight;
      const depth = Math.round((scrollPos / maxScroll) * 1000);

      if (depthIndicator) depthIndicator.textContent = `Depth: ${depth}m`;

      if (scrollPos > 100 && arrow) {
        arrow.style.opacity = '0';
      } else if (arrow) {
        arrow.style.opacity = '1';
      }

      if (scrollPos >= maxScroll - 20) {
        // At bottom
        hatchBtn.classList.add('ready');
      }
    });

    hatchBtn.addEventListener('click', () => {
      soundManager.playSparkle();
      stateManager.recordScrollPassage();
      this.handleSuccess('You scrolled all the way to 1000m deep sea!');
    });
  }

  // SUBGAME 2: MAP READING STORY PASSAGE
  initReadingPassage(arena) {
    arena.innerHTML = `
      <div class="map-passage-layout">
        <div class="passage-left-pane" id="passage-scroll-pane">
          <div class="passage-scroll-hint">📜 Scroll down to read the whole story ⬇️</div>
          <div class="passage-content">
            <h3 class="story-title">Pip the Playful Puppy</h3>
            <p class="story-p">Once upon a time, there was a little golden puppy named <strong>Pip</strong>. Pip loved running through the green grass in the morning sunshine.</p>
            <div class="story-illustration">🐶 🌻 ☀️</div>
            <p class="story-p">Every afternoon, Pip went to the garden to play with his favorite toy. He did not want a ball. He did not want a rope.</p>
            <div class="scroll-checkpoint">👇 Keep scrolling down to read the ending! 👇</div>
            <p class="story-p">Pip's favorite toy was a squeaky <strong>blue rubber duck</strong>! He carried the duck everywhere he went.</p>
            <p class="story-p">At bedtime, Pip curled up in his soft red bed with his duck and dreamed of catching butterflies.</p>
            <div class="story-end-tag">🏁 End of Story</div>
          </div>
        </div>

        <div class="passage-right-pane">
          <div class="map-question-card">
            <div class="q-audio-row">
              <button class="btn-map-speaker" id="passage-audio-btn">
                🔊 Listen to Question
              </button>
            </div>
            <div class="q-text">What was Pip's favorite toy?</div>
            <div class="q-options" id="passage-options">
              <button class="map-opt-btn" data-correct="false">
                <span class="opt-letter">A</span> A bouncy red ball
              </button>
              <button class="map-opt-btn" data-correct="true">
                <span class="opt-letter">B</span> A squeaky blue rubber duck
              </button>
              <button class="map-opt-btn" data-correct="false">
                <span class="opt-letter">C</span> A long braided rope
              </button>
            </div>
            <div class="passage-feedback" id="passage-feedback"></div>
          </div>
        </div>
      </div>
    `;

    const audioBtn = arena.querySelector('#passage-audio-btn');
    audioBtn.addEventListener('click', () => {
      soundManager.speak("What was Pip's favorite toy? Option A: A bouncy red ball. Option B: A squeaky blue rubber duck. Option C: A long braided rope.");
    });

    const scrollPane = arena.querySelector('#passage-scroll-pane');
    let hasScrolledDown = false;
    scrollPane.addEventListener('scroll', () => {
      if (scrollPane.scrollTop > 150) {
        hasScrolledDown = true;
      }
    });

    const options = arena.querySelectorAll('.map-opt-btn');
    const feedback = arena.querySelector('#passage-feedback');

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const isCorrect = opt.dataset.correct === 'true';
        if (isCorrect) {
          opt.classList.add('correct');
          soundManager.playChimeSuccess();
          feedback.innerHTML = '🎉 Correct! Pip loved his blue rubber duck!';
          feedback.className = 'passage-feedback correct';
          stateManager.recordScrollPassage();

          setTimeout(() => {
            this.handleSuccess('You scrolled the passage and answered like a MAP test pro!');
          }, 800);
        } else {
          opt.classList.add('incorrect');
          soundManager.playGentleOof();
          feedback.innerHTML = 'Hint: Scroll down the story on the left to see Pip\'s favorite toy!';
          feedback.className = 'passage-feedback incorrect';
          setTimeout(() => opt.classList.remove('incorrect'), 600);
        }
      });
    });
  }

  handleSuccess(customMsg) {
    soundManager.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    stateManager.recordSkillProgress('scroll', { stars: 3 });

    const arena = this.container.querySelector('#scroll-arena');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">📜</div>
        <h3>Scrolling Champion!</h3>
        <p>${customMsg}</p>
        <div class="win-stars">+3 Stars Earned! ⭐⭐⭐</div>
        <div class="win-buttons">
          <button class="btn-action btn-play-again">Practice Again</button>
          <button class="btn-action btn-primary btn-next-mission">Next: Headphone Detective ➡️</button>
        </div>
      </div>
    `;

    arena.appendChild(winModal);

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.startSubGame(this.subGame);
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('listen');
    });
  }

  destroy() {}
}
