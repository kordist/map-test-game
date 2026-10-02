/**
 * MAP Test Practice Simulator (NWEA MAP Growth Primary 1st Grade Format)
 * Faithfully simulates the real testing software UI, audio speaker buttons,
 * single click, double click, drag-and-drop, and scrollable passages.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export const PHONICS_WORD_FAMILIES = {
  '-ing': {
    family: '-ing',
    soundExample: 'ring',
    icon: '💍',
    words: [
      { label: 'Ring', emoji: '💍' },
      { label: 'King', emoji: '👑' },
      { label: 'Wing', emoji: '🪽' },
      { label: 'Sing', emoji: '🎤' },
      { label: 'Swing', emoji: '🛝' },
      { label: 'Spring', emoji: '🌸' }
    ],
    distractors: [
      { label: 'Cat', emoji: '🐱' },
      { label: 'Dog', emoji: '🐶' },
      { label: 'Sun', emoji: '☀️' },
      { label: 'Duck', emoji: '🦆' },
      { label: 'Bed', emoji: '🛏️' },
      { label: 'Cup', emoji: '☕' }
    ]
  },
  '-iss': {
    family: '-iss',
    soundExample: 'kiss',
    icon: '💋',
    words: [
      { label: 'Kiss', emoji: '💋' },
      { label: 'Miss', emoji: '🎯' },
      { label: 'Hiss', emoji: '🐍' },
      { label: 'Bliss', emoji: '😌' }
    ],
    distractors: [
      { label: 'Cat', emoji: '🐱' },
      { label: 'Fish', emoji: '🐟' },
      { label: 'Sun', emoji: '☀️' },
      { label: 'Frog', emoji: '🐸' },
      { label: 'Duck', emoji: '🦆' },
      { label: 'Fox', emoji: '🦊' }
    ]
  },
  '-in': {
    family: '-in',
    soundExample: 'pin',
    icon: '🧷',
    words: [
      { label: 'Pin', emoji: '🧷' },
      { label: 'Fin', emoji: '🦈' },
      { label: 'Spin', emoji: '🌀' },
      { label: 'Win', emoji: '🏆' },
      { label: 'Bin', emoji: '🗑️' },
      { label: 'Twin', emoji: '👯' }
    ],
    distractors: [
      { label: 'Cat', emoji: '🐱' },
      { label: 'Dog', emoji: '🐶' },
      { label: 'Sun', emoji: '☀️' },
      { label: 'Bed', emoji: '🛏️' },
      { label: 'Pig', emoji: '🐷' },
      { label: 'Car', emoji: '🚗' }
    ]
  },
  '-it': {
    family: '-it',
    soundExample: 'sit',
    icon: '🪑',
    words: [
      { label: 'Sit', emoji: '🪑' },
      { label: 'Hit', emoji: '🏏' },
      { label: 'Fit', emoji: '👟' },
      { label: 'Kit', emoji: '🧰' },
      { label: 'Pit', emoji: '🕳️' },
      { label: 'Lit', emoji: '💡' }
    ],
    distractors: [
      { label: 'Cat', emoji: '🐱' },
      { label: 'Dog', emoji: '🐶' },
      { label: 'Sun', emoji: '☀️' },
      { label: 'Duck', emoji: '🦆' },
      { label: 'Cup', emoji: '☕' },
      { label: 'Hat', emoji: '🎩' }
    ]
  }
};

export class MapTestSimulator {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.currentIndex = 0;
    this.userAnswers = {};
    this.isAudioPlaying = false;
    this.difficulty = stateManager.getDifficulty();
    this.currentPhonicsFamily = this.getDefaultFamilyForDiff(this.difficulty);

    this.questions = this.buildQuestionSet();

    this.onDifficultyChange = (e) => {
      const newLvl = e.detail?.difficulty || stateManager.getDifficulty();
      if (newLvl !== this.difficulty) {
        this.difficulty = newLvl;
        this.questions[0] = this.buildPhonicsQuestion(this.difficulty, this.currentPhonicsFamily);
        delete this.userAnswers[1];
        if (this.currentIndex === 0) {
          this.renderQuestionScreen();
        }
      }
    };
    window.addEventListener('difficultychange', this.onDifficultyChange);
  }

  getDefaultFamilyForDiff(lvl) {
    if (lvl === 1) return '-ing';
    if (lvl === 2) return '-in';
    return '-it';
  }

  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  buildPhonicsQuestion(difficulty, familyKey) {
    const key = (familyKey && PHONICS_WORD_FAMILIES[familyKey]) ? familyKey : this.getDefaultFamilyForDiff(difficulty);
    const family = PHONICS_WORD_FAMILIES[key];
    const count = Math.min(3, Math.max(1, difficulty));

    // Shuffle words and pick 'count' correct options
    const shuffledWords = this.shuffle(family.words);
    const correctItems = shuffledWords.slice(0, count).map((w, idx) => ({
      id: `opt_corr_${idx}`,
      label: w.label,
      emoji: w.emoji,
      correct: true,
      ending: family.family
    }));

    // Distractor count: Level 1 has 3 distractors (4 total), Level 2 has 4 distractors (6 total), Level 3 has 3 distractors (6 total)
    const distractorCount = count === 1 ? 3 : (count === 2 ? 4 : 3);
    const shuffledDistractors = this.shuffle(family.distractors);
    const distractorItems = shuffledDistractors.slice(0, distractorCount).map((d, idx) => ({
      id: `opt_dist_${idx}`,
      label: d.label,
      emoji: d.emoji,
      correct: false,
      ending: ''
    }));

    const allOptions = this.shuffle([...correctItems, ...distractorItems]);

    return {
      id: 1,
      subject: 'Reading / Phonics',
      skillType: 'audio-listen',
      phonicsChallenge: true,
      endingFamily: family.family,
      soundExample: family.soundExample,
      requiredCount: count,
      isMultiSelect: count > 1,
      spokenDirection: count === 1
        ? `Look at the pictures and words. Click on 1 word that ends with the '${family.family}' sound, like in the word ${family.soundExample}.`
        : `Look at the pictures and words. Click on the ${count} words that end with the '${family.family}' sound, like in the word ${family.soundExample}.`,
      promptText: count === 1
        ? `Click on 1 word that ends with '${family.family}'.`
        : `Click on the ${count} words that end with '${family.family}'.`,
      type: 'choice',
      options: allOptions
    };
  }

  buildQuestionSet() {
    return [
      this.buildPhonicsQuestion(this.difficulty, this.currentPhonicsFamily),
      {
        id: 2,
        subject: 'Math / Counting',
        skillType: 'drag-drop',
        spokenDirection: "Drag exactly five blue marbles into the box below.",
        promptText: "Drag 5 marbles into the box.",
        type: 'drag-count',
        targetCount: 5,
        availableCount: 8
      },
      {
        id: 3,
        subject: 'Math / Operations',
        skillType: 'single-click',
        spokenDirection: "Look at the domino. Count the dots. Four dots plus three dots equals how many in all?",
        promptText: "What is 4 + 3?",
        type: 'math-domino',
        diceA: 4,
        diceB: 3,
        options: [
          { id: 'opt1', label: '6', correct: false },
          { id: 'opt2', label: '7', correct: true },
          { id: 'opt3', label: '8', correct: false },
          { id: 'opt4', label: '5', correct: false }
        ]
      },
      {
        id: 4,
        subject: 'Reading Comprehension',
        skillType: 'scroll-passage',
        spokenDirection: "Scroll down to read the entire story. Then answer the question at the bottom.",
        promptText: "Where did Sammy the Squirrel hide his golden acorn?",
        type: 'scroll-story',
        storyTitle: 'Sammy the Squirrel',
        storyBody: [
          "Sammy is a busy brown squirrel who lives in an oak tree.",
          "One sunny morning, Sammy found a shiny golden acorn under a giant green leaf.",
          "He wanted to keep it safe for winter.",
          "👇 Scroll down to see where Sammy hid it! 👇",
          "Sammy dug a deep hole right beside the big mossy gray rock near the garden gate.",
          "He covered it with soft brown pine needles and did a happy squirrel dance!"
        ],
        options: [
          { id: 'opt1', label: 'Inside the birdhouse', correct: false },
          { id: 'opt2', label: 'Beside the big mossy gray rock', correct: true },
          { id: 'opt3', label: 'In the swimming pool', correct: false }
        ]
      },
      {
        id: 5,
        subject: 'Reading / Sight Words',
        skillType: 'double-click',
        spokenDirection: "Double-click on the sight word LIKE in the sentence below.",
        promptText: "Double-click the word 'LIKE' in the sentence.",
        type: 'double-click-word',
        sentence: ["I", "really", "LIKE", "to", "read", "books!"],
        targetWord: "LIKE"
      },
      {
        id: 6,
        subject: 'Math / Ordering',
        skillType: 'drag-drop',
        spokenDirection: "Drag the numbers to order them from smallest to greatest.",
        promptText: "Order from smallest to largest: 12, 28, 45, 89",
        type: 'drag-order',
        numbers: [45, 12, 89, 28],
        correctOrder: [12, 28, 45, 89]
      },
      {
        id: 7,
        subject: 'Listening & Geometry',
        skillType: 'audio-listen',
        spokenDirection: "Listen carefully: Click on the green triangle that is positioned below the yellow star.",
        promptText: "🎧 Listen to the speaker for directions!",
        type: 'choice',
        options: [
          { id: 'opt1', label: 'Green Triangle under Yellow Star', emoji: '⭐\n🔺', correct: true },
          { id: 'opt2', label: 'Red Circle under Yellow Star', emoji: '⭐\n🔴', correct: false },
          { id: 'opt3', label: 'Green Triangle under Purple Square', emoji: '🟪\n🔺', correct: false },
          { id: 'opt4', label: 'Blue Diamond under Yellow Star', emoji: '⭐\n🔷', correct: false }
        ]
      },
      {
        id: 8,
        subject: 'Reading / Scroll & Next',
        skillType: 'scroll-passage',
        spokenDirection: "Scroll all the way to the bottom of the page to find the green Submit button.",
        promptText: "Scroll down past the picture to finish your test!",
        type: 'scroll-finish',
        content: "You are almost done with your 1st Grade MAP Practice Exam! Great job reading and scrolling."
      }
    ];
  }

  render() {
    this.currentIndex = 0;
    this.userAnswers = {};
    this.difficulty = stateManager.getDifficulty();
    this.questions = this.buildQuestionSet();
    this.renderQuestionScreen();
  }

  renderQuestionScreen() {
    const q = this.questions[this.currentIndex];
    const totalQ = this.questions.length;
    const progressPct = Math.round(((this.currentIndex) / totalQ) * 100);

    this.container.innerHTML = `
      <div class="map-test-simulator-container animate-fade-in">
        <!-- NWEA MAP Style Blue Header Bar -->
        <header class="map-top-header">
          <div class="map-test-title">
            <span class="map-logo-dot"></span>
            <strong>MAP Growth Primary (K-2) Simulator</strong>
          </div>
          <div class="map-student-badge">
            Student: <strong>${stateManager.get().profile.name}</strong>
          </div>
          <div class="map-q-indicator">
            Question <strong>${this.currentIndex + 1}</strong> of <strong>${totalQ}</strong>
          </div>
        </header>

        <!-- Progress bar line -->
        <div class="map-progress-track">
          <div class="map-progress-fill" style="width: ${progressPct}%"></div>
        </div>

        <!-- Main Question Area -->
        <main class="map-main-stage" id="map-stage">
          <!-- Audio Speaker Control (Authentic MAP style) -->
          <div class="map-audio-bar">
            <button class="btn-map-speaker-big ${stateManager.get().settings.autoReadDirections ? 'speaking' : ''}" id="map-speaker-btn">
              <span class="speaker-icon">🔊</span>
              <span class="speaker-text" id="map-speaker-label">Click to hear question</span>
            </button>
            <span class="map-audio-help">Click speaker as many times as you need!</span>
          </div>

          <!-- Question Content Card -->
          <div class="map-question-body" id="map-question-body">
            <!-- Rendered dynamically -->
          </div>
        </main>

        <!-- Bottom Navigation Bar -->
        <footer class="map-bottom-footer">
          <button class="btn-map-nav btn-prev" id="map-prev-btn" ${this.currentIndex === 0 ? 'disabled' : ''}>
            ⬅️ Back
          </button>

          <div class="map-nav-instruction" id="map-nav-instruction">
            Choose an answer, then click Next ➔
          </div>

          <button class="btn-map-nav btn-next" id="map-next-btn" disabled>
            Next ➡️
          </button>
        </footer>
      </div>
    `;

    this.bindGlobalEvents();
    this.renderQuestionType(q);

    // Auto-read directions if enabled
    if (stateManager.get().settings.autoReadDirections) {
      setTimeout(() => {
        this.playAudioForCurrentQuestion();
      }, 350);
    }
  }

  bindGlobalEvents() {
    const speakerBtn = this.container.querySelector('#map-speaker-btn');
    speakerBtn.addEventListener('click', () => {
      this.playAudioForCurrentQuestion();
    });

    const prevBtn = this.container.querySelector('#map-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentIndex > 0) {
          soundManager.playClick();
          this.currentIndex--;
          this.renderQuestionScreen();
        }
      });
    }

    const nextBtn = this.container.querySelector('#map-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        soundManager.playClick();
        if (this.currentIndex < this.questions.length - 1) {
          this.currentIndex++;
          this.renderQuestionScreen();
        } else {
          this.finishTest();
        }
      });
    }
  }

  playAudioForCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    const speakerBtn = this.container.querySelector('#map-speaker-btn');
    const speakerLabel = this.container.querySelector('#map-speaker-label');

    if (speakerBtn) speakerBtn.classList.add('speaking');
    if (speakerLabel) speakerLabel.textContent = 'Speaking... 🎧';

    soundManager.speak(q.spokenDirection, {
      onEnd: () => {
        if (speakerBtn) speakerBtn.classList.remove('speaking');
        if (speakerLabel) speakerLabel.textContent = 'Click to hear again 🔊';
        stateManager.recordAudioListenedFull();
      }
    });
  }

  renderQuestionType(q) {
    const body = this.container.querySelector('#map-question-body');
    const nextBtn = this.container.querySelector('#map-next-btn');

    // TYPE 1: STANDARD MULTIPLE CHOICE / PHONICS
    if (q.type === 'choice') {
      const isMulti = q.isMultiSelect || (q.requiredCount && q.requiredCount > 1);
      const requiredCount = q.requiredCount || 1;

      let selectedIds = [];
      if (Array.isArray(this.userAnswers[q.id])) {
        selectedIds = this.userAnswers[q.id];
      } else if (this.userAnswers[q.id]) {
        selectedIds = [this.userAnswers[q.id]];
      }

      const getHint = (selCount) => {
        if (selCount === 0) {
          return requiredCount === 1
            ? `Click 1 word ending in <strong>${q.endingFamily || ''}</strong>`
            : `Click <strong>${requiredCount}</strong> words ending in <strong>${q.endingFamily || ''}</strong>`;
        }
        if (selCount < requiredCount) {
          const left = requiredCount - selCount;
          return `Nice! Pick <strong>${left} more</strong> word${left > 1 ? 's' : ''}`;
        }
        return `🎉 Perfect! Click <strong>Next ➡️</strong> to continue`;
      };

      body.innerHTML = `
        <div class="map-choice-view">
          ${q.phonicsChallenge ? `
            <div class="phonics-challenge-bar">
              <div class="phonics-family-chips">
                <span class="phonics-chip-label">Ending Sound:</span>
                ${Object.keys(PHONICS_WORD_FAMILIES).map(fKey => {
                  const fam = PHONICS_WORD_FAMILIES[fKey];
                  const isActive = fam.family === q.endingFamily;
                  return `
                    <button class="btn-phonics-pill ${isActive ? 'active' : ''}" data-family="${fam.family}">
                      ${fam.family} ${fam.icon}
                    </button>
                  `;
                }).join('')}
              </div>
              <div class="phonics-goal-badge">
                Level ${this.difficulty}: Select <strong>${requiredCount}</strong> word${requiredCount > 1 ? 's' : ''}
              </div>
            </div>
          ` : ''}

          <h3 class="map-prompt-text">${q.promptText}</h3>

          ${isMulti ? `
            <div class="multi-select-status" id="multi-select-status">
              <span class="status-counter-badge ${selectedIds.length === requiredCount ? 'complete' : ''}" id="status-counter-badge">
                Selected: <strong>${selectedIds.length}</strong> / <strong>${requiredCount}</strong>
              </span>
              <span class="status-hint-text" id="status-hint-text">
                ${getHint(selectedIds.length)}
              </span>
            </div>
          ` : ''}

          <div class="map-options-grid ${q.options.length > 4 ? 'grid-3-col' : ''}">
            ${q.options.map(opt => {
              const isSelected = selectedIds.includes(opt.id);
              return `
                <button class="map-option-card ${isSelected ? 'selected' : ''}" data-id="${opt.id}" data-correct="${opt.correct}">
                  <div class="opt-check-bubble ${isSelected ? 'checked' : ''}">
                    ${isSelected ? '✓' : ''}
                  </div>
                  <div class="opt-media">${opt.emoji}</div>
                  <div class="opt-label">${opt.label}</div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;

      // Phonics Family Pills click handler
      if (q.phonicsChallenge) {
        body.querySelectorAll('.btn-phonics-pill').forEach(pill => {
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetFamily = pill.dataset.family;
            if (targetFamily !== q.endingFamily) {
              soundManager.playPop(520);
              this.currentPhonicsFamily = targetFamily;
              this.questions[0] = this.buildPhonicsQuestion(this.difficulty, targetFamily);
              delete this.userAnswers[1];
              this.renderQuestionScreen();
            }
          });
        });
      }

      // Option cards click handlers
      const cards = body.querySelectorAll('.map-option-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const cardId = card.dataset.id;

          if (!isMulti) {
            // Single choice (Level 1)
            cards.forEach(c => {
              c.classList.remove('selected');
              const bubble = c.querySelector('.opt-check-bubble');
              if (bubble) {
                bubble.classList.remove('checked');
                bubble.textContent = '';
              }
            });
            card.classList.add('selected');
            const bubble = card.querySelector('.opt-check-bubble');
            if (bubble) {
              bubble.classList.add('checked');
              bubble.textContent = '✓';
            }
            soundManager.playPop(540);
            this.userAnswers[q.id] = [cardId];
            nextBtn.disabled = false;
            nextBtn.classList.add('animate-pulse-subtle');
            return;
          }

          // Multi-choice (Level 2 or 3)
          let currentList = Array.isArray(this.userAnswers[q.id]) ? [...this.userAnswers[q.id]] : [];
          const idx = currentList.indexOf(cardId);

          if (idx !== -1) {
            // Unselect card
            currentList.splice(idx, 1);
            card.classList.remove('selected');
            const bubble = card.querySelector('.opt-check-bubble');
            if (bubble) {
              bubble.classList.remove('checked');
              bubble.textContent = '';
            }
            soundManager.playClick();
          } else {
            // Trying to select card
            if (currentList.length < requiredCount) {
              currentList.push(cardId);
              card.classList.add('selected');
              const bubble = card.querySelector('.opt-check-bubble');
              if (bubble) {
                bubble.classList.add('checked');
                bubble.textContent = '✓';
              }
              soundManager.playPop(500 + currentList.length * 70);
            } else {
              // Already at max
              soundManager.playBoop?.() || soundManager.playPop(300);
              const badge = body.querySelector('#status-counter-badge');
              if (badge) {
                badge.classList.add('animate-shake');
                setTimeout(() => badge.classList.remove('animate-shake'), 400);
              }
              const hint = body.querySelector('#status-hint-text');
              if (hint) {
                hint.innerHTML = `⚠️ You chose ${requiredCount} words! Tap a chosen word to change it.`;
              }
              return;
            }
          }

          this.userAnswers[q.id] = currentList;

          // Update Counter and Hint
          const badge = body.querySelector('#status-counter-badge');
          const hint = body.querySelector('#status-hint-text');
          if (badge) {
            badge.innerHTML = `Selected: <strong>${currentList.length}</strong> / <strong>${requiredCount}</strong>`;
            badge.classList.toggle('complete', currentList.length === requiredCount);
          }
          if (hint) {
            hint.innerHTML = getHint(currentList.length);
          }

          // Update Next Button
          const isComplete = currentList.length === requiredCount;
          nextBtn.disabled = !isComplete;
          if (isComplete) {
            nextBtn.classList.add('animate-pulse-subtle');
          } else {
            nextBtn.classList.remove('animate-pulse-subtle');
          }
        });
      });

      // Restore Next button state if already completed
      const completed = selectedIds.length === requiredCount;
      nextBtn.disabled = !completed;
      if (completed) nextBtn.classList.add('animate-pulse-subtle');
    }

    // TYPE 2: DRAG AND COUNT INTO BOX (10-FRAME / BUCKET)
    else if (q.type === 'drag-count') {
      let placedCount = 0;
      body.innerHTML = `
        <div class="map-drag-count-view">
          <h3 class="map-prompt-text">${q.promptText}</h3>
          <div class="drag-count-stage">
            <div class="marble-source-box" id="marble-bank">
              ${Array.from({ length: q.availableCount }).map((_, i) => `
                <div class="draggable-item marble-item" draggable="true" data-id="marble-${i}">🔵</div>
              `).join('')}
            </div>

            <div class="drop-zone marble-target-basket" id="marble-basket">
              <div class="basket-title">Drop 5 Marbles Here</div>
              <div class="basket-contents" id="basket-contents"></div>
            </div>
          </div>
          <div class="counter-display">Marbles inside box: <strong id="marble-counter">0</strong> / ${q.targetCount}</div>
        </div>
      `;

      const basket = body.querySelector('#marble-basket');
      const contents = body.querySelector('#basket-contents');
      const counterEl = body.querySelector('#marble-counter');
      const marbles = body.querySelectorAll('.marble-item');

      marbles.forEach(m => {
        m.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', m.dataset.id);
        });

        // Click to place fallback
        m.addEventListener('click', () => {
          m.remove();
          placedCount++;
          contents.innerHTML += `<span class="placed-marble animate-pop-in">🔵</span>`;
          counterEl.textContent = placedCount;
          soundManager.playDrop();
          if (placedCount === q.targetCount) {
            this.userAnswers[q.id] = true;
            nextBtn.disabled = false;
            nextBtn.classList.add('animate-pulse-subtle');
            soundManager.playSparkle();
          }
        });
      });

      basket.addEventListener('dragover', (e) => e.preventDefault());
      basket.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const item = body.querySelector(`[data-id="${id}"]`);
        if (item) {
          item.remove();
          placedCount++;
          contents.innerHTML += `<span class="placed-marble animate-pop-in">🔵</span>`;
          counterEl.textContent = placedCount;
          soundManager.playDrop();
          if (placedCount === q.targetCount) {
            this.userAnswers[q.id] = true;
            nextBtn.disabled = false;
            nextBtn.classList.add('animate-pulse-subtle');
            soundManager.playSparkle();
          }
        }
      });
    }

    // TYPE 3: MATH DOMINO
    else if (q.type === 'math-domino') {
      body.innerHTML = `
        <div class="map-domino-view">
          <h3 class="map-prompt-text">${q.promptText}</h3>
          <div class="domino-card">
            <div class="domino-half domino-left">
              ${Array.from({ length: q.diceA }).map(() => `<span class="domino-dot"></span>`).join('')}
            </div>
            <div class="domino-divider"></div>
            <div class="domino-half domino-right">
              ${Array.from({ length: q.diceB }).map(() => `<span class="domino-dot"></span>`).join('')}
            </div>
          </div>
          <div class="map-options-row">
            ${q.options.map(opt => `
              <button class="map-option-card opt-num ${this.userAnswers[q.id] === opt.id ? 'selected' : ''}" data-id="${opt.id}">
                ${opt.label}
              </button>
            `).join('')}
          </div>
        </div>
      `;

      body.querySelectorAll('.map-option-card').forEach(card => {
        card.addEventListener('click', () => {
          body.querySelectorAll('.map-option-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          soundManager.playPop(520);
          this.userAnswers[q.id] = card.dataset.id;
          nextBtn.disabled = false;
        });
      });
    }

    // TYPE 4: SCROLLABLE STORY PASSAGE
    else if (q.type === 'scroll-story') {
      body.innerHTML = `
        <div class="map-story-split-view">
          <div class="map-scroll-pane" id="map-story-scroll">
            <div class="scroll-tag-banner">📜 Scroll down to read the full story ⬇️</div>
            <h4 class="story-heading">${q.storyTitle}</h4>
            ${q.storyBody.map(p => `<p class="story-line">${p}</p>`).join('')}
            <div class="story-flower-art">🐿️ 🌰 🌿 🪨</div>
          </div>
          <div class="map-questions-pane">
            <h3 class="map-prompt-text">${q.promptText}</h3>
            <div class="map-options-vertical">
              ${q.options.map(opt => `
                <button class="map-option-card opt-full ${this.userAnswers[q.id] === opt.id ? 'selected' : ''}" data-id="${opt.id}">
                  <span class="opt-bullet">🔘</span> ${opt.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      const scrollPane = body.querySelector('#map-story-scroll');
      scrollPane.addEventListener('scroll', () => {
        stateManager.recordScrollPassage();
      });

      body.querySelectorAll('.map-option-card').forEach(card => {
        card.addEventListener('click', () => {
          body.querySelectorAll('.map-option-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          soundManager.playPop(520);
          this.userAnswers[q.id] = card.dataset.id;
          nextBtn.disabled = false;
        });
      });
    }

    // TYPE 5: DOUBLE CLICK SIGHT WORD
    else if (q.type === 'double-click-word') {
      body.innerHTML = `
        <div class="map-double-click-view">
          <h3 class="map-prompt-text">${q.promptText}</h3>
          <div class="sight-word-sentence" id="sight-sentence">
            ${q.sentence.map(w => `<span class="word-token" data-word="${w}">${w}</span>`).join(' ')}
          </div>
          <div class="word-selection-feedback" id="word-feedback">Double-click with two quick taps on the word "LIKE".</div>
        </div>
      `;

      const tokens = body.querySelectorAll('.word-token');
      const feedback = body.querySelector('#word-feedback');

      tokens.forEach(tok => {
        tok.addEventListener('dblclick', () => {
          const word = tok.dataset.word;
          if (word === q.targetWord) {
            tok.classList.add('word-highlighted');
            soundManager.playDoubleClickSuccess();
            feedback.innerHTML = '🎉 Excellent double-click! Sight word <strong>LIKE</strong> highlighted!';
            this.userAnswers[q.id] = true;
            stateManager.recordDoubleClickAttempt(true, 320);
            nextBtn.disabled = false;
          } else {
            soundManager.playGentleOof();
            tok.classList.add('word-wrong');
            feedback.innerHTML = `You double clicked '${word}'. Try double clicking on the word LIKE!`;
            setTimeout(() => tok.classList.remove('word-wrong'), 500);
          }
        });
      });
    }

    // TYPE 6: DRAG TO ORDER NUMBERS
    else if (q.type === 'drag-order') {
      let placedNumbers = [];
      body.innerHTML = `
        <div class="map-order-view">
          <h3 class="map-prompt-text">${q.promptText}</h3>
          <div class="number-order-stage">
            <div class="number-source-row" id="num-source">
              ${q.numbers.map(num => `
                <div class="draggable-item number-card" draggable="true" data-num="${num}">
                  ${num}
                </div>
              `).join('')}
            </div>

            <div class="number-slots-row" id="num-slots">
              <div class="drop-zone order-slot" data-index="0"><span class="slot-idx">1st (Smallest)</span></div>
              <div class="drop-zone order-slot" data-index="1"><span class="slot-idx">2nd</span></div>
              <div class="drop-zone order-slot" data-index="2"><span class="slot-idx">3rd</span></div>
              <div class="drop-zone order-slot" data-index="3"><span class="slot-idx">4th (Largest)</span></div>
            </div>
          </div>
        </div>
      `;

      const cards = body.querySelectorAll('.number-card');
      const slots = body.querySelectorAll('.order-slot');

      cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', card.dataset.num);
        });

        // Click-to-place fallback
        card.addEventListener('click', () => {
          const emptySlot = Array.from(slots).find(s => !s.classList.contains('filled'));
          if (emptySlot) {
            const num = parseInt(card.dataset.num, 10);
            emptySlot.classList.add('filled');
            emptySlot.innerHTML = `<span class="placed-num animate-pop-in">${num}</span>`;
            card.remove();
            soundManager.playDrop();
            placedNumbers.push(num);
            if (placedNumbers.length === 4) {
              this.userAnswers[q.id] = placedNumbers.join(',') === q.correctOrder.join(',');
              nextBtn.disabled = false;
            }
          }
        });
      });

      slots.forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          const numStr = e.dataTransfer.getData('text/plain');
          const card = body.querySelector(`[data-num="${numStr}"]`);
          if (card && !slot.classList.contains('filled')) {
            const num = parseInt(numStr, 10);
            slot.classList.add('filled');
            slot.innerHTML = `<span class="placed-num animate-pop-in">${num}</span>`;
            card.remove();
            soundManager.playDrop();
            placedNumbers.push(num);
            if (placedNumbers.length === 4) {
              this.userAnswers[q.id] = placedNumbers.join(',') === q.correctOrder.join(',');
              nextBtn.disabled = false;
            }
          }
        });
      });
    }

    // TYPE 8: SCROLL TO FINISH
    else if (q.type === 'scroll-finish') {
      body.innerHTML = `
        <div class="map-scroll-finish-view" id="finish-scroll-pane">
          <div class="scroll-intro-card">
            <h3>🎉 You have arrived at the final question!</h3>
            <p>Standardized tests sometimes place the submit button below the visible screen.</p>
            <div class="scroll-arrow-pulsing">⬇️ SCROLL DOWN TO THE BOTTOM ⬇️</div>
          </div>
          <div class="tall-filler-section">
            <div class="mascot-cheer">🌟 ${stateManager.get().profile.name || 'Hero'}, You Are a 1st Grade Computer Hero! 🌟</div>
            <div class="art-parade">🚀 🐱 🎈 🎧 📜 🐣 🏆 🦄</div>
            <div class="art-note">Keep scrolling to reach the green completion button!</div>
          </div>
          <div class="bottom-submit-zone">
            <button class="btn-finish-test-big" id="btn-finish-test">
              ✅ SUBMIT MAP PRACTICE TEST
            </button>
          </div>
        </div>
      `;

      const finishPane = body.querySelector('#finish-scroll-pane');
      const submitBtn = body.querySelector('#btn-finish-test');

      finishPane.addEventListener('scroll', () => {
        if (finishPane.scrollTop > 200) {
          submitBtn.classList.add('glowing');
        }
      });

      submitBtn.addEventListener('click', () => {
        soundManager.playSparkle();
        this.finishTest();
      });
    }
  }

  finishTest() {
    soundManager.playFanfare();
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 }
    });

    // Compute score
    let correctCount = 0;
    this.questions.forEach(q => {
      const ans = this.userAnswers[q.id];
      if (q.type === 'choice' && ans) {
        if (q.isMultiSelect || Array.isArray(ans)) {
          const selected = Array.isArray(ans) ? ans : [ans];
          const correctIds = q.options.filter(o => o.correct).map(o => o.id);
          const isCorrect = selected.length === correctIds.length &&
            selected.every(id => correctIds.includes(id));
          if (isCorrect) correctCount++;
        } else {
          const opt = q.options.find(o => o.id === ans);
          if (opt && opt.correct) correctCount++;
        }
      } else if (q.type === 'drag-count' && ans === true) {
        correctCount++;
      } else if (q.type === 'math-domino' && ans) {
        const opt = q.options.find(o => o.id === ans);
        if (opt && opt.correct) correctCount++;
      } else if (q.type === 'scroll-story' && ans) {
        const opt = q.options.find(o => o.id === ans);
        if (opt && opt.correct) correctCount++;
      } else if (q.type === 'double-click-word' && ans === true) {
        correctCount++;
      } else if (q.type === 'drag-order' && ans === true) {
        correctCount++;
      } else if (q.type === 'scroll-finish') {
        correctCount++;
      }
    });

    const result = stateManager.recordTestResult({
      score: correctCount,
      total: this.questions.length,
      skillBreakdown: {
        mouseAccuracy: 100,
        doubleClickReady: true,
        dragDropReady: true,
        scrollReady: true,
        listeningReady: true
      }
    });

    this.container.innerHTML = `
      <div class="map-results-screen animate-fade-in">
        <div class="results-card">
          <div class="results-trophy">🏆</div>
          <h2 class="results-title">MAP Practice Exam Complete!</h2>
          <p class="results-student">Great job, <strong>${stateManager.get().profile.name}</strong>!</p>

          <div class="results-score-circle">
            <div class="score-number">${correctCount} / ${this.questions.length}</div>
            <div class="score-label">Questions Correct</div>
          </div>

          <div class="results-skill-checklist">
            <h4>🌟 Computer Skills Mastered:</h4>
            <div class="skill-check-item">✅ <strong>Moving Cursor:</strong> Smooth navigation</div>
            <div class="skill-check-item">✅ <strong>Click & Double-Click:</strong> Timed taps & selection</div>
            <div class="skill-check-item">✅ <strong>Drag & Drop:</strong> Moved items into answer boxes</div>
            <div class="skill-check-item">✅ <strong>Vertical Scrolling:</strong> Read full story passages</div>
            <div class="skill-check-item">✅ <strong>Audio Listening:</strong> Headphone patience</div>
          </div>

          <div class="results-action-row">
            <button class="btn-action btn-print-cert" id="btn-view-certificate">
              🏅 View & Print Certificate
            </button>
            <button class="btn-action btn-primary" id="btn-retake-test">
              🔄 Retake Practice Test
            </button>
            <button class="btn-action btn-secondary" id="btn-back-arcade">
              🎮 Back to Mission Arcade
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-view-certificate').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('stickers');
    });

    this.container.querySelector('#btn-retake-test').addEventListener('click', () => {
      this.render();
    });

    this.container.querySelector('#btn-back-arcade').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('arcade');
    });
  }

  destroy() {
    soundManager.stopSpeech();
    if (this.onDifficultyChange) {
      window.removeEventListener('difficultychange', this.onDifficultyChange);
    }
  }
}
