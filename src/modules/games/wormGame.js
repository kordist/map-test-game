/**
 * Mission: Save the Apple! (Block the Worm)
 * Trains: Cursor tracking, reaction timing, drag & drop / click-to-place blocks.
 * Design: Option 3 — Converging Garden Trails (Top & Bottom paths curve inward into the center apple)
 * Mechanics:
 * - Start Button: Game waits in ready state until player clicks "START MISSION!"
 * - Pause / Resume: Player can pause at any time.
 * - Worm crawls toward the apple. Players place wooden blocks in its path.
 * - When blocked, worm bonks, turns 20% red (1 of 5 segments), bounces back, and tries
 *   a sneaky side detour path! 5 bumps (100% red) saves the apple and tames the worm!
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class WormGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.bumps = 0;
    this.wormX = 40;
    this.wormLane = 1; // 0: Top detour, 1: Main center path, 2: Bottom detour
    this.isGameStarted = false;
    this.isPaused = false;
    this.isBumping = false;
    this.isAsleep = false;
    this.animId = null;
    this.blocks = [];
    this.applyDifficulty();
  }

  applyDifficulty() {
    const diff = stateManager.getDifficulty();
    if (diff === 1) {
      // Level 1: Gentle crawl, 3 bumps to win, max 4 blocks allowed
      this.wormSpeed = 0.8;
      this.targetBumps = 3;
      this.maxBlocks = 4;
      this.levelLabel = '🌱 Level 1 (Gentle)';
    } else if (diff === 3) {
      // Level 3: Turbo crawl, 5 bumps to win, max 2 blocks allowed
      this.wormSpeed = 1.7;
      this.targetBumps = 5;
      this.maxBlocks = 2;
      this.levelLabel = '⚡ Level 3 (Turbo)';
    } else {
      // Level 2 (Default / Normal): Balanced crawl, 5 bumps, max 3 blocks
      this.wormSpeed = 1.2;
      this.targetBumps = 5;
      this.maxBlocks = 3;
      this.levelLabel = '🌿 Level 2 (Standard)';
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper worm-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">🍎 Special Quest: Save the Apple!</div>
          <h2 class="game-title">Block the Hungry Worm!</h2>
          <p class="game-desc">Place wooden blocks along the trails to bump the worm ${this.targetBumps} times. If you block the main path, he will try a curved detour to sneak around!</p>
          
          <div class="game-stats">
            <div class="stat-pill">
              <span class="stat-icon">🐛</span>
              <span>Worm Tiredness: <strong id="worm-pct-label">0%</strong></span>
            </div>

            <!-- Dynamic Segment Visual Worm Meter -->
            <div class="worm-segment-meter" id="worm-segment-meter">
              <span class="meter-label">Body Segments:</span>
              <div class="segment-dots">
                ${Array.from({ length: this.targetBumps }, (_, i) => `
                  <span class="seg-dot seg-${i + 1}" id="seg-${i + 1}">🟢</span>
                `).join('')}
              </div>
              <span class="meter-status-tag" id="meter-status-tag">${this.bumps} / ${this.targetBumps} Bumps</span>
            </div>

            <!-- Prominent In-Game Start / Pause Button in Header -->
            <button class="btn-game-play-toggle is-ready" id="btn-header-start" title="Start or Pause Mission">
              <span class="btn-toggle-icon">▶</span> <span class="btn-toggle-text">START MISSION</span>
            </button>
          </div>
        </div>

        <!-- Garden Lawn Arena with Converging Paths (100% Unobstructed View) -->
        <div class="game-arena worm-arena" id="worm-arena">
          <div class="garden-lawn" id="garden-lawn">

            <!-- Converging Trails SVG Background -->
            <svg class="garden-converging-paths" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <!-- userSpaceOnUse ensures all lines (including zero-height horizontal lines) render gradients cleanly -->
                <linearGradient id="trailGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
                  <stop offset="0%" stop-color="#FDFBF7" />
                  <stop offset="40%" stop-color="#F2EAE0" />
                  <stop offset="100%" stop-color="#E2D4C0" />
                </linearGradient>
                <linearGradient id="trailBorderGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
                  <stop offset="0%" stop-color="#D9CCA8" />
                  <stop offset="60%" stop-color="#C7B693" />
                  <stop offset="100%" stop-color="#B5A07B" />
                </linearGradient>
                <radialGradient id="stumpBase" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#D2BA99" />
                  <stop offset="70%" stop-color="#BA9E7B" />
                  <stop offset="100%" stop-color="#9C7F5D" />
                </radialGradient>
              </defs>

              <!-- Central Destination Island / Tree Stump Base -->
              <ellipse cx="910" cy="200" rx="78" ry="66" fill="url(#stumpBase)" stroke="#8A6E4F" stroke-width="4" />
              <ellipse cx="910" cy="200" rx="62" ry="52" fill="none" stroke="#785B3F" stroke-width="2" stroke-dasharray="6 6" opacity="0.6" />

              <!-- Outer Road Borders (70px wide base) -->
              <!-- Top Path: Lane 0 curves down from (500,67) to (910,200) -->
              <path class="road-path-outer" d="M 0,67 L 500,67 C 690,67 810,200 910,200" fill="none" stroke="url(#trailBorderGrad)" stroke-width="70" stroke-linecap="round" />
              <!-- Bottom Path: Lane 2 curves up from (500,333) to (910,200) -->
              <path class="road-path-outer" d="M 0,333 L 500,333 C 690,333 810,200 910,200" fill="none" stroke="url(#trailBorderGrad)" stroke-width="70" stroke-linecap="round" />
              <!-- Middle Path: Lane 1 straight to (910,200) - using 2D rect with 70px height so Chromium renders it flawlessly -->
              <rect class="road-path-outer road-rect" x="0" y="165" width="910" height="70" fill="url(#trailBorderGrad)" />

              <!-- Inner Road Surface (58px wide paved road) -->
              <!-- Top Path -->
              <path class="road-path-inner" d="M 0,67 L 500,67 C 690,67 810,200 910,200" fill="none" stroke="url(#trailGrad)" stroke-width="58" stroke-linecap="round" />
              <!-- Bottom Path -->
              <path class="road-path-inner" d="M 0,333 L 500,333 C 690,333 810,200 910,200" fill="none" stroke="url(#trailGrad)" stroke-width="58" stroke-linecap="round" />
              <!-- Middle Path: Lane 1 straight to (910,200) - using 2D rect with 58px height -->
              <rect class="road-path-inner road-rect" x="0" y="171" width="910" height="58" fill="url(#trailGrad)" />

              <!-- Stepping Stone Dash Centerlines -->
              <path class="road-path-dash" d="M 10,67 L 500,67 C 690,67 810,200 890,200" fill="none" stroke="#C4B094" stroke-width="3" stroke-dasharray="10 12" />
              <path class="road-path-dash" d="M 10,333 L 500,333 C 690,333 810,200 890,200" fill="none" stroke="#C4B094" stroke-width="3" stroke-dasharray="10 12" />
              <path class="road-path-dash" d="M 10,200 L 890,200" fill="none" stroke="#C4B094" stroke-width="3" stroke-dasharray="10 12" />
            </svg>

            <!-- Lane Signs at Garden Entrance -->
            <div class="lane-entrance-signs" aria-hidden="true">
              <div class="lane-badge-tag tag-lane-0">🌿 Top Detour</div>
              <div class="lane-badge-tag tag-lane-1">⭐ Main Road</div>
              <div class="lane-badge-tag tag-lane-2">🌸 Bottom Detour</div>
            </div>

            <!-- Decorative Flowers along Garden Margins -->
            <div class="garden-decor-flowers" aria-hidden="true">
              <span class="decor-flower df-1" style="top: 2%; left: 32%;">🌼</span>
              <span class="decor-flower df-2" style="top: 2%; left: 62%;">🌸</span>
              <span class="decor-flower df-3" style="top: 28%; left: 40%;">🌷</span>
              <span class="decor-flower df-4" style="top: 30%; left: 70%;">🌼</span>
              <span class="decor-flower df-5" style="top: 62%; left: 36%;">🌸</span>
              <span class="decor-flower df-6" style="top: 60%; left: 72%;">🌷</span>
              <span class="decor-flower df-7" style="top: 91%; left: 28%;">🌼</span>
              <span class="decor-flower df-8" style="top: 92%; left: 64%;">🌸</span>
            </div>

            <!-- Placed Blocks Layer -->
            <div class="placed-blocks-layer" id="placed-blocks-layer"></div>

            <!-- The Worm Entity -->
            <div class="worm-entity" id="worm-entity">
              <div class="worm-body-segments" id="worm-segments-wrapper">
                ${Array.from({ length: this.targetBumps }, (_, i) => this.targetBumps - i).map(n => `
                  <div class="worm-seg ${n === this.targetBumps ? 'seg-tail' : ''}" id="wseg-${n}">🟢</div>
                `).join('')}
              </div>
              <div class="worm-head" id="worm-head">
                <span class="worm-face" id="worm-face">🐛</span>
                <span class="worm-thought" id="worm-thought">Waiting for Start! 💤</span>
              </div>
            </div>

            <!-- The Happy Apple Target Entity (Center Pedestal) -->
            <div class="apple-entity" id="apple-entity">
              <div class="apple-pedestal">🪵</div>
              <div class="apple-avatar animate-pulse-subtle" id="apple-avatar">🍎</div>
              <div class="apple-bubble" id="apple-bubble">Click Start Mission when ready! ✨</div>
            </div>
          </div>
        </div>

        <!-- Toolbox & Controls -->
        <div class="worm-toolbox-bar">
          <!-- Start / Pause Toggle Button -->
          <button class="btn-start-worm-toggle" id="btn-start-worm-toggle" title="Start or Pause the Worm">
            <span class="btn-toggle-icon">▶</span> <span class="btn-toggle-text">Start Mission</span>
          </button>

          <div class="toolbox-block-pickup draggable-item" draggable="true" id="toolbox-block">
            <span class="block-icon">🧱</span>
            <div class="block-info">
              <strong>Wooden Block</strong>
              <small>Click lane or Drag onto path to build a wall!</small>
            </div>
          </div>

          <div class="toolbox-hint">
            💡 <strong>How to Play:</strong> Click ahead on the path or drag a block. If you block the middle, watch the worm curve along the side paths!
          </div>

          <button class="btn-sound-instruction" id="worm-speak-btn">
            <span class="icon-speaker">🔊</span> Hear Directions
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.initWormPosition();
  }

  bindEvents() {
    // Header Start/Pause button
    const headerStartBtn = this.container.querySelector('#btn-header-start');
    if (headerStartBtn) {
      headerStartBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }

    // Toolbox Start/Pause Toggle button
    const toggleBtn = this.container.querySelector('#btn-start-worm-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }

    // Spoken Audio directions
    const speakBtn = this.container.querySelector('#worm-speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        soundManager.speak("Click Start Mission when you are ready. Place wooden blocks in front of the crawling worm. If you block the center path, he will take a curved detour around the wall! Stop him five times to save the apple!");
      });
    }

    const lawn = this.container.querySelector('#garden-lawn');
    const toolboxBlock = this.container.querySelector('#toolbox-block');

    // Click anywhere on lawn to drop a block along the nearest lane path
    lawn.addEventListener('click', (e) => {
      if (this.isAsleep) return;
      const rect = lawn.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Keep within valid garden bounds (not off screen, not on the apple pedestal)
      if (clickX < 30 || clickX > rect.width - 80) {
        soundManager.playGentleOof();
        return;
      }

      const lane = this.getLaneFromCoords(clickX, clickY);
      const headX = this.getWormHeadX();

      // If clicking in the worm's lane, allow placing right in front of the nose!
      // Only disallow placing directly behind the worm's crawling body
      if (lane === this.wormLane && clickX < headX - 15) {
        soundManager.playGentleOof();
        return;
      }

      this.placeBlock(clickX, lane);
    });

    // Drag and drop from toolbox
    if (toolboxBlock) {
      toolboxBlock.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'wooden-block');
        soundManager.playPop(450);
      });
    }

    lawn.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    lawn.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.isAsleep) return;
      const rect = lawn.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      if (dropX < 30 || dropX > rect.width - 80) return;

      const lane = this.getLaneFromCoords(dropX, dropY);
      const headX = this.getWormHeadX();
      if (lane === this.wormLane && dropX < headX - 15) return;

      this.placeBlock(dropX, lane);
    });

    // Listen for live difficulty changes
    this.onDiffChange = () => {
      this.applyDifficulty();
      if (!this.isGameStarted) {
        this.render();
      } else {
        const statusTag = this.container.querySelector('#meter-status-tag');
        if (statusTag) statusTag.textContent = `${this.bumps} / ${this.targetBumps} Bumps`;
      }
    };
    window.addEventListener('difficultychange', this.onDiffChange);
  }

  initWormPosition() {
    const wormEl = this.container.querySelector('#worm-entity');
    if (!wormEl) return;
    const currentY = this.getLaneY(this.wormLane, this.wormX);
    wormEl.style.left = `${this.wormX}px`;
    wormEl.style.top = `${currentY}px`;
    wormEl.style.transform = `rotate(0deg)`;
  }

  startGame() {
    if (this.isGameStarted && !this.isPaused) return;

    soundManager.playSparkle();
    this.isGameStarted = true;
    this.isPaused = false;

    this.updateButtonsUI();

    const wormFace = this.container.querySelector('#worm-face');
    if (wormFace) wormFace.textContent = '🐛';

    this.updateLaneThoughts();

    if (!this.animId) {
      this.animId = requestAnimationFrame(this.gameUpdateLoop.bind(this));
    }
  }

  togglePause() {
    if (!this.isGameStarted) {
      this.startGame();
      return;
    }

    this.isPaused = !this.isPaused;
    this.updateButtonsUI();

    const wormThought = this.container.querySelector('#worm-thought');
    if (this.isPaused) {
      if (wormThought) wormThought.textContent = 'Taking a quick breather! ⏸';
    } else {
      this.updateLaneThoughts();
    }
  }

  updateButtonsUI() {
    const headerBtn = this.container.querySelector('#btn-header-start');
    const toolboxBtn = this.container.querySelector('#btn-start-worm-toggle');

    const updateBtn = (btn) => {
      if (!btn) return;
      btn.classList.remove('is-running', 'is-paused', 'is-ready');
      if (!this.isGameStarted) {
        btn.classList.add('is-ready');
        btn.innerHTML = `<span class="btn-toggle-icon">▶</span> <span class="btn-toggle-text">START MISSION</span>`;
      } else if (this.isPaused) {
        btn.classList.add('is-paused');
        btn.innerHTML = `<span class="btn-toggle-icon">▶</span> <span class="btn-toggle-text">Resume</span>`;
      } else {
        btn.classList.add('is-running');
        btn.innerHTML = `<span class="btn-toggle-icon">⏸</span> <span class="btn-toggle-text">Pause</span>`;
      }
    };

    updateBtn(headerBtn);
    updateBtn(toolboxBtn);
  }

  /**
   * Computes the Y coordinate for a given lane (0: top, 1: center, 2: bottom) at horizontal position X.
   * Past curveStartX (~50% width), lanes 0 and 2 smoothly converge toward center lane Y at curveEndX.
   */
  getLaneY(lane, x = 0) {
    const lawn = this.container.querySelector('#garden-lawn');
    const w = lawn ? lawn.clientWidth : 750;
    const h = lawn ? lawn.clientHeight : 380;

    // Base Y coordinates for the 3 lanes at X = 0 (scaled to SVG viewBox 0 0 1000 400)
    const y0 = Math.round(h * (67 / 400) - 25);
    const y1 = Math.round(h * (200 / 400) - 25);
    const y2 = Math.round(h * (333 / 400) - 25);

    const baseY = lane === 0 ? y0 : (lane === 2 ? y2 : y1);
    const centerY = y1;

    const curveStartX = w * 0.50;
    const curveEndX = w - 110;

    if (x <= curveStartX || lane === 1) {
      return baseY;
    }

    const t = Math.min(1, Math.max(0, (x - curveStartX) / (curveEndX - curveStartX)));
    // Cubic smoothstep easing: matches the SVG bezier curve curvature perfectly
    const tSmooth = t * t * (3 - 2 * t);
    return Math.round(baseY + (centerY - baseY) * tSmooth);
  }

  /**
   * Computes the body tilt angle (in degrees) along the curved path
   */
  getLaneAngle(lane, x = 0) {
    const lawn = this.container.querySelector('#garden-lawn');
    const w = lawn ? lawn.clientWidth : 750;
    const curveStartX = w * 0.50;
    const curveEndX = w - 110;

    if (x <= curveStartX || lane === 1) {
      return 0;
    }

    const t = Math.min(1, Math.max(0, (x - curveStartX) / (curveEndX - curveStartX)));
    const tilt = Math.sin(t * Math.PI) * 20;

    if (lane === 0) return Math.round(tilt);   // Curves downward: tilt head down
    if (lane === 2) return Math.round(-tilt);  // Curves upward: tilt head up
    return 0;
  }

  /**
   * Finds the appropriate lane (0, 1, or 2) from click/drop coordinates
   */
  getLaneFromCoords(clickX, clickY) {
    const lawn = this.container.querySelector('#garden-lawn');
    const w = lawn ? lawn.clientWidth : 750;
    const curveStartX = w * 0.50;

    if (clickX <= curveStartX) {
      const h = lawn ? lawn.clientHeight : 380;
      const laneHeight = h / 3;
      return Math.min(2, Math.max(0, Math.floor(clickY / laneHeight)));
    }

    // In the converging section, choose whichever lane's curve is closest vertically
    let bestLane = 1;
    let minDiff = Infinity;
    for (let l of [0, 1, 2]) {
      const py = this.getLaneY(l, clickX);
      const diff = Math.abs(py - clickY);
      if (diff < minDiff) {
        minDiff = diff;
        bestLane = l;
      }
    }
    return bestLane;
  }

  getWormHeadX() {
    // Measure strictly from the worm's face emoji, NOT including the thought bubble!
    const faceEl = this.container.querySelector('#worm-face');
    const lawn = this.container.querySelector('#garden-lawn');
    if (faceEl && lawn) {
      const faceRect = faceEl.getBoundingClientRect();
      const lawnRect = lawn.getBoundingClientRect();
      // Leading front point of the worm head face (rightmost edge of the 🐛 emoji)
      return (faceRect.right - lawnRect.left);
    }
    return this.wormX + 90;
  }

  placeBlock(x, lane) {
    soundManager.playDrop();
    const blocksLayer = this.container.querySelector('#placed-blocks-layer');
    if (!blocksLayer) return;

    // Allow active blocks based on difficulty (Lvl 1: 4, Lvl 2: 3, Lvl 3: 2)
    if (this.blocks.length >= (this.maxBlocks || 3)) {
      const oldest = this.blocks.shift();
      if (oldest.el) oldest.el.remove();
    }

    const blockEl = document.createElement('div');
    blockEl.className = 'placed-wooden-block animate-pop-in';
    blockEl.innerHTML = `🧱<span class="wood-glow"></span>`;
    
    // Snap block onto the exact path coordinate for this lane at x
    const blockY = this.getLaneY(lane, x);
    blockEl.style.left = `${x}px`;
    blockEl.style.top = `${blockY}px`;

    blocksLayer.appendChild(blockEl);

    const blockObj = {
      x: x,
      lane: lane,
      el: blockEl
    };

    this.blocks.push(blockObj);

    // Make block removable by clicking on it
    blockEl.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.playCrack();
      blockEl.remove();
      this.blocks = this.blocks.filter(b => b !== blockObj);
    });
  }

  gameUpdateLoop() {
    if (this.isAsleep) return;

    if (this.isGameStarted && !this.isPaused && !this.isBumping) {
      // Move worm forward along path
      this.wormX += this.wormSpeed;

      const wormEl = this.container.querySelector('#worm-entity');
      const lawn = this.container.querySelector('#garden-lawn');
      const appleEl = this.container.querySelector('#apple-entity');

      // Position worm along the curved trajectory
      const headX = this.getWormHeadX();
      const currentY = this.getLaneY(this.wormLane, headX - 60);
      const currentAngle = this.getLaneAngle(this.wormLane, headX - 60);

      if (wormEl) {
        wormEl.style.left = `${this.wormX}px`;
        wormEl.style.top = `${currentY}px`;
        wormEl.style.transform = `rotate(${currentAngle}deg)`;
      }

      // Dynamic curve warning when approaching the convergence point
      const lawnWidth = lawn ? lawn.clientWidth : 750;
      const curveStartX = lawnWidth * 0.50;
      const appleBubble = this.container.querySelector('#apple-bubble');
      const wormThought = this.container.querySelector('#worm-thought');

      if (headX > curveStartX + 60 && this.wormLane !== 1 && appleBubble) {
        if (!appleBubble.dataset.convergeWarned) {
          const studentName = stateManager.get().profile.name || 'Hero';
          appleBubble.dataset.convergeWarned = 'true';
          appleBubble.textContent = `The trails are merging! Block the turn, ${studentName}! 🚨`;
          if (wormThought) wormThought.textContent = "Almost around the wall! 🍎✨";
        }
      }

      // Check collision between the worm's HEAD and any placed block in the same lane
      const hitBlock = this.blocks.find(b => 
        b.lane === this.wormLane && headX >= (b.x - 22) && (headX - b.x) < 28
      );

      if (hitBlock) {
        this.handleBump(hitBlock);
      }

      // Check if worm reached the apple
      let appleThreshold = lawnWidth - 95;
      if (appleEl && lawn) {
        const appleRect = appleEl.getBoundingClientRect();
        const lawnRect = lawn.getBoundingClientRect();
        appleThreshold = (appleRect.left - lawnRect.left) + 15;
      }

      if (headX >= appleThreshold) {
        this.handleAppleReached();
        return;
      }
    }

    this.animId = requestAnimationFrame(this.gameUpdateLoop.bind(this));
  }

  updateLaneThoughts() {
    const wormThought = this.container.querySelector('#worm-thought');
    const appleBubble = this.container.querySelector('#apple-bubble');
    if (appleBubble) delete appleBubble.dataset.convergeWarned;

    if (!this.isGameStarted) {
      if (wormThought) wormThought.textContent = 'Waiting for Start! 💤';
      if (appleBubble) appleBubble.textContent = 'Click Start Mission when ready! ✨';
      return;
    }

    if (this.wormLane === 1) {
      const studentName = stateManager.get().profile.name || 'Hero';
      if (wormThought) wormThought.textContent = 'Straight for the apple! 😋';
      if (appleBubble) appleBubble.textContent = `Block the main road, ${studentName}! 🧱`;
    } else if (this.wormLane === 0) {
      if (wormThought) wormThought.textContent = 'Taking the top detour! 🌿';
      if (appleBubble) appleBubble.textContent = "He's curving down from the top! 😱";
    } else if (this.wormLane === 2) {
      if (wormThought) wormThought.textContent = 'Sneaking via bottom trail! 🌸';
      if (appleBubble) appleBubble.textContent = "He's curving up from the bottom! 😱";
    }
  }

  handleBump(blockObj) {
    this.isBumping = true;
    this.bumps++;

    // Play cartoon bonk sound
    soundManager.playBonk();
    soundManager.playBoing();

    // Remove the hit block with animation
    if (blockObj.el) {
      blockObj.el.classList.add('block-smashed');
      setTimeout(() => {
        blockObj.el.remove();
      }, 250);
    }
    this.blocks = this.blocks.filter(b => b !== blockObj);

    const wormEl = this.container.querySelector('#worm-entity');
    const wormFace = this.container.querySelector('#worm-face');
    const wormThought = this.container.querySelector('#worm-thought');
    const appleBubble = this.container.querySelector('#apple-bubble');

    // Bounce worm backward along path
    this.wormX = Math.max(30, this.wormX - 60);
    if (wormEl) {
      wormEl.classList.add('worm-bonked');
      wormEl.style.left = `${this.wormX}px`;
    }
    if (wormFace) wormFace.textContent = '😵';
    if (wormThought) wormThought.textContent = 'BONK! Ouch! 💥';
    const studentName = stateManager.get().profile.name || 'Hero';
    if (appleBubble) appleBubble.textContent = `Great block, ${studentName}! (${this.bumps}/5)`;

    // Update body segments based on target bumps
    const bumpValue = Math.round(100 / this.targetBumps);
    const pct = Math.min(100, this.bumps * bumpValue);
    const pctLabel = this.container.querySelector('#worm-pct-label');
    if (pctLabel) pctLabel.textContent = `${pct}%`;

    const statusTag = this.container.querySelector('#meter-status-tag');
    if (statusTag) statusTag.textContent = `${this.bumps} / ${this.targetBumps} Bumps`;

    // Color segment red
    const segDot = this.container.querySelector(`#seg-${this.bumps}`);
    if (segDot) {
      segDot.textContent = '🔴';
      segDot.classList.add('animate-pop-in');
    }

    const wseg = this.container.querySelector(`#wseg-${this.bumps}`);
    if (wseg) {
      wseg.textContent = '🔴';
      wseg.classList.add('red-turned', 'animate-pop-in');
    }

    // Spawn floating badge
    this.spawnFloatingBadge(`💥 BONK! +${bumpValue}%! (${pct}%)`);

    // Check if 5 bumps reached (100% full red!)
    if (this.bumps >= this.targetBumps) {
      setTimeout(() => {
        this.handleVictory();
      }, 600);
      return;
    }

    // Resume crawling after 750ms and switch to an alternate detour path
    setTimeout(() => {
      this.isBumping = false;
      if (wormEl) {
        wormEl.classList.remove('worm-bonked');
      }
      if (wormFace) wormFace.textContent = '🐛';

      // Strategic Detour: If blocked in center, worm attempts a side detour path!
      const alternateLanes = [0, 1, 2].filter(l => l !== this.wormLane);
      this.wormLane = alternateLanes[Math.floor(Math.random() * alternateLanes.length)];

      this.updateLaneThoughts();
    }, 750);
  }

  spawnFloatingBadge(text) {
    const lawn = this.container.querySelector('#garden-lawn');
    if (!lawn) return;
    const badge = document.createElement('div');
    badge.className = 'bonk-floating-badge animate-pop-in';
    badge.textContent = text;
    const headX = this.getWormHeadX();
    badge.style.left = `${Math.min(lawn.clientWidth - 200, Math.max(50, headX - 40))}px`;
    badge.style.top = '40px';
    lawn.appendChild(badge);

    setTimeout(() => badge.remove(), 1200);
  }

  handleAppleReached() {
    this.isGameStarted = false;
    cancelAnimationFrame(this.animId);
    this.animId = null;
    soundManager.playGentleOof();

    const appleAvatar = this.container.querySelector('#apple-avatar');
    const appleBubble = this.container.querySelector('#apple-bubble');
    if (appleAvatar) appleAvatar.textContent = '🍎😱';
    if (appleBubble) appleBubble.textContent = "The worm reached the apple! Let's try again!";

    const lawn = this.container.querySelector('#garden-lawn');
    const retryModal = document.createElement('div');
    retryModal.className = 'mini-win-banner animate-bounce-in';
    retryModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🍎</div>
        <h3>Almost Had Him!</h3>
        <p>The hungry worm reached the apple. Place your wooden blocks faster to cut off his detour!</p>
        <div class="win-buttons">
          <button class="btn-action btn-primary btn-retry-worm">Try Again 🔄</button>
        </div>
      </div>
    `;

    lawn.appendChild(retryModal);
    retryModal.querySelector('.btn-retry-worm').addEventListener('click', () => {
      retryModal.remove();
      this.bumps = 0;
      this.wormX = 40;
      this.wormLane = 1;
      this.isGameStarted = false;
      this.isPaused = false;
      this.isBumping = false;
      this.isAsleep = false;
      this.blocks = [];
      this.render();
    });
  }

  handleVictory() {
    this.isAsleep = true;
    this.isGameStarted = false;
    cancelAnimationFrame(this.animId);
    this.animId = null;

    soundManager.playFanfare();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    const wormFace = this.container.querySelector('#worm-face');
    const wormThought = this.container.querySelector('#worm-thought');
    const appleAvatar = this.container.querySelector('#apple-avatar');
    const appleBubble = this.container.querySelector('#apple-bubble');

    if (wormFace) wormFace.textContent = '😴';
    if (wormThought) wormThought.innerHTML = 'Zzz... 100% full & sleepy! 💤';
    if (appleAvatar) appleAvatar.textContent = '🍎👑';
    const studentNameWin = stateManager.get().profile.name || 'Hero';
    if (appleBubble) appleBubble.textContent = `Hooray ${studentNameWin}! You saved me! 🎉`;

    stateManager.recordSkillProgress('cursor', { stars: 3 });

    const lawn = this.container.querySelector('#garden-lawn');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🍎✨</div>
        <h3>The Apple is Saved!</h3>
        <p>You bumped the worm 5 times and blocked every curved detour! He fell fast asleep!</p>
        <div class="win-stars">+3 Stars Earned! ⭐⭐⭐</div>
        <div class="win-buttons">
          <button class="btn-action btn-play-again">Play Again</button>
          <button class="btn-action btn-primary btn-next-mission">Back to Missions 🎮</button>
        </div>
      </div>
    `;

    lawn.appendChild(winModal);

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.bumps = 0;
      this.wormX = 40;
      this.wormLane = 1;
      this.isGameStarted = false;
      this.isPaused = false;
      this.isBumping = false;
      this.isAsleep = false;
      this.blocks = [];
      this.render();
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('arcade');
    });
  }

  destroy() {
    this.isAsleep = true;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.onDiffChange) {
      window.removeEventListener('difficultychange', this.onDiffChange);
    }
  }
}
