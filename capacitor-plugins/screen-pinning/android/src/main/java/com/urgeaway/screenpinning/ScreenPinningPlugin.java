package com.urgeaway.screenpinning;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * ScreenPinningPlugin — bridges Android's built-in, user-facing Screen
 * Pinning (a.k.a. App Pinning) feature into JavaScript for UrgeAway's
 * Urge Lock.
 *
 * This uses ONLY the standard public APIs any Android app is allowed to
 * call:
 *   - Activity#startLockTask() / Activity#stopLockTask()
 *   - ActivityManager#getLockTaskModeState() (API 23+) /
 *     ActivityManager#isInLockTaskMode() (fallback, pre-23)
 *   - Settings.ACTION_SECURITY_SETTINGS, to send the user to the system
 *     screen where "App pinning" lives if it isn't already enabled
 *
 * It deliberately does NOT use Device Policy Manager / Device Owner
 * provisioning, ADB, root, or an Accessibility Service workaround, and it
 * never attempts to prevent the user from exiting the pinned state via
 * Android's documented gesture. Screen Pinning remains controlled by
 * Android, not by this app.
 */
@CapacitorPlugin(name = "ScreenPinning")
public class ScreenPinningPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity available");
            return;
        }
        JSObject ret = new JSObject();
        try {
            activity.startLockTask();
            ret.put("started", true);
        } catch (Exception e) {
            // Most commonly thrown when Screen Pinning / App Pinning is turned
            // off in Settings on this device or OEM build. Report it rather
            // than throwing, so the caller can point the user at setup instead
            // of failing silently.
            ret.put("started", false);
            ret.put("reason", "unavailable");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            try {
                if (isCurrentlyPinned(activity)) {
                    activity.stopLockTask();
                }
            } catch (Exception e) {
                // If the user already exited pinning manually, stopLockTask()
                // can throw here — the desired end state (not pinned) already
                // holds, so there's nothing further to do.
            }
        }
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isPinned(PluginCall call) {
        Activity activity = getActivity();
        JSObject ret = new JSObject();
        ret.put("pinned", activity != null && isCurrentlyPinned(activity));
        call.resolve(ret);
    }

    @PluginMethod
    public void openPinningSettings(PluginCall call) {
        Context context = getContext();
        try {
            Intent intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open Settings", e);
        }
    }

    private boolean isCurrentlyPinned(Activity activity) {
        ActivityManager am = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
        if (am == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
        } else {
            //noinspection deprecation
            return am.isInLockTaskMode();
        }
    }
}
