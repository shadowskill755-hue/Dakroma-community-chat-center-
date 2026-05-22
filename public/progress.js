/* ═══════════════════════════════════════════════
   DAKROMA MASTER PIECE — PROGRESS SAVE SYSTEM
   Auto-saves to localStorage on every checkpoint,
   score update, leave, and page unload.
   ═══════════════════════════════════════════════ */

const Progress = (() => {
  const KEY = 'dakroma_progress_v3';

  function save(data) {
    try {
      const existing = load();
      const merged   = { ...existing, ...data, savedAt: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(merged));
    } catch(e) { console.warn('Progress save failed', e); }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  // Save profile (username, color)
  function saveProfile(username, color) {
    save({ username, color });
  }

  // Save in-game progress
  function saveGameProgress(score, checkpoint, x) {
    save({ score, checkpoint, lastX: x });
  }

  // Save best score
  function saveBestScore(score) {
    const current = load();
    if (score > (current.bestScore || 0)) {
      save({ bestScore: score });
    }
  }

  // Get everything
  function getAll() {
    return load();
  }

  // Format saved time
  function getLastSavedText() {
    const d = load();
    if (!d.savedAt) return null;
    const diff = Date.now() - d.savedAt;
    if (diff < 60000)  return 'Just now';
    if (diff < 3600000)return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return new Date(d.savedAt).toLocaleDateString();
  }

  // Auto save on page hide/close
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const d = load();
      if (d.score !== undefined) save({ autoSaved: true });
    }
  });
  window.addEventListener('beforeunload', () => {
    const d = load();
    if (d.score !== undefined) save({ autoSaved: true });
  });

  return { save, load, clear, saveProfile, saveGameProgress, saveBestScore, getAll, getLastSavedText };
})();
