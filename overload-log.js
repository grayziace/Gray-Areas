/* ===== System Overload — glitch intro + mental health channel ===== */

const OVERLOAD_EMOTIONS = [
  { id: 'overwhelmed', label: 'Overwhelmed', dot: '🔴', neon: '#f43f8e' },
  { id: 'anxious', label: 'Anxious', dot: '🟠', neon: '#fb923c' },
  { id: 'frustrated', label: 'Frustrated', dot: '🟡', neon: '#e8c547' },
  { id: 'stagnant', label: 'Stagnant', dot: '🟢', neon: '#6ee7a0' },
  { id: 'sad', label: 'Sad', dot: '🔵', neon: '#4fa3ff' },
  { id: 'angry', label: 'Angry', dot: '🟣', neon: '#a78bfa' },
  { id: 'numb', label: 'Numb', dot: '⚪', neon: '#d4d4d8' },
  { id: 'exhausted', label: 'Exhausted', dot: '⚫', neon: '#71717a' },
];

const OVERLOAD_PROMPTS = {
  overwhelmed: 'What is the single highest-priority task? Break it into two steps.',
  anxious: 'What is the worst-case scenario, and is it actually probable?',
  frustrated: 'What specific factor is currently blocking the system?',
  stagnant: 'What is one action you can take to force a state change?',
  sad: 'What is the root cause? Is it a permanent error or a temporary glitch?',
  angry: 'What is the objective reality of this situation, stripped of emotion?',
  numb: 'What is the most efficient way to achieve system recovery (sleep, fuel, isolation)?',
  exhausted: 'What is the most efficient way to achieve system recovery (sleep, fuel, isolation)?',
};

const GLITCH_ERRORS = [
  '&gt; PANIC: thread.emotion blocked',
  '&gt; FAIL: rationalize.exe not responding',
  '&gt; DUMP: writing to /dev/offload',
  '&gt; WARN: cortisol levels critical',
  '&gt; ERR: sleep.schedule null pointer',
  '&gt; TRACE: suppressing output...',
  '&gt; INIT: safe_mode channel open',
];

const OverloadLog = {
  view: 'hub',
  editingId: null,
  cardFlips: 0,
  cardFlipTimer: null,
  returnView: 'profile',
  glitchTimer: null,

  onHeroCardFlip(){
    this.cardFlips++;
    clearTimeout(this.cardFlipTimer);
    if(this.cardFlips >= 5){
      this.cardFlips = 0;
      this.showGlitchIntro();
      return;
    }
    this.cardFlipTimer = setTimeout(() => { this.cardFlips = 0; }, 10000);
  },

  checkUrl(){
    const params = new URLSearchParams(location.search);
    if(params.get('overload') || params.get('mind')){
      history.replaceState({}, '', location.pathname);
      queueMicrotask(() => this.showGlitchIntro());
    }
  },

  showGlitchIntro(){
    const screen = document.getElementById('overloadGlitchScreen');
    if(!screen) { this.enterChannel(); return; }
    const feed = document.getElementById('oglErrorFeed');
    if(feed){
      feed.innerHTML = `
        <div class="ogl-err">&gt; ERR_MEM_STACK_OVERFLOW at 0x7FFE</div>
        <div class="ogl-err">&gt; WARN: affect.regulators offline</div>
        <div class="ogl-err">&gt; routing to offload channel...</div>`;
    }
    screen.classList.remove('hidden');
    screen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ogl-active');
    this.animateErrorFeed();
    clearTimeout(this.glitchTimer);
    this.glitchTimer = setTimeout(() => this.completeGlitchTransition(), 4200);
    document.getElementById('oglEnterBtn')?.focus();
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
      if(feed.children.length > 6) feed.removeChild(feed.firstChild);
      setTimeout(addErr, 380 + Math.random() * 200);
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

  enterChannel(){
    const active = document.querySelector('section.view.active');
    if(active && active.id !== 'view-mind') this.returnView = active.id.replace('view-', '') || 'profile';
    document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-mind')?.classList.add('active');
    document.querySelectorAll('.node-btn').forEach(b => b.classList.remove('active'));
    document.body.classList.add('mind-channel-open');
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
  },

  newLog(){
    this.view = 'form';
    this.editingId = null;
    this.render();
  },

  editLog(id){
    this.view = 'form';
    this.editingId = id;
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

  saveForm(){
    const title = document.getElementById('olTitle')?.value?.trim();
    const date = document.getElementById('olDate')?.value || todayKey();
    const rant = document.getElementById('olRant')?.value || '';
    const command = document.getElementById('olCommand')?.value?.trim() || '';
    const emotions = [...document.querySelectorAll('.ol-emotion-check:checked')].map(el => el.value);
    const diagnostics = {};
    document.querySelectorAll('[data-ol-prompt]').forEach(el => {
      const key = el.dataset.olPrompt;
      const val = el.value?.trim();
      if(val) diagnostics[key] = val;
    });
    if(!title){ alert('Add a title for this log.'); return; }

    this.ensureLogs();
    const payload = {
      id: this.editingId || ('ol-' + Date.now()),
      date,
      title,
      emotions,
      rant,
      diagnostics,
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
    this.view = 'hub';
    this.editingId = null;
    this.render();
    if(typeof renderAbout === 'function') renderAbout();
  },

  renderEmotionChecks(selected){
    return OVERLOAD_EMOTIONS.map(em => `
      <label class="ol-emotion sys-panel" style="--ole-neon:${em.neon}">
        <input type="checkbox" class="ol-emotion-check" value="${em.id}" ${selected?.includes(em.id) ? 'checked' : ''}>
        <span class="ol-emotion-dot">${em.dot}</span>
        <span>${em.label}</span>
      </label>`).join('');
  },

  renderPromptFields(selected){
    const ids = selected?.length ? selected : OVERLOAD_EMOTIONS.map(e => e.id);
    const seen = new Set();
    return ids.map(id => {
      if(seen.has(id) || !OVERLOAD_PROMPTS[id]) return '';
      seen.add(id);
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return `<div class="field ol-prompt-field sys-panel">
        <label>IF ${em?.label?.toUpperCase() || id.toUpperCase()}</label>
        <span class="field-hint">${OVERLOAD_PROMPTS[id]}</span>
        <textarea rows="2" data-ol-prompt="${id}" placeholder="Response…" class="sys-input"></textarea>
      </div>`;
    }).join('');
  },

  renderHub(){
    const logs = this.sortedLogs();
    return `
      <div class="mind-hub">
        <aside class="mind-hub-aside">
          <div class="mind-protocol-card sys-panel sys-corrupt">
            <h3>// SYSTEM OVERLOAD LOG</h3>
            <p>Raw dump protocol. No filter. No audience. Corrupted input accepted.</p>
            <ol class="mind-protocol-steps">
              <li>STATUS CHECK — select emotions</li>
              <li>RANT SECTION — unfiltered dump</li>
              <li>DIAGNOSTIC PROMPTS — parse errors</li>
              <li>TERMINAL COMMAND — one next move</li>
            </ol>
          </div>
          <div class="mind-stats-mini sys-flicker">
            <span>ARCHIVE: ${logs.length} logs</span>
            <span>CHANNEL: degraded · functional</span>
            <span>INDEX: hidden</span>
          </div>
        </aside>
        <main class="mind-hub-main sys-panel">
          <header class="ol-header">
            <div>
              <p class="ol-kicker sys-flicker">// offload_buffer</p>
              <h3 class="ol-title">OVERLOAD ARCHIVE</h3>
            </div>
            <button type="button" class="btn primary sys-btn" id="olNewBtn">+ NEW LOG</button>
          </header>
          <div class="ol-list">
            ${logs.length ? logs.map(log => {
              const emTags = (log.emotions || []).map(id => {
                const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
                return em ? `<span class="ol-tag" style="--olt-neon:${em.neon}">${em.dot} ${em.label}</span>` : '';
              }).join('');
              return `<article class="ol-card sys-panel" data-ol-id="${esc(log.id)}">
                <div class="ol-card-head">
                  <span class="ol-card-date">${esc(log.date || '')}</span>
                  <h4 class="ol-card-title">${esc(log.title || 'UNTITLED')}</h4>
                </div>
                <div class="ol-card-tags">${emTags}</div>
                <p class="ol-card-snippet">${esc((log.rant || '').slice(0, 160))}${(log.rant || '').length > 160 ? '…' : ''}</p>
                ${log.command ? `<p class="ol-card-cmd">&gt; ${esc(log.command)}</p>` : ''}
                <div class="ol-card-actions">
                  <button type="button" class="btn ol-open-btn" data-ol-open="${esc(log.id)}">OPEN</button>
                  <button type="button" class="btn ol-edit-btn" data-ol-edit="${esc(log.id)}">EDIT</button>
                  <button type="button" class="btn ol-del-btn" data-ol-del="${esc(log.id)}">DELETE</button>
                </div>
              </article>`;
            }).join('') : '<p class="ol-empty sys-flicker">// buffer empty — initiate new overload log when system spikes</p>'}
          </div>
        </main>
      </div>`;
  },

  renderForm(){
    const existing = this.editingId ? state.overloadLogs.find(l => l.id === this.editingId) : null;
    const selected = existing?.emotions || [];
    return `
      <div class="mind-form-wrap sys-panel">
        <header class="ol-header">
          <div>
            <p class="ol-kicker sys-flicker">// input_mode · write_enabled</p>
            <h3 class="ol-title">SYSTEM OVERLOAD LOG</h3>
          </div>
          <button type="button" class="btn" id="olBackHub">← ARCHIVE</button>
        </header>
        <form class="ol-form" id="olForm" onsubmit="return false">
          <div class="ol-form-grid">
            <div class="field"><label>DATE</label><input type="date" id="olDate" class="sys-input" value="${esc(existing?.date || todayKey())}"></div>
            <div class="field"><label>TITLE</label><input type="text" id="olTitle" class="sys-input" value="${esc(existing?.title || '')}" placeholder="Session title"></div>
          </div>
          <section class="ol-section sys-panel">
            <h4>STATUS CHECK: SELECT CURRENT EMOTIONS</h4>
            <p class="field-hint">Select all that apply</p>
            <div class="ol-emotion-grid" id="olEmotionGrid">${this.renderEmotionChecks(selected)}</div>
          </section>
          <section class="ol-section sys-panel">
            <h4>INPUT DATA: RANT SECTION</h4>
            <p class="field-hint">Raw dump. Do not edit, summarize, or worry about flow.</p>
            <textarea id="olRant" class="ol-rant sys-input" rows="10" placeholder="Dump everything here…">${esc(existing?.rant || '')}</textarea>
          </section>
          <section class="ol-section sys-panel" id="olPromptSection">
            <h4>DIAGNOSTIC PROMPTS</h4>
            <p class="field-hint">Answer based on emotions selected above</p>
            <div id="olPromptFields">${this.renderPromptFields(selected)}</div>
          </section>
          <section class="ol-section sys-panel">
            <h4>TERMINAL COMMAND: ACTION PLAN</h4>
            <p class="field-hint">One clear command for your next move</p>
            <div class="ol-command-wrap">
              <span class="ol-prompt-char">&gt;</span>
              <input type="text" id="olCommand" class="sys-input" value="${esc(existing?.command || '')}" placeholder="COMMAND HERE">
            </div>
          </section>
          <div class="modal-actions">
            <button type="button" class="btn" id="olCancelForm">CANCEL</button>
            <button type="button" class="btn primary sys-btn" id="olSaveForm">SAVE LOG</button>
          </div>
        </form>
      </div>`;
  },

  renderRead(){
    const log = state.overloadLogs.find(l => l.id === this.editingId);
    if(!log) return this.renderHub();
    const emTags = (log.emotions || []).map(id => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return em ? `<span class="ol-tag" style="--olt-neon:${em.neon}">${em.dot} ${em.label}</span>` : '';
    }).join('');
    const prompts = Object.entries(log.diagnostics || {}).map(([id, val]) => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return `<div class="ol-read-prompt sys-panel">
        <div class="ol-read-prompt-label">IF ${esc((em?.label || id).toUpperCase())}</div>
        <p>${esc(val)}</p>
      </div>`;
    }).join('');
    return `
      <div class="mind-form-wrap sys-panel">
        <header class="ol-header">
          <div>
            <p class="ol-kicker sys-flicker">// read_only</p>
            <h3 class="ol-title">${esc(log.title)}</h3>
            <p class="ol-sub">${esc(log.date || '')}</p>
          </div>
          <button type="button" class="btn" id="olBackHub">← ARCHIVE</button>
        </header>
        <article class="ol-read">
          <div class="ol-card-tags">${emTags}</div>
          <section class="ol-section sys-panel">
            <h4>INPUT DATA: RANT SECTION</h4>
            <pre class="ol-read-rant">${esc(log.rant || '')}</pre>
          </section>
          ${prompts ? `<section class="ol-section"><h4>DIAGNOSTIC PROMPTS</h4>${prompts}</section>` : ''}
          ${log.command ? `<section class="ol-section sys-panel"><h4>TERMINAL COMMAND</h4><p class="ol-read-cmd">&gt; ${esc(log.command)}</p></section>` : ''}
          <div class="modal-actions">
            <button type="button" class="btn" id="olEditCurrent">EDIT</button>
            <button type="button" class="btn ol-del-btn" data-ol-del="${esc(log.id)}">DELETE</button>
          </div>
        </article>
      </div>`;
  },

  render(){
    const root = document.getElementById('mindContent');
    if(!root) return;
    if(this.view === 'form') root.innerHTML = this.renderForm();
    else if(this.view === 'read') root.innerHTML = this.renderRead();
    else root.innerHTML = this.renderHub();

    const existing = this.editingId ? state.overloadLogs.find(l => l.id === this.editingId) : null;
    if(existing?.diagnostics){
      Object.entries(existing.diagnostics).forEach(([k, v]) => {
        const el = root.querySelector(`[data-ol-prompt="${k}"]`);
        if(el) el.value = v;
      });
    }

    root.querySelector('#olNewBtn')?.addEventListener('click', () => this.newLog());
    root.querySelector('#olBackHub')?.addEventListener('click', () => { this.view = 'hub'; this.editingId = null; this.render(); });
    root.querySelector('#olCancelForm')?.addEventListener('click', () => { this.view = 'hub'; this.editingId = null; this.render(); });
    root.querySelector('#olSaveForm')?.addEventListener('click', () => this.saveForm());
    root.querySelector('#olEditCurrent')?.addEventListener('click', () => { this.view = 'form'; this.render(); });

    root.querySelectorAll('[data-ol-open]').forEach(btn => {
      btn.addEventListener('click', () => this.viewLog(btn.dataset.olOpen));
    });
    root.querySelectorAll('[data-ol-edit]').forEach(btn => {
      btn.addEventListener('click', () => this.editLog(btn.dataset.olEdit));
    });
    root.querySelectorAll('[data-ol-del]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteLog(btn.dataset.olDel));
    });

    root.querySelector('#olEmotionGrid')?.addEventListener('change', () => {
      const selected = [...root.querySelectorAll('.ol-emotion-check:checked')].map(el => el.value);
      const fields = root.querySelector('#olPromptFields');
      if(fields) fields.innerHTML = this.renderPromptFields(selected);
    });
  },

  init(){
    this.checkUrl();
    this.ensureLogs();

    document.getElementById('oglEnterBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      this.completeGlitchTransition();
    });
    document.getElementById('overloadGlitchScreen')?.addEventListener('click', () => this.completeGlitchTransition());
    document.getElementById('mindExitBtn')?.addEventListener('click', () => this.exitChannel());
  },
};
