/* ==========================================================================
   Lock In Mode — a person picks apps and a duration (days / months / years)
   they set themselves; UrgeAway then sends them back to Home every time one
   of those apps tries to open, until the time is up.

   Built on the AppLock native plugin (Android's Accessibility Service API —
   see applock.js and the plugin's own comments for exactly what it does and
   why it isn't the "hide the icon" approach originally asked for: a regular
   app can't disable another app's launcher icon on stock Android).

   Reuses the app's existing look (fmt/escapeHtml, .card/.btn/.list-row,
   choice-pill) and its existing honesty-first tone (see urgelock.js /
   screenpinning subview) rather than overselling this as unbreakable: the
   app itself won't lift a lock early, but Android's own Accessibility
   settings remain the person's own, always-reachable way out.
   ========================================================================== */

function renderLockInMode() {
  let view = 'status'; // 'status' | 'picker' | 'duration' | 'confirm'
  const pending = { packages: [] }; // selected package -> {packageName, appName, icon}, keyed as array during flow

  const wrap = fmt(`
    <div class="activity-screen fade-in">
      <div class="activity-header">
        <div class="title">Lock In Mode</div>
        <button class="icon-btn" id="lim-close" aria-label="Close">\u2715</button>
      </div>
      <div class="screen-scroll" id="lim-body" style="padding-top:var(--space-3);"></div>
    </div>
  `);
  wrap.querySelector('#lim-close').addEventListener('click', () => {
    document.removeEventListener('visibilitychange', onVisibility);
    App.closeOverlay();
  });

  // Coming back from Android's Settings app (after granting the
  // permission there) should update the status screen without the
  // person having to manually refresh anything.
  function onVisibility() {
    if (document.visibilityState === 'visible' && view === 'status') render();
  }
  document.addEventListener('visibilitychange', onVisibility);

  const body = wrap.querySelector('#lim-body');
  render();
  return wrap;

  function render() {
    body.innerHTML = '';
    if (!AppLock.available()) {
      body.appendChild(renderUnavailable());
      return;
    }
    switch (view) {
      case 'picker': renderPicker(body); break;
      case 'duration': renderDuration(body); break;
      case 'confirm': renderConfirm(body); break;
      default: renderStatus(body); break;
    }
  }

  function renderUnavailable() {
    return fmt(`
      <div class="empty-state">
        <div class="big" style="color:var(--text-3);width:32px;height:32px;margin:0 auto var(--space-2);">${NavIcons.lock}</div>
        Lock In Mode uses an Android-only feature, so it isn't available on this device or in this preview.
      </div>
    `);
  }

  /* ---------------- Status: setup + active locks ---------------- */
  function renderStatus(body) {
    const node = fmt(`<div></div>`);
    node.appendChild(fmt(`
      <div class="card" style="color:var(--text-2);font-size:12.5px;line-height:1.6;margin-bottom:var(--space-3);">
        Pick apps and a length of time. UrgeAway will send you back to your Home screen every time you try to open one of them, until that time passes. The icon stays where it is \u2014 this isn't about hiding anything, it's about putting a real pause between you and the tap.
      </div>
    `));

    const setupCard = fmt(`
      <div class="card" id="lim-setup-card" style="margin-bottom:var(--space-3);"></div>
    `);
    node.appendChild(setupCard);

    node.appendChild(fmt(`<p class="section-title" style="margin-top:0;">Active locks</p>`));
    const listWrap = fmt(`<div id="lim-active-list"></div>`);
    node.appendChild(listWrap);

    const addBtn = fmt(`<button class="btn btn-primary btn-block" id="lim-add-btn" style="margin-top:var(--space-3);">+ LOCK APPS</button>`);
    node.appendChild(addBtn);

    body.appendChild(node);

    refreshSetupState();
    refreshActiveList();

    addBtn.addEventListener('click', async () => {
      const enabled = await AppLock.isAccessibilityEnabled();
      if (!enabled) {
        App.toast('Opening Accessibility settings \u2014 find UrgeAway and turn it on');
        await AppLock.openAccessibilitySettings();
        return;
      }
      pending.packages = [];
      view = 'picker';
      render();
    });

    async function refreshSetupState() {
      const enabled = await AppLock.isAccessibilityEnabled();
      setupCard.innerHTML = '';
      if (enabled) {
        setupCard.appendChild(fmt(`
          <div class="list-row" style="border-bottom:none;">
            <div>
              <div class="label">Permission on</div>
              <div class="desc">Android\u2019s Accessibility permission is on for UrgeAway, so locks can be enforced.</div>
            </div>
          </div>
        `));
        return;
      }
      setupCard.appendChild(fmt(`
        <div class="list-row" style="border-bottom:none;">
          <div>
            <div class="label">Permission needed \u2014 2 steps</div>
            <div class="desc">
              If you installed UrgeAway by downloading the APK directly (not through the Play Store), Android hides this permission behind an extra step the first time, to stop shady sideloaded apps from grabbing it quietly. That\u2019s all this is \u2014 it's not something UrgeAway can skip for you.
            </div>
          </div>
        </div>
        <div class="desc" style="padding:0 0 var(--space-2);">
          <strong>Step 1:</strong> On the App info screen that opens, tap the \u22EE menu (top right) \u2192 <strong>Allow restricted settings</strong> \u2192 OK.
        </div>
        <button class="btn btn-secondary btn-block" id="lim-step1-btn">1. OPEN APP INFO</button>
        <div class="desc" style="padding:var(--space-2) 0;">
          <strong>Step 2:</strong> Find UrgeAway in the list and turn the switch on.
        </div>
        <button class="btn btn-secondary btn-block" id="lim-step2-btn">2. OPEN ACCESSIBILITY SETTINGS</button>
        <button class="btn btn-ghost btn-block" id="lim-recheck-btn" style="margin-top:var(--space-2);">I'VE TURNED IT ON \u2014 CHECK AGAIN</button>
      `));
      setupCard.querySelector('#lim-step1-btn').addEventListener('click', async () => {
        App.toast('Look for the \u22EE menu, top right \u2192 Allow restricted settings');
        await AppLock.openAppInfoSettings();
      });
      setupCard.querySelector('#lim-step2-btn').addEventListener('click', async () => {
        App.toast('Find UrgeAway and turn the switch on');
        await AppLock.openAccessibilitySettings();
      });
      setupCard.querySelector('#lim-recheck-btn').addEventListener('click', refreshSetupState);
    }

    async function refreshActiveList() {
      listWrap.innerHTML = '<div style="color:var(--text-2);font-size:12.5px;">Loading\u2026</div>';
      const locks = await AppLock.getLockedApps();
      listWrap.innerHTML = '';
      if (!locks.length) {
        listWrap.appendChild(fmt(`<div class="empty-state">Nothing locked right now.</div>`));
        return;
      }
      const card = fmt(`<div class="card" style="padding:0;"></div>`);
      locks
        .slice()
        .sort((a, b) => a.unlockAt - b.unlockAt)
        .forEach((lock) => {
          card.appendChild(fmt(`
            <div class="list-row">
              <div>
                <div class="label">${escapeHtml(lock.appName || lock.packageName)}</div>
                <div class="desc">${remainingLabel(lock.unlockAt)}</div>
              </div>
            </div>
          `));
        });
      listWrap.appendChild(card);
    }
  }

  /* ---------------- Picker: choose apps ---------------- */
  function renderPicker(body) {
    const node = fmt(`
      <div>
        <p class="section-title" style="margin-top:0;">Choose apps</p>
        <input type="text" id="lim-filter" placeholder="Search installed apps"
          style="width:100%;box-sizing:border-box;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius-s);color:var(--text-0);padding:12px;font-size:15px;font-family:var(--font-body);margin-bottom:var(--space-3);" />
        <div id="lim-app-list" style="color:var(--text-2);font-size:12.5px;">Loading installed apps\u2026</div>
      </div>
    `);
    body.appendChild(node);

    const listEl = node.querySelector('#lim-app-list');
    const footer = fmt(`<button class="btn btn-primary btn-block" id="lim-picker-next" style="margin-top:var(--space-3);opacity:0.5;" disabled>CONTINUE</button>`);
    node.appendChild(footer);
    const backBtn = fmt(`<button class="btn btn-ghost btn-block" id="lim-picker-back" style="margin-top:var(--space-2);">CANCEL</button>`);
    node.appendChild(backBtn);
    backBtn.addEventListener('click', () => { view = 'status'; render(); });

    let allApps = [];
    AppLock.getInstalledApps().then((apps) => {
      allApps = apps.slice().sort((a, b) => (a.appName || '').localeCompare(b.appName || ''));
      renderList(allApps);
    });

    node.querySelector('#lim-filter').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      renderList(!q ? allApps : allApps.filter((a) => (a.appName || '').toLowerCase().includes(q)));
    });

    function renderList(apps) {
      listEl.innerHTML = '';
      if (!apps.length) {
        listEl.appendChild(fmt(`<div class="empty-state">No matching apps.</div>`));
        return;
      }
      const card = fmt(`<div class="card" style="padding:0;"></div>`);
      apps.forEach((app) => {
        const selected = pending.packages.some((p) => p.packageName === app.packageName);
        const row = fmt(`
          <div class="list-row card-tap" tabindex="0" style="cursor:pointer;">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
              ${app.icon ? `<img src="${app.icon}" width="32" height="32" style="border-radius:8px;flex-shrink:0;" alt="" />` : `<div style="width:32px;height:32px;border-radius:8px;background:var(--bg-3);flex-shrink:0;"></div>`}
              <div class="label" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(app.appName || app.packageName)}</div>
            </div>
            <div class="lim-check" style="width:22px;height:22px;border-radius:50%;border:2px solid ${selected ? 'var(--cyan)' : 'var(--text-3)'};background:${selected ? 'var(--cyan)' : 'transparent'};flex-shrink:0;"></div>
          </div>
        `);
        row.addEventListener('click', () => {
          const idx = pending.packages.findIndex((p) => p.packageName === app.packageName);
          if (idx >= 0) pending.packages.splice(idx, 1);
          else pending.packages.push(app);
          renderList(apps);
          footer.disabled = pending.packages.length === 0;
          footer.style.opacity = pending.packages.length === 0 ? '0.5' : '1';
          footer.textContent = pending.packages.length ? `CONTINUE (${pending.packages.length})` : 'CONTINUE';
        });
        card.appendChild(row);
      });
      listEl.appendChild(card);
    }

    footer.addEventListener('click', () => {
      if (!pending.packages.length) return;
      view = 'duration';
      render();
    });
  }

  /* ---------------- Duration: how long ---------------- */
  function renderDuration(body) {
    let amount = 1;
    let unit = 'hours'; // 'minutes' | 'hours' | 'days' | 'months' | 'years'

    const node = fmt(`
      <div>
        <p class="section-title" style="margin-top:0;">Locking ${pending.packages.length} app${pending.packages.length === 1 ? '' : 's'}</p>
        <div class="card" style="margin-bottom:var(--space-3);">
          <input type="number" min="1" max="3650" value="1" id="lim-amount"
            style="width:100%;box-sizing:border-box;text-align:center;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius-s);color:var(--text-0);padding:12px;font-size:15px;font-family:var(--font-body);margin-bottom:var(--space-3);" />
          <div class="choice-wrap" id="lim-unit-pills">
            <button class="choice-pill" data-unit="minutes">Minutes</button>
            <button class="choice-pill selected" data-unit="hours">Hours</button>
            <button class="choice-pill" data-unit="days">Days</button>
            <button class="choice-pill" data-unit="months">Months</button>
            <button class="choice-pill" data-unit="years">Years</button>
          </div>
        </div>
        <div style="color:var(--text-2);font-size:12.5px;" id="lim-unlock-preview"></div>
        <button class="btn btn-primary btn-block" id="lim-duration-next" style="margin-top:var(--space-4);">CONTINUE</button>
        <button class="btn btn-ghost btn-block" id="lim-duration-back" style="margin-top:var(--space-2);">BACK</button>
      </div>
    `);
    body.appendChild(node);

    const amountInput = node.querySelector('#lim-amount');
    const preview = node.querySelector('#lim-unlock-preview');
    const MAX_BY_UNIT = { minutes: 59, hours: 23, days: 3650, months: 120, years: 10 };
    amountInput.max = String(MAX_BY_UNIT[unit]);
    updatePreview();

    amountInput.addEventListener('input', () => {
      const max = MAX_BY_UNIT[unit];
      amount = Math.max(1, Math.min(max, parseInt(amountInput.value, 10) || 1));
      updatePreview();
    });
    node.querySelectorAll('#lim-unit-pills .choice-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        unit = pill.getAttribute('data-unit');
        node.querySelectorAll('#lim-unit-pills .choice-pill').forEach((p) => p.classList.toggle('selected', p === pill));
        const max = MAX_BY_UNIT[unit];
        amountInput.max = String(max);
        if (amount > max) { amount = max; amountInput.value = String(max); }
        updatePreview();
      });
    });

    node.querySelector('#lim-duration-back').addEventListener('click', () => { view = 'picker'; render(); });
    node.querySelector('#lim-duration-next').addEventListener('click', () => {
      pending.unlockAt = computeUnlockAt(amount, unit);
      pending.amount = amount;
      pending.unit = unit;
      view = 'confirm';
      render();
    });

    function updatePreview() {
      const unlockAt = computeUnlockAt(amount, unit);
      preview.textContent = `Unlocks ${new Date(unlockAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
    }
  }

  /* ---------------- Confirm: explicit, honest ---------------- */
  function renderConfirm(body) {
    const names = pending.packages.map((p) => p.appName || p.packageName);
    const node = fmt(`
      <div>
        <p class="section-title" style="margin-top:0;">Confirm</p>
        <div class="card" style="margin-bottom:var(--space-3);">
          <div class="label" style="margin-bottom:6px;">${names.length} app${names.length === 1 ? '' : 's'}</div>
          <div class="desc">${names.map(escapeHtml).join(', ')}</div>
        </div>
        <div class="card" style="margin-bottom:var(--space-3);">
          <div class="label" style="margin-bottom:6px;">Unlocks</div>
          <div class="desc">${new Date(pending.unlockAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</div>
        </div>
        <div class="card" style="color:var(--text-2);font-size:12.5px;line-height:1.6;margin-bottom:var(--space-3);">
          Once this starts, UrgeAway won\u2019t offer a way to end it early \u2014 that\u2019s the point of a commitment device. The one real way out before the timer ends is turning off UrgeAway\u2019s Accessibility permission yourself, in your phone\u2019s own Settings. Nothing here hides that option from you; it just isn\u2019t a button in this app.
        </div>
        <label style="display:flex;align-items:flex-start;gap:10px;font-size:12.5px;color:var(--text-2);margin-bottom:var(--space-3);cursor:pointer;">
          <input type="checkbox" id="lim-ack" style="margin-top:2px;" />
          <span>I understand UrgeAway won\u2019t undo this early.</span>
        </label>
        <button class="btn btn-primary btn-block" id="lim-confirm-btn" disabled>START LOCK IN</button>
        <button class="btn btn-ghost btn-block" id="lim-confirm-back" style="margin-top:var(--space-2);">BACK</button>
      </div>
    `);
    body.appendChild(node);

    const ack = node.querySelector('#lim-ack');
    const confirmBtn = node.querySelector('#lim-confirm-btn');
    confirmBtn.style.opacity = '0.5';
    ack.addEventListener('change', () => {
      confirmBtn.disabled = !ack.checked;
      confirmBtn.style.opacity = ack.checked ? '1' : '0.5';
    });
    node.querySelector('#lim-confirm-back').addEventListener('click', () => { view = 'duration'; render(); });

    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Locking\u2026';
      hideDebugPanel(node);
      const packageNames = pending.packages.map((p) => p.packageName);
      const result = await AppLock.lockApps(packageNames, pending.unlockAt);

      if (!result.ok) {
        console.error('Lock In Mode: lockApps did not succeed', result);
        App.toast(result.error === 'unavailable'
          ? 'Lock In Mode isn\u2019t available on this device'
          : 'Couldn\u2019t lock those apps \u2014 please try again');
        showDebugPanel(node,
          'JS sent: packages=' + JSON.stringify(packageNames) + ', unlockAt=' + pending.unlockAt + ' (' + typeof pending.unlockAt + ')\n\n' +
          'lockApps failed:\n' + JSON.stringify(result, null, 2));
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'START LOCK IN';
        return;
      }

      // Belt-and-suspenders: re-read the locked list from the native
      // side and confirm the packages we just asked for are actually
      // in it, rather than trusting the write call's own report. Catches
      // any mismatch between what lockApps() said and what's really
      // persisted (e.g. Settings/UrgeAway itself silently filtered out
      // if that ended up being the whole selection).
      const nowLocked = await AppLock.getLockedApps();
      const stillMissing = packageNames.filter((pkg) => !nowLocked.some((l) => l.packageName === pkg));
      if (stillMissing.length) {
        console.error('Lock In Mode: these packages did not persist as locked', stillMissing);
        App.toast('Some apps couldn\u2019t be locked \u2014 please try again');
        showDebugPanel(node,
          'lockApps reported success (' + JSON.stringify(result) + ') but getLockedApps() came back without:\n' +
          stillMissing.join(', ') + '\n\ngetLockedApps() actually returned:\n' + JSON.stringify(nowLocked, null, 2));
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'START LOCK IN';
        return;
      }

      // No in-app "session" screen exists for Lock In Mode the way Urge
      // Lock has one \u2014 locks can run for months, so this notification is
      // the only signal the person gets that a given batch has ended.
      // Nothing to cancel/duplicate against, unlike Urge Lock.
      if (window.Notifications && Notifications.available()) {
        const idSeed = 'lockin_' + pending.unlockAt + '_' + packageNames.slice().sort().join(',');
        Notifications.scheduleCelebration({
          idSeed,
          title: 'Lock In Mode complete',
          atMs: pending.unlockAt,
        });
      }
      App.haptic();
      App.toast('Locked in');
      if (window.Analytics) Analytics.logLockInModeStarted(packageNames.length, pending.unlockAt);
      view = 'status';
      pending.packages = [];
      render();
    });
  }

  /* ---------------- Helpers ---------------- */
  // On-screen (not just console) diagnostics for the confirm step, so a
  // failure can be read/screenshotted directly on the phone without
  // needing chrome://inspect or adb logcat.
  function showDebugPanel(node, message) {
    let panel = node.querySelector('#lim-debug-panel');
    if (!panel) {
      panel = fmt(`
        <div id="lim-debug-panel" style="margin-top:var(--space-3);padding:var(--space-3);background:rgba(255,90,90,0.08);border:1px solid rgba(255,90,90,0.35);border-radius:var(--radius-s);">
          <div style="color:#ff8a8a;font-size:11px;font-weight:700;margin-bottom:6px;">DEBUG INFO (screenshot this)</div>
          <div id="lim-debug-text" style="color:#ffb3b3;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-word;"></div>
        </div>
      `);
      node.appendChild(panel);
    }
    panel.querySelector('#lim-debug-text').textContent = message;
  }
  function hideDebugPanel(node) {
    const panel = node.querySelector('#lim-debug-panel');
    if (panel) panel.remove();
  }

  function computeUnlockAt(amount, unit) {
    const d = new Date();
    if (unit === 'minutes') d.setMinutes(d.getMinutes() + amount);
    else if (unit === 'hours') d.setHours(d.getHours() + amount);
    else if (unit === 'days') d.setDate(d.getDate() + amount);
    else if (unit === 'months') d.setMonth(d.getMonth() + amount);
    else if (unit === 'years') d.setFullYear(d.getFullYear() + amount);
    return d.getTime();
  }

  function remainingLabel(unlockAt) {
    const ms = unlockAt - Date.now();
    if (ms <= 0) return 'Unlocking now\u2026';
    const totalMin = Math.ceil(ms / 60000);
    if (totalMin < 60) return `${totalMin} minute${totalMin === 1 ? '' : 's'} left`;
    const totalHours = Math.ceil(totalMin / 60);
    if (totalHours < 24) return `${totalHours} hour${totalHours === 1 ? '' : 's'} left`;
    const totalDays = Math.ceil(totalHours / 24);
    if (totalDays < 60) return `${totalDays} day${totalDays === 1 ? '' : 's'} left`;
    if (totalDays < 730) {
      const months = Math.round(totalDays / 30);
      return `~${months} month${months === 1 ? '' : 's'} left`;
    }
    const years = Math.round(totalDays / 365);
    return `~${years} year${years === 1 ? '' : 's'} left`;
  }
}
