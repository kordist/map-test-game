/**
 * Mission 1: Mouse & Cursor Master
 * Trains: Moving cursor using mouse or trackpad smoothly, accurate hovering, path tracking.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class CursorGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.subGame = 'stars'; // 'stars' | 'path' | 'flashlight'
    this.score = 0;
    this.targetScore = 6;
    this.animationFrame = null;
    this.stars = [];
    this.pathPoints = [];
    this.creaturesFound = 0;
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper cursor-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">🐭 Mission 1: Cursor Master</div>
          <h2 class="game-title" id="cursor-game-title">Catch the Floating Stars!</h2>
          <p class="game-desc" id="cursor-game-desc">Move your cursor (mouse or trackpad) to touch each glowing star.</p>
          <div class="game-stats">
            <div class="stat-pill"><span class="stat-icon">⭐</span> <span id="cursor-score">0</span> / ${this.targetScore}</div>
            <div class="submode-toggles">
              <button class="btn-submode ${this.subGame === 'stars' ? 'active' : ''}" data-sub="stars">✨ Star Catcher</button>
              <button class="btn-submode ${this.subGame === 'path' ? 'active' : ''}" data-sub="path">🐰 Winding Path</button>
              <button class="btn-submode ${this.subGame === 'flashlight' ? 'active' : ''}" data-sub="flashlight">🔦 Ocean Explorer</button>
              <button class="btn-submode ${this.subGame === 'worm' ? 'active' : ''}" data-sub="worm">🍎 Block the Worm</button>
            </div>
          </div>
        </div>

        <div class="game-arena cursor-arena" id="cursor-arena">
          <!-- Game content rendered here -->
        </div>

        <div class="game-footer">
          <button class="btn-sound-instruction" id="cursor-speak-btn">
            <span class="icon-speaker">🔊</span> Hear Directions
          </button>
          <div class="helper-hint">💡 <strong>Helpful Tip:</strong> Rest your hand gently on the mouse or trackpad and slide smoothly!</div>
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

    const speakBtn = this.container.querySelector('#cursor-speak-btn');
    speakBtn.addEventListener('click', () => {
      let msg = '';
      if (this.subGame === 'stars') {
        msg = "Move your cursor with the trackpad or mouse to touch each glowing star!";
      } else if (this.subGame === 'path') {
        msg = "Guide the bunny by moving your mouse carefully along the path to reach the carrot!";
      } else {
        msg = "Move your flashlight around the dark ocean to discover all four hidden sea creatures!";
      }
      soundManager.speak(msg);
    });
  }

  startSubGame(sub) {
    this.subGame = sub;
    this.score = 0;
    this.creaturesFound = 0;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

    const titleEl = this.container.querySelector('#cursor-game-title');
    const descEl = this.container.querySelector('#cursor-game-desc');
    const scoreEl = this.container.querySelector('#cursor-score');
    const arena = this.container.querySelector('#cursor-arena');

    this.container.querySelectorAll('.btn-submode').forEach(b => {
      b.classList.toggle('active', b.dataset.sub === sub);
    });

    if (sub === 'stars') {
      titleEl.textContent = 'Catch the Floating Stars!';
      descEl.textContent = 'Slide your mouse or trackpad to hover over each star before it drifts away.';
      this.targetScore = 8;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initStarCatcher(arena);
    } else if (sub === 'path') {
      titleEl.textContent = 'Bunny\'s Winding Path!';
      descEl.textContent = 'Keep your cursor inside the sunny green path all the way from Bunny to the Carrot!';
      this.targetScore = 1;
      scoreEl.textContent = `0 / 1`;
      this.initWindingPath(arena);
    } else if (sub === 'flashlight') {
      titleEl.textContent = 'Deep Ocean Flashlight!';
      descEl.textContent = 'Move your flashlight around to find 4 hidden sea animals!';
      this.targetScore = 4;
      scoreEl.textContent = `0 / 4`;
      this.initFlashlight(arena);
    } else if (sub === 'worm') {
      if (this.onComplete) {
        this.onComplete('worm');
      }
    }
  }

  // SUBGAME 1: STAR CATCHER
  initStarCatcher(arena) {
    arena.innerHTML = `
      <div class="star-field" id="star-field">
        <div class="cursor-trail-indicator">Move your cursor around! ✨</div>
      </div>
    `;

    const field = arena.querySelector('#star-field');
    const rect = field.getBoundingClientRect();
    this.stars = [];

    const spawnStar = () => {
      if (this.score >= this.targetScore) return;
      if (this.stars.length >= 3) return;

      const starEl = document.createElement('div');
      starEl.className = 'floating-star animate-float';
      const emojis = ['⭐', '🌟', '✨', '💫'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      starEl.innerHTML = emoji;
      
      const width = field.clientWidth || 600;
      const height = field.clientHeight || 350;
      const x = 40 + Math.random() * (width - 100);
      const y = 40 + Math.random() * (height - 100);

      starEl.style.left = `${x}px`;
      starEl.style.top = `${y}px`;

      starEl.addEventListener('mouseenter', () => {
        if (starEl.classList.contains('collected')) return;
        starEl.classList.add('collected');
        soundManager.playPop(520 + this.score * 50);
        soundManager.playSparkle();

        // Little burst animation
        starEl.style.transform = 'scale(2.2) rotate(45deg)';
        starEl.style.opacity = '0';

        this.score++;
        const scoreEl = this.container.querySelector('#cursor-score');
        if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;

        setTimeout(() => {
          starEl.remove();
          this.stars = this.stars.filter(s => s !== starEl);
          if (this.score >= this.targetScore) {
            this.handleSuccess('You have amazing cursor control!');
          } else {
            spawnStar();
          }
        }, 300);
      });

      field.appendChild(starEl);
      this.stars.push(starEl);
    };

    // Initial stars
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnStar, i * 300);
    }
  }

  // SUBGAME 2: WINDING PATH (Bunny physically follows the cursor!)
  initWindingPath(arena) {
    arena.innerHTML = `
      <div class="path-challenge-container" id="path-container">
        <svg class="path-svg" id="path-svg-el" viewBox="0 0 800 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#34D399" />
              <stop offset="50%" stop-color="#10B981" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <!-- Background wide safe road (70px wide for kid-friendly tolerance) -->
          <path id="guide-path-bg" class="interactive-path" d="M 60 200 C 180 80, 240 320, 400 200 C 560 80, 620 320, 740 200" 
                fill="none" stroke="#D1FAE5" stroke-width="74" stroke-linecap="round" stroke-linejoin="round" />
          <path id="guide-path" class="interactive-path" d="M 60 200 C 180 80, 240 320, 400 200 C 560 80, 620 320, 740 200" 
                fill="none" stroke="url(#pathGradient)" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Center dashed lane -->
          <path class="interactive-path" d="M 60 200 C 180 80, 240 320, 400 200 C 560 80, 620 320, 740 200" 
                fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="10, 10" stroke-linecap="round" />
        </svg>

        <!-- Paw prints layer -->
        <div class="paw-prints-layer" id="paw-layer"></div>

        <!-- Start Marker -->
        <div class="path-start-marker" id="path-start">
          <span class="marker-title">START</span>
        </div>

        <!-- Animated Guided Bunny Sprite that moves with cursor -->
        <div class="guided-bunny-character" id="guided-bunny">
          <div class="bunny-sprite">🐰</div>
          <div class="bunny-bubble" id="bunny-bubble">Touch me to walk!</div>
        </div>

        <!-- Finish Carrot Marker -->
        <div class="path-end-marker" id="path-end" title="Target!">
          <span class="carrot-icon animate-pulse-subtle">🥕</span>
          <span class="marker-title">FINISH</span>
        </div>

        <div class="path-status" id="path-status">
          👉 Touch 🐰 <strong>Bunny</strong> to guide her to the 🥕 <strong>Carrot</strong>!
        </div>
      </div>
    `;

    const container = arena.querySelector('#path-container');
    const bunny = arena.querySelector('#guided-bunny');
    const bubble = arena.querySelector('#bunny-bubble');
    const endBtn = arena.querySelector('#path-end');
    const status = arena.querySelector('#path-status');
    const pawLayer = arena.querySelector('#paw-layer');

    let isGuiding = false;
    let completed = false;
    let lastPawX = 0, lastPawY = 0;
    let offPathTimeout = null;

    // Position bunny initially at the start
    const resetBunnyToStart = () => {
      bunny.style.left = '60px';
      bunny.style.top = '50%';
      bunny.classList.remove('walking', 'hopping');
      bubble.textContent = 'Touch me to walk!';
      bubble.style.display = 'block';
    };
    resetBunnyToStart();

    const startGuiding = () => {
      if (completed) return;
      isGuiding = true;
      bunny.classList.add('walking');
      bubble.textContent = 'Follow the green path!';
      bubble.style.display = 'block';
      status.innerHTML = '✨ Great! Guide the bunny along the green path all the way to 🥕!';
      status.className = 'path-status tracking-active';
      soundManager.playPop(440);
    };

    bunny.addEventListener('pointerenter', startGuiding);
    bunny.addEventListener('pointerdown', startGuiding);

    container.addEventListener('pointermove', (e) => {
      if (!isGuiding || completed) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Update bunny position to follow cursor
      bunny.style.left = `${mouseX}px`;
      bunny.style.top = `${mouseY}px`;

      // Check if cursor is over the green path or start/end
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const isOnPath = target && (
        target.classList.contains('interactive-path') ||
        target.id === 'guide-path-bg' ||
        target.id === 'guide-path' ||
        target.closest('#guided-bunny') ||
        target.closest('#path-start') ||
        target.closest('#path-end') ||
        target.closest('#paw-layer')
      );

      if (isOnPath) {
        if (offPathTimeout) {
          clearTimeout(offPathTimeout);
          offPathTimeout = null;
        }
        bunny.classList.remove('off-track');
        bubble.textContent = 'Yum, carrot ahead! 🥕';

        // Drop paw print if moved enough distance
        const dist = Math.hypot(mouseX - lastPawX, mouseY - lastPawY);
        if (dist > 35 && mouseX > 70 && mouseX < rect.width - 70) {
          lastPawX = mouseX;
          lastPawY = mouseY;
          const paw = document.createElement('span');
          paw.className = 'paw-print animate-pop-in';
          paw.textContent = '🐾';
          paw.style.left = `${mouseX - 8}px`;
          paw.style.top = `${mouseY + 8}px`;
          pawLayer.appendChild(paw);
          soundManager.playPop(380 + Math.min(300, (mouseX / rect.width) * 300));
        }

        // Check if reached finish carrot
        const endRect = endBtn.getBoundingClientRect();
        if (
          e.clientX >= endRect.left - 20 &&
          e.clientX <= endRect.right + 20 &&
          e.clientY >= endRect.top - 20 &&
          e.clientY <= endRect.bottom + 20
        ) {
          completed = true;
          isGuiding = false;
          bunny.classList.remove('walking');
          bunny.classList.add('hopping');
          bubble.innerHTML = 'Crunch crunch! 🥕😋';
          soundManager.playChimeSuccess();
          soundManager.playSparkle();

          status.textContent = '🎉 Awesome job! Bunny got the carrot!';
          status.className = 'path-status tracking-success';
          this.score = 1;
          const scoreEl = this.container.querySelector('#cursor-score');
          if (scoreEl) scoreEl.textContent = '1 / 1';

          setTimeout(() => {
            this.handleSuccess('Master trackpad path navigation! Bunny is full and happy!');
          }, 700);
        }
      } else {
        // Off the path!
        bunny.classList.add('off-track');
        bubble.textContent = 'Oops! Stay on green road! 🌿';
        if (!offPathTimeout) {
          offPathTimeout = setTimeout(() => {
            if (isGuiding && !completed) {
              soundManager.playGentleOof();
              status.textContent = '⚠️ Stay inside the sunny green path! Touch 🐰 Bunny to try again.';
              status.className = 'path-status tracking-failed';
              isGuiding = false;
              resetBunnyToStart();
            }
          }, 800);
        }
      }
    });

    container.addEventListener('pointerleave', () => {
      if (isGuiding && !completed) {
        isGuiding = false;
        bunny.classList.remove('walking');
        resetBunnyToStart();
        status.textContent = 'Oops! Touch 🐰 Bunny to try again.';
        status.className = 'path-status tracking-failed';
        soundManager.playGentleOof();
      }
    });
  }

  // SUBGAME 3: OCEAN FLASHLIGHT
  initFlashlight(arena) {
    arena.innerHTML = `
      <div class="ocean-tank" id="ocean-tank">
        <div class="flashlight-beam" id="flashlight-beam"></div>
        <div class="sea-creature creature-1" data-name="Starfish">⭐<span class="bubble-tag">Starfish</span></div>
        <div class="sea-creature creature-2" data-name="Clownfish">🐠<span class="bubble-tag">Clownfish</span></div>
        <div class="sea-creature creature-3" data-name="Sea Turtle">🐢<span class="bubble-tag">Sea Turtle</span></div>
        <div class="sea-creature creature-4" data-name="Octopus">🐙<span class="bubble-tag">Octopus</span></div>
        <div class="ocean-prompt">🔦 Move your cursor to shine the light and uncover sea creatures!</div>
      </div>
    `;

    const tank = arena.querySelector('#ocean-tank');
    const beam = arena.querySelector('#flashlight-beam');
    const creatures = arena.querySelectorAll('.sea-creature');

    tank.addEventListener('mousemove', (e) => {
      const rect = tank.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      beam.style.left = `${x}px`;
      beam.style.top = `${y}px`;
    });

    creatures.forEach(creature => {
      creature.addEventListener('mouseenter', () => {
        if (!creature.classList.contains('found')) {
          creature.classList.add('found');
          soundManager.playSparkle();
          soundManager.playPop(600 + this.creaturesFound * 80);
          this.creaturesFound++;
          const scoreEl = this.container.querySelector('#cursor-score');
          if (scoreEl) scoreEl.textContent = `${this.creaturesFound} / 4`;
          
          if (this.creaturesFound >= 4) {
            this.handleSuccess('You discovered all ocean animals with your cursor!');
          }
        }
      });
    });
  }

  handleSuccess(customMsg) {
    soundManager.playFanfare();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    stateManager.recordSkillProgress('cursor', { stars: 3 });

    const arena = this.container.querySelector('#cursor-arena');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🌟</div>
        <h3>Mission Complete!</h3>
        <p>${customMsg}</p>
        <div class="win-stars">+3 Stars Earned! ⭐⭐⭐</div>
        <div class="win-buttons">
          <button class="btn-action btn-play-again">Play Again</button>
          <button class="btn-action btn-primary btn-next-mission">Next Mission ➡️</button>
        </div>
      </div>
    `;

    arena.appendChild(winModal);

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.startSubGame(this.subGame);
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('click');
    });
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }
}
