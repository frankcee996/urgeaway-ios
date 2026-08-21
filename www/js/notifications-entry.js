/* This file is NOT loaded directly by index.html. The GitHub Actions build
   bundles it with esbuild into js/notifications-bundle.js, because
   @capacitor/local-notifications is an npm package meant for a bundler and
   this project intentionally has no framework/bundler for anything else.
   See .github/workflows/build-apk.yml — "Bundle native plugin bridge". */
import { LocalNotifications } from '@capacitor/local-notifications';

window.CapNotifications = { LocalNotifications };
