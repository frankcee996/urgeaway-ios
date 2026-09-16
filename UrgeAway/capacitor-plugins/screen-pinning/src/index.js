import { registerPlugin } from '@capacitor/core';

/**
 * ScreenPinning — thin bridge to Android's standard, user-facing Screen
 * Pinning (a.k.a. App Pinning) APIs: Activity#startLockTask() /
 * Activity#stopLockTask(), and ActivityManager's lock-task-mode state.
 *
 * This intentionally does NOT use Device Policy Manager / Device Owner
 * provisioning, ADB, root, or an Accessibility Service workaround — just
 * the same public methods any Android app is allowed to call. Screen
 * Pinning always remains under Android's and the user's control: the
 * documented back+overview gesture (or long-press, depending on Android
 * version) always exits it, and nothing here tries to prevent that.
 *
 * Native implementation: ../android/src/main/java/com/urgeaway/screenpinning/
 */
const ScreenPinning = registerPlugin('ScreenPinning');

export default ScreenPinning;
