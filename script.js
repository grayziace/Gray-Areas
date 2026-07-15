/* ===== Gray Areas: Project Shenzhen — app logic ===== */

const STORAGE_KEY = 'gray-areas-shenzhen-v2';

const ZONES = [
  'Futian CBD', 'Nanshan', 'OCT Loft', 'Shekou Sea World',
  'Lianhuashan Park', 'Coco Park', 'Dongmen', 'Talent Park'
];

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return Object.assign(defaultState(), JSON.parse(raw));
  }catch(e){}
  return defaultState();
}

function defaultState(){
  return {
    entries: {},
    unlockedZones: [],
    characters: [],
    dramas: [],
    mandarinPct: 0,
    bio: '',
    messages: [
      {who:'Home', text:'Made it to the flat okay? Send word when you can.'}
    ]
  };
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

let state = loadState();

/* ---------- Loading sequence: UK -> Shenzhen ---------- */
(function loadingSequence(){
  const el = document.getElementById('loading');
  const label = document.getElementById('loadingLabel');
  const title = document.getElementById('loadingTitle');
  const skip = document.getElementById('skipLoading');

  function finish(){
    el.classList.add('hidden');
    setTimeout(()=> el.remove(), 900);
  }

  skip.addEventListener('click', finish);

  setTimeout(()=>{
    el.classList.add('phase-flight');
    label.textContent = 'In transit';
    title.textContent = 'UK → Shenzhen';
  }, 1700);

  setTimeout(()=>{
    el.classList.add('phase-shenzhen');
    label.textContent = 'Shenzhen';
    title.textContent = 'System online';
  }, 3600);

  setTimeout(finish, 5200);
})();

/* ---------- Node navigation ---------- */
document.getElementById('tabs').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-view]');
  if(!btn) return;
  document.querySelectorAll('.node-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('section.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-' + btn.dataset.view).classList.add('active');
});

/* ---------- Helpers ---------- */
function fmtDate(key){
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
}

function last7Entries(){
  return Object.entries(state.entries).filter(([key])=>{
    const d = (new Date() - new Date(key+'T00:00:00')) / 86400000;
    return d >= 0 && d < 7;
  });
}

/* ---------- Player Profile ---------- */
function renderProfile(){
  const totalDays = Object.keys(state.entries).length;
  const level = Math.floor(totalDays / 5) + 1;
  document.getElementById('profileRank').textContent = `Level ${level} explorer`;
  document.getElementById('profileStats').textContent =
    `${totalDays} days logged · ${state.unlockedZones.length} zones unlocked · ${state.characters.length} characters met`;
  document.getElementById('profileBio').value = state.bio || '';

  const last7 = last7Entries();
  const totalSteps = last7.reduce((s,[,e])=> s + (Number(e.steps)||0), 0);
  const avgMood = last7.length ? Math.round(last7.reduce((s,[,e])=> s + (Number(e.mood)||0),0) / last7.length) : 0;

  document.getElementById('profileMoodLabel').textContent = avgMood ? (avgMood + '/10') : '—';
  document.getElementById('profileMoodFill').style.width = (avgMood*10) + '%';
  document.getElementById('profileStepsLabel').textContent = totalSteps.toLocaleString();
  document.getElementById('profileStepsFill').style.width = Math.min(100,(totalSteps/70000)*100) + '%';
  document.getElementById('profileMandarinLabel').textContent = state.mandarinPct + '%';
  document.getElementById('profileMandarinFill').style.width = state.mandarinPct + '%';
}

document.getElementById('saveBio').addEventListener('click', ()=>{
  state.bio = document.getElementById('profileBio').value;
  saveState();
});

/* ---------- The Relay ---------- */
function renderSyncStation(){
  const ticker = document.getElementById('discoveryTicker');
  const entries = Object.entries(state.entries).sort((a,b)=> b[0].localeCompare(a[0])).slice(0,5);
  if(entries.length === 0){
    ticker.innerHTML = '<div class="empty-hint">Nothing logged yet — the story starts with your first entry in the Chronos Ledger.</div>';
  } else {
    ticker.innerHTML = entries.map(([key, e])=>{
      let bits = [];
      if(e.zone) bits.push(`unlocked ${e.zone}`);
      if(e.person) bits.push(`met ${e.person}`);
      if(e.hobby) bits.push(`practiced ${e.hobby}`);
      const text = bits.length ? bits.join(' · ') : 'logged a quiet day';
      return `<div class="ticker-row"><span class="dot"></span><span>Gray ${text}</span><span class="when">${fmtDate(key)}</span></div>`;
    }).join('');
  }

  const last7 = last7Entries();
  const totalSteps = last7.reduce((s,[,e])=> s + (Number(e.steps)||0), 0);
  const avgMood = last7.length ? Math.round(last7.reduce((s,[,e])=> s + (Number(e.mood)||0),0) / last7.length) : 7;

  document.getElementById('stepsLabel').textContent = totalSteps.toLocaleString();
  document.getElementById('stepsFill').style.width = Math.min(100, (totalSteps/70000)*100) + '%';
  document.getElementById('moodLabel').textContent = avgMood >= 8 ? 'Thriving' : avgMood >= 5 ? 'Good' : 'Low';
  document.getElementById('moodFill').style.width = (avgMood*10) + '%';

  const bell = document.getElementById('bellText');
  if(state.characters.length){
    const last = state.characters[state.characters.length-1];
    bell.textContent = `New character added: ${last.name} (${last.charClass || 'data pending'})`;
  }
}

/* ---------- Chronos Ledger ---------- */
let modalDateKey = null;

function renderLedger(){
  const grid = document.getElementById('monthGrid');
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  document.getElementById('monthLabel').textContent =
    now.toLocaleDateString(undefined, {month:'long', year:'numeric'});

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  let html = '';
  for(let i=0;i<firstDay;i++) html += '<div class="day-node empty"></div>';
  for(let d=1; d<=daysInMonth; d++){
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const logged = !!state.entries[key];
    html += `<div class="day-node ${logged?'logged':''}" data-key="${key}">${d}</div>`;
  }
  grid.innerHTML = html;

  grid.querySelectorAll('.day-node[data-key]').forEach(node=>{
    node.addEventListener('click', ()=> openDayModal(node.dataset.key));
  });
}

function openDayModal(key){
  modalDateKey = key;
  const e = state.entries[key] || {};
  document.getElementById('dayModalTitle').textContent = 'Log ' + fmtDate(key);
  document.getElementById('logMood').value = e.mood || 7;
  document.getElementById('logSteps').value = e.steps || 0;
  document.getElementById('logPerson').value = e.person || '';
  document.getElementById('logHobby').value = e.hobby || '';
  document.getElementById('logThoughts').value = e.thoughts || '';

  const zoneSelect = document.getElementById('logZone');
  zoneSelect.innerHTML = '<option value="">— none today —</option>' +
    ZONES.filter(z => !state.unlockedZones.includes(z))
      .map(z=>`<option value="${z}">${z}</option>`).join('');
  zoneSelect.value = e.zone || '';

  document.getElementById('dayModalBack').classList.remove('hidden');
}

document.getElementById('cancelLog').addEventListener('click', ()=>{
  document.getElementById('dayModalBack').classList.add('hidden');
});

document.getElementById('saveLog').addEventListener('click', ()=>{
  const zone = document.getElementById('logZone').value;
  state.entries[modalDateKey] = {
    mood: document.getElementById('logMood').value,
    steps: document.getElementById('logSteps').value,
    zone,
    person: document.getElementById('logPerson').value,
    hobby: document.getElementById('logHobby').value,
    thoughts: document.getElementById('logThoughts').value,
  };
  if(zone && !state.unlockedZones.includes(zone)) state.unlockedZones.push(zone);
  saveState();
  document.getElementById('dayModalBack').classList.add('hidden');
  renderAll();
});

/* ---------- The Grid ---------- */
function renderAtlas(){
  const grid = document.getElementById('atlasGrid');
  grid.innerHTML = ZONES.map(z=>{
    const unlocked = state.unlockedZones.includes(z);
    return `<div class="zone ${unlocked?'unlocked':''}">
      <div class="zone-name">${unlocked ? z : '???'}</div>
      <div class="zone-status">${unlocked ? 'unlocked' : 'unmapped'}</div>
    </div>`;
  }).join('');
}

/* ---------- The Roster ---------- */
function renderCharacters(){
  const grid = document.getElementById('charGrid');
  const cards = state.characters.map(c=>`
    <div class="char-card">
      <div class="char-avatar">${c.name.charAt(0).toUpperCase()}</div>
      <div class="char-class">${c.charClass || 'Data pending'}</div>
      <div class="char-name">${c.name}</div>
      <div class="char-quote">${c.quote ? '"'+c.quote+'"' : 'Data pending'}</div>
    </div>`).join('');
  grid.innerHTML = cards + '<div class="add-tile" id="addCharTile">+ Add character</div>';
  document.getElementById('addCharTile').addEventListener('click', ()=>{
    document.getElementById('charModalBack').classList.remove('hidden');
  });
}

document.getElementById('cancelChar').addEventListener('click', ()=>{
  document.getElementById('charModalBack').classList.add('hidden');
});
document.getElementById('saveChar').addEventListener('click', ()=>{
  const name = document.getElementById('charName').value.trim();
  if(!name) return;
  state.characters.push({
    name,
    charClass: document.getElementById('charClass').value.trim(),
    quote: document.getElementById('charQuote').value.trim()
  });
  saveState();
  document.getElementById('charModalBack').classList.add('hidden');
  document.getElementById('charName').value = '';
  document.getElementById('charClass').value = '';
  document.getElementById('charQuote').value = '';
  renderAll();
});

/* ---------- The Archive ---------- */
function renderArchive(){
  document.getElementById('mandarinPct').textContent = state.mandarinPct + '%';
  document.getElementById('mandarinFill').style.width = state.mandarinPct + '%';

  const list = document.getElementById('dramaList');
  if(state.dramas.length === 0){
    list.innerHTML = '<div class="empty-hint">No dramas logged yet.</div>';
  } else {
    list.innerHTML = state.dramas.map(d=>`
      <div class="drama-item">
        <div class="drama-top"><span>${d.title}</span><span>${d.verdict}/10</span></div>
        <div class="drama-meta">${d.genre || 'genre pending'}</div>
      </div>`).join('');
  }
}

document.getElementById('bumpMandarin').addEventListener('click', ()=>{
  state.mandarinPct = Math.min(100, state.mandarinPct + 5);
  saveState();
  renderArchive();
  renderProfile();
});

document.getElementById('addDramaBtn').addEventListener('click', ()=>{
  document.getElementById('dramaModalBack').classList.remove('hidden');
});
document.getElementById('cancelDrama').addEventListener('click', ()=>{
  document.getElementById('dramaModalBack').classList.add('hidden');
});
document.getElementById('saveDrama').addEventListener('click', ()=>{
  const title = document.getElementById('dramaTitle').value.trim();
  if(!title) return;
  state.dramas.push({
    title,
    genre: document.getElementById('dramaGenre').value.trim(),
    verdict: document.getElementById('dramaVerdict').value
  });
  saveState();
  document.getElementById('dramaModalBack').classList.add('hidden');
  document.getElementById('dramaTitle').value = '';
  document.getElementById('dramaGenre').value = '';
  renderAll();
});

/* ---------- The Wire ---------- */
function renderComm(){
  const term = document.getElementById('terminal');
  term.innerHTML = state.messages.map(m=>
    `<div class="line"><span class="who">${m.who}:</span> ${m.text}</div>`
  ).join('');
  term.scrollTop = term.scrollHeight;
}

document.getElementById('commSend').addEventListener('click', sendComm);
document.getElementById('commInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') sendComm();
});
function sendComm(){
  const input = document.getElementById('commInput');
  const text = input.value.trim();
  if(!text) return;
  state.messages.push({who:'Home', text});
  input.value = '';
  saveState();
  renderComm();
}

/* ---------- Render all ---------- */
function renderAll(){
  renderProfile();
  renderSyncStation();
  renderLedger();
  renderAtlas();
  renderCharacters();
  renderArchive();
  renderComm();
}

renderAll();