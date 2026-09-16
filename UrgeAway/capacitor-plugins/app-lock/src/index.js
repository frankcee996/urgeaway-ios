import { registerPlugin } from '@capacitor/core';

/**
 * AppLock — thin bridge to UrgeAway's native "Lock In Mode" plugin.
 *
 * See android/src/main/java/com/urgeaway/applock/AppLockPlugin.java and
 * AppLockAccessibilityService.java for what this actually does — and just
 * as importantly, what it doesn't: no Device Owner, no ADB, no root, no
 * reading of on-screen content, and no way for the app itself to lift a
 * lock early. It uses Android's standard Accessibility Service permission,
 * which the person grants themselves and can revoke themselves at any time
 * in system Settings.
 */
const AppLock = registerPlugin('AppLock');

export default AppLock;
