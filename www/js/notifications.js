/* ==========================================================================
   Notifications — thin wrapper around the native LocalNotifications plugin
   (exposed on window.CapNotifications by the CI-built notifications-bundle.js).
   Falls back gracefully when running in a plain browser preview, where no
   native bridge exists.
   ========================================================================== */

const Notifications = (() => {
  const REMINDER_ID = 8801;
  const CHANNEL_ID = 'urgeaway_reminders';

  // Matches the brief's own example copy — supportive, non-specific,
  // safe to show on a lock screen.
  const MESSAGES = [
    'A small reset can change the next few minutes.',
    'You can always take the next few minutes one step at a time.',
    'Take a moment for yourself today.',
  ];

  function available() {
    return !!(window.CapNotifications && window.CapNotifications.LocalNotifications);
  }

  // Without an explicit channel, Android puts local notifications on a
  // generic "default" one whose importance varies by OEM/version — on some
  // devices that means it lands in the tray silently with no heads-up
  // banner and no sound, which is very easy to mistake for "nothing was
  // delivered at all" while testing. Force HIGH importance explicitly.
  let channelReady = false;
  async function ensureChannel() {
    if (!available() || channelReady) return;
    const { LocalNotifications } = window.CapNotifications;
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'UrgeAway Reminders',
        description: 'Daily nudges and personal reminders from UrgeAway',
        importance: 5, // IMPORTANCE_HIGH — heads-up banner + sound
        visibility: 1,
      });
      channelReady = true;
    } catch (e) {
      console.error('Notifications.ensureChannel failed', e);
    }
  }

  async function enable() {
    if (!available()) {
      return { ok: false, reason: 'unsupported' };
    }
    const { LocalNotifications } = window.CapNotifications;
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        return { ok: false, reason: 'denied' };
      }
      await ensureChannel();
      const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_ID,
            title: 'UrgeAway',
            body: message,
            channelId: CHANNEL_ID,
            // repeats daily at 10:00 — no minute-level tracking of the
            // person's actual state, nothing sensitive on the lock screen
            schedule: { on: { hour: 10, minute: 0 }, allowWhileIdle: true },
          },
        ],
      });
      return { ok: true };
    } catch (e) {
      console.error('Notifications.enable failed', e);
      return { ok: false, reason: 'error' };
    }
  }

  async function disable() {
    if (!available()) return { ok: true };
    try {
      const { LocalNotifications } = window.CapNotifications;
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
      return { ok: true };
    } catch (e) {
      console.error('Notifications.disable failed', e);
      return { ok: false };
    }
  }

  // Stable positive int ID for the OS scheduler, derived from a reminder's
  // string id — so re-scheduling the same reminder (e.g. after editing)
  // always replaces the same underlying OS notification instead of stacking.
  function hashId(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return (Math.abs(h) % 1000000000) + 2000; // offset clear of REMINDER_ID
  }

  async function requestPermission() {
    if (!available()) return false;
    const { LocalNotifications } = window.CapNotifications;
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }

  // A personal, user-authored reminder — "for when the urge tends to hit."
  // repeatDaily: fires every day at hour:minute.
  // otherwise: fires once, at the next upcoming occurrence of hour:minute.
  async function scheduleReminder(reminder) {
    if (!available()) return { ok: false, reason: 'unsupported' };
    const { LocalNotifications } = window.CapNotifications;
    try {
      const granted = await requestPermission();
      if (!granted) return { ok: false, reason: 'denied' };
      await ensureChannel();

      const id = hashId(reminder.id);
      const schedule = reminder.repeatDaily
        ? { on: { hour: reminder.hour, minute: reminder.minute }, allowWhileIdle: true }
        : { at: nextOccurrence(reminder.hour, reminder.minute), allowWhileIdle: true };

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: 'UrgeAway',
            body: reminder.message,
            channelId: CHANNEL_ID,
            schedule,
          },
        ],
      });
      return { ok: true };
    } catch (e) {
      console.error('Notifications.scheduleReminder failed', e);
      return { ok: false, reason: 'error' };
    }
  }

  async function cancelReminder(reminder) {
    if (!available()) return { ok: true };
    try {
      const { LocalNotifications } = window.CapNotifications;
      await LocalNotifications.cancel({ notifications: [{ id: hashId(reminder.id) }] });
      return { ok: true };
    } catch (e) {
      console.error('Notifications.cancelReminder failed', e);
      return { ok: false };
    }
  }

  function nextOccurrence(hour, minute) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  // Records what actually reached the device into the local notification
  // history shown on the Dashboard/bell (capped at 10 there). Both
  // "received" (foreground) and "tapped" (background/killed) cases feed
  // the same log, using a deterministic id so re-firing the same
  // notification never duplicates an entry.
  let listening = false;
  function listen() {
    if (!available() || listening) return;
    listening = true;
    const { LocalNotifications } = window.CapNotifications;
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      if (window.Data) Data.addNotifToHistory({ id: 'local_' + notification.id, title: notification.title || 'UrgeAway', body: notification.body || '' });
    });
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const n = (action && action.notification) || {};
      if (window.Data) Data.addNotifToHistory({ id: 'local_' + n.id, title: n.title || 'UrgeAway', body: n.body || '' });
      if (window.App && App.handleNotificationTapped) App.handleNotificationTapped();
    });
  }

  // The two listeners above only fire while the app is open (foreground) or
  // when a notification is tapped — a notification that just sits in the
  // tray, never tapped, while the app is closed never reaches either one.
  // This asks Android directly what's currently in the tray, so it still
  // shows up in history the next time the app is opened.
  async function syncDelivered() {
    if (!available()) return;
    try {
      const { LocalNotifications } = window.CapNotifications;
      const res = await LocalNotifications.getDeliveredNotifications();
      const items = (res && res.notifications) || [];
      items.forEach((n) => {
        if (window.Data) Data.addNotifToHistory({ id: 'local_' + n.id, title: n.title || 'UrgeAway', body: n.body || '' });
      });
    } catch (e) {
      console.error('Notifications.syncDelivered failed', e);
    }
  }

  return { available, enable, disable, scheduleReminder, cancelReminder, requestPermission, listen, syncDelivered };
})();
