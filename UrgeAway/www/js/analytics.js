/* ==========================================================================
   Analytics — OPT-IN, anonymous usage analytics via Firebase Analytics,
   used only to see which features get used so UrgeAway can be improved.
   This is deliberately NOT a data-selling feature and isn't built like
   one: nothing here is ever sent to a third party for resale, there's no
   per-person profile UI, and no export of raw per-user event data exists
   anywhere in this app.

   Guardrails, on purpose, given how sensitive this app's subject matter
   is (urges, triggers, self-control struggles):

   1. OFF by default. Only starts sending events after the person turns
      it on in Settings, having seen the plain-language explanation of
      exactly what is and isn't collected (see screens.js's Settings
      entry). Turning it off calls FirebaseAnalytics.setCollectionEnabled
      (false) AND setUserId(null) — Firebase stops collecting immediately,
      not just "stops being read."

   2. No free text, ever. Journal entries, custom trigger notes, or
      anything else the person typed are never sent as event params —
      only which *feature* was used and coarse buckets (see EVENT names
      below). If you extend this file, keep that rule: event params
      should be enums/counts/booleans, never user-authored strings.

   3. No app identities from Lock In Mode. Which package names someone
      locks is a strong signal about what they're struggling with
      (a gambling app, a dating app, etc.) — arguably more sensitive
      than the journal text rule above, since it's inferred rather than
      stated. logLockInModeStarted() intentionally takes only a count
      and a duration bucket, never the package list.

   4. No PII tied in. This does not call setUserId() with anything
      derived from the optional Firebase Auth account (see auth.js) —
      analytics events stay anonymous/device-scoped even for people who
      are signed in.
   ========================================================================== */

const Analytics = (() => {
  function available() {
    return !!(window.CapAnalytics && window.CapAnalytics.FirebaseAnalytics);
  }

  function isEnabled() {
    return Data.getAnalyticsEnabled();
  }

  // Called from the Settings toggle. Persists the choice and tells
  // Firebase to actually start/stop collecting — not just a local flag
  // this file happens to check.
  async function setEnabled(enabled) {
    Data.setAnalyticsEnabled(enabled);
    if (!available()) return;
    try {
      const { FirebaseAnalytics } = window.CapAnalytics;
      await FirebaseAnalytics.setCollectionEnabled({ enabled });
      if (!enabled) {
        // Belt-and-suspenders: explicitly drop any user-id linkage the
        // SDK might otherwise retain, even though we never set one.
        await FirebaseAnalytics.setUserId({ userId: null });
      }
    } catch (e) {
      console.error('Analytics.setEnabled failed', e);
    }
  }

  async function logEvent(name, params) {
    if (!available() || !isEnabled()) return;
    try {
      const { FirebaseAnalytics } = window.CapAnalytics;
      await FirebaseAnalytics.logEvent({ name, params: params || {} });
    } catch (e) {
      console.error('Analytics.logEvent failed', e);
    }
  }

  /* ---- Small helpers for the specific things worth knowing ---- */

  function bucketDuration(ms) {
    const min = ms / 60000;
    if (min <= 60) return 'under_1h';
    if (min <= 60 * 24) return '1h_to_1d';
    if (min <= 60 * 24 * 7) return '1d_to_1w';
    if (min <= 60 * 24 * 30) return '1w_to_1m';
    return 'over_1m';
  }

  function logUrgeSessionStarted(intensity) {
    logEvent('urge_session_started', { intensity_band: intensity >= 9 ? 'high' : intensity >= 7 ? 'medium' : 'low' });
  }
  function logUrgeSessionCompleted() {
    logEvent('urge_session_completed');
  }
  function logActivityCompleted(activityType) {
    logEvent('activity_completed', { activity_type: activityType });
  }
  // Deliberately takes only a count + duration bucket — never the
  // selected package names. See guardrail #3 above.
  function logLockInModeStarted(appCount, unlockAt) {
    logEvent('lockin_mode_started', {
      app_count: appCount,
      duration_band: bucketDuration(unlockAt - Date.now()),
    });
  }

  return {
    available,
    isEnabled,
    setEnabled,
    logEvent,
    logUrgeSessionStarted,
    logUrgeSessionCompleted,
    logActivityCompleted,
    logLockInModeStarted,
  };
})();
