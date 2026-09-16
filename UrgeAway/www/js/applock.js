/* ==========================================================================
   AppLock — thin wrapper around the native AppLock plugin (exposed on
   window.CapAppLock by the CI-built applock-bundle.js) for Lock In Mode.
   Android-only, same as Screen Pinning — falls back to "unavailable"
   gracefully in a plain browser preview or on iOS, where none of this
   exists. Lock In Mode's UI (lockinmode.js) checks available() and shows
   an honest "not supported on this device" state instead of a broken flow.
   ========================================================================== */

const AppLock = (() => {
  function available() {
    return !!(window.CapAppLock && window.CapAppLock.AppLock) && !(window.isIOS && isIOS());
  }

  async function getInstalledApps() {
    if (!available()) return [];
    try {
      const res = await window.CapAppLock.AppLock.getInstalledApps();
      return (res && res.apps) || [];
    } catch (e) {
      console.error('AppLock.getInstalledApps failed', e);
      return [];
    }
  }

  async function getLockedApps() {
    if (!available()) return [];
    try {
      const res = await window.CapAppLock.AppLock.getLockedApps();
      return (res && res.locks) || [];
    } catch (e) {
      console.error('AppLock.getLockedApps failed', e);
      return [];
    }
  }

  // packages: string[] of package names. unlockAt: epoch millis timestamp.
  // Returns { ok, locked, error } — the caller (lockinmode.js) checks `ok`
  // before telling the person it worked. Previously this swallowed any
  // native failure and returned a fake-looking { locked: 0 }, which is why
  // "Locked in" could show up even when nothing actually got locked.
  async function lockApps(packages, unlockAt) {
    if (!available()) return { ok: false, locked: 0, error: 'unavailable' };
    try {
      const res = await window.CapAppLock.AppLock.lockApps({ packages, unlockAt });
      const locked = (res && res.locked) || 0;
      return { ok: locked > 0, locked };
    } catch (e) {
      console.error('AppLock.lockApps failed', e);
      return { ok: false, locked: 0, error: (e && e.message) || String(e) };
    }
  }

  async function isAccessibilityEnabled() {
    if (!available()) return false;
    try {
      const res = await window.CapAppLock.AppLock.isAccessibilityEnabled();
      return !!(res && res.enabled);
    } catch (e) {
      return false;
    }
  }

  async function openAccessibilitySettings() {
    if (!available()) return false;
    try {
      await window.CapAppLock.AppLock.openAccessibilitySettings();
      return true;
    } catch (e) {
      console.error('AppLock.openAccessibilitySettings failed', e);
      return false;
    }
  }

  async function openAppInfoSettings() {
    if (!available()) return false;
    try {
      await window.CapAppLock.AppLock.openAppInfoSettings();
      return true;
    } catch (e) {
      console.error('AppLock.openAppInfoSettings failed', e);
      return false;
    }
  }

  return {
    available,
    getInstalledApps,
    getLockedApps,
    lockApps,
    isAccessibilityEnabled,
    openAccessibilitySettings,
    openAppInfoSettings,
  };
})();
