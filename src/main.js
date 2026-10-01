/**
 * Application Entry Point & Router for Laptop Hero
 */
import { soundManager } from './modules/audio.js';
import { stateManager } from './modules/state.js';
import { CursorGame } from './modules/games/cursorGame.js';
import { ClickGame } from './modules/games/clickGame.js';
import { DragGame } from './modules/games/dragGame.js';
import { ScrollGame } from './modules/games/scrollGame.js';
import { ListenGame } from './modules/games/listenGame.js';
import { WormGame } from './modules/games/wormGame.js';
import { MapTestSimulator } from './modules/simulator/mapTest.js';
import { StickerModule } from './modules/stickers.js';
import { ParentHubModule } from './modules/parentHub.js';

class App {
  constructor() {
    this.currentTab = 'arcade'; // 'arcade' | 'simulator' | 'stickers' | 'parent'
    this.activeGame = null;
    this.mainContent = document.getElementById('main-content');

    this.init();
  }

  init() {
    this.bindHeader();
    this.bindNavigation();
    this.updateHeaderUI(stateManager.get());

    // Subscribe to state changes
    stateManager.subscribe((state) => {
      this.updateHeaderUI(state);
    });

    // Render initial view
    this.navigate('arcade');
  }

  bindHeader() {
    const audioToggle = document.getElementById('header-audio-toggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        soundManager.isMuted = !soundManager.isMuted;
        audioToggle.textContent = soundManager.isMuted ? '🔇' : '🔊';
        if (!soundManager.isMuted) soundManager.playPop(520);
      });
    }

    const studentPill = document.getElementById('student-pill');
    if (studentPill) {
      studentPill.addEventListener('click', () => {
        this.navigate('stickers');
      });
    }

    const starsPill = document.getElementById('stars-pill');
    if (starsPill) {
      starsPill.addEventListener('click', () => {
        soundManager.playSparkle();
        this.navigate('stickers');
      });
    }

    // Arena Size Switcher (Standard vs Desktop PC)
    const btnStandard = document.getElementById('btn-size-standard');
    const btnDesktop = document.getElementById('btn-size-desktop');

    if (btnStandard && btnDesktop) {
      btnStandard.addEventListener('click', () => {
        soundManager.playClick();
        stateManager.setArenaSize('standard');
      });

      btnDesktop.addEventListener('click', () => {
        soundManager.playClick();
        stateManager.setArenaSize('desktop');
      });
    }

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen-toggle');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        soundManager.playSparkle();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          btnFullscreen.textContent = '⛶ Exit Full';
          btnFullscreen.classList.add('is-fullscreen');
        } else {
          document.exitFullscreen().catch(() => {});
          btnFullscreen.textContent = '⛶ Fullscreen';
          btnFullscreen.classList.remove('is-fullscreen');
        }
      });

      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          btnFullscreen.textContent = '⛶ Exit Full';
          btnFullscreen.classList.add('is-fullscreen');
        } else {
          btnFullscreen.textContent = '⛶ Fullscreen';
          btnFullscreen.classList.remove('is-fullscreen');
        }
        window.dispatchEvent(new Event('resize'));
      });
    }

    // Initial Arena Size Sync
    const curSize = stateManager.get().settings.arenaSize || 'desktop';
    stateManager.setArenaSize(curSize);
  }

  updateHeaderUI(state) {
    const nameEl = document.getElementById('header-name');
    const avatarEl = document.getElementById('header-avatar');
    const starsEl = document.getElementById('header-stars');
    const btnStandard = document.getElementById('btn-size-standard');
    const btnDesktop = document.getElementById('btn-size-desktop');

    if (btnStandard && btnDesktop) {
      const isDesktop = (state.settings.arenaSize || 'desktop') === 'desktop';
      btnDesktop.classList.toggle('active', isDesktop);
      btnStandard.classList.toggle('active', !isDesktop);
    }

    if (nameEl) nameEl.textContent = state.profile.name;
    if (avatarEl) avatarEl.textContent = state.profile.avatar;
    if (starsEl) {
      const prev = parseInt(starsEl.textContent, 10) || 0;
      starsEl.textContent = state.profile.stars;
      if (state.profile.stars > prev) {
        starsEl.parentElement.classList.add('animate-pop-in');
        setTimeout(() => starsEl.parentElement.classList.remove('animate-pop-in'), 400);
      }
    }
  }

  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        soundManager.playClick();
        this.navigate(target);
      });
    });
  }

  navigate(tabName, gameParam = null) {
    if (this.activeGame && this.activeGame.destroy) {
      this.activeGame.destroy();
      this.activeGame = null;
    }

    this.currentTab = tabName;

    // Update nav tab styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (tabName) {
      case 'arcade':
        if (gameParam) {
          this.launchGame(gameParam);
        } else {
          this.renderArcadeLanding();
        }
        break;
      case 'simulator':
        this.renderMapSimulator();
        break;
      case 'stickers':
        this.renderStickers();
        break;
      case 'parent':
        this.renderParentHub();
        break;
      default:
        this.renderArcadeLanding();
    }
  }

  renderArcadeLanding() {
    const state = stateManager.get();
    const readiness = stateManager.getReadinessScore();

    this.mainContent.innerHTML = `
      <div class="arcade-container animate-fade-in">
        <!-- Hero Banner -->
        <div class="arcade-hero-banner">
          <div class="hero-text-content">
            <h1>Ready, Set, Practice, Hailey! 🌟</h1>
            <p>Master the 5 computer skills for your upcoming 1st Grade MAP test through fun mini-games!</p>
          </div>
          <button class="hero-cta-btn" id="btn-hero-test">
            📝 Take MAP Practice Exam ➔
          </button>
        </div>

        <!-- Section Title -->
        <h2 class="missions-section-title">
          <span>🎯 Choose a Skill Mission</span>
        </h2>

        <!-- Mission Cards Grid -->
        <div class="mission-cards-grid">
          <!-- Mission 1: Cursor -->
          <div class="mission-card" data-mission="cursor">
            <div class="card-top-row">
              <span class="card-badge-num">Mission 1</span>
              <div class="card-icon-big">🐭</div>
            </div>
            <h3>Cursor Master</h3>
            <p>Practice smooth mouse and trackpad movement, catching glowing stars and following garden paths.</p>
            <div class="card-footer">
              <span class="card-stars-stat">⭐ ${state.skills.cursor.stars} Stars</span>
              <button class="btn-play-mission">Play Mission ➔</button>
            </div>
          </div>

          <!-- Mission 2: Click & Double Click -->
          <div class="mission-card" data-mission="click">
            <div class="card-top-row">
              <span class="card-badge-num">Mission 2</span>
              <div class="card-icon-big">⚡</div>
            </div>
            <h3>Click & Double-Click</h3>
            <p>Crack magical dragon eggs with fast double-clicks and pop numbered balloons.</p>
            <div class="card-footer">
              <span class="card-stars-stat">⭐ ${state.skills.click.stars} Stars</span>
              <button class="btn-play-mission">Play Mission ➔</button>
            </div>
          </div>

          <!-- Mission 3: Drag & Drop -->
          <div class="mission-card" data-mission="drag">
            <div class="card-top-row">
              <span class="card-badge-num">Mission 3</span>
              <div class="card-icon-big">🧩</div>
            </div>
            <h3>Drag & Drop Wizard</h3>
            <p>Feed hungry pets, fill 10-frames with stars, and spell words like CAT by dragging tiles.</p>
            <div class="card-footer">
              <span class="card-stars-stat">⭐ ${state.skills.drag.stars} Stars</span>
              <button class="btn-play-mission">Play Mission ➔</button>
            </div>
          </div>

          <!-- Mission 4: Scrolling -->
          <div class="mission-card" data-mission="scroll">
            <div class="card-top-row">
              <span class="card-badge-num">Mission 4</span>
              <div class="card-icon-big">📜</div>
            </div>
            <h3>Super Scroller</h3>
            <p>Dive into deep ocean waters with 2-finger scrolling and read multi-page MAP stories.</p>
            <div class="card-footer">
              <span class="card-stars-stat">⭐ ${state.skills.scroll.stars} Stars</span>
              <button class="btn-play-mission">Play Mission ➔</button>
            </div>
          </div>

          <!-- Mission 5: Headphone Listening -->
          <div class="mission-card" data-mission="listen">
            <div class="card-top-row">
              <span class="card-badge-num">Mission 5</span>
              <div class="card-icon-big">🎧</div>
            </div>
            <h3>Super Listener</h3>
            <p>Put on headphones and practice listening to full spoken sentences before choosing answers.</p>
            <div class="card-footer">
              <span class="card-stars-stat">⭐ ${state.skills.listen.stars} Stars</span>
              <button class="btn-play-mission">Play Mission ➔</button>
            </div>
          </div>

          <!-- Special Bonus Quest: Save the Apple! (Block the Worm) -->
          <div class="mission-card mission-card-special" data-mission="worm">
            <div class="card-top-row">
              <span class="card-badge-num" style="background: #FEF3C7; color: #B45309;">🍎 Bonus Quest</span>
              <div class="card-icon-big">🐛</div>
            </div>
            <h3>Save the Apple!</h3>
            <p>Place wooden blocks to bump the crawling worm 5 times (each bump turns 20% of his body red!).</p>
            <div class="card-footer">
              <span class="card-stars-stat">⭐ +3 Stars</span>
              <button class="btn-play-mission" style="background: #FEF3C7; color: #B45309;">Block Worm ➔</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind mission cards
    this.mainContent.querySelectorAll('.mission-card').forEach(card => {
      card.addEventListener('click', () => {
        const mission = card.dataset.mission;
        soundManager.playPop(520);
        this.launchGame(mission);
      });
    });

    const heroTestBtn = this.mainContent.querySelector('#btn-hero-test');
    if (heroTestBtn) {
      heroTestBtn.addEventListener('click', () => {
        soundManager.playSparkle();
        this.navigate('simulator');
      });
    }
  }

  launchGame(gameKey) {
    this.mainContent.innerHTML = `<div id="active-game-container"></div>`;
    const container = document.getElementById('active-game-container');

    const handleNext = (nextMission) => {
      if (nextMission === 'simulator') {
        this.navigate('simulator');
      } else if (nextMission) {
        this.launchGame(nextMission);
      } else {
        this.navigate('arcade');
      }
    };

    switch (gameKey) {
      case 'cursor':
        this.activeGame = new CursorGame(container, handleNext);
        break;
      case 'click':
        this.activeGame = new ClickGame(container, handleNext);
        break;
      case 'drag':
        this.activeGame = new DragGame(container, handleNext);
        break;
      case 'scroll':
        this.activeGame = new ScrollGame(container, handleNext);
        break;
      case 'listen':
        this.activeGame = new ListenGame(container, handleNext);
        break;
      case 'worm':
        this.activeGame = new WormGame(container, handleNext);
        break;
      default:
        this.renderArcadeLanding();
        return;
    }

    this.activeGame.render();
  }

  renderMapSimulator() {
    this.mainContent.innerHTML = `<div id="map-simulator-container"></div>`;
    const container = document.getElementById('map-simulator-container');
    this.activeGame = new MapTestSimulator(container, (action) => {
      if (action === 'stickers') {
        this.navigate('stickers');
      } else if (action === 'arcade') {
        this.navigate('arcade');
      }
    });
    this.activeGame.render();
  }

  renderStickers() {
    this.mainContent.innerHTML = `<div id="stickers-container"></div>`;
    const container = document.getElementById('stickers-container');
    this.activeGame = new StickerModule(container);
    this.activeGame.render();
  }

  renderParentHub() {
    this.mainContent.innerHTML = `<div id="parent-hub-container"></div>`;
    const container = document.getElementById('parent-hub-container');
    this.activeGame = new ParentHubModule(container);
    this.activeGame.render();
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
