/* ===== System Overload — glitch intro + mental health channel ===== */

const OVERLOAD_EMOTIONS = [
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '▤', neon: '#f43f8e' },
  { id: 'anxious', label: 'Anxious', icon: '⎋', neon: '#fb923c' },
  { id: 'frustrated', label: 'Frustrated', icon: '⊘', neon: '#e8c547' },
  { id: 'angry', label: 'Angry', icon: '⊗', neon: '#dc2626' },
  { id: 'sad', label: 'Sad', icon: '▼', neon: '#4fa3ff' },
  { id: 'numb', label: 'Numb', icon: '░', neon: '#a1a1aa' },
  { id: 'exhausted', label: 'Exhausted', icon: '⊡', neon: '#52525b' },
  { id: 'stagnant', label: 'Stagnant', icon: '▮', neon: '#6b7280' },
  { id: 'sick', label: 'Sick', icon: '⊕', neon: '#94a3b8' },
  { id: 'guilty', label: 'Guilty', icon: '⌗', neon: '#78716c' },
  { id: 'ashamed', label: 'Ashamed', icon: '⊠', neon: '#57534e' },
  { id: 'lonely', label: 'Lonely', icon: '◌', neon: '#818cf8' },
  { id: 'hopeless', label: 'Hopeless', icon: '▽', neon: '#6366f1' },
  { id: 'panicked', label: 'Panicked', icon: '!!', neon: '#ff0040' },
  { id: 'stressed', label: 'Stressed', icon: '⌁', neon: '#ef4444' },
  { id: 'irritated', label: 'Irritated', icon: '⨯', neon: '#f87171' },
  { id: 'jealous', label: 'Jealous', icon: '◆', neon: '#84cc16' },
  { id: 'envious', label: 'Envious', icon: '◇', neon: '#65a30d' },
  { id: 'insecure', label: 'Insecure', icon: '⌇', neon: '#c084fc' },
  { id: 'rejected', label: 'Rejected', icon: '⊖', neon: '#7c3aed' },
  { id: 'abandoned', label: 'Abandoned', icon: '⊘', neon: '#5b21b6' },
  { id: 'betrayed', label: 'Betrayed', icon: '‡', neon: '#be123c' },
  { id: 'humiliated', label: 'Humiliated', icon: '⊟', neon: '#9f1239' },
  { id: 'resentful', label: 'Resentful', icon: '⊞', neon: '#b45309' },
  { id: 'bitter', label: 'Bitter', icon: '⊠', neon: '#92400e' },
  { id: 'disappointed', label: 'Disappointed', icon: '⊖', neon: '#64748b' },
  { id: 'grieving', label: 'Grieving', icon: '⌓', neon: '#7c3aed' },
  { id: 'heartbroken', label: 'Heartbroken', icon: '♡', neon: '#db2777' },
  { id: 'empty', label: 'Empty', icon: '□', neon: '#71717a' },
  { id: 'dissociated', label: 'Dissociated', icon: '▯', neon: '#9ca3af' },
  { id: 'confused', label: 'Confused', icon: '?', neon: '#c084fc' },
  { id: 'uncertain', label: 'Uncertain', icon: '⁇', neon: '#a78bfa' },
  { id: 'stuck', label: 'Stuck', icon: '⊞', neon: '#78716c' },
  { id: 'trapped', label: 'Trapped', icon: '▣', neon: '#44403c' },
  { id: 'powerless', label: 'Powerless', icon: '⊡', neon: '#57534e' },
  { id: 'burnt_out', label: 'Burnt out', icon: '▧', neon: '#3f3f46' },
  { id: 'unwell', label: 'Unwell', icon: '✚', neon: '#22d3ee' },
  { id: 'in_pain', label: 'In pain', icon: '⚠', neon: '#f43f8e' },
  { id: 'restless', label: 'Restless', icon: '≈', neon: '#f97316' },
  { id: 'hypervigilant', label: 'Hypervigilant', icon: '◎', neon: '#ea580c' },
  { id: 'paranoid', label: 'Paranoid', icon: '◉', neon: '#c2410c' },
  { id: 'self_hating', label: 'Self-hating', icon: '⊗', neon: '#881337' },
  { id: 'worthless', label: 'Worthless', icon: '▽', neon: '#6b21a8' },
  { id: 'fraudulent', label: 'Fraudulent', icon: '⌗', neon: '#7e22ce' },
  { id: 'overstimulated', label: 'Overstimulated', icon: '▥', neon: '#f59e0b' },
  { id: 'understimulated', label: 'Understimulated', icon: '▦', neon: '#94a3b8' },
  { id: 'bored', label: 'Bored', icon: '…', neon: '#9ca3af' },
  { id: 'restless_hope', label: 'Restless hope', icon: '↑', neon: '#86efac' },
  { id: 'vulnerable', label: 'Vulnerable', icon: '◇', neon: '#fbcfe8' },
  { id: 'sensitive', label: 'Sensitive', icon: '◎', neon: '#fda4af' },
  { id: 'overthinking', label: 'Overthinking', icon: '∞', neon: '#8b5cf6' },
  { id: 'regretful', label: 'Regretful', icon: '↶', neon: '#a16207' },
  { id: 'nostalgic', label: 'Nostalgic', icon: '⌛', neon: '#fda4af' },
  { id: 'melancholy', label: 'Melancholy', icon: '☾', neon: '#818cf8' },
];

const OVERLOAD_PROMPTS = {
  overwhelmed: 'Identify the single highest-priority task. Decompose into two executable subtasks.',
  anxious: 'State worst-case scenario. Assign probability percentage. State best-case. Compare.',
  frustrated: 'Name the specific blocking factor. Is it internal, external, or interface error?',
  stagnant: 'Define one action that forces a state change within 24 hours.',
  sad: 'Classify root cause: permanent structural loss or temporary signal drop?',
  angry: 'Extract objective facts. Strip narrative. Output bullet list only.',
  numb: 'Run recovery protocol: sleep hours, fuel intake, sensory input. Report status.',
  exhausted: 'Report sleep debt, cognitive load, and physical output for last 72h.',
  sick: 'List symptoms, duration, and whether medical intervention is indicated.',
  guilty: 'What rule do you believe you violated? Was the rule valid, enforced, or self-imposed?',
  ashamed: 'What audience are you simulating in your head? Are they present?',
  lonely: 'Is this absence of people or absence of connection? Specify which.',
  hopeless: 'What evidence supports permanence? What evidence supports change?',
  panicked: 'Run grounding: 5 things seen, 4 heard, 3 felt, 2 smelled, 1 tasted. Then continue.',
  stressed: 'List active threads. Rank by deadline and consequence. Kill or defer lowest.',
  irritated: 'What boundary was crossed? Was it explicit or assumed?',
  jealous: 'What resource or status do you perceive as scarce? Is scarcity real?',
  envious: 'What capability or outcome do you want? Is it obtainable via a defined path?',
  insecure: 'What competence are you doubting? What evidence contradicts the doubt?',
  rejected: 'Separate rejection of you vs rejection of a bid/request. Which occurred?',
  abandoned: 'Who left and what function did they serve? What is the replacement plan?',
  betrayed: 'What expectation was violated? Was it communicated?',
  humiliated: 'Was status loss public or simulated? Quantify actual downstream impact.',
  resentful: 'What cost are you still paying? Who assigned that cost?',
  bitter: 'What outcome are you still re-running? What would closure require?',
  disappointed: 'What was expected vs delivered? Gap size?',
  grieving: 'What was lost? What functions need rerouting?',
  heartbroken: 'What attachment severed? What support structures remain online?',
  empty: 'Is this low input, low output, or both? Run diagnostics on each.',
  dissociated: 'Rate presence 1–10. What anchor returns you to body?',
  confused: 'What decision is blocked? What data is missing?',
  uncertain: 'What would reduce uncertainty by 50% with one query or test?',
  stuck: 'What is the smallest reversible move available?',
  trapped: 'List exit vectors. Mark which are real vs perceived.',
  powerless: 'What control remains in this subsystem?',
  burnt_out: 'How long has output exceeded recovery? What must be shut down?',
  unwell: 'Symptom log. Trend improving, flat, or worsening?',
  in_pain: 'Location, intensity 1–10, trigger, duration.',
  restless: 'Is body or mind refusing idle state? Which subsystem?',
  hypervigilant: 'What threat model is running? Evidence for active threat now?',
  paranoid: 'Distinguish pattern-match from confirmed surveillance/harm.',
  self_hating: 'Whose voice is this? Origin module?',
  worthless: 'What metric defines worth here? Who set the metric?',
  fraudulent: 'What proof would falsify impostor hypothesis?',
  overstimulated: 'Which input channels are overloaded? Mute plan.',
  understimulated: 'Which input channel needs signal?',
  bored: 'Is this lack of challenge or lack of meaning?',
  restless_hope: 'What outcome are you waiting on? What action is available before it?',
  vulnerable: 'What exposure feels unsafe? What protection exists?',
  sensitive: 'What stimulus landed? Was intensity proportional?',
  overthinking: 'How many loops? What is the exit condition for analysis?',
  regretful: 'What decision would you change? What data did you lack then?',
  nostalgic: 'What period are you accessing? What need does it serve now?',
  melancholy: 'Is this grief, longing, or aesthetic sadness? Tag one.',
};

const GLITCH_ERRORS = [
  '&gt; PANIC: thread.emotion blocked',
  '&gt; FAIL: rationalize.exe not responding',
  '&gt; DUMP: writing to /dev/offload',
  '&gt; WARN: cortisol levels critical',
  '&gt; ERR: sleep.schedule null pointer',
  '&gt; TRACE: suppressing output...',
  '&gt; INIT: safe_mode channel open',
  '&gt; CRACK: surface integrity compromised',
  '&gt; SPLIT: userland / mindland boundary breached',
  '&gt; HEX: 0xDEADBEEF emotion buffer',
  '&gt; REBOOT: empathy drivers disabled',
  '&gt; LOAD: logic_core only mode',
];

const DIAGNOSTIC_CORE = [];

const RantLogicEngine = {
  emotionProblem(id){
    const map = {
      sick: 'Physical subsystem degraded — maintenance protocol required',
      guilty: 'Moral checksum mismatch — rule violation signal active',
      ashamed: 'Social status simulation running — audience may be internal only',
      anxious: 'Threat model active — probability assessment incomplete',
      overwhelmed: 'Thread count exceeds processing capacity',
      exhausted: 'Recovery debt exceeds available rest bandwidth',
      lonely: 'Connection channel open — no active peer detected',
      hopeless: 'Future projection module returning null outcomes',
      angry: 'Boundary violation or blocked objective detected',
      sad: 'Loss signal — object, state, or expectation removed',
      numb: 'Affect output suppressed — possible overload shutdown',
      stagnant: 'No state change detected across time window',
      panicked: 'Acute threat response — logic tree collapsed',
      heartbroken: 'Attachment severed — reroute dependency required',
      burnt_out: 'Output exceeded recovery for extended period',
      powerless: 'Agency signal low — control variables unclear',
      stuck: 'Decision tree blocked — exit vector not selected',
    };
    return map[id] || (OVERLOAD_PROMPTS[id] ? OVERLOAD_PROMPTS[id].replace(/\.$/, '') : 'Active emotional flag — decomposition required');
  },

  extractSentences(rant){
    return rant.split(/[\n.!?]+/).map(s => s.trim()).filter(s => s.length > 6);
  },

  summarizeRant(rant){
    const s = rant.trim().replace(/\s+/g, ' ');
    return s.length > 160 ? s.slice(0, 160) + '…' : s;
  },

  identifyProblems(sentences, emotions){
    const patterns = [
      /i (can'?t|cannot|couldn'?t|won'?t|shouldn'?t)/i,
      /i (feel|am|\'m) /i,
      /i (hate|need|want|wish|miss|regret)/i,
      /why (do|does|did|is|am|can)/i,
      /(always|never|every time|no one|nobody)/i,
      /(sick|ill|pain|hurt|tired|exhausted|guilty|ashamed|lonely|scared|anxious)/i,
      /(they|he|she|people) (won'?t|don'?t|didn'?t|can'?t)/i,
    ];
    const found = [];
    sentences.forEach(s => {
      if(patterns.some(p => p.test(s)) || s.length > 35){
        found.push({ text: s.charAt(0).toUpperCase() + s.slice(1), category: 'rant_extract' });
      }
    });
    if(!found.length && sentences.length){
      found.push({ text: sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1), category: 'primary' });
    }
    emotions.forEach(id => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      if(em) found.push({ text: `Active ${em.label.toLowerCase()} state flagged by user`, category: 'emotion', emotionId: id });
    });
    const seen = new Set();
    return found.filter(p => {
      const k = p.text.toLowerCase().slice(0, 40);
      if(seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 10);
  },

  classifyControl(text){
    const t = text.toLowerCase();
    const unctrl = [
      /\b(they|them|their|he |she |people|others?|someone else)\b/,
      /\b(past|already happened|can't change|cannot change|too late)\b/,
      /\b(weather|economy|government|pandemic)\b/,
      /\b(died|death|passed away)\b/,
      /\bwhat (will|would) (they|he|she)\b/,
      /\bif (they|he|she) (don't|doesn't|won't)\b/,
    ];
    const ctrl = [
      /\b(i can|i will|i should|i need to|i could|my |myself)\b/,
      /\b(sleep|eat|rest|walk|drink|call|text|ask|leave|start|stop|take|go)\b/,
      /\b(hour|minute|today|tonight|tomorrow)\b/,
    ];
    if(unctrl.some(p => p.test(t))){
      return { class: 'UNCONTROLLABLE', reason: 'External agent or closed timeline. Not assignable to user runtime.' };
    }
    if(ctrl.some(p => p.test(t))){
      return { class: 'CONTROLLABLE', reason: 'User-executable variable detected in statement.' };
    }
    if(/\b(maybe|might|unsure|don't know)\b/.test(t)){
      return { class: 'PARTIAL', reason: 'Uncertainty present — gather one data point before action.' };
    }
    return { class: 'PARTIAL', reason: 'Influence mixed — split into facts vs requests vs feelings.' };
  },

  generateSolution(problem, emotions, ctrl){
    if(ctrl.class === 'UNCONTROLLABLE'){
      return 'Acknowledge output. Mark [DISCARD]. Allocate zero further processing. Redirect attention to nearest controllable subsystem.';
    }
    const id = problem.emotionId;
    if(id === 'sick' || emotions.includes('sick') || emotions.includes('unwell')){
      return 'Run body protocol: hydration, food checkpoint, rest block minimum 20min. Escalate to medical if symptoms worsen or persist >48h.';
    }
    if(id === 'guilty' || emotions.includes('guilty')){
      return 'Identify violated rule. If self-imposed: revise or repeal. If external: clarify expectation or accept non-compliance cost. No punishment loop.';
    }
    if(id === 'ashamed' || emotions.includes('ashamed')){
      return 'Name the simulated audience. If absent in reality: downgrade shame signal. One private corrective action only.';
    }
    if(emotions.includes('exhausted') || emotions.includes('burnt_out')){
      return 'Schedule non-negotiable recovery window within 2h. Defer all non-critical threads.';
    }
    if(emotions.includes('anxious') || emotions.includes('panicked')){
      return 'Write worst-case + best-case + most-likely. Assign rough %. Act only on most-likely path.';
    }
    if(emotions.includes('lonely')){
      return 'Send one low-stakes connection signal (message, voice note). No attachment to response time.';
    }
    if(emotions.includes('stuck') || emotions.includes('stagnant')){
      return 'Select smallest reversible action completable in <15 minutes. Execute before evaluating.';
    }
    if(emotions.includes('angry') || emotions.includes('frustrated')){
      return 'Extract one factual blocker. One boundary or request to address it. No replay of narrative.';
    }
    return 'Define one action ≤15 minutes. Execute without evaluation loop.';
  },

  suggestCommand(solutions, emotions){
    const ctrl = solutions.find(s => s.control === 'CONTROLLABLE');
    if(ctrl) return 'EXECUTE: ' + ctrl.solution.split('.')[0].slice(0, 90);
    if(emotions.includes('sick')) return 'EXECUTE: rest + hydration checkpoint within 20 minutes';
    if(emotions.includes('exhausted')) return 'EXECUTE: sleep window within 2 hours — defer non-critical threads';
    if(emotions.includes('guilty')) return 'EXECUTE: write the rule you think you broke — then mark valid or self-imposed';
    return 'EXECUTE: one 10-minute maintenance task (water, food, shower, or walk)';
  },

  parse(rant, emotionIds){
    const sentences = this.extractSentences(rant);
    const problems = this.identifyProblems(sentences, emotionIds);
    const transcript = [];
    const solutions = [];

    transcript.push({ role: 'system', text: '>>> RANT_BUFFER CLOSED' });
    transcript.push({ role: 'system', text: '>>> AUTONOMOUS_LOGIC_PARSE — no user input required' });
    transcript.push({ role: 'system', text: `>>> INPUT_LENGTH: ${rant.length} chars · ${sentences.length} segment(s)` });
    transcript.push({ role: 'system', text: `>>> ACTIVE_FLAGS: ${emotionIds.map(id => OVERLOAD_EMOTIONS.find(e => e.id === id)?.label || id).join(' | ')}` });

    emotionIds.forEach(id => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      transcript.push({ role: 'system', text: `>>> FLAG::${(em?.label || id).toUpperCase()} — ${this.emotionProblem(id)}` });
    });

    if(!problems.length){
      problems.push({ text: this.summarizeRant(rant) || 'Emotional discharge without named target', category: 'summary' });
    }

    problems.forEach((p, i) => {
      const ctrl = this.classifyControl(p.text);
      const sol = this.generateSolution(p, emotionIds, ctrl);
      const num = String(i + 1).padStart(2, '0');
      transcript.push({ role: 'system', text: `>>> PROBLEM_${num}: ${p.text}` });
      transcript.push({ role: 'system', text: `>>> VARIABLE_${num}: ${ctrl.class} — ${ctrl.reason}` });
      transcript.push({ role: 'system', text: `>>> RESOLUTION_${num}: ${sol}` });
      solutions.push({ problem: p.text, control: ctrl.class, reason: ctrl.reason, solution: sol });
    });

    const uncontrollable = solutions.filter(s => s.control === 'UNCONTROLLABLE');
    const controllable = solutions.filter(s => s.control === 'CONTROLLABLE');

    transcript.push({ role: 'system', text: `>>> PARSE_COMPLETE: ${controllable.length} controllable · ${uncontrollable.length} uncontrollable · ${solutions.length - controllable.length - uncontrollable.length} partial` });
    if(uncontrollable.length){
      transcript.push({ role: 'system', text: '>>> DISCARD_PROTOCOL ENGAGED — uncontrollable variables marked below' });
      uncontrollable.forEach(u => transcript.push({ role: 'system', text: `>>> [DISCARD] ${u.problem}` }));
    }
    if(controllable.length){
      transcript.push({ role: 'system', text: '>>> ACTIONABLE_QUEUE:' });
      controllable.forEach((c, i) => transcript.push({ role: 'system', text: `>>> [${i + 1}] ${c.solution}` }));
    }

    const suggestedCommand = this.suggestCommand(solutions, emotionIds);
    transcript.push({ role: 'system', text: `>>> SUGGESTED_EXECUTE: ${suggestedCommand}` });

    return { transcript, solutions, problems, suggestedCommand, diagnostics: { controllable: controllable.length, uncontrollable: uncontrollable.length } };
  },
};

const OverloadLog = {
  view: 'hub',
  editingId: null,
  cardFlips: 0,
  cardFlipTimer: null,
  returnView: 'profile',
  glitchTimer: null,
  sessionPhase: 'emotions',
  sessionDraft: null,
  diagnosticQueue: [],
  diagnosticIndex: 0,

  emptyDraft(){
    return {
      date: typeof todayKey === 'function' ? todayKey() : '',
      title: '',
      emotions: [],
      rant: '',
      transcript: [],
      diagnostics: {},
      command: '',
    };
  },

  onHeroCardFlip(){
    this.cardFlips++;
    clearTimeout(this.cardFlipTimer);
    if(this.cardFlips >= 5){
      this.cardFlips = 0;
      this.triggerPageCrack(() => this.showGlitchIntro());
      return;
    }
    this.cardFlipTimer = setTimeout(() => { this.cardFlips = 0; }, 10000);
  },

  triggerPageCrack(done){
    const overlay = document.getElementById('pageCrackOverlay');
    overlay?.classList.remove('hidden');
    document.body.classList.add('page-crack-active');
    setTimeout(() => {
      document.body.classList.remove('page-crack-active');
      overlay?.classList.add('hidden');
      done?.();
    }, 1500);
  },

  checkUrl(){
    const params = new URLSearchParams(location.search);
    if(params.get('overload') || params.get('mind')){
      history.replaceState({}, '', location.pathname);
      queueMicrotask(() => this.triggerPageCrack(() => this.showGlitchIntro()));
    }
  },

  showGlitchIntro(){
    const screen = document.getElementById('overloadGlitchScreen');
    if(!screen) { this.enterChannel(); return; }
    const feed = document.getElementById('oglErrorFeed');
    if(feed){
      feed.innerHTML = `
        <div class="ogl-err">&gt; CRACK: surface integrity lost</div>
        <div class="ogl-err">&gt; ERR_MEM_STACK_OVERFLOW at 0x7FFE</div>
        <div class="ogl-err">&gt; routing to offload channel...</div>`;
    }
    screen.classList.remove('hidden');
    screen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ogl-active');
    this.spawnGlitchBars();
    this.animateErrorFeed();
    clearTimeout(this.glitchTimer);
    this.glitchTimer = setTimeout(() => this.completeGlitchTransition(), 4500);
    document.getElementById('oglEnterBtn')?.focus();
  },

  spawnGlitchBars(){
    const host = document.getElementById('oglGlitchBars');
    if(!host) return;
    host.innerHTML = '';
    for(let i = 0; i < 18; i++){
      const bar = document.createElement('div');
      bar.className = 'ogl-glitch-bar';
      bar.style.setProperty('--ogl-delay', (Math.random() * 2).toFixed(2) + 's');
      bar.style.setProperty('--ogl-y', (Math.random() * 100).toFixed(1) + '%');
      bar.style.setProperty('--ogl-w', (8 + Math.random() * 40).toFixed(0) + '%');
      host.appendChild(bar);
    }
  },

  animateErrorFeed(){
    const feed = document.getElementById('oglErrorFeed');
    if(!feed) return;
    let i = 0;
    const addErr = () => {
      if(i >= GLITCH_ERRORS.length) return;
      const div = document.createElement('div');
      div.className = 'ogl-err ogl-err-in';
      div.innerHTML = GLITCH_ERRORS[i++];
      feed.appendChild(div);
      if(feed.children.length > 8) feed.removeChild(feed.firstChild);
      setTimeout(addErr, 320 + Math.random() * 240);
    };
    addErr();
  },

  hideGlitchIntro(){
    const screen = document.getElementById('overloadGlitchScreen');
    screen?.classList.add('hidden');
    screen?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ogl-active');
    clearTimeout(this.glitchTimer);
  },

  completeGlitchTransition(){
    this.hideGlitchIntro();
    this.enterChannel();
  },

  ensureLogs(){
    if(!Array.isArray(state.overloadLogs)) state.overloadLogs = [];
  },

  sortedLogs(){
    this.ensureLogs();
    return [...state.overloadLogs].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  spawnMindGlitchBars(){
    const host = document.getElementById('mindGlitchBars');
    if(!host) return;
    host.innerHTML = '';
    for(let i = 0; i < 24; i++){
      const bar = document.createElement('div');
      bar.className = 'mind-glitch-bar';
      bar.style.setProperty('--mgb-delay', (Math.random() * 3).toFixed(2) + 's');
      bar.style.setProperty('--mgb-y', (Math.random() * 100).toFixed(1) + '%');
      bar.style.setProperty('--mgb-w', (5 + Math.random() * 35).toFixed(0) + '%');
      host.appendChild(bar);
    }
  },

  enterChannel(){
    const active = document.querySelector('section.view.active');
    if(active && active.id !== 'view-mind') this.returnView = active.id.replace('view-', '') || 'profile';
    document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-mind')?.classList.add('active');
    document.querySelectorAll('.node-btn').forEach(b => b.classList.remove('active'));
    document.body.classList.add('mind-channel-open');
    this.spawnMindGlitchBars();
    if(this.view === 'hub' || !this.view) this.view = 'hub';
    this.render();
    document.getElementById('view-mind')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  exitChannel(){
    document.body.classList.remove('mind-channel-open');
    document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + this.returnView) || document.getElementById('view-profile');
    target?.classList.add('active');
    const navBtn = document.querySelector(`.node-btn[data-view="${this.returnView}"]`) || document.querySelector('.node-btn[data-view="profile"]');
    navBtn?.classList.add('active');
    this.view = 'hub';
    this.editingId = null;
    this.sessionDraft = null;
    document.body.classList.add('mind-repair-active');
    setTimeout(() => document.body.classList.remove('mind-repair-active'), 700);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  newLog(){
    this.view = 'session';
    this.editingId = null;
    this.sessionPhase = 'emotions';
    this.sessionDraft = this.emptyDraft();
    this.diagnosticQueue = [];
    this.diagnosticIndex = 0;
    this.render();
  },

  editLog(id){
    const log = state.overloadLogs.find(l => l.id === id);
    if(!log) return;
    this.view = 'session';
    this.editingId = id;
    this.sessionPhase = 'emotions';
    this.sessionDraft = {
      date: log.date || todayKey(),
      title: log.title || '',
      emotions: [...(log.emotions || [])],
      rant: log.rant || '',
      transcript: [...(log.transcript || [])],
      diagnostics: { ...(log.diagnostics || {}) },
      command: log.command || '',
    };
    this.render();
  },

  viewLog(id){
    this.view = 'read';
    this.editingId = id;
    this.render();
  },

  deleteLog(id){
    if(!confirm('Delete this overload log permanently?')) return;
    this.ensureLogs();
    state.overloadLogs = state.overloadLogs.filter(l => l.id !== id);
    saveState();
    this.view = 'hub';
    this.editingId = null;
    this.render();
    if(typeof renderAbout === 'function') renderAbout();
  },

  getSelectedEmotions(){
    return [...document.querySelectorAll('.ol-emotion-check:checked')].map(el => el.value);
  },

  runAutoParse(){
    const emotions = this.getSelectedEmotions();
    const rant = document.getElementById('olRant')?.value || '';
    if(!emotions.length){ alert('Select at least one emotion flag.'); return; }
    if(!rant.trim()){ alert('Dump something in the rant buffer first.'); return; }
    if(!this.sessionDraft) this.sessionDraft = this.emptyDraft();
    this.sessionDraft.emotions = emotions;
    this.sessionDraft.rant = rant;
    this.sessionDraft.date = document.getElementById('olDate')?.value || this.sessionDraft.date;
    this.sessionDraft.title = document.getElementById('olTitle')?.value?.trim() || this.sessionDraft.title || ('overload ' + (this.sessionDraft.date || todayKey()));

    const analysis = RantLogicEngine.parse(rant, emotions);
    this.sessionDraft.transcript = analysis.transcript;
    this.sessionDraft.solutions = analysis.solutions;
    this.sessionDraft.diagnostics = analysis.diagnostics;
    this.sessionDraft.suggestedCommand = analysis.suggestedCommand;
    this.sessionDraft.command = analysis.suggestedCommand;
    this.sessionPhase = 'parse';
    this.render();
  },

  saveSession(){
    const command = document.getElementById('olCommand')?.value?.trim() || this.sessionDraft?.suggestedCommand || '';
    if(!command){ alert('Issue one terminal command before closing the session.'); return; }
    if(!this.sessionDraft) this.sessionDraft = this.emptyDraft();
    this.sessionDraft.command = command;
    if(!this.sessionDraft.title?.trim()){
      this.sessionDraft.title = 'overload ' + (this.sessionDraft.date || todayKey());
    }

    this.ensureLogs();
    const payload = {
      id: this.editingId || ('ol-' + Date.now()),
      date: this.sessionDraft.date || todayKey(),
      title: this.sessionDraft.title.trim(),
      emotions: this.sessionDraft.emotions || [],
      rant: this.sessionDraft.rant || '',
      transcript: this.sessionDraft.transcript || [],
      diagnostics: this.sessionDraft.diagnostics || {},
      solutions: this.sessionDraft.solutions || [],
      command,
      createdAt: this.editingId
        ? (state.overloadLogs.find(l => l.id === this.editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = state.overloadLogs.findIndex(l => l.id === payload.id);
    if(idx >= 0) state.overloadLogs[idx] = payload;
    else state.overloadLogs.push(payload);

    saveState();
    if(typeof LiveSync !== 'undefined') LiveSync.overloadArchived(payload.title, payload.emotions);
    this.view = 'hub';
    this.editingId = null;
    this.sessionDraft = null;
    this.sessionPhase = 'emotions';
    this.render();
    if(typeof renderAbout === 'function') renderAbout();
  },

  renderEmotionChecks(selected){
    return `<div class="ol-emotion-matrix">${OVERLOAD_EMOTIONS.map(em => `
      <label class="ol-emotion-chip" style="--ole-neon:${em.neon}">
        <input type="checkbox" class="ol-emotion-check" value="${em.id}" ${selected?.includes(em.id) ? 'checked' : ''}>
        <span class="ol-emotion-glyph" aria-hidden="true">${em.icon}</span>
        <span class="ol-emotion-name">${em.label}</span>
      </label>`).join('')}</div>`;
  },

  renderHub(){
    const logs = this.sortedLogs();
    return `
      <div class="mind-terminal-layout">
        <aside class="mind-side-panel">
          <div class="mind-protocol-card sys-panel sys-corrupt">
            <div class="mind-panel-head"><span class="mind-panel-id">0x7F</span><h3>OFFLOAD_PROTOCOL</h3></div>
            <ol class="mind-protocol-steps">
              <li><span>01</span> FLAG emotions</li>
              <li><span>02</span> RANT until empty</li>
              <li><span>03</span> LOGIC parse (robot Q&amp;A)</li>
              <li><span>04</span> TERMINAL command</li>
            </ol>
          </div>
          <div class="mind-archive-stats sys-flicker">
            <div><strong>${logs.length}</strong><span>archived sessions</span></div>
            <div><strong>∞</strong><span>rant capacity</span></div>
          </div>
        </aside>
        <main class="mind-main-panel sys-panel">
          <header class="ol-header">
            <div>
              <p class="ol-kicker sys-flicker">// buffer_archive · persistent</p>
              <h3 class="ol-title">SESSION LOG</h3>
            </div>
            <button type="button" class="btn ol-btn-new" id="olNewBtn">+ NEW SESSION</button>
          </header>
          <div class="ol-archive-grid">
            ${logs.length ? logs.map(log => {
              const emTags = (log.emotions || []).slice(0, 6).map(id => {
                const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
                return em ? `<span class="ol-tag" style="--olt-neon:${em.neon}"><span class="ol-tag-glyph">${em.icon}</span>${em.label}</span>` : '';
              }).join('');
              const more = (log.emotions || []).length > 6 ? `<span class="ol-tag-more">+${log.emotions.length - 6}</span>` : '';
              return `<article class="ol-archive-card sys-panel">
                <div class="ol-card-meta">
                  <time>${esc(log.date || '')}</time>
                  <span class="ol-card-id">${esc(log.id.slice(-6))}</span>
                </div>
                <h4>${esc(log.title || 'UNTITLED')}</h4>
                <div class="ol-card-tags">${emTags}${more}</div>
                <p class="ol-card-snippet">${esc((log.rant || '').slice(0, 200))}${(log.rant || '').length > 200 ? '…' : ''}</p>
                ${log.command ? `<p class="ol-card-cmd">&gt; ${esc(log.command)}</p>` : ''}
                <div class="ol-card-actions">
                  <button type="button" class="btn ol-open-btn" data-ol-open="${esc(log.id)}">OPEN</button>
                  <button type="button" class="btn ol-edit-btn" data-ol-edit="${esc(log.id)}">EDIT</button>
                </div>
              </article>`;
            }).join('') : '<p class="ol-empty sys-flicker">// no sessions archived — initiate when buffer overflows</p>'}
          </div>
        </main>
      </div>`;
  },

  renderSession(){
    const draft = this.sessionDraft || this.emptyDraft();
    if(this.sessionPhase === 'parse') return this.renderParse(draft);
    if(this.sessionPhase === 'command') return this.renderCommand(draft);

    return `
      <div class="mind-session-layout">
        <div class="mind-session-progress">
          <span class="active">01 FLAGS</span>
          <span class="active">02 RANT</span>
          <span>03 PARSE</span>
          <span>04 CMD</span>
        </div>
        <div class="ol-session-grid">
          <section class="ol-panel sys-panel">
            <header class="ol-panel-head"><span>01</span><h4>EMOTION FLAGS</h4></header>
            <p class="field-hint">Select all active signals. No limit.</p>
            <div id="olEmotionGrid">${this.renderEmotionChecks(draft.emotions)}</div>
          </section>
          <section class="ol-panel sys-panel ol-rant-panel">
            <header class="ol-panel-head"><span>02</span><h4>RANT BUFFER</h4></header>
            <p class="field-hint">Unfiltered dump. Keep going until empty.</p>
            <div class="ol-meta-row">
              <div class="field"><label>DATE</label><input type="date" id="olDate" class="sys-input" value="${esc(draft.date || todayKey())}"></div>
              <div class="field"><label>SESSION TAG</label><input type="text" id="olTitle" class="sys-input" value="${esc(draft.title)}" placeholder="optional label"></div>
            </div>
            <textarea id="olRant" class="ol-rant sys-input" rows="18" placeholder="Type everything. Do not stop for grammar, logic, or shame.">${esc(draft.rant)}</textarea>
            <div class="ol-rant-actions">
              <button type="button" class="btn" id="olBackHub">← ARCHIVE</button>
              <button type="button" class="btn ol-btn-finished" id="olFinishedRant">■ FINISHED RANT — RUN PARSE</button>
            </div>
          </section>
        </div>
      </div>`;
  },

  renderParse(draft){
    const solutions = draft.solutions || [];
    const ctrl = solutions.filter(s => s.control === 'CONTROLLABLE');
    const unctrl = solutions.filter(s => s.control === 'UNCONTROLLABLE');
    return `
      <div class="mind-session-layout diagnostic">
        <div class="mind-session-progress">
          <span class="done">01 FLAGS</span>
          <span class="done">02 RANT</span>
          <span class="active">03 PARSE</span>
          <span>04 CMD</span>
        </div>
        <section class="ol-terminal sys-panel">
          <header class="ol-terminal-head">
            <span>LOGIC_CORE v1.0 — AUTONOMOUS</span>
            <span class="sys-flicker">user input: DISABLED · parsing complete</span>
          </header>
          <div class="ol-parse-summary">
            <div class="ol-parse-stat"><strong>${ctrl.length}</strong><span>controllable</span></div>
            <div class="ol-parse-stat discard"><strong>${unctrl.length}</strong><span>discard</span></div>
            <div class="ol-parse-stat"><strong>${solutions.length}</strong><span>problems parsed</span></div>
          </div>
          <div class="ol-term-log read" id="olTermLog">
            ${(draft.transcript || []).map(line => `
              <div class="ol-term-line ${line.role}">
                <span class="ol-term-tag">SYS</span>
                <p>${esc(line.text)}</p>
              </div>`).join('')}
          </div>
          <div class="ol-rant-actions">
            <button type="button" class="btn" id="olBackToRant">← RE-RANT</button>
            <button type="button" class="btn ol-btn-finished" id="olContinueCommand">ACCEPT PARSE → COMMAND</button>
          </div>
        </section>
      </div>`;
  },

  renderCommand(draft){
    return `
      <div class="mind-session-layout">
        <div class="mind-session-progress">
          <span class="done">01 FLAGS</span>
          <span class="done">02 RANT</span>
          <span class="done">03 PARSE</span>
          <span class="active">04 CMD</span>
        </div>
        <section class="ol-panel sys-panel">
          <header class="ol-panel-head"><span>04</span><h4>TERMINAL COMMAND</h4></header>
          <p class="field-hint">One executable instruction for your next move. Imperative mood.</p>
          <div class="ol-command-wrap ol-command-large">
            <span class="ol-prompt-char">&gt;</span>
            <input type="text" id="olCommand" class="sys-input" value="${esc(draft.command || draft.suggestedCommand || '')}" placeholder="EXECUTE: …">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" id="olBackToParse">← PARSE</button>
            <button type="button" class="btn ol-btn-finished" id="olSaveSession">■ ARCHIVE SESSION</button>
          </div>
        </section>
      </div>`;
  },

  renderRead(){
    const log = state.overloadLogs.find(l => l.id === this.editingId);
    if(!log) return this.renderHub();
    const emTags = (log.emotions || []).map(id => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return em ? `<span class="ol-tag" style="--olt-neon:${em.neon}"><span class="ol-tag-glyph">${em.icon}</span>${em.label}</span>` : '';
    }).join('');
    const transcript = (log.transcript || []).map(line => `
      <div class="ol-term-line ${line.role}">
        <span class="ol-term-tag">${line.role === 'user' ? 'USR' : 'SYS'}</span>
        <p>${esc(line.text)}</p>
      </div>`).join('');
    const legacyPrompts = Object.entries(log.diagnostics || {}).filter(([k]) => !DIAGNOSTIC_CORE.some(c => c.id === k)).map(([id, val]) => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return `<div class="ol-read-prompt sys-panel"><div class="ol-read-prompt-label">${esc((em?.label || id).toUpperCase())}</div><p>${esc(val)}</p></div>`;
    }).join('');
    return `
      <div class="mind-read-layout sys-panel">
        <header class="ol-header">
          <div>
            <p class="ol-kicker sys-flicker">// session_read · ${esc(log.id.slice(-8))}</p>
            <h3 class="ol-title">${esc(log.title)}</h3>
            <p class="ol-sub">${esc(log.date || '')}</p>
          </div>
          <button type="button" class="btn" id="olBackHub">← ARCHIVE</button>
        </header>
        <div class="ol-card-tags">${emTags}</div>
        <section class="ol-section sys-panel"><h4>RANT BUFFER</h4><pre class="ol-read-rant">${esc(log.rant || '')}</pre></section>
        ${transcript ? `<section class="ol-section sys-panel"><h4>LOGIC PARSE TRANSCRIPT</h4><div class="ol-term-log read">${transcript}</div></section>` : ''}
        ${legacyPrompts ? `<section class="ol-section"><h4>LEGACY FLAGS</h4>${legacyPrompts}</section>` : ''}
        ${log.command ? `<section class="ol-section sys-panel"><h4>TERMINAL COMMAND</h4><p class="ol-read-cmd">&gt; ${esc(log.command)}</p></section>` : ''}
        <div class="modal-actions">
          <button type="button" class="btn" id="olEditCurrent">EDIT SESSION</button>
          <button type="button" class="btn ol-del-btn" data-ol-del="${esc(log.id)}">DELETE</button>
        </div>
      </div>`;
  },

  render(){
    const root = document.getElementById('mindContent');
    if(!root) return;
    if(this.view === 'session') root.innerHTML = this.renderSession();
    else if(this.view === 'read') root.innerHTML = this.renderRead();
    else root.innerHTML = this.renderHub();

    root.querySelector('#olNewBtn')?.addEventListener('click', () => this.newLog());
    root.querySelector('#olBackHub')?.addEventListener('click', () => { this.view = 'hub'; this.editingId = null; this.sessionDraft = null; this.render(); });
    root.querySelector('#olFinishedRant')?.addEventListener('click', () => this.runAutoParse());
    root.querySelector('#olContinueCommand')?.addEventListener('click', () => { this.sessionPhase = 'command'; this.render(); });
    root.querySelector('#olBackToParse')?.addEventListener('click', () => { this.sessionPhase = 'parse'; this.render(); });
    root.querySelector('#olBackToRant')?.addEventListener('click', () => { this.sessionPhase = 'emotions'; this.render(); });
    root.querySelector('#olSaveSession')?.addEventListener('click', () => this.saveSession());
    root.querySelector('#olEditCurrent')?.addEventListener('click', () => this.editLog(this.editingId));
    root.querySelectorAll('[data-ol-open]').forEach(btn => btn.addEventListener('click', () => this.viewLog(btn.dataset.olOpen)));
    root.querySelectorAll('[data-ol-edit]').forEach(btn => btn.addEventListener('click', () => this.editLog(btn.dataset.olEdit)));
    root.querySelectorAll('[data-ol-del]').forEach(btn => btn.addEventListener('click', () => this.deleteLog(btn.dataset.olDel)));

    if(this.view === 'session' && this.sessionPhase === 'parse'){
      queueMicrotask(() => {
        const log = document.getElementById('olTermLog');
        if(log) log.scrollTop = log.scrollHeight;
      });
    }
  },

  init(){
    this.checkUrl();
    this.ensureLogs();
    document.getElementById('oglEnterBtn')?.addEventListener('click', e => { e.stopPropagation(); this.completeGlitchTransition(); });
    document.getElementById('overloadGlitchScreen')?.addEventListener('click', () => this.completeGlitchTransition());
    document.addEventListener('click', e => {
      if(e.target.closest('#mindExitBtn')){ e.preventDefault(); this.exitChannel(); }
    });
  },
};
