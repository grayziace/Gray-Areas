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
  capitalize(s){
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  },

  extractSentences(rant){
    return rant.split(/[\n.!?]+/).map(s => s.trim()).filter(s => s.length > 6);
  },

  decomposeProblems(rant){
    const text = rant.trim().replace(/\s+/g, ' ');
    const problems = [];
    const used = new Set();
    const add = (raw, type) => {
      const t = this.capitalize(raw.trim().replace(/^[,;]\s*/, ''));
      if(t.length < 8) return;
      const key = t.toLowerCase().slice(0, 48);
      if(used.has(key)) return;
      used.add(key);
      problems.push({ text: t, type });
    };
    const body = text.match(/\bi'?m\s+(?:feeling\s+)?(?:sick|ill|unwell|tired|exhausted|worn\s+out|not\s+well)(?:\s+and\s+(?:tired|sick|exhausted|worn\s+out))?/i);
    if(body) add(body[0], 'body');
    const worry = text.match(/\bi'?m\s+worried\s+about\s+([^.!?]+)/i);
    if(worry) add(`Worried about ${worry[1].trim()}`, 'planning');
    else {
      const host = text.match(/(?:next\s+)?(?:weekend|saturday|sunday)[^.!?]*(?:host|hosting|guest|logistic)[^.!?]*/i)
        || text.match(/hosting\s+[^.!?]+/i);
      if(host) add(host[0], 'planning');
    }
    const guilt = text.match(/\bi\s+(?:feel\s+)?guilty\s+(?:about|for|that)\s+([^.!?]+)/i);
    if(guilt) add(`Feeling guilty about ${guilt[1].trim()}`, 'guilt');
    const form = text.match(/(?:sick|ill|tired|unwell)[^.!?]*(?:friend|guest|host|weekend)[^.!?]*/i)
      || text.match(/(?:friend|guest)[^.!?]*(?:weekend|coming)[^.!?]*(?:sick|tired|best form)[^.!?]*/i)
      || text.match(/worried?\s+(?:i\s+)?won'?t\s+be\s+(?:on\s+)?(?:my\s+)?best\s+form[^.!?]*/i);
    if(form) add(form[0], 'hosting_health');
    const binge = text.match(/(?:binge\s*eating|binge\s*eat|keep\s+binge)[^.!?]*/i);
    if(binge) add(this.capitalize(binge[0]), 'habit');
    const guestCount = text.match(/worried?\s+(?:that\s+)?(?:no\s*one|nobody)\s+will\s+come[^.!?]*/i);
    if(guestCount) add(this.capitalize(guestCount[0]), 'guest_anxiety');
    const tooMany = text.match(/worried?\s+(?:that\s+)?too\s+many\s+will\s+come[^.!?]*/i);
    if(tooMany) add(this.capitalize(tooMany[0]), 'guest_anxiety');
    const bodyImage = text.match(/(?:skinny\s+legend|lose\s+weight|need\s+to\s+be\s+thin)[^.!?]*/i);
    if(bodyImage) add(this.capitalize(bodyImage[0]), 'body_image');
    const external = text.match(/\b(?:they|he|she|people)\s+(?:won'?t|don't|didn'?t|can'?t|refuse)[^.!?]*/i);
    if(external) add(this.capitalize(external[0]), 'external');
    if(!problems.length) this.extractSentences(text).forEach(s => add(s, 'general'));
    if(!problems.length && text) add(text.length > 180 ? text.slice(0, 180) + '…' : text, 'general');
    return problems.slice(0, 6);
  },

  classifyControl(text, type){
    const t = text.toLowerCase();
    if(type === 'body') return { class: 'PARTIAL', reason: 'Body state is partly in your control through rest, fuel, and pacing — not a closed timeline.' };
    if(type === 'planning' || /\b(host|hosting|guest|logistic|plan|prepare|checklist|organis|organiz|worried about)\b/.test(t)){
      return { class: 'CONTROLLABLE', reason: 'Future event you can still prepare for — assignable to your planning runtime.' };
    }
    if(type === 'guilt') return { class: 'PARTIAL', reason: 'Moral signal — split the rule you think you broke from what you can actually change.' };
    if(type === 'hosting_health' || type === 'habit' || type === 'body_image') return { class: 'PARTIAL', reason: 'Mixed body state and behaviour — partly steerable with small protocols.' };
    if(type === 'guest_anxiety') return { class: 'CONTROLLABLE', reason: 'RSVP and expectation-setting are still in your hands.' };
    if(type === 'external' || /\b(they|he|she)\s+(won'?t|don't|didn'?t|can'?t|refuse)\b/.test(t)){
      return { class: 'UNCONTROLLABLE', reason: 'Another agent holds the decision — not assignable to your runtime.' };
    }
    if(/\b(past|already happened|can't change|cannot change|too late|died|passed away)\b/.test(t)){
      return { class: 'UNCONTROLLABLE', reason: 'Closed timeline — output only, no further steering.' };
    }
    if(/\b(i can|i will|i should|i need to|i could|myself|my )\b/.test(t)
      || /\b(sleep|eat|rest|walk|drink|call|text|ask|write|list|plan|prepare)\b/.test(t)){
      return { class: 'CONTROLLABLE', reason: 'User-executable action detected in this thread.' };
    }
    return { class: 'PARTIAL', reason: 'Mixed influence — separate facts, feelings, and one next action.' };
  },

  rephraseProblem(problem){
    const map = {
      body: "You're physically depleted — sick or exhausted — and your body is asking for maintenance.",
      hosting_health: "You're unwell before guests arrive and worried you won't have the energy to show up well for them.",
      planning: "You're anxious about hosting logistics for an upcoming event.",
      guest_anxiety: "You're worried about guest numbers — who will or won't show up.",
      habit: "You're caught in a binge eating loop and it's distressing you.",
      body_image: "You're putting pressure on yourself to be thinner or hit a certain body ideal.",
      guilt: "You're carrying guilt about something you think you did wrong.",
      external: "Someone else's choices are dominating this thread.",
    };
    if(map[problem.type]) return map[problem.type];
    const t = problem.text;
    if(/\bhost|guest|weekend|logistic/i.test(t)) return "You're stressed about an upcoming social event and how it will run.";
    if(/\bsick|tired|ill/i.test(t)) return "Your body is under strain and needs recovery bandwidth.";
    return t.length > 120 ? t.slice(0, 118) + '…' : t;
  },

  suggestSeverity(problem, emotions){
    if(problem.type === 'body' || problem.type === 'hosting_health') return 'HIGH';
    if(problem.type === 'habit' || emotions.includes('guilty') || problem.type === 'body_image') return 'MEDIUM';
    if(problem.type === 'guest_anxiety' || problem.type === 'planning') return 'MEDIUM';
    return 'LOW';
  },

  suggestMeta(problem, emotions){
    const control = this.classifyControl(problem.text, problem.type);
    const severity = this.suggestSeverity(problem, emotions);
    const logic = {
      body: 'Fatigue and illness are signals, not moral failures — treat as maintenance, separate from hosting prep.',
      hosting_health: 'Guests care more about warmth than perfection — rest now is part of hosting prep, not competing with it.',
      planning: 'Logistics anxiety shrinks when written as a short checklist with deadlines.',
      guest_anxiety: 'Headcount fear is uncertainty — confirm invites and set a realistic cap rather than simulating both disasters.',
      habit: 'Binge cycles often spike under stress — address the stress thread and add one stabiliser (meal, walk, pause).',
      body_image: 'Body goals under stress become punishment loops — separate health actions from shame.',
      guilt: 'Name the rule before obeying it — many guilt rules are self-imposed.',
      external: 'Another person holds the lever — your only job is how much RAM this gets.',
    };
    return {
      control: control.class,
      reason: control.reason,
      severity,
      logic: logic[problem.type] || 'Split what happened from what you can still move.',
    };
  },

  narrativeFor(problem, meta){
    const ctrl = meta.control;
    const lines = [];
    lines.push({ kind: 'class', text: `${ctrl} · severity ${meta.severity} — ${meta.reason}` });
    lines.push({ kind: 'think', text: `THINK OF IT LIKE THIS: ${meta.logic}` });
    if(problem.type === 'body' || problem.type === 'hosting_health'){
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL: Rest blocks, fluids, food, pacing, and how much you commit to before the event.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: You white-knuckle through, crash when guests arrive, and feel worse after.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: One recovery block today makes the social thread survivable — not perfect, but present.' });
      lines.push({ kind: 'action', text: 'FIX: 20min rest + water + one meal now. Reassess energy before any host prep.' });
    } else if(problem.type === 'planning' || problem.type === 'guest_anxiety'){
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL: Guest list clarity, one confirmation message, food/space basics, and a sleep buffer.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: Spiral on imaginary headcounts instead of sending one clarifying text.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: A five-line checklist + one RSVP ping calms most of the noise.' });
      lines.push({ kind: 'action', text: 'FIX: Write checklist (food, space, timing, sleep, backup). Send one low-stakes headcount message.' });
    } else if(problem.type === 'habit'){
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL: Next meal choice, removing binge triggers for 2h, and naming the stress underneath.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: Shame spiral → more binge → less energy for everything else.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: One planned meal + short walk interrupts the loop enough to think clearly.' });
      lines.push({ kind: 'action', text: 'FIX: Eat one intentional meal within 90min. No restriction talk — just stabilise blood sugar.' });
    } else if(problem.type === 'body_image'){
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL: Whether today is a maintenance day vs a punishment day.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: Restrictive panic on top of stress and illness.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: Framing today as recovery — not weight loss — keeps energy for what matters.' });
      lines.push({ kind: 'action', text: 'FIX: Park the body-image thread until after the event. Today: stabilise body only.' });
    } else if(ctrl === 'UNCONTROLLABLE'){
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL: Attention budget — park this thread.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: All-day simulation of someone else\'s choices.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: Redirecting frees energy for rest or host prep.' });
      lines.push({ kind: 'redirect', text: 'DO THIS INSTEAD: Acknowledge once, mark [PARK], move to a controllable thread.' });
      lines.push({ kind: 'checkin', text: `CHECK IN AGAIN: ${this.checkInFor({ class: ctrl })}` });
    } else {
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL: One concrete next move in the next 30 minutes.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: Analysis replaces action.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: One small step reduces load noticeably.' });
      lines.push({ kind: 'action', text: 'FIX: One ≤15min action — execute before judging it.' });
    }
    return lines;
  },

  prepareWalkthrough(rant, emotionIds){
    return {
      problems: this.decomposeProblems(rant).map((p, i) => ({
        ...p,
        index: i + 1,
        raw: p.text,
        rephrase: this.rephraseProblem(p),
        suggested: this.suggestMeta(p, emotionIds),
      })),
      emotionIds,
    };
  },

  checkInFor(ctrl){
    if(ctrl.class === 'UNCONTROLLABLE') return '4 hours — or tomorrow morning if this is about a future event you cannot steer';
    if(ctrl.class === 'PARTIAL') return '2 hours — after one body-maintenance block';
    return 'after you complete the first fix step (~30 minutes)';
  },

  buildNarrative(problem, ctrl, emotions){
    const t = problem.text.toLowerCase();
    const lines = [];
    lines.push({ kind: 'problem', text: `PROBLEM ${problem.index}: ${problem.text}` });
    lines.push({ kind: 'class', text: `${ctrl.class} — ${ctrl.reason}` });
    if(problem.type === 'body' || /\b(sick|tired|ill|exhausted|unwell)\b/.test(t)){
      lines.push({ kind: 'think', text: 'THINK OF IT LIKE THIS: Your body is sending a maintenance alert. It is not the same thread as hosting or logistics — do not merge them in one panic loop.' });
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL THIS ASPECT: Rest blocks, hydration, food, sleep debt, and how hard you push before the event.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: You ignore the signal, push through, and arrive at the weekend depleted.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: One recovery block today + pacing makes the hosting thread actually manageable.' });
      lines.push({ kind: 'action', text: 'FIX: Rest minimum 20 minutes, drink water, eat one real meal — then reassess energy.' });
      return lines;
    }
    if(problem.type === 'planning' || /\b(host|hosting|logistic|guest|worried)\b/.test(t)){
      lines.push({ kind: 'think', text: 'THINK OF IT LIKE THIS: This is a planning problem, not a “people are uncontrollable” problem. Guests respond to preparation — your checklist is the lever.' });
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL THIS ASPECT: Guest count expectations, timings, food, space, what you do the day before, and how much you rest before they arrive.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: Last-minute scramble while you are already sick and tired — chaos at the door.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: A short checklist spread across a few days keeps the weekend calm enough.' });
      lines.push({ kind: 'action', text: 'FIX: Tonight — write a 5-line host checklist (food, space, timing, sleep buffer, one backup plan). Do one item tomorrow.' });
      return lines;
    }
    if(problem.type === 'guilt' || emotions.includes('guilty')){
      lines.push({ kind: 'think', text: 'THINK OF IT LIKE THIS: Guilt is a rule alarm. Name the rule before you punish yourself — many rules are self-imposed and negotiable.' });
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL THIS ASPECT: Whether the rule is valid, whether you clarify expectations, and one corrective action if actually needed.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: You loop on self-punishment without changing anything useful.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: Writing the rule down shrinks the shame signal to a single decision.' });
      lines.push({ kind: 'action', text: 'FIX: State the rule you think you broke in one sentence. Mark it valid, external, or self-imposed — then stop the loop.' });
      return lines;
    }
    if(ctrl.class === 'UNCONTROLLABLE'){
      lines.push({ kind: 'think', text: 'THINK OF IT LIKE THIS: This thread depends on someone else’s choice or a timeline that already closed. Rehearsing it costs energy without changing the outcome.' });
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL THIS ASPECT: How much attention you allocate — zero is a valid setting.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: You spend the day simulating outcomes you cannot steer.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: Parking this frees bandwidth for body recovery or host prep — the threads you can actually run.' });
      lines.push({ kind: 'redirect', text: 'DO THIS INSTEAD: Acknowledge once, mark [DISCARD], redirect to nearest controllable subsystem (rest or checklist).' });
      lines.push({ kind: 'checkin', text: `CHECK IN AGAIN: ${this.checkInFor(ctrl)}` });
      return lines;
    }
    if(ctrl.class === 'CONTROLLABLE'){
      lines.push({ kind: 'think', text: 'THINK OF IT LIKE THIS: There is an executable move here — small, time-boxed, no evaluation loop required.' });
      lines.push({ kind: 'control', text: 'YOU CAN CONTROL THIS ASPECT: The next concrete action in the next 30 minutes.' });
      lines.push({ kind: 'worst', text: 'WORST CASE: Analysis replaces action and nothing changes before sleep.' });
      lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: One completed step reduces the emotional load noticeably.' });
      lines.push({ kind: 'action', text: 'FIX: Pick one action ≤15 minutes. Execute before judging whether it helped.' });
      return lines;
    }
    lines.push({ kind: 'think', text: 'THINK OF IT LIKE THIS: Part feeling, part fact — split them before you pick a move.' });
    lines.push({ kind: 'control', text: 'YOU CAN CONTROL THIS ASPECT: One body or planning action while the rest stays on read-only.' });
    lines.push({ kind: 'worst', text: 'WORST CASE: Treating the whole blob as one emergency.' });
    lines.push({ kind: 'likely', text: 'LIKELY OUTCOME: One small maintenance action stabilises the partial thread.' });
    lines.push({ kind: 'action', text: 'FIX: Run body protocol (rest + water + food) OR one planning line — not both at once.' });
    lines.push({ kind: 'checkin', text: `CHECK IN AGAIN: ${this.checkInFor(ctrl)}` });
    return lines;
  },

  suggestCommand(solutions, emotions){
    const plan = solutions.find(s => (s.type === 'planning' || s.type === 'guest_anxiety') && s.control !== 'UNCONTROLLABLE');
    if(plan) return 'EXECUTE: write checklist + send one headcount message';
    const host = solutions.find(s => s.type === 'hosting_health');
    if(host) return 'EXECUTE: rest 20min + one meal — then reassess before host prep';
    const body = solutions.find(s => s.type === 'body');
    if(body) return 'EXECUTE: rest + hydration checkpoint within 20 minutes';
    const ctrl = solutions.find(s => s.control === 'CONTROLLABLE');
    if(ctrl) return 'EXECUTE: ' + (ctrl.actionLine || 'one 15-minute task').replace(/^FIX:\s*/i, '').slice(0, 90);
    if(emotions.includes('guilty')) return 'EXECUTE: write the rule you think you broke — mark valid or self-imposed';
    return 'EXECUTE: one 10-minute maintenance task (water, food, shower, or walk)';
  },

  parse(rant, emotionIds){
    const problems = this.decomposeProblems(rant).map((p, i) => ({ ...p, index: String(i + 1).padStart(2, '0') }));
    const displayQueue = [];
    const transcript = [];
    const solutions = [];
    const flagLabels = emotionIds.map(id => OVERLOAD_EMOTIONS.find(e => e.id === id)?.label || id).join(' · ');
    const intro = [
      { kind: 'intro', text: 'Parsing rant — reading for separate threads, not dumping every flag as its own problem.' },
      { kind: 'intro', text: flagLabels ? `Context flags: ${flagLabels} (inform the read — not standalone problems).` : 'No emotion flags — parsing text only.' },
      { kind: 'divider', text: '—' },
    ];
    intro.forEach(l => { displayQueue.push(l); transcript.push({ role: 'system', text: l.text, kind: l.kind }); });
    problems.forEach(p => {
      const ctrl = this.classifyControl(p.text, p.type);
      const narrative = this.buildNarrative(p, ctrl, emotionIds);
      narrative.forEach(line => { displayQueue.push(line); transcript.push({ role: 'system', text: line.text, kind: line.kind }); });
      displayQueue.push({ kind: 'divider', text: '—' });
      transcript.push({ role: 'system', text: '—', kind: 'divider' });
      const actionLine = narrative.find(n => n.kind === 'action' || n.kind === 'redirect')?.text || '';
      solutions.push({ problem: p.text, type: p.type, control: ctrl.class, reason: ctrl.reason, actionLine, checkIn: narrative.find(n => n.kind === 'checkin')?.text || '' });
    });
    const controllable = solutions.filter(s => s.control === 'CONTROLLABLE').length;
    const uncontrollable = solutions.filter(s => s.control === 'UNCONTROLLABLE').length;
    const partial = solutions.length - controllable - uncontrollable;
    const suggestedCommand = this.suggestCommand(solutions, emotionIds);
    const outro = [
      { kind: 'summary', text: `Parse complete — ${controllable} controllable · ${uncontrollable} parked · ${partial} partial` },
      { kind: 'command', text: `Suggested command: ${suggestedCommand}` },
    ];
    outro.forEach(l => { displayQueue.push(l); transcript.push({ role: 'system', text: l.text, kind: l.kind }); });
    return { displayQueue, transcript, solutions, problems, suggestedCommand, diagnostics: { controllable, uncontrollable, partial, total: solutions.length } };
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
  parseProblems: [],
  parseProblemIndex: 0,
  parseStep: 'idle',
  parseAwaitingClassify: false,
  parseTranscriptLines: [],
  parseQueue: [],
  parseQueueIndex: 0,
  parseCharIndex: 0,
  parseComplete: false,
  parseTypingTimer: null,
  parseCurrentLineEl: null,
  _parseBoot: false,

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
    this.stopParseTypewriter();
    document.body.classList.remove('mind-channel-open', 'mind-repair-active');
    const view = this.returnView || 'profile';
    if(typeof navigateToView === 'function') navigateToView(view);
    else {
      document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + view)?.classList.add('active');
      document.querySelectorAll('.node-btn').forEach(b => b.classList.remove('active'));
      document.querySelector(`.node-btn[data-view="${view}"]`)?.classList.add('active');
    }
    this.view = 'hub';
    this.editingId = null;
    this.sessionDraft = null;
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

    const walk = RantLogicEngine.prepareWalkthrough(rant, emotions);
    this.parseProblems = walk.problems;
    this.parseProblemIndex = 0;
    this.parseStep = 'intro';
    this.parseQueue = [];
    this.parseQueueIndex = 0;
    this.parseCharIndex = 0;
    this.parseComplete = false;
    this.parseAwaitingClassify = false;
    this.parseTranscriptLines = [];
    this.sessionDraft.solutions = [];
    this.sessionDraft.transcript = [];
    this.sessionPhase = 'parse';
    this._parseBoot = true;
    this.render();
  },

  queueIntroLines(){
    const n = this.parseProblems.length;
    const flags = (this.sessionDraft?.emotions || []).map(id => OVERLOAD_EMOTIONS.find(e => e.id === id)?.label || id).join(' · ');
    this.enqueueLines([
      { kind: 'intro', text: 'logic_core online — one thread at a time' },
      { kind: 'intro', text: flags ? `context: ${flags} (background only, not separate problems)` : 'no emotion flags — parsing text only' },
      { kind: 'intro', text: `found ${n} thread${n === 1 ? '' : 's'} in rant buffer` },
      { kind: 'divider', text: '—' },
    ]);
  },

  enqueueLines(lines){
    this.parseQueue.push(...lines);
  },

  appendTranscript(text, kind){
    this.parseTranscriptLines.push({ role: 'system', text, kind });
    if(this.sessionDraft) this.sessionDraft.transcript = [...this.parseTranscriptLines];
  },

  queueProblemIntro(){
    const p = this.parseProblems[this.parseProblemIndex];
    if(!p) return;
    const total = this.parseProblems.length;
    this.enqueueLines([
      { kind: 'problem', text: `THREAD ${p.index} / ${total}` },
      { kind: 'intro', text: `raw: "${p.raw.length > 90 ? p.raw.slice(0, 88) + '…' : p.raw}"` },
      { kind: 'rephrase', text: `distilled: ${p.rephrase}` },
      { kind: 'pause_classify', text: '' },
    ]);
  },

  showClassifyPanel(){
    const p = this.parseProblems[this.parseProblemIndex];
    const panel = document.getElementById('olClassifyPanel');
    if(!p || !panel) return;
    const s = p.suggested;
    panel.innerHTML = `
      <p class="ol-classify-kicker">How should we classify this thread?</p>
      <p class="ol-classify-suggest">Suggested: <strong>${esc(s.control)}</strong> · severity <strong>${esc(s.severity)}</strong></p>
      <p class="ol-classify-why">${esc(s.logic)}</p>
      <div class="ol-classify-controls">
        <span class="ol-classify-label">Control</span>
        <button type="button" class="btn ol-classify-btn" data-ol-class="CONTROLLABLE">Controllable</button>
        <button type="button" class="btn ol-classify-btn" data-ol-class="PARTIAL">Partial</button>
        <button type="button" class="btn ol-classify-btn" data-ol-class="UNCONTROLLABLE">Uncontrollable</button>
      </div>
      <div class="ol-classify-controls">
        <span class="ol-classify-label">Severity</span>
        <button type="button" class="btn ol-classify-btn" data-ol-sev="LOW">Low</button>
        <button type="button" class="btn ol-classify-btn" data-ol-sev="MEDIUM">Medium</button>
        <button type="button" class="btn ol-classify-btn" data-ol-sev="HIGH">High</button>
      </div>
      <button type="button" class="btn primary ol-classify-accept" data-ol-accept="1">Accept suggestion → analyse</button>`;
    panel.classList.remove('hidden');
    panel.querySelector('[data-ol-accept]')?.addEventListener('click', () => this.confirmClassification(s.control, s.severity));
    panel.querySelectorAll('[data-ol-class]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.dataset.olControl = btn.dataset.olClass;
        panel.querySelectorAll('[data-ol-class]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    panel.querySelectorAll('[data-ol-sev]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.dataset.olSeverity = btn.dataset.olSev;
        panel.querySelectorAll('[data-ol-sev]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    const status = document.getElementById('olParseStatus');
    if(status) status.textContent = 'waiting — classify this thread';
  },

  confirmClassification(control, severity){
    const panel = document.getElementById('olClassifyPanel');
    const p = this.parseProblems[this.parseProblemIndex];
    if(!p) return;
    const finalControl = panel?.dataset.olControl || control || p.suggested.control;
    const finalSeverity = panel?.dataset.olSeverity || severity || p.suggested.severity;
    p.finalMeta = { control: finalControl, severity: finalSeverity, reason: p.suggested.reason, logic: p.suggested.logic };
    panel?.classList.add('hidden');
    this.parseAwaitingClassify = false;
    const narrative = RantLogicEngine.narrativeFor(p, p.finalMeta);
    const actionLine = narrative.find(n => n.kind === 'action' || n.kind === 'redirect')?.text || '';
    this.sessionDraft.solutions.push({
      problem: p.rephrase,
      raw: p.raw,
      type: p.type,
      control: finalControl,
      severity: finalSeverity,
      actionLine,
    });
    this.enqueueLines(narrative);
    if(this.parseProblemIndex < this.parseProblems.length - 1){
      this.enqueueLines([
        { kind: 'divider', text: '—' },
        { kind: 'intro', text: 'next thread →' },
        { kind: 'divider', text: '—' },
      ]);
    }
    const status = document.getElementById('olParseStatus');
    if(status) status.textContent = 'typing analysis…';
    this.startParseTypewriter();
  },

  finishWalkthrough(){
    const solutions = this.sessionDraft?.solutions || [];
    const controllable = solutions.filter(s => s.control === 'CONTROLLABLE').length;
    const uncontrollable = solutions.filter(s => s.control === 'UNCONTROLLABLE').length;
    const partial = solutions.length - controllable - uncontrollable;
    const suggestedCommand = RantLogicEngine.suggestCommand(solutions, this.sessionDraft?.emotions || []);
    this.sessionDraft.diagnostics = { controllable, uncontrollable, partial, total: solutions.length };
    this.sessionDraft.suggestedCommand = suggestedCommand;
    this.sessionDraft.command = suggestedCommand;
    this.parseStep = 'done';
    this.enqueueLines([
      { kind: 'divider', text: '—' },
      { kind: 'summary', text: `All threads parsed — ${controllable} controllable · ${uncontrollable} parked · ${partial} partial` },
      { kind: 'command', text: `Suggested command: ${suggestedCommand}` },
    ]);
    this.startParseTypewriter();
  },

  stopParseTypewriter(){
    clearTimeout(this.parseTypingTimer);
    this.parseTypingTimer = null;
  },

  lineKindClass(kind){
    const map = {
      problem: 'ol-line-problem',
      rephrase: 'ol-line-rephrase',
      class: 'ol-line-class',
      think: 'ol-line-think',
      control: 'ol-line-control',
      worst: 'ol-line-worst',
      likely: 'ol-line-likely',
      action: 'ol-line-action',
      redirect: 'ol-line-redirect',
      checkin: 'ol-line-checkin',
      summary: 'ol-line-summary',
      command: 'ol-line-command',
      intro: 'ol-line-intro',
      divider: 'ol-line-divider',
    };
    return map[kind] || 'ol-line-body';
  },

  startParseTypewriter(){
    this.stopParseTypewriter();
    if(!this.parseQueue.length && !this.parseAwaitingClassify){
      if(this.parseProblemIndex === 0 && this.parseStep === 'intro'){
        this.parseStep = 'problem';
        this.queueProblemIntro();
      }
    }
    if(!document.getElementById('olTermLog')) return;
    this.typeNextParseChar();
  },

  typeNextParseChar(){
    if(this.parseAwaitingClassify) return;
    if(this.parseQueueIndex >= this.parseQueue.length){
      if(this.parseStep === 'intro'){
        this.parseStep = 'problem';
        this.queueProblemIntro();
        this.typeNextParseChar();
        return;
      }
      if(this.parseStep === 'problem' && this.parseProblemIndex < this.parseProblems.length - 1){
        this.parseProblemIndex++;
        this.queueProblemIntro();
        this.typeNextParseChar();
        return;
      }
      if(this.parseStep === 'problem'){
        this.finishWalkthrough();
        return;
      }
      if(this.parseStep === 'done'){
        this.parseComplete = true;
        this.onParseTypingComplete();
        return;
      }
    }

    const item = this.parseQueue[this.parseQueueIndex];
    const log = document.getElementById('olTermLog');
    if(!log) return;

    if(item.kind === 'pause_classify'){
      this.parseQueueIndex++;
      this.parseCharIndex = 0;
      this.parseCurrentLineEl = null;
      this.parseAwaitingClassify = true;
      this.showClassifyPanel();
      return;
    }

    if(item.kind === 'divider'){
      const div = document.createElement('div');
      div.className = 'ol-term-line system ol-line-divider';
      div.innerHTML = '<span class="ol-term-tag">—</span><p> </p>';
      log.appendChild(div);
      this.appendTranscript('—', 'divider');
      this.parseQueueIndex++;
      this.parseCharIndex = 0;
      this.parseCurrentLineEl = null;
      this.parseTypingTimer = setTimeout(() => this.typeNextParseChar(), 400);
      log.scrollTop = log.scrollHeight;
      return;
    }

    if(!this.parseCurrentLineEl || this.parseCharIndex === 0){
      const row = document.createElement('div');
      row.className = `ol-term-line system ${this.lineKindClass(item.kind)}`;
      row.innerHTML = `<span class="ol-term-tag">SYS</span><p></p>`;
      log.appendChild(row);
      this.parseCurrentLineEl = row.querySelector('p');
    }

    const text = item.text || '';
    if(this.parseCharIndex < text.length){
      this.parseCurrentLineEl.textContent += text[this.parseCharIndex];
      this.parseCharIndex++;
      const delay = item.kind === 'rephrase' ? 18 : 12;
      this.parseTypingTimer = setTimeout(() => this.typeNextParseChar(), delay);
    } else {
      this.appendTranscript(text, item.kind);
      this.parseQueueIndex++;
      this.parseCharIndex = 0;
      this.parseCurrentLineEl = null;
      const pause = item.kind === 'problem' ? 600 : item.kind === 'rephrase' ? 500 : 320;
      this.parseTypingTimer = setTimeout(() => this.typeNextParseChar(), pause);
    }
    log.scrollTop = log.scrollHeight;
  },

  onParseTypingComplete(){
    const diag = this.sessionDraft?.diagnostics || {};
    const stats = document.getElementById('olParseStats');
    if(stats){
      const ctrl = stats.querySelector('[data-stat="ctrl"] strong');
      const park = stats.querySelector('[data-stat="park"] strong');
      const total = stats.querySelector('[data-stat="total"] strong');
      if(ctrl) ctrl.textContent = diag.controllable ?? 0;
      if(park) park.textContent = diag.uncontrollable ?? 0;
      if(total) total.textContent = diag.total ?? 0;
      stats.classList.remove('ol-parse-pending');
    }
    const status = document.getElementById('olParseStatus');
    if(status) status.textContent = 'parse complete — review below';
    document.getElementById('olContinueCommand')?.classList.remove('hidden');
    document.getElementById('olContinueCommand')?.removeAttribute('disabled');
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
              <li><span>03</span> LOGIC parse (one thread at a time)</li>
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
    const diag = draft.diagnostics || {};
    const pending = !this.parseComplete;
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
            <span>LOGIC_CORE — reading your rant</span>
            <span class="sys-flicker" id="olParseStatus">${pending ? 'typing analysis…' : 'parse complete — review below'}</span>
          </header>
          <div class="ol-parse-summary ${pending ? 'ol-parse-pending' : ''}" id="olParseStats">
            <div class="ol-parse-stat" data-stat="ctrl"><strong>${pending ? '…' : (diag.controllable ?? 0)}</strong><span>controllable</span></div>
            <div class="ol-parse-stat discard" data-stat="park"><strong>${pending ? '…' : (diag.uncontrollable ?? 0)}</strong><span>parked</span></div>
            <div class="ol-parse-stat" data-stat="total"><strong>${pending ? '…' : (diag.total ?? 0)}</strong><span>threads found</span></div>
          </div>
          <div class="ol-term-log read typing" id="olTermLog"></div>
          <div class="ol-classify-panel hidden" id="olClassifyPanel"></div>
          <div class="ol-rant-actions">
            <button type="button" class="btn" id="olBackToRant">← RE-RANT</button>
            <button type="button" class="btn ol-btn-finished ${pending ? 'hidden' : ''}" id="olContinueCommand" ${pending ? 'disabled' : ''}>ACCEPT PARSE → COMMAND</button>
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
      <div class="ol-term-line ${line.role} ${line.kind ? OverloadLog.lineKindClass(line.kind) : ''}">
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
    if(this.view === 'session' && this.sessionPhase === 'parse') this.stopParseTypewriter();
    if(this.view === 'session') root.innerHTML = this.renderSession();
    else if(this.view === 'read') root.innerHTML = this.renderRead();
    else root.innerHTML = this.renderHub();

    root.querySelector('#olNewBtn')?.addEventListener('click', () => this.newLog());
    root.querySelector('#olBackHub')?.addEventListener('click', () => { this.stopParseTypewriter(); this.view = 'hub'; this.editingId = null; this.sessionDraft = null; this.render(); });
    root.querySelector('#olFinishedRant')?.addEventListener('click', () => this.runAutoParse());
    root.querySelector('#olContinueCommand')?.addEventListener('click', () => { this.sessionPhase = 'command'; this.render(); });
    root.querySelector('#olBackToParse')?.addEventListener('click', () => {
      this.parseComplete = true;
      this.parseAwaitingClassify = false;
      this.sessionPhase = 'parse';
      this.render();
    });
    root.querySelector('#olBackToRant')?.addEventListener('click', () => { this.stopParseTypewriter(); this.sessionPhase = 'emotions'; this.render(); });
    root.querySelector('#olSaveSession')?.addEventListener('click', () => this.saveSession());
    root.querySelector('#olEditCurrent')?.addEventListener('click', () => this.editLog(this.editingId));
    root.querySelectorAll('[data-ol-open]').forEach(btn => btn.addEventListener('click', () => this.viewLog(btn.dataset.olOpen)));
    root.querySelectorAll('[data-ol-edit]').forEach(btn => btn.addEventListener('click', () => this.editLog(btn.dataset.olEdit)));
    root.querySelectorAll('[data-ol-del]').forEach(btn => btn.addEventListener('click', () => this.deleteLog(btn.dataset.olDel)));

    if(this.view === 'session' && this.sessionPhase === 'parse' && this._parseBoot){
      this._parseBoot = false;
      queueMicrotask(() => {
        const log = document.getElementById('olTermLog');
        if(log) log.innerHTML = '';
        this.queueIntroLines();
        this.startParseTypewriter();
      });
    } else if(this.view === 'session' && this.sessionPhase === 'parse' && this.parseAwaitingClassify){
      queueMicrotask(() => this.showClassifyPanel());
    }
  },

  init(){
    this.checkUrl();
    this.ensureLogs();
    document.getElementById('oglEnterBtn')?.addEventListener('click', e => { e.stopPropagation(); this.completeGlitchTransition(); });
    document.getElementById('overloadGlitchScreen')?.addEventListener('click', () => this.completeGlitchTransition());
    const exitBtn = document.getElementById('mindExitBtn');
    exitBtn?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.exitChannel(); });
  },
};
