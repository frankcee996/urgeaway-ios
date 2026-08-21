/* ==========================================================================
   Push — admin-to-everyone messages, via Firebase Cloud Messaging.

   This is deliberately separate from Notifications (local-only, scheduled
   on-device, never visible to anyone but the person themselves). Push
   requires a network connection and a Firebase project, and lets whoever
   controls that Firebase project broadcast a message to every device that
   has this toggle on. It's opt-in and explained as such in Settings.
   ========================================================================== */

const Push = (() => {
  function available() {
    return !!(window.CapPush && window.CapPush.PushNotifications);
  }

  async function enable() {
    if (!available()) return { ok: false, reason: 'unsupported' };
    const { PushNotifications } = window.CapPush;
    try {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return { ok: false, reason: 'denied' };
      await PushNotifications.register();
      return { ok: true };
    } catch (e) {
      console.error('Push.enable failed', e);
      return { ok: false, reason: 'error' };
    }
  }

  // No per-device "disable" call exists on most platforms once registered;
  // we just stop treating incoming pushes as something to surface, and the
  // setting itself controls whether we call enable() again on next launch.
  function disable() {
    return { ok: true };
  }

  let listening = false;
  function listen() {
    if (!available() || listening) return;
    listening = true;
    const { PushNotifications } = window.CapPush;

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error', err);
    });

    // Foreground: the OS won't automatically show a system notification
    // while the app is open, so surface it gently as an in-app toast.
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      const text = notification.title ? `${notification.title}: ${notification.body || ''}` : (notification.body || 'New message');
      if (window.App && App.toast) App.toast(text);
      if (window.Data) Data.addNotifToHistory({ id: 'push_' + (notification.id || Date.now()), title: notification.title || 'UrgeAway', body: notification.body || '' });
    });

    // Background/killed tap: open straight to the Notifications screen —
    // that's specifically what was tapped, so land there, not just Home.
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const n = (action && action.notification) || {};
      if (window.Data) Data.addNotifToHistory({ id: 'push_' + (n.id || Date.now()), title: n.title || 'UrgeAway', body: n.body || '' });
      if (window.App && App.handleNotificationTapped) App.handleNotificationTapped();
    });
  }

  // Same gap as local notifications: a push that just sits in the tray,
  // never tapped, while the app is closed never reaches either listener
  // above. Ask the OS directly what's currently delivered so it still
  // shows up in history next time the app opens.
  async function syncDelivered() {
    if (!available()) return;
    try {
      const { PushNotifications } = window.CapPush;
      const res = await PushNotifications.getDeliveredNotifications();
      const items = (res && res.notifications) || [];
      items.forEach((n) => {
        const key = n.id != null ? String(n.id) : `${n.title || ''}_${n.body || ''}`;
        if (window.Data) Data.addNotifToHistory({ id: 'push_' + key, title: n.title || 'UrgeAway', body: n.body || '' });
      });
    } catch (e) {
      console.error('Push.syncDelivered failed', e);
    }
  }

  return { available, enable, disable, listen, syncDelivered };
})();
