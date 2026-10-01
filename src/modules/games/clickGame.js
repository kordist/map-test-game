/**
 * Mission 2: Click & Double-Click Champion
 * Trains: Single clicking vs Double clicking, double-click timing rhythm, trackpad tapping.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class ClickGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.subGame = 'eggs'; // 'bubbles' | 'eggs' | 'chests'
    this.score = 0;
    this.targetScore = 4;
    this.lastClickTime = 0;
    this.clickTimer = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper click-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">⚡ Mission 2: Click & Double-Click</div>
          <h2 class="game-title" id="click-game-title">Crack the Dragon Eggs!</h2>
          <p class="game-desc" id="click-game-desc">Double-click quickly (click-click!) to hatch the magical baby dragons.</p>
          <div class="game-stats">
            <div class="stat-pill"><span class="stat-icon">🐣</span> <span id="click-score">0</span> / ${this.targetScore}</div>
            <div class="submode-toggles">
              <button class="btn-submode ${this.subGame === 'eggs' ? 'active' : ''}" data-sub="eggs">🥚 Double-Click Eggs</button>
              <button class="btn-submode ${this.subGame === 'bubbles' ? 'active' : ''}" data-sub="bubbles">🎈 Single-Click Balloons</button>
              <button class="btn-submode ${this.subGame === 'chests' ? 'active' : ''}" data-sub="chests">🗝️ Treasure Vault</button>
            </div>
          </div>
        </div>

        <!-- Double click timing visual coach -->
        <div class="click-coach-meter" id="click-coach-meter">
          <div class="coach-label">Double-Click Coach:</div>
          <div class="coach-indicator" id="coach-indicator">
            <span class="click-dot dot-1" id="dot-1">Click 1</span>
            <span class="coach-arrow">➔</span>
            <span class="click-dot dot-2" id="dot-2">Click 2</span>
          </div>
          <div class="coach-feedback" id="coach-feedback">Try double-clicking an egg! Tap twice quickly.</div>
        </div>

        <div class="game-arena click-arena" id="click-arena">
          <!-- Subgame elements -->
        </div>

        <div class="game-footer">
          <button class="btn-sound-instruction" id="click-speak-btn">
            <span class="icon-speaker">🔊</span> Hear Directions
          </button>
          <div class="helper-hint">💡 <strong>Coach Tip:</strong> Double-clicking means two quick taps without moving your finger in between!</div>
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

    const speakBtn = this.container.querySelector('#click-speak-btn');
    speakBtn.addEventListener('click', () => {
      let msg = '';
      if (this.subGame === 'eggs') {
        msg = "Double-click each egg quickly by tapping twice to hatch the baby creatures!";
      } else if (this.subGame === 'bubbles') {
        msg = "Single click each colorful balloon with one tap to pop it!";
      } else {
        msg = "Double-click the golden chests to unlock the secret keys!";
      }
      soundManager.speak(msg);
    });
  }

  startSubGame(sub) {
    this.subGame = sub;
    this.score = 0;
    const titleEl = this.container.querySelector('#click-game-title');
    const descEl = this.container.querySelector('#click-game-desc');
    const scoreEl = this.container.querySelector('#click-score');
    const coach = this.container.querySelector('#click-coach-meter');
    const arena = this.container.querySelector('#click-arena');

    this.container.querySelectorAll('.btn-submode').forEach(b => {
      b.classList.toggle('active', b.dataset.sub === sub);
    });

    if (sub === 'eggs') {
      titleEl.textContent = 'Crack the Magic Eggs!';
      descEl.textContent = 'Double-click each egg quickly (tap-tap!) to hatch the baby dragons.';
      coach.style.display = 'flex';
      this.targetScore = 4;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initEggCracker(arena);
    } else if (sub === 'bubbles') {
      titleEl.textContent = 'Pop the Number Balloons!';
      descEl.textContent = 'Single click (one tap) on each balloon in order from 1 to 6.';
      coach.style.display = 'none';
      this.targetScore = 6;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initBalloons(arena);
    } else if (sub === 'chests') {
      titleEl.textContent = 'Unlock the Treasure Vault!';
      descEl.textContent = 'Double-click each treasure chest to reveal the secret gems.';
      coach.style.display = 'flex';
      this.targetScore = 3;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initChests(arena);
    }
  }

  // SUBGAME 1: DOUBLE CLICK EGGS
  initEggCracker(arena) {
    const eggThemes = [
      { id: 1, color: '#F87171', name: 'Ruby Dragon', creature: '🐲', pattern: 'dots' },
      { id: 2, color: '#60A5FA', name: 'Sapphire Bird', creature: '🦜', pattern: 'stripes' },
      { id: 3, color: '#34D399', name: 'Emerald Turtle', creature: '🐢', pattern: 'zigzag' },
      { id: 4, color: '#FBBF24', name: 'Golden Phoenix', creature: '🦅', pattern: 'stars' }
    ];

    arena.innerHTML = `
      <div class="egg-grid">
        ${eggThemes.map(e => `
          <div class="egg-card" id="egg-${e.id}" data-id="${e.id}" data-creature="${e.creature}" data-name="${e.name}">
            <div class="egg-container">
              <div class="magic-egg" style="--egg-color: ${e.color}">
                <div class="egg-shell-top"></div>
                <div class="egg-shell-bottom"></div>
                <div class="egg-crack-line"></div>
                <div class="egg-creature">${e.creature}</div>
              </div>
            </div>
            <div class="egg-label">Double-Click Me!</div>
          </div>
        `).join('')}
      </div>
    `;

    const settings = stateManager.get().settings;
    const windowMs = settings.doubleClickWindowMs || 600;

    const cards = arena.querySelectorAll('.egg-card');
    cards.forEach(card => {
      let clickCount = 0;
      let timer = null;
      let firstClickTime = 0;

      card.addEventListener('click', (e) => {
        const now = Date.now();
        clickCount++;

        const dot1 = this.container.querySelector('#dot-1');
        const dot2 = this.container.querySelector('#dot-2');
        const feedback = this.container.querySelector('#coach-feedback');

        if (clickCount === 1) {
          firstClickTime = now;
          soundManager.playClick();
          card.classList.add('click-one');
          dot1.classList.add('active');
          dot2.classList.remove('active');
          feedback.textContent = 'Click 1 recorded! Tap again fast!';
          feedback.className = 'coach-feedback feedback-waiting';

          timer = setTimeout(() => {
            // Timed out for double click
            clickCount = 0;
            card.classList.remove('click-one');
            dot1.classList.remove('active');
            feedback.textContent = 'Too slow! Try clicking twice quickly: tap-tap!';
            feedback.className = 'coach-feedback feedback-slow';
            stateManager.recordDoubleClickAttempt(false);
          }, windowMs);

        } else if (clickCount === 2) {
          clearTimeout(timer);
          clickCount = 0;
          const delta = now - firstClickTime;
          dot2.classList.add('active');

          if (delta <= windowMs) {
            // SUCCESSFUL DOUBLE CLICK!
            stateManager.recordDoubleClickAttempt(true, delta);
            feedback.textContent = `🎉 Super fast double-click! (${delta}ms)`;
            feedback.className = 'coach-feedback feedback-success';

            if (!card.classList.contains('hatched')) {
              card.classList.remove('click-one');
              card.classList.add('hatched');
              soundManager.playCrack();
              setTimeout(() => {
                soundManager.playDoubleClickSuccess();
                confetti({
                  particleCount: 40,
                  origin: {
                    x: (card.getBoundingClientRect().left + card.offsetWidth / 2) / window.innerWidth,
                    y: (card.getBoundingClientRect().top + card.offsetHeight / 2) / window.innerHeight
                  }
                });
              }, 120);

              const creatureName = card.dataset.name;
              card.querySelector('.egg-label').innerHTML = `<strong>${creatureName}</strong> hatched!`;

              this.score++;
              const scoreEl = this.container.querySelector('#click-score');
              if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;

              if (this.score >= this.targetScore) {
                setTimeout(() => {
                  this.handleSuccess('You mastered double-clicking! Baby dragons are safe!');
                }, 600);
              }
            }
          }
        }
      });
    });
  }

  // SUBGAME 2: BALLOONS (Single Click)
  initBalloons(arena) {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const positions = [
      { top: '16%', left: '8%' },
      { top: '55%', left: '22%' },
      { top: '15%', left: '42%' },
      { top: '58%', left: '58%' },
      { top: '18%', left: '76%' },
      { top: '54%', left: '88%' }
    ];

    arena.innerHTML = `
      <div class="balloon-arena" id="balloon-arena">
        ${[1, 2, 3, 4, 5, 6].map((num, i) => `
          <div class="balloon-item animate-float-slow" data-num="${num}" style="--balloon-color: ${colors[num-1]}; position: absolute; top: ${positions[i].top}; left: ${positions[i].left};">
            <div class="balloon-body">
              <span class="balloon-num">${num}</span>
            </div>
            <div class="balloon-string"></div>
          </div>
        `).join('')}
      </div>
    `;

    let currentTarget = 1;
    const arenaEl = arena.querySelector('#balloon-arena');
    const balloons = arenaEl.querySelectorAll('.balloon-item');

    balloons.forEach(balloon => {
      balloon.addEventListener('click', () => {
        const num = parseInt(balloon.dataset.num, 10);
        if (num === currentTarget) {
          soundManager.playPop(450 + num * 60);
          balloon.classList.add('popped');
          currentTarget++;
          this.score++;
          const scoreEl = this.container.querySelector('#click-score');
          if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;

          if (this.score >= this.targetScore) {
            setTimeout(() => {
              this.handleSuccess('Perfect single clicking accuracy!');
            }, 400);
          }
        } else if (num > currentTarget) {
          soundManager.playGentleOof();
          balloon.classList.add('shake');
          setTimeout(() => balloon.classList.remove('shake'), 400);
          soundManager.speak(`Find number ${currentTarget} first!`);
        }
      });
    });
  }

  // SUBGAME 3: TREASURE CHESTS (Double Click)
  initChests(arena) {
    arena.innerHTML = `
      <div class="chest-grid">
        ${[1, 2, 3].map(i => `
          <div class="chest-card" data-id="${i}">
            <div class="chest-box">
              <div class="chest-lid">🗝️</div>
              <div class="chest-bottom">📦</div>
              <div class="chest-loot">💎</div>
            </div>
            <div class="chest-title">Secret Chest #${i}</div>
            <div class="chest-sub">Double-click to open</div>
          </div>
        `).join('')}
      </div>
    `;

    const chests = arena.querySelectorAll('.chest-card');
    chests.forEach(chest => {
      chest.addEventListener('dblclick', () => {
        if (!chest.classList.contains('opened')) {
          chest.classList.add('opened');
          soundManager.playCrack();
          soundManager.playSparkle();
          chest.querySelector('.chest-sub').textContent = '✨ UNLOCKED! ✨';
          this.score++;
          const scoreEl = this.container.querySelector('#click-score');
          if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;
          stateManager.recordDoubleClickAttempt(true, 300);

          if (this.score >= this.targetScore) {
            setTimeout(() => {
              this.handleSuccess('You opened all secret vaults with double-click!');
            }, 600);
          }
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

    stateManager.recordSkillProgress('click', { stars: 3 });

    const arena = this.container.querySelector('#click-arena');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🐣</div>
        <h3>Double-Click Master!</h3>
        <p>${customMsg}</p>
        <div class="win-stars">+3 Stars Earned! ⭐⭐⭐</div>
        <div class="win-buttons">
          <button class="btn-action btn-play-again">Practice Again</button>
          <button class="btn-action btn-primary btn-next-mission">Next Mission: Drag & Drop ➡️</button>
        </div>
      </div>
    `;

    arena.appendChild(winModal);

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.startSubGame(this.subGame);
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('drag');
    });
  }

  destroy() {
    if (this.clickTimer) clearTimeout(this.clickTimer);
  }
}
