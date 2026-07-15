/* ===== Coders Cards — viewer game layer ===== */

const CODERS_SESSION_KEY = 'ga-coder-card-id';
const CODERS_LOGIN_DAY_KEY = 'ga-coder-login-day';
const CODERS_BIRTHDAY_SHOWN_KEY = 'ga-coder-bday';
const GUEST_SESSION_KEY = 'ga-guest';
const VISITOR_WRITE_KEY = 'gray-areas-visitor';

const POINTS = {
  quest_submit: 5,
  quest_complete: 40,
  login: 3,
  meet_in_person: 100,
  video_call: 50,
  phone_call: 10,
  vote: 1,
};

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

function normalizeCoderKey(key){
  return (key || '').trim().toLowerCase();
}

function getCoderSessionId(){
  try{ return sessionStorage.getItem(CODERS_SESSION_KEY) || ''; }catch(e){ return ''; }
}

function normalizeCoderName(name){
  return (name || '').trim().toLowerCase();
}

function isGuest(){
  try{ return sessionStorage.getItem(GUEST_SESSION_KEY) === '1'; }catch(e){ return false; }
}

function isSiteUnlocked(){
  return isAdmin() || !!getCoderSessionId() || isGuest();
}

function enterGuestMode(){
  try{
    sessionStorage.setItem(GUEST_SESSION_KEY, '1');
    sessionStorage.removeItem(CODERS_SESSION_KEY);
  }catch(e){}
  sessionStorage.removeItem('ga-admin');
  hideEntryGate();
  applyAdminUI?.();
  navigateToView('instructions');
  ViewerWorld.renderAll();
}

function clearGuestMode(){
  try{ sessionStorage.removeItem(GUEST_SESSION_KEY); }catch(e){}
}

function findCoderByNameAndKey(name, key){
  const k = normalizeCoderKey(key);
  const n = normalizeCoderName(name);
  if(!k || !n) return null;
  return (state.viewerCharacters || []).find(c =>
    normalizeCoderKey(c.consoleKey) === k &&
    normalizeCoderName(c.name) === n
  ) || null;
}

function findCoderByKey(key){
  const k = normalizeCoderKey(key);
  if(!k) return null;
  return (state.viewerCharacters || []).find(c => normalizeCoderKey(c.consoleKey) === k) || null;
}

function isConsoleKeyTaken(key, exceptId){
  const k = normalizeCoderKey(key);
  if(!k) return false;
  return (state.viewerCharacters || []).some(c =>
    c.id !== exceptId && normalizeCoderKey(c.consoleKey) === k
  );
}

function formatBirthdayDisplay(birthday){
  if(!birthday) return '';
  const parts = birthday.split('-');
  if(parts.length < 2) return birthday;
  const m = parseInt(parts[parts.length - 2], 10);
  const d = parseInt(parts[parts.length - 1], 10);
  if(!m || !d) return birthday;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[m - 1] || m}`;
}

function isBirthdayToday(birthday){
  if(!birthday) return false;
  const parts = birthday.split('-');
  if(parts.length < 2) return false;
  const m = parseInt(parts[parts.length - 2], 10);
  const d = parseInt(parts[parts.length - 1], 10);
  const now = new Date();
  return now.getMonth() + 1 === m && now.getDate() === d;
}

function showWelcomeModal(title, body, opts = {}){
  const back = document.getElementById('welcomeBack');
  const t = document.getElementById('welcomeTitle');
  const b = document.getElementById('welcomeBody');
  if(!back || !t || !b) return;
  t.textContent = title;
  b.innerHTML = body;
  back.classList.remove('hidden');
  const dismiss = () => {
    back.classList.add('hidden');
    opts.onDismiss?.();
  };
  const btn = document.getElementById('welcomeDismiss');
  if(btn){
    btn.onclick = dismiss;
  }
  back.onclick = e => { if(e.target === back) dismiss(); };
}

function showBirthdayCelebration(card){
  if(!card?.birthday || !isBirthdayToday(card.birthday)) return;
  const yearKey = CODERS_BIRTHDAY_SHOWN_KEY + ':' + card.id + ':' + new Date().getFullYear();
  try{
    if(sessionStorage.getItem(yearKey)) return;
    sessionStorage.setItem(yearKey, '1');
  }catch(e){}
  const back = document.getElementById('birthdayBack');
  const title = document.getElementById('birthdayTitle');
  const body = document.getElementById('birthdayBody');
  if(!back || !title || !body) return;
  title.textContent = `Happy Birthday, ${card.name}!`;
  body.innerHTML = `<p>Your Coders Card is celebrating today. Thanks for being part of Gray Areas — here's to another lap around the sun.</p>
    <p class="birthday-xp">+${POINTS.login * 2} birthday XP logged on login.</p>`;
  back.classList.remove('hidden');
  awardCoderPoints(card.id, POINTS.login * 2, 'birthday');
}

function showWelcomeCoder(card){
  const pts = card.points || 0;
  showWelcomeModal(
    `Welcome Coder: ${card.name}`,
    `<p class="welcome-xp">XP: <strong>${pts}</strong></p><p>Your card is loaded. Send quests, vote on missions, and track your points.</p>`,
    { onDismiss: () => showBirthdayCelebration(card) },
  );
}

function showWelcomePlayer(){
  const name = typeof getPlayer === 'function' ? (getPlayer().name || 'Gray') : 'Gray';
  showWelcomeModal(
    `Welcome Player: ${name}`,
    '<p>Full game mode unlocked. Manage quests, log your day, and run the board.</p>',
  );
}

function unlockCoderSession(cardId, opts = {}){
  clearGuestMode();
  try{ sessionStorage.setItem(CODERS_SESSION_KEY, cardId); }catch(e){}
  hideEntryGate();
  awardLoginPoints(cardId);
  const card = (state.viewerCharacters || []).find(c => c.id === cardId);
  if(opts.welcome !== false && card) showWelcomeCoder(card);
  else if(card) showBirthdayCelebration(card);
  applyAdminUI?.();
  ViewerWorld.renderAll();
}

function lockCoderSession(){
  try{ sessionStorage.removeItem(CODERS_SESSION_KEY); }catch(e){}
  if(!isAdmin()) showEntryGate();
}

function getMyCoderCard(){
  ensureViewerState();
  const id = getCoderSessionId();
  if(!id) return null;
  return state.viewerCharacters.find(c => c.id === id) || null;
}

function tryCoderLogin(name, key){
  const card = findCoderByNameAndKey(name, key);
  if(!card) return false;
  unlockCoderSession(card.id);
  return true;
}

function tryCoderLoginFromConsole(input){
  const raw = (input || '').trim();
  if(!raw) return false;
  const sep = raw.indexOf('::');
  if(sep < 0) return false;
  const name = raw.slice(0, sep).trim();
  const key = raw.slice(sep + 2).trim();
  return tryCoderLogin(name, key);
}

function coderLevelFromPoints(points){
  const pts = points || 0;
  const level = Math.max(1, 1 + Math.floor(pts / 100));
  return { level, points: pts, progress: (pts % 100) / 100 };
}

function awardCoderPoints(characterId, amount, reason){
  if(!amount) return;
  ensureViewerState();
  const c = state.viewerCharacters.find(x => x.id === characterId);
  if(!c) return;
  c.points = (c.points || 0) + amount;
  const lvl = coderLevelFromPoints(c.points);
  if(c.pokeCard) c.pokeCard.level = lvl.level;
  if(reason === 'quest_complete') c.questsCompleted = (c.questsCompleted || 0) + 1;
  if(reason === 'quest_submit') c.questsSent = (c.questsSent || 0) + 1;
  saveState();
  postVisitorData('updateCharacter', c);
}

function awardLoginPoints(cardId){
  const today = todayKey();
  try{
    const last = localStorage.getItem(CODERS_LOGIN_DAY_KEY + ':' + cardId);
    if(last === today) return;
    localStorage.setItem(CODERS_LOGIN_DAY_KEY + ':' + cardId, today);
  }catch(e){}
  awardCoderPoints(cardId, POINTS.login, 'login');
}

function mergeVisitorDataFile(remote){
  if(!remote) return;
  ensureViewerState();
  const mergeById = (arr, incoming) => {
    if(!Array.isArray(incoming)) return;
    incoming.forEach(item => {
      if(!item?.id) return;
      const i = arr.findIndex(x => x.id === item.id);
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
  }catch(e){ return false; }
}

function buildCoderCardFromWizard(form){
  const abilityName = form.abilityName?.trim() || 'Unexpected Resilience';
  const abilityEffect = form.abilityEffect?.trim() || 'Your kindness is your strength.';
  const weakName = form.weaknessName?.trim() || 'Self-Doubt';
  const weakEffect = form.weaknessEffect?.trim() || 'Takes extra damage from high-pressure situations.';
  const resistName = form.resistanceName?.trim() || 'Peer Pressure';
  const resistEffect = form.resistanceEffect?.trim() || 'Immune to effects that force personality changes.';
  const paletteName = form.paletteName?.trim() || 'Custom palette';
  const cardColor = form.cardColor || '#38bdf8';
  const accent = toNeonAccent(cardColor) || paletteToAccent(cardColor);

  return {
    id: uid('coder'),
    isCoderCard: true,
    createdAt: new Date().toISOString(),
    locked: true,
    consoleKey: normalizeCoderKey(form.consoleKey),
    name: form.name.trim(),
    birthday: form.birthday?.trim() || '',
    cardSubtitle: form.title?.trim() || 'Coders operative',
    age: form.age?.trim() || '',
    mbti: form.mbti?.trim() || '',
    skinColor: form.skinColor?.trim() || '',
    eyeColor: form.eyeColor?.trim() || '',
    spiritAnimal: form.spiritAnimal?.trim() || '',
    selfDescription: form.selfDescription?.trim() || '',
    vibe: form.vibe?.trim() || '',
    quote: form.quote?.trim() || '',
    points: 0,
    questsSent: 0,
    questsCompleted: 0,
    loginCount: 0,
    cardColor: accent,
    image: '',
    avatar: '',
    lookPrompt: form.selfDescription?.trim() || '',
    cardDescription: form.selfDescription?.trim() || form.vibe?.trim() || '',
    pokeCard: {
      level: 1,
      mbti: form.mbti?.trim() || '',
      spiritPrompt: form.spiritAnimal?.trim() || '',
      colorPalette: paletteName,
      cardColor,
      vibe: form.vibe?.trim() || '',
      subtitle: form.title?.trim() || 'Coders operative',
      abilities: [{ name: abilityName, effect: abilityEffect }],
      moves: [],
      weakness: { name: weakName, effect: weakEffect },
      resistance: { name: resistName, effect: resistEffect },
      retreatCost: '1',
      quote: form.quote?.trim() || '',
      birthday: form.birthday?.trim() || '',
      spiritAnimalImage: '',
    },
  };
}

async function generateCoderCardImages(card){
  if(typeof CharGen === 'undefined') return card;
  const portraitDesc = [
    card.selfDescription,
    card.skinColor && `skin: ${card.skinColor}`,
    card.eyeColor && `eyes: ${card.eyeColor}`,
    card.name,
  ].filter(Boolean).join(', ');
  try{
    card.image = await CharGen.generatePortrait(portraitDesc || card.name);
    card.avatar = card.image;
    if(card.spiritAnimal){
      card.pokeCard.spiritAnimalImage = await CharGen.generateSpirit(card.spiritAnimal);
    }
  }catch(e){
    console.warn('Coder card image gen:', e);
  }
  return card;
}

function showEntryGate(){
  if(isSiteUnlocked()) return;
  document.getElementById('coderKeyGate')?.classList.remove('hidden');
  document.body.classList.add('coder-gate-active');
}

function hideEntryGate(){
  document.getElementById('coderKeyGate')?.classList.add('hidden');
  document.body.classList.remove('coder-gate-active');
}

function showCoderKeyGate(){ showEntryGate(); }
function hideCoderKeyGate(){ hideEntryGate(); }

function questVoteCount(q){
  return Object.keys(q.votes || {}).length;
}

function userVotedQuest(q, cardId){
  return !!(q.votes && cardId && q.votes[cardId]);
}

const ViewerWorld = {
  inited: false,
  pendingVlogFile: null,
  pendingQuestClips: [],

  init(){
    if(this.inited) return;
    this.inited = true;
    ensureViewerState();
    document.getElementById('coderGateSubmit')?.addEventListener('click', () => this.submitKeyGate());
    document.getElementById('coderGateGuest')?.addEventListener('click', () => enterGuestMode());
    document.getElementById('coderGateName')?.addEventListener('keydown', e => {
      if(e.key === 'Enter') this.submitKeyGate();
    });
    document.getElementById('coderGateKey')?.addEventListener('keydown', e => {
      if(e.key === 'Enter') this.submitKeyGate();
    });
    document.getElementById('coderGateCreate')?.addEventListener('click', () => {
      hideEntryGate();
      navigateToView('viewer-card');
    });
    document.getElementById('birthdayDismiss')?.addEventListener('click', () => {
      document.getElementById('birthdayBack')?.classList.add('hidden');
    });
    document.getElementById('questCompleteSave')?.addEventListener('click', () => this.saveQuestComplete());
    document.getElementById('questCompleteClips')?.addEventListener('change', e => {
      this.pendingQuestClips = [...(e.target.files || [])];
    });
    fetchVisitorData().then(() => {
      if(!isSiteUnlocked()) showEntryGate();
      else if(getCoderSessionId()) awardLoginPoints(getCoderSessionId());
    });
  },

  submitKeyGate(){
    const name = document.getElementById('coderGateName')?.value?.trim();
    const key = document.getElementById('coderGateKey')?.value?.trim();
    if(!name || !key){
      alert('Enter both your card name and console key.');
      return;
    }
    if(tryCoderLogin(name, key)){
      document.getElementById('coderGateName').value = '';
      document.getElementById('coderGateKey').value = '';
      navigateToView('instructions');
      return;
    }
    alert('No Coders Card found for that name and key. Check spelling, continue as guest, or create a new card.');
  },

  renderAll(){
    this.renderInstructions();
    this.renderViewerCard();
    this.renderQuests();
    this.renderVlog();
  },

  renderInstructions(){
    const host = document.getElementById('instructionsSpread');
    if(!host) return;
    host.innerHTML = `
      <div class="instructions-panel sketch-card">
        <p class="instructions-kicker">Welcome to Gray Areas</p>
        <h3 class="viewer-wizard-title">What this is</h3>
        <p class="instructions-p">Gray Areas is a live game about one player — Gray — building a life in Shenzhen while the rest of the world watches, sends missions, and grows their own <strong>Coders Card</strong>.</p>
        <p class="instructions-p">Gray logs days, places, moods, skills, and vlogs. You decide what happens next by sending <strong>quests</strong>: visit a café, try a dish, write about you in The Press, meet up, or simply help cool things down.</p>
        <h3 class="viewer-wizard-title">How to play as a viewer</h3>
        <ol class="instructions-steps">
          <li><strong>Create your Coders Card</strong> — one-time setup with colours, birthday, strengths, and vibe. Pick a unique <strong>console key</strong> (each card needs its own).</li>
          <li><strong>Log in</strong> with your <strong>name + console key</strong> each visit — or use the sidebar console as <code>Name::key</code>. Your card saves on the board.</li>
          <li><strong>Guest view</strong> — browse the site without a card. Guests cannot send quests.</li>
          <li><strong>Send quests</strong> once logged in. Vote on open missions. Comment when Gray completes them.</li>
          <li><strong>Earn XP</strong> when Gray completes your quests, when you log in, and when you meet (in person, video, or phone — Gray awards those).</li>
          <li><strong>Watch Coming To You Live</strong> — Gray's to-do list and neon timeline show what's happening in real time.</li>
        </ol>
        <h3 class="viewer-wizard-title">Why it exists</h3>
        <p class="instructions-p">Gray built this to track life abroad honestly — steps, Mandarin, overload days, people met — while keeping friends and family inside the story instead of outside it. It's part diary, part RPG, part broadcast. Your quests make it collaborative.</p>
        <p class="instructions-note">No hidden commands here — just explore, make your card, and transmit missions.</p>
        ${isGuest() ? `<p class="instructions-note">Browsing as <strong>guest</strong> — log in or create a card to send quests.</p>` : ''}
        ${!getMyCoderCard() && !isGuest() ? `<button type="button" class="btn primary" id="instrGoCard">Create your Coders Card →</button>` : ''}
        ${getMyCoderCard() ? `<button type="button" class="btn primary" id="instrGoQuests">Send a quest →</button>` : ''}
        ${isGuest() ? `<button type="button" class="btn" id="instrGoLogin">Log in to your card →</button>` : ''}
      </div>`;
    host.querySelector('#instrGoCard')?.addEventListener('click', () => navigateToView('viewer-card'));
    host.querySelector('#instrGoQuests')?.addEventListener('click', () => navigateToView('quests'));
    host.querySelector('#instrGoLogin')?.addEventListener('click', () => showEntryGate());
  },

  renderViewerCard(){
    const host = document.getElementById('viewerCardSpread');
    if(!host) return;

    if(isAdmin()){
      host.innerHTML = `<p class="empty-hint">Player mode — Coders Cards are viewer-only. Manage incoming missions in <strong>Quest Inbox</strong>.</p>`;
      return;
    }

    if(isGuest()){
      host.innerHTML = `<div class="viewer-wizard sketch-card">
        <h3 class="viewer-wizard-title">Guest view</h3>
        <p class="field-hint">You're browsing without a card. You can explore the site but cannot send quests.</p>
        <div class="modal-actions">
          <button type="button" class="btn primary" id="guestGoCreate">Create a Coders Card</button>
          <button type="button" class="btn" id="guestGoLogin">Log in to your card</button>
        </div>
      </div>`;
      host.querySelector('#guestGoCreate')?.addEventListener('click', () => navigateToView('viewer-card'));
      host.querySelector('#guestGoLogin')?.addEventListener('click', () => showEntryGate());
      return;
    }

    if(!getMyCoderCard()){
      host.innerHTML = `
        <div class="viewer-wizard sketch-card">
          <h3 class="viewer-wizard-title">Create your Coders Card</h3>
          <p class="field-hint">One-time setup. Your name + console key log you in each visit. Each key must be unique.</p>
          <form id="viewerCardForm" class="viewer-wizard-form">
            <div class="field-row">
              <div class="field"><label>Name</label><input type="text" id="vwName" required></div>
              <div class="field"><label>Title</label><input type="text" id="vwTitle" placeholder="e.g. The Forest Sprite"></div>
            </div>
            <div class="field-row">
              <div class="field"><label>Birthday</label><input type="date" id="vwBirthday"></div>
              <div class="field"><label>MBTI</label><input type="text" id="vwMbti" placeholder="INFP"></div>
            </div>
            <div class="field-row">
              <div class="field"><label>Age</label><input type="text" id="vwAge"></div>
              <div class="field"><label>Palette name</label><input type="text" id="vwPalette" placeholder="Earth tones"></div>
            </div>
            <div class="field-row">
              <div class="field"><label>Card colour</label><input type="color" id="vwCardColor" value="#4ade80"></div>
              <div class="field"><label>Skin colour</label><input type="text" id="vwSkin" placeholder="for portrait"></div>
            </div>
            <div class="field-row">
              <div class="field"><label>Eye colour</label><input type="text" id="vwEyes"></div>
              <div class="field"><label>Spirit animal</label><input type="text" id="vwSpirit" placeholder="appears on card front"></div>
            </div>
            <div class="field"><label>Vibe</label><textarea id="vwVibe" rows="2" placeholder="your character energy"></textarea></div>
            <div class="field"><label>Ability name</label><input type="text" id="vwAbilityName" placeholder="Unexpected Resilience"></div>
            <div class="field"><label>Ability effect</label><textarea id="vwAbilityEffect" rows="2"></textarea></div>
            <div class="field-row">
              <div class="field"><label>Weakness</label><input type="text" id="vwWeakName"></div>
              <div class="field"><label>Weakness effect</label><textarea id="vwWeakEffect" rows="2"></textarea></div>
            </div>
            <div class="field-row">
              <div class="field"><label>Resistance</label><input type="text" id="vwResistName"></div>
              <div class="field"><label>Resistance effect</label><textarea id="vwResistEffect" rows="2"></textarea></div>
            </div>
            <div class="field"><label>Quote</label><input type="text" id="vwQuote" placeholder="Wassup slags."></div>
            <div class="field"><label>Self description <span class="field-hint">for generated portrait</span></label><textarea id="vwSelfDesc" rows="3" placeholder="Hair, style, mood, what you look like…"></textarea></div>
            <div class="field-row">
              <div class="field"><label>Console key</label><input type="password" id="vwConsoleKey" required placeholder="your private unlock code"></div>
              <div class="field"><label>Confirm key</label><input type="password" id="vwConsoleKey2" required></div>
            </div>
            <p class="field-hint">Remember your name and key — you'll need both to log in every visit.</p>
            <button type="submit" class="btn primary" id="vwSubmitBtn">Generate Coders Card</button>
          </form>
        </div>`;
      document.getElementById('viewerCardForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitCharacterWizard(); });
      return;
    }

    const mine = getMyCoderCard();
    if(!mine) return;

    const lvl = coderLevelFromPoints(mine.points);
    host.innerHTML = `
      <div class="viewer-card-hero">
        <div class="viewer-fire-badge" style="--vfb-neon:${mine.cardColor || '#38bdf8'}">
          <span class="viewer-fire-icon">◆</span>
          <span class="viewer-fire-val">${mine.points || 0}</span>
          <span class="viewer-fire-label">points</span>
        </div>
        <div class="viewer-level-pill">Lv ${lvl.level}</div>
      </div>
      <div class="viewer-card-deck">${typeof buildFlipPlayerCard === 'function' ? buildFlipPlayerCard(mine, 'character', 0, { accent: mine.cardColor }) : ''}</div>
      <div class="viewer-card-stats sketch-card">
        <div class="vcs-row"><span>Quests sent</span><strong>${mine.questsSent || 0}</strong></div>
        <div class="vcs-row"><span>Quests completed</span><strong>${mine.questsCompleted || 0}</strong></div>
        ${mine.birthday ? `<div class="vcs-row"><span>Birthday</span><strong>${formatBirthdayDisplay(mine.birthday)}</strong></div>` : ''}
        <p class="field-hint">Card sealed · +100 meet · +50 video call · +10 phone call (awarded by Gray)</p>
      </div>`;
    bindFlipPlayerCards(host);
  },

  coderAdminRow(c){
    return `<div class="coder-admin-row sketch-card">
      <strong>${esc(c.name)}</strong> · ${c.points || 0} pts
      <div class="quest-actions">
        <button type="button" class="btn" data-coder-id="${esc(c.id)}" data-award="meet_in_person">+100 meet</button>
        <button type="button" class="btn" data-coder-id="${esc(c.id)}" data-award="video_call">+50 video</button>
        <button type="button" class="btn" data-coder-id="${esc(c.id)}" data-award="phone_call">+10 phone</button>
      </div>
    </div>`;
  },

  adminAwardPoints(coderId, type){
    if(!isAdmin()) return;
    const pts = POINTS[type];
    if(!pts) return;
    awardCoderPoints(coderId, pts, type);
    this.renderQuests();
  },

  async submitCharacterWizard(){
    const k1 = document.getElementById('vwConsoleKey')?.value;
    const k2 = document.getElementById('vwConsoleKey2')?.value;
    if(!k1 || k1 !== k2){ alert('Console keys must match.'); return; }
    if(k1.length < 3){ alert('Pick a longer console key.'); return; }
    if(isConsoleKeyTaken(k1)){
      alert('That console key is already taken — each Coders Card needs its own unique key. Please choose another.');
      return;
    }

    const btn = document.getElementById('vwSubmitBtn');
    if(btn) btn.disabled = true;

    const form = {
      name: document.getElementById('vwName')?.value,
      birthday: document.getElementById('vwBirthday')?.value,
      title: document.getElementById('vwTitle')?.value,
      age: document.getElementById('vwAge')?.value,
      mbti: document.getElementById('vwMbti')?.value,
      cardColor: document.getElementById('vwCardColor')?.value,
      paletteName: document.getElementById('vwPalette')?.value,
      skinColor: document.getElementById('vwSkin')?.value,
      eyeColor: document.getElementById('vwEyes')?.value,
      spiritAnimal: document.getElementById('vwSpirit')?.value,
      vibe: document.getElementById('vwVibe')?.value,
      abilityName: document.getElementById('vwAbilityName')?.value,
      abilityEffect: document.getElementById('vwAbilityEffect')?.value,
      weaknessName: document.getElementById('vwWeakName')?.value,
      weaknessEffect: document.getElementById('vwWeakEffect')?.value,
      resistanceName: document.getElementById('vwResistName')?.value,
      resistanceEffect: document.getElementById('vwResistEffect')?.value,
      quote: document.getElementById('vwQuote')?.value,
      selfDescription: document.getElementById('vwSelfDesc')?.value,
      consoleKey: k1,
    };
    if(!form.name?.trim()){ alert('Name required.'); if(btn) btn.disabled = false; return; }

    let card = buildCoderCardFromWizard(form);
    card = await generateCoderCardImages(card);
    state.viewerCharacters.push(card);
    saveState();
    await postVisitorData('createCharacter', card);
    unlockCoderSession(card.id);
    if(btn) btn.disabled = false;
    this.renderViewerCard();
    alert('Coders Card created! Your portrait is generating. Remember your name and console key.');
  },

  renderQuests(){
    const host = document.getElementById('questSpread');
    if(!host) return;
    const mine = getMyCoderCard();
    const typeOpts = QUEST_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('');
    const completed = (state.quests || []).filter(q => q.status === 'completed').slice().reverse();
    const open = (state.quests || []).filter(q => q.status !== 'completed' && q.status !== 'declined');

    let html = '';

    if(isAdmin()){
      const pending = open.filter(q => q.status === 'submitted' || q.status === 'accepted' || q.status === 'in_progress');
      html += `<div class="quest-inbox sketch-card">
        <h3 class="viewer-wizard-title">Quest inbox</h3>
        <p class="field-hint">${pending.length} mission${pending.length === 1 ? '' : 's'} to handle · ${open.filter(q => q.status === 'submitted').length} awaiting accept</p>
      </div>`;
      html += pending.length
        ? `<section><h3 class="viewer-wizard-title">Incoming missions</h3><div class="quest-list">${pending.map(q => this.questRowHtml(q, false)).join('')}</div></section>`
        : `<p class="empty-hint">No pending quests right now.</p>`;
      if(completed.length){
        html += `<section class="quest-completed-section"><h3 class="viewer-wizard-title">Completed</h3><div class="quest-list">${completed.map(q => this.questRowHtml(q, true)).join('')}</div></section>`;
      }
      const coders = state.viewerCharacters || [];
      if(coders.length){
        html += `<section class="coder-admin-panel sketch-card"><h3 class="viewer-wizard-title">Award coder XP</h3>
          <div class="coder-admin-list">${coders.map(c => this.coderAdminRow(c)).join('')}</div></section>`;
      }
      host.innerHTML = html;
      host.querySelectorAll('[data-quest-action]').forEach(btn => btn.addEventListener('click', () => this.handleQuestAction(btn.dataset.questId, btn.dataset.questAction)));
      host.querySelectorAll('[data-award]').forEach(btn => btn.addEventListener('click', () => this.adminAwardPoints(btn.dataset.coderId, btn.dataset.award)));
      return;
    }

    if(completed.length){
      html += `<section class="quest-completed-section"><h3 class="viewer-wizard-title">Completed quests</h3><div class="quest-list">${completed.map(q => this.questRowHtml(q, true)).join('')}</div></section>`;
    }

    if(mine){
      html += `<div class="quest-compose sketch-card">
        <h3 class="viewer-wizard-title">Transmit a quest</h3>
        <p class="field-hint">From <strong>${esc(mine.name)}</strong> — you decide what Gray does.</p>
        <form id="questForm">
          <div class="field-row">
            <div class="field"><label>Type</label><select id="questType">${typeOpts}</select></div>
            <div class="field"><label>Title</label><input type="text" id="questTitle" required></div>
          </div>
          <div class="field"><label>Mission</label><textarea id="questBody" rows="4" required></textarea></div>
          <div class="field-row">
            <div class="field"><label>Place</label><input type="text" id="questPlace"></div>
            <div class="field"><label>Food / item</label><input type="text" id="questFood"></div>
          </div>
          <button type="submit" class="btn primary">Send quest</button>
        </form>
      </div>`;
    } else if(isGuest()){
      html += `<p class="empty-hint">Guests can browse quests but cannot send them. Log in or create a Coders Card.</p>`;
    } else {
      html += `<p class="empty-hint">Log in with your name and console key to send quests.</p>`;
    }

    html += `<section><h3 class="viewer-wizard-title">Open quests</h3>`;
    html += open.length ? `<div class="quest-list">${open.map(q => this.questRowHtml(q)).join('')}</div>` : `<p class="empty-hint">No open quests.</p></section>`;
    host.innerHTML = html;

    document.getElementById('questForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitQuest(); });
    host.querySelectorAll('[data-quest-action]').forEach(btn => btn.addEventListener('click', () => this.handleQuestAction(btn.dataset.questId, btn.dataset.questAction)));
    host.querySelectorAll('[data-quest-vote]').forEach(btn => btn.addEventListener('click', () => this.voteQuest(btn.dataset.questId)));
    host.querySelectorAll('[data-quest-comment]').forEach(btn => btn.addEventListener('click', () => this.commentQuest(btn.dataset.questId)));
  },

  questRowHtml(q, showComments){
    const st = QUEST_STATUS[q.status] || QUEST_STATUS.submitted;
    const type = QUEST_TYPES.find(t => t.id === q.type) || QUEST_TYPES[5];
    const mine = getMyCoderCard();
    const votes = questVoteCount(q);
    const clips = q.responseClips || [];
    return `<article class="quest-card" style="--qc-neon:${type.neon}">
      <header class="quest-card-head">
        <span class="quest-type">${type.icon} ${type.label}</span>
        <span class="quest-status" style="--qs-neon:${st.neon}">${st.label}</span>
      </header>
      <h4 class="quest-title">${esc(q.title)}</h4>
      <p class="quest-from">From <strong>${esc(q.fromName)}</strong> · ▲ ${votes}</p>
      <p class="quest-body">${esc(q.body)}</p>
      ${q.playerNote ? `<p class="quest-note">Gray: ${esc(q.playerNote)}</p>` : ''}
      ${clips.length ? `<div class="quest-response-reel">${clips.map((c, i) => `<video controls playsinline src="${esc(c)}" class="quest-clip"></video>`).join('')}</div>` : ''}
      ${q.status !== 'completed' && mine ? `<button type="button" class="btn" data-quest-vote="${esc(q.id)}">▲ support (${votes})</button>` : ''}
      ${showComments ? `
        <div class="quest-comments">${(q.comments || []).map(c => `<p class="quest-comment"><strong>${esc(c.fromName)}</strong>: ${esc(c.text)}</p>`).join('')}</div>
        ${mine ? `<button type="button" class="btn" data-quest-comment="${esc(q.id)}">Comment</button>` : ''}` : ''}
      ${isAdmin() && q.status !== 'completed' && q.status !== 'declined' ? `
        <div class="quest-actions">
          ${q.status === 'submitted' ? `<button type="button" class="btn" data-quest-id="${esc(q.id)}" data-quest-action="accept">Accept</button>` : ''}
          <button type="button" class="btn primary" data-quest-id="${esc(q.id)}" data-quest-action="complete">Complete + video</button>
          <button type="button" class="btn" data-quest-id="${esc(q.id)}" data-quest-action="decline">Decline</button>
        </div>` : ''}
    </article>`;
  },

  async submitQuest(){
    const mine = getMyCoderCard();
    if(!mine){ alert('Unlock your Coders Card first.'); return; }
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
      votes: {},
      comments: [],
    };
    if(!quest.title || !quest.body) return;
    state.quests.push(quest);
    awardCoderPoints(mine.id, POINTS.quest_submit, 'quest_submit');
    saveState();
    await postVisitorData('submitQuest', quest);
    document.getElementById('questForm')?.reset();
    this.renderQuests();
  },

  voteQuest(questId){
    const mine = getMyCoderCard();
    const q = state.quests.find(x => x.id === questId);
    if(!mine || !q || q.status === 'completed') return;
    if(!q.votes) q.votes = {};
    if(q.votes[mine.id]) return;
    q.votes[mine.id] = true;
    awardCoderPoints(mine.id, POINTS.vote, 'vote');
    saveState();
    postVisitorData('updateQuest', q);
    this.renderQuests();
  },

  commentQuest(questId){
    const mine = getMyCoderCard();
    const q = state.quests.find(x => x.id === questId);
    if(!mine || !q || q.status !== 'completed') return;
    const text = prompt('Your comment:')?.trim();
    if(!text) return;
    if(!q.comments) q.comments = [];
    q.comments.push({ id: uid('qc'), fromCharacterId: mine.id, fromName: mine.name, text, at: new Date().toISOString() });
    saveState();
    postVisitorData('updateQuest', q);
    this.renderQuests();
  },

  handleQuestAction(questId, action){
    if(!isAdmin()) return;
    const q = state.quests.find(x => x.id === questId);
    if(!q) return;
    if(action === 'accept'){
      q.status = 'accepted';
      q.updatedAt = new Date().toISOString();
      saveState();
      postVisitorData('updateQuest', q);
      this.renderQuests();
      return;
    }
    if(action === 'decline'){
      q.status = 'declined';
      q.playerNote = prompt('Reason (optional):') || '';
      q.updatedAt = new Date().toISOString();
      saveState();
      postVisitorData('updateQuest', q);
      this.renderQuests();
      return;
    }
    if(action === 'complete'){
      this.pendingQuestClips = [];
      document.getElementById('questCompleteId').value = questId;
      document.getElementById('questCompleteNote').value = '';
      document.getElementById('questCompleteClips').value = '';
      document.getElementById('questCompleteBack')?.classList.remove('hidden');
    }
  },

  async saveQuestComplete(){
    const questId = document.getElementById('questCompleteId')?.value;
    const q = state.quests.find(x => x.id === questId);
    if(!q) return;
    const note = document.getElementById('questCompleteNote')?.value?.trim() || '';
    const clips = [];
    for(const file of this.pendingQuestClips || []){
      if(file.size > 4 * 1024 * 1024) continue;
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      clips.push(data);
    }
    q.status = 'completed';
    q.playerNote = note;
    q.responseClips = clips;
    q.completedAt = new Date().toISOString();
    q.updatedAt = q.completedAt;
    awardCoderPoints(q.fromCharacterId, POINTS.quest_complete, 'quest_complete');
    const key = todayKey();
    const stream = getDayStream(key);
    if(stream.startedAt){
      stream.nodes.push({
        id: 'n-quest-' + Date.now(),
        at: new Date().toISOString(),
        type: 'win',
        text: `Quest done: ${q.title}`,
        body: `From ${q.fromName}${note ? '\n' + note : ''}`,
      });
      if(!state.entries[key]) state.entries[key] = {};
      state.entries[key].stream = stream;
    }
    saveState();
    await postVisitorData('updateQuest', q);
    document.getElementById('questCompleteBack')?.classList.add('hidden');
    this.pendingQuestClips = [];
    this.renderQuests();
    renderHomeCheckIn();
  },

  renderVlog(){
    const host = document.getElementById('vlogSpread');
    if(!host) return;
    const entries = (state.videoDiary || []).slice().reverse();
    let html = '';
    if(isAdmin()){
      html += `<div class="vlog-upload sketch-card"><h3 class="viewer-wizard-title">Upload video note</h3>
        <form id="vlogUploadForm">
          <div class="field-row"><div class="field"><label>Title</label><input type="text" id="vlogTitle" required></div>
          <div class="field"><label>Date</label><input type="date" id="vlogDate" value="${todayKey()}"></div></div>
          <div class="field"><label>Video URL</label><input type="url" id="vlogUrl"></div>
          <div class="field"><label>Clip upload (&lt;4MB)</label><input type="file" id="vlogVideoFile" accept="video/*"></div>
          <div class="field"><label>English captions</label><textarea id="vlogCaptions" rows="4"></textarea></div>
          <button type="submit" class="btn primary">Publish</button>
        </form></div>`;
    }
    html += entries.length ? `<div class="vlog-grid">${entries.map(v => this.vlogEntryHtml(v)).join('')}</div>` : `<p class="empty-hint">No vlogs yet.</p>`;
    host.innerHTML = html;
    document.getElementById('vlogUploadForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitVlog(); });
    document.getElementById('vlogVideoFile')?.addEventListener('change', e => { this.pendingVlogFile = e.target.files?.[0] || null; });
  },

  vlogEntryHtml(v){
    const src = v.videoUrl || v.videoData || '';
    const vtt = captionsToVtt(v.captions || '');
    if(vtt) window['vttBlob_' + v.id] = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    const trackSrc = window['vttBlob_' + v.id] || '';
    return `<article class="vlog-entry sketch-card"><h4>${esc(v.title)}</h4>
      ${src ? `<video class="vlog-player" controls playsinline src="${esc(src)}">${trackSrc ? `<track kind="captions" srclang="en" label="English" src="${trackSrc}" default>` : ''}</video>` : ''}
    </article>`;
  },

  async submitVlog(){
    if(!isAdmin()) return;
    let videoData = '';
    if(this.pendingVlogFile){
      if(this.pendingVlogFile.size > 4 * 1024 * 1024){ alert('Max 4MB'); return; }
      videoData = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(this.pendingVlogFile);
      });
    }
    const videoUrl = document.getElementById('vlogUrl')?.value?.trim() || '';
    if(!videoUrl && !videoData) return;
    state.videoDiary.push({
      id: uid('vlog'),
      createdAt: new Date().toISOString(),
      title: document.getElementById('vlogTitle')?.value?.trim(),
      date: document.getElementById('vlogDate')?.value || todayKey(),
      videoUrl, videoData,
      captions: document.getElementById('vlogCaptions')?.value?.trim() || '',
    });
    saveState();
    this.pendingVlogFile = null;
    this.renderVlog();
  },
};

function captionsToVtt(text){
  const chunks = (text || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  if(!chunks.length) return '';
  const pad = n => String(Math.floor(n / 3600)).padStart(2, '0') + ':' + String(Math.floor((n % 3600) / 60)).padStart(2, '0') + ':' + String(Math.floor(n % 60)).padStart(2, '0') + '.000';
  let body = 'WEBVTT\n\n';
  chunks.forEach((line, i) => { body += `${i + 1}\n${pad(i * 4)} --> ${pad((i + 1) * 4)}\n${line}\n\n`; });
  return body;
}
