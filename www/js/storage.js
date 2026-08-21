/* ==========================================================================
   Storage — thin wrapper around localStorage.
   Everything UrgeAway knows about a person lives only on their device.
   Nothing here ever leaves via network; there is no network code at all.
   ========================================================================== */

const Storage = (() => {
  const PREFIX = 'urgeaway:';

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Storage.get failed', key, e);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage.set failed', key, e);
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  }

  return { get, set, remove, clearAll };
})();

/* ---------- Domain-level helpers built on top of Storage ---------- */

const Data = (() => {
  const KEYS = {
    ONBOARDED: 'onboarded',
    SETTINGS: 'settings',
    SESSIONS: 'sessions',       // completed activity sessions
    JOURNAL: 'journal',         // journal entries
    STREAK: 'streak',
    PREFERRED_ACTIVITIES: 'preferred_activities', // from onboarding
    REMINDERS: 'custom_reminders', // user-set "for when the urge tends to hit" alarms
    REACH_OUT: 'reach_out_contact',
    REASONS: 'my_reasons',
    STREAK_PROTECTING: 'streak_protecting',
    LOGIN_PROMPT_SHOWN: 'login_prompt_shown',
    NOTIF_PERMISSION_ASKED: 'notif_permission_asked',
    NOTIF_BANNER_SHOWN: 'notif_banner_shown',
    APP_OPENS: 'app_opens', // { totalDays, lastDate } — distinct days the app was opened
    URGE_LOCK_SESSION: 'urge_lock_session', // the current/most recent Urge Lock session
    URGE_LOCK_SETUP_DONE: 'urge_lock_setup_done', // been through the Screen Pinning setup flow at least once
    PROFILE_NAME: 'profile_name',
    PROFILE_PIC: 'profile_pic', // base64 data URL, stored locally only — never uploaded
    NOTIF_HISTORY: 'notif_history', // last 10 { id, title, body, ts }, newest first
    NOTIF_LAST_VIEWED: 'notif_last_viewed', // timestamp the notification bell page was last opened
  };

  // Urge Lock duration mapping — intensity determines duration, never a
  // manual choice. 1-6 don't reach this map at all (no lock).
  const URGE_LOCK_DURATIONS_SEC = { 7: 5 * 60, 8: 8 * 60, 9: 12 * 60, 10: 15 * 60 };

  const defaultSettings = {
    notificationsEnabled: false,
    haptics: true,
    pushEnabled: false,
    theme: 'system', // 'system' | 'light' | 'dark'
  };

  function isOnboarded() {
    return !!Storage.get(KEYS.ONBOARDED, false);
  }
  function setOnboarded(prefs) {
    Storage.set(KEYS.ONBOARDED, true);
    if (prefs) Storage.set(KEYS.PREFERRED_ACTIVITIES, prefs);
  }

  function getSettings() {
    return Object.assign({}, defaultSettings, Storage.get(KEYS.SETTINGS, {}));
  }
  function setSettings(patch) {
    const merged = Object.assign({}, getSettings(), patch);
    Storage.set(KEYS.SETTINGS, merged);
    return merged;
  }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  // A "session" is one completed activity: { id, activityId, category, date(iso), durationSec, outcome, fromUrgeMode }
  function getSessions() {
    return Storage.get(KEYS.SESSIONS, []);
  }
  function addSession(session) {
    const sessions = getSessions();
    const entry = Object.assign(
      { id: 'sess_' + Date.now() + '_' + Math.floor(Math.random() * 1000), date: new Date().toISOString() },
      session
    );
    sessions.push(entry);
    Storage.set(KEYS.SESSIONS, sessions);
    updateStreak();
    return entry;
  }

  function getTodaySessions() {
    const today = todayStr();
    return getSessions().filter((s) => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` === today;
    });
  }

  function getUrgeSessionsToday() {
    return getTodaySessions().filter((s) => s.fromUrgeMode);
  }

  function updateStreak() {
    const streak = Storage.get(KEYS.STREAK, { count: 0, lastDate: null });
    const today = todayStr();
    if (streak.lastDate === today) return streak; // already counted today
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    })();
    if (streak.lastDate === yesterday) {
      streak.count += 1;
    } else {
      streak.count = 1;
    }
    streak.lastDate = today;
    Storage.set(KEYS.STREAK, streak);
    return streak;
  }
  function getStreak() {
    const s = Storage.get(KEYS.STREAK, { count: 0, lastDate: null });
    // if last active day isn't today or yesterday, streak is effectively broken but we
    // don't zero it destructively here — just report it plainly, no shaming.
    return s;
  }

  // How many distinct days someone has opened the app at all — "showing up"
  // counts toward Resistance Level even on days with no logged session.
  function recordAppOpen() {
    const rec = Storage.get(KEYS.APP_OPENS, { totalDays: 0, lastDate: null });
    const today = todayStr();
    if (rec.lastDate === today) return rec; // already counted today
    rec.totalDays += 1;
    rec.lastDate = today;
    Storage.set(KEYS.APP_OPENS, rec);
    return rec;
  }
  function getAppOpens() {
    return Storage.get(KEYS.APP_OPENS, { totalDays: 0, lastDate: null });
  }

  // Journal: { id, date(iso), prompt, text }
  function getJournalEntries() {
    return Storage.get(KEYS.JOURNAL, []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  function addJournalEntry(prompt, text) {
    const entries = Storage.get(KEYS.JOURNAL, []);
    const entry = { id: 'jrnl_' + Date.now(), date: new Date().toISOString(), prompt, text };
    entries.push(entry);
    Storage.set(KEYS.JOURNAL, entries);
    return entry;
  }
  function deleteJournalEntry(id) {
    const entries = Storage.get(KEYS.JOURNAL, []).filter((e) => e.id !== id);
    Storage.set(KEYS.JOURNAL, entries);
  }

  function isLoginPromptShown() {
    return !!Storage.get(KEYS.LOGIN_PROMPT_SHOWN, false);
  }
  function setLoginPromptShown() {
    Storage.set(KEYS.LOGIN_PROMPT_SHOWN, true);
  }

  // One-tap reach out: a trusted contact configured once, used during a hard
  // moment to open a pre-filled message with a single tap.
  function getReachOutContact() {
    return Storage.get(KEYS.REACH_OUT, null); // { platform, identifier, message }
  }
  function setReachOutContact(contact) {
    Storage.set(KEYS.REACH_OUT, contact);
  }

  // My Reasons: written once, in a calm moment, shown back during an urge.
  function getReasons() {
    return Storage.get(KEYS.REASONS, []);
  }
  function addReason(text) {
    const list = getReasons();
    list.push(text);
    Storage.set(KEYS.REASONS, list);
    return list;
  }
  function deleteReason(index) {
    const list = getReasons();
    list.splice(index, 1);
    Storage.set(KEYS.REASONS, list);
    return list;
  }

  // What the streak represents, in the person's own words.
  function getStreakProtecting() {
    return Storage.get(KEYS.STREAK_PROTECTING, '');
  }
  function setStreakProtecting(text) {
    Storage.set(KEYS.STREAK_PROTECTING, text);
  }

  function isNotifPermissionAsked() {
    return !!Storage.get(KEYS.NOTIF_PERMISSION_ASKED, false);
  }
  function setNotifPermissionAsked() {
    Storage.set(KEYS.NOTIF_PERMISSION_ASKED, true);
  }
  function isNotifBannerShown() {
    return !!Storage.get(KEYS.NOTIF_BANNER_SHOWN, false);
  }
  function setNotifBannerShown() {
    Storage.set(KEYS.NOTIF_BANNER_SHOWN, true);
  }

  // Personal reminders: a person-set alarm for a time an urge tends to hit,
  // carrying their own message to themselves.
  // { id, hour, minute, message, repeatDaily, enabled, createdAt }
  function getReminders() {
    return Storage.get(KEYS.REMINDERS, []).sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  }
  function addReminder(reminder) {
    const list = Storage.get(KEYS.REMINDERS, []);
    const entry = Object.assign(
      { id: 'rem_' + Date.now(), enabled: true, createdAt: new Date().toISOString() },
      reminder
    );
    list.push(entry);
    Storage.set(KEYS.REMINDERS, list);
    return entry;
  }
  function updateReminder(id, patch) {
    const list = Storage.get(KEYS.REMINDERS, []).map((r) => (r.id === id ? Object.assign({}, r, patch) : r));
    Storage.set(KEYS.REMINDERS, list);
    return list.find((r) => r.id === id);
  }
  function deleteReminder(id) {
    const list = Storage.get(KEYS.REMINDERS, []).filter((r) => r.id !== id);
    Storage.set(KEYS.REMINDERS, list);
  }

  // Simple personalization: which activity has the best "helpful" ratio, used >= 2 times
  function getRecommendedActivity(allActivities) {
    const sessions = getSessions();
    const byActivity = {};
    sessions.forEach((s) => {
      if (!byActivity[s.activityId]) byActivity[s.activityId] = { total: 0, helpful: 0 };
      byActivity[s.activityId].total += 1;
      if (s.outcome === 'better' || s.outcome === 'a_little_better') {
        byActivity[s.activityId].helpful += 1;
      }
    });
    let best = null;
    let bestScore = 0;
    Object.keys(byActivity).forEach((id) => {
      const stat = byActivity[id];
      if (stat.total < 2) return;
      const score = stat.helpful / stat.total;
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    });
    if (!best) return null;
    return allActivities.find((a) => a.id === best) || null;
  }

  function getStats() {
    const sessions = getSessions();
    const urgeSessions = sessions.filter((s) => s.fromUrgeMode);
    const byActivity = {};
    sessions.forEach((s) => {
      byActivity[s.activityId] = (byActivity[s.activityId] || 0) + 1;
    });
    const mostUsed = Object.entries(byActivity).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const helpfulCounts = {};
    sessions.forEach((s) => {
      if (s.outcome === 'better' || s.outcome === 'a_little_better') {
        helpfulCounts[s.activityId] = (helpfulCounts[s.activityId] || 0) + 1;
      }
    });
    const mostHelpful = Object.entries(helpfulCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      totalSessions: sessions.length,
      totalUrgeSessions: urgeSessions.length,
      mostUsed,
      mostHelpful,
    };
  }

  // Resistance Level: a numeric growth stat — points, not stars. It's built
  // from three things, so it climbs slowly and steadily just from staying
  // engaged, not only from logging urge sessions:
  //   1) distinct days you've opened the app at all (showing up counts)
  //   2) your current day streak (consistency)
  //   3) how your logged urge sessions went (a smaller bonus on top)
  const RESISTANCE_TIERS = [
    { level: 1, min: 0, name: 'Getting Started' },
    { level: 2, min: 15, name: 'Building Resistance' },
    { level: 3, min: 40, name: 'Steady' },
    { level: 4, min: 80, name: 'Resilient' },
    { level: 5, min: 140, name: 'Strong' },
    { level: 6, min: 220, name: 'Unshakeable' },
  ];
  function getResistanceStats() {
    const urgeSessions = getSessions().filter((s) => s.fromUrgeMode);
    let outcomePoints = 0;
    let resistedCount = 0;
    urgeSessions.forEach((s) => {
      if (s.outcome === 'better') { outcomePoints += 3; resistedCount += 1; }
      else if (s.outcome === 'a_little_better') { outcomePoints += 2; resistedCount += 1; }
      else if (s.outcome === 'still_need_help') { outcomePoints += 1; }
      // resisting despite reporting high intensity counts extra
      if (s.intensity && s.intensity >= 7 && (s.outcome === 'better' || s.outcome === 'a_little_better')) outcomePoints += 1;
    });

    const streak = getStreak();
    const appOpens = getAppOpens();
    // 1 point per distinct day opened + 1 point per day of current streak —
    // deliberately small and steady, like resistance actually builds over time.
    const points = appOpens.totalDays + streak.count + outcomePoints;

    let current = RESISTANCE_TIERS[0];
    let next = RESISTANCE_TIERS[1] || null;
    for (let i = 0; i < RESISTANCE_TIERS.length; i++) {
      if (points >= RESISTANCE_TIERS[i].min) {
        current = RESISTANCE_TIERS[i];
        next = RESISTANCE_TIERS[i + 1] || null;
      }
    }
    const progressToNext = next ? Math.min(1, (points - current.min) / (next.min - current.min)) : 1;
    const percentResisted = urgeSessions.length ? Math.round((resistedCount / urgeSessions.length) * 100) : 0;
    return {
      points,
      level: current.level,
      levelName: current.name,
      nextLevelName: next ? next.name : null,
      pointsToNext: next ? next.min - points : 0,
      progressToNext,
      percentResisted,
      totalUrgeSessions: urgeSessions.length,
      appOpenDays: appOpens.totalDays,
      streakDays: streak.count,
    };
  }

  /* ---------- Urge Lock ---------- */
  // Timestamp-based so remaining time is always computed as endTime -
  // currentTime, not tracked by an in-memory countdown — this way a
  // recreated Activity (rotation, OS reclaiming memory, etc.) just
  // recomputes the same remaining time instead of resetting the timer.
  function getUrgeLockDurationSec(intensity) {
    return URGE_LOCK_DURATIONS_SEC[intensity] || null;
  }

  function startUrgeLockSession(intensity) {
    const durationSec = getUrgeLockDurationSec(intensity);
    if (!durationSec) return null;
    const startTime = Date.now();
    const session = {
      id: 'ulock_' + startTime,
      intensity,
      durationSec,
      startTime,
      endTime: startTime + durationSec * 1000,
      status: 'active', // 'active' | 'completed'
      feeling: null, // 'better' | 'still_having_urge' | 'urge_gone', set on completion
    };
    Storage.set(KEYS.URGE_LOCK_SESSION, session);
    return session;
  }
  function getUrgeLockSession() {
    return Storage.get(KEYS.URGE_LOCK_SESSION, null);
  }
  function updateUrgeLockSession(patch) {
    const session = getUrgeLockSession();
    if (!session) return null;
    const merged = Object.assign({}, session, patch);
    Storage.set(KEYS.URGE_LOCK_SESSION, merged);
    return merged;
  }
  function completeUrgeLockSession(feeling) {
    return updateUrgeLockSession({ status: 'completed', feeling: feeling || null });
  }
  function clearUrgeLockSession() {
    Storage.remove(KEYS.URGE_LOCK_SESSION);
  }
  function isUrgeLockSetupDone() {
    return !!Storage.get(KEYS.URGE_LOCK_SETUP_DONE, false);
  }
  function setUrgeLockSetupDone() {
    Storage.set(KEYS.URGE_LOCK_SETUP_DONE, true);
  }

  /* ---------- Profile (local-only) ---------- */
  function getProfileName() {
    return Storage.get(KEYS.PROFILE_NAME, '');
  }
  function setProfileName(name) {
    Storage.set(KEYS.PROFILE_NAME, String(name || '').trim().slice(0, 40));
  }
  function getProfilePic() {
    return Storage.get(KEYS.PROFILE_PIC, null);
  }
  function setProfilePic(dataUrl) {
    Storage.set(KEYS.PROFILE_PIC, dataUrl);
  }
  function clearProfilePic() {
    Storage.remove(KEYS.PROFILE_PIC);
  }

  /* ---------- Notification history (local-only, capped at 10) ---------- */
  const NOTIF_HISTORY_MAX = 10;
  function addNotifToHistory(entry) {
    const list = Storage.get(KEYS.NOTIF_HISTORY, []);
    const id = (entry && entry.id) || ('notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    if (list.some((x) => x.id === id)) return null; // already logged — e.g. tray-sync saw one the listener already caught
    const item = {
      id,
      title: (entry && entry.title) || 'UrgeAway',
      body: (entry && entry.body) || '',
      ts: (entry && entry.ts) || Date.now(),
    };
    list.unshift(item);
    if (list.length > NOTIF_HISTORY_MAX) list.length = NOTIF_HISTORY_MAX;
    Storage.set(KEYS.NOTIF_HISTORY, list);
    return item;
  }
  function getNotifHistory() {
    return Storage.get(KEYS.NOTIF_HISTORY, []);
  }
  function clearNotifHistory() {
    Storage.set(KEYS.NOTIF_HISTORY, []);
  }
  function getNotifLastViewed() {
    return Storage.get(KEYS.NOTIF_LAST_VIEWED, 0);
  }
  function markNotifViewed() {
    Storage.set(KEYS.NOTIF_LAST_VIEWED, Date.now());
  }
  function getUnreadNotifCount() {
    const lastViewed = getNotifLastViewed();
    return getNotifHistory().filter((n) => n.ts > lastViewed).length;
  }

  function exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      sessions: getSessions(),
      journal: getJournalEntries(),
      streak: getStreak(),
      settings: getSettings(),
    };
  }

  function clearAllData() {
    Storage.clearAll();
  }

  return {
    KEYS,
    isOnboarded,
    setOnboarded,
    getSettings,
    setSettings,
    getSessions,
    addSession,
    getTodaySessions,
    getUrgeSessionsToday,
    getStreak,
    recordAppOpen,
    getAppOpens,
    getJournalEntries,
    addJournalEntry,
    deleteJournalEntry,
    getReminders,
    addReminder,
    updateReminder,
    deleteReminder,
    getReachOutContact,
    setReachOutContact,
    getReasons,
    addReason,
    deleteReason,
    getStreakProtecting,
    setStreakProtecting,
    isLoginPromptShown,
    setLoginPromptShown,
    isNotifPermissionAsked,
    setNotifPermissionAsked,
    isNotifBannerShown,
    setNotifBannerShown,
    getRecommendedActivity,
    getStats,
    getResistanceStats,
    exportAll,
    clearAllData,
    todayStr,
    getUrgeLockDurationSec,
    startUrgeLockSession,
    getUrgeLockSession,
    updateUrgeLockSession,
    completeUrgeLockSession,
    clearUrgeLockSession,
    isUrgeLockSetupDone,
    setUrgeLockSetupDone,
    getProfileName,
    setProfileName,
    getProfilePic,
    setProfilePic,
    clearProfilePic,
    addNotifToHistory,
    getNotifHistory,
    clearNotifHistory,
    getNotifLastViewed,
    markNotifViewed,
    getUnreadNotifCount,
  };
})();
