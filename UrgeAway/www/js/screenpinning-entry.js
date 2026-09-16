/* This file is NOT loaded directly by index.html. The GitHub Actions build
   bundles it with esbuild into js/screenpinning-bundle.js, because the
   local "urgeaway-screen-pinning" Capacitor plugin (capacitor-plugins/
   screen-pinning/) is meant for a bundler and this project intentionally
   has no framework/bundler for anything else. See
   .github/workflows/build-apk.yml — "Bundle native plugin bridges". */
import ScreenPinning from 'urgeaway-screen-pinning';

window.CapScreenPinning = { ScreenPinning };
