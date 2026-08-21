import Foundation
import Capacitor
import UIKit

/**
 * ScreenPinningPlugin (iOS) — bridges to Guided Access, the closest
 * App-Store-safe, user-facing equivalent iOS has to Android's Screen
 * Pinning / App Pinning.
 *
 * Important platform difference from Android, by Apple's design:
 * a third-party app CANNOT programmatically start or stop Guided Access.
 * There is no public API for it — only the person can turn it on, via
 * Settings > Accessibility > Guided Access (enable it once), then a
 * triple-click of the side/top button (or Home button on older devices)
 * while inside the app. This plugin does not attempt any private-API or
 * MDM/Device-Owner-style workaround; it only reads whether Guided Access
 * is currently active (`UIAccessibility.isGuidedAccessEnabled`) and helps
 * point the person at the system settings.
 *
 * Practical effect for Urge Lock: if the person has already turned on
 * Guided Access and triple-clicked to activate it before starting a
 * session, `isPinned` reports true, matching Android's behavior. If they
 * haven't, `start` resolves the same shape Android uses for "not set up
 * yet" (`{ started: false, reason: "unavailable" }`) so the existing
 * JS fallback (timer + distractions still run, just not OS-pinned) and
 * toast copy work unchanged. The JS layer shows iOS-specific instructions
 * for that case (see www/js/urgelock.js and screens.js).
 */
@objc(ScreenPinningPlugin)
public class ScreenPinningPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenPinningPlugin"
    public let jsName = "ScreenPinning"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isPinned", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPinningSettings", returnType: CAPPluginReturnPromise)
    ]

    @objc func start(_ call: CAPPluginCall) {
        // Keep the screen awake for the duration of the session, same
        // spirit as Android's lock-task keeping the activity foregrounded.
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }
        if UIAccessibility.isGuidedAccessEnabled {
            call.resolve(["started": true])
        } else {
            // Mirrors the Android plugin's "unavailable" shape exactly, so
            // the shared JS wrapper needs no platform branching.
            call.resolve(["started": false, "reason": "unavailable"])
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }
        // Nothing to programmatically release — exiting Guided Access is
        // always the person's own triple-click (+ passcode, if they set
        // one), same as Android's back/overview gesture exits pinning.
        call.resolve(["stopped": true])
    }

    @objc func isPinned(_ call: CAPPluginCall) {
        call.resolve(["pinned": UIAccessibility.isGuidedAccessEnabled])
    }

    @objc func openPinningSettings(_ call: CAPPluginCall) {
        // iOS has no public deep link straight to Accessibility > Guided
        // Access (Apple reserves that; unofficial "App-prefs:" schemes are
        // not App-Store-safe). Opening the Settings app root is the
        // furthest a third-party app is allowed to go — the in-app copy
        // walks the person the rest of the way.
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("Could not build Settings URL")
                return
            }
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Could not open Settings")
                }
            }
        }
    }
}
