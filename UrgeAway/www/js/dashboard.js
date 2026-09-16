/* ==========================================================================
   User Dashboard — profile picture (stored locally as a compressed data
   URL, never uploaded anywhere), an editable display name, the existing
   Resistance Level stats, and a capped notification history. Opened from
   the avatar button top-left of Home, and from Settings → Account.
   ========================================================================== */

const DashIcons = {
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>',
};

function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Downscale + center-crop to a square JPEG data URL so a profile photo
// stays small in localStorage regardless of the original photo's size.
async function compressToSquareDataUrl(file, size) {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const scale = Math.max(size / img.width, size / img.height);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function renderUserDashboard() {
  const wrap = fmt(`
    <div class="activity-screen fade-in">
      <div class="activity-header">
        <div class="title">Your Dashboard</div>
        <button class="icon-btn" id="dash-close" aria-label="Close">✕</button>
      </div>
      <div class="screen-scroll" id="dash-body" style="padding-top:var(--space-3);"></div>
    </div>
  `);
  wrap.querySelector('#dash-close').addEventListener('click', () => App.closeOverlay());
  renderDashboardBody(wrap.querySelector('#dash-body'));
  return wrap;
}

function renderDashboardBody(body) {
  body.innerHTML = '';
  const name = Data.getProfileName();
  const pic = Data.getProfilePic();
  const user = window.Auth && Auth.available() ? Auth.getCurrentUser() : null;
  const initial = ((name || (user && user.email) || '').trim()[0] || '').toUpperCase();

  /* ---------------- Avatar + name ---------------- */
  const header = fmt(`
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:var(--space-4);">
      <div style="position:relative;">
        <div id="dash-avatar" style="width:88px;height:88px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--cyan),var(--green));display:flex;align-items:center;justify-content:center;color:#04211e;font-weight:800;font-size:30px;">
          ${pic ? `<img src="${pic}" style="width:100%;height:100%;object-fit:cover;" />` : (initial ? escapeHtml(initial) : NavIcons.user)}
        </div>
        <button id="dash-avatar-edit" aria-label="Change photo" style="position:absolute;bottom:-2px;right:-2px;width:30px;height:30px;border-radius:50%;background:var(--bg-2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--text-1);">${DashIcons.camera}</button>
        <input type="file" accept="image/*" id="dash-avatar-input" style="display:none;" />
      </div>
      <div style="display:flex;align-items:center;gap:6px;" id="dash-name-row">
        <div class="line1" style="font-size:17px;">${escapeHtml(name || 'Add your name')}</div>
        <button id="dash-name-edit" aria-label="Edit name" style="background:none;border:none;color:var(--text-2);padding:4px;display:flex;">${DashIcons.edit}</button>
      </div>
      ${user
        ? `<div style="color:var(--text-2);font-size:12px;">${escapeHtml(user.email || '')}</div>`
        : `<button class="btn btn-secondary" id="dash-signin" style="padding:8px 18px;font-size:12.5px;">Sign in</button>`}
    </div>
  `);
  body.appendChild(header);

  header.querySelector('#dash-avatar-edit').addEventListener('click', () => header.querySelector('#dash-avatar-input').click());
  header.querySelector('#dash-avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressToSquareDataUrl(file, 256);
      Data.setProfilePic(dataUrl);
      renderDashboardBody(body);
      App.toast('Profile photo updated');
    } catch (err) {
      console.error('Profile photo update failed', err);
      App.toast('Could not use that photo');
    }
  });

  header.querySelector('#dash-name-edit').addEventListener('click', () => {
    const row = header.querySelector('#dash-name-row');
    row.innerHTML = '';
    const input = document.createElement('input');
    input.className = 'auth-input';
    input.style.cssText = 'background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius-s);padding:8px 12px;text-align:center;max-width:200px;';
    input.value = name || '';
    input.maxLength = 40;
    input.placeholder = 'Your name';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary';
    saveBtn.style.cssText = 'padding:8px 14px;font-size:12.5px;';
    saveBtn.textContent = 'Save';
    row.appendChild(input);
    row.appendChild(saveBtn);
    input.focus();
    const commit = () => { Data.setProfileName(input.value.trim()); renderDashboardBody(body); };
    saveBtn.addEventListener('click', commit);
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commit(); });
  });

  if (header.querySelector('#dash-signin')) {
    header.querySelector('#dash-signin').addEventListener('click', () => App.openAccount());
  }

  /* ---------------- Resistance Level (reuses Progress's stats) ---------------- */
  const rl = Data.getResistanceStats();
  body.appendChild(fmt(`<p class="section-title" style="margin-top:0;">Resistance Level</p>`));
  body.appendChild(fmt(`
    <div class="card" style="padding:var(--space-3);">
      <div style="display:flex;align-items:baseline;justify-content:space-between;">
        <div>
          <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--text-0);">Level ${rl.level}</div>
          <div style="color:var(--cyan);font-size:12px;font-weight:600;">${escapeHtml(rl.levelName)}</div>
        </div>
        <div style="text-align:right;color:var(--text-2);font-size:11px;">
          <div style="font-family:var(--font-display);font-size:16px;font-weight:800;color:var(--text-0);">${rl.points}</div>
          points
        </div>
      </div>
      ${rl.nextLevelName ? `
        <div style="margin-top:var(--space-2);">
          <div style="height:6px;border-radius:var(--radius-full);background:var(--bg-3);overflow:hidden;">
            <div style="height:100%;width:${Math.round(rl.progressToNext * 100)}%;background:linear-gradient(90deg,var(--cyan),var(--green));border-radius:var(--radius-full);"></div>
          </div>
          <div style="color:var(--text-2);font-size:10.5px;margin-top:4px;">${rl.pointsToNext} points to ${escapeHtml(rl.nextLevelName)}</div>
        </div>
      ` : `<div style="color:var(--text-2);font-size:10.5px;margin-top:var(--space-2);">Top level reached</div>`}
    </div>
  `));

  /* ---------------- Sign out ---------------- */
  if (user) {
    const signOutBtn = fmt(`<button class="btn btn-secondary btn-block" id="dash-signout" style="margin-top:var(--space-4);">Sign out</button>`);
    body.appendChild(signOutBtn);
    signOutBtn.addEventListener('click', async () => {
      await Auth.signOutUser();
      renderDashboardBody(body);
      App.toast('Signed out');
    });
  }
}

// Shared by the Dashboard and the standalone Notifications screen (opened
// from the bell button on Home), so the two never drift out of sync.
function renderNotifHistorySection(body, opts) {
  const history = Data.getNotifHistory();
  body.appendChild(fmt(`<p class="section-title"${opts && opts.first ? ' style="margin-top:0;"' : ''}>Notification History</p>`));
  const notifCard = fmt(`<div class="card" style="padding:0;"></div>`);
  body.appendChild(notifCard);
  if (!history.length) {
    notifCard.appendChild(fmt(`<div style="padding:var(--space-3);color:var(--text-2);font-size:12.5px;text-align:center;">No notifications yet.</div>`));
  } else {
    history.forEach((n, idx) => {
      const row = fmt(`
        <div class="list-row"${idx < history.length - 1 ? ' style="border-bottom:1px solid var(--line);"' : ''}>
          <div style="min-width:0;">
            <div class="label" style="font-size:13.5px;">${escapeHtml(n.title)}</div>
            ${n.body ? `<div class="desc" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(n.body)}</div>` : ''}
          </div>
          <div style="color:var(--text-3);font-size:10.5px;flex-shrink:0;white-space:nowrap;margin-left:10px;">${timeAgo(n.ts)}</div>
        </div>
      `);
      notifCard.appendChild(row);
    });
  }
  if (history.length) {
    const clearBtn = fmt(`<button class="btn btn-ghost btn-block" id="dash-clear-notif" style="margin-top:var(--space-2);border-color:rgba(239,139,111,0.4);color:var(--coral);">Clear notifications</button>`);
    body.appendChild(clearBtn);
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear your notification history?')) {
        Data.clearNotifHistory();
        body.innerHTML = '';
        renderNotifHistorySection(body, opts);
      }
    });
  }
}

// Standalone screen, opened from the bell button next to the avatar on
// Home — same history/clear behavior as the section inside the Dashboard.
function renderNotificationsScreen() {
  const wrap = fmt(`
    <div class="activity-screen fade-in">
      <div class="activity-header">
        <div class="title">Notifications</div>
        <button class="icon-btn" id="notifs-close" aria-label="Close">✕</button>
      </div>
      <div class="screen-scroll" id="notifs-body" style="padding-top:var(--space-3);"></div>
    </div>
  `);
  wrap.querySelector('#notifs-close').addEventListener('click', () => App.closeOverlay());
  const body = wrap.querySelector('#notifs-body');
  renderNotifHistorySection(body, { first: true });
  // The cold-launch/resume sync (getDeliveredNotifications) is fire-and-
  // forget and can still be in flight when the bell is tapped moments
  // later — that race is exactly why a notification that was sitting
  // right there in the tray could show "No notifications yet" here. Force
  // a fresh sync now and re-render once it lands, instead of trusting
  // whatever was already in storage at the moment this screen opened.
  if (window.App && App.syncNotificationHistory) {
    App.syncNotificationHistory().then(() => {
      if (!wrap.isConnected) return;
      body.innerHTML = '';
      renderNotifHistorySection(body, { first: true });
    });
  }
  Data.markNotifViewed(); // clears the unread badge on the bell
  return wrap;
}
