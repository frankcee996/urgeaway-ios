/* ==========================================================================
   Flows — the full-screen takeovers: Urge Mode, the activity runner that
   wraps every game/exercise with a consistent header/footer + outcome
   check-in, and first-run onboarding.
   ========================================================================== */

/* ============================== SPLASH ============================== */
/* Shown for a moment on every app launch — the swoosh mark draws itself
   from start to end, then fades out. Pure SVG/CSS, no native assets. */
function renderSplashScreen(onDone) {
  const wrap = fmt(`
    <div style="position:fixed;inset:0;z-index:500;background:var(--bg-0);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 1024 1024" width="150" height="150">
        <path id="splash-path" d="M230 620 C330 340 560 760 800 380"
          fill="none" stroke="url(#splashGrad)" stroke-width="70" stroke-linecap="round"/>
        <defs>
          <linearGradient id="splashGrad" x1="0" y1="0" x2="1024" y2="1024">
            <stop offset="0%" stop-color="#34e0d6"/>
            <stop offset="100%" stop-color="#8be3a8"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  `);

  requestAnimationFrame(() => {
    const path = wrap.querySelector('#splash-path');
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.getBoundingClientRect(); // force reflow so the transition below actually animates
    path.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1)';
    requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
  });

  setTimeout(() => {
    wrap.style.transition = 'opacity 0.4s ease';
    wrap.style.opacity = '0';
    setTimeout(() => {
      wrap.remove();
      if (onDone) onDone();
    }, 400);
  }, 2400);

  return wrap;
}

/* ============================== LOGIN GATE ============================== */
/* Shown first, before onboarding, unless already signed in or already
   skipped once. Skipping is always one tap away — nothing here blocks use
   of the app. */
function renderLoginGate() {
  const wrap = fmt(`<div class="onboard"></div>`);

  const body = fmt(`
    <div class="onboard-body fade-in" style="justify-content:flex-start;padding-top:var(--space-6);">
      <div id="lg-account" style="width:100%;"></div>
    </div>
  `);
  wrap.appendChild(body);

  const footer = fmt(`<div class="onboard-footer"><button class="btn btn-ghost btn-block" id="lg-skip">Skip for now</button></div>`);
  footer.querySelector('#lg-skip').addEventListener('click', finish);
  wrap.appendChild(footer);

  renderAccountBody(body.querySelector('#lg-account'), finish);

  function finish() {
    Data.setLoginPromptShown();
    App.completeLoginGate();
  }

  return wrap;
}

/* ============================== URGE MODE ============================== */
/* Per the "no menu" design: press the button, get something immediately.
   No category choice, no activity choice. If they're still having the urge
   afterward, it loops straight into another one — never back to Home. */
function renderUrgeMode() {
  const wrap = fmt(`
    <div class="urge-mode fade-in">
      <button class="urge-mode-close" id="urge-close" aria-label="Close">✕</button>
      <div class="urge-mode-body" id="urge-stage">
        <div class="morph-wrap" id="morph-wrap"></div>
        <div class="line1" id="urge-line1">You don't have to figure everything out right now.</div>
        <div class="line2" style="margin-top:8px;" id="urge-line2">Okay. Let's get your mind somewhere else.</div>
      </div>
    </div>
  `);

  wrap.querySelector('#urge-close').addEventListener('click', () => App.closeOverlay());

  // Signature moment: the chaotic wave settles into a calm breathing circle
  // while the two lines above hand off to each other.
  const morphWrap = wrap.querySelector('#morph-wrap');
  morphWrap.innerHTML = `
    <svg viewBox="0 0 220 220" width="220" height="220">
      <path id="urge-wave" d="M10 110 C 40 60, 70 60, 95 110 S 150 160, 180 110 S 210 60, 210 60"
        fill="none" stroke="#ef8b6f" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
      <circle id="urge-circle" cx="110" cy="110" r="0" fill="url(#urgeGrad)" opacity="0"/>
      <defs>
        <radialGradient id="urgeGrad">
          <stop offset="0%" stop-color="#8be3a8"/>
          <stop offset="100%" stop-color="#34e0d6"/>
        </radialGradient>
      </defs>
    </svg>`;
  const waveEl = wrap.querySelector('#urge-wave');
  const circleEl = wrap.querySelector('#urge-circle');
  wrap.querySelector('#urge-line2').style.opacity = '0';
  requestAnimationFrame(() => {
    waveEl.style.transition = 'opacity 1.1s ease, d 1.1s ease';
    waveEl.style.opacity = '0';
    circleEl.style.transition = 'r 1.2s cubic-bezier(0.22,1,0.36,1), opacity 1.2s ease';
    setTimeout(() => { circleEl.setAttribute('opacity', '0.85'); circleEl.setAttribute('r', '46'); }, 200);
  });
  setTimeout(() => {
    const l1 = wrap.querySelector('#urge-line1');
    const l2 = wrap.querySelector('#urge-line2');
    if (l1) l1.style.transition = 'opacity 0.5s ease';
    if (l1) l1.style.opacity = '0';
    if (l2) { l2.style.transition = 'opacity 0.5s ease'; l2.style.opacity = '1'; }
  }, 1000);

  // No menu, no waiting for a tap on the wave itself — but a single quick
  // step first: a reminder of "why" (if they've saved any) plus an
  // optional intensity check, both in one screen so it stays fast.
  setTimeout(() => {
    showPreDistractionStep();
  }, 1900);

  function showPreDistractionStep() {
    const reasons = Data.getReasons();
    const stage = wrap.querySelector('#urge-stage');
    let intensity = null;
    stage.innerHTML = '';
    const stepWrap = fmt(`
      <div class="fade-in" style="display:flex;flex-direction:column;align-items:center;gap:18px;width:100%;">
        ${reasons.length ? `
          <div style="max-width:300px;">
            <div style="color:var(--focus-text-2);font-size:11.5px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Remember why</div>
            ${pickN(reasons, Math.min(3, reasons.length)).map((r) => `<div style="color:var(--focus-text-0);font-size:15px;font-weight:600;margin-bottom:5px;">${escapeHtml(r)}</div>`).join('')}
          </div>
        ` : ''}
        <div class="line1" style="font-size:16px;">How intense does this feel right now?</div>
        <div id="intensity-pills" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:290px;"></div>
        <button class="btn btn-primary" id="pre-continue" style="max-width:220px;">Continue</button>
      </div>
    `);
    stage.appendChild(stepWrap);
    const pillsWrap = stepWrap.querySelector('#intensity-pills');
    for (let n = 1; n <= 10; n++) {
      const pill = document.createElement('button');
      pill.className = 'choice-pill';
      pill.style.minWidth = '32px';
      pill.textContent = String(n);
      pill.addEventListener('click', () => {
        intensity = n;
        pillsWrap.querySelectorAll('.choice-pill').forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
      pillsWrap.appendChild(pill);
    }
    stepWrap.querySelector('#pre-continue').addEventListener('click', () => {
      const lockDurationSec = intensity ? Data.getUrgeLockDurationSec(intensity) : null;
      if (lockDurationSec) {
        showUrgeLockConfirm(intensity);
      } else {
        App.launchDistractionLoop({ intensity });
      }
    });

    // Intensity 7-10: confirm before handing off to Urge Lock (Screen
    // Pinning + timed session). Intensity 1-6 never reaches this function.
    function showUrgeLockConfirm(intensity) {
      stage.innerHTML = '';
      stage.appendChild(UrgeLock.renderConfirm(intensity, () => {
        // Cancel: fall back to the normal distraction loop, same as if
        // Urge Lock had never been offered.
        App.launchDistractionLoop({ intensity });
      }));
    }
  }

  return wrap;
}

/* ============================== DISTRACTION RUNNER (loop) ============================== */
/* Self-contained: runs a random distraction, shows a 3-option check-in,
   and either finishes or immediately runs another one — per spec, "still
   having the urge" never routes back to Home. */
function renderDistractionRunner(meta) {
  meta = meta || {};
  const wrap = fmt(`
    <div class="activity-screen focus-mode fade-in">
      <div class="activity-header">
        <div class="title" id="dr-title">Focus</div>
        <button class="icon-btn" id="dr-close" aria-label="Close">✕</button>
      </div>
      <div class="activity-body" id="dr-body"></div>
    </div>
  `);

  let current = null;
  let instance = null;
  let startedAt = Date.now();

  wrap.querySelector('#dr-close').addEventListener('click', () => {
    if (instance && instance.onExit) instance.onExit();
    App.closeOverlay();
  });

  function runNext() {
    current = pickRandomDistraction();
    startedAt = Date.now();
    const body = wrap.querySelector('#dr-body');
    instance = current.run(body, showOutcome) || {};
  }

  function showOutcome() {
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    const body = wrap.querySelector('#dr-body');
    body.innerHTML = '';
    const outcomeWrap = fmt(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="prompt-text">How are you feeling now?</div>
        <div class="outcome-grid" id="dr-outcome-grid" style="max-width:340px;grid-template-columns:1fr;">
          <button class="outcome-btn" data-v="better">Better</button>
          <button class="outcome-btn" data-v="a_little_better">A little better</button>
          <button class="outcome-btn" data-v="still_having_urge">Still having the urge</button>
        </div>
        <button class="btn-ghost btn" id="dr-add-note" style="font-size:12.5px;">+ Add a note about what almost got you (optional)</button>
        <div id="dr-note-wrap" class="hidden" style="width:100%;max-width:320px;"></div>
        <button class="btn-ghost btn" id="dr-reach-out" style="font-size:12.5px;border-color:rgba(52,224,214,0.24);color:var(--focus-cyan);">Reach out to someone instead</button>
      </div>
    `);
    body.appendChild(outcomeWrap);

    outcomeWrap.querySelector('#dr-reach-out').addEventListener('click', () => App.triggerReachOut());

    let noteText = '';
    outcomeWrap.querySelector('#dr-add-note').addEventListener('click', () => {
      const noteWrap = outcomeWrap.querySelector('#dr-note-wrap');
      noteWrap.classList.remove('hidden');
      outcomeWrap.querySelector('#dr-add-note').classList.add('hidden');
      noteWrap.innerHTML = `<textarea class="journal-input" id="dr-note-input" placeholder="What almost got you? (just for your own patterns — totally optional)" style="min-height:70px;"></textarea>`;
      noteWrap.querySelector('#dr-note-input').addEventListener('input', (e) => { noteText = e.target.value; });
    });

    outcomeWrap.querySelectorAll('.outcome-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const outcome = b.getAttribute('data-v');
        Data.addSession({
          activityId: current.id,
          category: 'urge-distraction',
          durationSec,
          outcome: outcome === 'still_having_urge' ? 'still_need_help' : outcome,
          fromUrgeMode: true,
          intensity: meta.intensity || null,
          note: noteText || undefined,
        });
        if (outcome === 'still_having_urge') {
          App.toast('Okay — let\u2019s try something else.');
          runNext();
        } else {
          showFinishChoice(outcome);
        }
      });
    });
  }

  function showFinishChoice(outcome) {
    const body = wrap.querySelector('#dr-body');
    body.innerHTML = '';
    const w = fmt(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="prompt-text">${outcome === 'better' ? 'Glad to hear it.' : 'That\u2019s good — even a little counts.'}</div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;">
          <button class="btn btn-primary" id="fc-finish">Finish</button>
          <button class="btn btn-ghost" id="fc-more">Keep going anyway</button>
        </div>
      </div>
    `);
    body.appendChild(w);
    w.querySelector('#fc-finish').addEventListener('click', () => App.closeOverlay());
    w.querySelector('#fc-more').addEventListener('click', () => runNext());
  }

  runNext();
  return wrap;
}

/* ============================== ACTIVITY RUNNER ============================== */
function renderActivityRunner(activity, meta) {
  const startedAt = Date.now();
  let instance = null;

  const wrap = fmt(`
    <div class="activity-screen focus-mode fade-in">
      <div class="activity-header">
        <div class="title">${activity.name}</div>
        <button class="icon-btn" id="act-close" aria-label="Close">✕</button>
      </div>
      <div class="activity-body" id="act-body"></div>
      <div class="activity-footer">
        <button class="btn btn-ghost btn-block" id="act-done-early">I'm done for now</button>
      </div>
    </div>
  `);

  const body = wrap.querySelector('#act-body');

  wrap.querySelector('#act-close').addEventListener('click', () => {
    if (instance && instance.onExit) instance.onExit();
    App.closeOverlay();
  });
  wrap.querySelector('#act-done-early').addEventListener('click', () => {
    if (instance && instance.onExit) instance.onExit();
    showOutcome();
  });

  instance = activity.run(body, () => showOutcome()) || {};

  function showOutcome() {
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    body.innerHTML = '';
    wrap.querySelector('.activity-footer').classList.add('hidden');
    const outcomeWrap = fmt(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:22px;">
        <div class="prompt-text">How are you feeling now?</div>
        <div class="outcome-grid" id="outcome-grid" style="max-width:340px;">
          <button class="outcome-btn" data-v="better">Better</button>
          <button class="outcome-btn" data-v="a_little_better">A little better</button>
          <button class="outcome-btn" data-v="same">Same</button>
          <button class="outcome-btn" data-v="still_need_help">I still need help</button>
        </div>
      </div>
    `);
    body.appendChild(outcomeWrap);
    outcomeWrap.querySelectorAll('.outcome-btn').forEach((b) => {
      b.addEventListener('click', () => {
        Data.addSession({
          activityId: activity.id,
          category: activity.category,
          durationSec,
          outcome: b.getAttribute('data-v'),
          fromUrgeMode: !!meta.fromUrgeMode,
        });
        if (b.getAttribute('data-v') === 'still_need_help') {
          showStillNeedHelp();
        } else {
          App.closeOverlay();
          App.toast('Logged. Nice work showing up for yourself.');
        }
      });
    });
  }

  function showStillNeedHelp() {
    body.innerHTML = '';
    const w = fmt(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="prompt-text">That's okay. You don't have to push through alone.</div>
        <div style="color:var(--focus-text-2);font-size:13.5px;max-width:280px;">You can try another activity, or look at support options.</div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;">
          <button class="btn btn-primary" id="sh-another">Try another activity</button>
          <button class="btn btn-secondary" id="sh-support">Get Support</button>
          <button class="btn btn-ghost" id="sh-close">Close</button>
        </div>
      </div>
    `);
    body.appendChild(w);
    w.querySelector('#sh-another').addEventListener('click', () => {
      App.closeOverlay();
      App.launchActivity(getRandomActivity(activity.category), { fromUrgeMode: meta.fromUrgeMode });
    });
    w.querySelector('#sh-support').addEventListener('click', () => { App.closeOverlay(); App.openSupport(); });
    w.querySelector('#sh-close').addEventListener('click', () => App.closeOverlay());
  }

  return wrap;
}

/* ============================== ONBOARDING ============================== */
// Quick, skippable tour of the app's main features and where things live in
// Settings, shown once on first open. Steps 1-4 are the tutorial; the person
// can tap "Skip" at any point during it to jump straight into the app.
const TUTORIAL_SLIDES = [
  {
    icon: NavIcons.home,
    tint: 'rgba(52,224,214,0.14)', color: 'var(--cyan)',
    title: 'Start with the Urge button',
    body: "When an urge hits, tap the big button on Home. UrgeAway walks you through a short, guided moment to help it pass.",
  },
  {
    icon: NavIcons.distract,
    tint: 'rgba(139,227,168,0.14)', color: 'var(--green)',
    title: 'Activities, any time',
    body: 'Games, breathing exercises, and short challenges to shift your focus — jump in whenever, not just mid-urge.',
  },
  {
    icon: NavIcons.progress,
    tint: 'rgba(242,197,114,0.14)', color: 'var(--amber)',
    title: 'Progress & Journal',
    body: 'Progress tracks your streaks over time. Journal is a private space to reflect on hard moments — or good ones.',
  },
  {
    icon: NavIcons.settings,
    tint: 'rgba(239,139,111,0.14)', color: 'var(--coral)',
    title: 'Make it yours in Settings',
    body: "Add your own reasons, set up someone to reach out to, schedule reminders, and manage your privacy — all grouped by category so it's easy to find.",
  },
];
const TOTAL_ONBOARD_STEPS = 2 + TUTORIAL_SLIDES.length + 1; // welcome + tutorial slides + choose-activities + control

function renderOnboarding() {
  let step = 0;
  const selected = new Set();
  const activityChoices = ACTIVITIES.map((a) => a.name);
  const chooseStep = 1 + TUTORIAL_SLIDES.length;
  const controlStep = chooseStep + 1;

  const wrap = fmt(`<div class="onboard"></div>`);
  render();

  function render() {
    wrap.innerHTML = '';
    const dots = fmt(`<div class="onboard-dots"></div>`);
    for (let i = 0; i < TOTAL_ONBOARD_STEPS; i++) dots.appendChild(fmt(`<div class="onboard-dot ${i === step ? 'active' : ''}"></div>`));

    let body;
    if (step === 0) {
      body = fmt(`
        <div class="onboard-body fade-in">
          <div class="morph-wrap" style="width:140px;height:140px;">${waveSVG()}</div>
          <h1 class="h1" style="font-size:26px;">Welcome to UrgeAway</h1>
          <p class="subtitle" style="max-width:280px;">Sometimes you don't need to solve everything. You just need something that helps you get through the moment. Here's a quick look around.</p>
        </div>
      `);
    } else if (step >= 1 && step < chooseStep) {
      const slide = TUTORIAL_SLIDES[step - 1];
      body = fmt(`
        <div class="onboard-body fade-in">
          <div style="width:64px;height:64px;border-radius:50%;background:${slide.tint};display:flex;align-items:center;justify-content:center;color:${slide.color};">${slide.icon}</div>
          <h1 class="h1" style="font-size:24px;">${slide.title}</h1>
          <p class="subtitle" style="max-width:290px;">${slide.body}</p>
        </div>
      `);
    } else if (step === chooseStep) {
      body = fmt(`
        <div class="onboard-body fade-in">
          <h1 class="h1" style="font-size:24px;">Choose what helps you</h1>
          <p class="subtitle">Pick a few to start with — you can always try the rest later.</p>
          <div class="choice-wrap" id="ob-choices"></div>
        </div>
      `);
    } else {
      body = fmt(`
        <div class="onboard-body fade-in">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(52,224,214,0.14);display:flex;align-items:center;justify-content:center;color:var(--cyan);">${NavIcons.shield}</div>
          <h1 class="h1" style="font-size:24px;">You're in control</h1>
          <p class="subtitle" style="max-width:290px;">UrgeAway provides optional tools — distraction, grounding, reflection — and doesn't replace professional support. Your data stays on this device.</p>
        </div>
      `);
    }
    wrap.appendChild(dots);
    wrap.appendChild(body);

    if (step === chooseStep) {
      const choicesWrap = body.querySelector('#ob-choices');
      activityChoices.forEach((name) => {
        const pill = document.createElement('button');
        pill.className = 'choice-pill' + (selected.has(name) ? ' selected' : '');
        pill.textContent = name;
        pill.addEventListener('click', () => {
          if (selected.has(name)) selected.delete(name); else selected.add(name);
          render();
        });
        choicesWrap.appendChild(pill);
      });
    }

    const footer = fmt(`<div class="onboard-footer"></div>`);
    if (step < controlStep) {
      const skipLabel = step >= 1 && step < chooseStep ? 'Skip tutorial' : 'Skip';
      const skip = fmt(`<button class="btn btn-ghost" style="flex:1;">${skipLabel}</button>`);
      const next = fmt(`<button class="btn btn-primary" style="flex:2;">Continue</button>`);
      skip.addEventListener('click', finish);
      next.addEventListener('click', () => { step += 1; render(); });
      footer.appendChild(skip);
      footer.appendChild(next);
    } else {
      const start = fmt(`<button class="btn btn-primary btn-block">Get started</button>`);
      start.addEventListener('click', finish);
      footer.appendChild(start);
    }
    wrap.appendChild(footer);
  }

  function finish() {
    Data.setOnboarded(Array.from(selected));
    App.completeOnboarding();
  }

  return wrap;
}
