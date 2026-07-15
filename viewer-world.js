/* ===== Coders Cards — viewer game layer ===== */

const CODERS_SESSION_KEY = 'ga-coder-card-id';
const CODERS_LOGIN_DAY_KEY = 'ga-coder-login-day';
const CODERS_BIRTHDAY_SHOWN_KEY = 'ga-coder-bday';
const GUEST_SESSION_KEY = 'ga-guest';
const CREATING_CARD_KEY = 'ga-creating-card';
const VISITOR_WRITE_KEY = 'gray-areas-visitor';

const POINTS = {
  quest_submit: 5,
  quest_complete: 50,
};

const XP_AWARDS = {
  quest_submit: { label: 'Quest sent', xp: 5, auto: true },
  quest_complete: { label: 'Quest completed', xp: 50, auto: true },
  meet_in_person: { label: 'Met in person', xp: 100 },
  video_call: { label: 'Video call', xp: 50 },
  phone_call: { label: 'Phone call', xp: 10 },
  voice_note: { label: 'Voice note / voice message', xp: 8 },
  letter_postcard: { label: 'Letter or postcard', xp: 25 },
  care_package: { label: 'Care package sent', xp: 40 },
  surprise_gift: { label: 'Surprise gift', xp: 30 },
  inside_joke: { label: 'Made Gray laugh', xp: 15 },
  emotional_support: { label: 'Emotional support', xp: 35 },
  good_advice: { label: 'Genuinely good advice', xp: 20 },
  media_rec: { label: 'Book/film rec Gray consumed', xp: 18 },
  community_gem: { label: 'Great community post', xp: 5 },
  milestone: { label: 'Shared a milestone', xp: 15 },
  practical_help: { label: 'Helped Gray practically', xp: 45 },
  chaos_quest: { label: 'Chaos gremlin quest (worked)', xp: 10 },
  patience: { label: 'Patience during overload', xp: 25 },
  mandarin_cheer: { label: 'Mandarin encouragement', xp: 12 },
  photo_shoutout: { label: 'Photo shoutout', xp: 8 },
  press_collab: { label: 'Press collab', xp: 30 },
  login_streak_7: { label: '7-day login streak', xp: 20 },
  first_quest: { label: 'First quest ever', xp: 10 },
  legendary: { label: 'Legendary moment', xp: 75 },
  birthday: { label: 'Birthday', xp: 50 },
  random_kindness: { label: 'Random kindness', xp: 20 },
  showed_up: { label: 'Showed up when it mattered', xp: 60 },
  taught_something: { label: 'Taught Gray something new', xp: 22 },
  sent_photos: { label: 'Sent photos / memories', xp: 12 },
  game_night: { label: 'Online hangout / game night', xp: 28 },
  recipe_share: { label: 'Recipe or food tip', xp: 8 },
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
  { id: 'chaos', label: 'Chaos / piss Gray off', icon: '☠', neon: '#f87171' },
  { id: 'rec', label: 'Book/film recommendation', icon: '📚', neon: '#c084fc' },
  { id: 'other', label: 'Anything goes', icon: '✧', neon: '#3ad6e0' },
];

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
  let abilityEffect = 'Gray will fill this in when they spot the blank.';
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
  let weaknessEffect = 'Gray will fill this in when they spot the blank.';
  if(w){
    weaknessEffect = /fringe/i.test(wLow)
      ? `Fringe Phobia — double impact from opponents with fringe aesthetics; your focus shatters.`
      : `${weaknessName} — double damage from ${wLow}; high-pressure days hit harder.`;
  }

  const resistanceName = titleFromPhrase(r, title ? `The ${title}` : 'Natural Shield');
  let resistanceEffect = 'Gray will fill this in when they spot the blank.';
  if(r){
    resistanceEffect = /rock|time|ground|solid/i.test(r)
      ? `Rock-solid — immune to intimidation and pressure tactics. ${r} does not move you.`
      : `Immune to ${r.toLowerCase()} — you shrug off what would bend others.`;
  }

  const extraMoves = strengths.filter(x => x !== s).slice(0, 2).map(str => ({
    name: titleFromPhrase(str, 'Bonus Move'),
    effect: `Channel ${str.toLowerCase()} — tactical edge when Gray needs it.`,
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

function tryPlayerLogin(name, key){
  if(normalizeCoderName(name) !== PLAYER_LOGIN_NAME) return false;
  if((key || '').trim() !== PLAYER_LOGIN_KEY) return false;
  if(typeof unlockAdmin === 'function'){
    unlockAdmin({ toast: false, view: 'sync', welcome: false });
  }
  hideEntryGate();
  return true;
}

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
  body.innerHTML = `<p>It's your birthday. Gray owes you cake eventually.</p>
    <p class="birthday-xp">Gray awards birthday XP manually — enjoy the fanfare.</p>`;
  back.classList.remove('hidden');
}

function showWelcomePlayer(){
  const name = typeof getPlayer === 'function' ? (getPlayer().name || 'Gray') : 'Gray';
  const back = document.getElementById('welcomeBack');
  back?.classList.add('welcome-modal--player');
  showWelcomeModal(
    `Welcome, Player: ${name}`,
    '<p class="welcome-player-tag">Full board control unlocked.</p><p>Quest inbox, daily log, live to-do, coder XP — all yours. Go play.</p>',
    { onDismiss: () => back?.classList.remove('welcome-modal--player') },
  );
}

function showWelcomeCoder(card){
  const pts = card.points || 0;
  showWelcomeModal(
    `Welcome Coder: ${card.name}`,
    `<p class="welcome-xp">XP: <strong>${pts}</strong></p><p>You're in. Send quests, post on Community, edit My Card anytime.</p>`,
    { onDismiss: () => showBirthdayCelebration(card) },
  );
}

function unlockCoderSession(cardId, opts = {}){
  clearGuestMode();
  clearCardCreationMode();
  try{ sessionStorage.setItem(CODERS_SESSION_KEY, cardId); }catch(e){}
  enterMainSite();
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

function awardLoginPoints(){
  /* Gray awards login XP manually via player mode */
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
    cardDescription: form.selfDescription?.trim() || form.vibe?.trim() || base.cardDescription || '',
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

async function generateCoderCardImages(card, opts = {}){
  if(typeof CharGen === 'undefined') return card;
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
      card.image = await CharGen.generatePortrait(portraitDesc || card.name || 'coder');
      card.avatar = card.image;
    }
    if(opts.spirit !== false && card.spiritAnimal){
      card.pokeCard.spiritAnimalImage = await CharGen.generateSpirit(card.spiritAnimal);
    }
  }catch(e){
    console.warn('Coder card image gen:', e);
  }
  return card;
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

function pinCoderThumb(coderId){
  const c = getCoderById(coderId);
  if(!c) return '';
  const img = c.avatar || c.image;
  const accent = c.cardColor || '#38bdf8';
  return `<div class="pin-coder-thumb" style="--pct-neon:${accent}">
    <div class="pin-coder-frame">${img ? `<img src="${esc(img)}" alt="">` : `<span>${esc((c.name || '?').charAt(0))}</span>`}</div>
    <span class="pin-coder-name">${esc(c.name)}</span>
  </div>`;
}

function cardWizardFieldsHtml(prefix, card){
  const c = card || {};
  const p = prefix ? `${prefix}_` : 'vw_';
  const id = k => p + k;
  return `
    <div class="field-row">
      <div class="field"><label>Name</label><input type="text" id="${id('Name')}" value="${esc(c.name || '')}" placeholder="your name"></div>
      <div class="field"><label>Title</label><input type="text" id="${id('Title')}" value="${esc(c.cardSubtitle || c.pokeCard?.subtitle || '')}" placeholder="optional"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Birthday</label><input type="date" id="${id('Birthday')}" value="${esc(c.birthday || '')}"></div>
      <div class="field"><label>MBTI</label><input type="text" id="${id('Mbti')}" value="${esc(c.mbti || '')}" placeholder="optional"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Border colour</label><input type="color" id="${id('CardColor')}" value="${esc(c.pokeCard?.cardColor || '#4ade80')}"><span class="field-hint">Neon border glow only</span></div>
      <div class="field"><label>Palette name</label><input type="text" id="${id('Palette')}" value="${esc(c.pokeCard?.colorPalette || '')}" placeholder="optional"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Hair colour</label><input type="text" id="${id('Hair')}" value="${esc(c.hairColor || '')}" placeholder="optional"></div>
      <div class="field"><label>Skin colour</label><input type="text" id="${id('Skin')}" value="${esc(c.skinColor || '')}" placeholder="optional"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Eye colour</label><input type="text" id="${id('Eyes')}" value="${esc(c.eyeColor || '')}" placeholder="always rendered neon"><span class="field-hint">Eyes glow neon on your portrait</span></div>
      <div class="field"><label>Spirit animal</label><input type="text" id="${id('Spirit')}" value="${esc(c.spiritAnimal || c.pokeCard?.spiritPrompt || '')}" placeholder="optional"></div>
    </div>
    <div class="field"><label>Vibe</label><textarea id="${id('Vibe')}" rows="2" placeholder="optional">${esc(c.vibe || c.pokeCard?.vibe || '')}</textarea></div>
    <div class="field"><label>Strengths</label><textarea id="${id('Strengths')}" rows="2" placeholder="comma or line separated — I'll turn the best one into your ability">${esc(c.strengths || '')}</textarea></div>
    <div class="field"><label>Weaknesses</label><textarea id="${id('Weaknesses')}" rows="2" placeholder="comma or line separated">${esc(c.weaknesses || '')}</textarea></div>
    <div class="field"><label>Resistances</label><textarea id="${id('Resistances')}" rows="2" placeholder="what you're immune to">${esc(c.resistances || '')}</textarea></div>
    <div class="field"><label>Quote</label><input type="text" id="${id('Quote')}" value="${esc(c.quote || c.pokeCard?.quote || '')}" placeholder="optional"></div>
    <div class="field"><label>Self description</label><textarea id="${id('SelfDesc')}" rows="3" placeholder="optional — helps generate your look">${esc(c.selfDescription || '')}</textarea></div>`;
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
      <p class="instructions-p">Originally it was just a way to watch me. I've changed it a bit: you're referred to as <strong>Coders</strong>. Coders can send <strong>quests</strong> if they think I'm not living well enough, or just want to piss me off. You get <strong>5 XP</strong> when you send one, and <strong>50 XP</strong> when I complete yours. I hand out the rest of the XP myself — meet-ups, calls, birthdays, chaos, kindness, all that. I don't know what the reward is for the person with the most XP yet. Early days, okay.</p>
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
  state.coderActivity.unshift({
    id: uid('act'),
    at: new Date().toISOString(),
    type,
    ...payload,
  });
  state.coderActivity = state.coderActivity.slice(0, 120);
  saveState();
  if(typeof renderCoderNotifyRail === 'function') renderCoderNotifyRail();
}

function renderXpHistoryRail(history){
  const items = (history || []).slice();
  if(!items.length){
    return `<p class="empty-hint">No XP logged yet — send quests, get missions completed, or wait for Gray to award bonus XP.</p>`;
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
  pendingQuestClips: [],
  editingCardId: null,
  playerEditingCoderId: null,

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
      if(!isAdmin()) navigateToView('instructions');
      return;
    }
    alert('No match for that name and key. Continue as guest or make My Card.');
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
    if(isAdmin()){
      host.innerHTML = `
        <div class="player-mode-banner sketch-card">
          <span class="player-mode-banner-dot" aria-hidden="true"></span>
          <div>
            <p class="player-mode-banner-kicker">Player Gray mode</p>
            <p class="player-mode-banner-text">Click the instructions below to edit what coders see.</p>
          </div>
        </div>
        <div class="instructions-panel sketch-card instructions-gray-voice instructions-editable" id="instructionsEditor" contenteditable="true">${getInstructionsHtml()}</div>`;
      const ed = host.querySelector('#instructionsEditor');
      ed?.addEventListener('blur', () => {
        state.instructionsHtml = ed.innerHTML;
        saveState();
      });
      return;
    }
    host.innerHTML = getInstructionsHtml();
    bindInstructionsActions(host);
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
        <p class="field-hint">Watch-only. You can see what Gray is doing but cannot post, quest, or vote. Log in or make My Card to interact.</p>
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
      host.innerHTML = `
        <div class="viewer-wizard sketch-card">
          <h3 class="viewer-wizard-title">Make My Card</h3>
          <p class="field-hint">Leave anything blank — Gray can fill gaps later. Only your name and console key are needed to log in.</p>
          <form id="viewerCardForm" class="viewer-wizard-form">
            ${cardWizardFieldsHtml('vw', null)}
            <div class="field-row">
              <div class="field"><label>Console key</label><input type="password" id="vw_ConsoleKey" required placeholder="unique — each card needs its own"></div>
              <div class="field"><label>Confirm key</label><input type="password" id="vw_ConsoleKey2" required></div>
            </div>
            <button type="submit" class="btn primary" id="vwSubmitBtn">Generate My Card</button>
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
          <span class="viewer-fire-label">XP</span>
        </div>
        <div class="viewer-level-pill">Lv ${lvl.level}</div>
        <button type="button" class="btn primary" id="editMyCardBtn">Edit My Card</button>
      </div>
      <div class="viewer-card-deck">${typeof buildFlipPlayerCard === 'function' ? buildFlipPlayerCard(mine, 'character', 0, { accent: mine.cardColor }) : ''}</div>
      <div class="viewer-card-stats sketch-card">
        <div class="vcs-row"><span>Quests sent</span><strong>${mine.questsSent || 0}</strong></div>
        <div class="vcs-row"><span>Quests completed</span><strong>${mine.questsCompleted || 0}</strong></div>
        ${mine.birthday ? `<div class="vcs-row"><span>Birthday</span><strong>${formatBirthdayDisplay(mine.birthday)}</strong></div>` : ''}
      </div>
      <section class="xp-history-board sketch-card">
        <h3 class="viewer-wizard-title">XP history</h3>
        ${renderXpHistoryRail(mine.xpHistory)}
      </section>`;
    bindFlipPlayerCards(host);
    host.querySelector('#editMyCardBtn')?.addEventListener('click', () => {
      if(typeof openContentEditor === 'function') openContentEditor('character', mine.id, false);
    });
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
    this.editingCardId = null;
    this.renderViewerCard();
  },

  async regenerateCardLook(cardId, mode){
    const c = getCoderById(cardId);
    if(!c) return;
    const form = readCardFormFromDom(this.editingCardId === cardId ? 'edit' : 'vw', { consoleKey: c.consoleKey });
    Object.assign(c, buildCoderCardFromWizard(form, c));
    if(this.editingCardId === cardId){
      const panel = document.getElementById('myCardEditForm');
      if(panel) Object.assign(c, buildCoderCardFromWizard(readCardFormFromDom('edit', { consoleKey: c.consoleKey }), c));
    }
    const btn = document.getElementById('regenPortraitBtn') || document.getElementById('regenSpiritBtn');
    if(btn) btn.disabled = true;
    await generateCoderCardImages(c, { portrait: mode === 'portrait', spirit: mode === 'spirit' });
    saveState();
    await postVisitorData('updateCharacter', c);
    if(btn) btn.disabled = false;
    this.renderViewerCard();
  },

  coderAdminRow(c){
    const opts = Object.entries(XP_AWARDS)
      .filter(([k, v]) => k !== 'custom' && !v.auto)
      .map(([k, v]) => `<option value="${k}">${v.label} (+${v.xp})</option>`)
      .join('');
    return `<div class="coder-admin-row sketch-card">
      <div class="coder-admin-head">
        ${pinCoderThumb(c.id)}
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

    const btn = document.getElementById('vwSubmitBtn');
    if(btn) btn.disabled = true;

    const form = readCardFormFromDom('vw', { consoleKey: k1 });
    if(!form.name?.trim()) form.name = 'Coder';

    let card = buildCoderCardFromWizard(form);
    card = await generateCoderCardImages(card);
    state.viewerCharacters.push(card);
    saveState();
    await postVisitorData('createCharacter', card);
    logCoderActivity('card_created', { coderId: card.id, name: card.name, detail: `${card.name} created their Coders Card` });
    unlockCoderSession(card.id);
    if(btn) btn.disabled = false;
    if(typeof renderCharacters === 'function') renderCharacters();
    this.renderViewerCard();
    alert('My Card created! Regenerate your look anytime. Remember your name and console key.');
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
      ${q.playerNote ? `<p class="quest-note">Gray: ${esc(q.playerNote)}</p>` : ''}
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
