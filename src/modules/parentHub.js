/**
 * Parent & Teacher Dashboard Module
 * Shows skill readiness breakdown, analytics, coach advice for 1st graders, and settings.
 */
import { soundManager } from './audio.js';
import { stateManager } from './state.js';

export class ParentHubModule {
  constructor(containerEl) {
    this.container = containerEl;
  }

  render() {
    const st = stateManager.get();
    const readiness = stateManager.getReadinessScore();

    this.container.innerHTML = `
      <div class="parent-hub-wrapper animate-fade-in">
        <div class="parent-header">
          <div class="parent-badge">👨‍👩‍👧 Parent & Teacher Guide</div>
          <h2 class="parent-title">MAP Computer Readiness Dashboard</h2>
          <p class="parent-subtitle">Tracking mastery for the 5 key skills required for 1st Grade standardized MAP testing (Oct 5-9).</p>
        </div>

        <!-- Overall Readiness Card -->
        <div class="readiness-hero-card">
          <div class="readiness-gauge">
            <div class="gauge-number">${readiness}%</div>
            <div class="gauge-label">MAP Test Ready</div>
          </div>
          <div class="readiness-info">
            <h3>Student: ${st.profile.name}</h3>
            <p>Target Week: <strong>October 5th - 9th</strong></p>
            <div class="readiness-bar-track">
              <div class="readiness-bar-fill" style="width: ${readiness}%"></div>
            </div>
            <p class="readiness-tip">
              ${readiness >= 80 
                ? `🎉 Fantastic progress! ${st.profile.name || 'Your student'} has demonstrated great confidence across cursor navigation, double clicking, drag-and-drop, scrolling, and headphone listening!` 
                : "💡 Recommended: Spend 5-10 minutes each day playing through the 5 missions to build muscle memory."}
            </p>
          </div>
        </div>

        <!-- 5 Teacher Required Skills Breakdown -->
        <div class="skills-grid">
          <!-- Skill 1: Cursor -->
          <div class="skill-card">
            <div class="skill-icon-header">
              <span class="skill-icon">🐭</span>
              <span class="skill-status ${st.skills.cursor.completedCount > 0 ? 'status-ready' : 'status-practice'}">
                ${st.skills.cursor.completedCount > 0 ? '✓ Ready' : 'In Practice'}
              </span>
            </div>
            <h4>Moving the Cursor (Mouse / Trackpad)</h4>
            <p class="skill-desc">Smooth navigation across the screen without lifting fingers erratically.</p>
            <div class="skill-stat-row">
              <span>Missions Completed:</span>
              <strong>${st.skills.cursor.completedCount}</strong>
            </div>
          </div>

          <!-- Skill 2: Click & Double Click -->
          <div class="skill-card">
            <div class="skill-icon-header">
              <span class="skill-icon">⚡</span>
              <span class="skill-status ${st.analytics.doubleClicksSuccessful >= 4 ? 'status-ready' : 'status-practice'}">
                ${st.analytics.doubleClicksSuccessful >= 4 ? '✓ Ready' : 'In Practice'}
              </span>
            </div>
            <h4>Clicking & Double Clicking</h4>
            <p class="skill-desc">Rhythm of two quick taps without dragging the mouse.</p>
            <div class="skill-stat-row">
              <span>Double-Click Accuracy:</span>
              <strong>${st.skills.click.doubleClickAccuracy || 100}%</strong>
            </div>
            <div class="skill-stat-row">
              <span>Average Speed:</span>
              <strong>${st.skills.click.doubleClickAvgMs || 380}ms</strong>
            </div>
          </div>

          <!-- Skill 3: Drag & Drop -->
          <div class="skill-card">
            <div class="skill-icon-header">
              <span class="skill-icon">🧩</span>
              <span class="skill-status ${st.analytics.dragAndDropCompleted >= 5 ? 'status-ready' : 'status-practice'}">
                ${st.analytics.dragAndDropCompleted >= 5 ? '✓ Ready' : 'In Practice'}
              </span>
            </div>
            <h4>Selecting & Drag and Drop</h4>
            <p class="skill-desc">Clicking answer bubbles and dragging math/reading tiles into slots.</p>
            <div class="skill-stat-row">
              <span>Items Placed:</span>
              <strong>${st.analytics.dragAndDropCompleted}</strong>
            </div>
          </div>

          <!-- Skill 4: Scrolling -->
          <div class="skill-card">
            <div class="skill-icon-header">
              <span class="skill-icon">📜</span>
              <span class="skill-status ${st.analytics.scrollPassagesCompleted >= 2 ? 'status-ready' : 'status-practice'}">
                ${st.analytics.scrollPassagesCompleted >= 2 ? '✓ Ready' : 'In Practice'}
              </span>
            </div>
            <h4>Scrolling Up and Down</h4>
            <p class="skill-desc">Reading full passages and reaching buttons placed below the screen fold.</p>
            <div class="skill-stat-row">
              <span>Passages Scrolled:</span>
              <strong>${st.analytics.scrollPassagesCompleted}</strong>
            </div>
          </div>

          <!-- Skill 5: Audio Listening -->
          <div class="skill-card">
            <div class="skill-icon-header">
              <span class="skill-icon">🎧</span>
              <span class="skill-status ${st.analytics.audioDirectionsListenedFull >= 3 ? 'status-ready' : 'status-practice'}">
                ${st.analytics.audioDirectionsListenedFull >= 3 ? '✓ Ready' : 'In Practice'}
              </span>
            </div>
            <h4>Headphone Audio Patience</h4>
            <p class="skill-desc">Listening to full spoken directions and using the speaker replay button.</p>
            <div class="skill-stat-row">
              <span>Full Audios Heard:</span>
              <strong>${st.analytics.audioDirectionsListenedFull}</strong>
            </div>
          </div>
        </div>

        <!-- Practical Teacher & Parent Advice Section -->
        <div class="coaching-advice-card">
          <h3>💡 Practical Tips for 1st Grader Home Practice:</h3>
          <div class="tips-accordion">
            <div class="tip-item">
              <div class="tip-title">🖱️ 1. Mouse vs. Trackpad Setup</div>
              <div class="tip-body">
                First graders on Chromebooks/laptops often do better when "Tap to Click" is enabled in system settings. If using a mouse, ensure mouse sensitivity isn't too high so the cursor doesn't jump quickly across the screen.
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-title">✌️ 2. The 2-Finger Scrolling Habit</div>
              <div class="tip-body">
                Teach the rhyme: <em>"Two fingers on the pad, slide them up to see what we have!"</em> Standardized tests love placing the Next button or the last question choice below the bottom edge.
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-title">⚡ 3. The "Tap-Tap" Double Click Rhythm</div>
              <div class="tip-body">
                Kids often press down and hold during double clicking, which accidentally registers as a drag. Have them practice saying "Tap-Tap" like a woodpecker.
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-title">🎧 4. Headphone Volume & Patience</div>
              <div class="tip-body">
                Have your child practice with real headphones at home. Teach them that if they didn't hear a word, they can always click the big yellow/blue 🔊 speaker button to listen again!
              </div>
            </div>
          </div>
        </div>

        <!-- Customization & Settings Panel -->
        <div class="settings-panel">
          <h3>⚙️ Settings & Customization</h3>
          <div class="settings-form">
            <div class="form-row">
              <label for="student-name-input">Child's Name:</label>
              <input type="text" id="student-name-input" value="${st.profile.name}" class="text-input" maxlength="20" />
            </div>

            <div class="form-row">
              <label>Select Avatar:</label>
              <div class="avatar-picker-row" id="avatar-picker">
                ${['🐱', '🐶', '🦄', '🐼', '🚀', '🤖', '🐲', '👑'].map(a => `
                  <button class="avatar-opt-btn ${st.profile.avatar === a ? 'selected' : ''}" data-avatar="${a}">${a}</button>
                `).join('')}
              </div>
            </div>

            <div class="form-row">
              <label for="double-click-speed">Double-Click Sensitivity Window:</label>
              <select id="double-click-speed" class="select-input">
                <option value="400" ${st.settings.doubleClickWindowMs === 400 ? 'selected' : ''}>Fast (400ms)</option>
                <option value="550" ${st.settings.doubleClickWindowMs === 550 ? 'selected' : ''}>Standard 1st Grade (550ms)</option>
                <option value="750" ${st.settings.doubleClickWindowMs === 750 ? 'selected' : ''}>Gentle / Beginner (750ms)</option>
              </select>
            </div>

            <div class="form-row checkbox-row">
              <label>
                <input type="checkbox" id="auto-speak-toggle" ${st.settings.autoReadDirections ? 'checked' : ''} />
                Automatically read test questions aloud
              </label>
            </div>

            <div class="form-actions">
              <button class="btn-action btn-primary" id="btn-save-settings">Save Settings</button>
              <button class="btn-action btn-danger" id="btn-reset-data">Reset Progress Data</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const avatarBtns = this.container.querySelectorAll('.avatar-opt-btn');
    avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        soundManager.playPop(500);
      });
    });

    const saveBtn = this.container.querySelector('#btn-save-settings');
    saveBtn.addEventListener('click', () => {
      const name = this.container.querySelector('#student-name-input').value;
      const selectedAvatar = this.container.querySelector('.avatar-opt-btn.selected')?.dataset.avatar || '🐱';
      const windowMs = parseInt(this.container.querySelector('#double-click-speed').value, 10);
      const autoSpeak = this.container.querySelector('#auto-speak-toggle').checked;

      stateManager.updateProfile(name, selectedAvatar);
      stateManager.updateSettings({
        doubleClickWindowMs: windowMs,
        autoReadDirections: autoSpeak
      });

      soundManager.playChimeSuccess();
      alert('Settings saved successfully!');
      this.render();
    });

    const resetBtn = this.container.querySelector('#btn-reset-data');
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset stars and test history?')) {
        stateManager.resetAll();
        soundManager.playSparkle();
        this.render();
      }
    });
  }

  destroy() {}
}
