/* ===== System Overload Log — private worry diary ===== */

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

const OverloadLog = {
  view: 'list',
  editingId: null,
  cardFlips: 0,
  cardFlipTimer: null,

  isUnlocked(){
    return sessionStorage.getItem('ga-overload') === '1';
  },

  unlock(){
    sessionStorage.setItem('ga-overload', '1');
  },

  checkUrl(){
    const key = new URLSearchParams(location.search).get('overload');
    if(key && key === OVERLOAD_KEY){
      this.unlock();
      history.replaceState({}, '', location.pathname);
      queueMicrotask(() => this.open());
    }
  },

  ensureLogs(){
    if(!Array.isArray(state.overloadLogs)) state.overloadLogs = [];
  },

  sortedLogs(){
    this.ensureLogs();
    return [...state.overloadLogs].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  requestAccess(){
    if(this.isUnlocked()){ this.open(); return; }
    document.getElementById('overloadAuthBack')?.classList.remove('hidden');
    document.getElementById('overloadKeyInput')?.focus();
  },

  tryUnlock(){
    const input = document.getElementById('overloadKeyInput');
    if(input?.value === OVERLOAD_KEY){
      this.unlock();
      document.getElementById('overloadAuthBack')?.classList.add('hidden');
      input.value = '';
      this.open();
      return true;
    }
    alert('Wrong passcode.');
    return false;
  },

  open(){
    if(!this.isUnlocked()){ this.requestAccess(); return; }
    this.view = 'list';
    this.editingId = null;
    document.getElementById('overloadBack')?.classList.remove('hidden');
    this.render();
  },

  close(){
    document.getElementById('overloadBack')?.classList.add('hidden');
    this.view = 'list';
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
    this.view = 'list';
    this.editingId = null;
    this.render();
    renderAbout();
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
    this.view = 'list';
    this.editingId = null;
    this.render();
    renderAbout();
  },

  renderEmotionChecks(selected){
    return OVERLOAD_EMOTIONS.map(em => `
      <label class="ol-emotion" style="--ole-neon:${em.neon}">
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
      return `<div class="field ol-prompt-field">
        <label>IF ${em?.label?.toUpperCase() || id.toUpperCase()}</label>
        <span class="field-hint">${OVERLOAD_PROMPTS[id]}</span>
        <textarea rows="2" data-ol-prompt="${id}" placeholder="Response…"></textarea>
      </div>`;
    }).join('');
  },

  renderList(){
    const logs = this.sortedLogs();
    return `
      <header class="ol-header">
        <div>
          <p class="ol-kicker">// private channel</p>
          <h2 class="ol-title">SYSTEM OVERLOAD LOG</h2>
          <p class="ol-sub">Offload raw data. No audience. Terminal format.</p>
        </div>
        <button type="button" class="btn primary" id="olNewBtn">+ New log</button>
      </header>
      <div class="ol-list">
        ${logs.length ? logs.map(log => {
          const emTags = (log.emotions || []).map(id => {
            const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
            return em ? `<span class="ol-tag" style="--olt-neon:${em.neon}">${em.dot} ${em.label}</span>` : '';
          }).join('');
          return `<article class="ol-card" data-ol-id="${esc(log.id)}">
            <div class="ol-card-head">
              <span class="ol-card-date">${esc(log.date || '')}</span>
              <h3 class="ol-card-title">${esc(log.title || 'Untitled')}</h3>
            </div>
            <div class="ol-card-tags">${emTags}</div>
            <p class="ol-card-snippet">${esc((log.rant || '').slice(0, 120))}${(log.rant || '').length > 120 ? '…' : ''}</p>
            ${log.command ? `<p class="ol-card-cmd">&gt; ${esc(log.command)}</p>` : ''}
            <div class="ol-card-actions">
              <button type="button" class="btn ol-open-btn" data-ol-open="${esc(log.id)}">Open</button>
              <button type="button" class="btn ol-edit-btn" data-ol-edit="${esc(log.id)}">Edit</button>
              <button type="button" class="btn ol-del-btn" data-ol-del="${esc(log.id)}">Delete</button>
            </div>
          </article>`;
        }).join('') : '<p class="ol-empty">No logs yet. Start a new overload entry when the system spikes.</p>'}
      </div>`;
  },

  renderForm(){
    const existing = this.editingId ? state.overloadLogs.find(l => l.id === this.editingId) : null;
    const selected = existing?.emotions || [];
    return `
      <header class="ol-header">
        <div>
          <p class="ol-kicker">// input mode</p>
          <h2 class="ol-title">SYSTEM OVERLOAD LOG</h2>
        </div>
        <button type="button" class="btn" id="olBackList">← Archive</button>
      </header>
      <form class="ol-form" id="olForm" onsubmit="return false">
        <div class="ol-form-grid">
          <div class="field"><label>DATE</label><input type="date" id="olDate" value="${esc(existing?.date || todayKey())}"></div>
          <div class="field"><label>TITLE</label><input type="text" id="olTitle" value="${esc(existing?.title || '')}" placeholder="Session title"></div>
        </div>
        <section class="ol-section">
          <h3>STATUS CHECK: SELECT CURRENT EMOTIONS</h3>
          <p class="field-hint">Select all that apply</p>
          <div class="ol-emotion-grid" id="olEmotionGrid">${this.renderEmotionChecks(selected)}</div>
        </section>
        <section class="ol-section">
          <h3>INPUT DATA: RANT SECTION</h3>
          <p class="field-hint">Raw dump. Do not edit, summarize, or worry about flow.</p>
          <textarea id="olRant" class="ol-rant" rows="8" placeholder="Dump everything here…">${esc(existing?.rant || '')}</textarea>
        </section>
        <section class="ol-section" id="olPromptSection">
          <h3>DIAGNOSTIC PROMPTS</h3>
          <p class="field-hint">Answer based on emotions selected above</p>
          <div id="olPromptFields">${this.renderPromptFields(selected)}</div>
        </section>
        <section class="ol-section">
          <h3>TERMINAL COMMAND: ACTION PLAN</h3>
          <p class="field-hint">One clear command for your next move</p>
          <div class="ol-command-wrap">
            <span class="ol-prompt-char">&gt;</span>
            <input type="text" id="olCommand" value="${esc(existing?.command || '')}" placeholder="COMMAND HERE">
          </div>
        </section>
        <div class="modal-actions">
          <button type="button" class="btn" id="olCancelForm">Cancel</button>
          <button type="button" class="btn primary" id="olSaveForm">Save log</button>
        </div>
      </form>`;
  },

  renderRead(){
    const log = state.overloadLogs.find(l => l.id === this.editingId);
    if(!log) return this.renderList();
    const emTags = (log.emotions || []).map(id => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return em ? `<span class="ol-tag" style="--olt-neon:${em.neon}">${em.dot} ${em.label}</span>` : '';
    }).join('');
    const prompts = Object.entries(log.diagnostics || {}).map(([id, val]) => {
      const em = OVERLOAD_EMOTIONS.find(e => e.id === id);
      return `<div class="ol-read-prompt">
        <div class="ol-read-prompt-label">IF ${esc((em?.label || id).toUpperCase())}</div>
        <p>${esc(val)}</p>
      </div>`;
    }).join('');
    return `
      <header class="ol-header">
        <div>
          <p class="ol-kicker">// read-only</p>
          <h2 class="ol-title">${esc(log.title)}</h2>
          <p class="ol-sub">${esc(log.date || '')}</p>
        </div>
        <button type="button" class="btn" id="olBackList">← Archive</button>
      </header>
      <article class="ol-read">
        <div class="ol-card-tags">${emTags}</div>
        <section class="ol-section">
          <h3>INPUT DATA: RANT SECTION</h3>
          <pre class="ol-read-rant">${esc(log.rant || '')}</pre>
        </section>
        ${prompts ? `<section class="ol-section"><h3>DIAGNOSTIC PROMPTS</h3>${prompts}</section>` : ''}
        ${log.command ? `<section class="ol-section"><h3>TERMINAL COMMAND</h3><p class="ol-read-cmd">&gt; ${esc(log.command)}</p></section>` : ''}
        <div class="modal-actions">
          <button type="button" class="btn" id="olEditCurrent">Edit</button>
          <button type="button" class="btn ol-del-btn" data-ol-del="${esc(log.id)}">Delete</button>
        </div>
      </article>`;
  },

  render(){
    const root = document.getElementById('overloadContent');
    if(!root) return;
    if(this.view === 'form') root.innerHTML = this.renderForm();
    else if(this.view === 'read') root.innerHTML = this.renderRead();
    else root.innerHTML = this.renderList();

    const existing = this.editingId ? state.overloadLogs.find(l => l.id === this.editingId) : null;
    if(existing?.diagnostics){
      Object.entries(existing.diagnostics).forEach(([k, v]) => {
        const el = root.querySelector(`[data-ol-prompt="${k}"]`);
        if(el) el.value = v;
      });
    }

    root.querySelector('#olNewBtn')?.addEventListener('click', () => this.newLog());
    root.querySelector('#olBackList')?.addEventListener('click', () => { this.view = 'list'; this.editingId = null; this.render(); });
    root.querySelector('#olCancelForm')?.addEventListener('click', () => { this.view = 'list'; this.editingId = null; this.render(); });
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

  bindProfileCardEgg(container){
    if(!container || container._olCardEgg) return;
    container._olCardEgg = true;
    container.addEventListener('click', e => {
      if(e.target.closest('.flip-edit-btn, .card-edit-front, .flip-del-btn')) return;
      const fig = e.target.closest('.player-card-hero.poke-flip');
      if(!fig || !container.contains(fig)) return;
      this.cardFlips++;
      clearTimeout(this.cardFlipTimer);
      if(this.cardFlips >= 5){
        this.cardFlips = 0;
        this.requestAccess();
        return;
      }
      this.cardFlipTimer = setTimeout(() => { this.cardFlips = 0; }, 2000);
    });
  },

  init(){
    this.checkUrl();
    this.ensureLogs();

    document.getElementById('overloadPort')?.addEventListener('click', () => this.requestAccess());
    document.getElementById('closeOverload')?.addEventListener('click', () => this.close());
    document.getElementById('cancelOverloadAuth')?.addEventListener('click', () => {
      document.getElementById('overloadAuthBack')?.classList.add('hidden');
      document.getElementById('overloadKeyInput').value = '';
    });
    document.getElementById('confirmOverloadAuth')?.addEventListener('click', () => this.tryUnlock());
    document.getElementById('overloadKeyInput')?.addEventListener('keydown', e => {
      if(e.key === 'Enter') this.tryUnlock();
    });
    document.getElementById('overloadBack')?.addEventListener('click', e => {
      if(e.target.id === 'overloadBack') this.close();
    });
  },
};
