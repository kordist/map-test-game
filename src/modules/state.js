/**
 * Persistent State Manager for Laptop Quest
 * Stores progress, stars, stickers, test scores, and parent settings in LocalStorage.
 */

const STORAGE_KEY = 'laptop_hero_state_v1';

const DEFAULT_STATE = {
  profile: {
    name: 'Hero',
    avatar: '🐱',
    level: 1,
    stars: 0,
    createdDate: new Date().toISOString()
  },
  skills: {
    cursor: { completedCount: 0, stars: 0, highStreak: 0 },
    click: { completedCount: 0, stars: 0, doubleClickAvgMs: 380, doubleClickAccuracy: 100 },
    drag: { completedCount: 0, stars: 0, itemsPlaced: 0 },
    scroll: { completedCount: 0, stars: 0, depthsExplored: 0 },
    listen: { completedCount: 0, stars: 0, listenedEntirelyCount: 0 }
  },
  stickers: [
    { id: 'star_1', icon: '⭐', name: 'Super Star', unlocked: true, x: 80, y: 120 },
    { id: 'cat_1', icon: '🐱', name: 'Playful Kitten', unlocked: true, x: 220, y: 150 },
    { id: 'dragon_1', icon: '🐲', name: 'Baby Dragon', unlocked: false, x: 360, y: 130 },
    { id: 'trophy_1', icon: '🏆', name: 'Golden Trophy', unlocked: false, x: 500, y: 140 },
    { id: 'sparkles_1', icon: '✨', name: 'Magic Sparkles', unlocked: false, x: 150, y: 260 },
    { id: 'rocket_1', icon: '🚀', name: 'Rocket Ship', unlocked: false, x: 300, y: 280 },
    { id: 'rainbow_1', icon: '🌈', name: 'Happy Rainbow', unlocked: false, x: 450, y: 270 },
    { id: 'medal_1', icon: '🥇', name: '1st Grade Champion', unlocked: false, x: 260, y: 80 }
  ],
  testHistory: [],
  settings: {
    doubleClickWindowMs: 550, // generous for 1st graders
    autoReadDirections: true,
    soundEffectsEnabled: true,
    cursorTrailEnabled: true,
    arenaSize: 'desktop', // 'standard' (tablet/small) | 'desktop' (large PC arena)
    theme: 'sunny'
  },
  analytics: {
    totalSessions: 1,
    totalMinutesPracticed: 0,
    doubleClicksAttempted: 0,
    doubleClicksSuccessful: 0,
    scrollPassagesCompleted: 0,
    audioDirectionsListenedFull: 0,
    dragAndDropCompleted: 0
  }
};

class StateManager {
  constructor() {
    this.state = this.load();
    this.listeners = [];
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('hailey_laptop_quest_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const loaded = { ...DEFAULT_STATE, ...parsed };
        if (loaded.profile && loaded.profile.name === 'Hailey') {
          loaded.profile.name = 'Hero';
        }
        return loaded;
      }
    } catch (e) {
      console.warn('Could not load saved state, using defaults', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.warn('Could not save state to localStorage', e);
    }
  }

  get() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  addStars(amount, reason = '') {
    this.state.profile.stars += amount;
    this.checkStickerUnlocks();
    this.save();
  }

  updateProfile(name, avatar) {
    if (name) this.state.profile.name = name.trim();
    if (avatar) this.state.profile.avatar = avatar;
    this.save();
  }

  recordSkillProgress(skillKey, { stars = 1, statUpdates = {} } = {}) {
    if (this.state.skills[skillKey]) {
      this.state.skills[skillKey].completedCount += 1;
      this.state.skills[skillKey].stars += stars;
      Object.assign(this.state.skills[skillKey], statUpdates);
    }
    this.addStars(stars, `Completed ${skillKey} practice`);
    this.save();
  }

  recordDoubleClickAttempt(success, deltaMs = 0) {
    this.state.analytics.doubleClicksAttempted += 1;
    if (success) {
      this.state.analytics.doubleClicksSuccessful += 1;
      const prevAvg = this.state.skills.click.doubleClickAvgMs || 400;
      this.state.skills.click.doubleClickAvgMs = Math.round((prevAvg * 0.7) + (deltaMs * 0.3));
    }
    const rate = Math.round((this.state.analytics.doubleClicksSuccessful / this.state.analytics.doubleClicksAttempted) * 100);
    this.state.skills.click.doubleClickAccuracy = rate;
    this.save();
  }

  recordScrollPassage() {
    this.state.analytics.scrollPassagesCompleted += 1;
    this.state.skills.scroll.depthsExplored += 1;
    this.save();
  }

  recordAudioListenedFull() {
    this.state.analytics.audioDirectionsListenedFull += 1;
    this.state.skills.listen.listenedEntirelyCount += 1;
    this.save();
  }

  recordDragPlaced() {
    this.state.analytics.dragAndDropCompleted += 1;
    this.state.skills.drag.itemsPlaced += 1;
    this.save();
  }

  recordTestResult(result) {
    const entry = {
      date: new Date().toISOString(),
      score: result.score,
      total: result.total,
      percentage: Math.round((result.score / result.total) * 100),
      skillBreakdown: result.skillBreakdown || {}
    };
    this.state.testHistory.unshift(entry);
    if (this.state.testHistory.length > 20) {
      this.state.testHistory.pop();
    }
    this.addStars(result.score * 2, 'MAP Test Simulator Completion');
    this.checkStickerUnlocks();
    this.save();
    return entry;
  }

  checkStickerUnlocks() {
    const stars = this.state.profile.stars;
    const s = this.state.stickers;
    if (stars >= 5 && !s[2].unlocked) s[2].unlocked = true; // dragon
    if (stars >= 12 && !s[3].unlocked) s[3].unlocked = true; // trophy
    if (stars >= 20 && !s[4].unlocked) s[4].unlocked = true; // sparkles
    if (stars >= 30 && !s[5].unlocked) s[5].unlocked = true; // rocket
    if (stars >= 45 && !s[6].unlocked) s[6].unlocked = true; // rainbow
    if (stars >= 60 && !s[7].unlocked) s[7].unlocked = true; // medal
  }

  updateStickerPosition(id, x, y) {
    const sticker = this.state.stickers.find(s => s.id === id);
    if (sticker) {
      sticker.x = x;
      sticker.y = y;
      this.save();
    }
  }

  setArenaSize(size) {
    if (size !== 'standard' && size !== 'desktop') size = 'desktop';
    this.state.settings.arenaSize = size;
    if (typeof document !== 'undefined') {
      if (size === 'desktop') {
        document.body.classList.add('arena-desktop');
        document.body.classList.remove('arena-standard');
      } else {
        document.body.classList.add('arena-standard');
        document.body.classList.remove('arena-desktop');
      }
    }
    this.save();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arenasizechange', { detail: { size } }));
      window.dispatchEvent(new Event('resize'));
    }
  }

  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    if (newSettings.arenaSize) {
      this.setArenaSize(newSettings.arenaSize);
    } else {
      this.save();
    }
  }

  getReadinessScore() {
    // Computes overall MAP readiness percentage based on all 5 key skills
    const c = this.state.skills.cursor.completedCount > 0 ? 20 : 0;
    const cl = (this.state.analytics.doubleClicksSuccessful >= 3) ? 20 : Math.min(15, this.state.analytics.doubleClicksSuccessful * 5);
    const d = (this.state.analytics.dragAndDropCompleted >= 4) ? 20 : Math.min(15, this.state.analytics.dragAndDropCompleted * 4);
    const sc = (this.state.analytics.scrollPassagesCompleted >= 2) ? 20 : Math.min(15, this.state.analytics.scrollPassagesCompleted * 10);
    const li = (this.state.analytics.audioDirectionsListenedFull >= 3) ? 20 : Math.min(15, this.state.analytics.audioDirectionsListenedFull * 6);
    return Math.min(100, c + cl + d + sc + li);
  }

  resetAll() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }
}

export const stateManager = new StateManager();
