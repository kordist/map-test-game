/**
 * Mission 5: Super Listener (Headphone & Audio Patience)
 * Trains: Listening to audible directions in headphones in its ENTIRETY,
 * waiting for audio before clicking, and using the Speaker button to replay.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class ListenGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.questionIndex = 0;
    this.isAudioPlaying = false;
    this.score = 0;
    this.questions = [
      {
        id: 1,
        audioText: "Listen carefully. Click on the yellow duck that is wearing a green party hat.",
        promptText: "🎧 Listen to the direction in your headphones!",
        choices: [
          { id: 'c1', emoji: '🦆🎩', label: 'Yellow Duck with Blue Hat', correct: false },
          { id: 'c2', emoji: '🦆🎉', label: 'Yellow Duck with Green Hat', correct: true },
          { id: 'c3', emoji: '🐥👑', label: 'Baby Chick with Gold Crown', correct: false },
          { id: 'c4', emoji: '🦆🕶️', label: 'Duck with Sunglasses', correct: false }
        ]
      },
      {
        id: 2,
        audioText: "Listen all the way to the end. Find the tree that has three red apples on it.",
        promptText: "🎧 Listen to the full direction!",
        choices: [
          { id: 'c1', emoji: '🌳🍎', label: 'Tree with 1 Apple', correct: false },
          { id: 'c2', emoji: '🌳🍎🍎', label: 'Tree with 2 Apples', correct: false },
          { id: 'c3', emoji: '🌳🍎🍎🍎', label: 'Tree with 3 Apples', correct: true },
          { id: 'c4', emoji: '🌲🍎🍎🍎🍎', label: 'Pine Tree with 4 Apples', correct: false }
        ]
      },
      {
        id: 3,
        audioText: "Listen closely. Click on the shape that is a purple star inside a blue circle.",
        promptText: "🎧 Keep your headphones on and listen!",
        choices: [
          { id: 'c1', emoji: '🔵⭐', label: 'Purple Star inside Blue Circle', correct: true },
          { id: 'c2', emoji: '🔴⭐', label: 'Yellow Star inside Red Circle', correct: false },
          { id: 'c3', emoji: '🔵🔺', label: 'Pink Triangle in Blue Circle', correct: false },
          { id: 'c4', emoji: '🟣⭐', label: 'Yellow Star in Purple Circle', correct: false }
        ]
      },
      {
        id: 4,
        audioText: "Listen to the whole question. Which animal has black and white stripes and eats grass in the savanna?",
        promptText: "🎧 Listen carefully to all clues!",
        choices: [
          { id: 'c1', emoji: '🦁', label: 'Lion', correct: false },
          { id: 'c2', emoji: '🦓', label: 'Zebra', correct: true },
          { id: 'c3', emoji: '🦒', label: 'Giraffe', correct: false },
          { id: 'c4', emoji: '🐼', label: 'Panda', correct: false }
        ]
      }
    ];
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper listen-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">🎧 Mission 5: Super Listener</div>
          <h2 class="game-title" id="listen-game-title">Headphone Detective!</h2>
          <p class="game-desc">Listen to the spoken directions all the way to the end before choosing your answer.</p>
          <div class="game-stats">
            <div class="stat-pill"><span class="stat-icon">🎧</span> Question <span id="listen-q-num">1</span> / ${this.questions.length}</div>
          </div>
        </div>

        <!-- Animated Audio Status Bar with Soundwaves -->
        <div class="audio-listening-panel" id="audio-panel">
          <div class="headphone-mascot">
            <div class="mascot-emoji">🎧🐱</div>
            <div class="sound-wave-bars" id="sound-wave-bars">
              <div class="wave-bar bar-1"></div>
              <div class="wave-bar bar-2"></div>
              <div class="wave-bar bar-3"></div>
              <div class="wave-bar bar-4"></div>
              <div class="wave-bar bar-5"></div>
            </div>
          </div>

          <div class="audio-control-box">
            <button class="btn-big-speaker animate-pulse-subtle" id="listen-play-btn">
              <span class="speaker-icon">🔊</span>
              <span class="speaker-text" id="speaker-btn-label">Click to Listen</span>
            </button>
            <div class="audio-status-tag" id="audio-status-tag">🎧 Click the speaker to start listening!</div>
          </div>
        </div>

        <div class="game-arena listen-arena" id="listen-arena">
          <!-- Question choices -->
        </div>

        <div class="game-footer">
          <div class="helper-hint">💡 <strong>MAP Test Secret:</strong> Always wait until the computer voice stops talking before clicking your answer!</div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.loadQuestion(0);
  }

  bindEvents() {
    const playBtn = this.container.querySelector('#listen-play-btn');
    playBtn.addEventListener('click', () => {
      this.playCurrentAudio();
    });
  }

  loadQuestion(index) {
    this.questionIndex = index;
    const q = this.questions[index];
    const qNumEl = this.container.querySelector('#listen-q-num');
    if (qNumEl) qNumEl.textContent = index + 1;

    const arena = this.container.querySelector('#listen-arena');
    arena.innerHTML = `
      <div class="listen-choices-grid choices-locked" id="choices-grid">
        ${q.choices.map(c => `
          <button class="listen-choice-card" data-id="${c.id}" data-correct="${c.correct}">
            <div class="choice-emoji">${c.emoji}</div>
            <div class="choice-label">${c.label}</div>
          </button>
        `).join('')}
      </div>
      <div class="lock-notice" id="lock-notice">
        🔒 <em>Listening to directions... choices unlock when voice finishes!</em>
      </div>
    `;

    this.setupChoiceEvents(arena);
    // Automatically play audio when question loads
    setTimeout(() => {
      this.playCurrentAudio();
    }, 400);
  }

  playCurrentAudio() {
    const q = this.questions[this.questionIndex];
    const waveBars = this.container.querySelector('#sound-wave-bars');
    const statusTag = this.container.querySelector('#audio-status-tag');
    const btnLabel = this.container.querySelector('#speaker-btn-label');
    const choicesGrid = this.container.querySelector('#choices-grid');
    const lockNotice = this.container.querySelector('#lock-notice');

    this.isAudioPlaying = true;
    if (waveBars) waveBars.classList.add('playing');
    if (statusTag) {
      statusTag.textContent = '🔊 Speaking... Listen to the entire sentence!';
      statusTag.className = 'audio-status-tag listening-active';
    }
    if (btnLabel) btnLabel.textContent = 'Listening...';
    if (choicesGrid) choicesGrid.classList.add('choices-locked');
    if (lockNotice) lockNotice.style.display = 'block';

    soundManager.speak(q.audioText, {
      onEnd: () => {
        this.isAudioPlaying = false;
        if (waveBars) waveBars.classList.remove('playing');
        if (statusTag) {
          statusTag.textContent = '✨ Voice finished! Now choose your answer below.';
          statusTag.className = 'audio-status-tag listening-ready';
        }
        if (btnLabel) btnLabel.textContent = 'Hear Again 🔊';
        if (choicesGrid) choicesGrid.classList.remove('choices-locked');
        if (lockNotice) lockNotice.style.display = 'none';
        stateManager.recordAudioListenedFull();
      }
    });
  }

  setupChoiceEvents(arena) {
    const choices = arena.querySelectorAll('.listen-choice-card');
    const statusTag = this.container.querySelector('#audio-status-tag');

    choices.forEach(card => {
      card.addEventListener('click', () => {
        if (this.isAudioPlaying) {
          soundManager.playGentleOof();
          if (statusTag) {
            statusTag.textContent = '⚠️ Wait for the voice to finish talking first! 🎧';
            statusTag.className = 'audio-status-tag listening-warning';
          }
          return;
        }

        const isCorrect = card.dataset.correct === 'true';
        if (isCorrect) {
          card.classList.add('correct');
          soundManager.playChimeSuccess();
          soundManager.playSparkle();
          this.score++;

          setTimeout(() => {
            if (this.questionIndex < this.questions.length - 1) {
              this.loadQuestion(this.questionIndex + 1);
            } else {
              this.handleSuccess('You have outstanding listening patience!');
            }
          }, 900);
        } else {
          card.classList.add('incorrect');
          soundManager.playGentleOof();
          if (statusTag) {
            statusTag.textContent = '💡 Click the 🔊 speaker button above to listen again!';
          }
          setTimeout(() => card.classList.remove('incorrect'), 600);
        }
      });
    });
  }

  handleSuccess(customMsg) {
    soundManager.playFanfare();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 }
    });

    stateManager.recordSkillProgress('listen', { stars: 3 });

    const arena = this.container.querySelector('#listen-arena');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🎧</div>
        <h3>Super Listener Master!</h3>
        <p>${customMsg}</p>
        <div class="win-stars">+3 Stars Earned! ⭐⭐⭐</div>
        <div class="win-buttons">
          <button class="btn-action btn-play-again">Practice Again</button>
          <button class="btn-action btn-primary btn-next-mission">Take MAP Practice Exam 📝</button>
        </div>
      </div>
    `;

    arena.appendChild(winModal);

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.score = 0;
      this.loadQuestion(0);
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('simulator');
    });
  }

  destroy() {
    soundManager.stopSpeech();
  }
}
