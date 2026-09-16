/* ==========================================================================
   Urge Lock — for urges rated 7-10, starts a short, intensity-based session
   that pins UrgeAway to the foreground via Android's Screen Pinning, then
   reuses the app's existing random-distraction system for the duration.

   Reuses (does not duplicate): Data's session storage, pickRandomDistraction
   from distractions.js, and the same "how are you feeling" check-in pattern
   used elsewhere. The only new pieces are the intensity->duration gate, the
   confirmation step, and the timestamp-based countdown + Screen Pinning
   bridge.
   ========================================================================== */

const UrgeLock = (() => {
  let tickHandle = null;

  function durationLabel(sec) {
    const min = Math.round(sec / 60);
    return `${min} minute${min === 1 ? '' : 's'}`;
  }

  function formatClock(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /* ---------------- Confirmation step ----------------
     Shown in place, inside Urge Mode's existing pre-distraction step, right
     after the person picks an intensity of 7-10. Requires an explicit tap
     to proceed — never starts automatically. */
  function renderConfirm(intensity, onCancel) {
    const durationSec = Data.getUrgeLockDurationSec(intensity);
    const ios = window.isIOS && isIOS();
    const explainer = ios
      ? 'UrgeAway will start a focused timed session. iOS doesn\u2019t let any app lock itself to the screen the way Android does — if you\u2019ve turned on Guided Access (Settings \u2192 Accessibility \u2192 Guided Access), you can triple-click the side button yourself once the session starts to stay locked in.'
      : 'UrgeAway will start a focused session using Android\u2019s Screen Pinning feature, keeping this screen in front until the timer ends. Screen Pinning stays under your and Android\u2019s control the whole time.';
    const wrap = fmt(`
      <div class="fade-in" style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;max-width:290px;">
        <div style="width:60px;height:60px;border-radius:50%;background:rgba(52,224,214,0.14);display:flex;align-items:center;justify-content:center;color:var(--focus-cyan);">${NavIcons.lock}</div>
        <div class="line1" style="font-size:18px;">Urge Lock</div>
        <div style="color:var(--focus-text-1);font-size:14.5px;text-align:center;line-height:1.6;">
          Your urge: <strong>${intensity}/10</strong><br/>
          Lock duration: <strong>${durationLabel(durationSec)}</strong>
        </div>
        <div style="color:var(--focus-text-2);font-size:12.5px;text-align:center;line-height:1.5;">
          ${explainer}
        </div>
        <button class="btn btn-primary btn-block" id="ul-start">START URGE LOCK</button>
        <button class="btn btn-ghost btn-block" id="ul-cancel">CANCEL</button>
      </div>
    `);
    wrap.querySelector('#ul-start').addEventListener('click', () => {
      App.launchUrgeLock({ intensity });
    });
    wrap.querySelector('#ul-cancel').addEventListener('click', () => {
      if (onCancel) onCancel();
    });
    return wrap;
  }

  /* ---------------- Locked session ----------------
     Full-screen: a slim header with a live countdown, then the existing
     distraction system running underneath for the duration. */
  function renderSession(meta) {
    meta = meta || {};
    let session = Data.getUrgeLockSession();
    if (!session || session.status !== 'active') {
      session = Data.startUrgeLockSession(meta.intensity);
      if (session && window.Analytics) Analytics.logUrgeSessionStarted(meta.intensity);
    }
    if (!session) {
      // Shouldn't happen (only intensities 7-10 map to a duration) — fall
      // back to the normal distraction loop rather than showing nothing.
      return renderFallback(meta);
    }

    // Fires even if the app gets closed/backgrounded before the timer
    // ends — which is the normal case here, since staying in the app
    // isn't required once Screen Pinning (or Guided Access on iOS) is
    // holding things in place. Re-calling this on a resumed session just
    // replaces the same scheduled notification, so it's safe to call
    // every time renderSession runs.
    if (window.Notifications && Notifications.available()) {
      Notifications.scheduleCelebration({
        idSeed: 'urgelock_' + session.id,
        title: 'Urge Lock complete',
        atMs: session.endTime,
      });
    }

    const wrap = fmt(`
      <div class="activity-screen focus-mode fade-in">
        <div class="activity-header">
          <div class="title" id="ul-title">🔒 Urge Lock</div>
          <div class="title" id="ul-clock" style="font-variant-numeric:tabular-nums;">--:--</div>
        </div>
        <div style="text-align:center;padding:0 var(--space-5) var(--space-2);color:var(--focus-text-2);font-size:12.5px;">Stay with this moment.</div>
        <div class="activity-body" id="ul-body" style="padding-top:0;"></div>
      </div>
    `);

    const runnerBody = wrap.querySelector('#ul-body');
    mountDistraction();

    function mountDistraction() {
      runnerBody.innerHTML = '';
      const current = pickRandomDistraction();
      current.run(runnerBody, () => {
        // A finished distraction mid-lock just queues another one — there's
        // no early "how are you feeling" exit while still locked, since the
        // point of the session is staying present until the timer ends.
        mountDistraction();
      });
    }

    if (window.isIOS && isIOS()) {
      // No programmatic pinning API exists on iOS — Guided Access can only
      // be started by the person themselves (triple-click), never by an
      // app. The confirm screen already explained this; don't imply
      // there's an in-app "set it up" path the way Android has.
      App.toast('Triple-click now if you\u2019ve set up Guided Access');
    } else {
      ScreenPinning.start().then((res) => {
        if (res && res.started === false && res.reason === 'unavailable') {
          App.toast("Screen Pinning isn\u2019t set up on this device \u2014 you can turn it on in Settings");
        }
      });
    }

    runTick();
    tickHandle = setInterval(runTick, 1000);

    function runTick() {
      const remainingMs = session.endTime - Date.now();
      const clockEl = wrap.querySelector('#ul-clock');
      if (remainingMs <= 0) {
        finishSession();
        return;
      }
      if (clockEl) clockEl.textContent = formatClock(remainingMs);
      // If the person unpinned manually, Android's the one in control of
      // that — just note it silently and keep the countdown going. No
      // repeated re-pinning attempts, no crash, nothing forced. (No such
      // check on iOS — there's no programmatic pinning state to poll.)
      if (!(window.isIOS && isIOS()) && ScreenPinning.available()) ScreenPinning.isPinned();
    }

    async function finishSession() {
      if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }
      if (!(window.isIOS && isIOS())) await ScreenPinning.stop();
      // The app is open and about to show the completion screen right
      // now, so the scheduled system notification for this same moment
      // would just be a redundant duplicate — cancel it. (If the app had
      // been closed instead, this code never runs and the notification
      // fires normally.)
      if (window.Notifications && Notifications.available()) {
        Notifications.cancelCelebration('urgelock_' + session.id);
      }
      Data.completeUrgeLockSession(null);
      if (window.Analytics) Analytics.logUrgeSessionCompleted();
      showComplete();
    }

    function showComplete() {
      const titleEl = wrap.querySelector('#ul-title');
      const clockEl = wrap.querySelector('#ul-clock');
      if (titleEl) titleEl.textContent = 'Urge Lock Complete';
      if (clockEl) clockEl.textContent = '';
      runnerBody.innerHTML = '';
      const doneWrap = fmt(`
        <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;padding:var(--space-4) 0;">
          <div class="prompt-text">You made it through the session.</div>
          <div style="color:var(--focus-text-2);font-size:13px;">How are you feeling now?</div>
          <div class="outcome-grid" style="max-width:320px;grid-template-columns:1fr;">
            <button class="outcome-btn" data-v="better">Better</button>
            <button class="outcome-btn" data-v="still_having_urge">Still having an urge</button>
            <button class="outcome-btn" data-v="urge_gone">The urge is gone</button>
          </div>
        </div>
      `);
      runnerBody.appendChild(doneWrap);
      doneWrap.querySelectorAll('.outcome-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const feeling = b.getAttribute('data-v');
          Data.completeUrgeLockSession(feeling);
          // Feed into the same session log Progress/Resistance already read,
          // so Urge Lock shows up there rather than needing its own stats.
          Data.addSession({
            activityId: 'urge-lock',
            category: 'urge-lock',
            durationSec: session.durationSec,
            outcome: feeling === 'better' ? 'better' : feeling === 'urge_gone' ? 'better' : 'still_need_help',
            fromUrgeMode: true,
            intensity: session.intensity,
          });
          Data.clearUrgeLockSession();
          if (feeling === 'still_having_urge') {
            App.toast('Okay \u2014 let\u2019s try something else.');
            App.launchDistractionLoop({ intensity: session.intensity });
          } else {
            App.toast('Logged. Nice work staying with it.');
            App.closeOverlay();
          }
        });
      });
    }

    return wrap;
  }

  function renderFallback(meta) {
    // Defensive fallback only — normal navigation never reaches this since
    // Urge Lock is only offered for intensities 7-10.
    setTimeout(() => App.launchDistractionLoop(meta), 0);
    return fmt(`<div class="activity-screen focus-mode fade-in"></div>`);
  }

  // If the app was relaunched or the Activity recreated mid-session (per
  // the timestamp-based design), pick the locked session back up instead of
  // landing on Home as if nothing were happening.
  function resumeIfActive() {
    const session = Data.getUrgeLockSession();
    if (session && session.status === 'active' && session.endTime > Date.now()) {
      App.launchUrgeLock({ intensity: session.intensity });
      return true;
    }
    if (session && session.status === 'active') {
      // Ended while the app was closed — settle it quietly rather than
      // reopening a session whose timer has already run out.
      Data.completeUrgeLockSession(null);
      Data.clearUrgeLockSession();
    }
    return false;
  }

  return { renderConfirm, renderSession, resumeIfActive };
})();
