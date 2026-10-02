/**
 * Mission 3: Drag & Drop Wizard
 * Trains: Selecting answers by drag-and-drop and clicking, 10-frames, phonics spelling, sorting.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export const WORD_BUILDER_WORDS = [
  {
    id: 'cat',
    word: 'CAT',
    emoji: '🐱',
    clue: 'Picture: <strong>C A T</strong>',
    hint: 'Meow! A furry feline friend!',
    distractors: ['M', 'B', 'S', 'P']
  },
  {
    id: 'dog',
    word: 'DOG',
    emoji: '🐶',
    clue: 'Picture: <strong>D O G</strong>',
    hint: 'Woof! A loyal wagging friend!',
    distractors: ['B', 'T', 'P', 'S']
  },
  {
    id: 'fish',
    word: 'FISH',
    emoji: '🐟',
    clue: 'Picture: <strong>F I S H</strong>',
    hint: 'Splash! Swims in the water with gills!',
    distractors: ['T', 'B', 'M', 'R']
  },
  {
    id: 'duck',
    word: 'DUCK',
    emoji: '🦆',
    clue: 'Picture: <strong>D U C K</strong>',
    hint: 'Quack! Swims in the pond with webbed feet!',
    distractors: ['P', 'B', 'S', 'T']
  },
  {
    id: 'frog',
    word: 'FROG',
    emoji: '🐸',
    clue: 'Picture: <strong>F R O G</strong>',
    hint: 'Ribbit! Jumps from green lily pads!',
    distractors: ['M', 'B', 'T', 'S']
  },
  {
    id: 'star',
    word: 'STAR',
    emoji: '⭐',
    clue: 'Picture: <strong>S T A R</strong>',
    hint: 'Twinkle! Shines bright in the night sky!',
    distractors: ['B', 'P', 'M', 'D']
  },
  {
    id: 'train',
    word: 'TRAIN',
    emoji: '🚂',
    clue: 'Picture: <strong>T R A I N</strong>',
    hint: 'Choo choo! Rides along the tracks!',
    distractors: ['S', 'B', 'P', 'M']
  }
];

export class DragGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.subGame = 'pets'; // 'pets' | 'tenframe' | 'words'
    this.score = 0;
    this.targetScore = 4;
    this.draggedItem = null;
    this.currentWordIndex = 0;
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper drag-game animate-fade-in">
        <div class="game-header">
          <div class="game-badge">🧩 Mission 3: Drag & Drop Wizard</div>
          <h2 class="game-title" id="drag-game-title">Feed the Hungry Animals!</h2>
          <p class="game-desc" id="drag-game-desc">Click, hold, and drag each treat into the matching animal's dish.</p>
          <div class="game-stats">
            <div class="stat-pill"><span class="stat-icon">🎯</span> <span id="drag-score">0</span> / ${this.targetScore}</div>
            <div class="submode-toggles">
              <button class="btn-submode ${this.subGame === 'pets' ? 'active' : ''}" data-sub="pets">🐾 Feed Pets</button>
              <button class="btn-submode ${this.subGame === 'tenframe' ? 'active' : ''}" data-sub="tenframe">🔢 10-Frame Math</button>
              <button class="btn-submode ${this.subGame === 'words' ? 'active' : ''}" data-sub="words">🔤 Word Builder</button>
            </div>
          </div>
        </div>

        <div class="game-arena drag-arena" id="drag-arena">
          <!-- Game content rendered here -->
        </div>

        <div class="game-footer">
          <button class="btn-sound-instruction" id="drag-speak-btn">
            <span class="icon-speaker">🔊</span> Hear Directions
          </button>
          <div class="helper-hint">💡 <strong>Trackpad Tip:</strong> Press down with one finger, slide across, then lift up to drop!</div>
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

    const speakBtn = this.container.querySelector('#drag-speak-btn');
    speakBtn.addEventListener('click', () => {
      const diff = stateManager.getDifficulty();
      let msg = '';
      if (this.subGame === 'pets') {
        if (diff === 1) msg = "Feed each pet their favorite food! Match the carrot to the bunny, fish to the kitty, and bone to the puppy!";
        else if (diff === 3) msg = "Wild Safari Challenge! Feed each wild animal their natural diet. Watch out for donuts and dirty socks that animals cannot eat!";
        else msg = "Feed each animal their natural food. Watch out for human junk food like pizza!";
      } else if (this.subGame === 'tenframe') {
        const tf = this.getTenFrameData(diff);
        msg = tf.voiceMsg;
      } else {
        const wd = this.getWordData(diff);
        msg = wd.voiceMsg;
      }
      soundManager.speak(msg);
    });

    // Listen for live difficulty changes
    this.onDiffChange = () => {
      this.startSubGame(this.subGame);
    };
    window.addEventListener('difficultychange', this.onDiffChange);
  }

  getPetsData(diff) {
    if (diff === 1) {
      // 🌱 Level 1: Gentle Farmyard (3 animals, direct 1-to-1 match, no distractors)
      const animals = [
        { id: 'bunny', pet: '🐰 Bunny', food: '🥕', foodName: 'Carrot', hint: 'I love orange carrots!' },
        { id: 'cat', pet: '🐱 Kitty', food: '🐟', foodName: 'Fish', hint: 'Meow! Fish is my favorite!' },
        { id: 'dog', pet: '🐶 Puppy', food: '🦴', foodName: 'Bone', hint: 'Woof! Give me a tasty bone!' }
      ];
      return {
        animals,
        foods: [...animals.map(a => ({ id: a.id, food: a.food, foodName: a.foodName }))],
        title: 'Feed the Pets (Gentle Farmyard)',
        desc: 'Drag each treat into the right dish: 3 friendly pets!',
        required: 3
      };
    } else if (diff === 3) {
      // ⚡ Level 3: Wild Safari Expedition (6 exotic animals + 2 tricky non-food distractors!)
      const animals = [
        { id: 'lion', pet: '🦁 Lion', food: '🥩', foodName: 'Meat', hint: 'Carnivore (Eats meat!)' },
        { id: 'elephant', pet: '🐘 Elephant', food: '🥜', foodName: 'Peanuts', hint: 'Herbivore (Loves peanuts!)' },
        { id: 'frog', pet: '🐸 Tree Frog', food: '🪰', foodName: 'Fly', hint: 'Insectivore (Catches flies!)' },
        { id: 'penguin', pet: '🐧 Penguin', food: '🦐', foodName: 'Shrimp', hint: 'Sea Hunter (Catches shrimp!)' },
        { id: 'koala', pet: '🐨 Koala', food: '🌿', foodName: 'Eucalyptus', hint: 'Leaf Eater (Only eucalyptus!)' },
        { id: 'squirrel', pet: '🐿️ Squirrel', food: '🌰', foodName: 'Acorn', hint: 'Nut Forager (Buries acorns!)' }
      ];
      const distractors = [
        { id: 'donut', food: '🍩', foodName: 'Donut', reason: "Animals don't eat sugary donuts! 🍩🚫" },
        { id: 'sock', food: '🧦', foodName: 'Old Sock', reason: "Blech! No animal eats dirty socks! 🧦😂" }
      ];
      const allFoods = [
        ...animals.map(a => ({ id: a.id, food: a.food, foodName: a.foodName })),
        ...distractors
      ];
      return {
        animals,
        foods: allFoods,
        title: 'Wild Safari Expedition (Challenge: 6 Wild Animals & Distractors)',
        desc: 'Feed 6 wild animals their true diet. Do NOT feed them human junk food or old socks!',
        required: 6
      };
    } else {
      // 🌿 Level 2 (Standard): Zoo & Forest Friends (5 animals + 1 distractor food)
      const animals = [
        { id: 'bunny', pet: '🐰 Bunny', food: '🥕', foodName: 'Carrot', hint: 'Loves fresh carrots' },
        { id: 'cat', pet: '🐱 Kitty', food: '🐟', foodName: 'Fish', hint: 'Loves fresh fish' },
        { id: 'dog', pet: '🐶 Puppy', food: '🦴', foodName: 'Bone', hint: 'Loves crunchy bones' },
        { id: 'monkey', pet: '🐵 Monkey', food: '🍌', foodName: 'Banana', hint: 'Loves yellow bananas' },
        { id: 'panda', pet: '🐼 Panda', food: '🎋', foodName: 'Bamboo', hint: 'Loves green bamboo stalks' }
      ];
      const distractors = [
        { id: 'pizza', food: '🍕', foodName: 'Pizza', reason: "Yuck! Animals don't eat greasy pizza! 🍕🚫" }
      ];
      const allFoods = [
        ...animals.map(a => ({ id: a.id, food: a.food, foodName: a.foodName })),
        ...distractors
      ];
      return {
        animals,
        foods: allFoods,
        title: 'Zoo & Forest Friends (5 Animals & 1 Distractor)',
        desc: 'Feed 5 different animals their natural food. Watch out for pizza!',
        required: 5
      };
    }
  }

  getTenFrameData(diff) {
    if (diff === 1) {
      return {
        requiredCount: 4,
        banner: '🚀 Little Rocket: Drag <span class="highlight-num">4</span> stars into the 10-frame box!',
        voiceMsg: 'Drag exactly four glowing stars into the ten frame box!',
        title: 'MAP Math: Fill the 10-Frame (Count to 4)'
      };
    } else if (diff === 3) {
      return {
        requiredCount: 8,
        banner: '🚀 Space Equation: Solve <span class="highlight-num">5 + 3 = ?</span> Drag the total into the 10-frame!',
        voiceMsg: 'Solve five plus three! Drag eight stars into the ten frame to launch!',
        title: 'MAP Math: Addition Challenge (5 + 3 = 8)'
      };
    } else {
      return {
        requiredCount: 7,
        banner: '🚀 Moon Rocket: Drag <span class="highlight-num">7</span> stars into the 10-frame box below!',
        voiceMsg: 'Drag exactly seven glowing stars into the ten frame box!',
        title: 'MAP Math: Fill the 10-Frame (Count to 7)'
      };
    }
  }

  getWordData(diff, wordIndex = null) {
    if (wordIndex === null || wordIndex === undefined || wordIndex < 0 || wordIndex >= WORD_BUILDER_WORDS.length) {
      if (this.currentWordIndex !== undefined && this.currentWordIndex !== null) {
        wordIndex = this.currentWordIndex;
      } else {
        if (diff === 1) wordIndex = 0; // CAT
        else if (diff === 3) wordIndex = 6; // TRAIN
        else wordIndex = 4; // FROG
      }
    }
    this.currentWordIndex = wordIndex;
    const w = WORD_BUILDER_WORDS[wordIndex];
    const letters = [...w.word.split('')];

    let extraCount = 0;
    if (diff === 2) extraCount = 2;
    else if (diff === 3) extraCount = 4;

    if (extraCount > 0 && w.distractors) {
      letters.push(...w.distractors.slice(0, extraCount));
    }

    const voiceMsg = diff === 1
      ? `Drag the letter tiles into the boxes to spell ${w.word.split('').join('-')}, ${w.word.toLowerCase()}!`
      : (diff === 2
          ? `Drag the letter tiles to spell ${w.word.split('').join('-')}, ${w.word.toLowerCase()}! Watch out for 2 extra letters!`
          : `Drag the letter tiles to spell the word ${w.word.split('').join('-')}, ${w.word.toLowerCase()}! Watch out for extra tricky letters!`);

    return {
      word: w.word,
      emoji: w.emoji,
      clue: w.clue,
      hint: w.hint,
      letters: letters,
      voiceMsg: voiceMsg,
      wordIndex: wordIndex
    };
  }

  startSubGame(sub) {
    this.subGame = sub;
    this.score = 0;
    const titleEl = this.container.querySelector('#drag-game-title');
    const descEl = this.container.querySelector('#drag-game-desc');
    const scoreEl = this.container.querySelector('#drag-score');
    const arena = this.container.querySelector('#drag-arena');
    const diff = stateManager.getDifficulty();

    this.container.querySelectorAll('.btn-submode').forEach(b => {
      b.classList.toggle('active', b.dataset.sub === sub);
    });

    if (sub === 'pets') {
      const data = this.getPetsData(diff);
      titleEl.textContent = data.title;
      descEl.textContent = data.desc;
      this.targetScore = data.required;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initPets(arena, data);
    } else if (sub === 'tenframe') {
      const data = this.getTenFrameData(diff);
      titleEl.textContent = data.title;
      descEl.innerHTML = data.banner;
      this.targetScore = data.requiredCount;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initTenFrame(arena, data);
    } else if (sub === 'words') {
      const data = this.getWordData(diff, this.currentWordIndex);
      titleEl.innerHTML = `MAP Reading: Spell <strong>${data.word}</strong>! <button class="btn-skip-word" id="btn-skip-word">Next Word ➡️</button>`;
      descEl.textContent = `Drag the letters to spell "${data.word}".`;
      this.targetScore = data.word.length;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initWordBuilder(arena, data);

      const skipBtn = titleEl.querySelector('#btn-skip-word');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          soundManager.playPop(480);
          this.currentWordIndex = (this.currentWordIndex + 1) % WORD_BUILDER_WORDS.length;
          this.startSubGame('words');
        });
      }
    }
  }

  // SUBGAME 1: FEED THE ANIMALS (Scales with Difficulty)
  initPets(arena, petData) {
    // Shuffle foods so they aren't in same order as animals
    const foods = [...petData.foods].sort(() => Math.random() - 0.5);

    arena.innerHTML = `
      <div class="drag-pets-layout">
        <div class="food-shelf" id="food-shelf">
          <div class="shelf-label">Drag Food from Here ➔</div>
          <div class="food-items-row">
            ${foods.map(f => `
              <div class="draggable-item food-card" draggable="true" data-match="${f.id}" data-name="${f.foodName}">
                <span class="item-emoji">${f.food}</span>
                <span class="item-title">${f.foodName}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="pet-targets-row" id="pet-targets">
          ${petData.animals.map(p => `
            <div class="drop-zone pet-dish-card" data-accept="${p.id}" data-pet="${p.pet}">
              <div class="pet-avatar">${p.pet}</div>
              <div class="dish-slot">
                <span class="dish-placeholder">Drop treat here!</span>
              </div>
              <div class="pet-diet-hint">💡 ${p.hint}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.setupDragAndDrop(arena, (draggedEl, targetEl) => {
      const matchKey = draggedEl.dataset.match;
      const acceptKey = targetEl.dataset.accept;
      const foodName = draggedEl.dataset.name || 'this food';
      const petName = targetEl.dataset.pet || 'this animal';

      if (matchKey === acceptKey) {
        soundManager.playDrop();
        soundManager.playSparkle();
        targetEl.classList.remove('wrong-drop');
        targetEl.classList.add('satisfied');
        targetEl.querySelector('.dish-slot').innerHTML = `
          <div class="dish-filled animate-pop-in">${draggedEl.querySelector('.item-emoji').textContent} Yummy! 😋</div>
        `;
        draggedEl.remove();
        stateManager.recordDragPlaced();

        this.score++;
        const scoreEl = this.container.querySelector('#drag-score');
        if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;

        if (this.score >= this.targetScore) {
          setTimeout(() => {
            this.handleSuccess(`All ${this.targetScore} animals are happily fed their natural food!`);
          }, 500);
        }
        return true;
      } else {
        // Incorrect match or distractor item!
        soundManager.playGentleOof();
        targetEl.classList.add('wrong-drop');

        // Check if dragged item is a distractor
        const distractor = (petData.distractors || []).find(d => d.id === matchKey);
        const slot = targetEl.querySelector('.dish-slot');
        const prevContent = slot.innerHTML;

        if (distractor) {
          slot.innerHTML = `<span class="dish-rejection">${distractor.reason}</span>`;
        } else {
          slot.innerHTML = `<span class="dish-rejection">${petName} doesn't eat ${foodName}!</span>`;
        }

        setTimeout(() => {
          targetEl.classList.remove('wrong-drop');
          if (!targetEl.classList.contains('satisfied')) {
            slot.innerHTML = prevContent;
          }
        }, 1400);

        return false;
      }
    });
  }

  // SUBGAME 2: 10-FRAME MATH (Scales with Difficulty)
  initTenFrame(arena, data) {
    const requiredCount = data.requiredCount;
    arena.innerHTML = `
      <div class="tenframe-game">
        <div class="math-prompt-banner">
          ${data.banner}
        </div>

        <div class="tenframe-tray">
          <div class="star-bank" id="star-bank">
            ${Array.from({ length: 10 }).map((_, i) => `
              <div class="draggable-item math-star" draggable="true" data-id="star-${i}">
                ⭐
              </div>
            `).join('')}
          </div>

          <div class="tenframe-grid" id="tenframe-grid">
            ${Array.from({ length: 10 }).map((_, idx) => `
              <div class="drop-zone frame-cell" data-cell="${idx}">
                <span class="cell-num">${idx + 1}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="frame-count-status">Stars placed: <span id="frame-placed-count">0</span> / ${requiredCount}</div>
      </div>
    `;

    let placedCount = 0;
    this.setupDragAndDrop(arena, (draggedEl, targetEl) => {
      if (targetEl.classList.contains('frame-cell') && !targetEl.classList.contains('filled')) {
        soundManager.playDrop();
        targetEl.classList.add('filled');
        targetEl.innerHTML = `⭐`;
        draggedEl.remove();
        placedCount++;
        stateManager.recordDragPlaced();

        const countEl = arena.querySelector('#frame-placed-count');
        if (countEl) countEl.textContent = placedCount;

        const scoreEl = this.container.querySelector('#drag-score');
        if (scoreEl) scoreEl.textContent = `${placedCount} / ${requiredCount}`;

        if (placedCount === requiredCount) {
          setTimeout(() => {
            this.handleSuccess(`You filled the 10-Frame with ${requiredCount} stars! Rocket launched! 🚀✨`);
          }, 500);
        }
        return true;
      }
      return false;
    });
  }

  // SUBGAME 3: WORD BUILDER (Scales with Difficulty & Multiple Words)
  initWordBuilder(arena, data) {
    const targetWord = data.word;
    const letters = [...data.letters].sort(() => Math.random() - 0.5);

    arena.innerHTML = `
      <div class="word-builder-game">
        <div class="word-picker-chips">
          <span class="word-picker-label">Word:</span>
          ${WORD_BUILDER_WORDS.map((w, idx) => `
            <button class="btn-word-chip ${idx === this.currentWordIndex ? 'active' : ''}" data-index="${idx}">
              ${w.emoji} ${w.word}
            </button>
          `).join('')}
        </div>

        <div class="word-picture-card">
          <div class="big-emoji animate-pop-in">${data.emoji}</div>
          <div class="word-clue">${data.clue}</div>
        </div>

        <div class="word-slots-row" id="word-slots">
          ${targetWord.split('').map((ltr, idx) => `
            <div class="drop-zone letter-slot" data-expected="${ltr}"><span class="slot-hint">${idx + 1}</span></div>
          `).join('')}
        </div>

        <div class="letter-tiles-bank" id="letter-bank">
          ${letters.map(ltr => `
            <div class="draggable-item letter-tile" draggable="true" data-letter="${ltr}">
              ${ltr}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Chip click handler to switch words
    arena.querySelectorAll('.btn-word-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx !== this.currentWordIndex) {
          soundManager.playPop(520);
          this.currentWordIndex = idx;
          this.startSubGame('words');
        }
      });
    });

    this.setupDragAndDrop(arena, (draggedEl, targetEl) => {
      // Do not allow dropping on already filled slots
      if (targetEl.classList.contains('filled')) return false;

      const letter = draggedEl.dataset.letter;
      const expected = targetEl.dataset.expected;

      if (letter === expected) {
        soundManager.playDrop();
        soundManager.playSparkle();
        targetEl.classList.add('filled');
        targetEl.innerHTML = letter;
        draggedEl.remove();
        stateManager.recordDragPlaced();

        this.score++;
        const scoreEl = this.container.querySelector('#drag-score');
        if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;

        if (this.score >= this.targetScore) {
          setTimeout(() => {
            soundManager.speak(`Great reading! ${targetWord.split('').join('-')} spells ${targetWord}!`);
            const nextWordIndex = (this.currentWordIndex + 1) % WORD_BUILDER_WORDS.length;
            const nextWordObj = WORD_BUILDER_WORDS[nextWordIndex];
            this.handleSuccess(
              `You spelled <strong>${targetWord}</strong> ${data.emoji} perfectly!`,
              {
                nextWord: nextWordObj.word,
                nextEmoji: nextWordObj.emoji,
                onNextWord: () => {
                  this.currentWordIndex = nextWordIndex;
                  this.startSubGame('words');
                }
              }
            );
          }, 500);
        }
        return true;
      } else {
        soundManager.playGentleOof();
        targetEl.classList.add('wrong-drop');
        setTimeout(() => targetEl.classList.remove('wrong-drop'), 400);
        return false;
      }
    });
  }

  // Robust Drag and Drop with Pointer Event Fallback for Laptops / Trackpads
  setupDragAndDrop(arena, onDropCallback) {
    const draggables = arena.querySelectorAll('.draggable-item');
    const dropZones = arena.querySelectorAll('.drop-zone');

    // Standard HTML5 DnD
    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', (e) => {
        this.draggedItem = draggable;
        draggable.classList.add('dragging');
        soundManager.playPop(350);
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
      });

      draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
        this.draggedItem = null;
      });

      // Pointer event fallback for trackpad single-click-to-pickup / click-to-drop
      draggable.addEventListener('click', () => {
        // If clicking on item, toggle select
        const previouslySelected = arena.querySelector('.draggable-item.item-selected');
        if (previouslySelected && previouslySelected !== draggable) {
          previouslySelected.classList.remove('item-selected');
        }
        draggable.classList.toggle('item-selected');
        if (draggable.classList.contains('item-selected')) {
          soundManager.playPop(420);
        }
      });
    });

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-hover');
        e.dataTransfer.dropEffect = 'move';
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-hover');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-hover');
        if (this.draggedItem) {
          onDropCallback(this.draggedItem, zone);
        }
      });

      // Click-to-place fallback
      zone.addEventListener('click', () => {
        const selected = arena.querySelector('.draggable-item.item-selected');
        if (selected) {
          const success = onDropCallback(selected, zone);
          if (success) {
            selected.classList.remove('item-selected');
          }
        }
      });
    });
  }

  handleSuccess(customMsg, options = null) {
    soundManager.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    stateManager.recordSkillProgress('drag', { stars: 3 });

    const arena = this.container.querySelector('#drag-arena');
    const winModal = document.createElement('div');
    winModal.className = 'mini-win-banner animate-bounce-in';
    winModal.innerHTML = `
      <div class="win-card">
        <div class="win-icon">🧩</div>
        <h3>Drag & Drop Master!</h3>
        <p>${customMsg}</p>
        <div class="win-stars">+3 Stars Earned! ⭐⭐⭐</div>
        <div class="win-buttons">
          ${options?.nextWord ? `
            <button class="btn-action btn-primary btn-next-word">
              ➡️ Next Word: ${options.nextEmoji} ${options.nextWord}
            </button>
            <button class="btn-action btn-play-again">Practice Again</button>
            <button class="btn-action btn-secondary btn-next-mission">Next Mission ➡️</button>
          ` : `
            <button class="btn-action btn-play-again">Practice Again</button>
            <button class="btn-action btn-primary btn-next-mission">Next: Scrolling Adventure ➡️</button>
          `}
        </div>
      </div>
    `;

    arena.appendChild(winModal);

    if (options?.nextWord) {
      winModal.querySelector('.btn-next-word').addEventListener('click', () => {
        winModal.remove();
        if (options.onNextWord) options.onNextWord();
      });
    }

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.startSubGame(this.subGame);
    });

    const nextMissionBtn = winModal.querySelector('.btn-next-mission');
    if (nextMissionBtn) {
      nextMissionBtn.addEventListener('click', () => {
        if (this.onComplete) this.onComplete('scroll');
      });
    }
  }

  destroy() {
    if (this.onDiffChange) {
      window.removeEventListener('difficultychange', this.onDiffChange);
    }
  }
}
