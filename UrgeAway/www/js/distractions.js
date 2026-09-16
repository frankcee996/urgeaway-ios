/* ==========================================================================
   Distractions — the pool the "I HAVE AN URGE" button draws from.

   Design note on "how many activities": rather than hand-writing hundreds
   of nearly-identical strings, most categories here are built from small
   content banks combined at random (a category + a letter, a setting + a
   missing item + a twist, etc). A few categories (countries x letters,
   subjects x "60 seconds") alone produce hundreds of distinct combinations,
   so in practice this never feels like it's repeating — which is the
   actual goal, more reliably than a fixed list would achieve.

   Every generator returns { id, run(container, onFinish) } — same run()
   contract as activities.js, so it drops into the same full-screen runner.
   ========================================================================== */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}
function dmk(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

/* ---------------------------------------------------------------------- */
/* Shared runner shapes                                                    */
/* ---------------------------------------------------------------------- */

function runPromptSequence(prompts, container, onFinish) {
  let i = 0;
  function render() {
    container.innerHTML = '';
    const isLast = i === prompts.length - 1;
    container.appendChild(dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:22px;">
        <div class="prompt-text">${escapeHtml(prompts[i])}</div>
        <button class="btn btn-primary" id="ps-next" style="max-width:240px;">${isLast ? 'Done' : 'Next'}</button>
      </div>
    `));
    container.querySelector('#ps-next').addEventListener('click', () => {
      i += 1;
      if (i >= prompts.length) onFinish();
      else render();
    });
  }
  render();
  return { onExit: () => {} };
}

function runSingleScenario(promptLine, container, onFinish, inviteText) {
  container.innerHTML = '';
  container.appendChild(dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
      <div class="prompt-text">${escapeHtml(promptLine)}</div>
      ${inviteText ? `<textarea class="journal-input" id="ss-answer" placeholder="${escapeHtml(inviteText)}" style="min-height:100px;"></textarea>` : `<div style="color:var(--focus-text-2);font-size:13px;">Just take a moment with it — no need to answer out loud.</div>`}
      <button class="btn btn-primary btn-block" id="ss-continue" style="max-width:260px;">Continue</button>
    </div>
  `));
  container.querySelector('#ss-continue').addEventListener('click', onFinish);
  return { onExit: () => {} };
}

function runMystery(mystery, container, onFinish) {
  let stage = 0;
  function render() {
    container.innerHTML = '';
    if (stage < mystery.clues.length) {
      container.appendChild(dmk(`
        <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
          ${stage === 0 ? `<div class="prompt-text">${escapeHtml(mystery.setup)}</div>` : ''}
          <div class="timer-pill">Clue ${stage + 1} of ${mystery.clues.length}</div>
          <div style="color:var(--focus-text-1);font-size:15px;max-width:300px;line-height:1.5;">${escapeHtml(mystery.clues[stage])}</div>
          <button class="btn btn-secondary" id="my-next">${stage === mystery.clues.length - 1 ? 'I think I know...' : 'Next clue'}</button>
        </div>
      `));
      container.querySelector('#my-next').addEventListener('click', () => { stage += 1; render(); });
    } else {
      container.appendChild(dmk(`
        <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
          <div class="prompt-text">Here's what happened:</div>
          <div style="color:var(--focus-cyan);font-size:15px;max-width:300px;line-height:1.5;">${escapeHtml(mystery.solution)}</div>
          <button class="btn btn-primary" id="my-done">Done</button>
        </div>
      `));
      container.querySelector('#my-done').addEventListener('click', onFinish);
    }
  }
  render();
  return { onExit: () => {} };
}

function runTimedList(subject, seconds, container, onFinish) {
  let remaining = seconds;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div class="timer-pill" id="tl-timer">${remaining}s</div>
      <div class="prompt-text">Name as many ${escapeHtml(subject)} as you can.</div>
      <textarea class="journal-input" id="tl-input" placeholder="Type them here, separated by commas or new lines..." style="min-height:120px;"></textarea>
      <div style="color:var(--focus-text-2);font-size:13px;" id="tl-count">0 so far</div>
    </div>
  `);
  container.appendChild(wrap);
  const input = wrap.querySelector('#tl-input');
  input.addEventListener('input', () => {
    const items = input.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    wrap.querySelector('#tl-count').textContent = `${items.length} so far`;
  });
  const timerId = setInterval(() => {
    remaining -= 1;
    const t = wrap.querySelector('#tl-timer');
    if (t) t.textContent = `${Math.max(remaining, 0)}s`;
    if (remaining <= 0) { clearInterval(timerId); onFinish(); }
  }, 1000);
  return { onExit: () => clearInterval(timerId) };
}

function runBuildYourDream(template, container, onFinish) {
  let stepIndex = 0;
  const choices = [];
  function render() {
    container.innerHTML = '';
    if (stepIndex >= template.steps.length) {
      container.appendChild(dmk(`
        <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
          <div class="prompt-text">${escapeHtml(template.title)}</div>
          <div style="color:var(--focus-text-1);font-size:14.5px;line-height:1.6;max-width:300px;">${escapeHtml(template.summarize(choices))}</div>
          <button class="btn btn-primary" id="by-done">Done</button>
        </div>
      `));
      container.querySelector('#by-done').addEventListener('click', onFinish);
      return;
    }
    const step = template.steps[stepIndex];
    const wrap = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="timer-pill">Step ${stepIndex + 1} of ${template.steps.length}</div>
        <div class="prompt-text">${escapeHtml(step.prompt)}</div>
        <div class="option-grid" id="by-options" style="width:100%;max-width:300px;"></div>
      </div>
    `);
    container.appendChild(wrap);
    const grid = wrap.querySelector('#by-options');
    step.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'option-card';
      btn.style.cssText = 'align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:13.5px;padding:16px 10px;';
      btn.textContent = opt;
      btn.addEventListener('click', () => { choices.push(opt); stepIndex += 1; render(); });
      grid.appendChild(btn);
    });
  }
  render();
  return { onExit: () => {} };
}

/* ---------------------------------------------------------------------- */
/* Content banks                                                           */
/* ---------------------------------------------------------------------- */

const MEMORY_OPENERS = [
  "Think about one of the happiest days you've experienced.",
  "Bring to mind a time you laughed until it hurt.",
  "Recall a moment you felt truly proud of yourself.",
  "Think of a trip or place that felt like an adventure.",
  "Remember a meal that felt like a celebration.",
  "Think of a time someone surprised you in a good way.",
  "Recall a moment you felt completely relaxed.",
  "Bring to mind a song that takes you right back somewhere good.",
  "Think of a time you accomplished something you'd worked hard for.",
  "Remember a place that always made you feel calm.",
  "Think of a small act of kindness someone showed you.",
  "Recall a holiday or celebration that stands out.",
  "Bring to mind a moment you felt genuinely at peace.",
  "Think of a time you tried something new and it went well.",
  "Remember a conversation that made you feel understood.",
  "Think of a childhood memory that still makes you smile.",
  "Recall a moment surrounded by people you care about.",
  "Bring to mind a small everyday moment that felt good.",
  "Think of a time you got through something difficult.",
  "Remember a place you'd love to go back to.",
  "Recall the last time you felt proud of a decision you made.",
  "Think of a moment that felt like pure fun.",
];
const MEMORY_FOLLOWUPS = [
  'Where were you?',
  'Who, if anyone, was there?',
  "What happened, in just a few words?",
  "What's one tiny detail you still remember?",
  'How did it feel, right in that moment?',
];

const FUTURE_OPENERS = [
  "Imagine it's five years from now, and you've achieved something you've been working toward.",
  'Picture a morning a year from now where you wake up proud of your progress.',
  "Imagine a version of you, further down the road, who's gotten through this exact moment.",
  'Picture yourself finishing something you keep putting off — it is finally done.',
  'Imagine looking back on this week from a year in the future.',
  'Picture the moment you finally reach a goal you have been chasing.',
  'Imagine a future day that feels calm, steady, and genuinely good.',
  'Picture yourself telling someone about how far you have come.',
  'Imagine waking up in a home that feels completely like you.',
  'Picture a future celebration for something you did today, small as it seems now.',
  'Imagine looking back and being glad about how you handled this exact moment.',
  'Picture a version of you who feels proud, not because everything is perfect, but because you kept going.',
  'Imagine a future conversation where you say "I got through that."',
  'Picture yourself a year from now, a little wiser, a little steadier.',
  'Imagine the relief of finally putting something difficult behind you.',
];
const FUTURE_FOLLOWUPS = [
  'Where are you?',
  'What do you see around you?',
  "Who's nearby, if anyone?",
  "What are you doing?",
  "What are you proud of?",
];

const IMAGINATION_SCENARIOS = [
  'You suddenly have the ability to teleport anywhere. Where do you go first?',
  'You have one day to design your dream house. What is the first room you create?',
  'You have an empty island and can bring five things. What do you choose?',
  'You wake up fluent in any language you want. Which one, and why?',
  'You can add one law that everyone in the world has to follow. What is it?',
  'You get to redesign your city streets from scratch. What is the first thing you change?',
  'You can instantly become an expert at one random skill. What do you hope it is?',
  'You find a door in your house that was not there before. Where does it lead?',
  'You can shrink to the size of an ant for a day. What do you explore first?',
  'You are handed the keys to any vehicle in the world for a week. What do you pick?',
  'You get to plan a holiday that does not exist yet. What is everyone celebrating?',
  'You can bring one fictional character into the real world. Who, and what do you do together?',
  'You are given a garden that grows anything overnight. What do you plant first?',
  'You can send a message back to yourself five years ago. What does it say?',
  'You get to rename your hometown. What do you call it?',
  'You can live inside one season forever. Which do you choose, and why?',
  'You are given a pet that can talk, but only about one topic. What topic?',
  'You get to design the uniform for a brand-new sport. What does it look like?',
  'You can time-travel to witness one historical moment. Which one?',
  'You find a suitcase full of something surprising. What is it?',
  'You get to build a treehouse with unlimited materials. Describe it.',
  'You can turn any hobby into your full-time job overnight. Which one?',
  'You are asked to name a newly discovered planet. What do you call it?',
  'You get to invent a brand-new holiday tradition. What is it?',
  'You wake up able to understand any animal for one hour. Which animal do you talk to?',
  'You get one free wish, but it has to help someone else. What do you wish for?',
  'You are given a boat and no destination. Where do you sail?',
  'You get to open a small shop selling just one thing. What is it?',
  'You can add a room to your home that does not exist yet. What is in it?',
  'You are handed a paintbrush that can paint anything into existence. What is the first thing you paint?',
];

const FUN_QUESTIONS = [
  'If animals could talk, which would be the funniest?',
  'If you could instantly master any skill, what would it be?',
  'If you had to live inside one video game for a year, which would you choose?',
  'If you could have dinner with any fictional character, who would it be?',
  'If your life had a theme song, what would it be?',
  'If you could only eat one meal for the rest of your life, what would it be?',
  'If you could swap lives with someone for a day, who would it be?',
  'If you had a personal mascot, what animal would it be?',
  'If you could instantly learn any language, which would you pick?',
  'If your pet (real or imaginary) could talk, what would it complain about?',
  'If you had a superpower that was slightly useless, what would it be?',
  'If you could re-watch one movie for the first time again, which one?',
  'If you were a kitchen appliance, which one would you be?',
  'If you could add one holiday to the calendar, what would it celebrate?',
  'If you had to change your name today, what would you pick?',
  'If your life was a genre of movie, which genre would it be?',
  'If you could only listen to one artist forever, who would it be?',
  'If you woke up as a cartoon character, who would you want to be?',
  'If you had an extra hour every day, what would you do with it?',
  'If you could instantly be great at a sport, which one?',
  'If your emotions had weather patterns, what is today\u2019s forecast?',
  'If you could redesign your bedroom right now, what is the first thing you would change?',
  'If you had to describe yourself using three foods, which three?',
  'If you could time-travel for a weekend, which decade would you visit?',
  'If your life came with a warning label, what would it say?',
  'If you could have any accent for a day, which would you choose?',
  'If you were a weather forecaster, what would you predict for tomorrow?',
  'If you could instantly finish reading any book, which would you pick?',
  'If you had to be trapped in a store overnight, which store would you choose?',
  'If you could talk to your future self for one minute, what would you ask?',
  'If your life was a board game, what would the objective be?',
  'If you could only keep five apps on your phone, which five?',
  'If you had a talking house plant, what would it say most often?',
  'If you could instantly visit any fictional world, which one?',
  'If you had a theme park built around your personality, what is the main ride?',
  'If you could paint your street any color, what would you choose?',
  'If you could bring back one discontinued food, what would it be?',
  'If you had to wear a costume every day for a month, which one?',
  'If your morning routine was a sport, would you medal in it?',
  'If you could instantly know the answer to one mystery, which one?',
  'If you had to name your car (or bike, or bag), what would you call it?',
  'If you could add a room to any building in your town, what would it be?',
  'If your favorite drink had a personality, how would you describe it?',
  'If you could relive one ordinary day, which one would you pick?',
  'If you were the mascot for your job, what would you look like?',
  'If your phone could talk, what would it say about you?',
  'If you could instantly redecorate one public space, which one?',
  'If you had to invent a new greeting instead of "hello," what would it be?',
  'If you could hear one song for the very first time again, which one?',
  'If you were in charge of naming clouds, what would you call today\u2019s?',
];

const CREATIVE_CHALLENGES = [
  'Invent a new superhero. What is their name?',
  'Give your superhero three powers.',
  'Create a name for a fictional country.',
  'Invent a new food. What is it called?',
  'Design a new app. What does it do?',
  'Invent a new animal by combining two real ones.',
  'Create a name for a fictional band.',
  'Design a flag for an imaginary place.',
  'Invent a holiday and give it a tradition.',
  'Name a new color and describe what it looks like.',
  'Create a slogan for an imaginary company.',
  'Invent a gadget that solves a tiny everyday annoyance.',
  'Design a new ice cream flavor.',
  'Create a name for a spaceship.',
  'Invent a game that uses only a ball and one rule.',
  'Design a logo, in words, for a fictional coffee shop.',
  'Create a title for a movie that does not exist yet.',
  'Invent a new sport played on the moon.',
  'Design a room that represents your personality.',
  'Create a name and backstory for a fictional pet.',
  'Invent a machine that does something oddly specific.',
  'Design a new emoji. What does it mean?',
  'Create a name for a fictional city on the coast.',
  'Invent a new dance move and name it.',
  'Design a menu item for a restaurant that only serves breakfast.',
  'Create a title for your autobiography, written today.',
  'Invent a new school subject that should exist.',
  'Design a costume for a hero who fights boredom.',
  'Create a name for a mountain in a fictional world.',
  'Invent a tool that would have helped you earlier today.',
];

const MYSTERY_SETTINGS = ['a quiet library', 'an old lighthouse', 'a busy train station', 'a small bakery', 'a locked greenhouse', 'a rooftop garden', 'a night market', 'a museum after hours'];
const MYSTERY_ITEMS = ['a valuable painting', 'a set of keys', 'a rare book', 'a family heirloom', 'a locked wooden box', 'a handwritten letter', 'a small silver bell'];
const MYSTERY_TWISTS = [
  'it had been hidden by the very person who reported it missing, out of fear of losing it for good',
  'it had simply been moved for cleaning and quietly forgotten',
  'a well-meaning stranger had "borrowed" it for safekeeping, meaning to return it',
  'it was never actually missing — it had been in plain sight the whole time',
];
function generateMystery() {
  const setting = pick(MYSTERY_SETTINGS);
  const item = pick(MYSTERY_ITEMS);
  const twist = pick(MYSTERY_TWISTS);
  return {
    setup: `Something has gone missing from ${setting}: ${item}.`,
    clues: [
      'The last person seen nearby was acting unusually calm about the whole thing.',
      `There's a faint trail suggesting ${item} never actually left the area.`,
      'Someone recalls a small, easy-to-miss detail from just before closing time.',
    ],
    solution: `It turns out ${twist}.`,
  };
}

const NAME_CATEGORIES = ['countries', 'animals', 'fruits', 'cities', 'movies', 'colors', 'jobs', 'sports', 'car brands', 'musical instruments'];
const LETTERS = 'ABCDEFGHIJKLMNOPRSTW'.split('');
const ASSOCIATION_STARTERS = ['ocean', 'mountain', 'coffee', 'library', 'thunder', 'garden', 'clock', 'bridge', 'lantern', 'harbor', 'meadow', 'compass', 'echo', 'window', 'ember'];
const ODD_ONE_OUT_SETS = [
  { items: ['Apple', 'Banana', 'Carrot', 'Grape', 'Mango'], odd: 'Carrot', why: 'Carrot is a vegetable — the rest are fruits.' },
  { items: ['Guitar', 'Violin', 'Drum', 'Trumpet', 'Piano'], odd: 'Drum', why: 'Drum has no strings or reed — the rest are melodic instruments.' },
  { items: ['Square', 'Circle', 'Triangle', 'Cube', 'Pentagon'], odd: 'Cube', why: 'Cube is 3D — the rest are flat shapes.' },
  { items: ['Salmon', 'Trout', 'Dolphin', 'Tuna', 'Cod'], odd: 'Dolphin', why: 'Dolphin is a mammal, not a fish.' },
  { items: ['Spring', 'Summer', 'Monday', 'Autumn', 'Winter'], odd: 'Monday', why: 'Monday is a day — the rest are seasons.' },
  { items: ['Oak', 'Maple', 'Rose', 'Pine', 'Birch'], odd: 'Rose', why: 'Rose is a flower — the rest are trees.' },
  { items: ['Football', 'Chess', 'Tennis', 'Rugby', 'Basketball'], odd: 'Chess', why: 'Chess has no physical scoring/running — the rest are physical sports.' },
  { items: ['Novel', 'Poem', 'Painting', 'Essay', 'Short story'], odd: 'Painting', why: 'Painting is not writing — the rest are written works.' },
  { items: ['Silver', 'Gold', 'Cotton', 'Bronze', 'Platinum'], odd: 'Cotton', why: 'Cotton is a fabric, not a metal.' },
  { items: ['Paris', 'Berlin', 'Texas', 'Madrid', 'Rome'], odd: 'Texas', why: 'Texas is a state — the rest are capital cities.' },
  { items: ['Whale', 'Shark', 'Octopus', 'Eagle', 'Crab'], odd: 'Eagle', why: 'Eagle does not live in water — the rest do.' },
  { items: ['Hammer', 'Screwdriver', 'Wrench', 'Ladder', 'Pliers'], odd: 'Ladder', why: 'Ladder is not a hand tool — the rest are.' },
];
const LOGIC_PUZZLES = [
  { q: 'A farmer has 17 sheep. All but 9 run away. How many are left?', a: '9 — "all but 9" means 9 remain.' },
  { q: 'What has a face and two hands but no arms or legs?', a: 'A clock.' },
  { q: 'The more you take, the more you leave behind. What is it?', a: 'Footsteps.' },
  { q: 'I speak without a mouth and hear without ears. What am I?', a: 'An echo.' },
  { q: 'What can you catch but not throw?', a: 'A cold.' },
  { q: 'What has many keys but cannot open a single door?', a: 'A piano.' },
  { q: 'What goes up but never comes down?', a: 'Your age.' },
  { q: 'What has to be broken before you can use it?', a: 'An egg.' },
  { q: 'What gets wetter the more it dries?', a: 'A towel.' },
  { q: 'What has one eye but cannot see?', a: 'A needle.' },
];
function runNameChallenge(container, onFinish) {
  const category = pick(NAME_CATEGORIES);
  const letter = pick(LETTERS);
  return runTimedList(`${category} starting with the letter "${letter}"`, 45, container, onFinish);
}
function runWordAssociation(container, onFinish) {
  const starter = pick(ASSOCIATION_STARTERS);
  return runTimedList(`words that come to mind starting from "${starter}"`, 40, container, onFinish);
}
function runOddOneOut(container, onFinish) {
  const set = pick(ODD_ONE_OUT_SETS);
  const items = pickN(set.items, set.items.length);
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Which one doesn't belong?</div>
      <div class="option-grid" id="oo-grid" style="width:100%;max-width:300px;"></div>
      <div class="feedback-flash" id="oo-feedback"></div>
    </div>
  `);
  container.appendChild(wrap);
  const grid = wrap.querySelector('#oo-grid');
  items.forEach((it) => {
    const btn = document.createElement('button');
    btn.className = 'option-card';
    btn.style.cssText = 'align-items:center;justify-content:center;font-weight:700;font-size:14px;padding:16px;';
    btn.textContent = it;
    btn.addEventListener('click', () => {
      Array.from(grid.children).forEach((c) => (c.disabled = true));
      const fb = wrap.querySelector('#oo-feedback');
      fb.textContent = set.why;
      fb.className = it === set.odd ? 'feedback-flash good' : 'feedback-flash bad';
      setTimeout(onFinish, 1400);
    });
    grid.appendChild(btn);
  });
  return { onExit: () => {} };
}
function runLogicPuzzle(container, onFinish) {
  const puzzle = pick(LOGIC_PUZZLES);
  let revealed = false;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
      <div class="prompt-text">${escapeHtml(puzzle.q)}</div>
      <div style="color:var(--focus-cyan);font-size:15px;min-height:24px;" id="lp-answer"></div>
      <button class="btn btn-secondary" id="lp-reveal">Reveal answer</button>
    </div>
  `);
  container.appendChild(wrap);
  wrap.querySelector('#lp-reveal').addEventListener('click', () => {
    if (!revealed) {
      revealed = true;
      wrap.querySelector('#lp-answer').textContent = puzzle.a;
      wrap.querySelector('#lp-reveal').textContent = 'Done';
    } else {
      onFinish();
    }
  });
  return { onExit: () => {} };
}

const EMOJI_POOL = ['\u{1F534}', '\u{1F535}', '\u{1F7E2}', '\u{1F7E1}', '\u{1F7E3}', '\u{1F7E0}', '\u2B50', '\u2764\uFE0F', '\u{1F338}', '\u{1F343}', '\u{1F98B}', '\u{1F41F}', '\u{1F98C}', '\u{1F42C}', '\u{1F30A}', '\u26A1', '\u{1F319}', '\u2600\uFE0F'];
function runOddEmojiOut(container, onFinish, gridSize) {
  const size = gridSize || 9;
  const common = pick(EMOJI_POOL);
  let odd = pick(EMOJI_POOL);
  while (odd === common) odd = pick(EMOJI_POOL);
  const oddIndex = Math.floor(Math.random() * size);
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Find the one that's different</div>
      <div class="game-grid" id="oe-grid" style="grid-template-columns:repeat(${Math.min(4, Math.ceil(Math.sqrt(size)))},1fr);max-width:280px;"></div>
      <div class="feedback-flash" id="oe-feedback"></div>
    </div>
  `);
  container.appendChild(wrap);
  const grid = wrap.querySelector('#oe-grid');
  for (let i = 0; i < size; i++) {
    const btn = document.createElement('button');
    btn.className = 'tap-target';
    btn.style.cssText = 'background:#182339;border:1px solid rgba(148,178,210,0.14);font-size:26px;display:flex;align-items:center;justify-content:center;max-width:64px;max-height:64px;';
    btn.textContent = i === oddIndex ? odd : common;
    btn.addEventListener('click', () => {
      Array.from(grid.children).forEach((c) => (c.disabled = true));
      const fb = wrap.querySelector('#oe-feedback');
      const correct = i === oddIndex;
      fb.textContent = correct ? 'Found it!' : 'Not quite';
      fb.className = correct ? 'feedback-flash good' : 'feedback-flash bad';
      setTimeout(onFinish, 700);
    });
    grid.appendChild(btn);
  }
  return { onExit: () => {} };
}
function runEmojiMemoryFlash(container, onFinish) {
  const shown = pickN(EMOJI_POOL, 4);
  const decoys = pickN(EMOJI_POOL.filter((e) => !shown.includes(e)), 4);
  const options = pickN([...shown, ...decoys], 8);
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Remember these</div>
      <div style="font-size:40px;letter-spacing:12px;">${shown.join(' ')}</div>
    </div>
  `);
  container.appendChild(wrap);
  setTimeout(() => {
    container.innerHTML = '';
    const picked = new Set();
    const wrap2 = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div class="prompt-text">Tap the ${shown.length} you saw</div>
        <div class="game-grid" id="ef-grid" style="grid-template-columns:repeat(4,1fr);max-width:280px;"></div>
        <button class="btn btn-primary" id="ef-done" style="max-width:200px;">Check</button>
      </div>
    `);
    container.appendChild(wrap2);
    const grid = wrap2.querySelector('#ef-grid');
    options.forEach((e) => {
      const btn = document.createElement('button');
      btn.className = 'tap-target';
      btn.style.cssText = 'background:#182339;border:1px solid rgba(148,178,210,0.14);font-size:24px;display:flex;align-items:center;justify-content:center;max-width:60px;max-height:60px;';
      btn.textContent = e;
      btn.addEventListener('click', () => {
        if (picked.has(e)) { picked.delete(e); btn.style.background = '#182339'; }
        else { picked.add(e); btn.style.background = 'rgba(52,224,214,0.22)'; }
      });
      grid.appendChild(btn);
    });
    wrap2.querySelector('#ef-done').addEventListener('click', onFinish);
  }, 2500);
  return { onExit: () => {} };
}

const DREAM_TEMPLATES = [
  {
    title: 'Your dream bedroom',
    steps: [
      { prompt: 'Pick a mood', options: ['Cozy & warm', 'Bright & airy', 'Moody & dramatic', 'Minimalist'] },
      { prompt: 'Pick a color', options: ['Deep blue', 'Soft green', 'Warm terracotta', 'Charcoal & white'] },
      { prompt: 'Pick one special feature', options: ['A reading nook', 'A huge window', 'A record player', 'String lights everywhere'] },
    ],
    summarize: (c) => `A ${c[0].toLowerCase()} room in ${c[1].toLowerCase()}, with ${c[2].toLowerCase()}. Honestly, sounds pretty great.`,
  },
  {
    title: 'Your dream gaming setup',
    steps: [
      { prompt: 'Pick a vibe', options: ['Neon & futuristic', 'Cozy den', 'Minimal & clean', 'Retro arcade'] },
      { prompt: 'Pick your seat', options: ['Racing chair', 'Oversized beanbag', 'Recliner', 'Standing desk'] },
      { prompt: 'Pick one extra', options: ['Surround sound', 'A snack fridge', 'RGB everything', 'A second monitor'] },
    ],
    summarize: (c) => `A ${c[0].toLowerCase()} setup, a ${c[1].toLowerCase()} to sit in, and ${c[2].toLowerCase()} to top it off.`,
  },
  {
    title: 'Your dream house',
    steps: [
      { prompt: 'Pick a location', options: ['By the ocean', 'In the mountains', 'In a busy city', 'In quiet countryside'] },
      { prompt: 'Pick a standout room', options: ['A huge kitchen', 'A library', 'A rooftop terrace', 'A home theater'] },
      { prompt: 'Pick an outdoor feature', options: ['A garden', 'A pool', 'A porch swing', 'A fire pit'] },
    ],
    summarize: (c) => `A house ${c[0].toLowerCase()}, built around ${c[1].toLowerCase()}, with ${c[2].toLowerCase()} outside.`,
  },
  {
    title: 'Your dream restaurant',
    steps: [
      { prompt: 'Pick a cuisine', options: ['Comfort food', 'Street food fusion', 'Fine dining', 'All-day breakfast'] },
      { prompt: 'Pick an atmosphere', options: ['Candlelit & quiet', 'Loud & lively', 'Outdoor garden seating', 'Cozy and small'] },
      { prompt: 'Pick a signature dish', options: ['A secret-recipe soup', 'A show-stopping dessert', 'A build-your-own dish', 'A dish named after you'] },
    ],
    summarize: (c) => `A ${c[1].toLowerCase()} spot serving ${c[0].toLowerCase()}, famous for ${c[2].toLowerCase()}.`,
  },
  {
    title: 'Your fictional city',
    steps: [
      { prompt: 'Pick a defining feature', options: ['Floating gardens', 'Canals instead of roads', 'A city built on cliffs', 'Glass towers everywhere'] },
      { prompt: 'Pick how people get around', options: ['Gondolas', 'Cable cars', 'Walking only', 'Hover transit'] },
      { prompt: 'Pick its claim to fame', options: ['The best food in the world', 'A festival every week', 'The tallest library', 'Silence after sundown'] },
    ],
    summarize: (c) => `A city known for ${c[0].toLowerCase()}, where everyone gets around by ${c[1].toLowerCase()}, famous for ${c[2].toLowerCase()}.`,
  },
];

const SIXTY_SUBJECTS = ['foods', 'countries', 'movies', 'animals', 'song titles', 'sports', 'colors', 'cities', 'books', 'jobs', 'fruits', 'board games', 'superheroes', 'car brands', 'drinks', 'flowers', 'TV shows', 'video games', 'dance styles', 'musical instruments', 'ice cream flavors', 'kitchen items', 'items in a school bag', 'things found at the beach', 'types of weather'];

/* ------------------------- HALT check ------------------------- */
const HALT_SUGGESTIONS = {
  hungry: "That's worth listening to. A small snack or glass of water sometimes changes everything before you decide anything else.",
  angry: "That's real. Try naming what's underneath it, even just to yourself, before you decide anything else.",
  lonely: "That makes this harder. Is there one person you could reach out to right now, even just to say hi?",
  tired: "Your judgment is weaker when you're running on empty. If you can, this might be a moment to just rest.",
  none: "Good to know. Sometimes it really is just the moment itself — let's get through it.",
};
function runHaltCheck(container, onFinish) {
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
      <div class="prompt-text">Quick check — right now, are you...</div>
      <div class="option-grid" id="halt-grid" style="width:100%;max-width:300px;"></div>
    </div>
  `);
  container.appendChild(wrap);
  const options = [
    { key: 'hungry', label: 'Hungry' },
    { key: 'angry', label: 'Angry / frustrated' },
    { key: 'lonely', label: 'Lonely' },
    { key: 'tired', label: 'Tired' },
    { key: 'none', label: 'None of these' },
  ];
  const grid = wrap.querySelector('#halt-grid');
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-card';
    btn.style.cssText = 'align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:13.5px;padding:16px 10px;';
    if (opt.key === 'none') btn.style.gridColumn = '1 / -1';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      container.innerHTML = '';
      const w2 = dmk(`
        <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
          <div class="prompt-text">${escapeHtml(HALT_SUGGESTIONS[opt.key])}</div>
          <button class="btn btn-primary" id="halt-done" style="max-width:220px;">Continue</button>
        </div>
      `);
      container.appendChild(w2);
      w2.querySelector('#halt-done').addEventListener('click', onFinish);
    });
    grid.appendChild(btn);
  });
  return { onExit: () => {} };
}

/* ------------------------- Urge surfing ------------------------- */
const URGE_SURF_PROMPTS = [
  "This urge is real, and it's also temporary. Let's just watch it for a minute, without acting on it.",
  "Notice where you feel it in your body. You don't have to change it — just notice it.",
  "Urges rise like a wave. Right now, yours might be rising. That's okay. Waves crest.",
  "You don't have to fight it or obey it. You can just let it be here for a moment.",
  "If you can, picture it peaking soon, then slowly, slowly easing off — the way waves always do.",
  "It's still here, and that's fine. You're not required to do anything about it right this second.",
  "However strong it feels right now, it will not stay this strong. That's just how urges work.",
]
function runUrgeSurfing(container, onFinish) {
  let i = 0;
  function render() {
    container.innerHTML = '';
    const isLast = i === URGE_SURF_PROMPTS.length - 1;
    container.appendChild(dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:24px;">
        <div class="breath-circle-wrap" style="width:140px;height:140px;">
          <div class="breath-circle" style="width:90px;height:90px;transform:scale(${1 + (i / URGE_SURF_PROMPTS.length) * 0.4});transition:transform 3s ease;"></div>
        </div>
        <div class="prompt-text">${escapeHtml(URGE_SURF_PROMPTS[i])}</div>
        <button class="btn btn-primary" id="us-next" style="max-width:220px;">${isLast ? 'I\u2019m okay' : 'Still with it'}</button>
      </div>
    `));
    container.querySelector('#us-next').addEventListener('click', () => {
      i += 1;
      if (i >= URGE_SURF_PROMPTS.length) onFinish();
      else render();
    });
  }
  render();
  return { onExit: () => {} };
}

/* ------------------------- Wait it out timer ------------------------- */
const WAIT_MESSAGES = [
  "Urges are time-limited. They peak, then they fade — even without you doing anything.",
  "You don't have to win this. You just have to outlast the next few minutes.",
  "This feeling is uncomfortable, not dangerous. It will pass.",
  "Every minute that goes by, the intensity tends to drop a little.",
  "You've gotten through hard moments before. This is another one of those.",
  "Nothing bad happens if you just wait. That's the whole plan right now.",
];
function runWaitItOut(container, onFinish) {
  let remaining = 180; // 3 minutes
  let msgIndex = 0;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;">
      <div class="timer-pill" id="wo-timer">3:00</div>
      <div class="prompt-text" id="wo-msg">${escapeHtml(WAIT_MESSAGES[0])}</div>
      <div style="color:var(--focus-text-2);font-size:12.5px;">You can stop this early any time — there's no wrong way to do this.</div>
    </div>
  `);
  container.appendChild(wrap);
  const timerId = setInterval(() => {
    remaining -= 1;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timerEl = wrap.querySelector('#wo-timer');
    if (timerEl) timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (remaining % 30 === 0 && remaining > 0) {
      msgIndex = (msgIndex + 1) % WAIT_MESSAGES.length;
      const msgEl = wrap.querySelector('#wo-msg');
      if (msgEl) msgEl.textContent = WAIT_MESSAGES[msgIndex];
    }
    if (remaining <= 0) { clearInterval(timerId); onFinish(); }
  }, 1000);
  return { onExit: () => clearInterval(timerId) };
}

/* ------------------------- Physical reset ------------------------- */
const PHYSICAL_RESETS = [
  'Step outside, or over to a window, for just a minute.',
  'Splash some cold water on your face or wrists.',
  'Take a short walk — even just to the end of the hall and back.',
  'Stretch your arms overhead and hold it for 10 seconds.',
  'Do 10 jumping jacks or push-ups, whatever your body can do right now.',
  'Unclench your jaw and drop your shoulders. Take one slow breath.',
  'Change rooms — physically leave the space you are in right now.',
  'Splash your face and drink a full glass of water.',
  'Shake out your hands and arms for 15 seconds.',
  'Go stand somewhere with fresh air for a moment, if you can.',
];
function runPhysicalReset(container, onFinish) {
  const prompt = pick(PHYSICAL_RESETS);
  return runSingleScenario(prompt, container, onFinish, null);
}

/* ------------------------- Shared: multiple-choice rounds ------------------------- */
/* Used by several games below (Quick Math, Missing Number, Pattern Breaker,
   Color Tap) — each round is generated fresh by getRound(), so the numbers/
   colors/patterns are different every time this runs. */
function runChoiceRounds(getRound, roundCount, container, onFinish) {
  let i = 0;
  function render() {
    const round = getRound();
    container.innerHTML = '';
    const cols = round.cols || round.options.length;
    const wrap = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="timer-pill">${i + 1} of ${roundCount}</div>
        ${round.extraHtml || ''}
        <div class="prompt-text">${escapeHtml(round.prompt)}</div>
        <div class="option-grid" id="cr-grid" style="width:100%;max-width:300px;grid-template-columns:repeat(${cols},1fr);"></div>
        <div class="feedback-flash" id="cr-feedback"></div>
      </div>
    `);
    container.appendChild(wrap);
    const grid = wrap.querySelector('#cr-grid');
    round.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-card';
      btn.style.cssText = 'align-items:center;justify-content:center;font-weight:700;font-size:14.5px;padding:16px 8px;';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        Array.from(grid.children).forEach((c) => (c.disabled = true));
        const fb = wrap.querySelector('#cr-feedback');
        const correct = idx === round.correctIndex;
        fb.textContent = correct ? 'Nice!' : `Answer: ${round.options[round.correctIndex]}`;
        fb.className = correct ? 'feedback-flash good' : 'feedback-flash bad';
        setTimeout(() => {
          i += 1;
          if (i >= roundCount) onFinish();
          else render();
        }, 650);
      });
      grid.appendChild(btn);
    });
  }
  render();
  return { onExit: () => {} };
}
function numberChoiceOptions(correct) {
  const set = new Set([correct]);
  while (set.size < 4) set.add(correct + pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]));
  const arr = pickN([...set], 4);
  return { labels: arr.map(String), correctIndex: arr.indexOf(correct) };
}

/* ------------------------- Quick Math ------------------------- */
function runQuickMath(container, onFinish) {
  return runChoiceRounds(() => {
    const a = 2 + Math.floor(Math.random() * 18);
    const b = 2 + Math.floor(Math.random() * 18);
    const op = pick(['+', '-']);
    const correct = op === '+' ? a + b : a - b;
    const { labels, correctIndex } = numberChoiceOptions(correct);
    return { prompt: `${a} ${op} ${b} = ?`, options: labels, correctIndex };
  }, 4, container, onFinish);
}

/* ------------------------- Missing Number ------------------------- */
function runMissingNumber(container, onFinish) {
  return runChoiceRounds(() => {
    const start = 1 + Math.floor(Math.random() * 10);
    const step = 2 + Math.floor(Math.random() * 4);
    const seq = [0, 1, 2, 3, 4].map((n) => start + n * step);
    const hideIdx = 1 + Math.floor(Math.random() * 3);
    const correct = seq[hideIdx];
    const display = seq.map((n, i) => (i === hideIdx ? '?' : n)).join(', ');
    const { labels, correctIndex } = numberChoiceOptions(correct);
    return { prompt: display, options: labels, correctIndex };
  }, 3, container, onFinish);
}

/* ------------------------- Countdown (subtract N) ------------------------- */
function runCountdownMath(container, onFinish) {
  const step = pick([3, 4, 6, 7, 8, 9]);
  let current = 80 + Math.floor(Math.random() * 40);
  const totalRounds = 5;
  let round = 0;
  function render() {
    const correct = current - step;
    const { labels, correctIndex } = numberChoiceOptions(correct);
    container.innerHTML = '';
    const wrap = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="timer-pill">${round + 1} of ${totalRounds}</div>
        <div class="prompt-text">${current} minus ${step} = ?</div>
        <div class="option-grid" id="cd-grid" style="width:100%;max-width:300px;"></div>
        <div class="feedback-flash" id="cd-feedback"></div>
      </div>
    `);
    container.appendChild(wrap);
    const grid = wrap.querySelector('#cd-grid');
    labels.forEach((label, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-card';
      btn.style.cssText = 'align-items:center;justify-content:center;font-weight:700;font-size:15px;padding:16px 8px;';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        Array.from(grid.children).forEach((c) => (c.disabled = true));
        const fb = wrap.querySelector('#cd-feedback');
        const isCorrect = idx === correctIndex;
        fb.textContent = isCorrect ? 'Nice!' : `It's ${correct}`;
        fb.className = isCorrect ? 'feedback-flash good' : 'feedback-flash bad';
        current = correct;
        setTimeout(() => {
          round += 1;
          if (round >= totalRounds) onFinish();
          else render();
        }, 600);
      });
      grid.appendChild(btn);
    });
  }
  render();
  return { onExit: () => {} };
}

/* ------------------------- Pattern Breaker ------------------------- */
const PATTERN_SYMBOLS = ['\u{1F534}', '\u{1F535}', '\u{1F7E2}', '\u{1F7E1}'];
function runPatternBreaker(container, onFinish) {
  return runChoiceRounds(() => {
    const symbols = pickN(PATTERN_SYMBOLS, 2);
    const unitLen = pick([2, 3]);
    const unit = Array.from({ length: unitLen }, () => pick(symbols));
    const showLen = unitLen * 3 - 1;
    const seq = Array.from({ length: showLen }, (_, i) => unit[i % unitLen]);
    const correct = unit[showLen % unitLen];
    const decoy = pick(PATTERN_SYMBOLS.filter((s) => !symbols.includes(s))) || pick(PATTERN_SYMBOLS);
    const options = pickN([...new Set([correct, ...symbols, decoy])], 3);
    return {
      extraHtml: `<div style="font-size:28px;letter-spacing:6px;">${seq.join(' ')} <span style="opacity:0.4;">?</span></div>`,
      prompt: 'What comes next?',
      options,
      correctIndex: options.indexOf(correct),
    };
  }, 3, container, onFinish);
}

/* ------------------------- Color Tap (Stroop) ------------------------- */
const COLOR_WORDS = [
  { name: 'RED', color: '#ef4444' },
  { name: 'BLUE', color: '#3b82f6' },
  { name: 'GREEN', color: '#22c55e' },
  { name: 'YELLOW', color: '#eab308' },
  { name: 'PURPLE', color: '#a855f7' },
];
function runColorTap(container, onFinish) {
  return runChoiceRounds(() => {
    const word = pick(COLOR_WORDS);
    let displayColor = pick(COLOR_WORDS);
    if (Math.random() < 0.85) {
      let tries = 0;
      while (displayColor.name === word.name && tries < 8) { displayColor = pick(COLOR_WORDS); tries += 1; }
    }
    const decoys = pickN(COLOR_WORDS.filter((c) => c.name !== displayColor.name), 2);
    const options = pickN([displayColor, ...decoys], 3);
    return {
      extraHtml: `<div style="font-size:32px;font-weight:800;color:${displayColor.color};">${word.name}</div>`,
      prompt: 'Tap the COLOR, not the word',
      options: options.map((o) => o.name),
      correctIndex: options.findIndex((o) => o.name === displayColor.name),
    };
  }, 4, container, onFinish);
}

/* ------------------------- Number Hunt ------------------------- */
function runNumberHunt(container, onFinish) {
  const size = 16;
  const target = 2 + Math.floor(Math.random() * 8);
  const targetCount = 3;
  const targetPositions = new Set();
  while (targetPositions.size < targetCount) targetPositions.add(Math.floor(Math.random() * size));
  function randomNonTarget() {
    let n;
    do { n = 1 + Math.floor(Math.random() * 9); } while (n === target);
    return n;
  }
  const nums = Array.from({ length: size }, (_, i) => (targetPositions.has(i) ? target : randomNonTarget()));
  let found = 0;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Tap every ${target}</div>
      <div class="game-grid" id="nh-grid" style="grid-template-columns:repeat(4,1fr);max-width:280px;"></div>
    </div>
  `);
  container.appendChild(wrap);
  const grid = wrap.querySelector('#nh-grid');
  nums.forEach((n) => {
    const btn = document.createElement('button');
    btn.className = 'tap-target';
    btn.style.cssText = 'background:#182339;border:1px solid rgba(148,178,210,0.14);font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;max-width:60px;max-height:60px;';
    btn.textContent = String(n);
    btn.addEventListener('click', () => {
      if (n === target) {
        btn.disabled = true;
        btn.style.background = 'rgba(52,224,214,0.35)';
        found += 1;
        if (found >= targetCount) setTimeout(onFinish, 500);
      } else {
        btn.style.background = 'rgba(239,107,107,0.3)';
        setTimeout(() => { if (btn.isConnected) btn.style.background = '#182339'; }, 300);
      }
    });
    grid.appendChild(btn);
  });
  return { onExit: () => {} };
}

/* ------------------------- What Changed? ------------------------- */
function runWhatChanged(container, onFinish) {
  const shown = pickN(EMOJI_POOL, 5);
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Remember these</div>
      <div style="font-size:32px;letter-spacing:10px;">${shown.join(' ')}</div>
    </div>
  `);
  container.appendChild(wrap);
  const flashTimer = setTimeout(() => {
    const changeIdx = Math.floor(Math.random() * shown.length);
    const remaining = EMOJI_POOL.filter((e) => !shown.includes(e));
    const changed = shown.slice();
    changed[changeIdx] = pick(remaining);
    container.innerHTML = '';
    const wrap2 = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div style="font-size:32px;letter-spacing:10px;">${changed.join(' ')}</div>
        <div class="prompt-text">What changed?</div>
        <div class="game-grid" id="wc-grid" style="grid-template-columns:repeat(5,1fr);max-width:320px;"></div>
        <div class="feedback-flash" id="wc-feedback"></div>
      </div>
    `);
    container.appendChild(wrap2);
    const grid = wrap2.querySelector('#wc-grid');
    changed.forEach((e, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tap-target';
      btn.style.cssText = 'background:#182339;border:1px solid rgba(148,178,210,0.14);font-size:24px;display:flex;align-items:center;justify-content:center;max-width:56px;max-height:56px;';
      btn.textContent = e;
      btn.addEventListener('click', () => {
        Array.from(grid.children).forEach((c) => (c.disabled = true));
        const fb = wrap2.querySelector('#wc-feedback');
        const correct = idx === changeIdx;
        fb.textContent = correct ? 'Got it!' : 'Not quite';
        fb.className = correct ? 'feedback-flash good' : 'feedback-flash bad';
        setTimeout(onFinish, 750);
      });
      grid.appendChild(btn);
    });
  }, 2200);
  return { onExit: () => clearTimeout(flashTimer) };
}

/* ------------------------- Remember the Grid ------------------------- */
function runGridMemory(container, onFinish) {
  const size = 9;
  const litCount = 3;
  const litIndexes = new Set();
  while (litIndexes.size < litCount) litIndexes.add(Math.floor(Math.random() * size));
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Remember the lit squares</div>
      <div class="game-grid" id="gm-grid" style="grid-template-columns:repeat(3,1fr);max-width:220px;"></div>
    </div>
  `);
  container.appendChild(wrap);
  const grid = wrap.querySelector('#gm-grid');
  for (let i = 0; i < size; i++) {
    const cell = document.createElement('div');
    cell.className = 'tap-target';
    cell.style.cssText = `background:${litIndexes.has(i) ? 'rgba(52,224,214,0.55)' : '#182339'};border:1px solid rgba(148,178,210,0.14);`;
    grid.appendChild(cell);
  }
  const flashTimer = setTimeout(() => {
    container.innerHTML = '';
    const picked = new Set();
    const wrap2 = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="prompt-text">Tap the same squares</div>
        <div class="game-grid" id="gm-grid2" style="grid-template-columns:repeat(3,1fr);max-width:220px;"></div>
        <button class="btn btn-primary" id="gm-check" style="max-width:200px;">Check</button>
      </div>
    `);
    container.appendChild(wrap2);
    const grid2 = wrap2.querySelector('#gm-grid2');
    for (let i = 0; i < size; i++) {
      const cell = document.createElement('button');
      cell.className = 'tap-target';
      cell.style.cssText = 'background:#182339;border:1px solid rgba(148,178,210,0.14);';
      cell.addEventListener('click', () => {
        if (picked.has(i)) { picked.delete(i); cell.style.background = '#182339'; }
        else { picked.add(i); cell.style.background = 'rgba(52,224,214,0.35)'; }
      });
      grid2.appendChild(cell);
    }
    wrap2.querySelector('#gm-check').addEventListener('click', onFinish);
  }, 1800);
  return { onExit: () => clearTimeout(flashTimer) };
}

/* ------------------------- Remember the Sequence (colors) ------------------------- */
const SEQ_COLORS = [
  { key: 'r', color: '#ef4444' },
  { key: 'g', color: '#22c55e' },
  { key: 'b', color: '#3b82f6' },
  { key: 'y', color: '#eab308' },
];
function runColorSequence(container, onFinish) {
  const len = 4;
  const seq = Array.from({ length: len }, () => pick(SEQ_COLORS));
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Watch the sequence</div>
      <div id="cs-display" style="width:70px;height:70px;border-radius:16px;background:#182339;transition:background 0.15s;"></div>
    </div>
  `);
  container.appendChild(wrap);
  const display = wrap.querySelector('#cs-display');
  let i = 0;
  const timer = setInterval(() => {
    if (i >= seq.length) {
      clearInterval(timer);
      display.style.background = '#182339';
      setTimeout(showInput, 350);
      return;
    }
    display.style.background = seq[i].color;
    setTimeout(() => { if (display.isConnected) display.style.background = '#182339'; }, 380);
    i += 1;
  }, 600);

  function showInput() {
    container.innerHTML = '';
    const answer = [];
    const wrap2 = dmk(`
      <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div class="prompt-text">Repeat it back, in order</div>
        <div class="game-grid" id="cs-grid" style="grid-template-columns:repeat(4,1fr);max-width:260px;"></div>
        <div class="feedback-flash" id="cs-feedback"></div>
      </div>
    `);
    container.appendChild(wrap2);
    const grid = wrap2.querySelector('#cs-grid');
    SEQ_COLORS.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'tap-target';
      btn.style.cssText = `background:${c.color};border:none;`;
      btn.addEventListener('click', () => {
        const idx = answer.length;
        answer.push(c.key);
        if (c.key !== seq[idx].key) {
          Array.from(grid.children).forEach((b) => (b.disabled = true));
          const fb = wrap2.querySelector('#cs-feedback');
          fb.textContent = 'Not quite — good try!';
          fb.className = 'feedback-flash bad';
          setTimeout(onFinish, 800);
          return;
        }
        if (answer.length === seq.length) {
          Array.from(grid.children).forEach((b) => (b.disabled = true));
          const fb = wrap2.querySelector('#cs-feedback');
          fb.textContent = 'Got it!';
          fb.className = 'feedback-flash good';
          setTimeout(onFinish, 700);
        }
      });
      grid.appendChild(btn);
    });
  }
  return { onExit: () => clearInterval(timer) };
}

/* ------------------------- Moving Target ------------------------- */
function runMovingTarget(container, onFinish) {
  const totalTaps = 6;
  let taps = 0;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div class="prompt-text">Tap the target — it won't stay still</div>
      <div class="timer-pill" id="mt-count">0 / ${totalTaps}</div>
      <div id="mt-field" style="position:relative;width:100%;max-width:300px;height:220px;background:#182339;border:1px solid rgba(148,178,210,0.14);border-radius:var(--radius-m);overflow:hidden;"></div>
    </div>
  `);
  container.appendChild(wrap);
  const field = wrap.querySelector('#mt-field');
  const target = document.createElement('button');
  target.style.cssText = 'position:absolute;width:48px;height:48px;border-radius:50%;background:var(--focus-cyan);border:none;box-shadow:0 0 16px rgba(52,224,214,0.5);';
  field.appendChild(target);
  function place() {
    const fw = Math.max(1, field.clientWidth - 48);
    const fh = Math.max(1, field.clientHeight - 48);
    target.style.left = Math.floor(Math.random() * fw) + 'px';
    target.style.top = Math.floor(Math.random() * fh) + 'px';
  }
  target.addEventListener('click', () => {
    taps += 1;
    wrap.querySelector('#mt-count').textContent = `${taps} / ${totalTaps}`;
    if (taps >= totalTaps) { onFinish(); return; }
    place();
  });
  requestAnimationFrame(place);
  return { onExit: () => {} };
}

/* ------------------------- Tap When Green ------------------------- */
function runTapWhenGreen(container, onFinish) {
  const totalRounds = 5;
  let round = 0;
  let colorTimer = null;
  let isGreen = false;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div class="prompt-text">Tap only when it turns green</div>
      <div class="timer-pill" id="tg-count">1 / ${totalRounds}</div>
      <button id="tg-box" style="width:140px;height:140px;border-radius:20px;border:none;background:#182339;"></button>
      <div class="feedback-flash" id="tg-feedback"></div>
    </div>
  `);
  container.appendChild(wrap);
  const box = wrap.querySelector('#tg-box');
  function nextRound() {
    if (round >= totalRounds) { onFinish(); return; }
    box.style.background = '#182339';
    isGreen = false;
    const delay = 600 + Math.random() * 1400;
    colorTimer = setTimeout(() => {
      isGreen = Math.random() < 0.6;
      box.style.background = isGreen ? '#22c55e' : pick(['#ef4444', '#eab308']);
    }, delay);
  }
  box.addEventListener('click', () => {
    const fb = wrap.querySelector('#tg-feedback');
    fb.textContent = isGreen ? 'Nice!' : 'Too soon!';
    fb.className = isGreen ? 'feedback-flash good' : 'feedback-flash bad';
    round += 1;
    wrap.querySelector('#tg-count').textContent = `${Math.min(round + 1, totalRounds)} / ${totalRounds}`;
    setTimeout(nextRound, 500);
  });
  nextRound();
  return { onExit: () => { if (colorTimer) clearTimeout(colorTimer); } };
}

/* ------------------------- Don't Tap ------------------------- */
function runDontTap(container, onFinish) {
  const size = 12;
  const safeEmoji = '\u2B50';
  const unsafeEmoji = '\u{1F4A5}';
  const unsafeCount = 4;
  const unsafePositions = new Set();
  while (unsafePositions.size < unsafeCount) unsafePositions.add(Math.floor(Math.random() * size));
  let safeFound = 0;
  const safeTotal = size - unsafeCount;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div class="prompt-text">Tap the stars \u2B50 — avoid the \u{1F4A5}</div>
      <div class="game-grid" id="dt-grid" style="grid-template-columns:repeat(4,1fr);max-width:280px;"></div>
      <div class="feedback-flash" id="dt-feedback"></div>
    </div>
  `);
  container.appendChild(wrap);
  const grid = wrap.querySelector('#dt-grid');
  for (let i = 0; i < size; i++) {
    const isUnsafe = unsafePositions.has(i);
    const btn = document.createElement('button');
    btn.className = 'tap-target';
    btn.style.cssText = 'background:#182339;border:1px solid rgba(148,178,210,0.14);font-size:24px;display:flex;align-items:center;justify-content:center;max-width:60px;max-height:60px;';
    btn.textContent = isUnsafe ? unsafeEmoji : safeEmoji;
    btn.addEventListener('click', () => {
      btn.disabled = true;
      const fb = wrap.querySelector('#dt-feedback');
      if (isUnsafe) {
        btn.style.background = 'rgba(239,107,107,0.35)';
        fb.textContent = 'Oops — that one was off-limits.';
        fb.className = 'feedback-flash bad';
        setTimeout(onFinish, 900);
      } else {
        btn.style.background = 'rgba(52,224,214,0.3)';
        safeFound += 1;
        if (safeFound >= safeTotal) {
          fb.textContent = 'All clear!';
          fb.className = 'feedback-flash good';
          setTimeout(onFinish, 700);
        }
      }
    });
    grid.appendChild(btn);
  }
  return { onExit: () => {} };
}

/* ------------------------- Fastest Finger ------------------------- */
function runFastestFinger(container, onFinish) {
  const totalRounds = 3;
  let round = 0;
  let appearAt = 0;
  let delayTimer = null;
  container.innerHTML = '';
  const wrap = dmk(`
    <div class="fade-in" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div class="prompt-text">Tap the target the instant it appears</div>
      <div class="timer-pill" id="ff-count">1 / ${totalRounds}</div>
      <div id="ff-field" style="position:relative;width:100%;max-width:300px;height:200px;background:#182339;border:1px solid rgba(148,178,210,0.14);border-radius:var(--radius-m);"></div>
      <div class="feedback-flash" id="ff-feedback"></div>
    </div>
  `);
  container.appendChild(wrap);
  const field = wrap.querySelector('#ff-field');
  function nextRound() {
    if (round >= totalRounds) { onFinish(); return; }
    field.innerHTML = '';
    const delay = 700 + Math.random() * 1600;
    delayTimer = setTimeout(() => {
      const target = document.createElement('button');
      target.style.cssText = 'position:absolute;width:52px;height:52px;border-radius:50%;background:var(--focus-cyan);border:none;';
      const fw = Math.max(1, field.clientWidth - 52);
      const fh = Math.max(1, field.clientHeight - 52);
      target.style.left = Math.floor(Math.random() * fw) + 'px';
      target.style.top = Math.floor(Math.random() * fh) + 'px';
      appearAt = Date.now();
      target.addEventListener('click', () => {
        const ms = Date.now() - appearAt;
        const fb = wrap.querySelector('#ff-feedback');
        fb.textContent = `${ms}ms`;
        fb.className = 'feedback-flash good';
        field.innerHTML = '';
        round += 1;
        wrap.querySelector('#ff-count').textContent = `${Math.min(round + 1, totalRounds)} / ${totalRounds}`;
        setTimeout(nextRound, 500);
      });
      field.appendChild(target);
    }, delay);
  }
  nextRound();
  return { onExit: () => { if (delayTimer) clearTimeout(delayTimer); } };
}

const DISTRACTION_TYPES = [
  {
    type: 'halt',
    weight: 2,
    generate: () => ({ id: 'halt_' + Math.random(), run: runHaltCheck }),
  },
  {
    type: 'urgesurf',
    weight: 2,
    generate: () => ({ id: 'urgesurf_' + Math.random(), run: runUrgeSurfing }),
  },
  {
    type: 'waittimer',
    weight: 1,
    generate: () => ({ id: 'waittimer_' + Math.random(), run: runWaitItOut }),
  },
  {
    type: 'physical',
    weight: 2,
    generate: () => ({ id: 'physical_' + Math.random(), run: runPhysicalReset }),
  },
  {
    type: 'memory',
    weight: 2,
    generate: () => {
      const idx = Math.floor(Math.random() * MEMORY_OPENERS.length);
      return { id: `memory_${idx}`, run: (c, done) => runPromptSequence([MEMORY_OPENERS[idx], ...MEMORY_FOLLOWUPS], c, done) };
    },
  },
  {
    type: 'future',
    weight: 1,
    generate: () => {
      const idx = Math.floor(Math.random() * FUTURE_OPENERS.length);
      return { id: `future_${idx}`, run: (c, done) => runPromptSequence([FUTURE_OPENERS[idx], ...FUTURE_FOLLOWUPS], c, done) };
    },
  },
  {
    type: 'imagination',
    weight: 2,
    generate: () => {
      const idx = Math.floor(Math.random() * IMAGINATION_SCENARIOS.length);
      return { id: `imagination_${idx}`, run: (c, done) => runSingleScenario(IMAGINATION_SCENARIOS[idx], c, done, 'Type your answer if you want to...') };
    },
  },
  {
    type: 'funquestion',
    weight: 2,
    generate: () => {
      const idx = Math.floor(Math.random() * FUN_QUESTIONS.length);
      return { id: `fun_${idx}`, run: (c, done) => runSingleScenario(FUN_QUESTIONS[idx], c, done, null) };
    },
  },
  {
    type: 'creative',
    weight: 2,
    generate: () => {
      const idx = Math.floor(Math.random() * CREATIVE_CHALLENGES.length);
      return { id: `creative_${idx}`, run: (c, done) => runSingleScenario(CREATIVE_CHALLENGES[idx], c, done, 'Describe it...') };
    },
  },
  {
    type: 'mystery',
    weight: 1,
    generate: () => {
      const m = generateMystery();
      return { id: `mystery_${Date.now()}_${Math.random()}`, run: (c, done) => runMystery(m, c, done) };
    },
  },
  {
    type: 'mentalgame',
    weight: 3,
    generate: () => {
      const sub = pick(['name', 'assoc', 'odd', 'logic']);
      if (sub === 'name') return { id: 'mg_name_' + Math.random(), run: runNameChallenge };
      if (sub === 'assoc') return { id: 'mg_assoc_' + Math.random(), run: runWordAssociation };
      if (sub === 'odd') return { id: 'mg_odd_' + Math.random(), run: runOddOneOut };
      return { id: 'mg_logic_' + Math.random(), run: runLogicPuzzle };
    },
  },
  {
    type: 'visualgame',
    weight: 2,
    generate: () => {
      const sub = pick(['odd_small', 'odd_large', 'flash']);
      if (sub === 'odd_small') return { id: 'vg_odds_' + Math.random(), run: (c, done) => runOddEmojiOut(c, done, 9) };
      if (sub === 'odd_large') return { id: 'vg_oddl_' + Math.random(), run: (c, done) => runOddEmojiOut(c, done, 16) };
      return { id: 'vg_flash_' + Math.random(), run: runEmojiMemoryFlash };
    },
  },
  {
    type: 'builddream',
    weight: 1,
    generate: () => {
      const idx = Math.floor(Math.random() * DREAM_TEMPLATES.length);
      return { id: `dream_${idx}`, run: (c, done) => runBuildYourDream(DREAM_TEMPLATES[idx], c, done) };
    },
  },
  {
    type: 'sixtysecond',
    weight: 2,
    generate: () => {
      const idx = Math.floor(Math.random() * SIXTY_SUBJECTS.length);
      return { id: `sixty_${idx}`, run: (c, done) => runTimedList(SIXTY_SUBJECTS[idx], 60, c, done) };
    },
  },
  {
    type: 'quickmath',
    weight: 2,
    generate: () => ({ id: 'quickmath_' + Math.random(), run: runQuickMath }),
  },
  {
    type: 'missingnumber',
    weight: 2,
    generate: () => ({ id: 'missingnumber_' + Math.random(), run: runMissingNumber }),
  },
  {
    type: 'countdownmath',
    weight: 1,
    generate: () => ({ id: 'countdownmath_' + Math.random(), run: runCountdownMath }),
  },
  {
    type: 'patternbreaker',
    weight: 2,
    generate: () => ({ id: 'patternbreaker_' + Math.random(), run: runPatternBreaker }),
  },
  {
    type: 'colortap',
    weight: 2,
    generate: () => ({ id: 'colortap_' + Math.random(), run: runColorTap }),
  },
  {
    type: 'numberhunt',
    weight: 2,
    generate: () => ({ id: 'numberhunt_' + Math.random(), run: runNumberHunt }),
  },
  {
    type: 'whatchanged',
    weight: 2,
    generate: () => ({ id: 'whatchanged_' + Math.random(), run: runWhatChanged }),
  },
  {
    type: 'gridmemory',
    weight: 2,
    generate: () => ({ id: 'gridmemory_' + Math.random(), run: runGridMemory }),
  },
  {
    type: 'colorsequence',
    weight: 2,
    generate: () => ({ id: 'colorsequence_' + Math.random(), run: runColorSequence }),
  },
  {
    type: 'movingtarget',
    weight: 2,
    generate: () => ({ id: 'movingtarget_' + Math.random(), run: runMovingTarget }),
  },
  {
    type: 'tapwhengreen',
    weight: 2,
    generate: () => ({ id: 'tapwhengreen_' + Math.random(), run: runTapWhenGreen }),
  },
  {
    type: 'donttap',
    weight: 2,
    generate: () => ({ id: 'donttap_' + Math.random(), run: runDontTap }),
  },
  {
    type: 'fastestfinger',
    weight: 2,
    generate: () => ({ id: 'fastestfinger_' + Math.random(), run: runFastestFinger }),
  },
];

const WEIGHTED_TYPES = DISTRACTION_TYPES.flatMap((t) => Array(t.weight).fill(t));

let recentDistractionIds = [];
function pickRandomDistraction() {
  let attempt = null;
  for (let tries = 0; tries < 6; tries++) {
    const typeDef = pick(WEIGHTED_TYPES);
    const candidate = typeDef.generate();
    if (!recentDistractionIds.includes(candidate.id)) { attempt = candidate; break; }
    attempt = candidate;
  }
  recentDistractionIds.push(attempt.id);
  if (recentDistractionIds.length > 6) recentDistractionIds.shift();
  return attempt;
}

