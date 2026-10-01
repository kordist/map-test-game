/**
 * Mission: Save the Apple! (Block the Worm)
 * Trains: Cursor tracking, reaction timing, drag & drop / click-to-place blocks.
 * Mechanics: Worm crawls toward the apple. Hailey places wooden blocks in its path.
 * Each bump turns 20% (1 of 5 segments) of the worm's body red.
 * 5 bumps (100% red) tames/tires the worm and saves the apple!
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class WormGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.bumps = 0;
    this.targetBumps = 5;
    this.wormX = 50;
    this.wormLane = 1; // 0, 1, 2
    this.wormSpeed = 1.1; // Kid-friendly measured crawling pace
    this.isRunning = false;
    this.animId = null;
    this.blocks = [];
    this.isBumping = false;
    this.isAsleep = false;
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper worm-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">🍎 Special Quest: Save the Apple!</div>
          <h2 class="game-title">Block the Hungry Worm!</h2>
          <p class="game-desc">Place wooden blocks in the worm's path to bump him 5 times (each bump turns 20% of his body red!).</p>
          
          <div class="game-stats">
            <div class="stat-pill">
              <span class="stat-icon">🐛</span>
              <span>Worm Tiredness: <strong id="worm-pct-label">0%</strong></span>
            </div>

            <!-- 5-Segment Visual Worm Meter -->
            <div class="worm-segment-meter" id="worm-segment-meter">
              <span class="meter-label">Body Segments:</span>
              <div class="segment-dots">
                <span class="seg-dot seg-1" id="seg-1">🟢</span>
                <span class="seg-dot seg-2" id="seg-2">🟢</span>
                <span class="seg-dot seg-3" id="seg-3">🟢</span>
                <span class="seg-dot seg-4" id="seg-4">🟢</span>
                <span class="seg-dot seg-5" id="seg-5">🟢</span>
              </div>
              <span class="meter-status-tag" id="meter-status-tag">0 / 5 Bumps</span>
            </div>
          </div>
        </div>

        <!-- Garden Lawn Arena -->
        <div class="game-arena worm-arena" id="worm-arena">
          <div class="garden-lawn" id="garden-lawn">
            <!-- 3 Garden Paths -->
            <div class="garden-lane lane-0" data-lane="0">
              <span class="lane-flower">🌼</span>
              <span class="lane-flower">🌸</span>
            </div>
            <div class="garden-lane lane-1 active-lane" data-lane="1">
              <span class="lane-flower">🌷</span>
              <span class="lane-flower">🌼</span>
            </div>
            <div class="garden-lane lane-2" data-lane="2">
              <span class="lane-flower">🌸</span>
              <span class="lane-flower">🌷</span>
            </div>

            <!-- The Worm Entity -->
            <div class="worm-entity" id="worm-entity">
              <div class="worm-body-segments" id="worm-segments-wrapper">
                <div class="worm-seg seg-tail" id="wseg-5">🟢</div>
                <div class="worm-seg" id="wseg-4">🟢</div>
                <div class="worm-seg" id="wseg-3">🟢</div>
                <div class="worm-seg" id="wseg-2">🟢</div>
                <div class="worm-seg" id="wseg-1">🟢</div>
              </div>
              <div class="worm-head" id="worm-head">
                <span class="worm-face" id="worm-face">🐛</span>
                <span class="worm-thought" id="worm-thought">I want apple! 😋</span>
              </div>
            </div>

            <!-- Placed Blocks Layer -->
            <div class="placed-blocks-layer" id="placed-blocks-layer"></div>

            <!-- The Happy Apple Entity -->
            <div class="apple-entity" id="apple-entity">
              <div class="apple-pedestal">🪵</div>
              <div class="apple-avatar animate-pulse-subtle" id="apple-avatar">🍎</div>
              <div class="apple-bubble" id="apple-bubble">Block the worm, Hailey! ✨</div>
            </div>
          </div>
        </div>

        <!-- Toolbox & Controls -->
        <div class="worm-toolbox-bar">
          <div class="toolbox-block-pickup draggable-item" draggable="true" id="toolbox-block">
            <span class="block-icon">🧱</span>
            <div class="block-info">
              <strong>Wooden Block</strong>
              <small>Click or Drag into garden to place!</small>
            </div>
          </div>

          <div class="toolbox-hint">
            💡 <strong>How to Play:</strong> Click anywhere in front of the worm or drag the block to build a wall!
          </div>

          <button class="btn-sound-instruction" id="worm-speak-btn">
            <span class="icon-speaker">🔊</span> Hear Directions
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startGameLoop();
  }

  bindEvents() {
    const speakBtn = this.container.querySelector('#worm-speak-btn');
    speakBtn.addEventListener('click', () => {
      soundManager.speak("Place wooden blocks in front of the crawling worm. Each time he bumps into a block, twenty percent of his body turns red! Stop him five times to save the apple!");
    });

    const lawn = this.container.querySelector('#garden-lawn');
    const toolboxBlock = this.container.querySelector('#toolbox-block');

    // Click anywhere on lawn to drop a block at click position
    lawn.addEventListener('click', (e) => {
      if (this.isAsleep) return;
      const rect = lawn.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const headX = this.getWormHeadX();
      // Don't place behind worm's head or on apple
      if (clickX > headX + 10 && clickX < rect.width - 90) {
        // Determine lane from clickY
        const laneHeight = rect.height / 3;
        const lane = Math.min(2, Math.max(0, Math.floor(clickY / laneHeight)));
        this.placeBlock(clickX, lane);
      } else {
        soundManager.playGentleOof();
      }
    });

    // Drag and drop from toolbox
    toolboxBlock.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', 'wooden-block');
      soundManager.playPop(450);
    });

    lawn.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    lawn.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.isAsleep) return;
      const rect = lawn.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      const headX = this.getWormHeadX();
      if (dropX > headX + 10 && dropX < rect.width - 90) {
        const laneHeight = rect.height / 3;
        const lane = Math.min(2, Math.max(0, Math.floor(dropY / laneHeight)));
        this.placeBlock(dropX, lane);
      }
    });
  }

  getLaneY(lane) {
    const lawn = this.container.querySelector('#garden-lawn');
    const h = lawn ? lawn.clientHeight : 380;
    const laneHeight = h / 3;
    return Math.round((lane * laneHeight) + (laneHeight / 2) - 25);
  }

  getWormHeadX() {
    const headEl = this.container.querySelector('#worm-head');
    const lawn = this.container.querySelector('#garden-lawn');
    if (headEl && lawn) {
      const headRect = headEl.getBoundingClientRect();
      const lawnRect = lawn.getBoundingClientRect();
      // Leading front point of the worm head face (rightmost edge)
      return (headRect.right - lawnRect.left);
    }
    return this.wormX + 175;
  }

  placeBlock(x, lane) {
    soundManager.playDrop();
    const blocksLayer = this.container.querySelector('#placed-blocks-layer');
    if (!blocksLayer) return;

    // Limit to max 2 active blocks at a time so player actively places them
    if (this.blocks.length >= 2) {
      const oldest = this.blocks.shift();
      if (oldest.el) oldest.el.remove();
    }

    const blockEl = document.createElement('div');
    blockEl.className = 'placed-wooden-block animate-pop-in';
    blockEl.innerHTML = `🧱<span class="wood-glow"></span>`;
    
    const laneY = this.getLaneY(lane);
    blockEl.style.left = `${x}px`;
    blockEl.style.top = `${laneY}px`;

    blocksLayer.appendChild(blockEl);

    const blockObj = {
      x: x,
      lane: lane,
      el: blockEl
    };

    this.blocks.push(blockObj);

    // Make block movable/draggable by clicking on it
    blockEl.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.playCrack();
      blockEl.remove();
      this.blocks = this.blocks.filter(b => b !== blockObj);
    });
  }

  startGameLoop() {
    this.bumps = 0;
    this.wormX = 40;
    this.wormLane = 1;
    this.isBumping = false;
    this.isAsleep = false;
    this.blocks = [];

    const wormEl = this.container.querySelector('#worm-entity');
    const lawn = this.container.querySelector('#garden-lawn');
    const appleEl = this.container.querySelector('#apple-entity');

    const update = () => {
      if (this.isAsleep) return;

      if (!this.isBumping) {
        // Move worm forward
        this.wormX += this.wormSpeed;
        const laneY = this.getLaneY(this.wormLane);
        if (wormEl) {
          wormEl.style.left = `${this.wormX}px`;
          wormEl.style.top = `${laneY}px`;
        }

        const headX = this.getWormHeadX();

        // Check collision between the worm's HEAD and any placed block in the same lane
        const hitBlock = this.blocks.find(b => 
          b.lane === this.wormLane && headX >= (b.x - 22) && (headX - b.x) < 28
        );

        if (hitBlock) {
          this.handleBump(hitBlock);
        }

        // Check if worm's head reached the apple
        const lawnWidth = lawn ? lawn.clientWidth : 750;
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

      this.animId = requestAnimationFrame(update);
    };

    this.animId = requestAnimationFrame(update);
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

    // Bounce worm backward
    this.wormX = Math.max(30, this.wormX - 55);
    if (wormEl) {
      wormEl.classList.add('worm-bonked');
      wormEl.style.left = `${this.wormX}px`;
    }
    if (wormFace) wormFace.textContent = '😵';
    if (wormThought) wormThought.textContent = 'BONK! Ouch! 💥';
    if (appleBubble) appleBubble.textContent = `Great block, Hailey! (${this.bumps}/5)`;

    // Update body segments: 20% per bump
    const pct = this.bumps * 20;
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

    // Spawn floating +20% badge
    this.spawnFloatingBadge(`💥 BONK! +20% RED! (${pct}%)`);

    // Check if 5 bumps reached (100% full red!)
    if (this.bumps >= this.targetBumps) {
      setTimeout(() => {
        this.handleVictory();
      }, 600);
      return;
    }

    // Resume crawling after 700ms and possibly switch lane
    setTimeout(() => {
      this.isBumping = false;
      if (wormEl) wormEl.classList.remove('worm-bonked');
      if (wormFace) wormFace.textContent = '🐛';
      if (wormThought) wormThought.textContent = 'Still hungry... 😋';
      
      // 50% chance to switch to adjacent lane
      if (Math.random() > 0.45) {
        const lanes = [0, 1, 2].filter(l => l !== this.wormLane);
        this.wormLane = lanes[Math.floor(Math.random() * lanes.length)];
      }
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
    cancelAnimationFrame(this.animId);
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
        <p>The hungry worm reached the apple. Place your wooden blocks faster in front of him!</p>
        <div class="win-buttons">
          <button class="btn-action btn-primary btn-retry-worm">Try Again 🔄</button>
        </div>
      </div>
    `;

    lawn.appendChild(retryModal);
    retryModal.querySelector('.btn-retry-worm').addEventListener('click', () => {
      retryModal.remove();
      this.render();
    });
  }

  handleVictory() {
    this.isAsleep = true;
    cancelAnimationFrame(this.animId);

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
    if (appleBubble) appleBubble.textContent = 'Hooray Hailey! You saved me! 🎉';

    stateManager.recordSkillProgress('cursor', { stars: 3 });

    const lawn = this.container.querySelector('#garden-lawn');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🍎✨</div>
        <h3>The Apple is Saved!</h3>
        <p>You bumped the worm 5 times and turned his whole body 100% red! He fell fast asleep!</p>
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
      this.render();
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('arcade');
    });
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
