# UrgeAway

*"Don't fight the moment. Shift it."*

An offline-first, privacy-first impulse-management app. This repo is the
MVP described in the product brief: home screen with the **I HAVE AN URGE**
button, Urge Mode, distraction/challenge/calm activities, **Urge Lock**
(a Screen-Pinning-backed focus session for the highest-intensity urges), a
private journal, local history/progress, a profile dashboard, notifications,
settings, and onboarding — all built in plain HTML/CSS/JS and wired for
Capacitor, targeting both **Android and iOS** from the same `www/` code.

## Android vs iOS

Almost everything in `www/` is shared — same HTML/CSS/JS runs on both
platforms unchanged. Two things genuinely differ:

- **Google Sign-In is Android-only.** There's no iOS Google auth config in
  this repo (no reversed-client-id URL scheme, no iOS OAuth client), so the
  "Continue with Google" button is hidden entirely on iOS
  (`isIOS()` in `screens.js`) rather than shown and failing. Email/password
  sign-in works the same on both.
- **Urge Lock's "keep me in the app" mechanism differs.** Android has a
  public API (`Activity.startLockTask()`) any app can call — that's
  `capacitor-plugins/screen-pinning/`. **iOS has no equivalent** — Apple
  does not let any app lock itself to the screen. Only the person can do
  that, manually, via Guided Access (Settings → Accessibility → Guided
  Access, then a triple-click). On iOS, Urge Lock still runs its timer and
  distraction exactly the same — it just can't force the lock itself, and
  the copy in `urgelock.js` / the Settings → Urge Lock screen says so
  plainly instead of implying an in-app "set up" path that doesn't exist.

## What's actually in here

```
urgeaway/
├── www/                     ← the entire app (this is what runs on-device)
│   ├── index.html
│   ├── manifest.json
│   ├── css/styles.css       ← design system + every screen's styling
│   ├── js/
│   │   ├── storage.js       ← localStorage wrapper + all data logic
│   │   ├── activities.js    ← the 9 games/exercises (add new ones here)
│   │   ├── screens.js       ← Home, Activities, Progress, Journal, Settings
│   │   ├── flows.js         ← Urge Mode, activity runner, onboarding
│   │   ├── urgelock.js      ← Urge Lock: confirm step, timed session, check-in
│   │   ├── screenpinning.js ← wrapper around the native Screen Pinning bridge (Android only)
│   │   ├── account.js       ← sign-in/sign-up (Google hidden on iOS)
│   │   ├── dashboard.js     ← profile dashboard + notification history
│   │   └── app.js           ← router / controller
│   └── icons/                ← app icon generated from your logo, all sizes
├── capacitor-plugins/
│   └── screen-pinning/      ← local Capacitor plugin, Android-only: Screen
│                               Pinning (App Pinning) APIs, nothing else
├── .github/workflows/
│   ├── build-apk.yml        ← builds a debug Android APK in the cloud
│   └── build-ios.yml        ← builds an UNSIGNED iOS Simulator build in the cloud
├── firebase/
│   ├── google-services.json      ← Android Firebase config
│   └── GoogleService-Info.plist  ← iOS Firebase config (add this yourself — see below)
├── capacitor.config.json
├── package.json
└── README.md
```

### Getting iOS actually onto a phone

`build-ios.yml` produces an **unsigned build for the iOS Simulator only** —
that's the most CI can do without an Apple Developer account. To get this
onto a real iPhone or into TestFlight, you need:

1. An Apple Developer Program membership ($99/year)
2. A signing certificate + provisioning profile for `com.ceeenterprise.UrgeAway`
3. Either open `ios/App/App.xcworkspace` in Xcode on a Mac and run it
   directly on a plugged-in device, or provide the cert/profile as GitHub
   secrets so the workflow can be extended to produce a signed `.ipa` the
   same way `build-apk.yml` already does for Android

None of that exists yet in this repo — it needs your Apple account, not
something that can be generated from here.

### Firebase on iOS

If you want Auth/push notifications working on iOS too, download
`GoogleService-Info.plist` from Firebase Console → Project settings → your
iOS app, and commit it to `firebase/GoogleService-Info.plist` — same idea
as `firebase/google-services.json` already does for Android. Push on iOS
also needs an APNs auth key uploaded to Firebase Console separately
(Apple-side setup, not something in this repo).

### Urge Lock

When someone rates an urge 7-10 in Urge Mode's intensity step, UrgeAway
offers **Urge Lock** instead of the normal distraction loop: a confirmation
screen, then a timed session (5/8/12/15 minutes for 7/8/9/10) that pins the
app to the foreground using Android's standard, user-facing **Screen
Pinning / App Pinning** feature — the same one described at
Settings → Security → App pinning on stock Android. It's implemented as a
small local Capacitor plugin (`capacitor-plugins/screen-pinning/`) that
only calls `Activity#startLockTask()` / `#stopLockTask()` and reads the
lock-task-mode state — no Device Owner provisioning, ADB, root, or
Accessibility Service tricks, and no ability to block Android's own exit
gesture. The countdown is timestamp-based (`endTime - now`, stored in
`localStorage` alongside everything else), so it survives the Activity
being recreated. During the session it reuses the app's existing random
distraction system rather than adding a second one.

There is no backend. Nothing is sent over the network at any point —
the whole app works from local files and `localStorage`.

## 1. Try it right now, with zero setup

`www/` is a normal static site. Open `www/index.html` directly in a
desktop browser, or serve it locally:

```bash
cd urgeaway/www
python3 -m http.server 8080
# then open http://localhost:8080 — resize your browser window narrow
# (or use device toolbar / responsive mode) to see the phone layout
```

Everything works: the urge button, all 9 activities, journal, streaks,
settings, data export. This is the fastest way to review or tweak the
actual product before touching Android tooling at all.

## 2. Turn it into a real Android APK

This step needs tools that aren't available in the environment that
produced this project, so it has to be run on your own machine:

**Prerequisites**
- [Node.js](https://nodejs.org) 18+
- [Android Studio](https://developer.android.com/studio) (installs the
  Android SDK, platform tools, and a default emulator)
- A JDK (Android Studio bundles one)

**Steps**

```bash
cd urgeaway

# 1. install the Capacitor CLI + Android runtime
npm install

# 2. generate the native Android project (creates an /android folder)
npx cap add android

# 3. copy www/ into the native project
npx cap sync android

# 4a. open it in Android Studio to run on a device/emulator or build there
npx cap open android
#    → in Android Studio: Build ▸ Build Bundle(s)/APK(s) ▸ Build APK(s)
#    → the debug APK lands in android/app/build/outputs/apk/debug/

# 4b. OR build a debug APK straight from the command line
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

That `app-debug.apk` is a genuine installable Android app — copy it to a
phone (or `adb install app-debug.apk`) and it runs with no internet
connection required.

**For a signed release build** (needed to publish to the Play Store or
distribute outside debug mode), follow Android's standard
[app signing guide](https://developer.android.com/studio/publish/app-signing)
to generate a keystore, then `./gradlew assembleRelease`.

Any time you change files in `www/`, re-run `npx cap sync android` before
rebuilding so the native shell picks up the changes.

## What's deliberately MVP / stubbed for later

- **Notifications** — the Settings toggle is wired to local state, but
  actually scheduling OS-level local notifications needs the
  `@capacitor/local-notifications` plugin (`npm install
  @capacitor/local-notifications`, then request permission and schedule
  from `app.js`). Left out of the MVP per the build priority list.
- **Personalization** — currently a simple "which activity has the best
  helpful-outcome ratio after ≥2 uses" heuristic in `storage.js
  → getRecommendedActivity()`. No claims are made about it treating
  anything; it's just a recommendation nudge, as specified.
- **Cloud sync / accounts** — intentionally absent. If you add this
  later, the brief's own principle applies: make it opt-in and explain
  it clearly before anything leaves the device.
- **Monetization** — no paywalls or ads exist yet. `activities.js`'s
  registry pattern (one object per activity) is meant to make it easy to
  gate *additional* activities/themes later without touching the core
  urge → activity → check-in loop, which should stay free.

## Design notes

Dark navy / cyan / soft-green palette per the brief, built around one
signature moment: on the Home screen a calm cyan-to-green wave sits above
the urge button; the instant someone taps **I HAVE AN URGE**, that wave
visibly settles into a breathing circle before the options appear — the
"shift," not a fight, made visible for a second. Everything else stays
quiet on purpose (rounded cards, generous spacing, no clinical iconography,
no imagery tied to any specific substance).
