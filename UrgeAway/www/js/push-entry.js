/* This file is NOT loaded directly by index.html. The GitHub Actions build
   bundles it with esbuild into js/push-bundle.js, same pattern as
   notifications-entry.js. See .github/workflows/build-apk.yml. */
import { PushNotifications } from '@capacitor/push-notifications';

window.CapPush = { PushNotifications };
