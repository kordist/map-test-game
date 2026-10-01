/**
 * Mission 3: Drag & Drop Wizard
 * Trains: Selecting answers by drag-and-drop and clicking, 10-frames, phonics spelling, sorting.
 */
import { soundManager } from '../audio.js';
import { stateManager } from '../state.js';
import confetti from 'canvas-confetti';

export class DragGame {
  constructor(containerEl, onComplete) {
    this.container = containerEl;
    this.onComplete = onComplete;
    this.subGame = 'pets'; // 'pets' | 'tenframe' | 'words'
    this.score = 0;
    this.targetScore = 4;
    this.draggedItem = null;
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
      let msg = '';
      if (this.subGame === 'pets') {
        msg = "Click and drag each food item to the animal that loves to eat it!";
      } else if (this.subGame === 'tenframe') {
        msg = "Drag exactly six glowing stars into the ten frame grid!";
      } else {
        msg = "Drag the letter tiles into the boxes to spell the word C-A-T, cat!";
      }
      soundManager.speak(msg);
    });
  }

  startSubGame(sub) {
    this.subGame = sub;
    this.score = 0;
    const titleEl = this.container.querySelector('#drag-game-title');
    const descEl = this.container.querySelector('#drag-game-desc');
    const scoreEl = this.container.querySelector('#drag-score');
    const arena = this.container.querySelector('#drag-arena');

    this.container.querySelectorAll('.btn-submode').forEach(b => {
      b.classList.toggle('active', b.dataset.sub === sub);
    });

    if (sub === 'pets') {
      titleEl.textContent = 'Feed the Hungry Animals!';
      descEl.textContent = 'Click and drag the treat to the animal who wants to eat it.';
      this.targetScore = 4;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initPets(arena);
    } else if (sub === 'tenframe') {
      titleEl.textContent = 'MAP Math: Fill the 10-Frame!';
      descEl.textContent = 'Drag 6 stars into the 10-frame box to make the rocket launch!';
      this.targetScore = 6;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initTenFrame(arena);
    } else if (sub === 'words') {
      titleEl.textContent = 'MAP Reading: Spell the Word!';
      descEl.textContent = 'Drag the letters into the boxes to spell the word "CAT".';
      this.targetScore = 3;
      scoreEl.textContent = `0 / ${this.targetScore}`;
      this.initWordBuilder(arena);
    }
  }

  // SUBGAME 1: FEED THE PETS
  initPets(arena) {
    const pairs = [
      { id: 'bunny', pet: '🐰 Bunny', food: '🥕', foodName: 'Carrot' },
      { id: 'cat', pet: '🐱 Kitty', food: '🐟', foodName: 'Fish' },
      { id: 'dog', pet: '🐶 Puppy', food: '🦴', foodName: 'Bone' },
      { id: 'bear', pet: '🐻 Bear', food: '🍯', foodName: 'Honey' }
    ];

    // Shuffle foods
    const foods = [...pairs].sort(() => Math.random() - 0.5);

    arena.innerHTML = `
      <div class="drag-pets-layout">
        <div class="food-shelf" id="food-shelf">
          <div class="shelf-label">Drag Food from Here ➔</div>
          <div class="food-items-row">
            ${foods.map(f => `
              <div class="draggable-item food-card" draggable="true" data-match="${f.id}">
                <span class="item-emoji">${f.food}</span>
                <span class="item-title">${f.foodName}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="pet-targets-row" id="pet-targets">
          ${pairs.map(p => `
            <div class="drop-zone pet-dish-card" data-accept="${p.id}">
              <div class="pet-avatar">${p.pet}</div>
              <div class="dish-slot">
                <span class="dish-placeholder">Drop treat here!</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.setupDragAndDrop(arena, (draggedEl, targetEl) => {
      const matchKey = draggedEl.dataset.match;
      const acceptKey = targetEl.dataset.accept;

      if (matchKey === acceptKey) {
        soundManager.playDrop();
        soundManager.playSparkle();
        targetEl.classList.add('satisfied');
        targetEl.querySelector('.dish-slot').innerHTML = `
          <div class="dish-filled animate-pop-in">${draggedEl.querySelector('.item-emoji').textContent} Delicious! 😋</div>
        `;
        draggedEl.remove();
        stateManager.recordDragPlaced();

        this.score++;
        const scoreEl = this.container.querySelector('#drag-score');
        if (scoreEl) scoreEl.textContent = `${this.score} / ${this.targetScore}`;

        if (this.score >= this.targetScore) {
          setTimeout(() => {
            this.handleSuccess('All pets are happily fed!');
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

  // SUBGAME 2: 10-FRAME MATH
  initTenFrame(arena) {
    const requiredCount = 6;
    arena.innerHTML = `
      <div class="tenframe-game">
        <div class="math-prompt-banner">
          🚀 Rocket Mission: Drag <span class="highlight-num">${requiredCount}</span> stars into the 10-frame box below!
        </div>

        <div class="tenframe-tray">
          <div class="star-bank" id="star-bank">
            ${Array.from({ length: 9 }).map((_, i) => `
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

        <div class="frame-count-status">Stars placed: <span id="frame-placed-count">0</span> / 6</div>
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
        if (scoreEl) scoreEl.textContent = `${placedCount} / 6`;

        if (placedCount === requiredCount) {
          setTimeout(() => {
            this.handleSuccess('You filled the 10-Frame with 6 stars! Ready for MAP Math!');
          }, 500);
        }
        return true;
      }
      return false;
    });
  }

  // SUBGAME 3: WORD BUILDER
  initWordBuilder(arena) {
    const targetWord = 'CAT';
    const letters = ['T', 'C', 'A', 'M', 'S'];

    arena.innerHTML = `
      <div class="word-builder-game">
        <div class="word-picture-card">
          <div class="big-emoji">🐱</div>
          <div class="word-clue">Picture: <strong>C A T</strong></div>
        </div>

        <div class="word-slots-row" id="word-slots">
          <div class="drop-zone letter-slot" data-expected="C"><span class="slot-hint">1</span></div>
          <div class="drop-zone letter-slot" data-expected="A"><span class="slot-hint">2</span></div>
          <div class="drop-zone letter-slot" data-expected="T"><span class="slot-hint">3</span></div>
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

    this.setupDragAndDrop(arena, (draggedEl, targetEl) => {
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
        if (scoreEl) scoreEl.textContent = `${this.score} / 3`;

        if (this.score >= 3) {
          setTimeout(() => {
            soundManager.speak("Great reading! C-A-T spells Cat!");
            this.handleSuccess('You spelled C-A-T perfectly!');
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

  handleSuccess(customMsg) {
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
          <button class="btn-action btn-play-again">Practice Again</button>
          <button class="btn-action btn-primary btn-next-mission">Next: Scrolling Adventure ➡️</button>
        </div>
      </div>
    `;

    arena.appendChild(winModal);

    winModal.querySelector('.btn-play-again').addEventListener('click', () => {
      winModal.remove();
      this.startSubGame(this.subGame);
    });

    winModal.querySelector('.btn-next-mission').addEventListener('click', () => {
      if (this.onComplete) this.onComplete('scroll');
    });
  }

  destroy() {}
}
