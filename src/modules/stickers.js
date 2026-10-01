/**
 * Sticker Playground & Printable Certificate Module
 * Unlocks stickers as Hailey earns stars and generates a high-quality printable certificate.
 */
import { soundManager } from './audio.js';
import { stateManager } from './state.js';
import confetti from 'canvas-confetti';

export class StickerModule {
  constructor(containerEl) {
    this.container = containerEl;
    this.activeTab = 'certificate'; // 'certificate' | 'stickers'
  }

  render() {
    const st = stateManager.get();
    const readiness = stateManager.getReadinessScore();

    this.container.innerHTML = `
      <div class="sticker-module-wrapper animate-fade-in">
        <div class="module-header no-print">
          <div class="tab-pill-switcher">
            <button class="tab-pill ${this.activeTab === 'certificate' ? 'active' : ''}" id="tab-cert-btn">
              🏅 Official Certificate
            </button>
            <button class="tab-pill ${this.activeTab === 'stickers' ? 'active' : ''}" id="tab-stickers-btn">
              🎨 Sticker Playground (${st.stickers.filter(s => s.unlocked).length} / ${st.stickers.length})
            </button>
          </div>
        </div>

        <div class="sticker-sub-content" id="sticker-sub-content">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    this.bindEvents();
    if (this.activeTab === 'certificate') {
      this.renderCertificate();
    } else {
      this.renderStickerBoard();
    }
  }

  bindEvents() {
    const certBtn = this.container.querySelector('#tab-cert-btn');
    const stickersBtn = this.container.querySelector('#tab-stickers-btn');

    certBtn.addEventListener('click', () => {
      this.activeTab = 'certificate';
      certBtn.classList.add('active');
      stickersBtn.classList.remove('active');
      soundManager.playClick();
      this.renderCertificate();
    });

    stickersBtn.addEventListener('click', () => {
      this.activeTab = 'stickers';
      stickersBtn.classList.add('active');
      certBtn.classList.remove('active');
      soundManager.playClick();
      this.renderStickerBoard();
    });
  }

  renderCertificate() {
    const st = stateManager.get();
    const content = this.container.querySelector('#sticker-sub-content');
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    content.innerHTML = `
      <div class="certificate-container">
        <div class="certificate-toolbar no-print">
          <button class="btn-action btn-primary" id="btn-print-certificate">
            🖨️ Print / Save Certificate PDF
          </button>
          <div class="cert-status-tag">⭐ Total Stars: <strong>${st.profile.stars}</strong> | Readiness: <strong>${stateManager.getReadinessScore()}%</strong></div>
        </div>

        <!-- Printable Certificate Sheet -->
        <div class="cert-frame printable-cert" id="printable-cert">
          <div class="cert-inner-border">
            <div class="cert-top-emblems">
              <span class="cert-corner-icon">🌟</span>
              <div class="cert-header-badge">OFFICIAL AWARD OF EXCELLENCE</div>
              <span class="cert-corner-icon">🌟</span>
            </div>

            <h1 class="cert-title">Computer Master Certificate</h1>
            <p class="cert-subtitle">This is proudly presented to</p>

            <div class="cert-student-name" id="cert-student-name">
              ${st.profile.name}
            </div>

            <p class="cert-body-text">
              For outstanding mastery of 1st Grade Laptop & Trackpad Computer Skills in preparation for the MAP Assessment:
            </p>

            <div class="cert-skills-badges">
              <div class="cert-badge-item">
                <span class="badge-icon">🐭</span>
                <span class="badge-text">Cursor Control</span>
              </div>
              <div class="cert-badge-item">
                <span class="badge-icon">⚡</span>
                <span class="badge-text">Double Clicking</span>
              </div>
              <div class="cert-badge-item">
                <span class="badge-icon">🧩</span>
                <span class="badge-text">Drag & Drop</span>
              </div>
              <div class="cert-badge-item">
                <span class="badge-icon">📜</span>
                <span class="badge-text">Screen Scrolling</span>
              </div>
              <div class="cert-badge-item">
                <span class="badge-icon">🎧</span>
                <span class="badge-text">Audio Listening</span>
              </div>
            </div>

            <div class="cert-footer-row">
              <div class="cert-sig-block">
                <div class="cert-sig-line"></div>
                <div class="cert-sig-label">Proud Parent Signature</div>
              </div>

              <div class="cert-gold-seal">
                <div class="seal-inner">
                  <div class="seal-star">⭐</div>
                  <div class="seal-text">MAP READY</div>
                  <div class="seal-grade">1ST GRADE</div>
                </div>
              </div>

              <div class="cert-sig-block">
                <div class="cert-sig-date">${today}</div>
                <div class="cert-sig-label">Date Awarded</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const printBtn = content.querySelector('#btn-print-certificate');
    printBtn.addEventListener('click', () => {
      soundManager.playSparkle();
      confetti({ particleCount: 70, spread: 60 });
      setTimeout(() => {
        window.print();
      }, 300);
    });
  }

  renderStickerBoard() {
    const st = stateManager.get();
    const content = this.container.querySelector('#sticker-sub-content');

    content.innerHTML = `
      <div class="sticker-board-layout">
        <!-- Draggable sticker drawer -->
        <div class="sticker-drawer">
          <h4 class="drawer-title">🎒 Hailey's Sticker Pouch</h4>
          <p class="drawer-hint">Drag unlocked stickers onto your playground!</p>
          <div class="sticker-pouch-grid">
            ${st.stickers.map(s => `
              <div class="sticker-item ${s.unlocked ? 'unlocked' : 'locked'}" 
                   id="drawer-${s.id}" 
                   data-id="${s.id}" 
                   draggable="${s.unlocked}">
                <div class="sticker-symbol">${s.unlocked ? s.icon : '🔒'}</div>
                <div class="sticker-name">${s.name}</div>
                ${!s.unlocked ? `<div class="sticker-lock-tip">Earn stars to unlock!</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Magical Playground Canvas -->
        <div class="sticker-canvas-arena" id="sticker-canvas">
          <div class="canvas-decor decor-cloud-1">☁️</div>
          <div class="canvas-decor decor-cloud-2">☁️</div>
          <div class="canvas-decor decor-sun">☀️</div>
          <div class="canvas-decor decor-castle">🏰</div>
          <div class="canvas-decor decor-rainbow">🌈</div>
          <div class="canvas-title">✨ Hailey's Magical Sticker Meadow ✨</div>

          <!-- Placed stickers -->
          <div class="placed-stickers-layer" id="placed-stickers-layer"></div>
        </div>
      </div>
    `;

    this.initStickerInteractivity(content);
  }

  initStickerInteractivity(content) {
    const layer = content.querySelector('#placed-stickers-layer');
    const canvas = content.querySelector('#sticker-canvas');
    const st = stateManager.get();

    // Render unlocked stickers onto board
    st.stickers.forEach(s => {
      if (s.unlocked) {
        const item = document.createElement('div');
        item.className = 'canvas-placed-sticker animate-pop-in';
        item.id = `placed-${s.id}`;
        item.innerHTML = s.icon;
        item.style.left = `${s.x}px`;
        item.style.top = `${s.y}px`;
        item.title = s.name;

        // Make movable
        let isDragging = false;
        let startX = 0, startY = 0;

        item.addEventListener('mousedown', (e) => {
          isDragging = true;
          soundManager.playPop(480);
          item.classList.add('moving');
          const rect = canvas.getBoundingClientRect();
          startX = e.clientX - item.offsetLeft;
          startY = e.clientY - item.offsetTop;

          const onMove = (moveEvent) => {
            if (!isDragging) return;
            const newX = Math.max(10, Math.min(canvas.clientWidth - 60, moveEvent.clientX - startX));
            const newY = Math.max(10, Math.min(canvas.clientHeight - 60, moveEvent.clientY - startY));
            item.style.left = `${newX}px`;
            item.style.top = `${newY}px`;
          };

          const onUp = (upEvent) => {
            isDragging = false;
            item.classList.remove('moving');
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            soundManager.playDrop();
            stateManager.updateStickerPosition(s.id, parseInt(item.style.left, 10), parseInt(item.style.top, 10));
          };

          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });

        layer.appendChild(item);
      }
    });
  }

  destroy() {}
}
