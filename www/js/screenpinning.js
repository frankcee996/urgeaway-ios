/* ==========================================================================
   ScreenPinning — thin wrapper around the native ScreenPinning plugin
   (exposed on window.CapScreenPinning by the CI-built screenpinning-bundle.js).
   Falls back gracefully when running in a plain browser preview or on any
   build where the plugin isn't present: Urge Lock's timer and distraction
   still run, the phone just won't be pinned to the app.
   ========================================================================== */

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
