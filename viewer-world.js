/* ===== Coders Cards — viewer game layer ===== */

const CODERS_SESSION_KEY = 'ga-coder-card-id';
const CODERS_LOGIN_DAY_KEY = 'ga-coder-login-day';
const CODERS_BIRTHDAY_SHOWN_KEY = 'ga-coder-bday';
const GUEST_SESSION_KEY = 'ga-guest';
const CREATING_CARD_KEY = 'ga-creating-card';
const VISITOR_WRITE_KEY = 'gray-areas-visitor';
const GRAY_INBOX_ID = 'gray';

const POINTS = {
  quest_submit: 25,
  quest_complete: 75,
};

const XP_AWARDS = {
  quest_submit: { label: 'Quest sent', xp: 25, auto: true },
  quest_complete: { label: 'Quest completed (+75 extra)', xp: 75, auto: true },
  login: { label: 'Daily login', xp: 3, auto: true },
  card_create: { label: 'Make My Card', xp: 20, auto: true },
  card_edit: { label: 'Edit My Card', xp: 5, auto: true },
  community_post: { label: 'Community post', xp: 25, auto: true },
  community_comment: { label: 'Comment on the board', xp: 15, auto: true },
  inbox_message: { label: 'Private message sent', xp: 10, auto: true },
  login_streak_7: { label: '7-day login streak', xp: 70 },
  meet_in_person: { label: 'Met in person', xp: 200 },
  video_call: { label: 'Video call', xp: 58 },
  phone_call: { label: 'Phone call', xp: 25 },
  voice_note: { label: 'Voice note / voice message', xp: 10 },
  letter_postcard: { label: 'Letter or postcard', xp: 50 },
  big_life_event: { label: 'Big life event', xp: 100 },
  game_night: { label: 'Video gaming together', xp: 50 },
  good_advice: { label: 'Genuinely good advice', xp: 25 },
  bad_advice: { label: 'Really shitty advice', xp: 50 },
  media_rec_5star: { label: 'Rec consumed — 5 stars', xp: 100 },
  media_rec_4star: { label: 'Rec consumed — 4 stars', xp: 50 },
  media_rec_low: { label: 'Rec finished below 4 stars', xp: 25 },
  sent_photos: { label: 'Photos sent to me', xp: 15 },
  birthday: { label: 'Birthday', xp: 150 },
  practical_help: { label: 'Helped me practically', xp: 50 },
  random_vibe: { label: 'Just being a vibe (I pick amount)', xp: 0 },
  custom: { label: 'Custom award', xp: 0 },
};

const PLAYER_LOGIN_NAME = 'gray';
const PLAYER_LOGIN_KEY = ':)';

const QUEST_TYPES = [
  { id: 'visit', label: 'Visit a place', icon: '📍', neon: '#4ade80' },
  { id: 'food', label: 'Get food / drink', icon: '🍜', neon: '#fb923c' },
  { id: 'comfort', label: 'Comfort / cool me', icon: '♥', neon: '#f9a8d4' },
  { id: 'press', label: 'Write in The Press', icon: '▤', neon: '#f472b6' },
  { id: 'meetup', label: 'Meet up', icon: '👤', neon: '#a78bfa' },
  { id: 'hobby', label: 'Develop a hobby', icon: '✦', neon: '#e879f9' },
  { id: 'photos', label: 'Take photos of…', icon: '📷', neon: '#38bdf8' },
  { id: 'video', label: 'Make a video of…', icon: '🎬', neon: '#f97316' },
  { id: 'friend', label: 'Make a new friend', icon: '🤝', neon: '#34d399' },
  { id: 'book', label: 'Read a book', icon: '▣', neon: '#a78bfa' },
  { id: 'film', label: 'Watch a film', icon: '▶', neon: '#f43f8e' },
  { id: 'mandarin', label: 'Mandarin challenge', icon: '文', neon: '#dc2626' },
  { id: 'fitness', label: 'Workout / steps', icon: '⚡', neon: '#ef4444' },
  { id: 'explore', label: 'Explore somewhere new', icon: '🗺', neon: '#2dd4bf' },
  { id: 'cook', label: 'Cook something', icon: '🍳', neon: '#fbbf24' },
  { id: 'music', label: 'Song / playlist quest', icon: '♫', neon: '#f472b6' },
  { id: 'style', label: 'Outfit / style challenge', icon: '◇', neon: '#fcd34d' },
  { id: 'kindness', label: 'Random kindness', icon: '★', neon: '#f9a8d4' },
  { id: 'chaos', label: 'Chaos / piss me off', icon: '☠', neon: '#f87171' },
  { id: 'book_rec', label: 'Book recommendation', icon: '📖', neon: '#a78bfa' },
  { id: 'film_rec', label: 'Film recommendation', icon: '🎞', neon: '#f43f8e' },
  { id: 'tv_rec', label: 'TV recommendation', icon: '📺', neon: '#818cf8' },
  { id: 'album_rec', label: 'Album recommendation', icon: '💿', neon: '#e879f9' },
  { id: 'song_rec', label: 'Song recommendation', icon: '♫', neon: '#f472b6' },
  { id: 'skill_rec', label: 'Skill / hobby recommendation', icon: '✦', neon: '#c084fc' },
  { id: 'rec', label: 'Book/film recommendation (legacy)', icon: '📚', neon: '#c084fc' },
  { id: 'other', label: 'Anything goes', icon: '✧', neon: '#3ad6e0' },
];

const QUEST_REC_MAP = {
  book: ['book', 'book_rec'],
  film: ['film', 'film_rec'],
  tv: ['tv_rec'],
  album: ['album_rec'],
  song: ['music', 'song_rec'],
  skill: ['hobby', 'fitness', 'mandarin', 'cook', 'skill_rec'],
  press: ['press'],
  place: ['visit', 'explore', 'food'],
};

function inferQuestRecCategory(quest){
  const type = quest?.type || 'other';
  for(const [cat, types] of Object.entries(QUEST_REC_MAP)){
    if(types.includes(type)) return cat;
  }
  if(type === 'rec'){
    const blob = `${quest.title || ''} ${quest.body || ''}`.toLowerCase();
    if(/tv|series|show|episode|season/.test(blob)) return 'tv';
    if(/album|lp\b/.test(blob)) return 'album';
    if(/song|track|playlist|single/.test(blob)) return 'song';
    if(/book|novel|read\b|author/.test(blob)) return 'book';
    if(/film|movie|cinema/.test(blob)) return 'film';
    if(/skill|hobby|learn|practice|try/.test(blob)) return 'skill';
    return 'book';
  }
  return null;
}

function getQuestRecommendations(category){
  return (state.quests || []).filter(q => {
    if(q.status === 'declined') return false;
    return inferQuestRecCategory(q) === category;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function renderCategoryRecommendationsHtml(category, sectionLabel){
  const recs = getQuestRecommendations(category);
  if(!recs.length) return '';
  return `<aside class="category-recs sketch-card" style="--cr-neon:${stableNeon(category, 3)}">
    <h4 class="category-recs-title">Coder recommendations · ${esc(sectionLabel)}</h4>
    <p class="category-recs-hint">Quests from the deck — what coders want me to try</p>
    <ul class="category-recs-list">${recs.map(q => {
      const st = QUEST_STATUS[q.status] || QUEST_STATUS.submitted;
      return `<li class="category-rec-item">
        <div class="category-rec-head">
          <strong>${esc(q.title)}</strong>
          <span class="category-rec-status" style="--qs-neon:${st.neon}">${st.label}</span>
        </div>
        <span class="category-rec-from">from ${esc(q.fromName || 'Coder')}</span>
        <p>${esc((q.body || '').slice(0, 200))}${(q.body || '').length > 200 ? '…' : ''}</p>
        ${q.place ? `<span class="category-rec-meta">📍 ${esc(q.place)}</span>` : ''}
      </li>`;
    }).join('')}</ul>
  </aside>`;
}

function getLoggedInCoderDisplayName(){
  const card = getMyCoderCard();
  if(card?.name) return card.name;
  const id = getCoderSessionId();
  if(id){
    const byId = getCoderById(id);
    if(byId?.name) return byId.name;
    const deck = typeof getCharacters === 'function' ? getCharacters() : [];
    const deckC = deck.find(c => c.id === id);
    if(deckC?.name) return deckC.name;
  }
  try{
    return sessionStorage.getItem('ga-coder-display-name') || '';
  }catch(e){
    return '';
  }
}

function getCoderWelcomeAccent(){
  const card = getMyCoderCard();
  const raw = card?.pokeCard?.cardColor || card?.cardColor || '#4ade80';
  return typeof toNeonAccent === 'function' ? (toNeonAccent(raw) || raw) : raw;
}

function displayInboxName(name){
  if(!name) return 'Someone';
  if(name === 'Player Gray' || name === 'Player grey') return 'Gray';
  return name;
}

function renderCoderWelcomeBar(){
  const host = document.getElementById('coderWelcomeBar');
  if(!host) return;
  if(isAdmin()){
    host.innerHTML = `<div class="coder-welcome-bar is-gray"><span class="coder-welcome-kicker">// logged in</span><span class="coder-welcome-text">Welcome back, <strong>Player Gray</strong></span></div>`;
    host.classList.remove('hidden');
    return;
  }
  if(isCoderLoggedIn()){
    const name = getLoggedInCoderDisplayName() || 'Coder';
    const neon = getCoderWelcomeAccent();
    const cardId = getCoderSessionId();
    const rank = typeof getCoderXpRank === 'function' ? getCoderXpRank(cardId) : null;
    const rankNeon = typeof getCoderRankNeon === 'function' ? getCoderRankNeon(rank) : null;
    const rankHtml = rank && rank <= 3 && rankNeon
      ? `<span class="coder-welcome-rank" style="--rank-neon:${esc(rankNeon)}">#${rank}</span>`
      : rank
        ? `<span class="coder-welcome-rank is-plain">Rank #${rank}</span>`
        : '';
    host.innerHTML = `<div class="coder-welcome-bar" style="--coder-neon:${esc(neon)}"><span class="coder-welcome-kicker">// logged in</span><span class="coder-welcome-text">Welcome back, Coder: <strong>${esc(name)}</strong>${rankHtml}</span></div>`;
    host.classList.remove('hidden');
    return;
  }
  host.classList.add('hidden');
  host.innerHTML = '';
}

const QUEST_STATUS = {
  submitted: { label: 'Submitted', neon: '#94a3b8' },
  accepted: { label: 'Accepted', neon: '#3ad6e0' },
  in_progress: { label: 'In progress', neon: '#fbbf24' },
  completed: { label: 'Completed', neon: '#4ade80' },
  declined: { label: 'Declined', neon: '#f87171' },
};

function isCoderLoggedIn(){
  return !!getCoderSessionId() && !isGuest();
}

function canInteract(){
  return isAdmin() || isCoderLoggedIn();
}

function splitListInput(text){
  return (text || '').split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
}

function pickMostUnique(items){
  if(!items.length) return '';
  const scored = items.map((item, i) => ({
    item,
    score: item.split(/\s+/).length * 2 + Math.min(item.length, 40) * 0.1 + i * 0.05,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].item;
}

function titleFromPhrase(phrase, fallback){
  if(!phrase) return fallback;
  const words = phrase.split(/\s+/).filter(Boolean).slice(0, 4);
  const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return name.length > 32 ? name.slice(0, 32) : name || fallback;
}

function deriveCardStats(form){
  const strengths = splitListInput(form.strengths);
  const weaknesses = splitListInput(form.weaknesses);
  const resistances = splitListInput(form.resistances);
  const s = pickMostUnique(strengths) || form.strengths?.trim() || '';
  const w = pickMostUnique(weaknesses) || form.weaknesses?.trim() || '';
  const r = pickMostUnique(resistances) || form.resistances?.trim() || '';
  const vibe = form.vibe?.trim() || '';
  const spirit = form.spiritAnimal?.trim() || '';
  const title = form.title?.trim() || '';
  const wLow = w.toLowerCase();

  const abilityName = titleFromPhrase(s, spirit ? `${spirit} Instinct` : 'Core Trait');
  let abilityEffect = 'I\'ll fill this in when I spot the blank.';
  if(s){
    if(/social|adapt|chameleon/i.test(s + ' ' + vibe + ' ' + spirit)){
      abilityEffect = `Passive — ${s}. You read the room and blend in; opponents struggle to isolate you as a threat.`;
    } else {
      abilityEffect = `${s} is your edge — when the board gets heavy, you steady the room.`;
    }
  } else if(vibe){
    abilityEffect = vibe;
  }

  const weaknessName = titleFromPhrase(w, 'Soft Spot');
  let weaknessEffect = 'I\'ll fill this in when I spot the blank.';
  if(w){
    weaknessEffect = /fringe/i.test(wLow)
      ? `Fringe Phobia — double impact from opponents with fringe aesthetics; your focus shatters.`
      : `${weaknessName} — double damage from ${wLow}; high-pressure days hit harder.`;
  }

  const resistanceName = titleFromPhrase(r, title ? `The ${title}` : 'Natural Shield');
  let resistanceEffect = 'I\'ll fill this in when I spot the blank.';
  if(r){
    resistanceEffect = /rock|time|ground|solid/i.test(r)
      ? `Rock-solid — immune to intimidation and pressure tactics. ${r} does not move you.`
      : `Immune to ${r.toLowerCase()} — you shrug off what would bend others.`;
  }

  const extraMoves = strengths.filter(x => x !== s).slice(0, 2).map(str => ({
    name: titleFromPhrase(str, 'Bonus Move'),
    effect: `Channel ${str.toLowerCase()} — tactical edge when I need it.`,
  }));

  return {
    ability: { name: abilityName, effect: abilityEffect },
    weakness: { name: weaknessName, effect: weaknessEffect },
    resistance: { name: resistanceName, effect: resistanceEffect },
    extraMoves,
  };
}

function getCoderById(id){
  return (state.viewerCharacters || []).find(c => c.id === id) || null;
}

const GRAY_LOGIN_DAY_KEY = 'ga-gray-login-day';

function tryPlayerLogin(name, key){
  if(normalizeCoderName(name) !== PLAYER_LOGIN_NAME) return false;
  if((key || '').trim() !== PLAYER_LOGIN_KEY) return false;
  hideEntryGate();
  if(typeof unlockAdmin === 'function'){
    unlockAdmin({ toast: false, view: 'sync', welcome: false });
  }
  if(typeof notifyGrayCoderBirthdays === 'function') notifyGrayCoderBirthdays();
  return true;
}

function getTodayBirthdayCoders(){
  return (state.viewerCharacters || []).filter(c => c?.birthday && isBirthdayToday(c.birthday));
}

function notifyGrayCoderBirthdays(){
  if(!isAdmin()) return;
  const bdays = getTodayBirthdayCoders();
  if(!bdays.length) return;
  try{
    const key = 'ga-gray-bday-alert:' + (typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10));
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  }catch(e){}
  const names = bdays.map(c => c.name).join(', ');
  if(typeof logCoderActivity === 'function'){
    bdays.forEach(c => logCoderActivity('birthday_today', { coderId: c.id, name: c.name, detail: `${c.name}'s birthday today — award 150 XP` }));
  }
  const toast = document.getElementById('editToast');
  if(toast){
    toast.textContent = `Birthday today: ${names}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast?.classList.add('hidden'), 5000);
  }
  if(typeof renderCoderNotifyRail === 'function') renderCoderNotifyRail();
}

function ensureViewerState(){
  if(!state.viewerCharacters) state.viewerCharacters = [];
  if(!state.quests) state.quests = [];
  if(!state.videoDiary) state.videoDiary = [];
  if(!state.inboxMessages) state.inboxMessages = [];
  if(!state.xpRequests) state.xpRequests = [];
}

function getInboxUserId(){
  if(isAdmin()) return GRAY_INBOX_ID;
  return getCoderSessionId() || '';
}

function getInboxUserName(){
  if(isAdmin()) return 'Gray';
  const card = getMyCoderCard();
  return card?.name || getLoggedInCoderDisplayName() || 'Coder';
}

function getInboxMessages(){
  return state.inboxMessages || [];
}

function getInboxForUser(userId){
  if(!userId) return [];
  return getInboxMessages()
    .filter(m => m.toId === userId || m.fromId === userId)
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''));
}

function getUnreadInboxForUser(userId){
  if(!userId) return [];
  return getInboxMessages().filter(m =>
    m.toId === userId && !(m.readBy || []).includes(userId),
  );
}

function getInboxableCoders(){
  const seen = new Set();
  const out = [];
  (state.viewerCharacters || []).forEach(c => {
    if(!c?.id || seen.has(c.id)) return;
    seen.add(c.id);
    out.push(c);
  });
  if(typeof getCharacters === 'function'){
    getCharacters().forEach(c => {
      if(!c?.id || seen.has(c.id)) return;
      seen.add(c.id);
      out.push(c);
    });
  }
  return out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getXpRequestOptionsHtml(selected){
  return Object.entries(XP_AWARDS)
    .filter(([k, v]) => !v.auto && k !== 'custom' && k !== 'login')
    .map(([k, v]) => `<option value="${k}"${selected === k ? ' selected' : ''}>${esc(v.label)}</option>`)
    .join('');
}

function getPendingXpRequests(){
  return (state.xpRequests || []).filter(r => r.status === 'pending');
}

function updateInboxBadge(){
  const userId = typeof getInboxUserId === 'function' ? getInboxUserId() : '';
  const n = userId && typeof getUnreadInboxForUser === 'function' ? getUnreadInboxForUser(userId).length : 0;
  ['inboxBadge', 'inboxFabBadge'].forEach(id => {
    const badge = document.getElementById(id);
    if(!badge) return;
    badge.textContent = n ? String(n) : '';
    badge.classList.toggle('has-signals', n > 0);
    badge.classList.toggle('hidden', !n);
  });
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

function isCreatingCard(){
  try{ return sessionStorage.getItem(CREATING_CARD_KEY) === '1'; }catch(e){ return false; }
}

function isSiteUnlocked(){
  return isAdmin() || !!getCoderSessionId() || isGuest() || isCreatingCard();
}

function enterCardCreationMode(){
  try{ sessionStorage.setItem(CREATING_CARD_KEY, '1'); }catch(e){}
  clearGuestMode();
  enterMainSite();
  navigateToView('viewer-card');
  applyAdminUI?.();
  ViewerWorld.renderAll();
}

function clearCardCreationMode(){
  try{ sessionStorage.removeItem(CREATING_CARD_KEY); }catch(e){}
}

function enterGuestMode(){
  clearCardCreationMode();
  try{
    sessionStorage.setItem(GUEST_SESSION_KEY, '1');
    sessionStorage.removeItem(CODERS_SESSION_KEY);
  }catch(e){}
  sessionStorage.removeItem('ga-admin');
  enterMainSite();
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
  body.innerHTML = `<p>It's your birthday. I owe you cake eventually.</p>
    <p class="birthday-xp">Birthday XP is <strong>150</strong> — I'll award it when I see this.</p>`;
  back.classList.remove('hidden');
}

function showWelcomePlayer(){
  const name = typeof getPlayer === 'function' ? (getPlayer().name || 'Gray') : 'Gray';
  const back = document.getElementById('welcomeBack');
  back?.classList.add('welcome-modal--player');
  showWelcomeModal(
    `Welcome, Player: ${name}`,
    '<p class="welcome-player-tag">Full board control unlocked.</p><p>Quest inbox, daily log, live to-do, coder XP — all yours. Go play.</p>',
    { onDismiss: () => {
      back?.classList.remove('welcome-modal--player');
      if(typeof showUnreadInboxPopup === 'function') showUnreadInboxPopup(GRAY_INBOX_ID);
    }},
  );
}

function showWelcomeCoder(card){
  const pts = typeof isNickOrGod === 'function' && isNickOrGod(card) ? '∞' : (card.points || 0);
  showWelcomeModal(
    `Welcome back, Coder: ${card.name}`,
    `<p class="welcome-xp">XP: <strong>${pts}</strong></p><p>You're in. Send quests, post on Community, edit My Card anytime.</p>`,
    { onDismiss: () => {
      showBirthdayCelebration(card);
      showUnreadInboxPopup(card.id);
    }},
  );
}

function showUnreadInboxPopup(userId){
  const unread = getUnreadInboxForUser(userId);
  if(!unread.length) return;
  try{
    const key = 'ga-inbox-popup:' + userId;
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  }catch(e){}
  const preview = unread.slice(0, 3).map(m =>
    `<div class="inbox-popup-msg"><strong>${esc(displayInboxName(m.fromName))}</strong><p>${esc((m.body || '').slice(0, 160))}${(m.body || '').length > 160 ? '…' : ''}</p></div>`,
  ).join('');
  const more = unread.length > 3 ? `<p class="field-hint">+ ${unread.length - 3} more in your inbox</p>` : '';
  showWelcomeModal(
    unread.length === 1 ? 'New message for you' : `${unread.length} new messages`,
    `${preview}${more}`,
    { onDismiss: () => {
      markInboxRead(userId, unread.map(m => m.id));
      if(typeof openInboxDrawer === 'function') openInboxDrawer();
    }},
  );
}

async function markInboxRead(userId, ids){
  if(!userId || !ids?.length) return;
  const local = getInboxMessages();
  ids.forEach(id => {
    const m = local.find(x => x.id === id);
    if(!m || m.toId !== userId) return;
    if(!m.readBy) m.readBy = [];
    if(!m.readBy.includes(userId)) m.readBy.push(userId);
  });
  saveState();
  await postVisitorData('markMessagesRead', { readerId: userId, ids });
  if(typeof updateInboxBadge === 'function') updateInboxBadge();
  if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderInbox?.();
}

function unlockCoderSession(cardId, opts = {}){
  clearGuestMode();
  clearCardCreationMode();
  try{ sessionStorage.removeItem('ga-admin'); }catch(e){}
  const card = (state.viewerCharacters || []).find(c => c.id === cardId);
  try{ sessionStorage.setItem(CODERS_SESSION_KEY, cardId); }catch(e){}
  try{
    if(card?.name) sessionStorage.setItem('ga-coder-display-name', card.name);
  }catch(e){}
  enterMainSite();
  awardLoginPoints(cardId);
  if(opts.welcome !== false && card) showWelcomeCoder(card);
  else if(card) showBirthdayCelebration(card);
  applyAdminUI?.();
  if(typeof navigateToView === 'function') navigateToView(opts.view || 'sync');
  ViewerWorld.renderAll();
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
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
  if(tryPlayerLogin(name, key)) return true;
  const card = findCoderByNameAndKey(name, key);
  if(!card) return false;
  unlockCoderSession(card.id);
  return true;
}

function tryCoderLoginFromConsole(input){
  const raw = (input || '').trim();
  if(!raw) return false;
  if(raw === ':)'){
    return tryPlayerLogin('Gray', ':)');
  }
  const sep = raw.indexOf('::');
  if(sep < 0) return false;
  const name = raw.slice(0, sep).trim();
  const key = raw.slice(sep + 2).trim();
  return tryCoderLogin(name, key);
}

function coderLevelFromPoints(points){
  const pts = points || 0;
  const level = Math.floor(pts / 100);
  const progress = (pts % 100) / 100;
  const xpToNext = pts % 100 === 0 ? 100 : 100 - (pts % 100);
  return { level, points: pts, progress, xpToNext };
}

function renderCoderXpGuide(){
  const autoRows = Object.entries(XP_AWARDS)
    .filter(([, v]) => v.auto && v.xp)
    .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
    .map(([, v]) => `<li><strong>+${v.xp} XP</strong> · ${esc(v.label)}</li>`)
    .join('');
  const bonusRows = Object.entries(XP_AWARDS)
    .filter(([k, v]) => !v.auto && k !== 'custom' && v.xp)
    .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
    .map(([, v]) => `<li><strong>+${v.xp} XP</strong> · ${esc(v.label)}</li>`)
    .join('');
  return `<section class="coder-level-guide sketch-card">
    <h3 class="viewer-wizard-title">XP &amp; the deck</h3>
    <p class="field-hint">This is a <strong>competition for fun</strong> — not a life score. Whoever ranks <strong>#1 on the Coder Cards deck</strong> gets a present from me eventually (TBD what). Levels are just flair: you start at <strong>Lv 0</strong>, then <strong>+1 level every 100 XP</strong>. #1, #2, #3 glow on the board.</p>
    <p class="gray-xp-formula">Level = floor(XP ÷ 100) · Lv 0 at 0 XP · Lv 1 at 100 XP · next level in <span id="coderXpToNext">—</span> XP</p>

    <h4 class="xp-guide-subhead">Automatic XP</h4>
    <p class="field-hint">The site awards these when you do the thing — quests, posts, messages, card edits, all of it.</p>
    <ul class="coder-level-list">${autoRows}</ul>

    ${bonusRows ? `<h4 class="xp-guide-subhead">Bonus XP</h4>
    <p class="field-hint">Off-site stuff — met up, calls, recs I actually consumed, birthdays. Use the form below and tell me what happened.</p>
    <ul class="coder-level-list coder-xp-full">${bonusRows}</ul>` : ''}
  </section>`;
}

function renderGrayMyCardGuide(){
  const grayRules = typeof getGrayVaultXpRules === 'function'
    ? getGrayVaultXpRules()
    : (typeof GRAY_XP_AWARDS !== 'undefined'
      ? Object.entries(GRAY_XP_AWARDS).filter(([k]) => k !== 'custom').map(([key, v]) => ({ id: key, label: v.label, xp: v.xp, note: '' }))
      : []);
  const ruleRows = grayRules
    .map(r => `<li><strong>+${r.xp || 0} XP</strong> · ${esc(r.label)}${r.note ? ` — <span class="field-hint">${esc(r.note)}</span>` : ''}</li>`)
    .join('');
  const grayActions = [
    { label: 'Daily log & calendar', note: 'Seal days, mood, steps, diary, people, places.' },
    { label: 'Coming To You Live', note: 'Pulses, live to-do, video diary notes.' },
    { label: 'Quest inbox', note: 'Accept, complete, or decline coder missions.' },
    { label: 'Award coder XP', note: 'Quest rail + admin panels — deck ranks update.' },
    { label: 'Community board', note: 'Post as Player Gray — permanent pins.' },
    { label: 'Private inbox', note: 'Reply to coders, handle XP requests — ✉ bottom-right.' },
    { label: 'The Press', note: 'Write, tag, and publish pieces.' },
    { label: 'Photo Wall & places', note: 'New cards, gallery stories, unlocked zones.' },
    { label: 'Media deck', note: 'Rate units, write final reviews.' },
    { label: 'Skill towers', note: 'Log hobby hours — ties into Rewards Vault goals.' },
    { label: 'System Overload', note: 'Private vent/body logs — archive sessions.' },
    { label: 'Coder signals rail', note: 'Watch quests, posts, logins, XP activity.' },
    { label: 'Rewards Vault', note: '★ bottom-right — your private goals & treats.' },
  ];
  const actionRows = grayActions.map(a => `<li><strong>${esc(a.label)}</strong> — ${esc(a.note)}</li>`).join('');
  const pts = typeof getGrayPoints === 'function' ? getGrayPoints() : 0;
  const lvl = typeof grayLevelFromPoints === 'function' ? grayLevelFromPoints(pts) : { level: 0, xpToNext: 100 };
  return `<div class="gray-mycard-guide">
    <section class="coder-level-guide sketch-card">
      <h3 class="viewer-wizard-title">Player Gray · your XP</h3>
      <p class="field-hint">Separate from the coder competition — this tracks <strong>you</strong> running the board. <strong>Lv ${lvl.level}</strong> · <strong>${pts} XP</strong> · ${lvl.xpToNext} XP to next level. Full rulebook in <button type="button" class="btn inline-linkish" id="grayGuideOpenVault">Rewards Vault ★</button>.</p>
      <p class="gray-xp-formula">Level = floor(XP ÷ 100) · Lv 0 at 0 XP · Lv 1 at 100 XP</p>

      <h4 class="xp-guide-subhead">How you earn XP</h4>
      <ul class="coder-level-list">${ruleRows}</ul>

      <h4 class="xp-guide-subhead">Everything you can do on the site</h4>
      <ul class="coder-level-list coder-interact-list">${actionRows}</ul>
    </section>
  </div>`;
}

function shouldShowInstructionsNav(){
  if(isAdmin()) return true;
  if(isGuest()) return true;
  if(!getMyCoderCard()) return true;
  return false;
}

function defaultViewForSession(){
  if(isAdmin()) return 'sync';
  if(getMyCoderCard()) return 'sync';
  if(isGuest() || !getMyCoderCard()) return 'instructions';
  return 'sync';
}

function awardGrayLoginPoints(){
  if(typeof awardGrayPoints !== 'function') return;
  try{
    const today = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
    if(sessionStorage.getItem(GRAY_LOGIN_DAY_KEY) === today) return;
    sessionStorage.setItem(GRAY_LOGIN_DAY_KEY, today);
    awardGrayPoints(GRAY_XP_AWARDS.login.xp, 'login');
  }catch(e){}
}

function ensureCoderXpRecord(characterId){
  ensureViewerState();
  let c = state.viewerCharacters.find(x => x.id === characterId);
  if(c) return c;
  const deck = typeof getCharacters === 'function' ? getCharacters() : [];
  const deckC = deck.find(x => x.id === characterId);
  if(!deckC) return null;
  c = {
    ...deckC,
    isCoderCard: true,
    points: deckC.points || 0,
    consoleKey: deckC.consoleKey || '',
    xpHistory: deckC.xpHistory || [],
  };
  state.viewerCharacters.push(c);
  saveState();
  return c;
}

function awardCoderPoints(characterId, amount, reason){
  if(!amount) return;
  const c = ensureCoderXpRecord(characterId);
  if(!c) return;
  c.points = (c.points || 0) + amount;
  const lvl = coderLevelFromPoints(c.points);
  if(c.pokeCard) c.pokeCard.level = lvl.level;
  if(reason === 'quest_complete') c.questsCompleted = (c.questsCompleted || 0) + 1;
  if(reason === 'quest_submit') c.questsSent = (c.questsSent || 0) + 1;
  const label = XP_AWARDS[reason]?.label || (reason === 'custom' ? 'Custom XP' : String(reason || 'XP'));
  if(!c.xpHistory) c.xpHistory = [];
  c.xpHistory.unshift({
    id: uid('xp'),
    at: new Date().toISOString(),
    amount,
    reason: reason || 'custom',
    label,
  });
  logCoderActivity('xp_award', {
    coderId: characterId,
    name: c.name,
    detail: `${c.name} +${amount} XP · ${label}`,
    amount,
    reason,
  });
  saveState();
  postVisitorData('updateCharacter', c);
}

function awardLoginPoints(cardId){
  if(!cardId) return;
  try{
    const today = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
    const key = `${CODERS_LOGIN_DAY_KEY}:${cardId}`;
    if(sessionStorage.getItem(key) === today) return;
    sessionStorage.setItem(key, today);
    awardCoderPoints(cardId, XP_AWARDS.login.xp, 'login');
  }catch(e){}
}

function getAwardableCoders(){
  const grayId = typeof getPlayer === 'function' ? getPlayer()?.id : '';
  return (typeof getCharacters === 'function' ? getCharacters() : [])
    .filter(c => c.id !== grayId && normalizeCoderName(c.name) !== PLAYER_LOGIN_NAME)
    .sort((a, b) => (b.points || 0) - (a.points || 0));
}

function buildCoderCardFromWizard(form, existing){
  const stats = deriveCardStats(form);
  const paletteName = form.paletteName?.trim() || '';
  const picked = form.cardColor || '#4ade80';
  const neonBorder = typeof toNeonAccent === 'function' ? (toNeonAccent(picked) || picked) : picked;
  const base = existing || {};

  return {
    ...base,
    id: base.id || uid('coder'),
    isCoderCard: true,
    createdAt: base.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locked: true,
    consoleKey: normalizeCoderKey(form.consoleKey || base.consoleKey),
    name: (form.name || '').trim() || base.name || 'Coder',
    birthday: form.birthday?.trim() || base.birthday || '',
    cardSubtitle: form.title?.trim() || base.cardSubtitle || '',
    age: form.age?.trim() || base.age || '',
    mbti: form.mbti?.trim() || base.mbti || '',
    hairColor: form.hairColor?.trim() || base.hairColor || '',
    skinColor: form.skinColor?.trim() || base.skinColor || '',
    eyeColor: form.eyeColor?.trim() || base.eyeColor || '',
    spiritAnimal: form.spiritAnimal?.trim() || base.spiritAnimal || '',
    selfDescription: form.selfDescription?.trim() || base.selfDescription || '',
    strengths: form.strengths?.trim() || base.strengths || '',
    weaknesses: form.weaknesses?.trim() || base.weaknesses || '',
    resistances: form.resistances?.trim() || base.resistances || '',
    vibe: form.vibe?.trim() || base.vibe || '',
    quote: form.quote?.trim() || base.quote || '',
    points: base.points || 0,
    questsSent: base.questsSent || 0,
    questsCompleted: base.questsCompleted || 0,
    cardColor: neonBorder,
    image: base.image || '',
    avatar: base.avatar || '',
    lookPrompt: form.selfDescription?.trim() || base.lookPrompt || '',
    cardDescription: base.cardDescription || '',
    pokeCard: {
      ...(base.pokeCard || {}),
      level: base.pokeCard?.level || 1,
      mbti: form.mbti?.trim() || base.pokeCard?.mbti || '',
      spiritPrompt: form.spiritAnimal?.trim() || base.pokeCard?.spiritPrompt || '',
      colorPalette: paletteName || base.pokeCard?.colorPalette || '',
      cardColor: neonBorder,
      vibe: form.vibe?.trim() || base.pokeCard?.vibe || '',
      subtitle: form.title?.trim() || base.pokeCard?.subtitle || '',
      abilities: [{ name: stats.ability.name, effect: stats.ability.effect }],
      moves: stats.extraMoves || [],
      weakness: stats.weakness,
      resistance: stats.resistance,
      retreatCost: base.pokeCard?.retreatCost || '1',
      quote: form.quote?.trim() || base.pokeCard?.quote || '',
      birthday: form.birthday?.trim() || base.pokeCard?.birthday || '',
      spiritAnimalImage: base.pokeCard?.spiritAnimalImage || '',
    },
  };
}

function buildPersonalityPrompt(card){
  const ability = card.pokeCard?.abilities?.[0];
  const weakness = card.pokeCard?.weakness;
  const resistance = card.pokeCard?.resistance;
  const lines = [
    `Name: ${card.name || 'Coder'}`,
    card.vibe ? `Vibe: ${card.vibe}` : '',
    card.mbti ? `MBTI: ${card.mbti}` : '',
    ability?.name ? `Strength: ${ability.name}` : '',
    weakness?.name ? `Weakness: ${weakness.name}` : '',
    resistance?.name ? `Resistance: ${resistance.name}` : '',
    card.quote ? `Quote: ${card.quote}` : '',
    card.strengths ? `Strengths list: ${card.strengths}` : '',
    card.weaknesses ? `Weaknesses list: ${card.weaknesses}` : '',
    card.resistances ? `Resistances list: ${card.resistances}` : '',
  ].filter(Boolean);
  return `Write one very short personality tagline for a trading card front (max 12 words). How they come across — not what they look like.\n\n${lines.join('\n')}`;
}

function fallbackPersonalityBlurb(card){
  const ability = card.pokeCard?.abilities?.[0]?.name;
  const weakness = card.pokeCard?.weakness?.name;
  const bits = [card.vibe, ability && `known for ${ability}`, weakness && `weak to ${weakness}`].filter(Boolean);
  if(card.quote?.trim()) return card.quote.trim().slice(0, 72);
  if(bits.length) return `${card.name} — ${bits.slice(0, 2).join(', ')}.`.slice(0, 80);
  return `${card.name || 'Coder'} — still finding their legend.`;
}

function cleanPersonalityBlurb(text){
  let t = (text || '').trim().replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, ' ');
  t = t.replace(/^(here('|')?s|sure|okay)[^:]*:\s*/i, '');
  if(t.length > 90) t = t.slice(0, 87).trim() + '…';
  return t;
}

async function generateCoderCardDescription(card){
  const prompt = buildPersonalityPrompt(card);
  const system = 'You write ultra-short trading-card taglines. Return only one sentence, max 12 words. Personality and energy only — never hair, eyes, skin, body, clothes, or physical looks.';
  try{
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(system)}&model=openai-fast`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if(!res.ok) throw new Error('Text gen failed');
    const text = cleanPersonalityBlurb(await res.text());
    if(text) card.cardDescription = text;
    else card.cardDescription = fallbackPersonalityBlurb(card);
  }catch(e){
    console.warn('Card description gen:', e);
    card.cardDescription = fallbackPersonalityBlurb(card);
  }
  return card;
}

async function generateCoderCardImages(card, opts = {}){
  if(typeof CharGen === 'undefined') return card;
  const onStep = typeof opts.onStep === 'function' ? opts.onStep : () => {};
  const neonEye = card.eyeColor?.trim()
    ? `neon glowing ${card.eyeColor} eyes, luminous anime eyes`
    : 'neon glowing cyan eyes, luminous anime eyes';
  const portraitDesc = [
    card.selfDescription,
    card.hairColor && `hair: ${card.hairColor}`,
    card.skinColor && `skin: ${card.skinColor}`,
    neonEye,
    card.name,
  ].filter(Boolean).join(', ');
  try{
    if(opts.portrait !== false){
      onStep('portrait', 'active', 'Painting your portrait… this can take a minute. Stay here.');
      card.image = await CharGen.generatePortrait(portraitDesc || card.name || 'coder');
      card.avatar = card.image;
      onStep('portrait', 'done', 'Portrait sealed.');
    }
    if(opts.spirit !== false && card.spiritAnimal){
      onStep('spirit', 'active', `Summoning ${card.spiritAnimal}… almost there.`);
      card.pokeCard.spiritAnimalImage = await CharGen.generateSpirit(card.spiritAnimal);
      onStep('spirit', 'done', 'Spirit animal arrived.');
    } else if(opts.spirit !== false){
      onStep('spirit', 'skip', 'No spirit animal — skipped.');
    }
  }catch(e){
    console.warn('Coder card image gen:', e);
    onStep('error', 'fail', 'Image generation hiccuped — save your card and try Regenerate later.');
  }
  return card;
}

function cardGenProgressHtml(){
  return `<div class="card-gen-progress sketch-card" id="cardGenProgress">
    <h3 class="viewer-wizard-title">Summoning your Coders Card…</h3>
    <p class="field-hint">AI is drawing your portrait and spirit animal. This takes a little while — <strong>please wait</strong>, don't refresh.</p>
    <ol class="card-gen-steps">
      <li class="card-gen-step" data-step="portrait"><span class="card-gen-icon">◎</span><span class="card-gen-label">Portrait</span><span class="card-gen-status">waiting…</span></li>
      <li class="card-gen-step" data-step="spirit"><span class="card-gen-icon">◈</span><span class="card-gen-label">Spirit animal</span><span class="card-gen-status">waiting…</span></li>
      <li class="card-gen-step" data-step="desc"><span class="card-gen-icon">✎</span><span class="card-gen-label">Card line</span><span class="card-gen-status">waiting…</span></li>
      <li class="card-gen-step" data-step="seal"><span class="card-gen-icon">★</span><span class="card-gen-label">Seal card</span><span class="card-gen-status">waiting…</span></li>
    </ol>
    <div class="card-gen-pulse" aria-hidden="true"><span></span><span></span><span></span></div>
  </div>`;
}

function updateCardGenProgress(step, state, message){
  const host = document.getElementById('cardGenProgress');
  if(!host) return;
  const row = host.querySelector(`[data-step="${step}"]`);
  if(!row) return;
  row.classList.remove('active', 'done', 'skip', 'fail');
  if(state) row.classList.add(state);
  const status = row.querySelector('.card-gen-status');
  if(status && message) status.textContent = message;
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
  mergeById(state.inboxMessages, remote.inboxMessages);
  mergeById(state.xpRequests, remote.xpRequests);
  const pulses = remote.coderActivityPulses || [];
  pulses.forEach(p => {
    if(!p?.id) return;
    if(!state.coderActivity) state.coderActivity = [];
    if(!state.coderActivity.some(a => a.id === p.id)){
      state.coderActivity.unshift(p);
    }
  });
  state.coderActivity = (state.coderActivity || []).slice(0, 120);
}

async function fetchVisitorData(){
  try{
    const res = await fetch('visitor-data.json?nocache=' + Date.now(), { cache: 'no-store' });
    if(!res.ok) return;
    mergeVisitorDataFile(await res.json());
    saveState();
    ViewerWorld.renderAll();
    maybeShowInboxPopupOnLoad();
  }catch(e){}
}

function maybeShowInboxPopupOnLoad(){
  const userId = getInboxUserId();
  if(!userId || isCreatingCard()) return;
  const unread = getUnreadInboxForUser(userId);
  if(!unread.length) return;
  setTimeout(() => showUnreadInboxPopup(userId), 500);
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

function pinCoderThumb(coderId){
  const c = getCoderById(coderId);
  if(!c) return '';
  const img = c.avatar || c.image;
  const accent = c.cardColor || '#38bdf8';
  return `<button type="button" class="pin-coder-thumb pin-coder-link" data-coder-board-link="${esc(coderId)}" style="--pct-neon:${accent}">
    <div class="pin-coder-frame">${img ? `<img src="${esc(img)}" alt="">` : `<span>${esc((c.name || '?').charAt(0))}</span>`}</div>
    <span class="pin-coder-name">${esc(c.name)}</span>
  </button>`;
}

function cardWizardFieldsHtml(prefix, card, opts = {}){
  const c = card || {};
  const p = prefix ? `${prefix}_` : 'vw_';
  const id = k => p + k;
  const borderColor = c.pokeCard?.cardColor || c.cardColor || '#4ade80';
  const neon = typeof toNeonAccent === 'function' ? (toNeonAccent(borderColor) || borderColor) : borderColor;
  const portraitSrc = opts.portraitPreview || c.image || c.avatar || '';
  const spiritSrc = opts.spiritPreview || c.pokeCard?.spiritAnimalImage || '';

  if(opts.createLayout){
    return `
    <div class="card-wizard-layout">
      <div class="card-wizard-form-col">
        <div class="field">
          <label>Name</label>
          <input type="text" id="${id('Name')}" value="${esc(c.name || '')}" placeholder="your name" required>
        </div>
        <div class="field-row">
          <div class="field"><label>Birthday (optional)</label><input type="date" id="${id('Birthday')}" value="${esc(c.birthday || '')}"></div>
          <div class="field"><label>MBTI (optional)</label><input type="text" id="${id('Mbti')}" value="${esc(c.mbti || '')}" placeholder="optional"></div>
        </div>
        <div class="field card-border-field">
          <label>Border colour</label>
          <div class="card-border-picker-row">
            <input type="color" id="${id('CardColor')}" value="${esc(borderColor)}">
            <div class="card-border-swatch" id="${id('BorderSwatch')}" style="--preview-neon:${esc(neon)}">
              <span class="card-border-swatch-ring"></span>
              <span class="card-border-swatch-label">Neon glow</span>
            </div>
          </div>
        </div>
        <div class="field"><label>Favourite colour</label><input type="text" id="${id('Palette')}" value="${esc(c.pokeCard?.colorPalette || '')}" placeholder="e.g. rose gold, midnight blue…"></div>
        <div class="field-row">
          <div class="field"><label>Hair colour</label><input type="text" id="${id('Hair')}" value="${esc(c.hairColor || '')}" placeholder="optional"></div>
          <div class="field"><label>Skin colour</label><input type="text" id="${id('Skin')}" value="${esc(c.skinColor || '')}" placeholder="optional"></div>
        </div>
        <div class="field"><label>Eye colour</label><input type="text" id="${id('Eyes')}" value="${esc(c.eyeColor || '')}" placeholder="glows neon on your portrait"></div>
        <div class="field card-gen-field">
          <label>Self description (for portrait only)</label>
          <textarea id="${id('SelfDesc')}" rows="4" placeholder="Hair, outfit, vibe — used to draw your portrait, not your card text">${esc(c.selfDescription || '')}</textarea>
          <button type="button" class="btn primary" id="${id('GenPortraitBtn')}">Generate my character</button>
          <p class="field-hint" id="${id('PortraitStatus')}">Describe yourself, then generate your portrait before summoning.</p>
        </div>
        <div class="field card-gen-field">
          <label>Spirit animal (optional)</label>
          <input type="text" id="${id('Spirit')}" value="${esc(c.spiritAnimal || c.pokeCard?.spiritPrompt || '')}" placeholder="e.g. neon fox, crystal owl…">
          <button type="button" class="btn" id="${id('GenSpiritBtn')}">Generate spirit animal</button>
          <p class="field-hint" id="${id('SpiritStatus')}">Optional — generate if you want one on your card.</p>
        </div>
        <div class="field"><label>Vibe (optional)</label><textarea id="${id('Vibe')}" rows="2" placeholder="optional">${esc(c.vibe || c.pokeCard?.vibe || '')}</textarea></div>
        <div class="field"><label>Strengths (optional)</label><textarea id="${id('Strengths')}" rows="2" placeholder="optional">${esc(c.strengths || '')}</textarea></div>
        <div class="field"><label>Weaknesses (optional)</label><textarea id="${id('Weaknesses')}" rows="2" placeholder="optional">${esc(c.weaknesses || '')}</textarea></div>
        <div class="field"><label>Resistances (optional)</label><textarea id="${id('Resistances')}" rows="2" placeholder="optional">${esc(c.resistances || '')}</textarea></div>
        <div class="field"><label>Quote (optional)</label><input type="text" id="${id('Quote')}" value="${esc(c.quote || c.pokeCard?.quote || '')}" placeholder="optional"></div>
      </div>
      <aside class="card-wizard-preview-col">
        <p class="card-preview-kicker">Live preview</p>
        <div class="card-preview-frame" id="${id('PreviewFrame')}" style="--preview-neon:${esc(neon)}">
          <div class="card-preview-portrait" id="${id('PortraitPreview')}">
            ${portraitSrc
              ? `<img src="${esc(portraitSrc)}" alt="Your character">`
              : `<div class="card-preview-placeholder"><span>◎</span><p>Your character image will appear here</p></div>`}
          </div>
          <div class="card-preview-meta">
            <span class="card-preview-name" id="${id('PreviewName')}">${esc(c.name || 'Your name')}</span>
            <span class="card-preview-lv">Lv 1</span>
          </div>
          <div class="card-preview-spirit" id="${id('SpiritPreview')}">
            ${spiritSrc
              ? `<img src="${esc(spiritSrc)}" alt="Spirit animal">`
              : `<span class="card-preview-spirit-ph">Spirit animal</span>`}
          </div>
        </div>
      </aside>
    </div>`;
  }

  return `
    <div class="field"><label>Name</label><input type="text" id="${id('Name')}" value="${esc(c.name || '')}" placeholder="your name"></div>
    <div class="field-row">
      <div class="field"><label>Birthday (optional)</label><input type="date" id="${id('Birthday')}" value="${esc(c.birthday || '')}"></div>
      <div class="field"><label>MBTI (optional)</label><input type="text" id="${id('Mbti')}" value="${esc(c.mbti || '')}" placeholder="optional"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Border colour</label><input type="color" id="${id('CardColor')}" value="${esc(c.pokeCard?.cardColor || '#4ade80')}"><span class="field-hint">Neon border glow only</span></div>
      <div class="field"><label>Favourite colour (optional)</label><input type="text" id="${id('Palette')}" value="${esc(c.pokeCard?.colorPalette || '')}" placeholder="e.g. rose gold, midnight blue…"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Hair colour (optional)</label><input type="text" id="${id('Hair')}" value="${esc(c.hairColor || '')}" placeholder="optional"></div>
      <div class="field"><label>Skin colour (optional)</label><input type="text" id="${id('Skin')}" value="${esc(c.skinColor || '')}" placeholder="optional"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Eye colour (optional)</label><input type="text" id="${id('Eyes')}" value="${esc(c.eyeColor || '')}" placeholder="always rendered neon"><span class="field-hint">Eyes glow neon on your portrait</span></div>
      <div class="field"><label>Spirit animal (optional)</label><input type="text" id="${id('Spirit')}" value="${esc(c.spiritAnimal || c.pokeCard?.spiritPrompt || '')}" placeholder="optional"></div>
    </div>
    <div class="field"><label>Vibe (optional)</label><textarea id="${id('Vibe')}" rows="2" placeholder="optional">${esc(c.vibe || c.pokeCard?.vibe || '')}</textarea></div>
    <div class="field"><label>Strengths (optional)</label><textarea id="${id('Strengths')}" rows="2" placeholder="comma or line separated">${esc(c.strengths || '')}</textarea></div>
    <div class="field"><label>Weaknesses (optional)</label><textarea id="${id('Weaknesses')}" rows="2" placeholder="comma or line separated">${esc(c.weaknesses || '')}</textarea></div>
    <div class="field"><label>Resistances (optional)</label><textarea id="${id('Resistances')}" rows="2" placeholder="what you're immune to">${esc(c.resistances || '')}</textarea></div>
    <div class="field"><label>Quote (optional)</label><input type="text" id="${id('Quote')}" value="${esc(c.quote || c.pokeCard?.quote || '')}" placeholder="optional"></div>
    <div class="field"><label>Self description (for portrait only)</label><textarea id="${id('SelfDesc')}" rows="3" placeholder="used to draw your portrait — not card text">${esc(c.selfDescription || '')}</textarea></div>`;
}

function readCardFormFromDom(prefix, opts = {}){
  const p = prefix ? `${prefix}_` : 'vw_';
  const g = k => document.getElementById(p + k)?.value;
  return {
    name: g('Name'),
    title: g('Title'),
    birthday: g('Birthday'),
    mbti: g('Mbti'),
    cardColor: g('CardColor'),
    paletteName: g('Palette'),
    hairColor: g('Hair'),
    skinColor: g('Skin'),
    eyeColor: g('Eyes'),
    spiritAnimal: g('Spirit'),
    vibe: g('Vibe'),
    strengths: g('Strengths'),
    weaknesses: g('Weaknesses'),
    resistances: g('Resistances'),
    quote: g('Quote'),
    selfDescription: g('SelfDesc'),
    consoleKey: opts.consoleKey || g('ConsoleKey'),
  };
}

function clearAuthSession(){
  try{
    sessionStorage.removeItem('ga-admin');
    sessionStorage.removeItem(CODERS_SESSION_KEY);
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    sessionStorage.removeItem(CREATING_CARD_KEY);
  }catch(e){}
}

function requireLoginScreen(){
  clearAuthSession();
  showEntryGate({ force: true });
}

function showEntryGate(opts = {}){
  if(!opts.force && isSiteUnlocked()) return;
  if(opts.force) clearAuthSession();
  document.getElementById('loginPage')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  document.body.classList.add('login-screen-active');
  document.body.classList.remove('site-unlocked');
}

function enterMainSite(){
  document.getElementById('loginPage')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  document.body.classList.remove('login-screen-active');
  document.body.classList.add('site-unlocked');
}

function hideEntryGate(){
  enterMainSite();
}

function returnToLogin(){
  showEntryGate({ force: true });
  applyAdminUI?.();
}

function showCoderKeyGate(){ showEntryGate(); }
function hideCoderKeyGate(){ hideEntryGate(); }

function questVoteCount(q){
  return Object.keys(q.votes || {}).length;
}

function userVotedQuest(q, cardId){
  return !!(q.votes && cardId && q.votes[cardId]);
}

function getInstructionsHtml(){
  if(state.instructionsHtml) return state.instructionsHtml;
  return buildDefaultInstructionsHtml();
}

function buildDefaultInstructionsHtml(){
  const guestNote = isGuest() ? `<p class="instructions-note">You're browsing as a <strong>guest</strong> — watch mode only.</p>` : '';
  const cardBtn = !getMyCoderCard() && !isGuest() ? `<button type="button" class="btn primary" id="instrGoCard">Make My Card →</button>` : '';
  const questBtn = getMyCoderCard() ? `<button type="button" class="btn primary" id="instrGoQuests">Send a quest →</button>` : '';
  const loginBtn = isGuest() ? `<button type="button" class="btn" id="instrGoLogin">Log in →</button>` : '';
  return `
    <div class="instructions-panel sketch-card instructions-gray-voice">
      <p class="instructions-kicker">Hi!</p>
      <p class="instructions-p">I bet you're wondering what the hell this is. Honestly, it wasn't meant to spiral this far out of control — especially not to the extent of needing an instructions page.</p>
      <p class="instructions-p">This was developed for me to log my life when I'm away from everyone I love and care about. The idea was to completely gamify my life and everything in it. Turns out, that's a little complicated.</p>
      <p class="instructions-p">Originally it was just a way to watch me. I've changed it a bit: you're referred to as <strong>Coders</strong>. Coders can send <strong>quests</strong> if they think I'm not living well enough, or just want to piss me off. You get <strong>25 XP</strong> when you send one, and <strong>75 XP extra</strong> when I complete yours — plus <strong>3 XP</strong> each time you log in (once per day). Posting, messaging, commenting, and editing your card also earn XP automatically. I hand out the rest for meet-ups, calls, birthdays, recs, all that. Whoever ranks <strong>#1 on the deck</strong> gets a present — I don't know what yet.</p>
      <p class="instructions-p"><strong>Levelling:</strong> you start at <strong>Lv 0</strong>. Every <strong>100 XP = +1 level</strong> (Lv 1 at 100 XP, Lv 2 at 200…). The deck sorts by XP — whoever's <strong>#1</strong> gets a present from me. It's competition for fun, not a life score.</p>
      <p class="instructions-p">This is largely based off <em>Ready Player One</em> and <em>Warcross</em> — two books I love very much. I'd recommend reading them if you haven't! Oh also, please send any book/film recommendations as a quest.</p>
      <h3 class="viewer-wizard-title">The sidebar</h3>
      <ul class="instructions-nav-list">
        <li><strong>Instructions</strong> — you're here. hello.</li>
        <li><strong>Player Profile</strong> — me. my stats, mood, hero card.</li>
        <li><strong>Coming To You Live</strong> — what I'm doing right now. to-do list + neon timeline.</li>
        <li><strong>Daily Log</strong> — my days, steps, diary, reflections.</li>
        <li><strong>Place Cards</strong> — places I visit in Shenzhen.</li>
        <li><strong>Coder Cards</strong> — people in my orbit (the deck).</li>
        <li><strong>Skill Cards</strong> — hobbies and skills I'm levelling.</li>
        <li><strong>Media Log</strong> — films, shows, books.</li>
        <li><strong>The Press</strong> — articles and writing.</li>
        <li><strong>Photo Wall</strong> — photos with flip notes.</li>
        <li><strong>Community</strong> — pinboard. log in to post; your card shows on your note.</li>
        <li><strong>My Card</strong> — your Coders Card. make it, edit it, regenerate your look.</li>
        <li><strong>Quests</strong> — send missions. guests can only watch.</li>
        <li><strong>Video Log</strong> — my video notes.</li>
      </ul>
      <h3 class="viewer-wizard-title">Logging in</h3>
      <p class="instructions-p">You don't <em>have</em> to log in — but if you don't, you can only see what I'm doing. No quests, no community posts, no voting. Watch-only.</p>
      <p class="instructions-p">To interact: create <strong>My Card</strong> once (leave blanks if you want — I'll fill gaps when I spot them), pick a unique console key, then log in each visit with <strong>name + key</strong> or the console as <code>Name::key</code>.</p>
      ${guestNote}
      ${cardBtn}
      ${questBtn}
      ${loginBtn}
    </div>`;
}

function logCoderActivity(type, payload = {}){
  if(!state.coderActivity) state.coderActivity = [];
  const entry = {
    id: uid('act'),
    at: new Date().toISOString(),
    type,
    ...payload,
  };
  state.coderActivity.unshift(entry);
  state.coderActivity = state.coderActivity.slice(0, 120);
  saveState();
  postVisitorData('pulseActivity', entry);
  if(typeof renderCoderNotifyRail === 'function') renderCoderNotifyRail();
}

function renderXpHistoryRail(history){
  const items = (history || []).slice();
  if(!items.length){
    return `<p class="empty-hint">No XP logged yet — send quests, post on Community, message me, or request bonus XP below.</p>`;
  }
  return `<div class="live-rail-track xp-history-rail">
    <div class="live-rail-spine" aria-hidden="true"></div>
    <div class="live-rail-nodes">${items.map(entry => {
      const when = entry.at ? new Date(entry.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      return `<article class="live-node" style="--ln-neon:#fbbf24">
        <div class="live-node-marker"><span class="live-node-glow"></span><span class="live-node-core"></span></div>
        <div class="live-node-card">
          <div class="live-node-top">
            <time class="live-node-time">${esc(when)}</time>
            <span class="live-node-type">↑ +${entry.amount || 0} XP</span>
          </div>
          <p class="live-node-text">${esc(entry.label || entry.reason || 'XP')}</p>
        </div>
      </article>`;
    }).join('')}</div>
  </div>`;
}

function bindInstructionsActions(host){
  if(!host) return;
  host.querySelector('#instrGoCard')?.addEventListener('click', () => navigateToView('viewer-card'));
  host.querySelector('#instrGoQuests')?.addEventListener('click', () => navigateToView('quests'));
  host.querySelector('#instrGoLogin')?.addEventListener('click', () => returnToLogin());
}

const ViewerWorld = {
  inited: false,
  pendingVlogFile: null,
  pendingVlogData: '',
  pendingQuestClips: [],
  editingCardId: null,
  playerEditingCoderId: null,
  wizardDraft: { portrait: '', spirit: '' },

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
    document.getElementById('coderGateCreate')?.addEventListener('click', () => enterCardCreationMode());
    document.getElementById('birthdayDismiss')?.addEventListener('click', () => {
      document.getElementById('birthdayBack')?.classList.add('hidden');
    });
    this.bindLoginConsole();
    document.getElementById('questCompleteSave')?.addEventListener('click', () => this.saveQuestComplete());
    document.getElementById('questCompleteClips')?.addEventListener('change', e => {
      this.pendingQuestClips = [...(e.target.files || [])];
    });
    fetchVisitorData().then(() => {
      if(!isSiteUnlocked()) showEntryGate();
      ViewerWorld.renderAll();
    });
  },

  bindLoginConsole(){
    const input = document.getElementById('loginConsoleInput');
    if(!input || input.dataset.bound) return;
    input.dataset.bound = '1';
    const hearts = '<3 <3 <3';
    const reset = () => { input.value = hearts; };
    reset();
    input.addEventListener('focus', () => { if(input.value === hearts) input.select(); });
    input.addEventListener('blur', () => { if(!input.value.trim()) reset(); });
    input.addEventListener('keydown', e => {
      if(e.key !== 'Enter') return;
      e.preventDefault();
      const v = e.target.value.trim();
      if(v === hearts || !v){ reset(); return; }
      if(v === ':)'){
        tryPlayerLogin('Gray', ':)');
        reset();
        return;
      }
      if(tryCoderLoginFromConsole(v)){
        reset();
        return;
      }
      reset();
    });
  },

  submitKeyGate(){
    const name = document.getElementById('coderGateName')?.value?.trim();
    const key = document.getElementById('coderGateKey')?.value?.trim();
    if(!name || !key){
      alert('Enter both your card name and console key.');
      return;
    }
    if(tryPlayerLogin(name, key) || tryCoderLogin(name, key)){
      document.getElementById('coderGateName').value = '';
      document.getElementById('coderGateKey').value = '';
      if(!isAdmin()) navigateToView(defaultViewForSession());
      return;
    }
    alert('No match for that name and key. Continue as guest or make My Card.');
  },

  renderAll(){
    this.renderInstructions();
    this.renderViewerCard();
    this.renderQuests();
    this.renderVlog();
    this.renderInbox();
    if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
    if(typeof updateInboxBadge === 'function') updateInboxBadge();
  },

  wireCardWizardCreate(prefix){
    const p = prefix ? `${prefix}_` : 'vw_';
    const colorInput = document.getElementById(p + 'CardColor');
    const frame = document.getElementById(p + 'PreviewFrame');
    const swatch = document.getElementById(p + 'BorderSwatch');
    const syncBorder = () => {
      const raw = colorInput?.value || '#4ade80';
      const neon = typeof toNeonAccent === 'function' ? (toNeonAccent(raw) || raw) : raw;
      frame?.style.setProperty('--preview-neon', neon);
      swatch?.style.setProperty('--preview-neon', neon);
    };
    colorInput?.addEventListener('input', syncBorder);
    syncBorder();
    document.getElementById(p + 'Name')?.addEventListener('input', e => {
      const el = document.getElementById(p + 'PreviewName');
      if(el) el.textContent = e.target.value.trim() || 'Your name';
    });
    document.getElementById(p + 'GenPortraitBtn')?.addEventListener('click', () => this.generateWizardPortrait(prefix));
    document.getElementById(p + 'GenSpiritBtn')?.addEventListener('click', () => this.generateWizardSpirit(prefix));
  },

  async generateWizardPortrait(prefix){
    const form = readCardFormFromDom(prefix, { consoleKey: '' });
    if(!form.selfDescription?.trim() && !form.name?.trim() && !form.hairColor?.trim()){
      alert('Add a self description (or name + hair) so we know what to draw.');
      return;
    }
    const p = prefix ? `${prefix}_` : 'vw_';
    const btn = document.getElementById(p + 'GenPortraitBtn');
    const status = document.getElementById(p + 'PortraitStatus');
    const preview = document.getElementById(p + 'PortraitPreview');
    if(btn) btn.disabled = true;
    if(status) status.textContent = 'Generating your character… this takes a minute. Please wait.';
    let temp = buildCoderCardFromWizard(form);
    try{
      temp = await generateCoderCardImages(temp, { portrait: true, spirit: false });
      this.wizardDraft.portrait = temp.image || '';
      if(preview && temp.image){
        preview.innerHTML = `<img src="${esc(temp.image)}" alt="Your character">`;
      }
      if(status) status.textContent = 'Character ready — looking good.';
    }catch(e){
      if(status) status.textContent = 'Generation failed — try again in a moment.';
    }
    if(btn) btn.disabled = false;
  },

  async generateWizardSpirit(prefix){
    const form = readCardFormFromDom(prefix, { consoleKey: '' });
    if(!form.spiritAnimal?.trim()){
      alert('Describe your spirit animal first.');
      return;
    }
    const p = prefix ? `${prefix}_` : 'vw_';
    const btn = document.getElementById(p + 'GenSpiritBtn');
    const status = document.getElementById(p + 'SpiritStatus');
    const preview = document.getElementById(p + 'SpiritPreview');
    if(btn) btn.disabled = true;
    if(status) status.textContent = 'Summoning spirit animal… please wait.';
    let temp = buildCoderCardFromWizard(form);
    try{
      temp = await generateCoderCardImages(temp, { portrait: false, spirit: true });
      this.wizardDraft.spirit = temp.pokeCard?.spiritAnimalImage || '';
      if(preview && this.wizardDraft.spirit){
        preview.innerHTML = `<img src="${esc(this.wizardDraft.spirit)}" alt="Spirit animal">`;
      }
      if(status) status.textContent = 'Spirit animal arrived.';
    }catch(e){
      if(status) status.textContent = 'Spirit generation failed — try again.';
    }
    if(btn) btn.disabled = false;
  },

  renderInstructions(){
    const host = document.getElementById('instructionsSpread');
    if(!host) return;
    if(isAdmin()){
      host.innerHTML = `
        <div class="instructions-wrap">
          <div class="player-mode-banner sketch-card">
            <span class="player-mode-banner-dot" aria-hidden="true"></span>
            <div>
              <p class="player-mode-banner-kicker">Player Gray mode</p>
              <p class="player-mode-banner-text">Click the instructions below to edit what coders see.</p>
            </div>
          </div>
          <div class="instructions-panel sketch-card instructions-gray-voice instructions-editable" id="instructionsEditor" contenteditable="true">${getInstructionsHtml()}</div>
        </div>`;
      const ed = host.querySelector('#instructionsEditor');
      ed?.addEventListener('blur', () => {
        state.instructionsHtml = ed.innerHTML;
        saveState();
      });
      return;
    }
    host.innerHTML = `<div class="instructions-wrap">${getInstructionsHtml()}</div>`;
    bindInstructionsActions(host);
  },

  renderViewerCard(){
    const host = document.getElementById('viewerCardSpread');
    if(!host) return;

    if(isAdmin()){
      host.innerHTML = renderGrayMyCardGuide();
      host.querySelector('#grayGuideOpenVault')?.addEventListener('click', () => {
        if(typeof openGrayRewardsDrawer === 'function') openGrayRewardsDrawer();
      });
      return;
    }

    if(isGuest()){
      host.innerHTML = `<div class="viewer-wizard sketch-card">
        <h3 class="viewer-wizard-title">Guest view</h3>
        <p class="field-hint">Watch-only. You can see what I'm doing but cannot post, quest, or vote. Log in or make My Card to interact.</p>
        <div class="modal-actions">
          <button type="button" class="btn primary" id="guestGoCreate">Make My Card</button>
          <button type="button" class="btn" id="guestGoLogin">Log in</button>
        </div>
      </div>`;
      host.querySelector('#guestGoCreate')?.addEventListener('click', () => navigateToView('viewer-card'));
      host.querySelector('#guestGoLogin')?.addEventListener('click', () => returnToLogin());
      return;
    }

    if(!getMyCoderCard()){
      this.wizardDraft = { portrait: '', spirit: '' };
      host.innerHTML = `
        <div class="viewer-wizard sketch-card card-create-intro">
          <p class="instructions-kicker">You're joining the deck</p>
          <h3 class="viewer-wizard-title">Make My Card</h3>
          <p class="field-hint">Generate your <strong>character</strong> and <strong>spirit animal</strong> first — your card line is written from your personality stats when you summon.</p>
          <form id="viewerCardForm" class="viewer-wizard-form">
            ${cardWizardFieldsHtml('vw', null, { createLayout: true })}
            <div class="field-row card-wizard-keys">
              <div class="field"><label>Console key</label><input type="password" id="vw_ConsoleKey" required placeholder="unique secret — yours alone"></div>
              <div class="field"><label>Confirm key</label><input type="password" id="vw_ConsoleKey2" required></div>
            </div>
            <button type="submit" class="btn primary" id="vwSubmitBtn">✦ Summon my card</button>
          </form>
        </div>`;
      document.getElementById('viewerCardForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitCharacterWizard(); });
      this.wireCardWizardCreate('vw');
      return;
    }

    const mine = getMyCoderCard();
    if(!mine) return;

    if(this.editingCardId === mine.id){
      host.innerHTML = `
        <div class="viewer-wizard sketch-card">
          <h3 class="viewer-wizard-title">Edit My Card</h3>
          <p class="field-hint">Tweak anything — regenerate portrait or spirit when you're ready (you'll see progress).</p>
          <form id="myCardEditForm" class="viewer-wizard-form">
            ${cardWizardFieldsHtml('edit', mine)}
            <div class="card-regen-row">
              <button type="button" class="btn" id="regenPortraitBtn">↻ Regenerate portrait</button>
              <button type="button" class="btn" id="regenSpiritBtn">↻ Regenerate spirit</button>
            </div>
            <div id="cardEditGenProgress"></div>
            <div class="modal-actions">
              <button type="button" class="btn" id="cancelCardEdit">Cancel</button>
              <button type="submit" class="btn primary">Save changes</button>
            </div>
          </form>
        </div>`;
      host.querySelector('#cancelCardEdit')?.addEventListener('click', () => { this.editingCardId = null; this.renderViewerCard(); });
      host.querySelector('#regenPortraitBtn')?.addEventListener('click', () => this.regenerateCardLook(mine.id, 'portrait'));
      host.querySelector('#regenSpiritBtn')?.addEventListener('click', () => this.regenerateCardLook(mine.id, 'spirit'));
      document.getElementById('myCardEditForm')?.addEventListener('submit', e => {
        e.preventDefault();
        this.saveCardEdit(mine.id, 'edit');
      });
      return;
    }

    const lvl = coderLevelFromPoints(mine.points);
    const myRank = typeof getCoderXpRank === 'function' ? getCoderXpRank(mine.id) : null;
    const myRankNeon = typeof getCoderRankNeon === 'function' ? getCoderRankNeon(myRank) : null;
    const rankPill = myRank && myRank <= 3 && myRankNeon
      ? `<div class="viewer-rank-pill" style="--rank-neon:${esc(myRankNeon)}">#${myRank}</div>`
      : myRank
        ? `<div class="viewer-rank-pill is-plain">Rank #${myRank}</div>`
        : '';
    const xpDisplay = typeof displayCoderXp === 'function' ? displayCoderXp(mine) : String(mine.points || 0);
    host.innerHTML = `
      <div class="viewer-card-hero">
        <div class="viewer-fire-badge viewer-fire-badge--prominent" style="--vfb-neon:${mine.cardColor || '#38bdf8'}">
          <span class="viewer-fire-icon">◆</span>
          <span class="viewer-fire-val">${xpDisplay}</span>
          <span class="viewer-fire-label">XP</span>
        </div>
        ${rankPill}
        <div class="viewer-level-pill" title="${lvl.xpToNext} XP to next level">Lv ${lvl.level}</div>
        <button type="button" class="btn primary" id="editMyCardBtn">Edit My Card</button>
      </div>
      <div class="viewer-card-deck">${typeof buildFlipPlayerCard === 'function' ? buildFlipPlayerCard(mine, 'character', 0, { accent: mine.cardColor, xpRank: myRank, rankNeon: myRankNeon }) : ''}</div>
      <div class="viewer-card-stats sketch-card">
        ${myRank ? `<div class="vcs-row"><span>Deck rank</span><strong>#${myRank} by XP</strong></div>` : ''}
        <div class="vcs-row"><span>Quests sent</span><strong>${mine.questsSent || 0}</strong></div>
        <div class="vcs-row"><span>Quests completed</span><strong>${mine.questsCompleted || 0}</strong></div>
        ${mine.birthday ? `<div class="vcs-row"><span>Birthday</span><strong>${formatBirthdayDisplay(mine.birthday)}</strong></div>` : ''}
        <div class="vcs-row"><span>Next level</span><strong>${lvl.xpToNext} XP</strong></div>
      </div>
      ${renderCoderXpGuide()}
      <section class="xp-request-board sketch-card">
        <h3 class="viewer-wizard-title">Request bonus XP</h3>
        <p class="field-hint">Did something off-site? Pick a reason and tell me what happened — I read every request.</p>
        <form id="xpRequestForm">
          <div class="field">
            <label>Reason</label>
            <select id="xpRequestReason" required>${getXpRequestOptionsHtml()}</select>
          </div>
          <div class="field">
            <label>Your case</label>
            <textarea id="xpRequestDesc" rows="3" required placeholder="What did you do? Be specific."></textarea>
          </div>
          <button type="submit" class="btn primary">Send XP request</button>
        </form>
      </section>
      <section class="xp-history-board sketch-card">
        <h3 class="viewer-wizard-title">XP history</h3>
        ${renderXpHistoryRail(mine.xpHistory)}
      </section>`;
    const nextEl = host.querySelector('#coderXpToNext');
    if(nextEl) nextEl.textContent = String(lvl.xpToNext);
    bindFlipPlayerCards(host);
    host.querySelector('#editMyCardBtn')?.addEventListener('click', () => this.openMyCardEditor(mine.id));
    host.querySelector('#xpRequestForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitXpRequest(); });
  },

  openMyCardEditor(cardId){
    this.editingCardId = cardId;
    this.renderViewerCard();
  },

  async regenSpiritBtn(cardId){
    await this.regenerateCardLook(cardId, 'spirit');
  },

  async saveCardEdit(cardId, prefix){
    const existing = getCoderById(cardId);
    if(!existing) return;
    const form = readCardFormFromDom(prefix, { consoleKey: existing.consoleKey });
    const idx = state.viewerCharacters.findIndex(c => c.id === cardId);
    if(idx < 0) return;
    state.viewerCharacters[idx] = buildCoderCardFromWizard(form, existing);
    saveState();
    await postVisitorData('updateCharacter', state.viewerCharacters[idx]);
    logCoderActivity('card_updated', { coderId: cardId, name: state.viewerCharacters[idx].name, detail: `${state.viewerCharacters[idx].name} saved card edits` });
    awardCoderPoints(cardId, XP_AWARDS.card_edit.xp, 'card_edit');
    this.editingCardId = null;
    this.renderViewerCard();
  },

  async regenerateCardLook(cardId, mode){
    const c = getCoderById(cardId);
    if(!c) return;
    const form = readCardFormFromDom(this.editingCardId === cardId ? 'edit' : 'vw', { consoleKey: c.consoleKey });
    Object.assign(c, buildCoderCardFromWizard(form, c));
    const progressHost = document.getElementById('cardEditGenProgress') || document.getElementById('viewerCardSpread');
    if(progressHost && this.editingCardId === cardId){
      progressHost.innerHTML = cardGenProgressHtml();
    }
    const btn = document.getElementById('regenPortraitBtn') || document.getElementById('regenSpiritBtn');
    if(btn) btn.disabled = true;
    await generateCoderCardImages(c, {
      portrait: mode === 'portrait',
      spirit: mode === 'spirit',
      onStep: updateCardGenProgress,
    });
    saveState();
    await postVisitorData('updateCharacter', c);
    logCoderActivity('card_updated', { coderId: cardId, name: c.name, detail: `${c.name} updated their card` });
    if(btn) btn.disabled = false;
    if(this.editingCardId === cardId) this.renderViewerCard();
    else this.renderViewerCard();
  },

  coderAdminRow(c){
    const hasThumb = c.id && (state.viewerCharacters || []).some(v => v.id === c.id) && typeof pinCoderThumb === 'function';
    const thumb = hasThumb
      ? pinCoderThumb(c.id)
      : (c.image || c.avatar)
        ? `<span class="coder-admin-mini"><img src="${esc(c.image || c.avatar)}" alt=""></span>`
        : `<span class="pin-name">${esc(c.name)}</span>`;
    const opts = Object.entries(XP_AWARDS)
      .filter(([k, v]) => k !== 'custom' && !v.auto)
      .map(([k, v]) => `<option value="${k}">${v.label} (+${v.xp})</option>`)
      .join('');
    return `<div class="coder-admin-row sketch-card">
      <div class="coder-admin-head">
        ${thumb}
        <div><strong>${esc(c.name)}</strong> · <span class="coder-admin-xp">${c.points || 0} XP</span></div>
      </div>
      <div class="quest-actions coder-award-row">
        <select class="coder-award-select" data-coder-id="${esc(c.id)}">${opts}<option value="custom">Custom amount…</option></select>
        <button type="button" class="btn primary" data-award-go="${esc(c.id)}">Award XP</button>
        <button type="button" class="btn" data-coder-edit="${esc(c.id)}">Edit card</button>
      </div>
    </div>`;
  },

  adminAwardPoints(coderId, awardKey){
    if(!isAdmin()) return;
    let pts = XP_AWARDS[awardKey]?.xp;
    if(awardKey === 'custom' || pts == null){
      const raw = prompt('Custom XP amount:');
      pts = parseInt(raw, 10);
      if(!pts || pts < 1) return;
      awardKey = 'custom';
    }
    if(!pts) return;
    awardCoderPoints(coderId, pts, awardKey);
    this.renderQuests();
    if(typeof renderCharacters === 'function') renderCharacters();
  },

  openPlayerCoderEdit(coderId){
    if(typeof openContentEditor === 'function') openContentEditor('character', coderId, false);
  },

  async submitCharacterWizard(){
    const k1 = document.getElementById('vw_ConsoleKey')?.value;
    const k2 = document.getElementById('vw_ConsoleKey2')?.value;
    if(!k1 || k1 !== k2){ alert('Console keys must match.'); return; }
    if(k1.length < 2){ alert('Pick a console key.'); return; }
    if(isConsoleKeyTaken(k1)){
      alert('That console key is already taken — each card needs its own unique key. Please choose another.');
      return;
    }
    if(!this.wizardDraft?.portrait){
      alert('Generate your character portrait first — hit “Generate my character” and wait for the image.');
      return;
    }
    const form = readCardFormFromDom('vw', { consoleKey: k1 });
    if(form.spiritAnimal?.trim() && !this.wizardDraft?.spirit){
      alert('You described a spirit animal — generate it first, or clear the field.');
      return;
    }
    if(!form.name?.trim()) form.name = 'Coder';

    const host = document.getElementById('viewerCardSpread');
    if(host) host.innerHTML = cardGenProgressHtml();
    updateCardGenProgress('portrait', 'done', 'Portrait ready.');
    if(this.wizardDraft.spirit) updateCardGenProgress('spirit', 'done', 'Spirit ready.');
    else updateCardGenProgress('spirit', 'skip', 'No spirit animal.');

    let card = buildCoderCardFromWizard(form);
    card.image = this.wizardDraft.portrait;
    card.avatar = this.wizardDraft.portrait;
    if(this.wizardDraft.spirit) card.pokeCard.spiritAnimalImage = this.wizardDraft.spirit;

    updateCardGenProgress('desc', 'active', 'Writing your card line…');
    card = await generateCoderCardDescription(card);
    updateCardGenProgress('desc', 'done', 'Card line ready.');
    updateCardGenProgress('seal', 'active', 'Sealing your card into the deck…');

    state.viewerCharacters.push(card);
    saveState();
    await postVisitorData('createCharacter', card);
    logCoderActivity('card_created', { coderId: card.id, name: card.name, detail: `${card.name} created their Coders Card` });
    awardCoderPoints(card.id, XP_AWARDS.card_create.xp, 'card_create');
    updateCardGenProgress('seal', 'done', 'Welcome to the deck!');
    this.wizardDraft = { portrait: '', spirit: '' };
    unlockCoderSession(card.id, { welcome: true, view: 'sync' });
    if(typeof renderCharacters === 'function') renderCharacters();
    this.editingCardId = null;
    this.renderViewerCard();
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
      const pendingXp = getPendingXpRequests().length;
      html += `<div class="quest-inbox sketch-card">
        <h3 class="viewer-wizard-title">Quest inbox</h3>
        <p class="field-hint">${pending.length} mission${pending.length === 1 ? '' : 's'} to handle · ${open.filter(q => q.status === 'submitted').length} awaiting accept${pendingXp ? ` · <strong>${pendingXp} XP request${pendingXp === 1 ? '' : 's'}</strong> in Inbox` : ''}</p>
      </div>`;
      html += pending.length
        ? `<section><h3 class="viewer-wizard-title">Incoming missions</h3><div class="quest-list">${pending.map(q => this.questRowHtml(q, false)).join('')}</div></section>`
        : `<p class="empty-hint">No pending quests right now.</p>`;
      if(completed.length){
        html += `<section class="quest-completed-section"><h3 class="viewer-wizard-title">Completed</h3><div class="quest-list">${completed.map(q => this.questRowHtml(q, true)).join('')}</div></section>`;
      }
      const coders = getAwardableCoders();
      if(coders.length){
        html += `<section class="coder-admin-panel sketch-card"><h3 class="viewer-wizard-title">Award coder XP</h3>
          <p class="field-hint">Deck cards and visitor cards — XP shows on Coder Cards.</p>
          <div class="coder-admin-list">${coders.map(c => this.coderAdminRow(c)).join('')}</div></section>`;
      }
      host.innerHTML = html;
      host.querySelectorAll('[data-quest-action]').forEach(btn => btn.addEventListener('click', () => this.handleQuestAction(btn.dataset.questId, btn.dataset.questAction)));
      host.querySelectorAll('[data-award-go]').forEach(btn => btn.addEventListener('click', () => {
        const sel = btn.closest('.coder-admin-row')?.querySelector('.coder-award-select');
        this.adminAwardPoints(btn.dataset.awardGo, sel?.value);
      }));
      host.querySelectorAll('[data-coder-edit]').forEach(btn => btn.addEventListener('click', () => this.openPlayerCoderEdit(btn.dataset.coderEdit)));
      return;
    }

    if(completed.length){
      html += `<section class="quest-completed-section"><h3 class="viewer-wizard-title">Completed quests</h3><div class="quest-list">${completed.map(q => this.questRowHtml(q, true)).join('')}</div></section>`;
    }

    if(isCoderLoggedIn()){
      html += `<div class="quest-compose sketch-card">
        <h3 class="viewer-wizard-title">Transmit a quest</h3>
        <p class="field-hint">From <strong>${esc(mine.name)}</strong> — you decide what I do.</p>
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
      html += `<p class="empty-hint">Guest watch-only — log in to send quests.</p>`;
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
      ${q.playerNote ? `<p class="quest-note">Me: ${esc(q.playerNote)}</p>` : ''}
      ${clips.length ? `<div class="quest-response-reel">${clips.map((c, i) => `<video controls playsinline src="${esc(c)}" class="quest-clip"></video>`).join('')}</div>` : ''}
      ${q.status !== 'completed' && isCoderLoggedIn() ? `<button type="button" class="btn" data-quest-vote="${esc(q.id)}">▲ support (${votes})</button>` : ''}
      ${showComments ? `
        <div class="quest-comments">${(q.comments || []).map(c => `<p class="quest-comment"><strong>${esc(c.fromName)}</strong>: ${esc(c.text)}</p>`).join('')}</div>
        ${isCoderLoggedIn() ? `<button type="button" class="btn" data-quest-comment="${esc(q.id)}">Comment</button>` : ''}` : ''}
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
    if(!isCoderLoggedIn() || !mine){ alert('Log in to your card to send quests.'); return; }
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
    logCoderActivity('quest_sent', { coderId: mine.id, name: mine.name, detail: `${mine.name} sent quest: ${quest.title}` });
    saveState();
    await postVisitorData('submitQuest', quest);
    document.getElementById('questForm')?.reset();
    this.renderQuests();
  },

  voteQuest(questId){
    const mine = getMyCoderCard();
    const q = state.quests.find(x => x.id === questId);
    if(!isCoderLoggedIn() || !mine || !q || q.status === 'completed') return;
    if(!q.votes) q.votes = {};
    if(q.votes[mine.id]) return;
    q.votes[mine.id] = true;
    logCoderActivity('quest_vote', { coderId: mine.id, name: mine.name, detail: `${mine.name} voted on quest: ${q.title}` });
    saveState();
    postVisitorData('updateQuest', q);
    this.renderQuests();
  },

  commentQuest(questId){
    const mine = getMyCoderCard();
    const q = state.quests.find(x => x.id === questId);
    if(!isCoderLoggedIn() || !mine || !q || q.status !== 'completed') return;
    const text = prompt('Your comment:')?.trim();
    if(!text) return;
    if(!q.comments) q.comments = [];
    q.comments.push({ id: uid('qc'), fromCharacterId: mine.id, fromName: mine.name, text, at: new Date().toISOString() });
    logCoderActivity('quest_comment', { coderId: mine.id, name: mine.name, detail: `${mine.name} commented on quest: ${q.title}` });
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
    logCoderActivity('quest_complete', { coderId: q.fromCharacterId, name: q.fromName, detail: `Quest completed: ${q.title} (${q.fromName})` });
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
    if(typeof awardGrayPoints === 'function') awardGrayPoints(GRAY_XP_AWARDS.quest_complete.xp, 'quest_complete');
    renderHomeCheckIn();
  },

  renderVlog(){
    const host = document.getElementById('vlogSpread');
    if(!host) return;
    const entries = (state.videoDiary || []).slice().reverse();
    let html = '';
    if(isAdmin()){
      html += `<div class="vlog-upload sketch-card"><h3 class="viewer-wizard-title">Video note</h3>
        <p class="field-hint">Record in-browser, upload a file, or paste a URL.</p>
        <form id="vlogUploadForm">
          <div class="field-row"><div class="field"><label>Title</label><input type="text" id="vlogTitle" required></div>
          <div class="field"><label>Date</label><input type="date" id="vlogDate" value="${todayKey()}"></div></div>
          <div class="field-row vlog-capture-row">
            <button type="button" class="btn primary" id="vlogRecordBtn">🎬 Record now</button>
            <button type="button" class="btn" id="vlogClearClip" hidden>Clear clip</button>
          </div>
          <div id="vlogClipPreview" class="vlog-clip-preview hidden"></div>
          <div class="field"><label>Video URL</label><input type="url" id="vlogUrl" placeholder="or paste a link"></div>
          <div class="field"><label>Clip upload (&lt;4MB)</label><input type="file" id="vlogVideoFile" accept="video/*"></div>
          <div class="field"><label>English captions</label><textarea id="vlogCaptions" rows="4"></textarea></div>
          <button type="submit" class="btn primary">Publish</button>
        </form></div>`;
    }
    html += entries.length ? `<div class="vlog-grid">${entries.map(v => this.vlogEntryHtml(v)).join('')}</div>` : `<p class="empty-hint">No vlogs yet.</p>`;
    host.innerHTML = html;
    document.getElementById('vlogUploadForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitVlog(); });
    document.getElementById('vlogVideoFile')?.addEventListener('change', e => { this.pendingVlogFile = e.target.files?.[0] || null; this.pendingVlogData = ''; });
    document.getElementById('vlogRecordBtn')?.addEventListener('click', () => {
      if(typeof MediaCapture === 'undefined') return;
      MediaCapture.open({ mode: 'video', onResult: r => {
        this.pendingVlogData = r.dataUrl;
        this.pendingVlogFile = null;
        const prev = document.getElementById('vlogClipPreview');
        const clr = document.getElementById('vlogClearClip');
        if(prev){ prev.classList.remove('hidden'); prev.innerHTML = `<video controls playsinline src="${esc(r.dataUrl)}"></video>`; }
        if(clr) clr.hidden = false;
      }});
    });
    document.getElementById('vlogClearClip')?.addEventListener('click', () => {
      this.pendingVlogData = '';
      document.getElementById('vlogClipPreview')?.classList.add('hidden');
      document.getElementById('vlogClearClip').hidden = true;
    });
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
    let videoData = this.pendingVlogData || '';
    if(!videoData && this.pendingVlogFile){
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
    this.pendingVlogData = '';
    this.renderVlog();
  },

  async sendPrivateMessage(toId, toName, body, opts = {}){
    const fromId = getInboxUserId();
    const fromName = getInboxUserName();
    if(!fromId || !toId || !body?.trim()) return false;
    const msg = {
      id: uid('msg'),
      fromId,
      fromName,
      toId,
      toName: toName || (toId === GRAY_INBOX_ID ? 'Gray' : 'Coder'),
      body: body.trim(),
      at: new Date().toISOString(),
      readBy: [fromId],
    };
    if(!state.inboxMessages) state.inboxMessages = [];
    state.inboxMessages.unshift(msg);
    saveState();
    await postVisitorData('sendMessage', msg);
    logCoderActivity('inbox_message', {
      coderId: fromId === GRAY_INBOX_ID ? '' : fromId,
      name: fromName,
      detail: `To ${msg.toName}: ${body.trim().slice(0, 100)}`,
    });
    if(fromId !== GRAY_INBOX_ID) awardCoderPoints(fromId, XP_AWARDS.inbox_message.xp, 'inbox_message');
    return true;
  },

  async submitInboxMessage(){
    const userId = getInboxUserId();
    if(!userId){ alert('Log in to send messages.'); return; }
    const toId = document.getElementById('inboxTo')?.value;
    const body = document.getElementById('inboxBody')?.value?.trim();
    if(!toId || !body) return;
    const toName = document.getElementById('inboxTo')?.selectedOptions?.[0]?.textContent?.trim() || 'Coder';
    const ok = await this.sendPrivateMessage(toId, toName, body);
    if(ok){
      document.getElementById('inboxBody').value = '';
      this.renderInbox();
    }
  },

  async submitXpRequest(){
    const mine = getMyCoderCard();
    if(!isCoderLoggedIn() || !mine){ alert('Log in to request XP.'); return; }
    const reasonKey = document.getElementById('xpRequestReason')?.value;
    const description = document.getElementById('xpRequestDesc')?.value?.trim();
    if(!reasonKey || !description){ alert('Pick a reason and describe what happened.'); return; }
    const pending = (state.xpRequests || []).some(r => r.coderId === mine.id && r.status === 'pending');
    if(pending){ alert('You already have a pending XP request — wait for me to respond.'); return; }
    const award = XP_AWARDS[reasonKey];
    const req = {
      id: uid('xpr'),
      coderId: mine.id,
      coderName: mine.name,
      reasonKey,
      reasonLabel: award?.label || reasonKey,
      suggestedXp: award?.xp || 0,
      description,
      status: 'pending',
      at: new Date().toISOString(),
    };
    if(!state.xpRequests) state.xpRequests = [];
    state.xpRequests.unshift(req);
    saveState();
    await postVisitorData('submitXpRequest', req);
    logCoderActivity('xp_request', {
      coderId: mine.id,
      name: mine.name,
      detail: `${mine.name} requested XP: ${req.reasonLabel} — ${description.slice(0, 80)}`,
    });
    alert('XP request sent — I\'ll see it in my inbox and coder signals.');
    document.getElementById('xpRequestForm')?.reset();
    this.renderViewerCard();
  },

  async resolveXpRequest(requestId, action){
    if(!isAdmin()) return;
    const req = (state.xpRequests || []).find(r => r.id === requestId);
    if(!req || req.status !== 'pending') return;
    if(action === 'approve'){
      const xp = XP_AWARDS[req.reasonKey]?.xp;
      if(xp) awardCoderPoints(req.coderId, xp, req.reasonKey);
      req.status = 'approved';
      await this.sendPrivateMessage(
        req.coderId,
        req.coderName,
        `Your XP request was approved: ${req.reasonLabel}${xp ? ` (+${xp} XP)` : ''}.`,
        { silent: true },
      );
    } else {
      req.status = 'denied';
      await this.sendPrivateMessage(
        req.coderId,
        req.coderName,
        `Your XP request was declined: ${req.reasonLabel}. ${req.description ? `You wrote: “${req.description.slice(0, 120)}”` : ''}`,
        { silent: true },
      );
    }
    req.resolvedAt = new Date().toISOString();
    saveState();
    await postVisitorData('resolveXpRequest', req);
    this.renderInbox();
    this.renderQuests();
    if(typeof renderCoderNotifyRail === 'function') renderCoderNotifyRail();
  },

  renderInbox(){
    const host = document.getElementById('inboxDrawerSpread') || document.getElementById('inboxSpread');
    if(!host) return;
    const userId = getInboxUserId();
    if(!userId){
      host.innerHTML = `<p class="empty-hint">Log in to use private messages.</p>`;
      return;
    }
    const messages = getInboxForUser(userId);
    const unread = getUnreadInboxForUser(userId);
    const coders = getInboxableCoders().filter(c => c.id !== userId);
    const recipientOptions = isAdmin()
      ? coders.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')
      : [`<option value="${GRAY_INBOX_ID}">Gray</option>`,
        ...coders.filter(c => c.id !== getCoderSessionId()).map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`),
      ].join('');

    const msgList = messages.length
      ? messages.map(m => {
        const mine = m.fromId === userId;
        const isUnread = m.toId === userId && !(m.readBy || []).includes(userId);
        const when = m.at ? new Date(m.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        return `<article class="inbox-msg${isUnread ? ' is-unread' : ''}${mine ? ' is-sent' : ''}">
          <div class="inbox-msg-head">
            <span class="inbox-msg-who">${mine ? `To <strong>${esc(displayInboxName(m.toName))}</strong>` : `From <strong>${esc(displayInboxName(m.fromName))}</strong>`}</span>
            <time class="inbox-msg-time">${esc(when)}</time>
          </div>
          <p class="inbox-msg-body">${esc(m.body)}</p>
        </article>`;
      }).join('')
      : `<p class="empty-hint">No messages yet.</p>`;

    let adminPanels = '';
    if(isAdmin()){
      const pendingXp = getPendingXpRequests();
      adminPanels += pendingXp.length
        ? `<section class="inbox-admin-panel sketch-card">
            <h3 class="viewer-wizard-title">Pending XP requests</h3>
            <div class="xp-request-list">${pendingXp.map(r => `<div class="xp-request-row">
              <div><strong>${esc(r.coderName)}</strong> · ${esc(r.reasonLabel)} (+${r.suggestedXp || 0} XP)</div>
              <p>${esc(r.description)}</p>
              <div class="quest-actions">
                <button type="button" class="btn primary" data-xp-approve="${esc(r.id)}">Approve</button>
                <button type="button" class="btn" data-xp-deny="${esc(r.id)}">Decline</button>
              </div>
            </div>`).join('')}</div>
          </section>`
        : '';
    }

    host.innerHTML = `
      <div class="inbox-compose sketch-card">
        <form id="inboxComposeForm">
          <div class="field-row">
            <div class="field"><label>To</label><select id="inboxTo" required>${recipientOptions}</select></div>
          </div>
          <div class="field"><label>Message</label><textarea id="inboxBody" rows="3" required placeholder="Private message…"></textarea></div>
          <button type="submit" class="btn primary">Send message</button>
        </form>
      </div>
      ${adminPanels}
      <section class="inbox-thread sketch-card">
        <div class="inbox-msg-list">${msgList}</div>
        ${unread.length ? `<button type="button" class="btn" id="markInboxReadBtn">Mark all read</button>` : ''}
      </section>`;

    host.querySelector('#inboxComposeForm')?.addEventListener('submit', e => { e.preventDefault(); this.submitInboxMessage(); });
    host.querySelector('#markInboxReadBtn')?.addEventListener('click', () => markInboxRead(userId, unread.map(m => m.id)));
    host.querySelectorAll('[data-xp-approve]').forEach(btn => btn.addEventListener('click', () => this.resolveXpRequest(btn.dataset.xpApprove, 'approve')));
    host.querySelectorAll('[data-xp-deny]').forEach(btn => btn.addEventListener('click', () => this.resolveXpRequest(btn.dataset.xpDeny, 'deny')));
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
