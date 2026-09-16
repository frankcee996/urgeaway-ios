/* This file is NOT loaded directly by index.html. The GitHub Actions build
   bundles it with esbuild into js/applock-bundle.js, because the local
   "urgeaway-app-lock" Capacitor plugin (capacitor-plugins/app-lock/) is
   meant for a bundler and this project intentionally has no framework/
   bundler for anything else. See .github/workflows/build-apk.yml —
   "Bundle native plugin bridges". */
import AppLock from 'urgeaway-app-lock';

window.CapAppLock = { AppLock };
