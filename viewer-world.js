/* ===== Viewer world — character wizard, quests, video diary ===== */

const VIEWER_SESSION_KEY = 'ga-viewer-character-id';
const VISITOR_WRITE_KEY = 'gray-areas-visitor';
const QUEST_XP_SUBMIT = 12;
const QUEST_XP_COMPLETE = 65;
const VIEWER_LEVEL_STEP = 100;

const QUEST_TYPES = [
  { id: 'visit', label: 'Visit a place', icon: '📍', neon: '#4ade80' },
  { id: 'food', label: 'Get food / drink', icon: '🍜', neon: '#fb923c' },
  { id: 'comfort', label: 'Comfort / cool me', icon: '♥', neon: '#f9a8d4' },
  { id: 'press', label: 'Write in The Press', icon: '▤', neon: '#f472b6' },
  { id: 'meetup', label: 'Meet up', icon: '👤', neon: '#a78bfa' },
  { id: 'other', label: 'Other quest', icon: '✦', neon: '#3ad6e0' },
];

const QUEST_STATUS = {
  submitted: { label: 'Submitted', neon: '#94a3b8' },
  accepted: { label: 'Accepted', neon: '#3ad6e0' },
  in_progress: { label: 'In progress', neon: '#fbbf24' },
  completed: { label: 'Completed', neon: '#4ade80' },
  declined: { label: 'Declined', neon: '#f87171' },
};

function ensureViewerState(){
  if(!state.viewerCharacters) state.viewerCharacters = [];
  if(!state.quests) state.quests = [];
  if(!state.videoDiary) state.videoDiary = [];
}

function getViewerSessionId(){
  try{
    let id = localStorage.getItem(VIEWER_SESSION_KEY);
    if(!id){
      id = 'viewer-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(VIEWER_SESSION_KEY, id);
    }
    return id;
  }catch(e){
    return 'viewer-anon';
  }
}

function getMyViewerCharacter(){
  ensureViewerState();
  const sid = getViewerSessionId();
  return state.viewerCharacters.find(c => c.sessionId === sid) || null;
}

function viewerLevelFromXp(xp){
  let level = 1;
  let remaining = xp || 0;
  while(remaining >= VIEWER_LEVEL_STEP * level){
    remaining -= VIEWER_LEVEL_STEP * level;
    level++;
  }
  return { level, progress: remaining / (VIEWER_LEVEL_STEP * level), xp: xp || 0 };
}

function mergeVisitorDataFile(remote){
  if(!remote) return;
  ensureViewerState();
  const mergeById = (arr, incoming, key = 'id') => {
    if(!Array.isArray(incoming)) return;
    incoming.forEach(item => {
      if(!item?.[key]) return;
      const i = arr.findIndex(x => x[key] === item[key]);
      if(i >= 0) arr[i] = { ...arr[i], ...item };
      else arr.push(item);
    });
  };
  mergeById(state.viewerCharacters, remote.viewerCharacters);
  mergeById(state.quests, remote.quests);
  mergeById(state.videoDiary, remote.videoDiary);
}

async function fetchVisitorData(){
  try{
    const res = await fetch('visitor-data.json?nocache=' + Date.now(), { cache: 'no-store' });
    if(!res.ok) return;
    mergeVisitorDataFile(await res.json());
    saveState();
    ViewerWorld.renderAll();
  }catch(e){}
}

async function postVisitorData(action, data){
  try{
    const res = await fetch('/api/visitor-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorKey: VISITOR_WRITE_KEY, action, data }),
    });
    return res.ok;
  }catch(e){
    return false;
  }
}

function buildViewerCardFromWizard(form){
  const strengths = (form.strengths || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  const weaknesses = (form.weaknesses || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  const abilities = strengths.slice(0, 2).map((name, i) => ({
    name,
    effect: i === 0 ? 'Core viewer trait.' : 'Secondary strength.',
  }));
  const moves = strengths.slice(2, 4).map(name => ({ name, effect: 'Unlocked through quests.' }));
  const weakName = weaknesses[0] || 'Overthinking';
  const resistName = form.resistance?.trim() || 'Kindness';
  const palette = [form.favoriteColor, form.skinColor, form.eyeColor].filter(Boolean).join(' · ');
  const accent = paletteToAccent(form.favoriteColor || '#38bdf8');

  return {
    id: uid('vchar'),
    sessionId: getViewerSessionId(),
    createdAt: new Date().toISOString(),
    locked: true,
    name: form.name.trim(),
    age: form.age?.trim() || '',
    mbti: form.mbti?.trim() || '',
    hackQuality: form.hackQuality?.trim() || '',
    skinColor: form.skinColor?.trim() || '',
    eyeColor: form.eyeColor?.trim() || '',
    favoriteColor: form.favoriteColor?.trim() || '',
    spiritAnimal: form.spiritAnimal?.trim() || '',
    strengths: form.strengths?.trim() || '',
    weaknesses: form.weaknesses?.trim() || '',
    resistance: form.resistance?.trim() || '',
    vibe: form.vibe?.trim() || 'Quest-giver on the Gray Areas board.',
    quote: form.quote?.trim() || 'Sent a quest into Shenzhen.',
    xp: 0,
    fire: 0,
    questsSent: 0,
    questsCompleted: 0,
    cardColor: accent,
    pokeCard: {
      level: 1,
      mbti: form.mbti?.trim() || '',
      spiritPrompt: form.spiritAnimal?.trim() || '',
      colorPalette: palette,
      vibe: form.vibe?.trim() || 'Viewer · quest broker',
      subtitle: 'Viewer character',
      abilities: abilities.length ? abilities : [{ name: 'Curiosity', effect: 'Spots missions for Gray.' }],
      moves: moves.length ? moves : [{ name: 'Signal flare', effect: 'Sends a quest into the board.' }],
      weakness: { name: weakName, effect: weaknesses[1] || 'Can spiral when quests stall.' },
      resistance: { name: resistName, effect: 'Bounces back when Gray completes a mission.' },
      retreatCost: '1',
      quote: form.quote?.trim() || '"I am in the transmission."',
      cardColor: accent,
    },
    cardDescription: `Hack quality: ${form.hackQuality || '—'}. Skin: ${form.skinColor || '—'}. Eyes: ${form.eyeColor || '—'}.`,
  };
}

function awardViewerXp(characterId, amount, reason){
  ensureViewerState();
  const c = state.viewerCharacters.find(x => x.id === characterId);
  if(!c || !amount) return;
  c.xp = (c.xp || 0) + amount;
  c.fire = (c.fire || 0) + Math.max(1, Math.round(amount / 8));
  const lvl = viewerLevelFromXp(c.xp);
  if(c.pokeCard) c.pokeCard.level = lvl.level;
  if(reason === 'quest_complete') c.questsCompleted = (c.questsCompleted || 0) + 1;
  saveState();
}

function captionsToVtt(text){
  const chunks = (text || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  if(!chunks.length) return '';
  const pad = n => String(Math.floor(n / 3600)).padStart(2, '0') + ':' +
    String(Math.floor((n % 3600) / 60)).padStart(2, '0') + ':' +
    String(Math.floor(n % 60)).padStart(2, '0') + '.000';
  let body = 'WEBVTT\n\n';
  chunks.forEach((line, i) => {
    body += `${i + 1}\n${pad(i * 4)} --> ${pad((i + 1) * 4)}\n${line}\n\n`;
  });
  return body;
}

const ViewerWorld = {
  inited: false,
  pendingVlogFile: null,

  init(){
    if(this.inited) return;
    this.inited = true;
    ensureViewerState();
    fetchVisitorData();
  },

  renderAll(){
    this.renderViewerCard();
    this.renderQuests();
    this.renderVlog();
  },

  renderViewerCard(){
    const host = document.getElementById('viewerCardSpread');
    if(!host) return;
    const mine = getMyViewerCharacter();

    if(mine){
      const lvl = viewerLevelFromXp(mine.xp);
      host.innerHTML = `
        <div class="viewer-card-hero">
          <div class="viewer-fire-badge" style="--vfb-neon:${mine.cardColor || '#38bdf8'}">
            <span class="viewer-fire-icon">🔥</span>
            <span class="viewer-fire-val">${mine.fire || 0}</span>
            <span class="viewer-fire-label">fire</span>
          </div>
          <div class="viewer-level-pill">Lv ${lvl.level} · ${mine.xp || 0} XP</div>
        </div>
        <div class="viewer-card-deck">${typeof buildFlipPlayerCard === 'function'
          ? buildFlipPlayerCard(mine, 'character', 0, { accent: mine.cardColor })
          : `<p>${esc(mine.name)}</p>`}</div>
        <div class="viewer-card-stats sketch-card">
          <div class="vcs-row"><span>Quests sent</span><strong>${mine.questsSent || 0}</strong></div>
          <div class="vcs-row"><span>Completed by Gray</span><strong>${mine.questsCompleted || 0}</strong></div>
          <p class="field-hint">Your card is sealed — Gray can edit it from player mode. Level up by sending quests and having them completed.</p>
        </div>`;
      bindFlipPlayerCards(host);
      return;
    }

    host.innerHTML = `
      <div class="viewer-wizard sketch-card">
        <h3 class="viewer-wizard-title">Create your character</h3>
        <p class="field-hint">Fill the template once. Your card generates automatically and locks.</p>
        <form id="viewerCardForm" class="viewer-wizard-form">
          <div class="field-row">
            <div class="field"><label>Name</label><input type="text" id="vwName" required placeholder="your handle"></div>
            <div class="field"><label>Age</label><input type="text" id="vwAge" placeholder="optional"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>MBTI</label><input type="text" id="vwMbti" placeholder="e.g. INFP"></div>
            <div class="field"><label>Hack quality</label><input type="text" id="vwHack" placeholder="your glitch stat"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Skin colour</label><input type="text" id="vwSkin" placeholder="e.g. warm brown"></div>
            <div class="field"><label>Eye colour</label><input type="text" id="vwEyes" placeholder="e.g. dark hazel"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Favourite colour</label><input type="text" id="vwFavColor" placeholder="neon cyan"></div>
            <div class="field"><label>Spirit animal</label><input type="text" id="vwSpirit" placeholder="e.g. heron"></div>
          </div>
          <div class="field"><label>Strengths</label><textarea id="vwStrengths" rows="2" placeholder="comma-separated"></textarea></div>
          <div class="field"><label>Weaknesses</label><textarea id="vwWeaknesses" rows="2" placeholder="comma-separated"></textarea></div>
          <div class="field"><label>Resistant to</label><input type="text" id="vwResistance" placeholder="e.g. cynicism"></div>
          <div class="field"><label>Vibe / quote</label><input type="text" id="vwQuote" placeholder="one line your card remembers"></div>
          <button type="submit" class="btn primary">Generate my card</button>
        </form>
      </div>`;
    document.getElementById('viewerCardForm')?.addEventListener('submit', e => {
      e.preventDefault();
      this.submitCharacterWizard();
    });
  },

  async submitCharacterWizard(){
    if(getMyViewerCharacter()){
      alert('You already have a character on this device.');
      return;
    }
    const form = {
      name: document.getElementById('vwName')?.value,
      age: document.getElementById('vwAge')?.value,
      mbti: document.getElementById('vwMbti')?.value,
      hackQuality: document.getElementById('vwHack')?.value,
      skinColor: document.getElementById('vwSkin')?.value,
      eyeColor: document.getElementById('vwEyes')?.value,
      favoriteColor: document.getElementById('vwFavColor')?.value,
      spiritAnimal: document.getElementById('vwSpirit')?.value,
      strengths: document.getElementById('vwStrengths')?.value,
      weaknesses: document.getElementById('vwWeaknesses')?.value,
      resistance: document.getElementById('vwResistance')?.value,
      quote: document.getElementById('vwQuote')?.value,
      vibe: document.getElementById('vwQuote')?.value,
    };
    if(!form.name?.trim()){
      alert('Name is required.');
      return;
    }
    const card = buildViewerCardFromWizard(form);
    state.viewerCharacters.push(card);
    saveState();
    const synced = await postVisitorData('createCharacter', card);
    this.renderViewerCard();
    if(!synced) alert('Card saved here — server sync will catch up when configured.');
    else fetchVisitorData();
  },

  renderQuests(){
    const host = document.getElementById('questSpread');
    if(!host) return;
    const mine = getMyViewerCharacter();
    const myOnly = (state.quests || []).filter(q => !mine || q.fromCharacterId === mine.id);

    const typeOpts = QUEST_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('');
    let html = '';

    if(isAdmin()){
      html += `<div class="quest-inbox sketch-card">
        <h3 class="viewer-wizard-title">Quest inbox</h3>
        <p class="field-hint">${(state.quests || []).filter(q => q.status === 'submitted' || q.status === 'accepted').length} waiting on you</p>
      </div>`;
    }

    if(mine){
      html += `
        <div class="quest-compose sketch-card">
          <h3 class="viewer-wizard-title">Send Gray a quest</h3>
          <p class="field-hint">From <strong>${esc(mine.name)}</strong></p>
          <form id="questForm">
            <div class="field-row">
              <div class="field"><label>Quest type</label><select id="questType">${typeOpts}</select></div>
              <div class="field"><label>Title</label><input type="text" id="questTitle" required></div>
            </div>
            <div class="field"><label>Mission details</label><textarea id="questBody" rows="4" required></textarea></div>
            <div class="field-row">
              <div class="field"><label>Place (optional)</label><input type="text" id="questPlace"></div>
              <div class="field"><label>Food / item (optional)</label><input type="text" id="questFood"></div>
            </div>
            <button type="submit" class="btn primary">Transmit quest</button>
          </form>
        </div>`;
    } else if(!isAdmin()){
      html += `<p class="empty-hint">Create your character first to send quests.</p>`;
    }

    const list = (isAdmin() ? state.quests : myOnly).slice().reverse();
    html += `<div class="quest-list-wrap"><h3 class="viewer-wizard-title">${isAdmin() ? 'All quests' : 'Your quests'}</h3>`;
    html += list.length ? `<div class="quest-list">${list.map(q => this.questRowHtml(q)).join('')}</div>` : `<p class="empty-hint">No quests yet.</p>`;
    html += `</div>`;
    host.innerHTML = html;

    document.getElementById('questForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitQuest(); });
    host.querySelectorAll('[data-quest-action]').forEach(btn => {
      btn.addEventListener('click', () => this.handleQuestAction(btn.dataset.questId, btn.dataset.questAction));
    });
  },

  questRowHtml(q){
    const st = QUEST_STATUS[q.status] || QUEST_STATUS.submitted;
    const type = QUEST_TYPES.find(t => t.id === q.type) || QUEST_TYPES[5];
    return `<article class="quest-card" style="--qc-neon:${type.neon}">
      <header class="quest-card-head">
        <span class="quest-type">${type.icon} ${type.label}</span>
        <span class="quest-status" style="--qs-neon:${st.neon}">${st.label}</span>
      </header>
      <h4 class="quest-title">${esc(q.title)}</h4>
      <p class="quest-from">From <strong>${esc(q.fromName || 'Anonymous')}</strong></p>
      <p class="quest-body">${esc(q.body)}</p>
      ${q.place ? `<p class="quest-meta">📍 ${esc(q.place)}</p>` : ''}
      ${q.food ? `<p class="quest-meta">🍜 ${esc(q.food)}</p>` : ''}
      ${q.playerNote ? `<p class="quest-note">Gray: ${esc(q.playerNote)}</p>` : ''}
      ${isAdmin() && q.status !== 'completed' && q.status !== 'declined' ? `
        <div class="quest-actions">
          ${q.status === 'submitted' ? `<button type="button" class="btn" data-quest-id="${esc(q.id)}" data-quest-action="accept">Accept</button>` : ''}
          <button type="button" class="btn primary" data-quest-id="${esc(q.id)}" data-quest-action="complete">Complete</button>
          <button type="button" class="btn" data-quest-id="${esc(q.id)}" data-quest-action="decline">Decline</button>
        </div>` : ''}
    </article>`;
  },

  async submitQuest(){
    const mine = getMyViewerCharacter();
    if(!mine){ alert('Create your character first.'); navigateToView('viewer-card'); return; }
    const quest = {
      id: uid('quest'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fromCharacterId: mine.id,
      fromName: mine.name,
      type: document.getElementById('questType')?.value || 'other',
      title: document.getElementById('questTitle')?.value?.trim(),
      body: document.getElementById('questBody')?.value?.trim(),
      place: document.getElementById('questPlace')?.value?.trim() || '',
      food: document.getElementById('questFood')?.value?.trim() || '',
      status: 'submitted',
    };
    if(!quest.title || !quest.body) return;
    state.quests.push(quest);
    mine.questsSent = (mine.questsSent || 0) + 1;
    awardViewerXp(mine.id, QUEST_XP_SUBMIT, 'quest_submit');
    saveState();
    await postVisitorData('submitQuest', quest);
    document.getElementById('questForm')?.reset();
    this.renderQuests();
  },

  handleQuestAction(questId, action){
    if(!isAdmin()) return;
    const q = state.quests.find(x => x.id === questId);
    if(!q) return;
    if(action === 'accept') q.status = 'accepted';
    else if(action === 'complete'){
      q.status = 'completed';
      q.playerNote = prompt('Note for viewer (optional):') || '';
      q.completedAt = new Date().toISOString();
      awardViewerXp(q.fromCharacterId, QUEST_XP_COMPLETE, 'quest_complete');
    } else if(action === 'decline'){
      q.status = 'declined';
      q.playerNote = prompt('Reason (optional):') || '';
    }
    q.updatedAt = new Date().toISOString();
    saveState();
    this.renderQuests();
  },

  renderVlog(){
    const host = document.getElementById('vlogSpread');
    if(!host) return;
    const entries = (state.videoDiary || []).slice().reverse();
    let html = '';

    if(isAdmin()){
      html += `
        <div class="vlog-upload sketch-card">
          <h3 class="viewer-wizard-title">Upload video note</h3>
          <form id="vlogUploadForm">
            <div class="field-row">
              <div class="field"><label>Title</label><input type="text" id="vlogTitle" required></div>
              <div class="field"><label>Date</label><input type="date" id="vlogDate" value="${todayKey()}"></div>
            </div>
            <div class="field"><label>Video URL</label><input type="url" id="vlogUrl" placeholder="https://…"></div>
            <div class="field"><label>Short clip upload (&lt; 4MB)</label><input type="file" id="vlogVideoFile" accept="video/*"></div>
            <div class="field"><label>English captions</label><textarea id="vlogCaptions" rows="5" placeholder="One line per subtitle…"></textarea></div>
            <div class="field"><label>Notes</label><textarea id="vlogNotes" rows="2"></textarea></div>
            <button type="submit" class="btn primary">Publish</button>
          </form>
        </div>`;
    }

    html += entries.length
      ? `<div class="vlog-grid">${entries.map(v => this.vlogEntryHtml(v)).join('')}</div>`
      : `<p class="empty-hint">No video notes yet.</p>`;
    host.innerHTML = html;

    document.getElementById('vlogUploadForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitVlog(); });
    document.getElementById('vlogVideoFile')?.addEventListener('change', e => { this.pendingVlogFile = e.target.files?.[0] || null; });
    host.querySelectorAll('.vlog-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if(!confirm('Delete?')) return;
        state.videoDiary = state.videoDiary.filter(v => v.id !== btn.dataset.vlogId);
        saveState();
        this.renderVlog();
      });
    });
  },

  vlogEntryHtml(v){
    const src = v.videoUrl || v.videoData || '';
    const vtt = captionsToVtt(v.captions || '');
    if(vtt) window['vttBlob_' + v.id] = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    const trackSrc = window['vttBlob_' + v.id] || '';
    return `<article class="vlog-entry sketch-card">
      <header class="vlog-entry-head"><h4>${esc(v.title)}</h4><time>${fmtDateLong(v.date || todayKey())}</time></header>
      ${src ? `<video class="vlog-player" controls playsinline src="${esc(src)}">${trackSrc ? `<track kind="captions" srclang="en" label="English" src="${trackSrc}" default>` : ''}</video>` : ''}
      ${v.notes ? `<p class="vlog-notes">${esc(v.notes)}</p>` : ''}
      ${isAdmin() ? `<button type="button" class="btn admin-delete vlog-delete" data-vlog-id="${esc(v.id)}">Delete</button>` : ''}
    </article>`;
  },

  async submitVlog(){
    if(!isAdmin()) return;
    const title = document.getElementById('vlogTitle')?.value?.trim();
    const videoUrl = document.getElementById('vlogUrl')?.value?.trim() || '';
    let videoData = '';
    if(this.pendingVlogFile){
      if(this.pendingVlogFile.size > 4 * 1024 * 1024){ alert('Max 4MB — use a URL for longer clips.'); return; }
      videoData = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(this.pendingVlogFile);
      });
    }
    if(!videoUrl && !videoData){ alert('Add URL or clip.'); return; }
    state.videoDiary.push({
      id: uid('vlog'),
      createdAt: new Date().toISOString(),
      title,
      date: document.getElementById('vlogDate')?.value || todayKey(),
      videoUrl, videoData,
      captions: document.getElementById('vlogCaptions')?.value?.trim() || '',
      notes: document.getElementById('vlogNotes')?.value?.trim() || '',
    });
    saveState();
    this.pendingVlogFile = null;
    document.getElementById('vlogUploadForm')?.reset();
    this.renderVlog();
  },
};
