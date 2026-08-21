/* ==========================================================================
   ScreenPinning — thin wrapper around the native ScreenPinning plugin
   (exposed on window.CapScreenPinning by the CI-built screenpinning-bundle.js).
   Falls back gracefully when running in a plain browser preview or on any
   build where the plugin isn't present: Urge Lock's timer and distraction
   still run, the phone just won't be pinned to the app.

   The native plugin resolves the SAME { started, reason } / { pinned }
   shapes on both platforms, so nothing here branches on platform — only
   the user-facing copy in urgelock.js / screens.js does, via Platform.isIOS().
   ========================================================================== */

const Platform = (() => {
  function isIOS() {
    try {
      return !!(window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() === 'ios');
    } catch (e) {
      return false;
    }
  }
  function isAndroid() {
    try {
      return !!(window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() === 'android');
    } catch (e) {
      return false;
    }
  }
  return { isIOS, isAndroid };
})();

const ScreenPinning = (() => {
  function available() {
    return !!(window.CapScreenPinning && window.CapScreenPinning.ScreenPinning);
  }

  async function start() {
    if (!available()) return { started: false, reason: 'unsupported' };
    try {
      return await window.CapScreenPinning.ScreenPinning.start();
    } catch (e) {
      console.error('ScreenPinning.start failed', e);
      return { started: false, reason: 'error' };
    }
  }

  async function stop() {
    if (!available()) return { stopped: true };
    try {
      return await window.CapScreenPinning.ScreenPinning.stop();
    } catch (e) {
      console.error('ScreenPinning.stop failed', e);
      return { stopped: false };
    }
  }

  async function isPinned() {
    if (!available()) return false;
    try {
      const res = await window.CapScreenPinning.ScreenPinning.isPinned();
      return !!(res && res.pinned);
    } catch (e) {
      return false;
    }
  }

  async function openPinningSettings() {
    if (!available()) return false;
    try {
      await window.CapScreenPinning.ScreenPinning.openPinningSettings();
      return true;
    } catch (e) {
      console.error('ScreenPinning.openPinningSettings failed', e);
      return false;
    }
  }

  return { available, start, stop, isPinned, openPinningSettings };
})();
