/* ==========================================================================
   Screens — one render function per tab. Each returns/populates a DOM node
   appended into #screen-container by app.js's router.
   ========================================================================== */

const NavIcons = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  activities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15v3"/><path d="M12 10v8"/><path d="M17 6v12"/></svg>',
  journal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
  distract: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  calm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.6 4.6a2 2 0 1 1 1.4 3.4H2"/><path d="M13.2 19.4a2 2 0 1 0 1.4-3.4H2"/><path d="M17.4 8a2.5 2.5 0 1 1 1.6 4.4H2"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
  write: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
  dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1" fill="currentColor" stroke="none"/></svg>',
  reachOut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a4 4 0 0 1-4 4H6l-3 3V6a2 2 0 0 1 2-2h6a4 4 0 0 1 4 4Z"/><path d="M17 12a4 4 0 0 0 4-4V5a2 2 0 0 0-2-2h-6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 0-20 8 8 0 0 1 0 16h-1.5a1.5 1.5 0 0 1-1-2.6 1.5 1.5 0 0 0-1-2.6H8a2 2 0 0 1-2-2 10 10 0 0 1 6-9"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="7.5" r="1" fill="currentColor" stroke="none"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11.5v5.5"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/></svg>',
  lifebuoy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m8.4 8.4-2.5-2.5M15.6 8.4l2.5-2.5M15.6 15.6l2.5 2.5M8.4 15.6l-2.5 2.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.2 5-6 8-6s6.5 1.8 8 6"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>',
};

// Tint per quick-action / activity category, so icon tiles read at a glance
// instead of all looking identical.
const TINTS = {
  distract: { bg: 'rgba(52,224,214,0.14)', fg: 'var(--cyan)' },
  challenge: { bg: 'rgba(242,197,114,0.14)', fg: 'var(--amber)' },
  calm: { bg: 'rgba(139,227,168,0.14)', fg: 'var(--green)' },
  write: { bg: 'rgba(239,139,111,0.14)', fg: 'var(--coral)' },
};
function iconTileStyle(kind) {
  const t = TINTS[kind] || TINTS.distract;
  return `background:${t.bg};color:${t.fg};`;
}

function fmt(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
// Shared platform check — used to hide/adapt features that are Android-only
// (Google Sign-In has no iOS setup here; Screen Pinning has no iOS API at all).
function isIOS() {
  return !!(window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() === 'ios');
}

/* ---------------- Signature wave (calm, home screen) ---------------- */
function waveSVG() {
  return `
  <svg viewBox="0 0 220 46" width="100%" height="100%" preserveAspectRatio="none">
    <path d="M0 23 C 18 8, 36 8, 55 23 S 92 38, 110 23 S 147 8, 165 23 S 202 38, 220 23"
      fill="none" stroke="url(#waveGrad)" stroke-width="4" stroke-linecap="round"/>
    <defs>
      <linearGradient id="waveGrad" x1="0" y1="0" x2="220" y2="0">
        <stop offset="0%" stop-color="#34e0d6"/>
        <stop offset="100%" stop-color="#8be3a8"/>
      </linearGradient>
    </defs>
  </svg>`;
}

/* ============================== HOME ============================== */
function shortRemainingLabel(remainingMs) {
  if (remainingMs <= 0) return 'unlocking soon';
  const totalMin = Math.ceil(remainingMs / 60000);
  if (totalMin < 60) return `${totalMin} min left`;
  const totalHours = Math.ceil(totalMin / 60);
  if (totalHours < 24) return `${totalHours} hour${totalHours === 1 ? '' : 's'} left`;
  const totalDays = Math.ceil(totalHours / 24);
  if (totalDays < 60) return `${totalDays} day${totalDays === 1 ? '' : 's'} left`;
  return `${Math.round(totalDays / 30)} months left`;
}

function renderHome() {
  const today = Data.getTodaySessions();
  const urgeToday = Data.getUrgeSessionsToday().length;
  const streak = Data.getStreak();
  const protecting = Data.getStreakProtecting();

  const dashName = Data.getProfileName();
  const dashPic = Data.getProfilePic();
  const dashUser = window.Auth && Auth.available() ? Auth.getCurrentUser() : null;
  const dashInitial = ((dashName || (dashUser && dashUser.email) || '').trim()[0] || '').toUpperCase();
  const avatarInner = dashPic
    ? `<img src="${dashPic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : dashInitial
      ? `<span style="width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--cyan),var(--green));color:#04211e;font-weight:800;font-size:15px;">${escapeHtml(dashInitial)}</span>`
      : `<span style="width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);color:var(--text-1);">${NavIcons.user}</span>`;

  const unreadNotifs = Data.getUnreadNotifCount();

  const wrap = fmt(`
    <div class="screen">
      <div class="screen-scroll">
        <div class="topbar" style="padding:var(--space-2) 0 0;display:flex;align-items:center;gap:10px;">
          <button class="icon-btn" id="btn-dashboard" aria-label="Your dashboard" style="width:40px;height:40px;padding:0;overflow:hidden;flex-shrink:0;">${avatarInner}</button>
          <div style="min-width:0;flex:1;">
            <p class="eyebrow" style="margin-bottom:0;">UrgeAway</p>
            <p class="subtitle" style="margin-top:-2px;">A better next few minutes.</p>
          </div>
          <button class="icon-btn" id="btn-notifications" aria-label="Notifications" style="width:40px;height:40px;flex-shrink:0;position:relative;">
            ${NavIcons.bell}
            ${unreadNotifs > 0 ? `<span style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;padding:0 3px;border-radius:999px;background:var(--coral);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;">${unreadNotifs}</span>` : ''}
          </button>
        </div>

        <div id="notif-banner-slot"></div>

        <div class="urge-hero" style="margin-top:var(--space-3);">
          <div class="wave-wrap">${waveSVG()}</div>
          <button class="urge-btn" id="btn-urge">I HAVE AN URGE</button>
          <p class="hint">Tap it. We'll take it from there.</p>
        </div>

        <p class="section-title">What do you need right now?</p>
        <div class="option-grid" id="quick-options"></div>

        <div id="lockin-status-slot"></div>

        <p class="section-title">Today</p>
        <div class="stat-row">
          <div class="stat"><div class="num">${urgeToday}</div><div class="lbl">Urges handled</div></div>
          <div class="stat"><div class="num">${today.length}</div><div class="lbl">Activities completed</div></div>
          <div class="stat"><div class="num">${streak.count || 0}</div><div class="lbl">Day streak</div></div>
        </div>
        ${protecting ? `<div style="text-align:center;color:var(--text-2);font-size:12px;margin-top:var(--space-2);">Protecting: <span style="color:var(--cyan);font-weight:600;">${escapeHtml(protecting)}</span></div>` : ''}
      </div>
    </div>
  `);

  wrap.querySelector('#btn-urge').addEventListener('click', () => App.openUrgeMode());
  wrap.querySelector('#btn-dashboard').addEventListener('click', () => App.openUserDashboard());
  wrap.querySelector('#btn-notifications').addEventListener('click', () => App.openNotifications());

  if (!Data.isNotifBannerShown()) {
    const bannerSlot = wrap.querySelector('#notif-banner-slot');
    const banner = fmt(`
      <div class="notif-banner fade-in">
        <div class="icon">${NavIcons.bell}</div>
        <div class="body">
          <div class="t">Turn on notifications</div>
          <div class="d">Get gentle daily reminders and occasional updates from UrgeAway.</div>
          <button class="btn btn-secondary" id="notif-banner-turnon" style="padding:8px 16px;font-size:13px;">Turn on</button>
        </div>
        <button class="close" id="notif-banner-close">✕</button>
      </div>
    `);
    bannerSlot.appendChild(banner);
    banner.querySelector('#notif-banner-turnon').addEventListener('click', () => {
      Data.setNotifBannerShown();
      App.goToTab('settings', { highlightNotif: true });
    });
    banner.querySelector('#notif-banner-close').addEventListener('click', () => {
      Data.setNotifBannerShown();
      banner.remove();
    });
  }

  const quickOptions = [
    { label: 'Distract me', desc: 'A light game', icon: NavIcons.distract, tint: 'distract', action: () => App.launchActivity(getActivitiesByCategory('distract')[Math.floor(Math.random() * getActivitiesByCategory('distract').length)], { fromUrgeMode: false }) },
    { label: 'Calm me down', desc: 'Breathe & ground', icon: NavIcons.calm, tint: 'calm', action: () => App.launchActivity(getActivitiesByCategory('calm')[Math.floor(Math.random() * getActivitiesByCategory('calm').length)], { fromUrgeMode: false }) },
    { label: 'Help me reset', desc: 'Focus reset', icon: NavIcons.reset, tint: 'calm', action: () => App.launchActivity(getActivityById('focus_reset'), { fromUrgeMode: false }) },
    { label: 'Let me write', desc: 'Private journal', icon: NavIcons.write, tint: 'write', action: () => App.goToTab('journal', { openWrite: true }) },
    { label: 'Challenge me', desc: 'Attention task', icon: NavIcons.target, tint: 'challenge', action: () => App.launchActivity(getActivitiesByCategory('challenge')[Math.floor(Math.random() * getActivitiesByCategory('challenge').length)], { fromUrgeMode: false }) },
    { label: 'Reach out', desc: 'One tap message', icon: NavIcons.reachOut, tint: 'write', action: () => App.triggerReachOut() },
    { label: 'Lock In Mode', desc: 'Block an app for a while', icon: NavIcons.lock, tint: 'challenge', action: () => App.openLockInMode() },
  ];
  const grid = wrap.querySelector('#quick-options');
  quickOptions.forEach((opt, idx) => {
    const card = document.createElement('button');
    card.className = 'option-card card-tap fade-in-up';
    card.style.animationDelay = `${idx * 45}ms`;
    card.innerHTML = `<div class="icon" style="${iconTileStyle(opt.tint)}">${opt.icon}</div><div class="label">${opt.label}</div><div style="color:var(--text-2);font-size:10.5px;line-height:1.25;">${opt.desc}</div>`;
    card.addEventListener('click', opt.action);
    grid.appendChild(card);
  });

  if (window.AppLock && AppLock.available()) {
    AppLock.getLockedApps().then((locks) => {
      if (!locks.length) return;
      const slot = wrap.querySelector('#lockin-status-slot');
      if (!slot) return;      const soonest = locks.slice().sort((a, b) => a.unlockAt - b.unlockAt)[0];
      const remainingMs = soonest.unlockAt - Date.now();
      const label = shortRemainingLabel(remainingMs);
      const strip = fmt(`
        <button class="card card-tap" style="margin-top:var(--space-2);border-color:rgba(242,197,114,0.28);display:flex;align-items:center;gap:10px;text-align:left;width:100%;padding:var(--space-3);">
          <div class="icon" style="${iconTileStyle('challenge')}width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${NavIcons.lock}</div>
          <div style="min-width:0;">
            <div style="font-weight:700;font-size:13px;">${locks.length} app${locks.length === 1 ? '' : 's'} locked in</div>
            <div style="color:var(--text-2);font-size:11px;">Next unlock: ${label}</div>
          </div>
        </button>
      `);
      strip.addEventListener('click', () => App.openLockInMode());
      slot.appendChild(strip);
    });
  }

  return wrap;
}

/* ============================== ACTIVITIES TAB ============================== */
function renderActivitiesTab() {
  const wrap = fmt(`
    <div class="screen">
      <div class="screen-fixed">
        <div class="topbar" style="padding:var(--space-2) 0 0;">
          <h1 class="h1" style="font-size:24px;">Activities</h1>
          <p class="subtitle" style="font-size:13px;">Browse anytime — not just during an urge.</p>
        </div>
        <div id="act-sections" style="display:flex;flex-direction:column;flex:1;justify-content:center;gap:var(--space-1);"></div>
        <div id="act-recommended"></div>
      </div>
    </div>
  `);
  const sections = wrap.querySelector('#act-sections');
  const groups = [
    { key: 'distract', title: 'Distract', desc: 'Short games to shift your attention' },
    { key: 'challenge', title: 'Challenge', desc: 'Simple attention tasks' },
    { key: 'calm', title: 'Calm', desc: 'Breathing & grounding' },
  ];
  groups.forEach((g, gIdx) => {
    sections.appendChild(fmt(`<p class="section-title">${g.title}</p>`));
    const grid = fmt(`<div class="option-grid"></div>`);
    getActivitiesByCategory(g.key).forEach((a, idx) => {
      const card = document.createElement('button');
      card.className = 'option-card card-tap fade-in-up';
      card.style.animationDelay = `${(gIdx * 3 + idx) * 40}ms`;
      card.innerHTML = `<div class="icon" style="${iconTileStyle(g.key)}">${a.icon}</div><div class="label">${a.name}</div><div style="color:var(--text-2);font-size:10.5px;">${a.minutes}</div>`;
      card.addEventListener('click', () => App.launchActivity(a, { fromUrgeMode: false }));
      grid.appendChild(card);
    });
    sections.appendChild(grid);
  });

  const rec = Data.getRecommendedActivity(ACTIVITIES);
  if (rec) {
    const recSlot = wrap.querySelector('#act-recommended');
    const recCard = fmt(`
      <button class="card card-tap" style="margin-top:var(--space-3);border-color:rgba(52,224,214,0.28);display:flex;align-items:center;gap:10px;text-align:left;width:100%;padding:var(--space-3);">
        <div class="icon" style="${iconTileStyle(rec.category)}width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${rec.icon}</div>
        <div style="min-width:0;">
          <div style="font-weight:700;font-size:13px;">${rec.name} seems to help you</div>
          <div style="color:var(--text-2);font-size:11px;">Tap to try it now</div>
        </div>
      </button>
    `);
    recCard.addEventListener('click', () => App.launchActivity(rec, { fromUrgeMode: false }));
    recSlot.appendChild(recCard);
  }

  return wrap;
}

/* ============================== PROGRESS TAB ============================== */
function renderProgressTab() {
  const stats = Data.getStats();
  const rl = Data.getResistanceStats();
  const wrap = fmt(`
    <div class="screen">
      <div class="screen-fixed">
        <div class="topbar" style="padding:var(--space-2) 0 0;">
          <h1 class="h1" style="font-size:24px;">Progress</h1>
          <p class="subtitle" style="font-size:13px;">No pressure here — just a record of showing up.</p>
        </div>

        <div class="card" style="margin-top:var(--space-3);padding:var(--space-3);">
          <div style="display:flex;align-items:baseline;justify-content:space-between;">
            <div>
              <div style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--text-0);">Level ${rl.level}</div>
              <div style="color:var(--cyan);font-size:12.5px;font-weight:600;">${rl.levelName}</div>
            </div>
            <div style="text-align:right;color:var(--text-2);font-size:11.5px;">
              <div style="font-family:var(--font-display);font-size:18px;font-weight:800;color:var(--text-0);">${rl.points}</div>
              points
            </div>
          </div>
          ${rl.nextLevelName ? `
            <div style="margin-top:var(--space-2);">
              <div style="height:7px;border-radius:var(--radius-full);background:var(--bg-3);overflow:hidden;">
                <div style="height:100%;width:${Math.round(rl.progressToNext * 100)}%;background:linear-gradient(90deg,var(--cyan),var(--green));border-radius:var(--radius-full);"></div>
              </div>
              <div style="color:var(--text-2);font-size:11px;margin-top:5px;">${rl.pointsToNext} points to ${rl.nextLevelName}</div>
            </div>
          ` : `<div style="color:var(--text-2);font-size:11px;margin-top:var(--space-2);">Top level reached</div>`}
          <div style="display:flex;gap:var(--space-4);margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--line);">
            <div>
              <div style="font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--text-0);">${rl.appOpenDays}</div>
              <div style="color:var(--text-2);font-size:10.5px;">days shown up</div>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--text-0);">${rl.streakDays}</div>
              <div style="color:var(--text-2);font-size:10.5px;">day streak</div>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--text-0);">${rl.percentResisted}%</div>
              <div style="color:var(--text-2);font-size:10.5px;">felt better after</div>
            </div>
          </div>
        </div>

        <p style="color:var(--text-2);font-size:10.5px;line-height:1.4;margin:var(--space-2) 0 0;">Grows slowly and steadily — showing up, your streak, and how your urge sessions go all count.</p>

        <div style="flex:1;"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
          <div>
            <p class="section-title" style="margin-top:0;">Most used</p>
            <div id="most-used" class="card" style="padding:var(--space-2) var(--space-3);"></div>
          </div>
          <div>
            <p class="section-title" style="margin-top:0;">You said helped</p>
            <div id="most-helpful" class="card" style="padding:var(--space-2) var(--space-3);"></div>
          </div>
        </div>
      </div>
    </div>
  `);

  function friendlyDistractionLabel(id) {
    const prefixMap = [
      ['memory_', 'Memory Replay'],
      ['future_', 'Future Visualization'],
      ['imagination_', 'Imagination Challenge'],
      ['fun_', 'Fun Question'],
      ['creative_', 'Creative Challenge'],
      ['mystery_', 'Mystery'],
      ['mg_name_', 'Name Challenge'],
      ['mg_assoc_', 'Word Association'],
      ['mg_odd_', 'Odd One Out'],
      ['mg_logic_', 'Logic Puzzle'],
      ['vg_odds_', 'Find the Different One'],
      ['vg_oddl_', 'Find the Different One'],
      ['vg_flash_', 'Memory Flash'],
      ['dream_', 'Build Your Dream'],
      ['sixty_', '60-Second Challenge'],
    ];
    const match = prefixMap.find(([prefix]) => id.startsWith(prefix));
    return match ? match[1] : id;
  }

  function listOrEmpty(container, pairs, emptyText) {
    if (!pairs.length) {
      container.innerHTML = `<div style="color:var(--text-2);font-size:11px;padding:var(--space-2) 0;">${emptyText}</div>`;
      return;
    }
    pairs.slice(0, 3).forEach(([id, count]) => {
      const a = getActivityById(id);
      const label = a ? a.name : friendlyDistractionLabel(id);
      const row = fmt(`
        <div class="list-row" style="padding:7px 0;">
          <div class="label" style="font-weight:600;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</div>
          <div style="color:var(--text-2);font-size:11px;flex-shrink:0;margin-left:6px;">${count}×</div>
        </div>
      `);
      container.appendChild(row);
    });
  }
  listOrEmpty(wrap.querySelector('#most-used'), stats.mostUsed, 'Nothing yet.');
  listOrEmpty(wrap.querySelector('#most-helpful'), stats.mostHelpful, 'Rate activities to see this.');

  return wrap;
}

/* ============================== JOURNAL TAB ============================== */
function renderJournalTab(options) {
  const opts = options || {};
  const entries = Data.getJournalEntries();
  const prompts = [
    'What triggered this moment?',
    'What am I feeling right now?',
    'What do I actually need?',
    'What would future me want me to do next?',
    'What helped last time?',
  ];

  const wrap = fmt(`
    <div class="screen">
      <div class="screen-fixed">
        <div class="topbar" style="padding:var(--space-2) 0 0;display:flex;align-items:flex-start;justify-content:space-between;">
          <div>
            <h1 class="h1" style="font-size:24px;">Journal</h1>
            <p class="subtitle" style="font-size:13px;">Private. Stored only on this device.</p>
          </div>
        </div>

        <div id="journal-compose" style="margin-top:var(--space-3);"></div>

        <p class="section-title">Past entries</p>
        <div id="journal-entries" class="inner-scroll"></div>
      </div>
    </div>
  `);

  const compose = wrap.querySelector('#journal-compose');
  function showComposer(prefillPrompt) {
    compose.innerHTML = '';
    const box = fmt(`
      <div class="card" style="padding:var(--space-3);">
        <div id="jc-prompts"></div>
        <textarea class="journal-input" id="jc-text" placeholder="Write whatever's true right now..." style="margin-top:var(--space-2);min-height:56px;font-size:13.5px;padding:var(--space-3);"></textarea>
        <button class="btn btn-primary btn-block" id="jc-save" style="margin-top:var(--space-2);padding:12px 20px;font-size:14.5px;">Save entry</button>
      </div>
    `);
    compose.appendChild(box);
    let selectedPrompt = prefillPrompt || null;
    const promptsWrap = box.querySelector('#jc-prompts');
    prompts.forEach((p) => {
      const chip = document.createElement('button');
      chip.className = 'prompt-chip';
      chip.textContent = p;
      chip.style.cursor = 'pointer';
      chip.style.border = 'none';
      if (p === selectedPrompt) { chip.style.background = 'rgba(52,224,214,0.14)'; chip.style.color = 'var(--cyan)'; }
      chip.addEventListener('click', () => { selectedPrompt = p; showComposer(p); box.querySelector('#jc-text').focus(); });
      promptsWrap.appendChild(chip);
    });
    box.querySelector('#jc-save').addEventListener('click', () => {
      const text = box.querySelector('#jc-text').value.trim();
      if (!text) { App.toast('Write something first, or tap a prompt for ideas.'); return; }
      Data.addJournalEntry(selectedPrompt || 'Free write', text);
      App.toast('Entry saved');
      App.refreshTab('journal');
    });
  }
  showComposer(opts.openWrite ? null : null);

  // Past entries live in their own small scrolling region (.inner-scroll)
  // instead of scrolling the page — the composer above and the tab bar
  // below always stay put, even if there are many entries.
  const entriesWrap = wrap.querySelector('#journal-entries');
  if (!entries.length) {
    entriesWrap.appendChild(fmt(`<div class="empty-state"><div class="big" style="color:var(--text-3);width:32px;height:32px;margin:0 auto var(--space-2);">${NavIcons.journal}</div>Nothing written yet. Whatever's on your mind is welcome here.</div>`));
  } else {
    const card = fmt(`<div class="card" style="padding:var(--space-1) var(--space-3);"></div>`);
    entries.forEach((e) => {
      const d = new Date(e.date);
      const row = fmt(`
        <div class="entry-card card-tap">
          <div class="entry-date">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
          <div class="entry-prompt">${escapeHtml(e.prompt)}</div>
          <div class="entry-text clamp">${escapeHtml(e.text)}</div>
        </div>
      `);
      row.addEventListener('click', () => row.querySelector('.entry-text').classList.toggle('clamp'));
      card.appendChild(row);
    });
    entriesWrap.appendChild(card);
  }

  return wrap;
}

/* ============================== SETTINGS TAB ============================== */
// Settings is a short menu of categories (so the page never gets long); each
// row drills into its own sub-screen. The tab bar lives outside this tab's
// scroll area (see app.js/index.html), so it stays fixed on screen the whole
// time, including while browsing a sub-screen.
let settingsSubview = null; // null = menu; otherwise one of SETTINGS_SUBVIEW_TITLES' keys

const SETTINGS_SUBVIEW_TITLES = {
  appearance: 'Appearance',
  notifications: 'Notifications & Reminders',
  reasons: 'My Reasons',
  'reach-out': 'Reach Out',
  protecting: "What You're Protecting",
  'privacy-data': 'Privacy & Your Data',
  about: 'About UrgeAway',
  'urge-lock': 'Urge Lock',
};

const SETTINGS_MENU = [
  {
    group: 'Account',
    items: [
      { key: 'account', title: 'Account', descFn: () => { const u = window.Auth && Auth.available() && Auth.getCurrentUser(); return u ? (Data.getProfileName() || u.email || 'Signed in') : 'Sign in, profile, notifications'; }, icon: NavIcons.user, tint: 'distract', action: 'openDashboard' },
      { key: 'logout', title: 'Log Out', desc: 'Sign out of this device', icon: NavIcons.logout, tint: 'write', action: 'logout', showIf: () => !!(window.Auth && Auth.available() && Auth.getCurrentUser()) },
    ],
  },
  {
    group: 'Preferences',
    items: [
      { key: 'appearance', title: 'Appearance', desc: 'Light, dark, or match your device', icon: NavIcons.palette, tint: 'calm' },
      { key: 'notifications', title: 'Notifications & Reminders', desc: 'Gentle nudges, haptics, custom reminders', icon: NavIcons.bell, tint: 'challenge' },
      { key: 'urge-lock', title: 'Urge Lock', desc: 'Screen Pinning setup for 7-10 intensity urges', icon: NavIcons.lock, tint: 'distract' },
      { key: 'lock-in-mode', title: 'Lock In Mode', desc: 'Block chosen apps for days, months, or years', icon: NavIcons.shield, tint: 'challenge', action: 'openLockInMode' },
    ],
  },
  {
    group: 'Personal',
    items: [
      { key: 'reasons', title: 'My Reasons', desc: 'Why this matters to you', icon: NavIcons.write, tint: 'write' },
      { key: 'reach-out', title: 'Reach Out', desc: 'Your trusted contact', icon: NavIcons.reachOut, tint: 'distract' },
      { key: 'protecting', title: "What You're Protecting", desc: 'Shown next to your streak on Home', icon: NavIcons.shield, tint: 'calm' },
    ],
  },
  {
    group: 'Data',
    items: [
      { key: 'privacy-data', title: 'Privacy & Your Data', desc: 'What we store, export, or clear', icon: NavIcons.lock, tint: 'distract' },
    ],
  },
  {
    group: 'More',
    items: [
      { key: 'support', title: 'Get Support', desc: 'Resources beyond this app', icon: NavIcons.lifebuoy, tint: 'challenge', action: 'openSupport' },
      { key: 'about', title: 'About UrgeAway', desc: 'Version & disclaimer', icon: NavIcons.info, tint: 'calm' },
    ],
  },
];

function renderSettingsTab(opts) {
  if (opts && opts.highlightNotif) settingsSubview = 'notifications';
  else if (opts && opts.highlightReachOut) settingsSubview = 'reach-out';
  else if (opts && opts.highlightAnalytics) settingsSubview = 'privacy-data';
  else if (!(opts && opts.__refresh)) settingsSubview = null; // fresh navigation to the tab lands on the menu

  return settingsSubview ? renderSettingsSubview(settingsSubview, opts) : renderSettingsMenu();
}

function renderSettingsMenu() {
  const wrap = fmt(`
    <div class="screen">
      <div class="screen-scroll">
        <div class="topbar" style="padding:var(--space-5) 0 0;">
          <h1 class="h1">Settings</h1>
        </div>
      </div>
    </div>
  `);
  const scroll = wrap.querySelector('.screen-scroll');
  SETTINGS_MENU.forEach((group, gi) => {
    const items = group.items.filter((item) => !item.showIf || item.showIf());
    if (!items.length) return;
    scroll.appendChild(fmt(`<p class="section-title"${gi === 0 ? ' style="margin-top:0;"' : ''}>${group.group}</p>`));
    const card = fmt(`<div class="card" style="padding:0;"></div>`);
    items.forEach((item) => {
      const desc = item.descFn ? item.descFn() : item.desc;
      const row = fmt(`
        <div class="settings-menu-row card-tap" tabindex="0">
          <div class="settings-menu-icon" style="${iconTileStyle(item.tint)}">${item.icon}</div>
          <div class="settings-menu-text">
            <div class="label">${item.title}</div>
            <div class="desc">${escapeHtml(desc)}</div>
          </div>
          <span class="settings-menu-chevron">${NavIcons.chevronRight}</span>
        </div>
      `);
      row.addEventListener('click', () => {
        if (item.action === 'openSupport') { App.openSupport(); return; }
        if (item.action === 'openDashboard') { App.openUserDashboard(); return; }
        if (item.action === 'openLockInMode') { App.openLockInMode(); return; }
        if (item.action === 'logout') {
          if (confirm('Sign out of UrgeAway on this device?')) {
            Auth.signOutUser().then(() => { App.toast('Signed out'); App.refreshTab('settings'); });
          }
          return;
        }
        settingsSubview = item.key;
        App.refreshTab('settings');
      });
      card.appendChild(row);
    });
    scroll.appendChild(card);
  });
  return wrap;
}

function renderSettingsSubview(key, opts) {
  const title = SETTINGS_SUBVIEW_TITLES[key] || 'Settings';
  const wrap = fmt(`
    <div class="screen">
      <div class="activity-header">
        <button class="icon-btn" id="settings-back" aria-label="Back to Settings">${NavIcons.chevronLeft}</button>
        <div class="title">${title}</div>
        <div style="width:36px;"></div>
      </div>
      <div class="screen-scroll" style="padding-top:var(--space-3);" id="settings-subview-body"></div>
    </div>
  `);
  wrap.querySelector('#settings-back').addEventListener('click', () => {
    settingsSubview = null;
    App.refreshTab('settings');
  });

  const body = wrap.querySelector('#settings-subview-body');
  switch (key) {
    case 'appearance': renderAppearanceSubview(body); break;
    case 'notifications': renderNotificationsSubview(body, opts); break;
    case 'reasons': renderReasonsSubview(body); break;
    case 'reach-out': renderReachOutSubview(body, opts); break;
    case 'protecting': renderProtectingSubview(body); break;
    case 'privacy-data': renderPrivacyDataSubview(body, opts); break;
    case 'about': renderAboutSubview(body); break;
    case 'urge-lock': renderUrgeLockSubview(body); break;
    default: break;
  }
  return wrap;
}

/* ---------------- Urge Lock ---------------- */
function renderUrgeLockSubview(body) {
  const ios = window.isIOS && isIOS();
  const node = fmt(`
    <div>
      <p class="section-title" style="margin-top:0;">Urge Lock</p>
      <div class="card" style="color:var(--text-2);font-size:12.5px;line-height:1.5;margin-bottom:var(--space-3);">
        ${ios
          ? 'For urges you rate 7 or higher, Urge Lock starts a timed, focused session. iOS doesn\u2019t let any app lock itself to the screen \u2014 only you can do that, using Apple\u2019s Guided Access. UrgeAway can\u2019t turn it on or off for you.'
          : 'For urges you rate 7 or higher, Urge Lock starts a timed, focused session and uses Android\'s built-in Screen Pinning to keep UrgeAway in front while it runs. Screen Pinning is controlled by Android, not UrgeAway \u2014 you can always exit it the way your phone documents.'}
      </div>
      <p class="section-title">Status</p>
      <div class="card">
        <div class="list-row">
          <div>
            <div class="label" id="ul-status-label">Checking\u2026</div>
            <div class="desc">${ios ? 'Apple\u2019s Guided Access' : 'Android\u2019s Screen Pinning / App Pinning'}</div>
          </div>
        </div>
      </div>
      <button class="btn btn-secondary btn-block" id="ul-setup-btn" style="margin-top:var(--space-3);">${ios ? 'HOW TO TURN ON GUIDED ACCESS' : 'SET UP URGE LOCK'}</button>
      ${ios ? `<div class="card" id="ul-ios-steps" style="margin-top:var(--space-3);color:var(--text-2);font-size:12.5px;line-height:1.6;display:none;">
        1. Open the iPhone <strong>Settings</strong> app<br/>
        2. Go to <strong>Accessibility \u2192 Guided Access</strong> and turn it on<br/>
        3. Set a Guided Access passcode<br/>
        4. Whenever you start Urge Lock in UrgeAway, triple-click the side (or Home) button to lock yourself into the app for the session
      </div>` : ''}
    </div>
  `);
  body.appendChild(node);
  refreshStatus();

  function refreshStatus() {
    const label = node.querySelector('#ul-status-label');
    const btn = node.querySelector('#ul-setup-btn');
    if (ios) {
      label.textContent = Data.isUrgeLockSetupDone() ? 'You\u2019ve reviewed the steps' : 'Manual — set up in iPhone Settings';
      return;
    }
    if (!ScreenPinning.available()) {
      label.textContent = 'Unavailable in this preview';
      btn.classList.add('hidden');
      return;
    }
    const done = Data.isUrgeLockSetupDone();
    label.textContent = done ? 'Ready' : 'Setup required';
    btn.classList.toggle('hidden', done);
  }

  node.querySelector('#ul-setup-btn').addEventListener('click', async () => {
    if (ios) {
      const steps = node.querySelector('#ul-ios-steps');
      if (steps) steps.style.display = steps.style.display === 'none' ? 'block' : 'none';
      Data.setUrgeLockSetupDone();
      refreshStatus();
      return;
    }
    App.toast('Opening Android Security settings\u2026 look for App pinning');
    await ScreenPinning.openPinningSettings();
    Data.setUrgeLockSetupDone();
    refreshStatus();
  });
}

/* ---------------- Appearance ---------------- */
function renderAppearanceSubview(body) {
  const currentTheme = Data.getSettings().theme || 'system';
  const node = fmt(`
    <div>
      <p class="section-title" style="margin-top:0;">Theme</p>
      <div class="card">
        <div class="choice-wrap" id="theme-pills" style="justify-content:flex-start;">
          <button class="choice-pill" data-theme="system">System</button>
          <button class="choice-pill" data-theme="light">Light</button>
          <button class="choice-pill" data-theme="dark">Dark</button>
        </div>
      </div>
    </div>
  `);
  body.appendChild(node);
  node.querySelectorAll('#theme-pills .choice-pill').forEach((pill) => {
    pill.classList.toggle('selected', pill.getAttribute('data-theme') === currentTheme);
    pill.addEventListener('click', () => {
      const theme = pill.getAttribute('data-theme');
      Data.setSettings({ theme });
      App.applyTheme();
      node.querySelectorAll('#theme-pills .choice-pill').forEach((p) => p.classList.toggle('selected', p === pill));
    });
  });
}

/* ---------------- Notifications & Reminders ---------------- */
function renderNotificationsSubview(body, opts) {
  const settings = Data.getSettings();
  const node = fmt(`
    <div>
      <p class="section-title" style="margin-top:0;">Notifications</p>
      <div class="card">
        <div class="list-row" id="row-gentle-reminders">
          <div>
            <div class="label">Gentle reminders</div>
            <div class="desc">One nudge a day, around 10am, plus occasional updates from UrgeAway. Never reveals anything sensitive on your lock screen.</div>
          </div>
          <button class="toggle ${settings.notificationsEnabled ? 'on' : ''}" id="toggle-notif"><span class="knob"></span></button>
        </div>
        <div class="list-row">
          <div>
            <div class="label">Haptic feedback</div>
            <div class="desc">Subtle vibration on key actions</div>
          </div>
          <button class="toggle ${settings.haptics ? 'on' : ''}" id="toggle-haptics"><span class="knob"></span></button>
        </div>
      </div>
      <div style="color:var(--text-2);font-size:11.5px;margin-top:6px;padding:0 var(--space-1);" id="push-status">
        ${settings.notificationsEnabled ? (settings.pushEnabled ? 'Broadcast messages: connected' : 'Broadcast messages: not connected — turn the toggle off and back on to retry') : 'Turn on Gentle reminders to also receive broadcast messages from UrgeAway'}
      </div>

      <p class="section-title">Your reminders</p>
      <div class="card" style="margin-bottom:var(--space-3);color:var(--text-2);font-size:12.5px;line-height:1.5;">
        Set a reminder for a time an urge tends to hit, with your own message to yourself — like an alarm, just for you.
      </div>
      <div id="reminders-list"></div>
      <button class="btn btn-secondary btn-block" id="btn-add-reminder" style="margin-top:var(--space-3);">+ Add a reminder</button>
      <div id="reminder-composer" style="margin-top:var(--space-3);"></div>
    </div>
  `);
  body.appendChild(node);

  node.querySelector('#toggle-notif').addEventListener('click', async (e) => {
    const toggleEl = e.currentTarget;
    const turningOn = !Data.getSettings().notificationsEnabled;
    if (turningOn) {
      toggleEl.style.opacity = '0.6';
      const result = await Notifications.enable();
      toggleEl.style.opacity = '1';
      if (result.ok) {
        Data.setSettings({ notificationsEnabled: true });
        toggleEl.classList.add('on');
        App.toast('Reminders on — one gentle nudge a day');
        // Same permission grant covers push/cloud messaging too — but
        // registration can fail on its own (no network, FCM misconfigured,
        // etc.), so surface that instead of only silently trying.
        const statusEl = node.querySelector('#push-status');
        if (window.Push && Push.available()) {
          const pushResult = await Push.enable();
          Data.setSettings({ pushEnabled: !!pushResult.ok });
          if (statusEl) statusEl.textContent = pushResult.ok ? 'Broadcast messages: connected' : 'Broadcast messages: could not connect — check your connection and try the toggle again';
        } else if (statusEl) {
          statusEl.textContent = 'Broadcast messages need the installed app, not this preview';
        }
      } else if (result.reason === 'unsupported') {
        App.toast('Reminders need the installed app, not this preview');
      } else if (result.reason === 'denied') {
        App.toast('Notification permission was denied');
      } else {
        App.toast('Could not enable reminders — try again');
      }
    } else {
      await Notifications.disable();
      Data.setSettings({ notificationsEnabled: false, pushEnabled: false });
      toggleEl.classList.remove('on');
      App.toast('Reminders off');
      const statusEl = node.querySelector('#push-status');
      if (statusEl) statusEl.textContent = 'Turn on Gentle reminders to also receive broadcast messages from UrgeAway';
    }
  });
  node.querySelector('#toggle-haptics').addEventListener('click', (e) => {
    const s = Data.setSettings({ haptics: !Data.getSettings().haptics });
    e.currentTarget.classList.toggle('on', s.haptics);
  });

  if (opts && opts.highlightNotif) {
    const row = node.querySelector('#row-gentle-reminders');
    if (row) {
      setTimeout(() => {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('highlight-pulse');
        setTimeout(() => row.classList.remove('highlight-pulse'), 3200);
      }, 150);
    }
  }

  renderRemindersList(node);
  node.querySelector('#btn-add-reminder').addEventListener('click', () => {
    node.querySelector('#btn-add-reminder').classList.add('hidden');
    showReminderComposer(node);
  });
}

/* ---------------- My Reasons ---------------- */
function renderReasonsSubview(body) {
  const node = fmt(`
    <div>
      <div class="card" style="margin-bottom:var(--space-3);color:var(--text-2);font-size:12.5px;line-height:1.5;">
        Write down why this matters to you, in your own words. When an urge hits, these show up first — before anything else.
      </div>
      <div id="reasons-list"></div>
      <div id="reason-composer" style="margin-top:var(--space-3);"></div>
    </div>
  `);
  body.appendChild(node);
  renderReasonsList(node);
}

function renderReasonsList(wrap) {
  const listEl = wrap.querySelector('#reasons-list');
  const reasons = Data.getReasons();
  listEl.innerHTML = '';
  if (reasons.length) {
    const card = fmt(`<div class="card"></div>`);
    reasons.forEach((r, idx) => {
      const row = fmt(`
        <div class="list-row">
          <div class="label" style="font-weight:500;font-size:14px;flex:1;">${escapeHtml(r)}</div>
          <button class="icon-btn" data-idx="${idx}" style="width:30px;height:30px;color:var(--coral);flex-shrink:0;">✕</button>
        </div>
      `);
      card.appendChild(row);
    });
    listEl.appendChild(card);
    card.querySelectorAll('[data-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Data.deleteReason(parseInt(btn.getAttribute('data-idx'), 10));
        App.refreshTab('settings');
      });
    });
  }

  const composer = wrap.querySelector('#reason-composer');
  composer.innerHTML = '';
  const addRow = fmt(`
    <div style="display:flex;gap:8px;">
      <input type="text" id="reason-input" placeholder="e.g. my daughter, my health, my future" maxlength="120"
        style="flex:1;background:var(--bg-2);border:1px solid var(--line);border-radius:var(--radius-s);color:var(--text-0);padding:12px;font-size:14px;" />
      <button class="btn btn-secondary" id="reason-add" style="padding:0 18px;">Add</button>
    </div>
  `);
  composer.appendChild(addRow);
  function submitReason() {
    const input = addRow.querySelector('#reason-input');
    const text = input.value.trim();
    if (!text) return;
    Data.addReason(text);
    App.refreshTab('settings');
  }
  addRow.querySelector('#reason-add').addEventListener('click', submitReason);
  addRow.querySelector('#reason-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitReason();
  });
}

/* ---------------- Reach Out contact ---------------- */
function renderReachOutSubview(body, opts) {
  const node = fmt(`
    <div>
      <div class="card" style="margin-bottom:var(--space-3);color:var(--text-2);font-size:12.5px;line-height:1.5;">
        Set up a trusted contact once. During a hard moment, one tap opens a message to them, already typed — you just have to send it.
      </div>
      <div id="reach-out-card"></div>
    </div>
  `);
  body.appendChild(node);
  renderReachOutCard(node);

  if (opts && opts.highlightReachOut) {
    const card = node.querySelector('#reach-out-card');
    if (card) {
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight-pulse');
        setTimeout(() => card.classList.remove('highlight-pulse'), 3200);
      }, 150);
    }
  }
}

function renderReachOutCard(wrap) {
  const container = wrap.querySelector('#reach-out-card');
  const contact = Data.getReachOutContact();

  function showForm(existing) {
    const platform = (existing && existing.platform) || 'whatsapp';
    container.innerHTML = '';
    const card = fmt(`
      <div class="card">
        <div class="choice-wrap" id="ro-platforms" style="justify-content:flex-start;margin-bottom:var(--space-3);">
          <button class="choice-pill" data-p="whatsapp">WhatsApp</button>
          <button class="choice-pill" data-p="sms">Text / SMS</button>
          <button class="choice-pill" data-p="telegram">Telegram</button>
        </div>
        <input type="text" id="ro-identifier" placeholder="Phone number"
          style="width:100%;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius-s);color:var(--text-0);padding:12px;font-size:15px;margin-bottom:var(--space-3);" />
        <textarea class="journal-input" id="ro-message" placeholder="Message to send" style="min-height:80px;"></textarea>
        <button class="btn btn-primary btn-block" id="ro-save" style="margin-top:var(--space-3);">Save contact</button>
      </div>
    `);
    container.appendChild(card);
    let selectedPlatform = platform;
    const idInput = card.querySelector('#ro-identifier');
    const msgInput = card.querySelector('#ro-message');
    idInput.value = (existing && existing.identifier) || '';
    msgInput.value = (existing && existing.message) || "Having a hard moment right now — could use a distraction.";

    function updatePills() {
      card.querySelectorAll('.choice-pill').forEach((p) => {
        p.classList.toggle('selected', p.getAttribute('data-p') === selectedPlatform);
      });
      idInput.placeholder = selectedPlatform === 'telegram' ? 'Telegram username' : 'Phone number';
    }
    card.querySelectorAll('.choice-pill').forEach((p) => {
      p.addEventListener('click', () => { selectedPlatform = p.getAttribute('data-p'); updatePills(); });
    });
    updatePills();

    card.querySelector('#ro-save').addEventListener('click', () => {
      const identifier = idInput.value.trim();
      if (!identifier) { App.toast('Add a phone number or username first'); return; }
      Data.setReachOutContact({ platform: selectedPlatform, identifier, message: msgInput.value.trim() });
      App.toast('Contact saved');
      renderReachOutCard(wrap);
    });
  }

  if (contact && contact.identifier) {
    container.innerHTML = '';
    const platformLabel = contact.platform === 'whatsapp' ? 'WhatsApp' : contact.platform === 'telegram' ? 'Telegram' : 'Text message';
    const summary = fmt(`
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="label" style="font-weight:700;">${platformLabel}</div>
          <div class="desc">${escapeHtml(contact.identifier)}</div>
        </div>
        <button class="btn-ghost btn" id="ro-edit">Edit</button>
      </div>
    `);
    container.appendChild(summary);
    summary.querySelector('#ro-edit').addEventListener('click', () => showForm(contact));
  } else {
    showForm(null);
  }
}

/* ---------------- Streak protecting ---------------- */
function renderProtectingSubview(body) {
  const node = fmt(`<div><div class="card" id="protecting-card"></div></div>`);
  body.appendChild(node);
  renderProtectingCard(node);
}

function renderProtectingCard(wrap) {
  const container = wrap.querySelector('#protecting-card');
  const current = Data.getStreakProtecting();
  container.innerHTML = '';
  const row = fmt(`
    <div>
      <div class="desc" style="margin-bottom:var(--space-3);">What does staying on track protect? Shown next to your streak on Home.</div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="protecting-input" placeholder="e.g. my health, $400/month, my relationship" maxlength="60"
          style="flex:1;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius-s);color:var(--text-0);padding:12px;font-size:14px;" />
        <button class="btn btn-secondary" id="protecting-save" style="padding:0 18px;">Save</button>
      </div>
    </div>
  `);
  container.appendChild(row);
  row.querySelector('#protecting-input').value = current;
  row.querySelector('#protecting-save').addEventListener('click', () => {
    const val = row.querySelector('#protecting-input').value.trim();
    Data.setStreakProtecting(val);
    App.toast(val ? 'Saved' : 'Cleared');
  });
}

/* ---------------- Privacy & Data ---------------- */
function renderPrivacyDataSubview(body, opts) {
  const node = fmt(`
    <div>
      <p class="section-title" style="margin-top:0;">Privacy</p>
      <div class="card" style="color:var(--text-1);font-size:13.5px;line-height:1.55;">
        Everything you do in UrgeAway — journal entries, activity history, streaks — is stored only on this device. Nothing is uploaded, and there's no account required. If a future cloud-backup feature is added, it will be entirely optional and clearly explained before anything leaves your device.
      </div>

      <p class="section-title">Your data</p>
      <div class="card">
        <div class="list-row"><div class="label">Export data</div><button class="btn-ghost btn" id="btn-export">Export</button></div>
        <div class="list-row"><div class="label" style="color:var(--coral);">Clear all data</div><button class="btn-ghost btn" id="btn-clear" style="border-color:rgba(239,139,111,0.4);color:var(--coral);">Clear</button></div>
      </div>

      <p class="section-title">Help improve UrgeAway</p>
      <div class="card" id="card-analytics">
        <div class="list-row" id="row-analytics">
          <div>
            <div class="label">Share anonymous usage data</div>
            <div class="desc">Off by default. If on, UrgeAway sends anonymous counts of which features get used (e.g. "an activity was completed") to help us improve the app. Never your journal entries, never which apps you lock in Lock In Mode, and never tied to your identity. Full details in our privacy policy.</div>
          </div>
          <button class="toggle ${Data.getAnalyticsEnabled() ? 'on' : ''}" id="toggle-analytics"><span class="knob"></span></button>
        </div>
      </div>
    </div>
  `);
  body.appendChild(node);

  node.querySelector('#toggle-analytics').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const next = !btn.classList.contains('on');
    btn.classList.toggle('on', next);
    await Analytics.setEnabled(next);
    App.toast(next ? 'Anonymous usage data on' : 'Anonymous usage data off');
  });

  if (opts && opts.highlightAnalytics) {
    const card = node.querySelector('#card-analytics');
    if (card) {
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight-pulse');
        setTimeout(() => card.classList.remove('highlight-pulse'), 3200);
      }, 150);
    }
  }

  node.querySelector('#btn-export').addEventListener('click', () => {
    const data = JSON.stringify(Data.exportAll(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'urgeaway-export.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    App.toast('Export downloaded');
  });
  node.querySelector('#btn-clear').addEventListener('click', () => {
    if (confirm('Clear all UrgeAway data on this device? This can\'t be undone.')) {
      Data.clearAllData();
      App.toast('All data cleared');
      settingsSubview = null;
      App.refreshTab('settings');
      App.refreshTab('home');
    }
  });
}

/* ---------------- About ---------------- */
function renderAboutSubview(body) {
  const node = fmt(`
    <div>
      <div class="card" style="color:var(--text-2);font-size:13px;line-height:1.6;">
        UrgeAway v1.0 — MVP<br/>
        UrgeAway offers supportive distraction, grounding, and reflection tools. It is not a medical treatment and does not diagnose or guarantee outcomes.
      </div>
    </div>
  `);
  body.appendChild(node);
}

function fmtTime(hour, minute) {
  const h = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function renderRemindersList(wrap) {
  const listEl = wrap.querySelector('#reminders-list');
  const reminders = Data.getReminders();
  listEl.innerHTML = '';
  if (!reminders.length) {
    listEl.appendChild(fmt(`<div class="card" style="color:var(--text-2);font-size:13px;">No reminders set yet.</div>`));
    return;
  }
  const card = fmt(`<div class="card"></div>`);
  reminders.forEach((r) => {
    const row = fmt(`
      <div class="list-row">
        <div style="min-width:0;flex:1;">
          <div class="label">${fmtTime(r.hour, r.minute)}${r.repeatDaily ? ' · Daily' : ' · Once'}</div>
          <div class="desc" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.message)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <button class="toggle ${r.enabled ? 'on' : ''}" data-id="${r.id}" data-action="toggle"><span class="knob"></span></button>
          <button class="icon-btn" data-id="${r.id}" data-action="delete" style="width:30px;height:30px;color:var(--coral);">✕</button>
        </div>
      </div>
    `);
    card.appendChild(row);
  });
  listEl.appendChild(card);

  card.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const reminder = Data.getReminders().find((r) => r.id === id);
      const turningOn = !reminder.enabled;
      if (turningOn) {
        const result = await Notifications.scheduleReminder(reminder);
        if (!result.ok && result.reason === 'unsupported') {
          App.toast('Reminders need the installed app, not this preview');
        } else if (!result.ok && result.reason === 'denied') {
          App.toast('Notification permission was denied');
        }
      } else {
        await Notifications.cancelReminder(reminder);
      }
      Data.updateReminder(id, { enabled: turningOn });
      App.refreshTab('settings');
    });
  });
  card.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const reminder = Data.getReminders().find((r) => r.id === id);
      if (reminder && reminder.enabled) await Notifications.cancelReminder(reminder);
      Data.deleteReminder(id);
      App.toast('Reminder removed');
      App.refreshTab('settings');
    });
  });
}

function showReminderComposer(wrap) {
  const composer = wrap.querySelector('#reminder-composer');
  composer.innerHTML = '';
  const box = fmt(`
    <div class="card fade-in">
      <div class="section-title" style="margin-top:0;">New reminder</div>
      <input type="time" id="rc-time" value="09:00" style="width:100%;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius-s);color:var(--text-0);padding:12px;font-size:15px;font-family:var(--font-body);margin-bottom:var(--space-3);" />
      <textarea class="journal-input" id="rc-message" placeholder="What do you want to tell yourself at this time?" style="min-height:80px;"></textarea>
      <label style="display:flex;align-items:center;gap:10px;margin-top:var(--space-3);color:var(--text-1);font-size:14px;">
        <button type="button" class="toggle on" id="rc-repeat"><span class="knob"></span></button>
        Repeat every day
      </label>
      <div style="display:flex;gap:10px;margin-top:var(--space-4);">
        <button class="btn btn-ghost" id="rc-cancel" style="flex:1;">Cancel</button>
        <button class="btn btn-primary" id="rc-save" style="flex:2;">Save reminder</button>
      </div>
    </div>
  `);
  composer.appendChild(box);

  let repeatDaily = true;
  box.querySelector('#rc-repeat').addEventListener('click', (e) => {
    repeatDaily = !repeatDaily;
    e.currentTarget.classList.toggle('on', repeatDaily);
  });
  box.querySelector('#rc-cancel').addEventListener('click', () => {
    composer.innerHTML = '';
    wrap.querySelector('#btn-add-reminder').classList.remove('hidden');
  });
  box.querySelector('#rc-save').addEventListener('click', async () => {
    const timeVal = box.querySelector('#rc-time').value; // "HH:MM"
    const message = box.querySelector('#rc-message').value.trim();
    if (!timeVal) { App.toast('Pick a time first'); return; }
    if (!message) { App.toast('Write a short message to yourself'); return; }
    const [hour, minute] = timeVal.split(':').map(Number);
    const reminder = Data.addReminder({ hour, minute, message, repeatDaily, enabled: true });
    const result = await Notifications.scheduleReminder(reminder);
    if (!result.ok) {
      if (result.reason === 'unsupported') App.toast('Saved — reminders will fire once installed as the app');
      else if (result.reason === 'denied') App.toast('Saved, but notification permission was denied');
      else App.toast('Saved, but scheduling failed — try toggling it on again');
    } else {
      // A one-time reminder fires at the NEXT occurrence of that clock time —
      // if that time already passed today, it's tomorrow, not "in a minute."
      // Say so explicitly so testing it doesn't look like it silently failed.
      const now = new Date();
      const isPast = !repeatDaily && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()));
      App.toast(repeatDaily ? 'Reminder set — repeats daily' : (isPast ? `That time already passed today — set for tomorrow at ${fmtTime(hour, minute)}` : `Reminder set for today at ${fmtTime(hour, minute)}`));
    }
    App.refreshTab('settings');
  });
}

/* ============================== SUPPORT SCREEN ============================== */
function renderSupportScreen() {
  const wrap = fmt(`
    <div class="activity-screen fade-in">
      <div class="activity-header">
        <div class="title">Get Support</div>
        <button class="icon-btn" id="support-close">✕</button>
      </div>
      <div class="screen-scroll">
        <div class="notice-box">
          UrgeAway is a self-help tool for getting through difficult moments. It isn't a substitute for professional care, and it can't assess your situation the way a person can.
        </div>

        <div class="support-card">
          <div class="t">Talk to someone you trust</div>
          <div class="d">A friend, family member, sponsor, or peer who already knows your situation can help in ways an app can't.</div>
        </div>
        <div class="support-card">
          <div class="t">Contact a qualified professional</div>
          <div class="d">A doctor, therapist, or counselor can give you guidance suited to your specific situation, including any medical concerns.</div>
        </div>
        <div class="support-card">
          <div class="t">Seek urgent local help if this is dangerous</div>
          <div class="d">If you're in a medical emergency, experiencing severe withdrawal, or in immediate danger, contact local emergency services or go to an emergency room right away.</div>
        </div>
      </div>
    </div>
  `);
  wrap.querySelector('#support-close').addEventListener('click', () => App.closeOverlay());
  return wrap;
}

/* ============================== TAB BAR ============================== */
function renderTabBar(activeTab) {
  const tabs = [
    { key: 'home', label: 'Home', icon: NavIcons.home },
    { key: 'activities', label: 'Activities', icon: NavIcons.activities },
    { key: 'progress', label: 'Progress', icon: NavIcons.progress },
    { key: 'journal', label: 'Journal', icon: NavIcons.journal },
    { key: 'settings', label: 'Settings', icon: NavIcons.settings },
  ];
  const bar = fmt(`<div class="tabbar"></div>`);
  tabs.forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (t.key === activeTab ? ' active' : '');
    btn.innerHTML = `${t.icon}<span>${t.label}</span>`;
    btn.addEventListener('click', () => App.goToTab(t.key));
    bar.appendChild(btn);
  });
  return bar;
}
