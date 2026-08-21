# UrgeAway

*"Don't fight the moment. Shift it."*

An offline-first, privacy-first impulse-management app. This repo is the
MVP described in the product brief: home screen with the **I HAVE AN URGE**
button, Urge Mode, 9 distraction/challenge/calm activities, **Urge Lock**
(a Screen-Pinning-backed focus session for the highest-intensity urges), a
private journal, local history/progress, settings, and onboarding — all
built in plain HTML/CSS/JS and wired for Capacitor, which is the standard
low-budget, solo-developer path to a real Android APK.

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
│   │   ├── screenpinning.js ← wrapper around the native Screen Pinning bridge
│   │   └── app.js           ← router / controller
│   └── icons/                ← app icon generated from your logo, all sizes
├── capacitor-plugins/
│   └── screen-pinning/      ← local Capacitor plugin: Android's Screen
│       ├── android/            Pinning (App Pinning) APIs on Android,
│       └── ios/                 Guided Access state on iOS — nothing else
├── capacitor.config.json
├── package.json
└── README.md
```

### Urge Lock

When someone rates an urge 7-10 in Urge Mode's intensity step, UrgeAway
offers **Urge Lock** instead of the normal distraction loop: a confirmation
screen, then a timed session (5/8/12/15 minutes for 7/8/9/10) that pins the
app to the foreground using each platform's own user-facing pinning
feature — Android's **Screen Pinning / App Pinning**
(Settings → Security → App pinning), or on iOS, **Guided Access**
(Settings → Accessibility → Guided Access), which the person must enable
and triple-click into themselves since Apple gives no third-party app the
ability to start it programmatically. It's implemented as a small local
Capacitor plugin (`capacitor-plugins/screen-pinning/`) that, on Android,
only calls `Activity#startLockTask()` / `#stopLockTask()` and reads the
lock-task-mode state, and on iOS only reads `UIAccessibility.isGuidedAccessEnabled`
— no Device Owner provisioning, ADB, root, Accessibility Service tricks, or
private iOS APIs, and no ability to block either platform's own exit
gesture. The countdown is timestamp-based (`endTime - now`, stored in
`localStorage` alongside everything else), so it survives the app being
recreated. During the session it reuses the app's existing random
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

## 3. Turn it into a real iOS app

Same idea as Android — Capacitor wraps the same `www/` folder — but Apple's
tooling only runs on a Mac, and only Apple-signed builds run on a real
iPhone. There's no way around either of those; it's an Apple platform rule,
not a limitation of this project.

**Prerequisites**
- A Mac, with [Xcode](https://apps.apple.com/app/xcode/id497799835) 15+
  installed (includes the iOS SDK, Simulator, and CocoaPods comes via
  `sudo gem install cocoapods` if you don't have it)
- [Node.js](https://nodejs.org) 18+
- To run on your own iPhone or distribute to anyone else: a free Apple ID
  is enough for a 7-day on-device test build from Xcode; an
  [Apple Developer Program](https://developer.apple.com/programs/) membership
  ($99/yr) is required for TestFlight or the App Store.

**Steps**

```bash
cd urgeaway

# 1. install the Capacitor CLI + iOS runtime (already in package.json)
npm install

# 2. bundle the native plugin bridges (notifications, push, auth, screen
#    pinning) — the CI workflow does this automatically; running it
#    locally too means `npx cap open ios` has everything it needs
npx esbuild www/js/notifications-entry.js --bundle --outfile=www/js/notifications-bundle.js --format=iife
npx esbuild www/js/push-entry.js --bundle --outfile=www/js/push-bundle.js --format=iife
npx esbuild www/js/auth-entry.js --bundle --outfile=www/js/auth-bundle.js --format=iife
npx esbuild www/js/screenpinning-entry.js --bundle --outfile=www/js/screenpinning-bundle.js --format=iife

# 3. generate the native iOS project (creates an /ios folder)
npx cap add ios

# 4. copy www/ into the native project
npx cap sync ios

# 5. open it in Xcode
npx cap open ios
#    → pick a Simulator or your plugged-in iPhone as the run destination
#    → for your own device: Xcode ▸ Settings ▸ Accounts, sign in with your
#      Apple ID, then in the project's Signing & Capabilities tab pick
#      your personal team — Xcode generates a free signing certificate
#    → press ▶ to build and run
```

Any time you change files in `www/`, re-run `npx cap sync ios` before
rebuilding.

**GitHub Actions (`.github/workflows/build-ios.yml`)** builds an
**unsigned Simulator** version on every push, the iOS equivalent of the
Android workflow's debug APK, and uploads it as an artifact you can
download and drag into a local Simulator. It needs no Apple account or
secrets. It cannot produce something installable on a real iPhone —
Apple requires signing for that regardless of who builds it or where.

**For TestFlight or the App Store** (real devices, real signing):
1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/enroll/).
2. In Xcode, set your Team under Signing & Capabilities and let it
   manage signing, or create an explicit App ID + provisioning profile
   in the [developer portal](https://developer.apple.com/account/resources/identifiers/list).
3. Archive: Xcode ▸ Product ▸ Archive, then use the Organizer window's
   "Distribute App" to upload to App Store Connect / TestFlight.
4. To automate this step in CI instead, you'd add your distribution
   certificate + provisioning profile as GitHub Actions secrets and swap
   the workflow's Simulator build for `xcodebuild archive` + `exportArchive`
   — a good next step once you have a Developer account, not something
   that can be pre-wired without your Apple credentials.

### iOS's Urge Lock: one real platform difference

Android's Screen Pinning can be started by the app itself
(`Activity#startLockTask()`), which is what the Android build does. Apple
does not expose an equivalent public API — **no third-party app can
programmatically start iOS's closest equivalent, Guided Access.** That's
an Apple platform restriction, not something missing from this build.

So on iOS, `capacitor-plugins/screen-pinning/ios/` reads whether Guided
Access is already active (`UIAccessibility.isGuidedAccessEnabled`) rather
than starting it, and `openPinningSettings()` opens the Settings app (the
furthest a third-party app is allowed to deep-link) while the in-app copy
explains the rest: Settings → Accessibility → Guided Access → turn it on
once, then triple-click the side/top button while inside UrgeAway to
actually lock to it. If someone hasn't done that, Urge Lock still runs its
full timer and distraction loop exactly like the Android fallback path —
it just isn't OS-pinned. Nothing in the shared JS (`urgelock.js`,
`screens.js`) had to branch on this beyond swapping the copy — the native
plugin resolves the same `{ started, reason }` / `{ pinned }` shapes on
both platforms.

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
