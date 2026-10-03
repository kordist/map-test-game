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
        msg = "Touch Bunny and guide her smoothly along the path to collect all the juicy carrots for the picnic!";
      } else {
        msg = "Move your flashlight around the dark ocean to discover all four hidden sea creatures!";
      }
      soundManager.speak(msg);
    });

    this.difficultyHandler = () => {
      if (this.subGame === 'path') {
        this.startSubGame('path');
      }
    };
    window.addEventListener('difficultychange', this.difficultyHandler);
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
      const diff = stateManager.getDifficulty();
      let targetCarrots = 4;
      let levelTag = 'Level 2 (Standard)';
      if (diff === 1) {
        targetCarrots = 3;
        levelTag = 'Level 1 (Gentle)';
      } else if (diff === 3) {
        targetCarrots = 5;
        levelTag = 'Level 3 (Turbo)';
      }
      this.targetScore = targetCarrots;
      titleEl.innerHTML = `🐰 Bunny's Meadow Trail <span class="path-level-tag">${levelTag}</span>`;
      descEl.textContent = `Guide 🐰 Bunny along the golden path to munch all ${targetCarrots} carrots on the way to the picnic!`;
      scoreEl.textContent = `0 / ${targetCarrots} 🥕`;
      this.initWindingPath(arena, targetCarrots);
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
  initWindingPath(arena, targetCarrots = 4) {
    // Generate smooth sine-wave coordinates for SVG path
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const x = 50 + t * 900;
      const y = 200 - 125 * Math.sin(2 * Math.PI * t);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const pathData = 'M ' + points.join(' L ');

    // Calculate carrot waypoint positions along the road
    let tFractions = [0.20, 0.40, 0.60, 0.80];
    if (targetCarrots === 3) {
      tFractions = [0.25, 0.50, 0.75];
    } else if (targetCarrots === 5) {
      tFractions = [0.15, 0.32, 0.50, 0.68, 0.85];
    }

    const carrotsHtml = tFractions.map((t, idx) => {
      const xPct = ((50 + t * 900) / 1000) * 100;
      const yPct = ((200 - 125 * Math.sin(2 * Math.PI * t)) / 400) * 100;
      return `
        <div class="waypoint-carrot" id="carrot-wp-${idx}" style="left: ${xPct.toFixed(2)}%; top: ${yPct.toFixed(2)}%;" data-eaten="false">
          <span class="carrot-item-icon">🥕</span>
        </div>
      `;
    }).join('');

    arena.innerHTML = `
      <div class="path-challenge-container" id="path-container">
        <!-- Meadow Scenery Layer -->
        <div class="meadow-scenery">
          <div class="scenery-sun" title="Warm Sunshine">☀️</div>
          <div class="scenery-cloud cloud-1">☁️</div>
          <div class="scenery-cloud cloud-2">⛅</div>
          
          <div class="scenery-tree" style="top: 10%; left: 3%;">🌳</div>
          <div class="scenery-tree" style="bottom: 8%; left: 14%;">🌲</div>
          <div class="scenery-tree" style="top: 10%; right: 14%;">🌳</div>
          <div class="scenery-tree" style="bottom: 10%; right: 4%;">🌲</div>
          
          <div class="scenery-flower" style="top: 60%; left: 6%;">🌸</div>
          <div class="scenery-flower" style="bottom: 18%; left: 44%;">🌻</div>
          <div class="scenery-flower" style="top: 12%; left: 52%;">🌷</div>
          <div class="scenery-flower" style="bottom: 24%; right: 28%;">🌼</div>
          
          <div class="scenery-butterfly">🦋</div>
        </div>

        <!-- SVG Golden Road with border, gradient surface, and stepping stones -->
        <svg class="path-svg" id="path-svg-el" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="roadSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#34D399" />
              <stop offset="50%" stop-color="#10B981" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>
            <filter id="roadShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#047857" flood-opacity="0.25"/>
            </filter>
          </defs>
          <!-- Sandy Road Border -->
          <path class="interactive-path" d="${pathData}" 
                fill="none" stroke="#FDE68A" stroke-width="84" stroke-linecap="round" stroke-linejoin="round" filter="url(#roadShadow)" />
          <!-- Lush Green Path Surface -->
          <path id="guide-path" class="interactive-path" d="${pathData}" 
                fill="none" stroke="url(#roadSurfaceGrad)" stroke-width="62" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Stepping Stone dashed center line -->
          <path class="interactive-path" d="${pathData}" 
                fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="14, 14" stroke-linecap="round" opacity="0.9" />
        </svg>

        <!-- Waypoint Carrots along the trail -->
        <div class="trail-carrots-layer" id="trail-carrots">
          ${carrotsHtml}
        </div>

        <!-- Paw prints layer -->
        <div class="paw-prints-layer" id="paw-layer"></div>

        <!-- Start Marker -->
        <div class="path-start-marker" id="path-start">
          <span>🐰</span>
          <span class="marker-title">START</span>
        </div>

        <!-- Animated Guided Bunny Sprite that moves with cursor -->
        <div class="guided-bunny-character" id="guided-bunny">
          <div class="bunny-sprite">🐰</div>
          <div class="bunny-bubble" id="bunny-bubble">Touch me to walk!</div>
        </div>

        <!-- Finish Picnic Basket Marker -->
        <div class="path-end-marker" id="path-end" title="Picnic Feast!">
          <span class="carrot-icon animate-pulse-subtle">🧺</span>
          <span class="marker-title">PICNIC!</span>
        </div>

        <div class="path-status" id="path-status">
          👉 Touch 🐰 <strong>Bunny</strong> to start munching carrots along the trail!
        </div>
      </div>
    `;

    const container = arena.querySelector('#path-container');
    const bunny = arena.querySelector('#guided-bunny');
    const bubble = arena.querySelector('#bunny-bubble');
    const startBtn = arena.querySelector('#path-start');
    const endBtn = arena.querySelector('#path-end');
    const status = arena.querySelector('#path-status');
    const pawLayer = arena.querySelector('#paw-layer');
    const carrotsContainer = arena.querySelector('#trail-carrots');
    const carrotEls = Array.from(carrotsContainer.querySelectorAll('.waypoint-carrot'));

    let isGuiding = false;
    let completed = false;
    let eatenCarrots = 0;
    let lastPawX = 0, lastPawY = 0;
    let offPathTimeout = null;

    // Road tolerance based on difficulty
    const diff = stateManager.getDifficulty();
    const roadTolerance = diff === 1 ? 70 : (diff === 3 ? 50 : 60);

    const resetBunnyToStart = () => {
      bunny.style.left = '45px';
      bunny.style.top = '50%';
      bunny.classList.remove('walking', 'hopping', 'off-track');
      bubble.textContent = 'Touch me to walk!';
      bubble.style.display = 'block';
      if (offPathTimeout) {
        clearTimeout(offPathTimeout);
        offPathTimeout = null;
      }
    };
    resetBunnyToStart();

    const resetCarrots = () => {
      eatenCarrots = 0;
      this.score = 0;
      carrotEls.forEach(c => {
        c.dataset.eaten = 'false';
        c.classList.remove('eaten');
      });
      pawLayer.innerHTML = '';
      const scoreEl = this.container.querySelector('#cursor-score');
      if (scoreEl) scoreEl.textContent = `0 / ${targetCarrots} 🥕`;
      endBtn.classList.remove('animate-bounce');
    };

    const startGuiding = () => {
      if (completed) return;
      isGuiding = true;
      bunny.classList.add('walking');
      bubble.textContent = eatenCarrots < targetCarrots ? 'Munch the carrots! 🥕' : 'To the picnic! 🧺';
      bubble.style.display = 'block';
      status.innerHTML = `✨ Guide Bunny along the trail! (${eatenCarrots}/${targetCarrots} Carrots eaten)`;
      status.className = 'path-status tracking-active';
      soundManager.playPop(440);
    };

    bunny.addEventListener('pointerenter', startGuiding);
    bunny.addEventListener('pointerdown', startGuiding);
    startBtn.addEventListener('pointerdown', startGuiding);

    container.addEventListener('pointermove', (e) => {
      if (!isGuiding || completed) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Update bunny position to follow cursor
      bunny.style.left = `${mouseX}px`;
      bunny.style.top = `${mouseY}px`;

      // Normalized coordinates in viewBox (0..1000, 0..400)
      const vx = (mouseX / rect.width) * 1000;
      const vy = (mouseY / rect.height) * 400;

      // Mathematical check: is cursor within roadTolerance of the golden path?
      let isOnPath = false;
      if (vx < 70) {
        // Safe start zone
        isOnPath = true;
      } else if (vx > 930) {
        // Safe finish zone
        isOnPath = true;
      } else {
        const t = (vx - 50) / 900;
        const idealVy = 200 - 125 * Math.sin(2 * Math.PI * t);
        const distY = Math.abs(vy - idealVy);
        if (distY <= roadTolerance) {
          isOnPath = true;
        }
      }

      if (isOnPath) {
        if (offPathTimeout) {
          clearTimeout(offPathTimeout);
          offPathTimeout = null;
        }
        bunny.classList.remove('off-track');

        // Drop paw print if moved enough distance
        const dist = Math.hypot(mouseX - lastPawX, mouseY - lastPawY);
        if (dist > 35 && mouseX > 60 && mouseX < rect.width - 60) {
          lastPawX = mouseX;
          lastPawY = mouseY;
          const paw = document.createElement('span');
          paw.className = 'paw-print animate-pop-in';
          paw.textContent = '🐾';
          paw.style.left = `${mouseX}px`;
          paw.style.top = `${mouseY + 8}px`;
          pawLayer.appendChild(paw);

          // Keep DOM clean by capping paw prints
          if (pawLayer.children.length > 30) {
            pawLayer.removeChild(pawLayer.children[0]);
          }
        }

        // Check collision with waypoint carrots!
        carrotEls.forEach((cEl) => {
          if (cEl.dataset.eaten === 'true') return;
          const cRect = cEl.getBoundingClientRect();
          const cCenterX = cRect.left + cRect.width / 2;
          const cCenterY = cRect.top + cRect.height / 2;
          const d = Math.hypot(e.clientX - cCenterX, e.clientY - cCenterY);
          if (d < 46) {
            cEl.dataset.eaten = 'true';
            cEl.classList.add('eaten');
            eatenCarrots++;
            this.score = eatenCarrots;

            soundManager.playPop(520 + eatenCarrots * 60);
            soundManager.playSparkle();

            // Spawn floating chomp badge at carrot position
            const badge = document.createElement('div');
            badge.className = 'carrot-chomp-badge';
            badge.textContent = '+1 Yum! 🥕';
            badge.style.left = cEl.style.left;
            badge.style.top = cEl.style.top;
            container.appendChild(badge);
            setTimeout(() => badge.remove(), 800);

            bubble.textContent = `Crunch crunch! (${eatenCarrots}/${targetCarrots}) 🥕`;
            const scoreEl = this.container.querySelector('#cursor-score');
            if (scoreEl) scoreEl.textContent = `${eatenCarrots} / ${targetCarrots} 🥕`;

            if (eatenCarrots >= targetCarrots) {
              status.innerHTML = '🎉 All carrots collected! Head to the 🧺 <strong>PICNIC</strong> basket!';
              status.className = 'path-status tracking-success';
              endBtn.classList.add('animate-bounce');
            } else {
              status.innerHTML = `🥕 Yum! ${targetCarrots - eatenCarrots} carrot${targetCarrots - eatenCarrots > 1 ? 's' : ''} left!`;
            }
          }
        });

        // Check if reached finish picnic marker
        const endRect = endBtn.getBoundingClientRect();
        const reachedEnd = (
          e.clientX >= endRect.left - 20 &&
          e.clientX <= endRect.right + 20 &&
          e.clientY >= endRect.top - 25 &&
          e.clientY <= endRect.bottom + 25
        );

        if (reachedEnd) {
          if (eatenCarrots >= targetCarrots) {
            completed = true;
            isGuiding = false;
            bunny.classList.remove('walking');
            bunny.classList.add('hopping');
            bubble.innerHTML = 'Picnic feast time! 🧺🥕🎉';
            soundManager.playChimeSuccess();
            soundManager.playSparkle();

            status.textContent = '🎉 Awesome job! Bunny got all carrots to the picnic!';
            status.className = 'path-status tracking-success';

            setTimeout(() => {
              this.handleSuccess(`Master trackpad path navigation! Bunny gathered all ${targetCarrots} carrots!`);
            }, 700);
          } else {
            bubble.textContent = "Don't forget the carrots! 🥕";
            status.innerHTML = `🐰 Head back to collect all ${targetCarrots} carrots before the picnic!`;
          }
        }
      } else {
        // Off the path!
        bunny.classList.add('off-track');
        bubble.textContent = 'Stay on the sunny road! 🌿';
        if (!offPathTimeout) {
          offPathTimeout = setTimeout(() => {
            if (isGuiding && !completed) {
              soundManager.playGentleOof();
              status.textContent = '⚠️ Stay inside the sunny trail! Touch 🐰 Bunny to try again.';
              status.className = 'path-status tracking-failed';
              isGuiding = false;
              resetBunnyToStart();
              resetCarrots();
            }
          }, 1100);
        }
      }
    });

    container.addEventListener('pointerleave', () => {
      if (isGuiding && !completed) {
        isGuiding = false;
        bunny.classList.remove('walking');
        resetBunnyToStart();
        resetCarrots();
        status.textContent = 'Left the trail area! Touch 🐰 Bunny to try again.';
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
    if (this.difficultyHandler) {
      window.removeEventListener('difficultychange', this.difficultyHandler);
    }
  }
}
