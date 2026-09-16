/* ==========================================================================
   App — top-level controller. Owns the current tab, overlay stack, and the
   small pieces of glue (toast, haptics) shared across screens.
   ========================================================================== */

const App = (() => {
  let currentTab = 'home';
  let overlayEl = null;
  let toastTimeout = null;
  let pendingAfterLoginGate = null;
  let authInitPromise = null;
  let initSettled = false;
  let pendingNotificationOpen = false;

  const shellEl = document.getElementById('app-shell');
  const screenContainer = document.getElementById('screen-container');
  const tabbarContainer = document.getElementById('tabbar-container');
  const overlayContainer = document.getElementById('overlay-container');
  const toastEl = document.getElementById('toast');

  async function init() {
    applyTheme();
    Data.recordAppOpen();
    // Registered as early as possible: if the app was launched (cold start)
    // by tapping a notification, the native side buffers that "tapped"
    // event until a listener exists to receive it — the earlier these are
    // attached, the more reliably that buffered event gets caught.
    if (window.Push) Push.listen();
    if (window.Notifications) Notifications.listen();
    // Kick off Auth's own init (fetches any already-signed-in user, attaches
    // the auth-state listener) in parallel with the splash animation below,
    // so by the time we decide whether to show the Login Gate we know if
    // someone's already signed in.
    if (window.Auth) authInitPromise = Auth.init();
    // Same gap for both: a notification that just sat in the tray while the
    // app was closed never reaches the foreground/tap listeners, so ask the
    // OS directly what's currently delivered — on cold launch here, and
    // again on every resume below. Fire-and-forget, but refresh Home's
    // unread badge once it actually resolves rather than leaving a stale
    // synchronous read from before the native call landed.
    syncNotificationHistory().then(() => { if (currentTab === 'home') renderTab(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncNotificationHistory().then(() => { if (currentTab === 'home') renderTab(); });
      }
    });
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderSplashScreen(async () => {
      if (authInitPromise) { try { await authInitPromise; } catch (e) { /* not signed in — fine */ } }
      maybeShowLoginGate(() => {
        if (!Data.isOnboarded()) {
          showOnboarding();
        } else {
          goToTab('home');
          // Timestamp-based, so this correctly resumes an Urge Lock session
          // that was still running when the app was last closed, instead of
          // silently dropping the person back on Home.
          UrgeLock.resumeIfActive();
          maybeShowAnalyticsPrompt();
        }
        // The normal launch flow has now decided what to show — anything
        // that tried to open the Notifications screen before this point
        // (a cold start via tapping a notification) gets honored now,
        // instead of being silently overwritten by Home/onboarding.
        initSettled = true;
        if (pendingNotificationOpen) { pendingNotificationOpen = false; openNotifications(); }
      });
    }));
  }

  // Same gap for local reminders and push: a notification that just sat in
  // the tray while the app was closed never reaches the foreground/tap
  // listeners, so ask the OS directly what's currently delivered — called
  // on cold launch, on every resume, and again right before showing the
  // Notifications screen (see openNotifications below), since the cold-
  // launch call is fire-and-forget and can still be resolving in-flight
  // when the bell is tapped moments later.
  function syncNotificationHistory() {
    const p1 = window.Notifications && Notifications.syncDelivered ? Notifications.syncDelivered() : Promise.resolve();
    const p2 = window.Push && Push.syncDelivered ? Push.syncDelivered() : Promise.resolve();
    return Promise.all([p1, p2]).catch(() => {});
  }

  // Called from the native tap listeners (local + push). If the app is
  // already up and running, open the Notifications screen immediately —
  // that's the common case (app was backgrounded, person tapped the
  // notification to bring it to front). If this fires during a cold start,
  // before the normal launch flow has settled, defer it — see init() above.
  function handleNotificationTapped() {
    if (initSettled) openNotifications();
    else pendingNotificationOpen = true;
  }

  // Shown once, before onboarding, unless the person already signed in or
  // already tapped "Skip for now" on a previous launch. Skipping is always
  // one tap away — nothing here blocks using the rest of the app.
  function maybeShowLoginGate(next) {
    const alreadySignedIn = window.Auth && Auth.available() && !!Auth.getCurrentUser();
    if (Data.isLoginPromptShown() || alreadySignedIn) {
      next();
      return;
    }
    pendingAfterLoginGate = next;
    screenContainer.innerHTML = '';
    tabbarContainer.innerHTML = '';
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderLoginGate());
  }

  function completeLoginGate() {
    overlayContainer.innerHTML = '';
    const next = pendingAfterLoginGate;
    pendingAfterLoginGate = null;
    if (next) next(); else goToTab('home');
  }

  // 'system' follows the OS light/dark setting live; 'light'/'dark' pin it.
  // The urge flow itself stays dark regardless — see styles.css note.
  function applyTheme() {
    const pref = Data.getSettings().theme || 'system';
    let resolved = pref;
    if (pref === 'system') {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (resolved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) metaTheme.setAttribute('content', resolved === 'light' ? '#faf8f4' : '#0c1626');
  }

  function showOnboarding() {
    screenContainer.innerHTML = '';
    tabbarContainer.innerHTML = '';
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderOnboarding());
  }

  function completeOnboarding() {
    overlayContainer.innerHTML = '';
    goToTab('home');
    maybeShowAnalyticsPrompt();
  }

  // Shown once, ever — see Data.isAnalyticsPromptShown(). Skipped entirely
  // if the person has already turned analytics on some other way (e.g.
  // found the Settings toggle themselves), so this never nags someone
  // who's already opted in.
  function maybeShowAnalyticsPrompt() {
    if (Data.isAnalyticsPromptShown() || Data.getAnalyticsEnabled()) return;
    overlayContainer.appendChild(renderAnalyticsPrompt((result) => {
      overlayContainer.innerHTML = '';
      if (result && result.goToPrivacy) {
        goToTab('settings', { highlightAnalytics: true });
      }
    }));
  }

  function goToTab(tab, opts) {
    currentTab = tab;
    renderTab(opts);
    tabbarContainer.innerHTML = '';
    tabbarContainer.appendChild(renderTabBar(currentTab));
  }

  function refreshTab(tab) {
    if (currentTab === tab) renderTab({ __refresh: true });
  }

  function renderTab(opts) {
    screenContainer.innerHTML = '';
    let node;
    switch (currentTab) {
      case 'home': node = renderHome(); break;
      case 'activities': node = renderActivitiesTab(); break;
      case 'progress': node = renderProgressTab(); break;
      case 'journal': node = renderJournalTab(opts); break;
      case 'settings': node = renderSettingsTab(opts); break;
      default: node = renderHome();
    }
    node.classList.add('screen-transition');
    screenContainer.appendChild(node);
  }

  function openUrgeMode() {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderUrgeMode());
  }

  function launchActivity(activity, meta) {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderActivityRunner(activity, meta || {}));
  }

  function launchDistractionLoop(meta) {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderDistractionRunner(meta || {}));
  }

  function launchUrgeLock(meta) {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(UrgeLock.renderSession(meta || {}));
  }

  function openSupport() {
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderSupportScreen());
  }

  function openAccount() {
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderAccountScreen());
  }

  function openUserDashboard() {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderUserDashboard());
  }

  function openLockInMode() {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderLockInMode());
  }

  function openNotifications() {
    haptic();
    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(renderNotificationsScreen());
  }

  function closeOverlay() {
    overlayContainer.innerHTML = '';
    // reflect any new data (streaks, sessions) on the visible tab
    renderTab();
  }

  function toast(message) {
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  function haptic() {
    const settings = Data.getSettings();
    if (settings.haptics && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(12);
    }
  }

  // One-tap reach out: opens the configured platform with the message
  // already typed in. The person still has to tap send themselves.
  function triggerReachOut() {
    const contact = Data.getReachOutContact();
    if (!contact || !contact.identifier) {
      toast('Set up a contact in Settings first');
      goToTab('settings', { highlightReachOut: true });
      return false;
    }
    const message = encodeURIComponent(contact.message || "Having a hard moment right now — could use a distraction.");
    let url;
    if (contact.platform === 'whatsapp') {
      const digits = contact.identifier.replace(/[^\d]/g, '');
      url = `https://wa.me/${digits}?text=${message}`;
    } else if (contact.platform === 'telegram') {
      const username = contact.identifier.replace(/^@/, '');
      url = `https://t.me/${username}?text=${message}`;
    } else {
      url = `sms:${contact.identifier}?body=${message}`;
    }
    haptic();
    window.open(url, '_system');
    return true;
  }

  return {
    init,
    goToTab,
    refreshTab,
    openUrgeMode,
    launchActivity,
    launchDistractionLoop,
    launchUrgeLock,
    openSupport,
    openAccount,
    openUserDashboard,
    openLockInMode,
    openNotifications,
    handleNotificationTapped,
    syncNotificationHistory,
    triggerReachOut,
    applyTheme,
    closeOverlay,
    completeOnboarding,
    completeLoginGate,
    toast,
    haptic,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (Data.getSettings().theme === 'system') App.applyTheme();
  });
}
