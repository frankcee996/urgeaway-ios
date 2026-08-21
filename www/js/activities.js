/* ==========================================================================
   Activities — each activity is a small, self-contained module with a
   run(container, onFinish) function. It renders into `container` and calls
   onFinish() once when the activity naturally completes. Every activity can
   also be exited early by the user (handled by the screen wrapper), because
   nobody in the middle of an urge should feel trapped in a game.

   Adding a new activity later = add one object to the ACTIVITIES array.
   ========================================================================== */

const Icons = {
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>',
  wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.6 4.6a2 2 0 1 1 1.4 3.4H2"/><path d="M13.2 19.4a2 2 0 1 0 1.4-3.4H2"/><path d="M17.4 8a2.5 2.5 0 1 1 1.6 4.4H2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4a4 4 0 0 0 3.2-1.6l6.8-8.8a4 4 0 0 1 3.2-1.6H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.4a4 4 0 0 1 3.2 1.6l.8 1"/><path d="m18 22 4-4-4-4"/><path d="M14.4 15.4 16 17.6a4 4 0 0 0 3.2 1.6H22"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H16a4 4 0 0 0 4-4c0-5-4-9.5-8-9.5Z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/></svg>',
  tap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="6" opacity="0.55"/><circle cx="12" cy="12" r="10" opacity="0.28"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="15" y2="21"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="3" y1="15" x2="19" y2="15"/></svg>',
  shapes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="3"/><rect x="13.5" y="3.5" width="6" height="6" rx="1.2"/><path d="M17 20 20 14 23 20Z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 15-11 0 8-5 15-11 15Z"/><path d="M4 20 12 12"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
};

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ------------------------- Reaction Test ------------------------- */
function runReactionTest(container, onFinish) {
  let round = 0;
  const rounds = 3;
  const times = [];
  let timeoutId, startedAt;
  let cancelled = false;

  render();

  function render() {
    container.innerHTML = '';
    container.appendChild(el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
        <div class="timer-pill">Round ${Math.min(round + 1, rounds)} of ${rounds}</div>
        <div class="prompt-text" id="rt-prompt">Wait for the circle to turn green, then tap it.</div>
        <button id="rt-target" style="width:180px;height:180px;border-radius:50%;border:none;background:#3a4a63;transition:background 0.15s;cursor:pointer;"></button>
        <div class="feedback-flash" id="rt-feedback"></div>
      </div>
    `));
    const target = container.querySelector('#rt-target');
    target.addEventListener('click', onTap);
    scheduleRound();
  }

  function scheduleRound() {
    const target = container.querySelector('#rt-target');
    const feedback = container.querySelector('#rt-feedback');
    target.style.background = '#3a4a63';
    feedback.textContent = '';
    feedback.className = 'feedback-flash';
    const delay = 1200 + Math.random() * 2200;
    timeoutId = setTimeout(() => {
      if (cancelled) return;
      target.style.background = 'linear-gradient(135deg,#34e0d6,#8be3a8)';
      startedAt = performance.now();
    }, delay);
  }

  function onTap() {
    const feedback = container.querySelector('#rt-feedback');
    if (!startedAt) {
      feedback.textContent = 'Too soon — wait for green';
      feedback.className = 'feedback-flash bad';
      clearTimeout(timeoutId);
      scheduleRound();
      return;
    }
    const ms = Math.round(performance.now() - startedAt);
    times.push(ms);
    feedback.textContent = `${ms}ms`;
    feedback.className = 'feedback-flash good';
    startedAt = null;
    round += 1;
    if (round >= rounds) {
      setTimeout(() => { if (!cancelled) onFinish(); }, 500);
    } else {
      setTimeout(render, 500);
    }
  }

  return { onExit: () => { cancelled = true; clearTimeout(timeoutId); } };
}

/* ------------------------- Memory Match ------------------------- */
function runMemoryMatch(container, onFinish) {
  const symbols = ['◆', '●', '▲', '■', '★', '✚'];
  const cards = symbols.concat(symbols)
    .map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
  let first = null, second = null, lock = false, matches = 0;

  render();

  function render() {
    container.innerHTML = '';
    const wrap = el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div class="timer-pill">${matches} of ${symbols.length} matched</div>
        <div class="game-grid" id="mm-grid" style="grid-template-columns:repeat(4,1fr);max-width:300px;"></div>
      </div>
    `);
    container.appendChild(wrap);
    const grid = wrap.querySelector('#mm-grid');
    cards.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'tap-target';
      btn.style.cssText = `background:${c.matched ? 'rgba(139,227,168,0.18)' : c.flipped ? '#1a2b45' : '#182339'};border:1px solid ${c.matched ? 'rgba(139,227,168,0.5)' : 'rgba(148,178,210,0.14)'};color:#34e0d6;font-size:26px;display:flex;align-items:center;justify-content:center;max-width:64px;max-height:64px;`;
      btn.textContent = c.flipped || c.matched ? c.symbol : '';
      btn.disabled = c.matched;
      btn.addEventListener('click', () => onCardTap(c));
      grid.appendChild(btn);
    });
  }

  function onCardTap(card) {
    if (lock || card.flipped || card.matched) return;
    card.flipped = true;
    if (!first) {
      first = card;
      render();
      return;
    }
    second = card;
    render();
    lock = true;
    setTimeout(() => {
      if (first.symbol === second.symbol) {
        first.matched = true;
        second.matched = true;
        matches += 1;
      } else {
        first.flipped = false;
        second.flipped = false;
      }
      first = null; second = null; lock = false;
      render();
      if (matches === symbols.length) {
        setTimeout(onFinish, 500);
      }
    }, 650);
  }

  return { onExit: () => {} };
}

/* ------------------------- Number Challenge ------------------------- */
function runNumberChallenge(container, onFinish) {
  let round = 0;
  const rounds = 6;
  let correct = 0;

  nextQuestion();

  function makeQuestion() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (op === '×') { a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * 9) + 2; }
    else { a = Math.floor(Math.random() * 40) + 5; b = Math.floor(Math.random() * 20) + 1; }
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const options = new Set([answer]);
    while (options.size < 4) {
      const delta = Math.floor(Math.random() * 10) - 5;
      const wrong = answer + (delta === 0 ? 3 : delta);
      options.add(wrong);
    }
    return { text: `${a} ${op} ${b}`, answer, options: Array.from(options).sort(() => Math.random() - 0.5) };
  }

  function nextQuestion() {
    if (round >= rounds) { onFinish(); return; }
    const q = makeQuestion();
    container.innerHTML = '';
    const wrap = el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
        <div class="timer-pill">Question ${round + 1} of ${rounds}</div>
        <div class="big-number">${q.text}</div>
        <div class="option-grid" id="nc-options" style="width:100%;max-width:300px;"></div>
        <div class="feedback-flash" id="nc-feedback"></div>
      </div>
    `);
    container.appendChild(wrap);
    const optWrap = wrap.querySelector('#nc-options');
    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'option-card';
      btn.style.cssText = 'align-items:center;justify-content:center;font-size:20px;font-weight:800;font-family:var(--font-display);padding:18px;';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        const feedback = wrap.querySelector('#nc-feedback');
        if (opt === q.answer) {
          correct += 1;
          feedback.textContent = 'Correct';
          feedback.className = 'feedback-flash good';
        } else {
          feedback.textContent = `Answer was ${q.answer}`;
          feedback.className = 'feedback-flash bad';
        }
        round += 1;
        Array.from(optWrap.children).forEach((c) => (c.disabled = true));
        setTimeout(nextQuestion, 550);
      });
      optWrap.appendChild(btn);
    });
  }

  return { onExit: () => {} };
}

/* ------------------------- Color Focus ------------------------- */
function runColorFocus(container, onFinish) {
  const palette = [
    { name: 'Cyan', hex: '#34e0d6' },
    { name: 'Green', hex: '#8be3a8' },
    { name: 'Amber', hex: '#f2c572' },
    { name: 'Coral', hex: '#ef8b6f' },
    { name: 'Violet', hex: '#a78bfa' },
  ];
  let round = 0;
  const rounds = 6;

  nextRound();

  function nextRound() {
    if (round >= rounds) { onFinish(); return; }
    const target = palette[Math.floor(Math.random() * palette.length)];
    const shuffled = [...palette].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!shuffled.includes(target)) shuffled[0] = target;
    shuffled.sort(() => Math.random() - 0.5);

    container.innerHTML = '';
    const wrap = el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
        <div class="timer-pill">Round ${round + 1} of ${rounds}</div>
        <div class="prompt-text">Tap <span style="color:${target.hex}">${target.name}</span></div>
        <div class="game-grid" id="cf-grid" style="grid-template-columns:1fr 1fr;max-width:260px;"></div>
        <div class="feedback-flash" id="cf-feedback"></div>
      </div>
    `);
    container.appendChild(wrap);
    const grid = wrap.querySelector('#cf-grid');
    shuffled.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'tap-target';
      btn.style.cssText = `background:${c.hex};border:none;max-width:110px;max-height:110px;`;
      btn.addEventListener('click', () => {
        const feedback = wrap.querySelector('#cf-feedback');
        Array.from(grid.children).forEach((b) => (b.disabled = true));
        if (c.hex === target.hex) {
          feedback.textContent = 'Nice';
          feedback.className = 'feedback-flash good';
        } else {
          feedback.textContent = 'Not quite';
          feedback.className = 'feedback-flash bad';
        }
        round += 1;
        setTimeout(nextRound, 450);
      });
      grid.appendChild(btn);
    });
  }

  return { onExit: () => {} };
}

/* ------------------------- Pattern Challenge ------------------------- */
function runPatternChallenge(container, onFinish) {
  let round = 0;
  const rounds = 5;

  nextRound();

  function makeSequence() {
    // arithmetic or repeating pattern of small numbers
    const type = Math.random() < 0.5 ? 'arith' : 'repeat';
    let seq = [];
    let answer;
    if (type === 'arith') {
      const start = Math.floor(Math.random() * 10) + 1;
      const step = Math.floor(Math.random() * 5) + 2;
      seq = [start, start + step, start + step * 2, start + step * 3];
      answer = start + step * 4;
    } else {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      seq = [a, b, a, b, a];
      answer = b;
    }
    const options = new Set([answer]);
    while (options.size < 4) options.add(answer + Math.floor(Math.random() * 9) - 4);
    return { seq, answer, options: Array.from(options).sort(() => Math.random() - 0.5) };
  }

  function nextRound() {
    if (round >= rounds) { onFinish(); return; }
    const q = makeSequence();
    container.innerHTML = '';
    const wrap = el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
        <div class="timer-pill">Round ${round + 1} of ${rounds}</div>
        <div class="prompt-text">What comes next?</div>
        <div class="big-number" style="font-size:32px;">${q.seq.join('  ·  ')}  ·  ?</div>
        <div class="option-grid" id="pc-options" style="width:100%;max-width:300px;"></div>
        <div class="feedback-flash" id="pc-feedback"></div>
      </div>
    `);
    container.appendChild(wrap);
    const optWrap = wrap.querySelector('#pc-options');
    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'option-card';
      btn.style.cssText = 'align-items:center;justify-content:center;font-size:20px;font-weight:800;font-family:var(--font-display);padding:18px;';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        const feedback = wrap.querySelector('#pc-feedback');
        Array.from(optWrap.children).forEach((c) => (c.disabled = true));
        if (opt === q.answer) {
          feedback.textContent = 'Correct';
          feedback.className = 'feedback-flash good';
        } else {
          feedback.textContent = `It was ${q.answer}`;
          feedback.className = 'feedback-flash bad';
        }
        round += 1;
        setTimeout(nextRound, 550);
      });
      optWrap.appendChild(btn);
    });
  }

  return { onExit: () => {} };
}

/* ------------------------- Tap Challenge ------------------------- */
function runTapChallenge(container, onFinish) {
  let hits = 0;
  const targetHits = 12;
  let timeLeft = 20;
  let intervalId, spawnTimeout, cancelled = false;

  render();
  tick();
  spawn();

  function render() {
    container.innerHTML = '';
    container.appendChild(el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div class="timer-pill" id="tc-timer">${timeLeft}s · ${hits}/${targetHits} tapped</div>
        <div style="position:relative;width:260px;height:260px;border-radius:24px;background:#0f1a2c;border:1px solid rgba(148,178,210,0.14);overflow:hidden;" id="tc-field"></div>
      </div>
    `));
  }

  function tick() {
    intervalId = setInterval(() => {
      timeLeft -= 1;
      const timerEl = container.querySelector('#tc-timer');
      if (timerEl) timerEl.textContent = `${timeLeft}s · ${hits}/${targetHits} tapped`;
      if (timeLeft <= 0 || hits >= targetHits) {
        clearInterval(intervalId);
        clearTimeout(spawnTimeout);
        if (!cancelled) setTimeout(onFinish, 300);
      }
    }, 1000);
  }

  function spawn() {
    if (cancelled || timeLeft <= 0 || hits >= targetHits) return;
    const field = container.querySelector('#tc-field');
    if (field) {
      const dot = document.createElement('button');
      const size = 46;
      const x = Math.random() * (260 - size);
      const y = Math.random() * (260 - size);
      dot.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#34e0d6,#8be3a8);border:none;`;
      dot.addEventListener('click', () => {
        hits += 1;
        dot.remove();
        const timerEl = container.querySelector('#tc-timer');
        if (timerEl) timerEl.textContent = `${timeLeft}s · ${hits}/${targetHits} tapped`;
        if (hits >= targetHits) {
          clearInterval(intervalId);
          clearTimeout(spawnTimeout);
          if (!cancelled) setTimeout(onFinish, 300);
        }
      });
      field.appendChild(dot);
      setTimeout(() => dot.remove(), 1400);
    }
    spawnTimeout = setTimeout(spawn, 650);
  }

  return { onExit: () => { cancelled = true; clearInterval(intervalId); clearTimeout(spawnTimeout); } };
}

/* ------------------------- Breathing ------------------------- */
function runBreathing(container, onFinish) {
  const phases = [
    { label: 'Breathe in', seconds: 4, scale: 1.5 },
    { label: 'Hold', seconds: 4, scale: 1.5 },
    { label: 'Breathe out', seconds: 4, scale: 1 },
    { label: 'Hold', seconds: 4, scale: 1 },
  ];
  let phaseIndex = 0;
  let cyclesLeft = 4;
  let cancelled = false;
  let timeoutId;

  container.innerHTML = '';
  const wrap = el(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:24px;">
      <div class="timer-pill" id="br-cycles">${cyclesLeft} cycles left</div>
      <div class="breath-circle-wrap">
        <div class="breath-circle" id="br-circle"></div>
        <div class="breath-label" id="br-label">Breathe in</div>
      </div>
      <div style="color:var(--focus-text-2);font-size:13px;">Let your shoulders drop. There's nowhere else to be.</div>
    </div>
  `);
  container.appendChild(wrap);
  runPhase();

  function runPhase() {
    if (cancelled) return;
    const phase = phases[phaseIndex];
    const circle = container.querySelector('#br-circle');
    const label = container.querySelector('#br-label');
    const cyclesEl = container.querySelector('#br-cycles');
    if (circle) circle.style.transform = `scale(${phase.scale})`;
    if (label) label.textContent = phase.label;
    if (cyclesEl) cyclesEl.textContent = `${cyclesLeft} cycles left`;
    timeoutId = setTimeout(() => {
      phaseIndex += 1;
      if (phaseIndex >= phases.length) {
        phaseIndex = 0;
        cyclesLeft -= 1;
        if (cyclesLeft <= 0) {
          if (!cancelled) onFinish();
          return;
        }
      }
      runPhase();
    }, phase.seconds * 1000);
  }

  return { onExit: () => { cancelled = true; clearTimeout(timeoutId); } };
}

/* ------------------------- 5-4-3-2-1 Grounding ------------------------- */
function runGrounding54321(container, onFinish) {
  const steps = [
    { n: 5, sense: 'things you can see' },
    { n: 4, sense: 'things you can feel' },
    { n: 3, sense: 'things you can hear' },
    { n: 2, sense: 'things you can smell' },
    { n: 1, sense: 'thing you like about yourself' },
  ];
  let i = 0;
  render();

  function render() {
    const step = steps[i];
    container.innerHTML = '';
    container.appendChild(el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:22px;">
        <div class="timer-pill">Step ${i + 1} of ${steps.length}</div>
        <div class="big-number" style="font-size:56px;color:var(--focus-cyan);">${step.n}</div>
        <div class="prompt-text">Notice ${step.n} ${step.sense}.</div>
        <div style="color:var(--focus-text-2);font-size:13px;">Take your time. Tap next when ready.</div>
        <button class="btn btn-primary" id="gr-next" style="max-width:220px;">${i === steps.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
    `));
    container.querySelector('#gr-next').addEventListener('click', () => {
      i += 1;
      if (i >= steps.length) onFinish();
      else render();
    });
  }

  return { onExit: () => {} };
}

/* ------------------------- Focus Reset ------------------------- */
function runFocusReset(container, onFinish) {
  const steps = [
    { title: 'Notice the sounds around you', body: 'Don\u2019t label them. Just notice they\u2019re there.', seconds: 15 },
    { title: 'Notice where your body meets the chair or floor', body: 'Feel the weight and the support beneath you.', seconds: 15 },
    { title: 'Notice your breath, without changing it', body: 'Just watch it move in and out.', seconds: 15 },
    { title: 'Notice one thing you can see nearby', body: 'Look at its color, shape, texture.', seconds: 15 },
  ];
  let i = 0;
  let cancelled = false;
  let timeoutId, tickId;
  render();

  function render() {
    const step = steps[i];
    let remaining = step.seconds;
    container.innerHTML = '';
    container.appendChild(el(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="timer-pill" id="fr-timer">${remaining}s</div>
        <div class="prompt-text">${step.title}</div>
        <div style="color:var(--focus-text-2);font-size:13.5px;max-width:280px;">${step.body}</div>
      </div>
    `));
    tickId = setInterval(() => {
      remaining -= 1;
      const timerEl = container.querySelector('#fr-timer');
      if (timerEl) timerEl.textContent = `${Math.max(remaining, 0)}s`;
      if (remaining <= 0) {
        clearInterval(tickId);
        i += 1;
        if (i >= steps.length) {
          if (!cancelled) onFinish();
        } else if (!cancelled) {
          render();
        }
      }
    }, 1000);
  }

  return { onExit: () => { cancelled = true; clearInterval(tickId); clearTimeout(timeoutId); } };
}

/* ------------------------- Registry ------------------------- */

const ACTIVITIES = [
  { id: 'memory_match', name: 'Memory Match', category: 'distract', minutes: '2-3 min', icon: Icons.grid, run: runMemoryMatch },
  { id: 'color_focus', name: 'Color Focus', category: 'distract', minutes: '1-2 min', icon: Icons.palette, run: runColorFocus },
  { id: 'tap_challenge', name: 'Tap Challenge', category: 'distract', minutes: '~20 sec', icon: Icons.tap, run: runTapChallenge },
  { id: 'reaction_test', name: 'Reaction Test', category: 'challenge', minutes: '1 min', icon: Icons.bolt, run: runReactionTest },
  { id: 'number_challenge', name: 'Number Challenge', category: 'challenge', minutes: '1-2 min', icon: Icons.hash, run: runNumberChallenge },
  { id: 'pattern_challenge', name: 'Pattern Challenge', category: 'challenge', minutes: '1-2 min', icon: Icons.shapes, run: runPatternChallenge },
  { id: 'breathing', name: 'Breathing', category: 'calm', minutes: '~1 min', icon: Icons.wind, run: runBreathing },
  { id: 'grounding_54321', name: '5-4-3-2-1 Grounding', category: 'calm', minutes: '2-3 min', icon: Icons.leaf, run: runGrounding54321 },
  { id: 'focus_reset', name: 'Focus Reset', category: 'calm', minutes: '~1 min', icon: Icons.refresh, run: runFocusReset },
];

function getActivityById(id) {
  return ACTIVITIES.find((a) => a.id === id);
}
function getActivitiesByCategory(category) {
  return ACTIVITIES.filter((a) => a.category === category);
}
function getRandomActivity(excludeCategory) {
  const pool = excludeCategory ? ACTIVITIES.filter((a) => a.category !== excludeCategory) : ACTIVITIES;
  return pool[Math.floor(Math.random() * pool.length)];
}
