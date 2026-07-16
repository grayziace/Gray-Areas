/* ===== Gray Areas ===== */

const STORAGE_KEY = 'gray-areas-shenzhen-v6';

function checkAdminFromUrl(){
  const key = new URLSearchParams(location.search).get('key');
  if(key && key === ADMIN_KEY){
    history.replaceState({}, '', location.pathname);
  }
}
function isAdmin(){ return sessionStorage.getItem('ga-admin') === '1'; }

function applyAdminUI(){
  const admin = isAdmin();
  const guest = typeof isGuest === 'function' && isGuest();
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('hidden', !admin));
  document.querySelectorAll('.player-only').forEach(el => el.classList.toggle('hidden', !admin));
  document.querySelectorAll('.viewer-only-nav').forEach(el => el.classList.toggle('hidden', admin));
  document.getElementById('adminBar')?.classList.toggle('hidden', !admin);
  document.getElementById('adminUnlock')?.classList.toggle('hidden', admin);
  document.body.classList.toggle('is-editing', admin);
  document.body.classList.toggle('is-player', admin);
  document.body.classList.toggle('is-viewer', !admin);
  document.body.classList.toggle('is-guest', guest && !admin);
  if(!admin) closeCoderNotify();
  const qt = document.getElementById('questViewTitle');
  const qh = document.getElementById('questViewHint');
  if(qt) qt.textContent = admin ? 'Quest Inbox' : 'Quests';
  if(qh) qh.textContent = admin
    ? 'Accept, complete, or decline viewer missions. Completing quests levels up their cards.'
    : guest
      ? 'Browse missions — log in with a Coders Card to send quests.'
      : 'Give me missions — places, food, comfort, Press pieces, meetups.';
  const barLabel = document.querySelector('.admin-bar-label');
  if(barLabel) barLabel.textContent = 'Player Gray mode';
  const brand = document.getElementById('brandName');
  if(brand) brand.textContent = admin ? 'Gray · PLAYER' : 'Gray Areas';
  document.body.classList.toggle('is-player-gray', admin);
  if(admin && typeof DailyLog !== 'undefined') DailyLog.onAdminReady();
  else if(admin) renderSkillControls();
  const showInstr = typeof shouldShowInstructionsNav === 'function' ? shouldShowInstructionsNav() : true;
  document.querySelectorAll('.node-btn[data-view="instructions"]').forEach(btn => btn.classList.toggle('hidden', !showInstr));
  if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderAll();
  if(admin && typeof renderCoderNotifyRail === 'function') renderCoderNotifyRail();
  const canPost = admin || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());
  const canInbox = admin || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());
  document.querySelectorAll('.inbox-nav').forEach(btn => btn.classList.toggle('hidden', !canInbox));
  if(typeof updateInboxBadge === 'function') updateInboxBadge();
  syncCornerFabVisibility();
  if(admin && typeof refreshLiveViewForAdmin === 'function') refreshLiveViewForAdmin();
  if(admin && typeof notifyGrayCoderBirthdays === 'function') notifyGrayCoderBirthdays();
  if(typeof GameHub !== 'undefined') GameHub.applySiteModeUI();
  const pinForm = document.getElementById('pinForm');
  if(pinForm) pinForm.classList.toggle('hidden', !canPost);
  const commHint = document.getElementById('commBoardHint');
  if(commHint){
    commHint.textContent = admin
      ? 'Player Gray mode — post as yourself. Your notes stay on the board permanently.'
      : canPost
        ? 'Posts stay permanently. Your coder card shows on your note.'
        : 'Browse Gray\'s board — log in to post.';
  }
  const pinPreview = document.getElementById('pinAuthorPreview');
  if(pinPreview){
    const author = typeof pinSessionAuthor === 'function' ? pinSessionAuthor() : null;
    if(author?.characterId && typeof pinCoderThumb === 'function'){
      pinPreview.innerHTML = pinCoderThumb(author.characterId);
    } else if(author){
      pinPreview.innerHTML = `<span class="pin-name">${esc(author.name)}</span>`;
    } else {
      pinPreview.innerHTML = '';
    }
  }
}

function lockAdmin(){
  sessionStorage.removeItem('ga-admin');
  if(typeof returnToLogin === 'function') returnToLogin();
  else if(typeof showEntryGate === 'function') showEntryGate({ force: true });
  applyAdminUI();
  renderAll();
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
  const toast = document.getElementById('editToast');
  if(toast){
    toast.textContent = 'Signed out.';
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); toast.textContent = 'Player mode.'; }, 2200);
  }
}

checkAdminFromUrl();

function unlockAdmin(opts = {}){
  if(typeof clearGuestMode === 'function') clearGuestMode();
  try{ sessionStorage.removeItem('ga-coder-card-id'); }catch(e){}
  sessionStorage.setItem('ga-admin', '1');
  try{ sessionStorage.setItem('ga-site-mode', 'game'); }catch(e){}
  if(typeof hideEntryGate === 'function') hideEntryGate();
  else if(typeof enterMainSite === 'function') enterMainSite();
  applyAdminUI();
  renderAll();
  syncCornerFabVisibility();
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
  if(typeof awardGrayLoginPoints === 'function') awardGrayLoginPoints();
  if(opts.welcome !== false && typeof showWelcomePlayer === 'function') showWelcomePlayer();
  else if(opts.toast !== false){
    const toast = document.getElementById('editToast');
    if(toast){
      toast.textContent = 'Player mode.';
      toast.classList.remove('hidden');
      setTimeout(() => toast?.classList.add('hidden'), 2200);
    }
  }
  if(typeof GameHub !== 'undefined') GameHub.applySiteModeUI();
  const view = opts.view || 'sync';
  if(typeof navigateToView === 'function') navigateToView(view);
  else document.querySelector(`.node-btn[data-view="${view}"]`)?.click();
  scheduleLiveViewRefresh();
}

function syncCornerFabVisibility(){
  const admin = isAdmin();
  const stack = document.querySelector('.corner-fab-stack');
  const rewardsFab = document.getElementById('grayRewardsFab');

  if(stack){
    stack.classList.toggle('hidden', !admin);
    stack.setAttribute('aria-hidden', admin ? 'false' : 'true');
  }
  if(rewardsFab){
    rewardsFab.classList.remove('hidden');
    rewardsFab.hidden = !admin;
    rewardsFab.style.display = admin ? 'flex' : 'none';
    rewardsFab.setAttribute('aria-hidden', admin ? 'false' : 'true');
  }
  if(typeof updateInboxBadge === 'function') updateInboxBadge();
}

function scheduleLiveViewRefresh(){
  if(!isAdmin()) return;
  const run = () => {
    if(typeof refreshLiveViewForAdmin === 'function') refreshLiveViewForAdmin();
  };
  run();
  requestAnimationFrame(run);
  setTimeout(run, 50);
  setTimeout(run, 250);
}

function refreshLiveViewForAdmin(){
  if(!isAdmin()) return;
  if(typeof renderHomeCheckIn === 'function') renderHomeCheckIn();
  if(typeof HomeCheckIn !== 'undefined'){
    HomeCheckIn.startClock?.();
    const spread = document.getElementById('homeSpread');
    if(spread) HomeCheckIn.bindSpread?.(spread);
  }
}

/* Easter egg: five quick clicks on "Gray Areas" → editing mode + Daily Log */
(function brandEasterEgg(){
  const brand = document.getElementById('brandName');
  if(!brand) return;
  let clicks = 0;
  let timer = null;

  brand.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    if(clicks >= 5){
      clicks = 0;
      unlockAdmin({ view: 'ledger' });
      return;
    }
    timer = setTimeout(() => { clicks = 0; }, 2000);
  });
})();

function defaultState(){
  return {
    entries: {},
    unlockedZones: [],
    skillHours: {},
    dramaState: {},
    runtimeCharacters: [],
    runtimeDramas: [],
    bio: '',
    pinboard: [],
    hiddenDramas: [],
    arrivalDate: '',
    calendarView: null,
    logViewMode: 'month',
    logFocusKey: '',
    content: null,
    overloadLogs: [],
    privateBodyLog: [],
    privateVentLogs: [],
    privateMeals: [],
    privateVaultDays: {},
    systemConsoleMemory: null,
    currentMood: '',
    moodCatalog: [],
    viewerCharacters: [],
    quests: [],
    videoDiary: [],
    liveTodos: [],
    instructionsHtml: '',
    playerPoints: 0,
    playerXpHistory: [],
    grayRewardsVault: null,
    chatMessages: [],
    pressSubmissions: [],
    coderPresence: {},
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return Object.assign(defaultState(), JSON.parse(raw));
  }catch(e){}
  return defaultState();
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  if(typeof queueGitSync === 'function') queueGitSync();
}

let state = loadState();

function mergeSiteStateFromFile(){
  if(typeof SITE_STATE === 'undefined' || !SITE_STATE) return;
  const s = SITE_STATE;
  if(s.entries) state.entries = s.entries;
  if(s.skillHours) state.skillHours = s.skillHours;
  if(s.pinboard) state.pinboard = s.pinboard;
  if(s.arrivalDate) state.arrivalDate = s.arrivalDate;
  if(s.unlockedZones) state.unlockedZones = s.unlockedZones;
  if(s.dramaState) state.dramaState = s.dramaState;
  if(s.hiddenDramas) state.hiddenDramas = s.hiddenDramas;
  /* private vault: overloadLogs, privateBodyLog, privateVentLogs — localStorage only */
  if(s.currentMood) state.currentMood = s.currentMood;
  if(Array.isArray(s.moodCatalog)) state.moodCatalog = s.moodCatalog;
  if(Array.isArray(s.viewerCharacters)) state.viewerCharacters = s.viewerCharacters;
  if(Array.isArray(s.quests)) state.quests = s.quests;
  if(Array.isArray(s.videoDiary)) state.videoDiary = s.videoDiary;
  if(Array.isArray(s.liveTodos)) state.liveTodos = s.liveTodos;
  if(typeof s.instructionsHtml === 'string') state.instructionsHtml = s.instructionsHtml;
  if(Array.isArray(s.coderActivity)) state.coderActivity = s.coderActivity;
  if(typeof s.playerPoints === 'number') state.playerPoints = s.playerPoints;
  if(Array.isArray(s.playerXpHistory)) state.playerXpHistory = s.playerXpHistory;
  if(s.grayRewardsVault && typeof s.grayRewardsVault === 'object') state.grayRewardsVault = s.grayRewardsVault;
  saveState();
}
mergeSiteStateFromFile();
let pendingPinMedia = { photo: '', video: '' };
let commFeedFilter = 'all';
let coderBoardId = '';
let pendingContentImage = null;
let pendingSpiritImage = null;
let pendingDramaImage = null;

/* ---------- Editable content (admin saves here) ---------- */
function defaultContentSnapshot(){
  return {
    player: JSON.parse(JSON.stringify({ ...CONTENT.player, bio: state.bio || CONTENT.player.bio })),
    characters: JSON.parse(JSON.stringify([...CONTENT.characters, ...(state.runtimeCharacters || [])])),
    places: JSON.parse(JSON.stringify(CONTENT.places)),
    gallery: JSON.parse(JSON.stringify(CONTENT.gallery)),
    articles: JSON.parse(JSON.stringify(CONTENT.articles)),
    skills: JSON.parse(JSON.stringify(CONTENT.skills)),
  };
}

function ensureContentState(){
  if(state.content) return;
  state.content = defaultContentSnapshot();
  state.runtimeCharacters = [];
  state.bio = '';
  saveState();
}

/** Restore corrupted saves (null player, wiped default arrays). */
function repairContentState(){
  const keys = ['characters', 'places', 'gallery', 'articles', 'skills'];
  if(!state.content || typeof state.content !== 'object'){
    ensureContentState();
    return;
  }

  const defaults = defaultContentSnapshot();
  const c = state.content;
  let repaired = false;

  if(!c.player || typeof c.player !== 'object'){
    c.player = defaults.player;
    repaired = true;
  } else {
    if(!c.player.name){
      c.player = { ...defaults.player, ...c.player };
      repaired = true;
    }
    c.player.pokeCard = { ...(defaults.player.pokeCard || {}), ...(c.player.pokeCard || {}) };
  }

  const allListsEmpty = keys.every(k => !Array.isArray(c[k]) || !c[k].length);
  if(allListsEmpty){
    keys.forEach(k => { c[k] = defaults[k]; });
    repaired = true;
  } else {
    keys.forEach(k => {
      if(!Array.isArray(c[k])){
        c[k] = defaults[k];
        repaired = true;
      }
    });
  }

  if(state.runtimeCharacters?.length){
    state.runtimeCharacters.forEach(rc => {
      if(rc?.id && !c.characters.some(x => x.id === rc.id)) c.characters.push(rc);
    });
    state.runtimeCharacters = [];
    repaired = true;
  }

  if(Array.isArray(c.skills)){
    CONTENT.skills.forEach(def => {
      const skill = c.skills.find(s => s.id === def.id);
      if(skill && def.hobbyNames?.length && !skill.hobbyNames?.length && !skill.hobbyLabel){
        skill.hobbyNames = [...def.hobbyNames];
        repaired = true;
      }
    });
  }

  if(repaired) saveState();
}

repairContentState();

function getPlayer(){
  const base = { ...CONTENT.player, bio: state.bio || CONTENT.player.bio };
  const pts = state.playerPoints || 0;
  const lvl = grayLevelFromPoints(pts);
  let player = base;
  if(state.content?.player && typeof state.content.player === 'object'){
    const p = state.content.player;
    player = {
      ...base,
      ...p,
      bio: p.bio ?? state.bio ?? CONTENT.player.bio,
      pokeCard: { ...(CONTENT.player.pokeCard || {}), ...(p.pokeCard || {}) },
    };
  }
  return {
    ...player,
    points: pts,
    pokeCard: { ...player.pokeCard, level: lvl.level },
  };
}

function getContentList(key, fallback){
  if(state.content && Array.isArray(state.content[key]) && state.content[key].length){
    return state.content[key];
  }
  return fallback;
}

function getCharacters(){
  const base = getContentList('characters', [...CONTENT.characters, ...(state.runtimeCharacters || [])]);
  const seen = new Set(base.map(c => c.id));
  const merged = [...base];
  (state.viewerCharacters || []).forEach(vc => {
    if(!vc?.id) return;
    const norm = typeof normalizeCoderName === 'function' ? normalizeCoderName : (n) => (n || '').trim().toLowerCase();
    const byId = merged.findIndex(m => m.id === vc.id);
    const byName = merged.findIndex(m => norm(m.name) === norm(vc.name));
    if(byId >= 0){
      merged[byId] = { ...merged[byId], ...vc, isCoderCard: true, points: vc.points ?? merged[byId].points ?? 0 };
      seen.add(vc.id);
    } else if(byName >= 0){
      merged[byName] = { ...merged[byName], ...vc, id: merged[byName].id, isCoderCard: true, points: vc.points ?? merged[byName].points ?? 0 };
      seen.add(vc.id);
    } else if(!seen.has(vc.id)){
      merged.push({ ...vc, isCoderCard: vc.isCoderCard !== false });
      seen.add(vc.id);
    }
  });
  const godNames = new Set((state.viewerCharacters || []).filter(c => c.isGod).map(c => (c.name || '').trim().toLowerCase()));
  const isCoder = c => c?.isCoderCard || (state.viewerCharacters || []).some(v => v.id === c.id);
  const namePick = new Map();
  merged.forEach(c => {
    if(!isCoder(c)) return;
    const key = (c.name || '').trim().toLowerCase();
    if(!key) return;
    const prev = namePick.get(key);
    if(!prev || c.isGod) namePick.set(key, c);
  });
  const filtered = merged.filter(c => {
    const key = (c.name || '').trim().toLowerCase();
    if(godNames.has(key) && !c.isGod) return false;
    if(!isCoder(c)) return true;
    const pick = namePick.get(key);
    return !pick || pick.id === c.id;
  });
  const staticChars = filtered.filter(c => !isCoder(c));
  const coderChars = filtered.filter(c => isCoder(c)).sort((a, b) => {
    if(a.isGod) return -1;
    if(b.isGod) return 1;
    return (b.points || 0) - (a.points || 0);
  });
  return [...staticChars, ...coderChars];
}

const CODER_RANK_NEONS = ['#fcd34d', '#ff4fd8', '#3ad6e0'];

function isCoderDeckCard(c){
  if(!c) return false;
  const key = (c.name || '').trim().toLowerCase();
  if(key === 'gray') return false;
  return !!(c.isCoderCard || c.isGod || (state.viewerCharacters || []).some(v => v.id === c.id));
}

function getRankedCoderCards(){
  const all = getCharacters().filter(c => isCoderDeckCard(c));
  const gods = all.filter(c => typeof isNickOrGod === 'function' && isNickOrGod(c));
  const rest = all.filter(c => !(typeof isNickOrGod === 'function' && isNickOrGod(c))).sort((a, b) => {
    const xp = (b.points || 0) - (a.points || 0);
    if(xp) return xp;
    return (b.pokeCard?.level || 0) - (a.pokeCard?.level || 0);
  });
  return [...gods, ...rest];
}

function getCoderXpRankMap(){
  const map = new Map();
  getRankedCoderCards()
    .filter(c => !(typeof isNickOrGod === 'function' && isNickOrGod(c)))
    .forEach((c, i) => map.set(c.id, i + 1));
  return map;
}

function getCoderXpRank(coderId){
  if(!coderId) return null;
  const rank = getCoderXpRankMap().get(coderId);
  return rank || null;
}

function getCoderRankNeon(rank){
  if(!rank || rank < 1) return null;
  return CODER_RANK_NEONS[(rank - 1) % CODER_RANK_NEONS.length];
}

function getPlaces(){
  return getContentList('places', CONTENT.places);
}

function getGallery(){
  return getContentList('gallery', CONTENT.gallery);
}

function getArticles(){
  return getContentList('articles', CONTENT.articles);
}

function getSkills(){
  return getContentList('skills', CONTENT.skills);
}

function uid(prefix){ return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6); }


function getSectionRecents(){
  const entries = Object.entries(state.entries).sort((a,b) => b[0].localeCompare(a[0]));
  const latestLog = entries[0];
  const gallery = getGallery();
  const latestPhoto = gallery.slice().reverse().find(g => g.src || g.story || g.caption) || gallery[gallery.length - 1];
  const articles = getArticles().slice().sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const dramas = allDramas();
  const watching = dramas.find(d => d.status === 'watching') || dramas[0];
  const pins = (state.pinboard || []).slice().reverse();
  const places = getPlaces().filter(p => p.unlocked || getUnlockedZones().includes(p.name));
  const chars = getCharacters();
  return {
    log: latestLog,
    photo: latestPhoto,
    article: articles[0],
    drama: watching,
    pin: pins[0],
    place: places[places.length - 1],
    character: chars[chars.length - 1],
  };
}

function fieldHtml(label, id, value, type='text', extra=''){
  if(type === 'textarea'){
    return `<div class="field"><label>${label}</label><textarea id="${id}" rows="4">${esc(value||'')}</textarea></div>`;
  }
  if(type === 'checkbox'){
    return `<div class="field field-check"><label><input type="checkbox" id="${id}" ${value?'checked':''}> ${label}</label></div>`;
  }
  if(type === 'select'){
    return `<div class="field"><label>${label}</label><select id="${id}">${extra}</select></div>`;
  }
  if(type === 'file'){
    return `<div class="field"><label>${label}</label><input type="file" id="${id}" accept="image/*">${value?`<div class="field-preview"><img src="${esc(value)}" alt=""></div>`:''}</div>`;
  }
  return `<div class="field"><label>${label}</label><input type="${type}" id="${id}" value="${esc(String(value??''))}"></div>`;
}

function openContentEditor(type, id, isNew){
  if(!isAdmin()){
    document.getElementById('adminModalBack')?.classList.remove('hidden');
    return;
  }
  try{
  ensureContentState();
  pendingContentImage = null;
  pendingSpiritImage = null;

  document.getElementById('contentEditType').value = type;
  document.getElementById('contentEditId').value = id || '';
  document.getElementById('deleteContent').classList.toggle('hidden', isNew || type === 'player');

  let item = null;
  let title = 'Edit';
  let fields = '';

  if(type === 'player'){
    item = getPlayer();
    title = 'Edit player card';
    fields = playerCardEditorHtml(item)
      + fieldHtml('From', 'ce_from', item.from)
      + fieldHtml('Since', 'ce_since', item.since);
  } else if(type === 'character'){
    item = isNew ? {} : getCharacters().find(c => c.id === id);
    if(!item && id && typeof getCoderById === 'function') item = getCoderById(id);
    title = isNew ? 'New player card' : 'Edit player card';
    fields = playerCardEditorHtml(item, { isPlace: false })
      + fieldHtml('Kind', 'ce_type', item?.type || 'Person');
  } else if(type === 'place'){
    item = isNew ? { unlocked: true, placeCard: defaultPlaceCard() } : getPlaces().find(p => p.id === id);
    title = isNew ? 'New place card' : 'Edit place card';
    fields = placeCardEditorHtml(item)
      + fieldHtml('Unlocked on site', 'ce_unlocked', item?.unlocked, 'checkbox');
  } else if(type === 'gallery'){
    item = isNew ? { size: 'md', rotate: 0 } : getGallery().find(g => (g.id||g) === id);
    title = isNew ? 'New photo' : 'Edit photo';
    const sizeOpts = ['sm','md','lg'].map(s => `<option value="${s}" ${item?.size===s?'selected':''}>${s}</option>`).join('');
    fields = fieldHtml('Caption', 'ce_caption', item?.caption)
      + fieldHtml('Place name', 'ce_place', item?.place)
      + fieldHtml('Address', 'ce_address', item?.address)
      + fieldHtml('Day visited', 'ce_visited', item?.visited, 'date')
      + fieldHtml('About the place', 'ce_description', item?.description, 'textarea')
      + fieldHtml('Your story', 'ce_story', item?.story, 'textarea')
      + fieldHtml('Size', 'ce_size', item?.size, 'select', sizeOpts)
      + fieldHtml('Tilt (degrees)', 'ce_rotate', item?.rotate ?? 0, 'number')
      + ImageTools.blockHtml({
          prefix: 'ce_gallery',
          label: 'Photo',
          currentUrl: item?.src || '',
          descValue: item?.photoPrompt || '',
          descPlaceholder: 'Night market lights, friends laughing, neon reflections…',
          hiddenId: 'ce_image',
        });
  } else if(type === 'article'){
    item = isNew ? { layout: 'note', date: new Date().toISOString().slice(0,10) } : getArticles().find(a => a.id === id);
    title = isNew ? 'New article' : 'Edit article';
    const layoutOpts = ['hero','wide','tall','note'].map(l => `<option value="${l}" ${item?.layout===l?'selected':''}>${l}</option>`).join('');
    fields = fieldHtml('Title', 'ce_title', item?.title)
      + fieldHtml('Section', 'ce_section', item?.section)
      + fieldHtml('Date', 'ce_date', item?.date)
      + fieldHtml('Layout', 'ce_layout', item?.layout, 'select', layoutOpts)
      + fieldHtml('Excerpt', 'ce_excerpt', item?.excerpt, 'textarea')
      + fieldHtml('Tags (comma-separated)', 'ce_tags', Array.isArray(item?.tags) ? item.tags.join(', ') : (item?.tags || ''))
      + fieldHtml('Body', 'ce_body', item?.body, 'textarea')
      + ImageTools.blockHtml({
          prefix: 'ce_article',
          label: 'Header image',
          currentUrl: item?.image || '',
          descValue: item?.imagePrompt || '',
          descPlaceholder: 'Moody skyline, journal spread, neon window…',
          hiddenId: 'ce_image',
        });
  }

  document.getElementById('contentEditTitle').textContent = title;
  document.getElementById('contentEditFields').innerHTML = fields;

  if(type === 'player' || type === 'character'){
    wirePlayerCardEditor({ isPlace: false });
  }
  if(type === 'place'){
    wirePlaceCardEditor();
  }
  if(type === 'gallery'){
    ImageTools.wire({
      prefix: 'ce_gallery',
      kind: 'photo',
      hiddenId: 'ce_image',
      cropAspect: [4, 3],
      onChange: url => { pendingContentImage = url; },
    });
  }
  if(type === 'article'){
    ImageTools.wire({
      prefix: 'ce_article',
      kind: 'photo',
      hiddenId: 'ce_image',
      cropAspect: [16, 9],
      onChange: url => { pendingContentImage = url; },
    });
  }

  document.getElementById('contentEditBack').classList.remove('hidden');
  }catch(err){
    console.error('openContentEditor failed:', err);
    alert('Could not open the editor. Try a hard refresh (Ctrl+Shift+R).');
  }
}

function cardFormData(type, image){
  const focus = typeof ImageTools?.readFocus === 'function'
    ? ImageTools.readFocus(type === 'place' ? 'ce_place_photo' : 'ce_portrait')
    : {};
  if(type === 'place'){
    const { parsed, placeCard, placeBlob, photoPrompt } = readPlaceCardForm();
    return {
      name: parsed?.name || '',
      placeCard,
      placeBlob,
      photoPrompt,
      type: 'Place',
      unlocked: document.getElementById('ce_unlocked')?.checked,
      image: image || '',
      ...focus,
    };
  }
  const isPlace = false;
  const { parsed, pokeCard, cardBlob } = readPlayerCardForm({ isPlace });
  const base = {
    name: parsed?.name || '',
    cardSubtitle: parsed?.cardSubtitle || pokeCard.subtitle || '',
    cardDescription: document.getElementById('ce_card_desc')?.value?.trim() || '',
    quote: pokeCard.quote,
    pokeCard,
    cardBlob,
    lookPrompt: typeof readLookPromptFromForm === 'function' ? readLookPromptFromForm() : (document.getElementById('ce_portrait_desc')?.value?.trim() || ''),
    ...focus,
  };
  if(type === 'player'){
    const g = id => document.getElementById(id)?.value?.trim?.() ?? '';
    return { ...base, from: g('ce_from'), since: g('ce_since'), avatar: image || '' };
  }
  if(type === 'character'){
    const g = id => document.getElementById(id)?.value?.trim?.() ?? '';
    return { ...base, type: g('ce_type') || 'Person', image: image || '' };
  }
  return base;
}

function readContentForm(type){
  const g = id => document.getElementById(id)?.value?.trim?.() ?? document.getElementById(id)?.value;
  const image = pendingContentImage !== null ? pendingContentImage : (g('ce_image') || g('ce_avatar') || '');

  if(type === 'player' || type === 'character' || type === 'place'){
    const data = cardFormData(type, image);
    if(!data.name) return {};
    return data;
  }
  if(type === 'gallery'){
    const editId = document.getElementById('contentEditId').value;
    const existing = editId ? getGallery().find(g => g.id === editId) : null;
    const isNew = !editId;
    const presetIdx = isNew ? nextGalleryLayoutIndex() : (existing?.layoutPreset ?? 0);
    const preset = GALLERY_LAYOUTS[presetIdx];
    return {
      caption: g('ce_caption'), place: g('ce_place'), address: g('ce_address'),
      visited: g('ce_visited'), description: g('ce_description'), story: g('ce_story'),
      photoPrompt: document.getElementById('ce_gallery_desc')?.value?.trim() || '',
      layoutPreset: presetIdx,
      size: isNew ? preset.size : (existing?.size || preset.size),
      rotate: isNew ? preset.rotate : (existing?.rotate ?? preset.rotate),
      shiftX: isNew ? preset.shiftX : (existing?.shiftX ?? preset.shiftX),
      shiftY: isNew ? preset.shiftY : (existing?.shiftY ?? preset.shiftY),
      width: isNew ? preset.width : clampGalleryWidth(existing?.width || preset.width),
      src: image,
    };
  }
  if(type === 'article'){
    const tagsRaw = g('ce_tags');
    const tags = tagsRaw ? tagsRaw.split(/[,;]+/).map(t => t.trim()).filter(Boolean) : [];
    return {
      title: g('ce_title'), section: g('ce_section'), date: g('ce_date'), layout: g('ce_layout') || 'note',
      excerpt: g('ce_excerpt'), body: g('ce_body'), tags,
      imagePrompt: document.getElementById('ce_article_desc')?.value?.trim() || '',
      image,
    };
  }
  return {};
}

function saveContentEdit(){
  const type = document.getElementById('contentEditType').value;
  const id = document.getElementById('contentEditId').value;
  const data = readContentForm(type);
  const viewerCard = id && typeof getCoderById === 'function' ? getCoderById(id) : null;
  ensureContentState();

  if(type === 'player'){
    state.content.player = { ...state.content.player, ...data };
  } else if(type === 'character'){
    if(!data.name) return;
    if(viewerCard){
      const idx = state.viewerCharacters.findIndex(c => c.id === id);
      if(idx >= 0){
        const merged = {
          ...viewerCard,
          ...data,
          isCoderCard: true,
          consoleKey: viewerCard.consoleKey,
          points: viewerCard.points,
          xpHistory: viewerCard.xpHistory,
          questsSent: viewerCard.questsSent,
          questsCompleted: viewerCard.questsCompleted,
        };
        state.viewerCharacters[idx] = merged;
        saveState();
        if(typeof postVisitorData === 'function') postVisitorData('updateCharacter', merged);
      }
    } else if(id){
      const i = state.content.characters.findIndex(c => c.id === id);
      if(i >= 0) state.content.characters[i] = { ...state.content.characters[i], ...data };
    } else {
      state.content.characters.push({ id: uid('char'), ...data });
    }
  } else if(type === 'place'){
    if(!data.name) return;
    if(id){
      const i = state.content.places.findIndex(p => p.id === id);
      if(i >= 0) state.content.places[i] = { ...state.content.places[i], ...data };
    } else {
      state.content.places.push({ id: uid('place'), unlocked: true, ...data });
    }
  } else if(type === 'gallery'){
    if(id){
      const i = state.content.gallery.findIndex(g => g.id === id);
      if(i >= 0) state.content.gallery[i] = { ...state.content.gallery[i], ...data };
    } else {
      state.content.gallery.push({ id: uid('gal'), ...data });
    }
  } else if(type === 'article'){
    if(!data.title) return;
    if(id){
      const i = state.content.articles.findIndex(a => a.id === id);
      if(i >= 0) state.content.articles[i] = { ...state.content.articles[i], ...data };
    } else {
      state.content.articles.push({ id: uid('art'), ...data });
    }
  }

  saveState();
  const wasNew = !id;
  if(wasNew && type === 'article' && data.title) LiveSync?.pressSaved(data.title);
  else if(wasNew && type === 'gallery') LiveSync?.gallerySaved(data.caption || data.place);
  else if(wasNew && type === 'place' && data.name) LiveSync?.cardUnlocked('place', data.name);
  else if(wasNew && type === 'character' && data.name) LiveSync?.cardUnlocked('player', data.name);
  else if(type === 'article' && data.title) LiveSync?.pressSaved(data.title);
  else if(type === 'gallery') LiveSync?.gallerySaved(data.caption || data.place);
  pendingContentImage = null;
  pendingSpiritImage = null;
  document.getElementById('contentEditBack').classList.add('hidden');
  document.getElementById('cardModalBack')?.classList.add('hidden');
  renderAll();
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
}

function deleteContentItem(type, id){
  if(!id || !confirm('Delete this?')) return;
  ensureContentState();

  if(type === 'character'){
    if(typeof getCoderById === 'function' && getCoderById(id)){
      state.viewerCharacters = (state.viewerCharacters || []).filter(c => c.id !== id);
      saveState();
      if(typeof postVisitorData === 'function') postVisitorData('deleteCharacter', { id });
    } else {
      state.content.characters = state.content.characters.filter(c => c.id !== id);
      saveState();
    }
  }
  else if(type === 'place') state.content.places = state.content.places.filter(p => p.id !== id);
  else if(type === 'gallery') state.content.gallery = state.content.gallery.filter(g => g.id !== id);
  else if(type === 'article') state.content.articles = state.content.articles.filter(a => a.id !== id);
  else if(type === 'drama'){
    if(!state.hiddenDramas) state.hiddenDramas = [];
    if(!state.hiddenDramas.includes(id)) state.hiddenDramas.push(id);
    state.runtimeDramas = state.runtimeDramas.filter(d => d.id !== id);
    delete state.dramaState[id];
  }
  else return;

  saveState();
  document.getElementById('contentEditBack')?.classList.add('hidden');
  document.getElementById('dramaDetailBack')?.classList.add('hidden');
  renderAll();
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
}

function deleteContentEdit(){
  const type = document.getElementById('contentEditType').value;
  const id = document.getElementById('contentEditId').value;
  deleteContentItem(type, id);
}

document.getElementById('closeContentEdit')?.addEventListener('click', () => document.getElementById('contentEditBack').classList.add('hidden'));
document.getElementById('cancelContentEdit')?.addEventListener('click', () => document.getElementById('contentEditBack').classList.add('hidden'));
document.getElementById('contentEditBack')?.addEventListener('click', e => { if(e.target.id === 'contentEditBack') document.getElementById('contentEditBack').classList.add('hidden'); });
document.getElementById('saveContentEdit')?.addEventListener('click', saveContentEdit);
document.getElementById('deleteContent')?.addEventListener('click', deleteContentEdit);

document.getElementById('exitEditing')?.addEventListener('click', lockAdmin);

document.getElementById('addCharBtn')?.addEventListener('click', () => openContentEditor('character', null, true));
document.getElementById('addPlaceBtn')?.addEventListener('click', () => openContentEditor('place', null, true));
document.getElementById('addGalleryBtn')?.addEventListener('click', () => openContentEditor('gallery', null, true));
document.getElementById('addArticleBtn')?.addEventListener('click', () => openContentEditor('article', null, true));

let pendingDayPhotos = [];

/* ---------- Daily Log (rebuilt) ---------- */
const DailyLog = {
  activeKey: null,

  init(){
    const ledger = document.getElementById('view-ledger');
    if(!ledger || ledger.dataset.dailyLogInit) return;
    ledger.dataset.dailyLogInit = '1';

    ledger.addEventListener('click', e => {
      const dayBtn = e.target.closest('[data-log-day]');
      if(dayBtn){
        e.preventDefault();
        e.stopPropagation();
        this.selectDay(dayBtn.dataset.logDay);
      }
    });

    document.getElementById('calPrev')?.addEventListener('click', () => {
      const { year, month } = getCalendarView();
      const d = new Date(year, month - 1, 1);
      setCalendarView(d.getFullYear(), d.getMonth());
      renderLedger();
    });
    document.getElementById('calNext')?.addEventListener('click', () => {
      const { year, month } = getCalendarView();
      const d = new Date(year, month + 1, 1);
      setCalendarView(d.getFullYear(), d.getMonth());
      renderLedger();
    });

    document.getElementById('logPhotos')?.addEventListener('change', e => {
      [...e.target.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = () => { pendingDayPhotos.push(reader.result); this.renderPhotoPreview(); };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    });

    document.getElementById('saveLog')?.addEventListener('click', e => {
      e.preventDefault();
      this.save();
    });
    document.getElementById('deleteDay')?.addEventListener('click', e => {
      e.preventDefault();
      this.deleteDay();
    });
    document.getElementById('cancelLog')?.addEventListener('click', e => {
      e.preventDefault();
      this.clearSelection();
    });
    document.getElementById('editTodayBtn')?.addEventListener('click', e => {
      e.preventDefault();
      setLogFocusKey(todayKey());
      this.selectDay(todayKey());
    });

    document.querySelectorAll('[data-log-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        setLogViewMode(btn.dataset.logView);
        if(btn.dataset.logView !== 'month') setLogFocusKey(this.activeKey || todayKey());
        document.querySelectorAll('[data-log-view]').forEach(b => b.classList.toggle('is-active', b.dataset.logView === getLogViewMode()));
        renderLedger();
      });
    });
    document.getElementById('logWeekPrev')?.addEventListener('click', () => {
      setLogFocusKey(addDaysToKey(getLogFocusKey(), -7));
      renderLedger();
    });
    document.getElementById('logWeekNext')?.addEventListener('click', () => {
      setLogFocusKey(addDaysToKey(getLogFocusKey(), 7));
      renderLedger();
    });
    document.getElementById('logDayPrev')?.addEventListener('click', () => {
      setLogFocusKey(addDaysToKey(getLogFocusKey(), -1));
      if(isAdmin()) this.selectDay(getLogFocusKey());
      else renderLedger();
    });
    document.getElementById('logDayNext')?.addEventListener('click', () => {
      setLogFocusKey(addDaysToKey(getLogFocusKey(), 1));
      if(isAdmin()) this.selectDay(getLogFocusKey());
      else renderLedger();
    });

    if(isAdmin()) this.onAdminReady();
  },

  renderPlannedSection(dayKey){
    const host = document.getElementById('logPlannedTodos');
    if(!host || !isAdmin()) return;
    const key = dayKey || this.activeKey || todayKey();
    host.innerHTML = HomeCheckIn.renderPlannedTodosBoard(true, key, { compact: true, hideDayPicker: true, hostId: 'logPlannedBoard' });
    HomeCheckIn.bindPlannedTodos(host, {
      rerender: () => {
        this.renderPlannedSection(key);
        renderHomeCheckIn();
      },
      rerenderLog: () => renderLedger(),
    });
  },

  onAdminReady(){
    document.getElementById('dailyLogEditor')?.classList.remove('hidden');
    if(!this.activeKey) this.selectDay(todayKey());
    else this.renderPlannedSection(this.activeKey);
    renderSkillControls();
  },

  selectDay(key){
    if(!key) return;
    setLogFocusKey(key);
    if(!isAdmin()){
      setLogViewMode('book');
      renderLedger();
      return;
    }
    this.activeKey = key;
    const keyInput = document.getElementById('logDateKey');
    if(keyInput) keyInput.value = key;

    const e = state.entries[key];
    const n = normalizeEntry(e);
    pendingDayPhotos = [...(n.photos || [])];

    document.getElementById('logEditorTitle').textContent = fmtDateLong(key);
    mountMoodPicker('logMoodPicker', resolveEntryMood(n) || getCurrentMood(), { name: 'logMood', compact: true });
    document.getElementById('logSteps').value = n.steps || 0;
    document.getElementById('logWork').value = n.workHours || 0;
    document.getElementById('logPeople').value = n.people.join(', ');
    document.getElementById('logPlaces').value = n.places.filter(p => !CONTENT.zones.includes(p)).join(', ');
    document.getElementById('logDiary').value = n.diary || '';

    const hobbySel = document.getElementById('logHobbySelect');
    hobbySel.innerHTML = '<option value="">—</option>' + getHobbyOptions().map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join('');
    hobbySel.value = n.hobby || '';
    document.getElementById('logHobbyHours').value = n.hobbyHours || 0;

    const zoneSelect = document.getElementById('logZone');
    zoneSelect.innerHTML = '<option value="">—</option>' + CONTENT.zones.map(z => `<option value="${esc(z)}">${esc(z)}</option>`).join('');
    zoneSelect.value = n.places.find(p => CONTENT.zones.includes(p)) || '';

    this.renderPhotoPreview();
    document.getElementById('dailyLogEditor')?.classList.remove('hidden');
    document.getElementById('logEditHint').textContent = `Editing ${fmtDateLong(key)}`;

    const preview = document.getElementById('ledgerDayPreview');
    if(preview){
      preview.classList.add('hidden');
      preview.innerHTML = '';
    }

    this.renderPlannedSection(key);
    renderLedger();
  },

  currentKey(){
    return this.activeKey || document.getElementById('logDateKey')?.value || '';
  },

  save(){
    if(!isAdmin()) return;
    const key = this.currentKey();
    if(!key){
      alert('Click a day on the calendar first.');
      return;
    }
    const zone = document.getElementById('logZone').value;
    const extraPlaces = document.getElementById('logPlaces').value.split(',').map(s => s.trim()).filter(Boolean);
    const places = [...new Set([...extraPlaces, ...(zone ? [zone] : [])])];
    const people = document.getElementById('logPeople').value.split(',').map(s => s.trim()).filter(Boolean);

    const dayMood = readMoodPickerValue(document.getElementById('logMoodPicker'), 'logMood');
    if(dayMood) setCurrentMood(dayMood);
    const existing = state.entries[key] || {};
    const hobby = document.getElementById('logHobbySelect').value;
    const hobbyHours = document.getElementById('logHobbyHours').value;
    state.entries[key] = {
      ...existing,
      currentMood: dayMood,
      mood: dayMood,
      steps: document.getElementById('logSteps').value,
      workHours: document.getElementById('logWork').value,
      hobby,
      hobbyHours,
      people,
      places,
      diary: document.getElementById('logDiary').value,
      photos: pendingDayPhotos,
      stream: existing.stream || null,
      dayReflection: existing.dayReflection || null,
      daySummary: existing.daySummary || null,
      dayStartSnapshot: existing.dayStartSnapshot || null,
    };

    places.forEach(z => { if(!state.unlockedZones.includes(z)) state.unlockedZones.push(z); });
    saveState();
    if(hobby) LiveSync?.hobbyLogged(hobby, hobbyHours);
    document.getElementById('logEditHint').textContent = `Saved ${fmtDateLong(key)}`;
    renderLedger();
    renderHomeCheckIn();
  },

  deleteDay(){
    const key = this.currentKey();
    deleteLogDay(key, { keepEditorOpen: true });
  },

  clearSelection(){
    this.activeKey = null;
    document.getElementById('logDateKey').value = '';
    document.getElementById('logEditHint').textContent = 'Click any day to edit it';
    const preview = document.getElementById('ledgerDayPreview');
    if(preview){ preview.classList.add('hidden'); preview.innerHTML = ''; }
    renderLedger();
  },

  renderPhotoPreview(){
    const el = document.getElementById('dayPhotoPreview');
    if(!el) return;
    el.innerHTML = pendingDayPhotos.map((p, i) => {
      const src = typeof p === 'string' ? p : p.src;
      return `<div class="day-preview-thumb"><img src="${esc(src)}" alt=""><button type="button" class="remove-photo" data-i="${i}">×</button></div>`;
    }).join('');
    el.querySelectorAll('.remove-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingDayPhotos.splice(Number(btn.dataset.i), 1);
        this.renderPhotoPreview();
      });
    });
  },
};

/* ---------- Helpers ---------- */
function esc(s){
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

function todayKey(){
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function fmtDate(key){
  return new Date(key + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtDateLong(key){
  return new Date(key + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function moodWord(m){
  if(getMoodById?.(m)) return moodLabel(m);
  const n = Number(m);
  if(Number.isNaN(n) || !m) return '—';
  if(n >= 9) return 'On fire';
  if(n >= 7) return 'Solid';
  if(n >= 5) return 'Fine';
  if(n >= 3) return 'Meh';
  return 'Rough';
}

function moodColor(m){
  if(getMoodById?.(m)) return moodNeon(m);
  const n = Number(m);
  if(Number.isNaN(n) || !m) return '#9b5cff';
  if(n >= 8) return '#3ad6e0';
  if(n >= 5) return '#9b5cff';
  return '#ff4fd8';
}

function mountMoodPicker(hostId, selectedId, opts = {}){
  const host = document.getElementById(hostId);
  if(!host || typeof renderMoodPickerHTML !== 'function') return;
  host.innerHTML = renderMoodPickerHTML(opts.name || 'currentMood', selectedId, { editable: true, compact: opts.compact });
  bindMoodPicker(host, { name: opts.name || 'currentMood', onChange: opts.onChange });
}

function normalizeEntry(e){
  if(!e) return {};
  const people = e.people || (e.person ? [e.person] : []);
  const places = e.places || (e.zone ? [e.zone] : []);
  const currentMood = e.currentMood || (getMoodById?.(e.mood) ? e.mood : '');
  return {
    mood: e.mood,
    currentMood,
    steps: e.steps,
    workHours: e.workHours,
    mandarinHours: e.mandarinHours,
    hobby: e.hobby,
    hobbyHours: e.hobbyHours,
    people,
    places,
    diary: e.diary || e.note || e.thoughts || '',
    photos: e.photos || [],
    stream: e.stream || null,
    dayReflection: e.dayReflection || null,
    daySummary: e.daySummary || null,
    dayStartSnapshot: e.dayStartSnapshot || null,
    plannedTodos: e.plannedTodos || null,
  };
}

function getDayStream(key){
  const raw = state.entries[key];
  const stream = raw?.stream || {};
  return {
    startedAt: stream.startedAt || null,
    endedAt: stream.endedAt || null,
    nodes: Array.isArray(stream.nodes) ? [...stream.nodes] : [],
  };
}

function ensureTodayStream(){
  const key = todayKey();
  if(!state.entries[key]) state.entries[key] = {};
  if(!state.entries[key].stream) state.entries[key].stream = { nodes: [] };
  return key;
}

function ensureStreamForDate(dateStr){
  const key = dateStr || todayKey();
  if(!state.entries[key]) state.entries[key] = {};
  if(!state.entries[key].stream) state.entries[key].stream = { nodes: [] };
  return key;
}

const STREAM_NODE_META = {
  glitch: { label: 'System Glitch', neon: '#f43f8e', icon: '⚡' },
  press: { label: 'The Press', neon: '#fca5a5', icon: '▤' },
  wake: { label: 'Wake', neon: '#6ee7a0', icon: '◉' },
  sleep: { label: 'Sleep', neon: '#71717a', icon: '◎' },
  note: { label: 'Big update', neon: '#3ad6e0', icon: '◆' },
  photo: { label: 'Photo', neon: '#38bdf8', icon: '📷' },
  mood: { label: 'Mood', neon: '#f472b6', icon: '◎' },
  food: { label: 'Food', neon: '#fb923c', icon: '🍜' },
  drink: { label: 'Drink', neon: '#fbbf24', icon: '☕' },
  person: { label: 'Person', neon: '#a78bfa', icon: '👤' },
  place: { label: 'Place', neon: '#4ade80', icon: '📍' },
  song: { label: 'Song', neon: '#f472b6', icon: '♫' },
  book: { label: 'Book', neon: '#a78bfa', icon: '▣' },
  film: { label: 'Film', neon: '#f43f8e', icon: '▶' },
  workout: { label: 'Workout', neon: '#ef4444', icon: '⚡' },
  health: { label: 'Health', neon: '#22d3ee', icon: '✚' },
  work: { label: 'Work', neon: '#60a5fa', icon: '⌁' },
  travel: { label: 'Travel', neon: '#2dd4bf', icon: '✈' },
  weather: { label: 'Weather', neon: '#94a3b8', icon: '☁' },
  purchase: { label: 'Purchase', neon: '#fcd34d', icon: '¥' },
  idea: { label: 'Idea', neon: '#c084fc', icon: '💡' },
  dream: { label: 'Dream', neon: '#818cf8', icon: '☾' },
  anxiety: { label: 'Anxiety', neon: '#f87171', icon: '!' },
  win: { label: 'Win', neon: '#4ade80', icon: '★' },
  gratitude: { label: 'Gratitude', neon: '#f9a8d4', icon: '♥' },
  reflection: { label: 'Reflection', neon: '#fcd34d', icon: '✦' },
  mandarin: { label: 'Mandarin', neon: '#dc2626', icon: '文' },
  hobby: { label: 'Hobby', neon: '#e879f9', icon: '✦' },
  nap: { label: 'Rest', neon: '#64748b', icon: '⋯' },
  event: { label: 'Event', neon: '#f97316', icon: '◈' },
  todo: { label: 'To-do done', neon: '#e8c547', icon: '✓' },
  planned: { label: 'Planned', neon: '#94a3b8', icon: '◷' },
  call: { label: 'Call', neon: '#34d399', icon: '☎' },
  message: { label: 'Message', neon: '#7dd3fc', icon: '✉' },
  news: { label: 'News', neon: '#fca5a5', icon: '▤' },
  learn: { label: 'Learned', neon: '#86efac', icon: '?' },
  vibe: { label: 'Vibe', neon: '#e879f9', icon: '◇' },
  memory: { label: 'Memory', neon: '#fda4af', icon: '⌛' },
  quote: { label: 'Quote', neon: '#fcd34d', icon: '“' },
  quest: { label: 'Quest', neon: '#4ade80', icon: '★' },
};

const PULSE_CARD_NEW = '__new__';

function getPersonCardNames(){
  return (typeof getCharacters === 'function' ? getCharacters() : []).map(c => c.name).filter(Boolean);
}

function getPlaceCardNames(){
  return (typeof getPlaces === 'function' ? getPlaces() : []).map(p => p.name).filter(Boolean);
}

function getHobbyCardNames(){
  if(typeof getSkills !== 'function') return [];
  const names = getSkills().flatMap(s => typeof getHobbyNamesForSkill === 'function' ? getHobbyNamesForSkill(s) : [s.name]);
  return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function cardPickOptions(entity){
  if(entity === 'person') return getPersonCardNames();
  if(entity === 'place') return getPlaceCardNames();
  if(entity === 'hobby') return getHobbyCardNames();
  return [];
}

function cardPickFieldHtml(field){
  const id = `pulseField_${field.id}`;
  const names = cardPickOptions(field.entity);
  const opts = names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  const newPh = field.entity === 'person' ? 'New player name…'
    : field.entity === 'place' ? 'New place name…' : 'New hobby name…';
  return `<div class="field pulse-card-field">
    <label>${field.label}</label>
    <select id="${id}" class="pulse-card-select">
      <option value="">— pick existing —</option>
      ${opts}
      <option value="${PULSE_CARD_NEW}">+ Create new card…</option>
    </select>
    <input type="text" id="${id}_new" class="pulse-card-new hidden" placeholder="${esc(newPh)}">
    <p class="field-hint pulse-card-hint hidden" id="${id}_hint">New card will be created when you drop this pulse.</p>
  </div>`;
}

function readCardPickValue(fieldId){
  const sel = document.getElementById(`pulseField_${fieldId}`);
  const newEl = document.getElementById(`pulseField_${fieldId}_new`);
  if(!sel) return '';
  if(sel.value === PULSE_CARD_NEW) return newEl?.value?.trim() || '';
  return sel.value?.trim() || '';
}

function ensureCharacterCard(name){
  if(!name) return null;
  ensureContentState();
  let c = state.content.characters.find(x => (x.name || '').toLowerCase() === name.toLowerCase());
  if(!c){
    c = {
      id: uid('char'),
      name,
      pokeCard: { level: 1 },
      cardDescription: '',
    };
    state.content.characters.push(c);
    LiveSync?.cardUnlocked('player', name);
    if(typeof awardGrayPoints === 'function') awardGrayPoints(GRAY_XP_AWARDS.new_card.xp, 'new_card');
    saveState();
  }
  return c;
}

function ensurePlaceCard(name){
  if(!name) return null;
  ensureContentState();
  let p = state.content.places.find(x => (x.name || '').toLowerCase() === name.toLowerCase());
  if(!p){
    p = {
      id: uid('place'),
      name,
      unlocked: true,
      placeCard: { level: 1 },
    };
    state.content.places.push(p);
    if(!state.unlockedZones.includes(name)) state.unlockedZones.push(name);
    LiveSync?.cardUnlocked('place', name);
    if(typeof awardGrayPoints === 'function') awardGrayPoints(GRAY_XP_AWARDS.new_card.xp, 'new_card');
    saveState();
  } else if(!p.unlocked){
    p.unlocked = true;
    if(!state.unlockedZones.includes(name)) state.unlockedZones.push(name);
    saveState();
  }
  return p;
}

const PULSE_TYPE_DEFS = {
  note: { fields: [
    { id: 'title', label: 'Title — shows in transmission log', type: 'text', placeholder: 'Headline for this piece of writing', required: true },
    { id: 'body', label: 'Full writing', type: 'textarea', rows: 12, required: true, placeholder: 'As long as you need — journal entry, rant, story, update…' },
  ]},
  photo: { fields: [
    { id: 'photo', label: 'Photo', type: 'photo', required: true },
    { id: 'caption', label: 'Description', type: 'textarea', rows: 4, placeholder: 'What is this? Why does it matter?' },
    { id: 'place', label: 'Where', type: 'text', placeholder: 'Location, venue, room…' },
  ]},
  mood: { fields: [
    { id: 'mood', label: 'Mood (1–10)', type: 'range', min: 1, max: 10, default: 7 },
    { id: 'body', label: 'How you feel', type: 'textarea', rows: 5, placeholder: 'Name it, unpack it, no filter' },
  ]},
  food: { fields: [
    { id: 'what', label: 'What', type: 'text', required: true, placeholder: 'Dish, snack, meal…' },
    { id: 'where', label: 'Where', type: 'text', placeholder: 'Restaurant, home, street stall…' },
    { id: 'rating', label: 'Rating (1–10)', type: 'number', min: 1, max: 10 },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 3 },
  ]},
  drink: { fields: [
    { id: 'what', label: 'What', type: 'text', required: true },
    { id: 'where', label: 'Where', type: 'text' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 3 },
  ]},
  person: { fields: [
    { id: 'name', label: 'Who', type: 'card_pick', entity: 'person', required: true },
    { id: 'context', label: 'Context', type: 'text', placeholder: 'How you met, relationship, vibe…' },
    { id: 'where', label: 'Where', type: 'text' },
    { id: 'body', label: 'Details', type: 'textarea', rows: 5, placeholder: 'Everything worth remembering' },
  ]},
  place: { fields: [
    { id: 'name', label: 'Place', type: 'card_pick', entity: 'place', required: true },
    { id: 'area', label: 'Area / address', type: 'text' },
    { id: 'body', label: 'Discovery notes', type: 'textarea', rows: 5, placeholder: 'What you found, why it matters' },
  ]},
  song: { fields: [
    { id: 'title', label: 'Track', type: 'text', required: true, placeholder: 'Song · artist' },
    { id: 'context', label: 'Context', type: 'text', placeholder: 'Why now, where listening…' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 3 },
  ]},
  book: { fields: [
    { id: 'title', label: 'Book', type: 'text', required: true, placeholder: 'Title · author' },
    { id: 'progress', label: 'Chapter / page', type: 'text' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 4 },
  ]},
  film: { fields: [
    { id: 'title', label: 'Film / show', type: 'text', required: true },
    { id: 'progress', label: 'Episode / scene', type: 'text' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 4 },
  ]},
  workout: { fields: [
    { id: 'what', label: 'Activity', type: 'text', required: true },
    { id: 'duration', label: 'Duration (min)', type: 'number', min: 0 },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 3 },
  ]},
  health: { fields: [
    { id: 'what', label: 'What', type: 'text', required: true, placeholder: 'Symptom, meds, sleep, body…' },
    { id: 'body', label: 'Details', type: 'textarea', rows: 5 },
  ]},
  work: { fields: [
    { id: 'what', label: 'What', type: 'text', required: true },
    { id: 'hours', label: 'Hours', type: 'number', min: 0, step: 0.5 },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 4 },
  ]},
  travel: { fields: [
    { id: 'from', label: 'From', type: 'text' },
    { id: 'to', label: 'To', type: 'text', required: true },
    { id: 'mode', label: 'Mode', type: 'text', placeholder: 'metro, taxi, walk…' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 3 },
  ]},
  weather: { fields: [
    { id: 'what', label: 'Conditions', type: 'text', required: true, placeholder: 'Hot, humid, storm…' },
    { id: 'temp', label: 'Temp (°C)', type: 'text' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 2 },
  ]},
  purchase: { fields: [
    { id: 'what', label: 'What', type: 'text', required: true },
    { id: 'cost', label: 'Cost', type: 'text' },
    { id: 'body', label: 'Why / notes', type: 'textarea', rows: 3 },
  ]},
  idea: { fields: [
    { id: 'title', label: 'Idea', type: 'text', required: true },
    { id: 'body', label: 'Expand', type: 'textarea', rows: 6 },
  ]},
  dream: { fields: [
    { id: 'title', label: 'Title / hook', type: 'text' },
    { id: 'body', label: 'Dream log', type: 'textarea', rows: 7, required: true },
  ]},
  anxiety: { fields: [
    { id: 'trigger', label: 'Trigger', type: 'text' },
    { id: 'intensity', label: 'Intensity (1–10)', type: 'range', min: 1, max: 10, default: 5 },
    { id: 'body', label: 'What is happening', type: 'textarea', rows: 6, required: true },
  ]},
  win: { fields: [
    { id: 'title', label: 'Win', type: 'text', required: true },
    { id: 'body', label: 'Details', type: 'textarea', rows: 4 },
  ]},
  gratitude: { fields: [
    { id: 'what', label: 'Grateful for', type: 'text', required: true },
    { id: 'body', label: 'Why', type: 'textarea', rows: 4 },
  ]},
  mandarin: { fields: [
    { id: 'what', label: 'Session', type: 'text', required: true, placeholder: 'Lesson, practice, conversation…' },
    { id: 'hours', label: 'Hours', type: 'number', min: 0, step: 0.5 },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 4 },
  ]},
  hobby: { fields: [
    { id: 'what', label: 'Hobby', type: 'card_pick', entity: 'hobby', required: true },
    { id: 'hours', label: 'Hours', type: 'number', min: 0, step: 0.5 },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 4 },
  ]},
  nap: { fields: [
    { id: 'duration', label: 'Duration (min)', type: 'number', min: 0 },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Quality, dreams, why you crashed…' },
  ]},
  event: { fields: [
    { id: 'title', label: 'Event', type: 'text', required: true },
    { id: 'where', label: 'Where', type: 'text' },
    { id: 'body', label: 'What happened', type: 'textarea', rows: 6 },
  ]},
  call: { fields: [
    { id: 'who', label: 'Who', type: 'text', required: true },
    { id: 'duration', label: 'Duration (min)', type: 'number', min: 0 },
    { id: 'body', label: 'Summary', type: 'textarea', rows: 5 },
  ]},
  message: { fields: [
    { id: 'who', label: 'Who / where', type: 'text', required: true },
    { id: 'body', label: 'Message / thread', type: 'textarea', rows: 6, required: true },
  ]},
  news: { fields: [
    { id: 'title', label: 'Headline', type: 'text', required: true },
    { id: 'source', label: 'Source', type: 'text' },
    { id: 'body', label: 'Your take', type: 'textarea', rows: 4 },
  ]},
  learn: { fields: [
    { id: 'what', label: 'Learned', type: 'text', required: true },
    { id: 'body', label: 'Details', type: 'textarea', rows: 5 },
  ]},
  vibe: { fields: [
    { id: 'title', label: 'Vibe', type: 'text', required: true, placeholder: 'Energy, atmosphere, mood of the moment' },
    { id: 'body', label: 'Expand', type: 'textarea', rows: 5 },
  ]},
  memory: { fields: [
    { id: 'title', label: 'Memory hook', type: 'text' },
    { id: 'body', label: 'Memory', type: 'textarea', rows: 7, required: true },
  ]},
  quote: { fields: [
    { id: 'text', label: 'Quote', type: 'textarea', rows: 4, required: true, placeholder: 'What they said — verbatim if you can' },
    { id: 'who', label: 'Who said it', type: 'card_pick', entity: 'person', required: true },
    { id: 'context', label: 'Context', type: 'text', placeholder: 'Where, when, why it was funny…' },
  ]},
  quest: { fields: [
    { id: 'title', label: 'Quest', type: 'text', required: true, placeholder: 'Mission title or hook' },
    { id: 'from', label: 'From (coder)', type: 'card_pick', entity: 'person' },
    { id: 'status', label: 'Status', type: 'text', placeholder: 'Sent, accepted, completed…' },
    { id: 'body', label: 'Notes', type: 'textarea', rows: 4 },
  ]},
};

function fmtClockTime(tz){
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function fmtClockDate(tz){
  return new Date().toLocaleDateString('en-GB', {
    timeZone: tz, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function clockOffsetLabel(tz, refTz = 'Europe/London'){
  const now = Date.now();
  const fmt = t => {
    const s = new Date(now).toLocaleString('en-GB', { timeZone: t, hour: '2-digit', minute: '2-digit', hour12: false });
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const diffMin = fmt(tz) - fmt(refTz);
  let diffH = Math.round(diffMin / 60);
  if(diffH > 12) diffH -= 24;
  if(diffH < -12) diffH += 24;
  if(diffH === 0) return 'same time as UK';
  return diffH > 0 ? `${diffH}h ahead of UK` : `${Math.abs(diffH)}h behind UK`;
}

const GRAY_XP_AWARDS = {
  day_sealed: { label: 'Day sealed in log', xp: 25 },
  pulse: { label: 'Pulse dropped live', xp: 5 },
  vault_pulse: { label: 'Vault pulse (offline)', xp: 5 },
  quest_complete: { label: 'Quest completed for a coder', xp: 100 },
  todo_done: { label: 'To-do ticked off', xp: 5 },
  media_review: { label: 'Media unit rated', xp: 5 },
  final_review: { label: 'Final media review written', xp: 25 },
  new_card: { label: 'New player/place card', xp: 50 },
  overload_session: { label: 'Overload session archived', xp: 12 },
  vent_archived: { label: 'Staff vent archived', xp: 8 },
  body_log: { label: 'Body log entry', xp: 5 },
  meal_logged: { label: 'Meal logged in vault', xp: 3 },
  vault_login: { label: 'Vault login', xp: 5 },
  newsletter: { label: 'Weekly newsletter drafted', xp: 15 },
  console_chat: { label: 'System console chat', xp: 2 },
  custom: { label: 'Custom award', xp: 0 },
  login: { label: 'Daily login', xp: 5 },
};

function getGrayPoints(){
  return state.playerPoints || 0;
}

function grayLevelFromPoints(points){
  const pts = points || 0;
  const level = Math.floor(pts / 100);
  const progress = (pts % 100) / 100;
  const xpToNext = pts % 100 === 0 ? 100 : 100 - (pts % 100);
  return { level, points: pts, progress, xpToNext };
}

function awardGrayPoints(amount, reason){
  if(!amount || !isAdmin()) return;
  state.playerPoints = (state.playerPoints || 0) + amount;
  const lvl = grayLevelFromPoints(state.playerPoints);
  if(!state.content) state.content = {};
  if(!state.content.player) state.content.player = {};
  state.content.player.points = state.playerPoints;
  if(state.content.player.pokeCard) state.content.player.pokeCard.level = lvl.level;
  const label = GRAY_XP_AWARDS[reason]?.label || String(reason || 'XP');
  if(!state.playerXpHistory) state.playerXpHistory = [];
  state.playerXpHistory.unshift({
    id: uid('gxp'),
    at: new Date().toISOString(),
    amount,
    reason: reason || 'custom',
    label,
  });
  state.playerXpHistory = state.playerXpHistory.slice(0, 120);
  saveState();
}

function renderGrayXpGuide(){
  return `<section class="gray-xp-guide sketch-card">
    <h3 class="profile-feed-title">Rewards vault</h3>
    <p class="gallery-hint">Private XP rules, monthly goals, and unlock rewards — only Player Gray sees this.</p>
    <button type="button" class="btn primary" id="openRewardsVaultBtn">Open Rewards Vault</button>
  </section>`;
}

const GRAY_VAULT_GOAL_TYPES = {
  monthly_xp: { label: 'Monthly XP', hint: 'Total Gray XP earned this calendar month.' },
  gray_level: { label: 'Gray level', hint: 'Reach a level (floor(XP ÷ 100)) — Lv 0 at 0 XP, Lv 1 at 100.' },
  skill_level: { label: 'Skill tier', hint: 'Reach a tier on a chosen skill tower.' },
  skill_hours: { label: 'Skill hours', hint: 'Log hours on a chosen skill.' },
  custom: { label: 'Custom', hint: 'Mark done manually when you hit it.' },
};

const GRAY_REWARD_UNLOCK_TYPES = {
  xp_total: { label: 'Total Gray XP' },
  gray_level: { label: 'Gray level' },
  skill_level: { label: 'Skill tier' },
  skill_hours: { label: 'Skill hours' },
  manual: { label: 'Manual unlock' },
};

function defaultGrayRewardsVault(){
  const xpRules = Object.entries(GRAY_XP_AWARDS)
    .filter(([k]) => k !== 'custom')
    .map(([key, v]) => ({
      id: key,
      label: v.label,
      xp: v.xp,
      category: key === 'login' ? 'daily' : key.includes('quest') ? 'social' : 'live',
      note: '',
    }));
  return {
    stationNote: 'Your private reward station — edit XP rules, set monthly goals, and claim treats when you unlock them.',
    xpRules,
    goals: [
      {
        id: uid('ggoal'),
        title: 'Monthly XP push',
        type: 'monthly_xp',
        targetValue: 150,
        skillId: '',
        rewardNote: 'Take yourself out — dinner, cinema, or something silly.',
        done: false,
      },
      {
        id: uid('ggoal'),
        title: 'Level up one skill tier',
        type: 'skill_level',
        targetValue: 2,
        skillId: '',
        rewardNote: 'Small upgrade for that hobby.',
        done: false,
      },
    ],
    rewards: [
      {
        id: uid('grw'),
        title: 'Victory pint',
        description: 'Any pub, any day — you sealed the month.',
        unlockType: 'xp_total',
        unlockValue: 100,
        skillId: '',
        claimed: false,
      },
      {
        id: uid('grw'),
        title: 'Big treat',
        description: 'Dinner or gadget — Gray picks when ready.',
        unlockType: 'gray_level',
        unlockValue: 5,
        skillId: '',
        claimed: false,
      },
    ],
  };
}

function ensureGrayRewardsVault(){
  if(state.grayRewardsVault?.xpRules?.length) return state.grayRewardsVault;
  state.grayRewardsVault = defaultGrayRewardsVault();
  saveState();
  return state.grayRewardsVault;
}

function getGrayVaultXpRules(){
  const vault = ensureGrayRewardsVault();
  return vault.xpRules || [];
}

function getMonthlyGrayXp(ref = new Date()){
  const y = ref.getFullYear();
  const m = ref.getMonth();
  return (state.playerXpHistory || []).reduce((sum, entry) => {
    if(!entry?.at || !entry.amount) return sum;
    const d = new Date(entry.at);
    if(d.getFullYear() === y && d.getMonth() === m) return sum + entry.amount;
    return sum;
  }, 0);
}

function getGrayGoalProgress(goal){
  if(!goal) return { current: 0, target: 0, pct: 0, met: false };
  const target = Number(goal.targetValue) || 0;
  let current = 0;
  if(goal.type === 'monthly_xp') current = getMonthlyGrayXp();
  else if(goal.type === 'gray_level') current = grayLevelFromPoints(getGrayPoints()).level;
  else if(goal.type === 'skill_level') current = getSkillTier(getTotalSkillHours(goal.skillId)).level;
  else if(goal.type === 'skill_hours') current = getTotalSkillHours(goal.skillId);
  else if(goal.type === 'custom') current = goal.done ? 1 : 0;
  const met = goal.done || (goal.type === 'custom' ? !!goal.done : target > 0 && current >= target);
  const pct = target > 0 ? Math.min(1, current / target) : (met ? 1 : 0);
  return { current, target, pct, met };
}

function isGrayRewardUnlocked(reward){
  if(!reward) return false;
  if(reward.unlockType === 'manual') return true;
  const val = Number(reward.unlockValue) || 0;
  if(reward.unlockType === 'xp_total') return getGrayPoints() >= val;
  if(reward.unlockType === 'gray_level') return grayLevelFromPoints(getGrayPoints()).level >= val;
  if(reward.unlockType === 'skill_level') return getSkillTier(getTotalSkillHours(reward.skillId)).level >= val;
  if(reward.unlockType === 'skill_hours') return getTotalSkillHours(reward.skillId) >= val;
  return false;
}

function grayVaultSkillOptions(selected){
  return getSkills().map(s =>
    `<option value="${esc(s.id)}"${selected === s.id ? ' selected' : ''}>${esc(s.name)}</option>`,
  ).join('');
}

function renderGrayRewardsVault(){
  const host = document.getElementById('grayRewardsSpread');
  if(!host || !isAdmin()) return;
  const vault = ensureGrayRewardsVault();
  const lvl = grayLevelFromPoints(getGrayPoints());
  const monthXp = getMonthlyGrayXp();
  const monthName = new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const rulesHtml = getGrayVaultXpRules().map(rule => `
    <div class="vault-rule-row" data-rule-id="${esc(rule.id)}">
      <div class="vault-rule-main">
        <strong>+${rule.xp || 0}</strong>
        <span>${esc(rule.label)}</span>
        ${rule.category ? `<em class="vault-tag">${esc(rule.category)}</em>` : ''}
        ${rule.note ? `<p class="vault-note">${esc(rule.note)}</p>` : ''}
      </div>
      <div class="vault-row-actions">
        <button type="button" class="btn vault-edit-rule" data-rule-id="${esc(rule.id)}">Edit</button>
        <button type="button" class="btn admin-delete vault-del-rule" data-rule-id="${esc(rule.id)}">×</button>
      </div>
    </div>`).join('') || '<p class="empty-hint">No XP rules yet.</p>';

  const goalsHtml = (vault.goals || []).map(goal => {
    const prog = getGrayGoalProgress(goal);
    const typeMeta = GRAY_VAULT_GOAL_TYPES[goal.type] || GRAY_VAULT_GOAL_TYPES.custom;
    const skill = goal.skillId ? getSkills().find(s => s.id === goal.skillId) : null;
    return `<div class="vault-goal-row${goal.done ? ' is-done' : ''}" data-goal-id="${esc(goal.id)}">
      <div class="vault-goal-head">
        <strong>${esc(goal.title)}</strong>
        <span class="vault-tag">${esc(typeMeta.label)}</span>
      </div>
      <p class="vault-note">${esc(goal.rewardNote || '')}</p>
      ${skill ? `<p class="field-hint">Skill: ${esc(skill.name)}</p>` : ''}
      <div class="gray-xp-bar vault-progress"><span style="width:${Math.round(prog.pct * 100)}%"></span></div>
      <p class="gray-xp-meta">${Math.round(prog.current * 10) / 10} / ${prog.target || '—'} ${goal.done ? '· done' : ''}</p>
      <div class="vault-row-actions">
        <button type="button" class="btn vault-toggle-goal" data-goal-id="${esc(goal.id)}">${goal.done ? 'Reopen' : 'Mark done'}</button>
        <button type="button" class="btn vault-edit-goal" data-goal-id="${esc(goal.id)}">Edit</button>
        <button type="button" class="btn admin-delete vault-del-goal" data-goal-id="${esc(goal.id)}">×</button>
      </div>
    </div>`;
  }).join('') || '<p class="empty-hint">No goals yet — add a monthly target below.</p>';

  const rewardsHtml = (vault.rewards || []).map(reward => {
    const unlocked = isGrayRewardUnlocked(reward);
    const unlockMeta = GRAY_REWARD_UNLOCK_TYPES[reward.unlockType] || { label: reward.unlockType };
    const skill = reward.skillId ? getSkills().find(s => s.id === reward.skillId) : null;
    return `<div class="vault-reward-row${unlocked ? ' is-unlocked' : ''}${reward.claimed ? ' is-claimed' : ''}" data-reward-id="${esc(reward.id)}">
      <div class="vault-reward-head">
        <strong>${esc(reward.title)}</strong>
        <span class="vault-tag">${esc(unlockMeta.label)} ≥ ${reward.unlockValue ?? '—'}${skill ? ` · ${esc(skill.name)}` : ''}</span>
      </div>
      <p class="vault-note">${esc(reward.description || '')}</p>
      <div class="vault-row-actions">
        ${unlocked && !reward.claimed ? `<button type="button" class="btn primary vault-claim-reward" data-reward-id="${esc(reward.id)}">Claim</button>` : ''}
        ${reward.claimed ? `<span class="vault-claimed-tag">Claimed</span>` : ''}
        <button type="button" class="btn vault-edit-reward" data-reward-id="${esc(reward.id)}">Edit</button>
        <button type="button" class="btn admin-delete vault-del-reward" data-reward-id="${esc(reward.id)}">×</button>
      </div>
    </div>`;
  }).join('') || '<p class="empty-hint">No rewards yet — add treats you want to earn.</p>';

  host.innerHTML = `
    <section class="vault-overview sketch-card">
      <p class="vault-station-note">${esc(vault.stationNote || '')}</p>
      <div class="vault-stat-row">
        <span class="profile-id-chip" style="--pic-neon:#fcd34d">${getGrayPoints()} XP</span>
        <span class="profile-id-chip" style="--pic-neon:#ff4fd8">Lv ${lvl.level}</span>
        <span class="profile-id-chip" style="--pic-neon:#3ad6e0">${monthXp} XP · ${esc(monthName)}</span>
      </div>
      <div class="field"><label>Station note</label><textarea id="vaultStationNote" rows="2">${esc(vault.stationNote || '')}</textarea></div>
      <button type="button" class="btn" id="saveVaultStationNote">Save note</button>
    </section>

    <section class="vault-section sketch-card">
      <h3 class="viewer-wizard-title">How to earn XP</h3>
      <p class="field-hint">Edit amounts and notes — this is your private rulebook.</p>
      <div class="vault-rule-list">${rulesHtml}</div>
      <form id="vaultAddRuleForm" class="vault-add-form">
        <div class="field-row">
          <div class="field"><label>Action</label><input type="text" id="vaultRuleLabel" required placeholder="Seal a day"></div>
          <div class="field"><label>XP</label><input type="number" id="vaultRuleXp" min="0" value="5"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Category</label><input type="text" id="vaultRuleCategory" placeholder="daily, live, content…"></div>
          <div class="field"><label>Note</label><input type="text" id="vaultRuleNote" placeholder="When / why you get this"></div>
        </div>
        <button type="submit" class="btn primary">Add XP rule</button>
      </form>
    </section>

    <section class="vault-section sketch-card">
      <h3 class="viewer-wizard-title">Goals · ${esc(monthName)}</h3>
      <p class="field-hint">Monthly XP targets, skill tier pushes, or anything you want to hit once.</p>
      <div class="vault-goal-list">${goalsHtml}</div>
      <form id="vaultAddGoalForm" class="vault-add-form">
        <div class="field"><label>Goal title</label><input type="text" id="vaultGoalTitle" required placeholder="Earn 200 XP this month"></div>
        <div class="field-row">
          <div class="field"><label>Type</label><select id="vaultGoalType">${Object.entries(GRAY_VAULT_GOAL_TYPES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select></div>
          <div class="field"><label>Target</label><input type="number" id="vaultGoalTarget" min="1" value="100"></div>
        </div>
        <div class="field vault-skill-field"><label>Skill (for skill goals)</label><select id="vaultGoalSkill"><option value="">—</option>${grayVaultSkillOptions('')}</select></div>
        <div class="field"><label>Reward when hit</label><input type="text" id="vaultGoalRewardNote" placeholder="What you get when you nail it"></div>
        <button type="submit" class="btn primary">Add goal</button>
      </form>
    </section>

    <section class="vault-section sketch-card">
      <h3 class="viewer-wizard-title">Reward station</h3>
      <p class="field-hint">Unlock treats by XP, level, or skill progress — claim when you earn them.</p>
      <div class="vault-reward-list">${rewardsHtml}</div>
      <form id="vaultAddRewardForm" class="vault-add-form">
        <div class="field"><label>Reward</label><input type="text" id="vaultRewardTitle" required placeholder="Victory pint"></div>
        <div class="field"><label>Description</label><input type="text" id="vaultRewardDesc" placeholder="What / where / vibe"></div>
        <div class="field-row">
          <div class="field"><label>Unlock by</label><select id="vaultRewardUnlockType">${Object.entries(GRAY_REWARD_UNLOCK_TYPES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select></div>
          <div class="field"><label>Value</label><input type="number" id="vaultRewardUnlockValue" min="0" value="100"></div>
        </div>
        <div class="field vault-skill-field-reward"><label>Skill (if needed)</label><select id="vaultRewardSkill"><option value="">—</option>${grayVaultSkillOptions('')}</select></div>
        <button type="submit" class="btn primary">Add reward</button>
      </form>
    </section>`;

  wireGrayRewardsVault(host);
}

function wireGrayRewardsVault(host){
  host.querySelector('#saveVaultStationNote')?.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    vault.stationNote = document.getElementById('vaultStationNote')?.value?.trim() || '';
    saveState();
    renderGrayRewardsVault();
  });

  host.querySelector('#vaultAddRuleForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const vault = ensureGrayRewardsVault();
    vault.xpRules.push({
      id: uid('gxpr'),
      label: document.getElementById('vaultRuleLabel')?.value?.trim() || 'Custom',
      xp: Number(document.getElementById('vaultRuleXp')?.value) || 0,
      category: document.getElementById('vaultRuleCategory')?.value?.trim() || 'custom',
      note: document.getElementById('vaultRuleNote')?.value?.trim() || '',
    });
    saveState();
    renderGrayRewardsVault();
  });

  host.querySelector('#vaultAddGoalForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const vault = ensureGrayRewardsVault();
    vault.goals.push({
      id: uid('ggoal'),
      title: document.getElementById('vaultGoalTitle')?.value?.trim() || 'New goal',
      type: document.getElementById('vaultGoalType')?.value || 'custom',
      targetValue: Number(document.getElementById('vaultGoalTarget')?.value) || 1,
      skillId: document.getElementById('vaultGoalSkill')?.value || '',
      rewardNote: document.getElementById('vaultGoalRewardNote')?.value?.trim() || '',
      done: false,
    });
    saveState();
    renderGrayRewardsVault();
  });

  host.querySelector('#vaultAddRewardForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const vault = ensureGrayRewardsVault();
    vault.rewards.push({
      id: uid('grw'),
      title: document.getElementById('vaultRewardTitle')?.value?.trim() || 'Treat',
      description: document.getElementById('vaultRewardDesc')?.value?.trim() || '',
      unlockType: document.getElementById('vaultRewardUnlockType')?.value || 'manual',
      unlockValue: Number(document.getElementById('vaultRewardUnlockValue')?.value) || 0,
      skillId: document.getElementById('vaultRewardSkill')?.value || '',
      claimed: false,
    });
    saveState();
    renderGrayRewardsVault();
  });

  host.querySelectorAll('.vault-del-rule').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    vault.xpRules = vault.xpRules.filter(r => r.id !== btn.dataset.ruleId);
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-edit-rule').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    const rule = vault.xpRules.find(r => r.id === btn.dataset.ruleId);
    if(!rule) return;
    const label = prompt('Action label', rule.label);
    if(label == null) return;
    const xp = prompt('XP amount', String(rule.xp ?? 0));
    if(xp == null) return;
    const note = prompt('Note (optional)', rule.note || '');
    rule.label = label.trim() || rule.label;
    rule.xp = Number(xp) || 0;
    if(note != null) rule.note = note.trim();
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-del-goal').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    vault.goals = vault.goals.filter(g => g.id !== btn.dataset.goalId);
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-toggle-goal').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    const goal = vault.goals.find(g => g.id === btn.dataset.goalId);
    if(!goal) return;
    goal.done = !goal.done;
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-edit-goal').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    const goal = vault.goals.find(g => g.id === btn.dataset.goalId);
    if(!goal) return;
    const title = prompt('Goal title', goal.title);
    if(title == null) return;
    const target = prompt('Target value', String(goal.targetValue ?? 1));
    if(target == null) return;
    const rewardNote = prompt('Reward when hit', goal.rewardNote || '');
    goal.title = title.trim() || goal.title;
    goal.targetValue = Number(target) || goal.targetValue;
    if(rewardNote != null) goal.rewardNote = rewardNote.trim();
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-del-reward').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    vault.rewards = vault.rewards.filter(r => r.id !== btn.dataset.rewardId);
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-edit-reward').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    const reward = vault.rewards.find(r => r.id === btn.dataset.rewardId);
    if(!reward) return;
    const title = prompt('Reward title', reward.title);
    if(title == null) return;
    const desc = prompt('Description', reward.description || '');
    if(desc == null) return;
    const val = prompt('Unlock value', String(reward.unlockValue ?? 0));
    reward.title = title.trim() || reward.title;
    reward.description = desc.trim();
    if(val != null) reward.unlockValue = Number(val) || 0;
    saveState();
    renderGrayRewardsVault();
  }));

  host.querySelectorAll('.vault-claim-reward').forEach(btn => btn.addEventListener('click', () => {
    const vault = ensureGrayRewardsVault();
    const reward = vault.rewards.find(r => r.id === btn.dataset.rewardId);
    if(!reward || !isGrayRewardUnlocked(reward)) return;
    reward.claimed = true;
    reward.claimedAt = new Date().toISOString();
    saveState();
    renderGrayRewardsVault();
  }));

  const syncSkillFields = () => {
    const goalType = document.getElementById('vaultGoalType')?.value;
    const rewardType = document.getElementById('vaultRewardUnlockType')?.value;
    host.querySelector('.vault-skill-field')?.classList.toggle('hidden', !['skill_level', 'skill_hours'].includes(goalType));
    host.querySelector('.vault-skill-field-reward')?.classList.toggle('hidden', !['skill_level', 'skill_hours'].includes(rewardType));
  };
  document.getElementById('vaultGoalType')?.addEventListener('change', syncSkillFields);
  document.getElementById('vaultRewardUnlockType')?.addEventListener('change', syncSkillFields);
  syncSkillFields();
}

function openGrayRewardsDrawer(){
  if(!isAdmin()) return;
  closeInboxDrawer();
  renderGrayRewardsVault();
  document.getElementById('grayRewardsBackdrop')?.classList.remove('hidden');
  document.getElementById('grayRewardsDrawer')?.classList.remove('hidden');
  document.body.classList.add('gray-rewards-open');
}

function closeGrayRewardsDrawer(){
  document.getElementById('grayRewardsBackdrop')?.classList.add('hidden');
  document.getElementById('grayRewardsDrawer')?.classList.add('hidden');
  document.body.classList.remove('gray-rewards-open');
}

function toggleGrayRewardsDrawer(){
  if(document.body.classList.contains('gray-rewards-open')) closeGrayRewardsDrawer();
  else openGrayRewardsDrawer();
}

function openInboxDrawer(){
  const canInbox = isAdmin() || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());
  if(!canInbox) return;
  closeGrayRewardsDrawer();
  if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderInbox?.();
  document.getElementById('inboxDrawerBackdrop')?.classList.remove('hidden');
  document.getElementById('inboxDrawer')?.classList.remove('hidden');
  document.body.classList.add('inbox-drawer-open');
}

function closeInboxDrawer(){
  document.getElementById('inboxDrawerBackdrop')?.classList.add('hidden');
  document.getElementById('inboxDrawer')?.classList.add('hidden');
  document.body.classList.remove('inbox-drawer-open');
}

function toggleInboxDrawer(){
  if(document.body.classList.contains('inbox-drawer-open')) closeInboxDrawer();
  else openInboxDrawer();
}

function renderGrayXpHistory(){
  const items = (state.playerXpHistory || []).slice(0, 40);
  if(!items.length) return `<p class="profile-empty">No XP logged yet — seal a day, drop a pulse, or finish a quest.</p>`;
  return `<div class="live-rail-track xp-history-rail">
    <div class="live-rail-spine" aria-hidden="true"></div>
    <div class="live-rail-nodes">${items.map(entry => {
      const when = entry.at ? new Date(entry.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      return `<article class="live-node" style="--ln-neon:#fcd34d">
        <div class="live-node-marker"><span class="live-node-core"></span></div>
        <div class="live-node-card">
          <div class="live-node-top"><time class="live-node-time">${esc(when)}</time><span class="live-node-type">+${entry.amount} XP</span></div>
          <p class="live-node-text">${esc(entry.label || entry.reason)}</p>
        </div>
      </article>`;
    }).join('')}</div>
  </div>`;
}

function fmtNodeTime(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtNodeDateShort(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtNodeStamp(iso, refDayKey){
  if(!iso) return '—';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if(!refDayKey || dayKey !== refDayKey){
    return `${fmtNodeDateShort(iso)} · ${time}`;
  }
  return time;
}

function fmtNodeTimeFull(iso){
  return fmtNodeStamp(iso, null);
}

function composePulseAt(dateStr, timeStr){
  const [y, m, d] = (dateStr || todayKey()).split('-').map(Number);
  const parts = (timeStr || '12:00').split(':').map(Number);
  return new Date(y, m - 1, d, parts[0] || 0, parts[1] || 0, parts[2] || 0).toISOString();
}

function nowTimeInputValue(){
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`;
}

function compressPulsePhoto(dataUrl, maxW = 900){
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function buildPulseSummary(type, data){
  const join = (...parts) => parts.filter(Boolean).join(' · ');
  switch(type){
    case 'note': return data.title || (data.body || '').slice(0, 120);
    case 'photo': return join(data.caption?.split('\n')[0], data.place);
    case 'mood': return join(`Mood ${data.mood || '?'}/10`, (data.body || '').slice(0, 80));
    case 'food': return join(data.what, data.where, data.rating ? `${data.rating}/10` : '');
    case 'drink': return join(data.what, data.where);
    case 'person': return join('Met', data.name, data.context);
    case 'place': return join('Found', data.name, data.area);
    case 'song':
    case 'book':
    case 'film': return join(data.title, data.progress || data.context);
    case 'workout': return join(data.what, data.duration ? `${data.duration}m` : '');
    case 'health': return data.what;
    case 'work': return join(data.what, data.hours ? `${data.hours}h` : '');
    case 'travel': return join(data.from ? `${data.from} →` : '', data.to, data.mode);
    case 'weather': return join(data.what, data.temp ? `${data.temp}°C` : '');
    case 'purchase': return join(data.what, data.cost);
    case 'idea':
    case 'dream':
    case 'win':
    case 'event':
    case 'news':
    case 'vibe':
    case 'memory': return data.title || (data.body || '').slice(0, 100);
    case 'anxiety': return join(data.trigger, data.intensity ? `intensity ${data.intensity}/10` : '');
    case 'gratitude': return data.what;
    case 'mandarin':
    case 'hobby': return join(data.what, data.hours ? `${data.hours}h` : '');
    case 'nap': return join('Rest', data.duration ? `${data.duration}m` : '');
    case 'call': return join('Call', data.who, data.duration ? `${data.duration}m` : '');
    case 'message': return join(data.who, (data.body || '').slice(0, 60));
    case 'learn': return data.what;
    case 'quote': return join('“' + (data.text || '').slice(0, 80) + (data.text?.length > 80 ? '…”' : '”'), data.who);
    case 'quest': return join('Quest', data.title, data.from, data.status);
    default: return data.body || data.title || data.what || data.name || data.text || '';
  }
}

function streamDiaryDraft(nodes){
  return nodes
    .filter(n => n.type !== 'wake' && n.type !== 'sleep')
    .map(n => {
      const label = STREAM_NODE_META[n.type]?.label || n.type;
      const stamp = fmtNodeStamp(n.at, null);
      const extra = n.body && n.body !== n.text ? `\n  ${n.body}` : '';
      return `[${stamp}] ${label}: ${n.text || ''}${extra}`;
    })
    .join('\n\n');
}

function last7Entries(){
  return Object.entries(state.entries).filter(([key]) => {
    const days = (Date.now() - new Date(key + 'T00:00:00')) / 86400000;
    return days >= 0 && days < 7;
  });
}

function allCharacters(){ return getCharacters(); }

function getUnlockedZones(){
  const fromPlaces = getPlaces().filter(p => p.unlocked).map(p => p.name);
  const fromLogs = Object.values(state.entries).flatMap(e => normalizeEntry(e).places);
  return [...new Set([...state.unlockedZones, ...fromPlaces, ...fromLogs])];
}

function countPlaceVisits(placeName){
  if(!placeName) return 0;
  let c = 0;
  Object.values(state.entries).forEach(raw => {
    normalizeEntry(raw).places.forEach(p => { if(p === placeName) c++; });
  });
  return c;
}

function appendTodayListField(field, value){
  if(!value) return false;
  const key = todayKey();
  const raw = state.entries[key] || {};
  const n = normalizeEntry(raw);
  const list = [...(n[field] || [])];
  if(list.includes(value)) return false;
  state.entries[key] = { ...raw, [field]: [...list, value] };
  saveState();
  return true;
}

function recordPlayerMeetup(name){
  if(!name) return;
  appendTodayListField('people', name);
  LiveSync?.playerMet(name);
  if(typeof renderHomeCheckIn === 'function') renderHomeCheckIn();
}

function recordPlaceVisit(name){
  if(!name) return;
  appendTodayListField('places', name);
  if(!state.unlockedZones.includes(name)) state.unlockedZones.push(name);
  const place = getPlaces().find(p => p.name === name);
  if(place && !place.unlocked) place.unlocked = true;
  saveState();
  LiveSync?.placeVisited(name);
  if(typeof renderHomeCheckIn === 'function') renderHomeCheckIn();
  if(typeof renderAbout === 'function') renderAbout();
}

/* ---------- Skills ---------- */
function getHobbyNamesForSkill(skill){
  if(!skill || skill.id === 'mandarin') return [];
  if(Array.isArray(skill.hobbyNames) && skill.hobbyNames.length) return skill.hobbyNames.filter(Boolean);
  if(skill.hobbyLabel) return [skill.hobbyLabel];
  return [skill.name];
}

function getMandarinHobbyNames(){
  const skill = getSkills().find(s => s.id === 'mandarin');
  return skill ? getHobbyNamesForSkill(skill) : ['Mandarin'];
}

function mandarinHoursFromEntry(e){
  const n = normalizeEntry(e);
  const names = getMandarinHobbyNames().map(x => x.toLowerCase());
  if(n.hobby && names.includes(n.hobby.toLowerCase())) return Number(n.hobbyHours) || 0;
  return 0;
}

function getHobbyOptions(){
  return getSkills().flatMap(getHobbyNamesForSkill);
}

function getHobbySkillMap(){
  const map = {};
  getSkills().forEach(skill => {
    getHobbyNamesForSkill(skill).forEach(name => { map[name] = skill.id; });
  });
  return map;
}

function getTotalSkillHours(skillId){
  const base = getSkills().find(s => s.id === skillId);
  let hrs = (base?.hours || 0) + (state.skillHours[skillId] || 0);

  Object.values(state.entries).forEach(raw => {
    const e = normalizeEntry(raw);
    if(e.hobby){
      const mapped = getHobbySkillMap()[e.hobby];
      if(mapped === skillId) hrs += Number(e.hobbyHours) || 0;
    }
  });
  return hrs;
}

function getSkillTier(hours){
  let tier = SKILL_TIERS[0];
  for(const t of SKILL_TIERS){
    if(hours >= t.hours) tier = t;
    else break;
  }
  const idx = SKILL_TIERS.indexOf(tier);
  const next = SKILL_TIERS[idx + 1];
  const progress = next ? (hours - tier.hours) / (next.hours - tier.hours) : 1;
  return { ...tier, hours, progress: Math.min(1, Math.max(0, progress)), next };
}

/* ---------- Drama ---------- */
function getDrama(id){
  const base = state.runtimeDramas.find(d => d.id === id) || CONTENT.dramas.find(d => d.id === id);
  if(!base) return null;
  const st = state.dramaState[id] || {};
  return {
    ...base,
    mediaType: base.mediaType || st.mediaType || 'tv',
    country: st.country ?? base.country ?? '',
    image: st.image ?? base.image ?? '',
    currentEpisode: st.currentEpisode ?? base.currentEpisode ?? 0,
    status: st.status ?? base.status ?? 'watching',
    finalReview: st.finalReview ?? '',
    episodes: st.episodes ?? {},
  };
}

function allDramas(){
  const hidden = new Set(state.hiddenDramas || []);
  const ids = new Set([...CONTENT.dramas.map(d => d.id), ...state.runtimeDramas.map(d => d.id)]);
  return [...ids].filter(id => !hidden.has(id)).map(getDrama).filter(Boolean);
}

function computeShowRating(drama){
  const attrs = getMediaAttributes(drama.mediaType || 'tv');
  const eps = Object.values(drama.episodes || {});
  if(!eps.length) return null;
  let sum = 0, count = 0;
  eps.forEach(ep => {
    if(!ep.ratings) return;
    attrs.forEach(a => {
      if(ep.ratings[a.id]){
        sum += Number(ep.ratings[a.id]);
        count++;
      }
    });
  });
  if(!count) return null;
  return (sum / count).toFixed(1);
}

function computeShowRatingDots(drama, color){
  const avg = computeShowRating(drama);
  if(!avg) return '';
  return neonDots(Number(avg), 5, color || stableNeon(drama.id, 1));
}

function ensureDramaState(id){
  if(!state.dramaState[id]) state.dramaState[id] = { episodes: {} };
  if(!state.dramaState[id].episodes) state.dramaState[id].episodes = {};
}

/* ---------- Skyline ---------- */
(function buildSkyline(){
  const svg = document.getElementById('skyline');
  if(!svg) return;
  const W = 2400, H = 720, baseY = H;
  const neonColors = ['#ff4fd8','#e94ff5','#9b5cff','#4fa3ff','#3ad6e0','#38bdf8','#f472b6'];
  const signTexts = ['サイバー','NEON','灰','深圳','PUNK','夜','GRAY','光','RAIN','新','街'];
  let x = 0;
  let html = `<rect x="0" y="${baseY - 50}" width="${W}" height="50" fill="#080510"/>`;
  while(x < W){
    const bw = 24 + Math.floor(Math.random() * 52);
    const bh = 180 + Math.floor(Math.random() * 480);
    html += `<rect x="${x}" y="${baseY - bh}" width="${bw}" height="${bh}" class="${Math.random()>0.5?'bld':'bld-alt'}"/>`;
    const cols = Math.max(2, Math.floor(bw / 12));
    const rows = Math.max(4, Math.floor(bh / 16));
    for(let r = 0; r < rows; r++){
      for(let c = 0; c < cols; c++){
        if(Math.random() > 0.5){
          const lit = Math.random() > 0.35;
          html += `<rect x="${x+3+c*(bw/cols)}" y="${baseY-bh+6+r*14}" width="3" height="5" fill="${lit?(Math.random()>0.65?'#3ad6e0':'#f3ecfb'):'#1a1228'}" opacity="${lit?0.5+Math.random()*0.4:0.12}"/>`;
        }
      }
    }
    if(Math.random() > 0.3 && bh > 140){
      const nc = neonColors[Math.floor(Math.random() * neonColors.length)];
      const signY = baseY - bh + 24 + Math.random() * (bh * 0.55);
      if(Math.random() > 0.45){
        html += `<text x="${x+bw/2}" y="${signY}" fill="${nc}" text-anchor="middle" class="neon-sign" opacity="0.9">${signTexts[Math.floor(Math.random()*signTexts.length)]}</text>`;
      } else {
        const sh = 40 + Math.random() * 120;
        html += `<rect x="${x+3}" y="${signY}" width="3" height="${sh}" fill="${nc}" class="neon-bar" opacity="0.75"/>`;
      }
    }
    x += bw;
  }
  svg.innerHTML = html;
})();

function initGlobalEditHandlers(){
  if(document.body.dataset.gaEditInit) return;
  document.body.dataset.gaEditInit = '1';

  document.addEventListener('click', e => {
    const editBtn = e.target.closest('.flip-edit-btn, .card-edit-front');
    if(!editBtn) return;
    e.preventDefault();
    e.stopPropagation();
    if(!isAdmin()){
      document.getElementById('adminModalBack')?.classList.remove('hidden');
      return;
    }
    const poke = editBtn.closest('.poke-flip');
    if(poke && typeof openCardEditor === 'function'){
      openCardEditor(poke);
      return;
    }
    const photo = editBtn.closest('.photo-flip');
    if(photo) openContentEditor('gallery', photo.dataset.galleryId, false);
  }, true);
}

function showLoginIfNeeded(){
  if(typeof isSiteUnlocked === 'function' && isSiteUnlocked()) return;
  if(typeof showEntryGate === 'function') showEntryGate();
}

function dismissLoading(){
  const el = document.getElementById('loading');
  if(!el) return;
  if(!el.dataset.dismissed){
    el.dataset.dismissed = '1';
    el.classList.add('is-dismissed');
    document.body.classList.add('app-ready');
    try{ sessionStorage.setItem('ga-saw-intro', '1'); }catch(e){}
    setTimeout(() => el.remove(), 700);
  }
  document.getElementById('bootError')?.classList.add('hidden');
  showLoginIfNeeded();
}

function bindIntroSkip(){
  document.getElementById('skipLoading')?.addEventListener('click', dismissLoading);
  document.getElementById('enterSiteBtn')?.addEventListener('click', dismissLoading);
  document.getElementById('loadingBrand')?.addEventListener('click', e => {
    if(e.target.closest('#enterSiteBtn')) return;
    if(document.getElementById('loadingBrand')?.classList.contains('in')) dismissLoading();
  });
}

function introSequence(){
  const journey = document.getElementById('introJourney');
  const uk = document.getElementById('introUk');
  const sz = document.getElementById('introSz');
  const travel = document.getElementById('introTravel');
  const brand = document.getElementById('loadingBrand');

  bindIntroSkip();

  setTimeout(() => {
    uk?.classList.add('out');
    travel?.classList.add('active');
  }, 900);

  setTimeout(() => {
    sz?.classList.add('in');
  }, 1300);

  setTimeout(() => {
    journey?.classList.add('out');
    brand?.classList.add('in');
  }, 2400);

  setTimeout(dismissLoading, 4200);
}

function wireNavigation(){
  document.getElementById('tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-view]');
    if(!btn) return;
    navigateToView(btn.dataset.view);
  });
}

function navigateToView(view){
  if(!view) return;
  if(view === 'inbox'){
    if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderInbox?.();
    closeInboxDrawer();
  }
  if(typeof isWatchMode === 'function' && isWatchMode() && !isAdmin() && !isCoderLoggedIn()){
    const gameViews = ['comm', 'chat', 'viewer-card', 'quests', 'inbox', 'xp-requests'];
    if(gameViews.includes(view)){
      if(typeof GameHub !== 'undefined') GameHub.showGameLogin();
      if(typeof showEntryGate === 'function') showEntryGate({ force: true });
      return;
    }
  }
  if(view === 'instructions' && typeof shouldShowInstructionsNav === 'function' && !shouldShowInstructionsNav()){
    view = typeof defaultViewForSession === 'function' ? defaultViewForSession() : 'sync';
  }
  document.body.classList.remove('mind-channel-open', 'mind-repair-active');
  document.querySelectorAll('.node-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`.node-btn[data-view="${view}"]`).forEach(b => b.classList.add('active'));
  document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  document.body.dataset.activeView = view;
  if(view === 'sync') closeCoderNotify();
  if(view === 'comm') applyAdminUI();
  if(view === 'coder-board' && coderBoardId) renderCoderBoardPage(coderBoardId);
  if(view === 'chat'){
    if(typeof GameHub !== 'undefined'){
      GameHub.renderChat();
      GameHub.startChatPoll();
    }
  } else if(typeof GameHub !== 'undefined'){
    GameHub.stopChatPoll();
  }
  if(view === 'xp-requests' && typeof ViewerWorld !== 'undefined') ViewerWorld.renderXpRequests?.();
  if(view === 'inbox' && typeof ViewerWorld !== 'undefined') ViewerWorld.renderInbox?.();
  if(view === 'mind' && typeof OverloadLog !== 'undefined'){
    OverloadLog.embedded = false;
    document.body.classList.add('mind-channel-open');
    OverloadLog.spawnMindGlitchBars?.();
    if(!OverloadLog.view || OverloadLog.view === 'hub') OverloadLog.view = 'hub';
    OverloadLog.render();
  } else if(view !== 'mind'){
    document.body.classList.remove('mind-channel-open', 'mind-repair-active');
  }
  if(view === 'viewer-card' || view === 'quests' || view === 'vlog' || view === 'instructions' || view === 'inbox'){
    if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderAll();
  }
  if(view === 'sync' && typeof renderHomeCheckIn === 'function') renderHomeCheckIn();
  if(view === 'vlog' && typeof ViewerWorld !== 'undefined') ViewerWorld.renderVlog();
  if(view === 'ledger'){
    setLogViewMode('book');
    if(!getLogFocusKey()) setLogFocusKey(todayKey());
    renderLedger();
  }
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
  if(view === 'sync' && isAdmin()) scheduleLiveViewRefresh();
}

function bootApp(){
  if(window.__grayAreasBooted) return;
  window.__grayAreasBooted = true;
  if(typeof clearAuthSession === 'function') clearAuthSession();
  try{
    bindIntroSkip();
    if(sessionStorage.getItem('ga-saw-intro') === '1') dismissLoading();
    else introSequence();
    wireNavigation();
    initGlobalEditHandlers();
  }catch(err){
    console.error('Gray Areas boot failed:', err);
    dismissLoading();
  }
  try{ DailyLog.init(); }catch(err){ console.error('DailyLog init failed:', err); }
  try{ applyAdminUI(); }catch(err){ console.error('Admin UI failed:', err); }
  try{ syncCornerFabVisibility(); }catch(err){ console.error('FAB sync failed:', err); }
  try{ renderAll(); }catch(err){ console.error('Render failed:', err); }
  try{ if(typeof OverloadLog !== 'undefined') OverloadLog.init(); }catch(err){ console.error('Overload log init failed:', err); }
  try{ if(typeof GoogleSteps !== 'undefined') GoogleSteps.init(); }catch(err){ console.error('Google steps init failed:', err); }
  try{ HomeCheckIn.init(); }catch(err){ console.error('Home check-in init failed:', err); }
  try{ if(typeof SystemConsole !== 'undefined') SystemConsole.init(); }catch(err){ console.error('System console init failed:', err); }
  try{ if(typeof MediaCapture !== 'undefined') MediaCapture.init(); }catch(err){ console.error('Media capture init failed:', err); }
  try{ initPinFormHandlers(); }catch(err){ console.error('Pin form init failed:', err); }
  document.getElementById('coderBoardBack')?.addEventListener('click', () => navigateToView('characters'));
  try{ bindCommunityConsole(); }catch(err){ console.error('Community console failed:', err); }
  try{ if(typeof ViewerWorld !== 'undefined') ViewerWorld.init(); }catch(err){ console.error('Viewer world init failed:', err); }
  try{ initCommunityCommentModal(); }catch(err){ console.error('Community comment modal failed:', err); }
  document.getElementById('toggleCoderNotify')?.addEventListener('click', toggleCoderNotify);
  document.getElementById('coderNotifyBackdrop')?.addEventListener('click', closeCoderNotify);
  document.getElementById('inboxDrawerBackdrop')?.addEventListener('click', closeInboxDrawer);
  document.getElementById('closeInboxDrawer')?.addEventListener('click', closeInboxDrawer);
  document.getElementById('grayRewardsFab')?.addEventListener('click', toggleGrayRewardsDrawer);
  document.getElementById('grayRewardsBackdrop')?.addEventListener('click', closeGrayRewardsDrawer);
  document.getElementById('closeGrayRewardsDrawer')?.addEventListener('click', closeGrayRewardsDrawer);
  showLoginIfNeeded();
  document.getElementById('bootError')?.classList.add('hidden');
  window.__gaCancelBootWatchdog?.();
  window.__grayAreasReady = true;
}

/* ---------- Player Profile ---------- */
const PIN_ACCENTS = ['#ff4fd8','#3ad6e0','#9b5cff','#4fa3ff','#e8a87c','#38bdf8','#f472b6'];

function getArrivalDate(){
  return state.arrivalDate || getPlayer().arrivalDate || CONTENT.player.arrivalDate || '2026-01-05';
}

function daysInShenzhen(){
  const start = new Date(getArrivalDate() + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if(Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.floor((now - start) / 86400000) + 1);
}

function countLoggedDays(){
  return Object.keys(state.entries).filter(k => {
    const n = normalizeEntry(state.entries[k]);
    return n.currentMood || resolveEntryMood(n) || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length;
  }).length;
}

function getCalendarView(){
  if(state.calendarView?.year && state.calendarView?.month != null){
    return { year: state.calendarView.year, month: state.calendarView.month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function setCalendarView(year, month){
  state.calendarView = { year, month };
  saveState();
}

function computeLogStreak(){
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for(let i = 0; i < 400; i++){
    const key = d.toISOString().slice(0, 10);
    const n = normalizeEntry(state.entries[key]);
    const active = n.currentMood || resolveEntryMood(n) || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length;
    if(!active) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function aggregateLogMetrics(days){
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const rows = Object.entries(state.entries)
    .filter(([k]) => new Date(k + 'T00:00:00') >= cutoff)
    .map(([, e]) => normalizeEntry(e));
  const moods = rows.map(e => Number(e.mood)).filter(n => n > 0);
  const sum = (fn) => rows.reduce((s, e) => s + fn(e), 0);
  return {
    days: rows.length,
    avgMood: moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : '—',
    steps: sum(e => Number(e.steps) || 0),
    mandarin: sum(e => mandarinHoursFromEntry(e)),
    work: sum(e => Number(e.workHours) || 0),
    hobby: sum(e => Number(e.hobbyHours) || 0),
    people: rows.reduce((s, e) => s + (e.people?.length || 0), 0),
    places: rows.reduce((s, e) => s + (e.places?.length || 0), 0),
  };
}

function computeProfileStats(){
  const allRows = Object.entries(state.entries).map(([, e]) => normalizeEntry(e));
  const allTime = aggregateLogMetrics(99999);
  const week = aggregateLogMetrics(7);
  const month = aggregateLogMetrics(30);
  const people = new Set();
  const places = new Set();
  allRows.forEach(e => {
    e.people?.forEach(p => people.add(p.trim()));
    e.places?.forEach(p => places.add(p.trim()));
  });
  const skills = getSkills().map(skill => {
    const hrs = getTotalSkillHours(skill.id);
    const tier = getSkillTier(hrs);
    return { ...skill, hrs, tier };
  });
  const dramas = allDramas();
  const watching = dramas.filter(d => d.status === 'watching').length;
  const completed = dramas.filter(d => d.status === 'completed').length;
  const ratings = dramas.map(computeShowRating).filter(Boolean).map(Number);
  const avgMedia = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';
  let bestMood = null, lowMood = null;
  Object.entries(state.entries).forEach(([k, raw]) => {
    const m = Number(normalizeEntry(raw).mood);
    if(!m) return;
    if(!bestMood || m > bestMood.mood) bestMood = { key: k, mood: m };
    if(!lowMood || m < lowMood.mood) lowMood = { key: k, mood: m };
  });
  return {
    szDays: daysInShenzhen(),
    loggedDays: countLoggedDays(),
    streak: computeLogStreak(),
    week, month, allTime,
    people: people.size,
    places: places.size,
    quests: (state.quests || []).length,
    pressPosts: getArticles().length,
    photosPosted: getGallery().length,
    unlocked: getUnlockedZones().length,
    pins: (state.pinboard || []).length,
    skills,
    watching, completed, avgMedia,
    bestMood, lowMood,
    overloadCount: (state.overloadLogs || []).length,
  };
}

function profileStatCell(label, value, sub, neon){
  return `<div class="profile-stat-cell" style="--psc-neon:${neon}">
    <span class="profile-stat-val">${esc(String(value))}</span>
    <span class="profile-stat-lbl">${esc(label)}</span>
    ${sub ? `<span class="profile-stat-sub">${esc(sub)}</span>` : ''}
  </div>`;
}

function profileStatGroup(title, cells, neon){
  return `<section class="profile-stat-group" style="--psg-neon:${neon}">
    <h3 class="profile-stat-group-title">${esc(title)}</h3>
    <div class="profile-stat-grid">${cells}</div>
  </section>`;
}

function renderAbout(){
  const spread = document.getElementById('aboutSpread');
  if(!spread) return;

  const player = getPlayer();
  const pc = normalizePokeCard(player);
  const grayLvl = grayLevelFromPoints(player.points || 0);
  const portrait = player.avatar;
  const cardItem = { ...player, image: portrait, avatar: portrait, cardSubtitle: pc.subtitle };
  const stats = computeProfileStats();
  const recents = getSectionRecents();

  const recentPins = [
    recents.log ? { label: 'Daily Log', text: fmtDateLong(recents.log[0]) + (normalizeEntry(recents.log[1]).diary ? ' — ' + normalizeEntry(recents.log[1]).diary.slice(0, 70) + '…' : ''), view: 'ledger' } : null,
    recents.photo ? { label: 'Photo Wall', text: recents.photo.caption || recents.photo.place || 'Latest', view: 'gallery' } : null,
    recents.article ? { label: 'The Press', text: recents.article.title, view: 'press' } : null,
    recents.drama ? { label: 'Media', text: `${recents.drama.title} · ${getMediaType(recents.drama.mediaType).unit.toLowerCase()} ${recents.drama.currentEpisode}`, view: 'drama' } : null,
    recents.character ? { label: 'Players', text: recents.character.name, view: 'characters' } : null,
    recents.place ? { label: 'Places', text: recents.place.name, view: 'places' } : null,
    recents.pin ? { label: 'Community', text: `${recents.pin.name} · ${recents.pin.location || recents.pin.from || 'somewhere'}`, view: 'comm' } : null,
  ].filter(Boolean);

  const skillRows = stats.skills.map(skill => {
    const pct = Math.round(skill.tier.progress * 100);
    const next = skill.tier.next ? `${skill.tier.next.hours - skill.tier.hours}h to ${skill.tier.next.name}` : 'MAX TIER';
    return `<div class="profile-skill-row" style="--psr-neon:${skill.color || '#7c4dff'}">
      <div class="profile-skill-head">
        <span class="profile-skill-name">${esc(skill.name)}</span>
        <span class="profile-skill-tier">Lv ${skill.tier.level} · ${esc(skill.tier.name)}</span>
      </div>
      <div class="profile-skill-bar"><span style="width:${pct}%"></span></div>
      <div class="profile-skill-meta">${skill.hrs.toFixed(1)}h logged · ${esc(next)}</div>
    </div>`;
  }).join('');

  spread.innerHTML = `
    <div class="profile-hero-wrap">
      <div class="about-stage profile-stage">
        ${buildFlipPlayerCard(cardItem, 'player', 0, { hero: true, heroAccent: getPlayerAccent(cardItem) })}
        <div class="profile-id-strip">
          <span class="profile-id-chip" style="--pic-neon:#fcd34d">${player.points || 0} XP</span>
          <span class="profile-id-chip" style="--pic-neon:#ff4fd8">LV ${grayLvl.level}</span>
          ${pc.mbti ? `<span class="profile-id-chip" style="--pic-neon:#3ad6e0">${esc(pc.mbti)}</span>` : ''}
          ${pc.vibe ? `<span class="profile-id-chip profile-id-wide" style="--pic-neon:#9b5cff">${esc(pc.vibe)}</span>` : ''}
          <span class="profile-id-chip" style="--pic-neon:#4fa3ff">${esc(player.from)} → Shenzhen</span>
        </div>
        ${`<div class="profile-current-mood-wrap">
          <div class="profile-current-mood" style="--pcm-neon:${moodNeon(getCurrentMood())}">
            <span class="profile-current-mood-glyph">${moodIcon(getCurrentMood())}</span>
            <div><span class="profile-current-mood-label">Current mood</span><strong>${esc(moodLabel(getCurrentMood()))}</strong></div>
          </div>
          ${isAdmin() ? `<div id="profileMoodPicker" class="profile-mood-edit"></div>` : ''}
        </div>`}
        ${isAdmin() ? `<div class="about-arrival-edit field"><label>Arrival date</label><input type="date" id="arrivalDateInput" value="${esc(getArrivalDate())}"><button type="button" class="btn" id="saveArrivalBtn">Save</button></div>` : ''}
        ${`<button class="btn primary about-edit-btn edit-when-editing" id="editAboutBtn">Edit player card</button>`}
      </div>
    </div>

    <div class="profile-dashboard">
      ${profileStatGroup('Activity', [
        profileStatCell('Days logged', stats.loggedDays, stats.streak ? stats.streak + ' day streak' : '', '#9b5cff'),
        profileStatCell('Press posts', stats.pressPosts, 'The Press', '#f472b6'),
        profileStatCell('Photos posted', stats.photosPosted, 'Photo Wall', '#a78bfa'),
      ].join(''), '#9b5cff')}

      ${profileStatGroup('All-time totals', [
        profileStatCell('People', stats.people, 'unique names met', '#e94ff5'),
        profileStatCell('Places', stats.places, 'unique locations', '#4fa3ff'),
        profileStatCell('Quests', stats.quests, 'missions on the board', '#4ade80'),
      ].join(''), '#4fa3ff')}

      <section class="profile-stat-group profile-skill-matrix" style="--psg-neon:#7c4dff">
        <h3 class="profile-stat-group-title">Skill matrix</h3>
        <div class="profile-skill-list">${skillRows || '<p class="profile-empty">No towers configured yet.</p>'}</div>
      </section>

      ${profileStatGroup('Media status', [
        profileStatCell('Watching', stats.watching, 'in progress', '#f43f8e'),
        profileStatCell('Completed', stats.completed, 'finished', '#a78bfa'),
        profileStatCell('Avg rating', stats.avgMedia, 'neon dot average', '#f472b6'),
      ].join(''), '#f43f8e')}

      <section class="profile-stat-group gray-xp-board" style="--psg-neon:#fcd34d">
        <h3 class="profile-stat-group-title">Gray XP · Lv ${grayLvl.level}</h3>
        <div class="gray-xp-progress">
          <div class="gray-xp-bar"><span style="width:${Math.round(grayLvl.progress * 100)}%"></span></div>
          <p class="gray-xp-meta">${player.points || 0} XP · Lv ${grayLvl.level} · ${grayLvl.xpToNext ?? (100 - Math.round(grayLvl.progress * 100))} to next level</p>
        </div>
        ${renderGrayXpHistory()}
      </section>
      ${isAdmin() ? renderGrayXpGuide() : ''}
    </div>

    <div class="about-pin-wall profile-feed">
      <h3 class="profile-feed-title">Recent signal</h3>
      ${recentPins.map((r, i) => {
        const rot = [-2.5, 1.8, -1.2, 2.2, -0.8, 1.5, -2][i % 7];
        const col = PIN_ACCENTS[i % PIN_ACCENTS.length];
        return `<article class="about-pin" style="--prot:${rot}deg;--pmc:${col}" data-goto="${r.view}">
          <div class="about-pin-label">${esc(r.label)}</div>
          <p class="about-pin-text">${esc(r.text)}</p>
        </article>`;
      }).join('') || '<p class="profile-empty">No recent activity yet — log a day or add content.</p>'}
    </div>`;

  spread.querySelector('#editAboutBtn')?.addEventListener('click', () => openContentEditor('player', 'player', false));
  spread.querySelector('#openRewardsVaultBtn')?.addEventListener('click', () => openGrayRewardsDrawer());
  spread.querySelector('#saveArrivalBtn')?.addEventListener('click', () => {
    const v = document.getElementById('arrivalDateInput')?.value;
    if(v){ state.arrivalDate = v; saveState(); renderAbout(); renderHomeCheckIn(); }
  });
  spread.querySelectorAll('.about-pin[data-goto]').forEach(el => {
    el.addEventListener('click', () => document.querySelector(`.node-btn[data-view="${el.dataset.goto}"]`)?.click());
  });
  bindFlipPlayerCards(spread);
  if(isAdmin()) mountMoodPicker('profileMoodPicker', getCurrentMood(), { name: 'profileMood', compact: true, onChange: id => { setCurrentMood(id); renderAbout(); renderHomeCheckIn(); } });
}

const CONSOLE_HEARTS = '<3 <3 <3';

function resetConsoleInput(input){
  if(input) input.value = CONSOLE_HEARTS;
}

function bindCommunityConsole(){
  const input = document.getElementById('communityConsoleInput');
  if(!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  resetConsoleInput(input);
  input.addEventListener('focus', () => {
    if(input.value === CONSOLE_HEARTS) input.select();
  });
  input.addEventListener('blur', () => {
    if(!input.value.trim()) resetConsoleInput(input);
  });
  input.addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    e.preventDefault();
    const v = e.target.value.trim();
    if(v === CONSOLE_HEARTS || !v){
      resetConsoleInput(input);
      return;
    }
    if(v === ':)'){
      if(typeof tryPlayerLogin === 'function'){
        tryPlayerLogin('Gray', ':)');
      } else {
        unlockAdmin({ toast: false, view: 'profile', welcome: true });
      }
      resetConsoleInput(input);
      return;
    }
    if(v === '<3'){
      lockAdmin();
      resetConsoleInput(input);
      return;
    }
    if(v === ':('){
      if(typeof OverloadLog !== 'undefined'){
        if(typeof OverloadLog.enterMindView === 'function') OverloadLog.enterMindView();
        else if(typeof OverloadLog.enterChannel === 'function') OverloadLog.enterChannel();
      }
      resetConsoleInput(input);
      return;
    }
    if(v === '...' || v === '…'){
      if(typeof SystemConsole !== 'undefined') SystemConsole.open();
      resetConsoleInput(input);
      return;
    }
    if(typeof tryCoderLoginFromConsole === 'function' && tryCoderLoginFromConsole(v)){
      if(!isAdmin()) navigateToView(typeof defaultViewForSession === 'function' ? defaultViewForSession() : 'sync');
      resetConsoleInput(input);
      return;
    }
    resetConsoleInput(input);
  });
}

/* ---------- Day planner — timed to-dos per day ---------- */
function normalizePlannedTodo(t){
  return {
    id: t.id || uid('ptodo'),
    text: t.text || '',
    notes: t.notes || '',
    scheduledTime: t.scheduledTime || '',
    durationMin: Number(t.durationMin) || 0,
    done: !!t.done,
    doneAt: t.doneAt || null,
    subtasks: (t.subtasks || []).map(s => ({
      id: s.id || uid('psub'),
      text: s.text || '',
      scheduledTime: s.scheduledTime || '',
      done: !!s.done,
      doneAt: s.doneAt || null,
    })),
  };
}

function migrateLegacyLiveTodos(dayKey){
  if(!Array.isArray(state.liveTodos) || !state.liveTodos.length) return;
  const todos = getPlannedTodosForDay(dayKey, { skipMigrate: true });
  if(todos.length) return;
  state.entries[dayKey].plannedTodos = state.liveTodos.map(normalizePlannedTodo);
  state.liveTodos = [];
  saveState();
}

function getPlannedTodosForDay(dayKey, opts = {}){
  const key = dayKey || todayKey();
  if(!state.entries[key]) state.entries[key] = {};
  if(!state.entries[key].plannedTodos){
    state.entries[key].plannedTodos = [];
  }
  if(!opts.skipMigrate && key === todayKey()) migrateLegacyLiveTodos(key);
  return state.entries[key].plannedTodos;
}

function sortPlannedTodos(todos){
  return [...todos].sort((a, b) => {
    const ta = a.scheduledTime || '99:99';
    const tb = b.scheduledTime || '99:99';
    if(ta !== tb) return ta.localeCompare(tb);
    return (a.text || '').localeCompare(b.text || '');
  });
}

function fmtPlannedTime(timeStr){
  if(!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if(Number.isNaN(h)) return timeStr;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function scheduledAtIso(dayKey, timeStr){
  if(!timeStr || !dayKey) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if(Number.isNaN(h)) return null;
  const [y, mo, d] = dayKey.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m || 0, 0).toISOString();
}

function getMergedTimelineNodes(stream, dayKey){
  const nodes = [...(stream?.nodes || [])];
  sortPlannedTodos(getPlannedTodosForDay(dayKey)).forEach(t => {
    if(t.done) return;
    const at = scheduledAtIso(dayKey, t.scheduledTime)
      || stream?.startedAt
      || `${dayKey}T23:59:00`;
    nodes.push({
      id: 'plan-' + t.id,
      at,
      type: 'planned',
      text: t.text,
      body: [t.notes, t.durationMin ? `${t.durationMin} min` : ''].filter(Boolean).join(' · '),
      plannedId: t.id,
      isPlanned: true,
    });
  });
  return nodes.sort((a, b) => (a.at || '').localeCompare(b.at || ''));
}

function getLogFocusKey(){
  return state.logFocusKey || todayKey();
}

function setLogFocusKey(key){
  state.logFocusKey = key;
  saveState();
}

function getLogViewMode(){
  return state.logViewMode || 'book';
}

function setLogViewMode(mode){
  state.logViewMode = mode;
  saveState();
}

function daySummaryStats(key){
  const n = normalizeEntry(state.entries[key]);
  const stream = getDayStream(key);
  const planned = getPlannedTodosForDay(key);
  const donePlanned = planned.filter(t => t.done).length;
  return {
    moodId: resolveEntryMood(n),
    pulseCount: stream.nodes.filter(nd => nd.type !== 'wake' && nd.type !== 'sleep').length,
    plannedCount: planned.length,
    plannedDone: donePlanned,
    sealed: !!stream.endedAt,
    hasEntry: !!(state.entries[key] && (
      stream.endedAt || resolveEntryMood(n) || n.steps || n.diary
      || n.people?.length || n.places?.length || n.photos?.length || stream.nodes.length || planned.length
    )),
  };
}

function addDaysToKey(key, delta){
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function weekStartKey(key){
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return dt.toISOString().slice(0, 10);
}

function weekKeysFrom(key){
  const start = weekStartKey(key);
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(start, i));
}

/* ---------- Home Check-In — live day stream ---------- */
const HomeCheckIn = {
  clockTimer: null,
  inited: false,
  pulseType: 'note',
  pulsePhotoData: '',

  init(){
    if(this.inited) return;
    this.inited = true;
    document.getElementById('closeEndDay')?.addEventListener('click', () => this.closeEndDay());
    document.getElementById('cancelEndDay')?.addEventListener('click', () => this.closeEndDay());
    document.getElementById('saveEndDay')?.addEventListener('click', () => this.saveEndDay());
    document.getElementById('endDayBack')?.addEventListener('click', e => {
      if(e.target.id === 'endDayBack') this.closeEndDay();
    });
    document.getElementById('closePulseComposer')?.addEventListener('click', () => this.closePulseComposer());
    document.getElementById('cancelPulseComposer')?.addEventListener('click', () => this.closePulseComposer());
    document.getElementById('savePulseComposer')?.addEventListener('click', () => this.submitPulse());
    document.getElementById('pulseComposerBack')?.addEventListener('click', e => {
      if(e.target.id === 'pulseComposerBack') this.closePulseComposer();
    });
    this.startClock();
  },

  bindSpread(spread){
    spread.querySelector('#homeStartDay')?.addEventListener('click', () => this.startDay());
    spread.querySelector('#homeEndDay')?.addEventListener('click', () => this.openEndDay());
    spread.querySelector('#homeOpenPulse')?.addEventListener('click', () => this.openPulseComposer());
    spread.querySelectorAll('[data-pulse-quick]').forEach(btn => {
      btn.addEventListener('click', () => this.openPulseComposer(btn.dataset.pulseQuick));
    });
    spread.querySelector('#homeOpenQuotePulse')?.addEventListener('click', () => this.openPulseComposer('quote'));
    spread.querySelector('#homeOpenQuestPulse')?.addEventListener('click', () => this.openPulseComposer('quest'));
    spread.querySelectorAll('[data-live-node-del]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteStreamNode(btn.dataset.liveNodeDel));
    });
  },

  deleteStreamNode(nodeId){
    if(!isAdmin() || !nodeId) return;
    const key = todayKey();
    const stream = getDayStream(key);
    const node = stream.nodes.find(n => n.id === nodeId);
    if(!node || node.type === 'wake' || node.type === 'sleep') return;
    if(!confirm(`Remove this pulse from the transmission log?\n\n${node.text || node.type}`)) return;
    stream.nodes = stream.nodes.filter(n => n.id !== nodeId);
    if(state.entries[key]) state.entries[key].stream = stream;
    saveState();
    renderHomeCheckIn();
  },

  requireActiveDay(){
    const stream = getDayStream(todayKey());
    if(!stream.startedAt){
      alert('Tap Start day first.');
      return false;
    }
    if(stream.endedAt){
      alert('Day already ended. Start a new day tomorrow.');
      return false;
    }
    return true;
  },

  openPulseComposer(type){
    if(!isAdmin()) return;
    if(!this.requireActiveDay()) return;
    this.pulseType = type && PULSE_TYPE_DEFS[type] ? type : (type || this.pulseType || 'note');
    this.pulsePhotoData = '';
    document.getElementById('pulseDate').value = todayKey();
    document.getElementById('pulseTime').value = nowTimeInputValue();
    this.renderPulseTypeGrid();
    this.renderPulseFields();
    document.getElementById('pulseComposerBack')?.classList.remove('hidden');
  },

  closePulseComposer(){
    document.getElementById('pulseComposerBack')?.classList.add('hidden');
    this.pulsePhotoData = '';
  },

  renderPulseTypeGrid(){
    const grid = document.getElementById('pulseTypeGrid');
    if(!grid) return;
    grid.innerHTML = Object.entries(STREAM_NODE_META)
      .filter(([id]) => id !== 'wake' && id !== 'sleep' && PULSE_TYPE_DEFS[id])
      .map(([id, meta]) => `
        <button type="button" class="pulse-type-btn ${id === this.pulseType ? 'active' : ''}" data-pulse-type="${id}" style="--pt-neon:${meta.neon}" title="${meta.label}">
          <span class="pulse-type-icon">${meta.icon}</span>
          <span class="pulse-type-label">${meta.label}</span>
        </button>`).join('');
    grid.querySelectorAll('[data-pulse-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.pulseType = btn.dataset.pulseType;
        this.pulsePhotoData = '';
        this.renderPulseTypeGrid();
        this.renderPulseFields();
      });
    });
  },

  renderPulseFields(){
    const root = document.getElementById('pulseFields');
    if(!root) return;
    const def = PULSE_TYPE_DEFS[this.pulseType];
    if(!def){
      root.innerHTML = '';
      return;
    }
    root.innerHTML = def.fields.map(field => {
      const id = `pulseField_${field.id}`;
      if(field.type === 'card_pick') return cardPickFieldHtml(field);
      if(field.type === 'textarea'){
        return `<div class="field"><label>${field.label}</label><textarea id="${id}" rows="${field.rows || 4}" placeholder="${esc(field.placeholder || '')}"></textarea></div>`;
      }
      if(field.type === 'range'){
        const val = field.default ?? 7;
        return `<div class="field"><label>${field.label}</label><input type="range" id="${id}" min="${field.min}" max="${field.max}" value="${val}"><span class="range-val" id="${id}_val">${val}</span></div>`;
      }
      if(field.type === 'photo'){
        return `<div class="field"><label>${field.label}</label>
          <input type="file" id="${id}" accept="image/*">
          <div class="pulse-photo-preview" id="${id}_preview"></div></div>`;
      }
      const inputType = field.type === 'number' ? 'number' : 'text';
      const extra = field.type === 'number'
        ? ` min="${field.min ?? ''}" max="${field.max ?? ''}" step="${field.step ?? 1}"`
        : '';
      return `<div class="field"><label>${field.label}</label><input type="${inputType}" id="${id}"${extra} placeholder="${esc(field.placeholder || '')}"></div>`;
    }).join('');

    def.fields.forEach(field => {
      const el = document.getElementById(`pulseField_${field.id}`);
      if(!el) return;
      if(field.type === 'card_pick'){
        const newEl = document.getElementById(`pulseField_${field.id}_new`);
        const hint = document.getElementById(`pulseField_${field.id}_hint`);
        const sync = () => {
          const isNew = el.value === PULSE_CARD_NEW;
          newEl?.classList.toggle('hidden', !isNew);
          hint?.classList.toggle('hidden', !isNew);
          if(!isNew) newEl && (newEl.value = '');
        };
        el.addEventListener('change', sync);
        sync();
        return;
      }
      if(field.type === 'range'){
        const valEl = document.getElementById(`pulseField_${field.id}_val`);
        el.addEventListener('input', () => { if(valEl) valEl.textContent = el.value; });
      }
      if(field.type === 'photo'){
        el.addEventListener('change', async e => {
          const file = e.target.files?.[0];
          if(!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            this.pulsePhotoData = await compressPulsePhoto(reader.result);
            const prev = document.getElementById(`pulseField_${field.id}_preview`);
            if(prev) prev.innerHTML = `<img src="${this.pulsePhotoData}" alt="">`;
          };
          reader.readAsDataURL(file);
        });
      }
    });
  },

  readPulseForm(){
    const def = PULSE_TYPE_DEFS[this.pulseType];
    const data = {};
    if(!def) return data;
    def.fields.forEach(field => {
      if(field.type === 'photo') data.photo = this.pulsePhotoData;
      else if(field.type === 'card_pick') data[field.id] = readCardPickValue(field.id);
      else {
        const el = document.getElementById(`pulseField_${field.id}`);
        if(!el) return;
        data[field.id] = el.value?.trim?.() ?? el.value;
      }
    });
    return data;
  },

  validatePulseForm(data){
    const def = PULSE_TYPE_DEFS[this.pulseType];
    if(!def) return 'Unknown pulse type.';
    for(const field of def.fields){
      if(!field.required) continue;
      if(field.type === 'photo' && !data.photo) return `Add a ${field.label.toLowerCase()}.`;
      if(field.type === 'card_pick'){
        const sel = document.getElementById(`pulseField_${field.id}`);
        if(!sel?.value) return `Pick or create a ${field.label.toLowerCase()}.`;
        if(sel.value === PULSE_CARD_NEW && !data[field.id]) return `Enter a name for the new ${field.label.toLowerCase()}.`;
        continue;
      }
      if(field.type !== 'photo' && !data[field.id]) return `Fill in ${field.label.toLowerCase()}.`;
    }
    return '';
  },

  async submitPulse(){
    if(!isAdmin()) return;
    if(!this.requireActiveDay()) return;
    const data = this.readPulseForm();
    const err = this.validatePulseForm(data);
    if(err){ alert(err); return; }

    const dateStr = document.getElementById('pulseDate')?.value || todayKey();
    const timeStr = document.getElementById('pulseTime')?.value || nowTimeInputValue();
    const at = composePulseAt(dateStr, timeStr);
    const text = buildPulseSummary(this.pulseType, data);
    const body = data.body || data.caption || data.message || data.text || '';
    const node = {
      id: 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      at,
      type: this.pulseType,
      text,
      body: body || undefined,
      data: { ...data },
    };
    if(data.photo) node.photo = data.photo;
    if(data.mood) node.mood = Number(data.mood);
    if(data.intensity) node.intensity = Number(data.intensity);
    if(data.rating) node.rating = Number(data.rating);

    const streamKey = ensureTodayStream();
    const stream = getDayStream(streamKey);
    stream.nodes.push(node);
    state.entries[streamKey].stream = stream;

    const metaKey = ensureStreamForDate(dateStr);
    const entry = normalizeEntry(state.entries[metaKey]);
    const patch = {};
    if(this.pulseType === 'person' && data.name){
      ensureCharacterCard(data.name);
      if(!entry.people.includes(data.name)) patch.people = [...entry.people, data.name];
      LiveSync?.playerMet(data.name);
    }
    if(this.pulseType === 'place' && data.name){
      ensurePlaceCard(data.name);
      if(!entry.places.includes(data.name)) patch.places = [...entry.places, data.name];
      if(!state.unlockedZones.includes(data.name)) state.unlockedZones.push(data.name);
      LiveSync?.placeVisited(data.name);
    }
    if(this.pulseType === 'hobby' && data.what){
      LiveSync?.hobbyLogged(data.what, data.hours);
    }
    if(this.pulseType === 'mood' && data.mood) patch.mood = data.mood;
    if(this.pulseType === 'photo' && data.photo) patch.photos = [...entry.photos, data.photo];
    if(this.pulseType === 'quote' && data.text && data.who){
      addCoderQuoteByName(data.who, data.text, data.context);
    }
    if(Object.keys(patch).length) state.entries[metaKey] = { ...state.entries[metaKey], ...patch };

    saveState();
    this.closePulseComposer();
    awardGrayPoints(GRAY_XP_AWARDS.pulse.xp, 'pulse');
    renderHomeCheckIn();
    renderLedger();
    safeRender(renderAbout);
    if(this.pulseType === 'person') renderCharacters();
    if(this.pulseType === 'place') renderPlaces();
  },

  startClock(){
    clearInterval(this.clockTimer);
    const tick = () => {
      const sz = document.getElementById('clockShenzhen');
      const uk = document.getElementById('clockUk');
      const szDate = document.getElementById('clockShenzhenDate');
      const ukDate = document.getElementById('clockUkDate');
      const szOff = document.getElementById('clockShenzhenOffset');
      const ukOff = document.getElementById('clockUkOffset');
      if(sz) sz.textContent = fmtClockTime('Asia/Shanghai');
      if(uk) uk.textContent = fmtClockTime('Europe/London');
      if(szDate) szDate.textContent = fmtClockDate('Asia/Shanghai');
      if(ukDate) ukDate.textContent = fmtClockDate('Europe/London');
      if(szOff) szOff.textContent = clockOffsetLabel('Asia/Shanghai');
      if(ukOff) ukOff.textContent = 'UK local';
    };
    tick();
    this.clockTimer = setInterval(tick, 1000);
  },

  startDay(){
    if(!isAdmin()) return;
    const key = ensureTodayStream();
    const stream = getDayStream(key);
    if(stream.startedAt && !stream.endedAt){
      alert('Day already in progress.');
      return;
    }
    if(stream.endedAt && stream.startedAt){
      if(!confirm('Start a fresh day session? This clears today\'s ended status.')) return;
      stream.nodes = stream.nodes.filter(n => n.type !== 'wake' && n.type !== 'sleep');
      stream.endedAt = null;
      delete state.entries[key].dayReflection;
      delete state.entries[key].daySummary;
    }
    const now = new Date().toISOString();
    stream.startedAt = now;
    stream.nodes.push({ id: 'n-wake-' + Date.now(), at: now, type: 'wake', text: 'Day started' });
    state.entries[key].stream = stream;
    captureDayStartSnapshot(key);
    saveState();
    renderHomeCheckIn();
  },

  openEndDay(){
    if(!isAdmin()) return;
    const key = todayKey();
    const stream = getDayStream(key);
    if(!stream.startedAt){
      alert('Start your day first.');
      return;
    }
    if(stream.endedAt){
      alert('Day already closed. Check the Daily Log calendar.');
      return;
    }
    const n = normalizeEntry(state.entries[key]);
    mountMoodPicker('endMoodPicker', resolveEntryMood(n) || getCurrentMood(), { name: 'endMood', compact: true });
    document.getElementById('endSteps').value = n.steps || 0;
    document.getElementById('endWork').value = n.workHours || 0;
    const hobbySel = document.getElementById('endHobbySelect');
    hobbySel.innerHTML = '<option value="">—</option>' + getHobbyOptions().map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join('');
    hobbySel.value = n.hobby || '';
    document.getElementById('endHobbyHours').value = n.hobbyHours || 0;
    document.getElementById('endPeople').value = (n.people || []).join(', ');
    document.getElementById('endPlaces').value = (n.places || []).filter(p => !CONTENT.zones.includes(p)).join(', ');
    const draft = streamDiaryDraft(stream.nodes);
    document.getElementById('endDiary').value = n.diary || draft;
    const ref = state.entries[key]?.dayReflection || {};
    document.getElementById('endFavoriteThing').value = ref.favoriteThing || '';
    document.getElementById('endHardestMoment').value = ref.hardestMoment || '';
    document.getElementById('endGratefulFor').value = ref.gratefulFor || '';
    document.getElementById('endTomorrowFocus').value = ref.tomorrowFocus || '';
    document.getElementById('endDayBack')?.classList.remove('hidden');
  },

  closeEndDay(){
    document.getElementById('endDayBack')?.classList.add('hidden');
  },

  saveEndDay(){
    if(!isAdmin()) return;
    const key = todayKey();
    const stream = getDayStream(key);
    const favoriteThing = document.getElementById('endFavoriteThing')?.value?.trim() || '';
    if(!favoriteThing){
      alert('Answer the favourite-thing question before sealing the day.');
      document.getElementById('endFavoriteThing')?.focus();
      return;
    }
    const reflection = {
      favoriteThing,
      hardestMoment: document.getElementById('endHardestMoment')?.value?.trim() || '',
      gratefulFor: document.getElementById('endGratefulFor')?.value?.trim() || '',
      tomorrowFocus: document.getElementById('endTomorrowFocus')?.value?.trim() || '',
    };
    const now = new Date().toISOString();
    stream.endedAt = now;
    stream.nodes.push({
      id: 'n-reflect-' + Date.now(),
      at: now,
      type: 'reflection',
      text: reflection.favoriteThing,
      body: [
        reflection.hardestMoment && `Hardest: ${reflection.hardestMoment}`,
        reflection.gratefulFor && `Grateful: ${reflection.gratefulFor}`,
        reflection.tomorrowFocus && `Tomorrow: ${reflection.tomorrowFocus}`,
      ].filter(Boolean).join('\n'),
      reflection,
    });
    stream.nodes.push({ id: 'n-sleep-' + Date.now(), at: now, type: 'sleep', text: 'Day sealed' });
    const dayMood = readMoodPickerValue(document.getElementById('endMoodPicker'), 'endMood');
    if(dayMood) setCurrentMood(dayMood);
    const people = document.getElementById('endPeople').value.split(',').map(s => s.trim()).filter(Boolean);
    const places = document.getElementById('endPlaces').value.split(',').map(s => s.trim()).filter(Boolean);
    const existing = state.entries[key] || {};
    const durationMs = stream.startedAt ? new Date(now) - new Date(stream.startedAt) : 0;
    state.entries[key] = {
      ...existing,
      currentMood: dayMood,
      mood: dayMood,
      steps: document.getElementById('endSteps').value,
      workHours: document.getElementById('endWork').value,
      hobby: document.getElementById('endHobbySelect').value,
      hobbyHours: document.getElementById('endHobbyHours').value,
      people,
      places,
      diary: document.getElementById('endDiary').value,
      photos: existing.photos || [],
      stream,
      dayReflection: reflection,
      dayStartSnapshot: existing.dayStartSnapshot || null,
    };
    state.entries[key].daySummary = {
      sealedAt: now,
      durationMs,
      deltas: computeDayScoreDeltas(key),
    };
    places.forEach(z => { if(z && !state.unlockedZones.includes(z)) state.unlockedZones.push(z); });
    saveState();
    this.closeEndDay();
    awardGrayPoints(GRAY_XP_AWARDS.day_sealed.xp, 'day_sealed');
    renderHomeCheckIn();
    renderLedger();
    safeRender(renderAbout);
    document.querySelector('.node-btn[data-view="ledger"]')?.click();
    DailyLog.selectDay(key);
    openDayModal(key);
  },

  renderTimeline(stream, refDayKey){
    const admin = isAdmin();
    const sorted = getMergedTimelineNodes(stream, refDayKey);
    if(!sorted.length){
      return `<div class="live-rail-empty">
        <div class="live-rail-spine"></div>
        <p>${admin ? 'Awaiting transmission. Hit ▶ Start day, add timed to-dos, then drop pulses.' : 'Awaiting transmission. Start day, then pulse updates.'}</p>
      </div>`;
    }
    return `<div class="live-rail-track">
      <div class="live-rail-spine" aria-hidden="true"></div>
      <div class="live-rail-nodes">
        ${sorted.map((node, i) => {
          const meta = STREAM_NODE_META[node.type] || { label: node.type, neon: '#3ad6e0', icon: '•' };
          const next = sorted[i + 1];
          let gap = '';
          if(next && node.at && next.at){
            const mins = Math.round((new Date(next.at) - new Date(node.at)) / 60000);
            if(mins >= 60) gap = Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
            else gap = mins + 'm';
          }
          const moodBadge = node.mood ? `<span class="live-node-mood">${node.mood}/10</span>` : (node.intensity ? `<span class="live-node-mood">${node.intensity}/10</span>` : (node.rating ? `<span class="live-node-mood">${node.rating}/10</span>` : ''));
          const photoHtml = node.photo ? `<div class="live-node-photo"><img src="${esc(node.photo)}" alt="" loading="lazy"></div>` : '';
          const headline = getPulseNodeTitle(node) || node.text || '';
          const body = node.body && node.body !== headline ? node.body : (node.data?.body && node.data.body !== headline ? node.data.body : '');
          const bodyHtml = body ? `<p class="live-node-body">${esc(body.length > 280 ? body.slice(0, 280) + '…' : body)}</p>` : '';
          const canDel = admin && node.type !== 'wake' && node.type !== 'sleep' && !node.isPlanned;
          const delBtn = canDel ? `<button type="button" class="live-node-del" data-live-node-del="${esc(node.id)}" title="Remove pulse">×</button>` : '';
          const plannedTag = node.isPlanned ? `<span class="live-node-planned">planned</span>` : '';
          return `<article class="live-node${canDel ? ' is-editable' : ''}${node.isPlanned ? ' is-planned' : ''}${headline && body ? ' has-writing' : ''}" style="--ln-neon:${meta.neon}">
            <div class="live-node-marker" title="${meta.label}">
              <span class="live-node-glow"></span>
              <span class="live-node-core"></span>
            </div>
            <div class="live-node-card">
              <div class="live-node-top">
                <time class="live-node-time">${fmtNodeStamp(node.at, refDayKey)}</time>
                <span class="live-node-type">${meta.icon} ${meta.label}</span>
                ${plannedTag}
                ${moodBadge}
                ${gap ? `<span class="live-node-gap">Δ ${gap}</span>` : ''}
                ${delBtn}
              </div>
              <p class="live-node-text">${esc(headline)}</p>
              ${bodyHtml}
              ${photoHtml}
            </div>
          </article>`;
        }).join('')}
      </div>
    </div>`;
  },

  scrollRailToBottom(){
    const rail = document.querySelector('.live-rail-scroll');
    if(rail) rail.scrollTop = rail.scrollHeight;
  },

  dayStatus(stream){
    if(stream.endedAt) return `Day closed · sleep ${fmtNodeTime(stream.endedAt)}`;
    if(stream.startedAt) return `Day active · wake ${fmtNodeTime(stream.startedAt)}`;
    return 'Day not started';
  },

  renderPlannedTodosBoard(admin, dayKey, opts = {}){
    const key = dayKey || todayKey();
    const todos = sortPlannedTodos(getPlannedTodosForDay(key));
    const compact = !!opts.compact;
    const hostId = opts.hostId || 'liveTodoBoard';
    if(!todos.length && !admin){
      return `<section class="live-todo-board viewer-todo-board" id="${hostId}">
        <h3 class="live-todo-title">Day plan</h3>
        <p class="live-todo-hint">Nothing scheduled yet — check back for timed missions.</p>
      </section>`;
    }
    const rows = todos.map(t => {
      const timeBadge = t.scheduledTime
        ? `<span class="live-todo-time">${esc(fmtPlannedTime(t.scheduledTime))}${t.durationMin ? ` · ${t.durationMin}m` : ''}</span>`
        : `<span class="live-todo-time is-anytime">anytime</span>`;
      const subs = (t.subtasks || []).map(s => `
        <li class="live-todo-sub ${s.done ? 'is-done' : ''}">
          ${admin ? `<input type="checkbox" data-planned-sub="${esc(t.id)}" data-planned-sub-id="${esc(s.id)}" data-planned-day="${esc(key)}" ${s.done ? 'checked' : ''}>` : `<span class="live-todo-check ${s.done ? 'done' : ''}">${s.done ? '✓' : '○'}</span>`}
          ${s.scheduledTime ? `<span class="live-todo-sub-time">${esc(fmtPlannedTime(s.scheduledTime))}</span>` : ''}
          ${admin ? `<input type="text" class="live-todo-sub-input" data-planned-sub-text="${esc(t.id)}" data-planned-sub-id="${esc(s.id)}" data-planned-day="${esc(key)}" value="${esc(s.text)}">` : `<span>${esc(s.text)}</span>`}
          ${admin ? `<button type="button" class="live-todo-del" data-planned-sub-del="${esc(t.id)}" data-planned-sub-id="${esc(s.id)}" data-planned-day="${esc(key)}" title="Remove">×</button>` : ''}
        </li>`).join('');
      const notesHtml = t.notes && !compact
        ? (admin
          ? `<textarea class="live-todo-notes" rows="2" data-planned-notes="${esc(t.id)}" data-planned-day="${esc(key)}" placeholder="Notes…">${esc(t.notes)}</textarea>`
          : `<p class="live-todo-notes-read">${esc(t.notes)}</p>`)
        : '';
      return `<li class="live-todo-item ${t.done ? 'is-done' : ''}" data-planned-item="${esc(t.id)}">
        <div class="live-todo-row">
          ${admin ? `<input type="checkbox" data-planned-todo="${esc(t.id)}" data-planned-day="${esc(key)}" ${t.done ? 'checked' : ''}>` : `<span class="live-todo-check ${t.done ? 'done' : ''}">${t.done ? '✓' : '○'}</span>`}
          ${timeBadge}
          ${admin ? `<input type="time" class="live-todo-time-input" data-planned-time="${esc(t.id)}" data-planned-day="${esc(key)}" value="${esc(t.scheduledTime)}">` : ''}
          ${admin ? `<input type="number" class="live-todo-duration" data-planned-duration="${esc(t.id)}" data-planned-day="${esc(key)}" min="0" step="5" value="${t.durationMin || ''}" placeholder="min" title="Duration (minutes)">` : ''}
          ${admin ? `<input type="text" class="live-todo-input" data-planned-text="${esc(t.id)}" data-planned-day="${esc(key)}" value="${esc(t.text)}">` : `<strong class="live-todo-label">${esc(t.text)}</strong>`}
          ${admin ? `<button type="button" class="live-todo-del" data-planned-del="${esc(t.id)}" data-planned-day="${esc(key)}" title="Remove">×</button>` : ''}
        </div>
        ${notesHtml}
        ${subs ? `<ul class="live-todo-subs">${subs}</ul>` : ''}
        ${admin ? `<button type="button" class="btn live-todo-add-sub" data-planned-add-sub="${esc(t.id)}" data-planned-day="${esc(key)}">+ sub-task</button>` : ''}
      </li>`;
    }).join('');
    const compose = admin ? `<div class="live-todo-compose planned-compose">
      <input type="text" class="planned-new-text" data-planned-day="${esc(key)}" placeholder="What are you doing?">
      <input type="time" class="planned-new-time" data-planned-day="${esc(key)}" title="Scheduled time">
      <input type="number" class="planned-new-duration" data-planned-day="${esc(key)}" min="0" step="5" placeholder="min" title="Duration (minutes)">
      <input type="text" class="planned-new-notes" data-planned-day="${esc(key)}" placeholder="Notes (optional)">
      <button type="button" class="btn primary planned-add-btn" data-planned-day="${esc(key)}">Add</button>
    </div>` : '';
    const dayPicker = admin && !opts.hideDayPicker ? `<div class="live-todo-day-row">
      <label>Plan for</label>
      <input type="date" class="live-todo-day-pick" data-planned-board-day value="${esc(key)}">
      <span class="field-hint">Timed items slot into the transmission log in order. Plan ahead in Daily Log too.</span>
    </div>` : '';
    return `<section class="live-todo-board ${admin ? 'admin-todo-board' : 'viewer-todo-board'}" id="${hostId}" data-planned-board-day="${esc(key)}">
      <div class="live-todo-head">
        <h3 class="live-todo-title">Day plan · ${fmtDateLong(key)}</h3>
        <p class="live-todo-hint">${admin ? 'Schedule with times — tick when done. Planned items appear on the transmission log until completed.' : 'Timed schedule for today — completed items light up on the transmission log.'}</p>
        ${dayPicker}
      </div>
      <ul class="live-todo-list">${rows || `<li class="empty-hint">No items yet — add your first timed task.</li>`}</ul>
      ${compose}
    </section>`;
  },

  renderLiveTodos(admin){
    return this.renderPlannedTodosBoard(admin, todayKey(), { hideDayPicker: true });
  },

  bindPlannedTodos(spread, opts = {}){
    const rerender = opts.rerender || (() => renderHomeCheckIn());
    const rerenderLog = opts.rerenderLog || (() => renderLedger());
    spread.querySelectorAll('.planned-add-btn').forEach(btn => {
      btn.addEventListener('click', () => this.addPlannedTodo(btn.dataset.plannedDay, spread));
    });
    spread.querySelectorAll('.planned-new-text').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if(e.key === 'Enter'){ e.preventDefault(); this.addPlannedTodo(inp.dataset.plannedDay, spread); }
      });
    });
    spread.querySelectorAll('.live-todo-day-pick').forEach(inp => {
      inp.addEventListener('change', () => {
        if(opts.onDayChange) opts.onDayChange(inp.value);
        else rerender();
      });
    });
    spread.querySelectorAll('[data-planned-todo]').forEach(cb => {
      cb.addEventListener('change', () => this.togglePlannedTodo(cb.dataset.plannedDay, cb.dataset.plannedTodo, cb.checked, rerender, rerenderLog));
    });
    spread.querySelectorAll('[data-planned-sub]').forEach(cb => {
      cb.addEventListener('change', () => this.togglePlannedSubtask(cb.dataset.plannedDay, cb.dataset.plannedSub, cb.dataset.plannedSubId, cb.checked, rerender, rerenderLog));
    });
    spread.querySelectorAll('[data-planned-text]').forEach(inp => {
      inp.addEventListener('change', () => this.updatePlannedTodoField(inp.dataset.plannedDay, inp.dataset.plannedText, 'text', inp.value));
    });
    spread.querySelectorAll('[data-planned-time]').forEach(inp => {
      inp.addEventListener('change', () => {
        this.updatePlannedTodoField(inp.dataset.plannedDay, inp.dataset.plannedTime, 'scheduledTime', inp.value, rerender, rerenderLog);
      });
    });
    spread.querySelectorAll('[data-planned-duration]').forEach(inp => {
      inp.addEventListener('change', () => this.updatePlannedTodoField(inp.dataset.plannedDay, inp.dataset.plannedDuration, 'durationMin', inp.value));
    });
    spread.querySelectorAll('[data-planned-notes]').forEach(inp => {
      inp.addEventListener('change', () => this.updatePlannedTodoField(inp.dataset.plannedDay, inp.dataset.plannedNotes, 'notes', inp.value));
    });
    spread.querySelectorAll('[data-planned-sub-text]').forEach(inp => {
      inp.addEventListener('change', () => this.updatePlannedSubtaskText(inp.dataset.plannedDay, inp.dataset.plannedSubText, inp.dataset.plannedSubId, inp.value));
    });
    spread.querySelectorAll('[data-planned-del]').forEach(btn => {
      btn.addEventListener('click', () => this.deletePlannedTodo(btn.dataset.plannedDay, btn.dataset.plannedDel, rerender, rerenderLog));
    });
    spread.querySelectorAll('[data-planned-sub-del]').forEach(btn => {
      btn.addEventListener('click', () => this.deletePlannedSubtask(btn.dataset.plannedDay, btn.dataset.plannedSubDel, btn.dataset.plannedSubId, rerender, rerenderLog));
    });
    spread.querySelectorAll('[data-planned-add-sub]').forEach(btn => {
      btn.addEventListener('click', () => this.addPlannedSubtask(btn.dataset.plannedDay, btn.dataset.plannedAddSub, rerender, rerenderLog));
    });
  },

  bindLiveTodos(spread){
    this.bindPlannedTodos(spread);
  },

  addPlannedTodo(dayKey, root){
    if(!isAdmin()) return;
    const host = root?.querySelector?.(`[data-planned-board-day="${dayKey}"]`) || root;
    const text = host?.querySelector('.planned-new-text')?.value?.trim();
    if(!text) return;
    const time = host?.querySelector('.planned-new-time')?.value || '';
    const durationMin = Number(host?.querySelector('.planned-new-duration')?.value) || 0;
    const notes = host?.querySelector('.planned-new-notes')?.value?.trim() || '';
    getPlannedTodosForDay(dayKey).push(normalizePlannedTodo({ text, scheduledTime: time, durationMin, notes, subtasks: [] }));
    saveState();
    renderHomeCheckIn();
    if(typeof renderLedger === 'function') renderLedger();
    if(DailyLog.activeKey === dayKey) DailyLog.renderPlannedSection(dayKey);
  },

  addPlannedSubtask(dayKey, todoId, rerender, rerenderLog){
    if(!isAdmin()) return;
    const text = prompt('Sub-task:')?.trim();
    if(!text) return;
    const t = getPlannedTodosForDay(dayKey).find(x => x.id === todoId);
    if(!t) return;
    if(!t.subtasks) t.subtasks = [];
    t.subtasks.push({ id: uid('psub'), text, done: false });
    saveState();
    rerender();
    rerenderLog();
  },

  updatePlannedTodoField(dayKey, todoId, field, value, rerender, rerenderLog){
    if(!isAdmin()) return;
    const t = getPlannedTodosForDay(dayKey).find(x => x.id === todoId);
    if(!t) return;
    if(field === 'durationMin') t.durationMin = Number(value) || 0;
    else t[field] = String(value || '').trim();
    saveState();
    if(field === 'scheduledTime'){ rerender?.(); rerenderLog?.(); }
  },

  updatePlannedSubtaskText(dayKey, todoId, subId, text){
    if(!isAdmin()) return;
    const t = getPlannedTodosForDay(dayKey).find(x => x.id === todoId);
    const s = t?.subtasks?.find(x => x.id === subId);
    if(!s) return;
    s.text = text.trim() || s.text;
    saveState();
  },

  deletePlannedTodo(dayKey, todoId, rerender, rerenderLog){
    if(!isAdmin()) return;
    const todos = getPlannedTodosForDay(dayKey);
    state.entries[dayKey].plannedTodos = todos.filter(x => x.id !== todoId);
    saveState();
    rerender();
    rerenderLog();
  },

  deletePlannedSubtask(dayKey, todoId, subId, rerender, rerenderLog){
    if(!isAdmin()) return;
    const t = getPlannedTodosForDay(dayKey).find(x => x.id === todoId);
    if(!t?.subtasks) return;
    t.subtasks = t.subtasks.filter(s => s.id !== subId);
    saveState();
    rerender();
    rerenderLog();
  },

  pushTodoTimelineNode(label, parent, dayKey, atIso){
    const key = dayKey || todayKey();
    const stream = getDayStream(key);
    const at = atIso || new Date().toISOString();
    stream.nodes.push({
      id: 'n-todo-' + Date.now(),
      at,
      type: 'todo',
      text: label,
      body: parent ? `Part of: ${parent}` : '',
    });
    if(!state.entries[key]) state.entries[key] = {};
    state.entries[key].stream = stream;
  },

  togglePlannedTodo(dayKey, todoId, done, rerender, rerenderLog){
    if(!isAdmin()) return;
    const t = getPlannedTodosForDay(dayKey).find(x => x.id === todoId);
    if(!t || t.done === done) return;
    t.done = done;
    t.doneAt = done ? new Date().toISOString() : null;
    if(done){
      const at = scheduledAtIso(dayKey, t.scheduledTime) || new Date().toISOString();
      this.pushTodoTimelineNode(t.text, t.notes || '', dayKey, at);
      awardGrayPoints(GRAY_XP_AWARDS.todo_done.xp, 'todo_done');
    }
    saveState();
    rerender();
    rerenderLog();
  },

  togglePlannedSubtask(dayKey, todoId, subId, done, rerender, rerenderLog){
    if(!isAdmin()) return;
    const t = getPlannedTodosForDay(dayKey).find(x => x.id === todoId);
    const s = t?.subtasks?.find(x => x.id === subId);
    if(!s || s.done === done) return;
    s.done = done;
    s.doneAt = done ? new Date().toISOString() : null;
    if(done) this.pushTodoTimelineNode(s.text, t?.text, dayKey);
    saveState();
    rerender();
    rerenderLog();
  },
};

/* ---------- Coder activity rail (Player Gray) ---------- */
const CODER_ACTIVITY_META = {
  card_created: { label: 'Card created', icon: '◆', neon: '#fcd34d' },
  card_updated: { label: 'Card updated', icon: '✎', neon: '#fcd34d' },
  quest_sent: { label: 'Quest sent', icon: '▶', neon: '#4ade80' },
  quest_complete: { label: 'Quest completed', icon: '★', neon: '#3ad6e0' },
  quest_comment: { label: 'Quest comment', icon: '💬', neon: '#4ade80' },
  quest_vote: { label: 'Quest vote', icon: '▲', neon: '#86efac' },
  xp_award: { label: 'XP awarded', icon: '↑', neon: '#fbbf24' },
  xp_request: { label: 'XP request', icon: '?', neon: '#fbbf24' },
  community_post: { label: 'Community post', icon: '◎', neon: '#38bdf8' },
  community_reply: { label: 'Reply', icon: '↩', neon: '#a78bfa' },
  inbox_message: { label: 'Private message', icon: '✉', neon: '#c084fc' },
  birthday_today: { label: 'Birthday today', icon: '🎂', neon: '#fcd34d' },
};

function openCoderNotify(){
  if(!isAdmin()) return;
  const rail = document.getElementById('coderNotifyRail');
  if(!rail) return;
  rail.classList.remove('hidden');
  document.body.classList.add('coder-notify-open');
  document.getElementById('coderNotifyBackdrop')?.classList.remove('hidden');
}

function closeCoderNotify(){
  document.body.classList.remove('coder-notify-open');
  document.getElementById('coderNotifyBackdrop')?.classList.add('hidden');
  document.getElementById('coderNotifyRail')?.classList.add('hidden');
}

function toggleCoderNotify(){
  if(document.body.classList.contains('coder-notify-open')) closeCoderNotify();
  else openCoderNotify();
}

function updateCoderSignalBadge(){
  const badge = document.getElementById('coderSignalBadge');
  if(!badge) return;
  const n = (state.coderActivity || []).length;
  badge.textContent = String(n);
  badge.classList.toggle('has-signals', n > 0);
}

function relativeSignalTime(iso){
  if(!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if(hrs < 48) return `${hrs}h ago`;
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderCoderNotifyRail(){
  updateCoderSignalBadge();
  const rail = document.getElementById('coderNotifyRail');
  if(!rail) return;
  if(!isAdmin()){
    rail.classList.add('hidden');
    rail.innerHTML = '';
    closeCoderNotify();
    return;
  }
  if(!document.body.classList.contains('coder-notify-open')) rail.classList.add('hidden');
  else rail.classList.remove('hidden');
  const acts = (state.coderActivity || []).slice(0, 80);
  const nodes = acts.length ? acts.map(act => {
    const meta = CODER_ACTIVITY_META[act.type] || { label: act.type, icon: '·', neon: '#94a3b8' };
    const when = relativeSignalTime(act.at);
    const detail = act.detail || act.name || '';
    const who = act.name ? `<span class="coder-signal-who">${esc(act.name)}</span>` : '';
    return `<article class="coder-signal-card" style="--cs-neon:${meta.neon}">
      <div class="coder-signal-icon" aria-hidden="true">${meta.icon}</div>
      <div class="coder-signal-body">
        <div class="coder-signal-top">
          <span class="coder-signal-type">${meta.label}</span>
          <time class="coder-signal-time">${esc(when)}</time>
        </div>
        ${who}
        <p class="coder-signal-text">${esc(detail)}</p>
      </div>
    </article>`;
  }).join('') : `<div class="coder-signal-empty">
    <p class="coder-signal-empty-title">Quiet on the wire</p>
    <p>When coders log in, send quests, post on Community, or earn XP — you'll see it here.</p>
  </div>`;
  rail.innerHTML = `
    <div class="coder-notify-head">
      <div>
        <span class="live-rail-label">Coder signals</span>
        <span class="coder-notify-sub">${acts.length} pulse${acts.length === 1 ? '' : 's'} · quests · posts · XP · cards</span>
      </div>
      <button type="button" class="coder-notify-close" id="closeCoderNotify" aria-label="Close">×</button>
    </div>
    <div class="coder-notify-scroll">
      <div class="coder-signal-list">${nodes}</div>
    </div>`;
  document.getElementById('closeCoderNotify')?.addEventListener('click', closeCoderNotify);
}

function renderHomeCheckIn(){
  const spread = document.getElementById('homeSpread');
  if(!spread) return;

  const key = todayKey();
  const stream = getDayStream(key);
  const admin = isAdmin();
  const nodeCount = getMergedTimelineNodes(stream, key).length;
  const onAir = stream.startedAt && !stream.endedAt;
  const sealed = !!stream.endedAt;

  spread.className = admin ? 'live-broadcast live-broadcast--edit' : 'live-broadcast';
  if(sealed) spread.classList.add('is-sealed');

  spread.innerHTML = `
    <aside class="live-rail-col${sealed ? ' is-sealed' : ''}">
      <div class="live-rail-head">
        <span class="live-rail-label">${sealed ? 'Transmission log · sealed' : 'Transmission log'}</span>
        <span class="live-rail-count">${nodeCount} node${nodeCount === 1 ? '' : 's'}${admin ? ' · edit' : ''}</span>
      </div>
      <div class="live-rail-scroll">${HomeCheckIn.renderTimeline(stream, key)}</div>
    </aside>

    <main class="live-stage-col">
      ${admin ? `<div class="live-edit-banner sketch-card">
        <span class="live-edit-dot" aria-hidden="true"></span>
        <div>
          <p class="live-edit-kicker">Player Gray · edit mode</p>
          <p class="live-edit-text">Start your day, schedule timed to-dos, drop pulses. Everything slots into the transmission log in order — tick tasks when done.</p>
        </div>
      </div>` : ''}

      <div class="live-on-air ${onAir ? 'is-live' : ''}${sealed ? ' is-sealed' : ''}">
        <span class="live-on-air-dot"></span>
        <span class="live-on-air-text">${sealed ? 'TRANSMISSION ENDED' : onAir ? 'ON AIR' : 'OFF AIR'} · Coming To You Live</span>
        <span class="live-on-air-date">${fmtDateLong(key)}</span>
      </div>

      ${admin ? `<div class="live-controls live-controls--edit">
        <button type="button" class="btn primary" id="homeStartDay" ${stream.startedAt && !stream.endedAt ? 'disabled' : ''}>▶ Start day</button>
        <button type="button" class="btn" id="homeEndDay" ${!stream.startedAt || stream.endedAt ? 'disabled' : ''}>■ End day</button>
      </div>` : ''}

      <div class="live-clocks-row">
        <div class="live-clock-card">
          <span class="live-clock-city">Shenzhen</span>
          <span class="live-clock-date" id="clockShenzhenDate">—</span>
          <span class="live-clock-val" id="clockShenzhen">--:--:--</span>
          <span class="live-clock-offset" id="clockShenzhenOffset"></span>
          <span class="live-clock-tz">Asia/Shanghai</span>
        </div>
        <div class="live-clock-card">
          <span class="live-clock-city">United Kingdom</span>
          <span class="live-clock-date" id="clockUkDate">—</span>
          <span class="live-clock-val" id="clockUk">--:--:--</span>
          <span class="live-clock-offset" id="clockUkOffset"></span>
          <span class="live-clock-tz">Europe/London</span>
        </div>
      </div>

      <div class="live-status-bar">
        <span>${esc(HomeCheckIn.dayStatus(stream))}</span>
        ${stream.startedAt ? `<span>Wake ${fmtNodeStamp(stream.startedAt, key)}</span>` : ''}
        ${stream.endedAt ? `<span>Sleep ${fmtNodeStamp(stream.endedAt, key)}</span>` : ''}
      </div>

      ${HomeCheckIn.renderLiveTodos(admin)}

      ${renderLiveQuoteBoard(admin)}

      ${admin ? `<section class="live-pulse-board live-pulse-board--edit">
        <div class="live-pulse-head">
          <div>
            <h3 class="live-pulse-title">Drop a pulse</h3>
            <p class="live-pulse-hint">Use <strong>Big update</strong> for long writing — title becomes the headline in the transmission log. Photos stick on the daily scrapbook.</p>
          </div>
          <button type="button" class="btn primary" id="homeOpenPulse">+ Compose pulse</button>
        </div>
        <div class="live-pulse-quick">
          ${['note','photo','mood','food','drink','quote','quest','person','place','message','song','vibe','win','travel','health','book','film','workout','idea','call','anxiety','hobby','event','gratitude'].map(id => {
            const meta = STREAM_NODE_META[id];
            if(!meta || !PULSE_TYPE_DEFS[id]) return '';
            return `<button type="button" class="pulse-quick-btn" data-pulse-quick="${id}" style="--pq-neon:${meta.neon}" title="${meta.label}"><span>${meta.icon}</span> ${meta.label}</button>`;
          }).join('')}
        </div>
      </section>` : ''}
    </main>`;

  HomeCheckIn.bindSpread(spread);
  HomeCheckIn.bindLiveTodos(spread);
  queueMicrotask(() => HomeCheckIn.scrollRailToBottom());
}

/* ---------- Daily Log — calendar ---------- */
function dayKeyFromParts(y, m, d){
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function captureDayStartSnapshot(key){
  if(!state.entries[key]) state.entries[key] = {};
  const n = normalizeEntry(state.entries[key]);
  state.entries[key].dayStartSnapshot = {
    at: new Date().toISOString(),
    steps: Number(n.steps) || 0,
    workHours: Number(n.workHours) || 0,
    hobbyHours: Number(n.hobbyHours) || 0,
    skillHours: Object.fromEntries(getSkills().map(s => [s.id, getTotalSkillHours(s.id)])),
  };
}

function fmtDayDuration(stream){
  if(!stream?.startedAt || !stream?.endedAt) return '';
  const ms = new Date(stream.endedAt) - new Date(stream.startedAt);
  if(ms < 0) return '';
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return hrs ? `${hrs}h ${mins}m` : `${mins}m`;
}

function fmtDurationMs(ms){
  if(!ms || ms < 0) return '';
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return hrs ? `${hrs}h ${mins}m` : `${mins}m`;
}

function formatDayDelta(d){
  if(d.count) return `+${d.delta}`;
  if(d.fmt === 'number') return (d.delta >= 0 ? '+' : '') + Number(d.delta).toLocaleString();
  return `+${d.delta}${d.suffix || ''}`;
}

function computeDayScoreDeltas(key){
  const raw = state.entries[key];
  if(!raw) return [];
  const snap = raw.dayStartSnapshot || {};
  const hasSnap = !!snap.at;
  const n = normalizeEntry(raw);
  const stream = getDayStream(key);
  const deltas = [];

  const push = (item) => {
    const delta = hasSnap ? Math.max(0, item.rawDelta) : item.rawDelta;
    if(delta > 0 || (!hasSnap && item.value > 0)) deltas.push({ ...item, delta, hasSnap });
  };

  const steps = Number(n.steps) || 0;
  if(steps) push({ id: 'steps', label: 'Steps', value: steps, rawDelta: steps - (snap.steps || 0), neon: '#3ad6e0', fmt: 'number' });

  const work = Number(n.workHours) || 0;
  if(work) push({ id: 'work', label: 'Work', value: work, rawDelta: work - (snap.workHours || 0), neon: '#60a5fa', suffix: 'h' });

  const mandarin = mandarinHoursFromEntry(n);
  if(mandarin) push({ id: 'mandarin', label: 'Mandarin', value: mandarin, rawDelta: mandarin, neon: '#dc2626', suffix: 'h' });

  if(n.hobby){
    const hobbyH = Number(n.hobbyHours) || 0;
    if(hobbyH) push({ id: 'hobby', label: n.hobby, value: hobbyH, rawDelta: hobbyH - (snap.hobbyHours || 0), neon: '#e879f9', suffix: 'h' });
  }

  if(snap.skillHours){
    getSkills().forEach(skill => {
      const nowH = getTotalSkillHours(skill.id);
      const was = snap.skillHours[skill.id] || 0;
      const d = Math.round((nowH - was) * 10) / 10;
      if(d > 0) push({ id: skill.id, label: skill.name, value: nowH, rawDelta: d, neon: skill.color || '#7c4dff', suffix: 'h', cumulative: true });
    });
  }

  const pulseCount = stream.nodes.filter(nd => nd.type !== 'wake' && nd.type !== 'sleep').length;
  if(pulseCount) push({ id: 'pulses', label: 'Pulses logged', value: pulseCount, rawDelta: pulseCount, neon: '#7c4dff', count: true });

  if(n.people.length) push({ id: 'people', label: 'People met', value: n.people.length, rawDelta: n.people.length, neon: '#a78bfa', count: true });
  if(n.places.length) push({ id: 'places', label: 'Places visited', value: n.places.length, rawDelta: n.places.length, neon: '#4ade80', count: true });

  return deltas;
}

function renderDayScoreChips(deltas){
  if(!deltas?.length) return '';
  return `<section class="day-ledger-scores">
    <h4 class="day-ledger-kicker">Today's gains</h4>
    <div class="day-score-grid">
      ${deltas.map(d => `<div class="day-score-chip" style="--dsc-neon:${d.neon}">
        <span class="dsc-delta"><span class="dsc-arrow">↑</span>${formatDayDelta(d)}</span>
        <span class="dsc-label">${esc(d.label)}</span>
        ${d.cumulative ? `<span class="dsc-total">${d.value}${d.suffix || ''} total</span>` : ''}
      </div>`).join('')}
    </div>
  </section>`;
}

function renderDayReflectionHTML(reflection){
  if(!reflection?.favoriteThing) return '';
  const items = [
    { q: 'Favourite thing', a: reflection.favoriteThing, neon: '#fcd34d' },
    { q: 'Hardest moment', a: reflection.hardestMoment, neon: '#f87171' },
    { q: 'Grateful for', a: reflection.gratefulFor, neon: '#f9a8d4' },
    { q: 'Carry into tomorrow', a: reflection.tomorrowFocus, neon: '#7dd3fc' },
  ].filter(x => x.a);
  return `<section class="day-ledger-reflect">
    <h4 class="day-ledger-kicker">Closing reflections</h4>
    ${items.map(it => `<div class="day-reflect-card" style="--drc-neon:${it.neon}">
      <p class="day-reflect-q">${esc(it.q)}</p>
      <p class="day-reflect-a">${esc(it.a)}</p>
    </div>`).join('')}
  </section>`;
}

function renderPlannedTodosReadOnly(dayKey){
  const todos = sortPlannedTodos(getPlannedTodosForDay(dayKey));
  if(!todos.length) return '';
  const rows = todos.map(t => {
    const time = t.scheduledTime ? fmtPlannedTime(t.scheduledTime) : 'anytime';
    const status = t.done ? '✓' : '○';
    const notes = t.notes ? ` — ${esc(t.notes)}` : '';
    return `<li class="day-plan-row ${t.done ? 'is-done' : ''}"><span class="day-plan-time">${esc(time)}</span><span class="day-plan-status">${status}</span><span class="day-plan-text">${esc(t.text)}${notes}</span></li>`;
  }).join('');
  return `<section class="day-detail-section day-plan-read">
    <h4>Day plan</h4>
    <ul class="day-plan-list">${rows}</ul>
  </section>`;
}

function getPulseNodeTitle(node){
  if(!node) return '';
  if(node.data?.title) return node.data.title;
  if(node.type === 'note' && node.text) return node.text;
  return node.text || '';
}

function renderScrapbookTodos(key){
  const todos = getPlannedTodosForDay(key);
  const done = todos.filter(t => t.done);
  const pending = todos.filter(t => !t.done);
  if(!done.length && !pending.length) return '';
  let html = '<aside class="scrapbook-todos sketch-card">';
  if(done.length){
    html += `<div class="scrapbook-todos-group"><h4 class="scrapbook-todos-title">Done today</h4><ul class="scrapbook-todo-list">${done.map(t =>
      `<li class="scrapbook-todo is-done"><span class="scrapbook-todo-mark">✓</span>${esc(t.text)}</li>`
    ).join('')}</ul></div>`;
  }
  if(pending.length){
    html += `<div class="scrapbook-todos-group"><h4 class="scrapbook-todos-title">Still on the list</h4><ul class="scrapbook-todo-list">${pending.map(t =>
      `<li class="scrapbook-todo is-pending"><span class="scrapbook-todo-mark">○</span>${esc(t.text)}</li>`
    ).join('')}</ul></div>`;
  }
  html += '</aside>';
  return html;
}

function buildScrapbookChrome(key, nav = {}){
  const d = new Date(key + 'T12:00:00');
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const monthYear = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const prevKey = nav.prevKey || addDaysToKey(key, -1);
  const nextKey = nav.nextKey || addDaysToKey(key, 1);
  const adminEdit = isAdmin()
    ? `<button type="button" class="btn scrapbook-edit-day" data-scrap-edit-day="${key}">Edit this day</button>`
    : '';
  return `<header class="scrapbook-chrome sketch-card">
    <button type="button" class="btn" data-scrap-day="${prevKey}" aria-label="Previous day">←</button>
    <div class="scrapbook-date-head">
      <span class="scrapbook-weekday">${esc(weekday)}</span>
      <span class="scrapbook-month">${esc(monthYear)}</span>
    </div>
    <button type="button" class="btn" data-scrap-day="${nextKey}" aria-label="Next day">→</button>
    ${adminEdit}
  </header>`;
}

function getScrapbookWallItems(key, e, stream){
  const n = normalizeEntry(e);
  const pulses = stream.nodes.filter(nd => nd.type !== 'wake' && nd.type !== 'sleep');
  const items = [];
  pulses.forEach((node, idx) => {
    items.push({
      id: node.id || `pulse-${key}-${idx}`,
      kind: 'pulse',
      node,
      at: node.at || '',
    });
  });
  (n.photos || []).forEach((p, idx) => {
    const src = typeof p === 'string' ? p : p.src;
    if(!src) return;
    items.push({
      id: `dayphoto-${key}-${idx}`,
      kind: 'photo',
      src,
      caption: 'Photo of the day',
      at: stream.endedAt || stream.startedAt || '',
    });
  });
  if(n.diary){
    items.push({
      id: `diary-${key}`,
      kind: 'diary',
      text: n.diary,
      at: stream.endedAt || stream.startedAt || `${key}T23:59:00`,
    });
  }
  items.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return ta - tb || String(a.id).localeCompare(String(b.id));
  });
  return items;
}

function buildScrapbookWallItem(item, index, key){
  const layout = resolveGalleryLayout({ id: item.id, layoutPreset: index % GALLERY_LAYOUTS.length }, index);
  const wideClass = layout.gridWide ? ' layout-wide' : '';
  const sizeClass = ` size-${layout.size}`;
  const style = `--rot:${layout.rotate}deg;--shift-x:${layout.shiftX}px;--shift-y:${layout.shiftY}px;`;

  if(item.kind === 'photo'){
    const neon = stableNeon(item.id, index);
    return `<figure class="photo-flip scrap-item${wideClass}${sizeClass}" style="${style}--flip-neon:${neon}" data-scrap-id="${esc(item.id)}">
      <div class="photo-flip-scene">
        <div class="photo-flip-inner">
          <div class="photo-flip-face photo-flip-front">
            <div class="photo-frame"><img src="${esc(item.src)}" alt="" loading="lazy"></div>
            <figcaption class="photo-caption">${esc(item.caption || 'Photo')}</figcaption>
          </div>
          <div class="photo-flip-face photo-flip-back">
            <div class="flip-back-inner">
              <h3 class="flip-caption">${esc(item.caption || 'Photo of the day')}</h3>
              ${item.at ? `<p class="flip-place">${esc(fmtNodeStamp(item.at, key))}</p>` : ''}
              <span class="flip-hint-back">tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </figure>`;
  }

  if(item.kind === 'diary'){
    const neon = '#9b5cff';
    const when = item.at ? fmtNodeStamp(item.at, key) : '';
    return `<figure class="photo-flip scrap-item scrap-item--writing${wideClass}${sizeClass}" style="${style}--flip-neon:${neon}" data-scrap-id="${esc(item.id)}">
      <div class="photo-flip-scene">
        <div class="scrap-pulse-card">
          ${when ? `<time class="scrap-pulse-time">${esc(when)}</time>` : ''}
          <span class="scrap-pulse-type">Diary</span>
          <p class="scrap-pulse-body">${esc(item.text)}</p>
        </div>
      </div>
    </figure>`;
  }

  const node = item.node;
  const meta = STREAM_NODE_META[node.type] || { label: node.type, neon: '#3ad6e0', icon: '•' };
  const neon = meta.neon;
  const when = fmtNodeStamp(node.at, key);
  const title = getPulseNodeTitle(node);
  const body = node.body || node.data?.body || '';
  const text = body || (node.text && node.text !== title ? node.text : '');
  const isWriting = ['note', 'dream', 'memory', 'idea', 'event', 'news'].includes(node.type) || (text && text.length > 80);
  const writeWide = isWriting ? ' layout-wide' : wideClass;

  if(node.photo){
    return `<figure class="photo-flip scrap-item${writeWide}${sizeClass}" style="${style}--flip-neon:${neon}" data-scrap-id="${esc(item.id)}">
      <div class="photo-flip-scene">
        <div class="photo-flip-inner">
          <div class="photo-flip-face photo-flip-front">
            <div class="photo-frame"><img src="${esc(node.photo)}" alt="" loading="lazy"></div>
            <figcaption class="photo-caption">${esc(title || meta.label)} · ${esc(when)}</figcaption>
          </div>
          <div class="photo-flip-face photo-flip-back">
            <div class="flip-back-inner">
              <time class="scrap-pulse-time">${esc(when)}</time>
              <span class="scrap-pulse-type">${meta.icon} ${meta.label}</span>
              ${title ? `<h3 class="flip-caption">${esc(title)}</h3>` : ''}
              ${text ? `<p class="flip-desc">${esc(text)}</p>` : ''}
              <span class="flip-hint-back">tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </figure>`;
  }

  return `<figure class="photo-flip scrap-item scrap-item--writing${writeWide}${sizeClass}" style="${style}--flip-neon:${neon}" data-scrap-id="${esc(item.id)}">
    <div class="photo-flip-scene">
      <div class="scrap-pulse-card">
        <time class="scrap-pulse-time">${esc(when)}</time>
        <span class="scrap-pulse-type">${meta.icon} ${meta.label}</span>
        ${title ? `<h3 class="scrap-pulse-title">${esc(title)}</h3>` : ''}
        ${text ? `<p class="scrap-pulse-body">${esc(text)}</p>` : ''}
      </div>
    </div>
  </figure>`;
}

function buildEmptyScrapbookPage(key, nav){
  const d = new Date(key + 'T12:00:00');
  return `<div class="scrapbook-day">
    ${buildScrapbookChrome(key, nav)}
    <div class="scrapbook-body">
      <div class="scrapbook-main">
        ${renderScrapbookTodos(key)}
        <p class="empty-hint">Blank page · ${esc(d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))} — post on Coming To You Live and it lands here.</p>
      </div>
    </div>
  </div>`;
}

function buildDayScrapbookHTML(key, e, nav = {}){
  const n = normalizeEntry(e);
  const stream = getDayStream(key);
  const planned = getPlannedTodosForDay(key);
  const moodId = resolveEntryMood(n);
  const completed = !!stream.endedAt;
  const pulses = stream.nodes.filter(nd => nd.type !== 'wake' && nd.type !== 'sleep');
  const hasContent = !!(moodId || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length || pulses.length || n.dayReflection?.favoriteThing || planned.length);
  if(!hasContent) return buildEmptyScrapbookPage(key, nav);

  const duration = fmtDayDuration(stream) || fmtDurationMs(n.daySummary?.durationMs);
  const deltas = n.daySummary?.deltas?.length ? n.daySummary.deltas : computeDayScoreDeltas(key);
  const wallItems = getScrapbookWallItems(key, e, stream);
  const statusLabel = completed ? 'Day sealed' : (stream.startedAt ? 'Day in progress' : 'Day open');
  const spanLine = stream.startedAt
    ? `${fmtNodeStamp(stream.startedAt, key)}${stream.endedAt ? ` → ${fmtNodeStamp(stream.endedAt, key)}` : ''}${duration ? ` · ${duration}` : ''}`
    : '';

  return `<div class="scrapbook-day" style="--db-mood:${moodColor(moodId)}">
    ${buildScrapbookChrome(key, nav)}
    <div class="scrapbook-meta sketch-card">
      <span class="scrapbook-status${completed ? ' is-sealed' : ''}">${statusLabel}</span>
      ${moodId ? `<span class="scrapbook-mood">${moodIcon(moodId)} ${esc(moodLabel(moodId))}</span>` : ''}
      ${spanLine ? `<span class="scrapbook-span">${esc(spanLine)}</span>` : ''}
    </div>
    ${renderDayScoreChips(deltas)}
    <div class="scrapbook-body">
      <div class="scrapbook-main">
        ${renderScrapbookTodos(key)}
        <div class="photo-wall scrapbook-wall">${wallItems.map((item, i) => buildScrapbookWallItem(item, i, key)).join('')}</div>
        ${renderDayReflectionHTML(n.dayReflection)}
      </div>
    </div>
  </div>`;
}

function bindScrapbookNav(host){
  if(!host) return;
  host.querySelectorAll('[data-scrap-day]').forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const k = btn.dataset.scrapDay;
      setLogFocusKey(k);
      if(isAdmin() && typeof DailyLog !== 'undefined') DailyLog.selectDay(k);
      else renderLedger();
    });
  });
  host.querySelectorAll('[data-scrap-edit-day]').forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      if(typeof DailyLog !== 'undefined') DailyLog.selectDay(btn.dataset.scrapEditDay);
    });
  });
  const wall = host.querySelector('.scrapbook-wall');
  if(wall && !wall._scrapHandler){
    wall._scrapHandler = e => {
      if(e.target.closest('.scrapbook-edit-day, [data-scrap-day]')) return;
      const fig = e.target.closest('.photo-flip');
      if(!fig || !wall.contains(fig)) return;
      const wasFlipped = fig.classList.contains('is-flipped');
      wall.querySelectorAll('.photo-flip.is-flipped').forEach(f => f.classList.remove('is-flipped'));
      if(!wasFlipped && fig.querySelector('.photo-flip-inner')) fig.classList.add('is-flipped');
    };
    wall.addEventListener('click', wall._scrapHandler);
  }
}

function renderLogBook(){
  const grid = document.getElementById('logCalendar');
  if(!grid) return;
  const key = getLogFocusKey() || todayKey();
  if(!getLogFocusKey()) setLogFocusKey(key);
  const e = state.entries[key];
  const nav = { prevKey: addDaysToKey(key, -1), nextKey: addDaysToKey(key, 1) };
  grid.innerHTML = e ? buildDayScrapbookHTML(key, e, nav) : buildEmptyScrapbookPage(key, nav);
  bindScrapbookNav(grid);
}

function buildDayDetailHTML(key, e){
  return buildDayScrapbookHTML(key, e);
}

function renderLogCalendar(){
  const grid = document.getElementById('logCalendar');
  const label = document.getElementById('monthLabel');
  const tally = document.getElementById('logTally');
  if(!grid) return;

  const { year, month } = getCalendarView();
  const monthDate = new Date(year, month, 1);
  if(label) label.textContent = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const logged = countLoggedDays();
  if(tally) tally.textContent = `${logged} day${logged === 1 ? '' : 's'} logged`;

  const firstDow = monthDate.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const tk = todayKey();
  const weekdayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let html = weekdayLabels.map(w => `<div class="cal-wd">${w}</div>`).join('');
  for(let i = 0; i < firstDow; i++) html += `<div class="cal-cell cal-pad"></div>`;

  for(let d = 1; d <= daysInMonth; d++){
    const key = dayKeyFromParts(year, month, d);
    const e = state.entries[key];
    const n = normalizeEntry(e);
    const stream = getDayStream(key);
    const stats = daySummaryStats(key);
    const isComplete = stats.sealed;
    const hasEntry = stats.hasEntry;
    const moodId = stats.moodId;
    const plannedCount = stats.plannedCount;
    const pulseCount = stats.pulseCount;
    const neon = stableNeon(key, d);
    const isToday = key === tk;
    const isEditing = isAdmin() && key === DailyLog.activeKey;
    html += `<button type="button" class="cal-cell cal-day${hasEntry ? ' has-entry' : ''}${isComplete ? ' is-complete' : ''}${isToday ? ' is-today' : ''}${isEditing ? ' is-editing-day' : ''}"
      style="--cal-neon:${neon}" data-log-day="${key}">
      <span class="cal-day-num">${d}</span>
      ${hasEntry && moodId ? `<span class="cal-mood">${moodIcon(moodId)}</span>` : ''}
      ${plannedCount ? `<span class="cal-plan-count" title="${plannedCount} planned">${plannedCount}◷</span>` : ''}
      ${pulseCount ? `<span class="cal-pulse-count" title="${pulseCount} pulses">${pulseCount}◎</span>` : ''}
      ${hasEntry ? `<span class="cal-dot"></span>` : ''}
    </button>`;
  }

  grid.innerHTML = html;
}

function renderLogWeek(){
  const grid = document.getElementById('logCalendar');
  const label = document.getElementById('monthLabel');
  const tally = document.getElementById('logTally');
  if(!grid) return;
  const focus = getLogFocusKey();
  const keys = weekKeysFrom(focus);
  if(label) label.textContent = `${fmtDateLong(keys[0])} – ${fmtDateLong(keys[6])}`;
  if(tally) tally.textContent = `${countLoggedDays()} days logged · week view`;
  const tk = todayKey();
  grid.innerHTML = `<div class="log-week-grid">${keys.map(key => {
    const stats = daySummaryStats(key);
    const d = Number(key.split('-')[2]);
    const weekday = new Date(key + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
    return `<button type="button" class="log-week-day${stats.hasEntry ? ' has-entry' : ''}${stats.sealed ? ' is-complete' : ''}${key === tk ? ' is-today' : ''}${isAdmin() && key === DailyLog.activeKey ? ' is-editing-day' : ''}" data-log-day="${key}">
      <span class="log-week-dow">${weekday}</span>
      <span class="log-week-num">${d}</span>
      ${stats.moodId ? `<span class="log-week-mood">${moodIcon(stats.moodId)}</span>` : ''}
      <span class="log-week-meta">${stats.plannedCount ? `${stats.plannedCount}◷ ` : ''}${stats.pulseCount ? `${stats.pulseCount}◎` : ''}</span>
      <span class="log-week-status">${stats.sealed ? 'sealed' : stats.hasEntry ? 'active' : '—'}</span>
    </button>`;
  }).join('')}</div>`;
}

function renderLogDayFocus(){
  const grid = document.getElementById('logCalendar');
  const label = document.getElementById('monthLabel');
  const tally = document.getElementById('logTally');
  if(!grid) return;
  const key = getLogFocusKey();
  if(label) label.textContent = fmtDateLong(key);
  if(tally) tally.textContent = `${countLoggedDays()} days logged · day view`;
  const e = state.entries[key];
  grid.innerHTML = `<div class="log-day-focus">${buildDayDetailHTML(key, e)}</div>`;
}

function renderLedger(){
  setLogViewMode('book');
  renderLogBook();
}

function deleteLogDay(key, opts = {}){
  if(!isAdmin()) return false;
  if(!key || !confirm(`Delete the log for ${fmtDateLong(key)}? This cannot be undone.`)) return false;
  delete state.entries[key];
  saveState();
  pendingDayPhotos = [];
  document.getElementById('dayModalBack')?.classList.add('hidden');
  const preview = document.getElementById('ledgerDayPreview');
  if(preview){ preview.classList.add('hidden'); preview.innerHTML = ''; }
  if(opts.keepEditorOpen && typeof DailyLog !== 'undefined'){
    DailyLog.activeKey = key;
    document.getElementById('logDateKey').value = key;
    mountMoodPicker('logMoodPicker', getCurrentMood(), { name: 'logMood', compact: true });
    document.getElementById('logSteps').value = 0;
    document.getElementById('logWork').value = 0;
    document.getElementById('logMandarin').value = 0;
    document.getElementById('logPeople').value = '';
    document.getElementById('logPlaces').value = '';
    document.getElementById('logDiary').value = '';
    document.getElementById('logHobbySelect').value = '';
    document.getElementById('logHobbyHours').value = 0;
    document.getElementById('logZone').value = '';
    DailyLog.renderPhotoPreview();
    document.getElementById('logEditHint').textContent = `Deleted ${fmtDateLong(key)}`;
    document.getElementById('logEditorTitle').textContent = fmtDateLong(key);
  }
  renderLedger();
  renderHomeCheckIn();
  safeRender(renderAbout);
  return true;
}

function openDayModal(key){
  const e = state.entries[key];
  document.getElementById('dayModalTitle').textContent = fmtDateLong(key);
  const detailEl = document.getElementById('dayDetailView');
  detailEl.classList.remove('hidden');
  detailEl.innerHTML = buildDayDetailHTML(key, e);
  const actions = document.getElementById('dayModalActions');
  const delBtn = document.getElementById('deleteDayModal');
  if(actions && delBtn){
    const canDelete = isAdmin() && !!e;
    actions.classList.toggle('hidden', !canDelete);
    delBtn.dataset.dayKey = key;
  }
  document.getElementById('dayModalBack').classList.remove('hidden');
}

document.getElementById('closeDayModal')?.addEventListener('click', () => document.getElementById('dayModalBack').classList.add('hidden'));
document.getElementById('deleteDayModal')?.addEventListener('click', () => {
  const key = document.getElementById('deleteDayModal')?.dataset.dayKey;
  if(key) deleteLogDay(key);
});

/* ---------- Cards ---------- */
function renderPlaces(){
  const deck = document.getElementById('placeDeck');
  if(!deck) return;
  const recHost = document.getElementById('placeRecommendations');
  if(recHost && typeof renderCategoryRecommendationsHtml === 'function'){
    recHost.innerHTML = renderCategoryRecommendationsHtml('place', 'places');
  }
  const places = getPlaces();
  deck.innerHTML = places.map((p, i) => buildFlipPlaceCard(p, i)).join('');
  bindFlipPlayerCards(deck);
}

function getCoderPosts(coderId){
  return (state.pinboard || []).filter(p =>
    p.characterId === coderId
    || (p.replies || []).some(r => r.characterId === coderId)
  );
}

function navigateToCoderBoard(coderId){
  if(!coderId) return;
  coderBoardId = coderId;
  navigateToView('coder-board');
}

function getCoderByIdAny(coderId){
  return (state.viewerCharacters || []).find(c => c.id === coderId)
    || (typeof getCharacters === 'function' ? getCharacters() : []).find(c => c.id === coderId)
    || null;
}

function getCoderGallery(coderId){
  const items = [];
  (state.pinboard || []).forEach(p => {
    if(p.characterId !== coderId) return;
    if(p.photo) items.push({ type: 'photo', src: p.photo, at: p.time, label: p.text?.slice(0, 60) || 'Post' });
    if(p.video) items.push({ type: 'video', src: p.video, at: p.time, label: p.text?.slice(0, 60) || 'Video' });
  });
  return items.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
}

function getCoderQuests(coderId){
  return (state.quests || []).filter(q => q.fromCharacterId === coderId);
}

function renderCoderGalleryGrid(coderId){
  const items = getCoderGallery(coderId);
  if(!items.length) return '<p class="empty-hint">No photos or videos yet.</p>';
  return `<div class="coder-gallery-grid">${items.map(it => `
    <figure class="coder-gallery-item coder-gallery-item--${it.type}">
      ${it.type === 'video'
        ? `<video src="${esc(it.src)}" controls playsinline></video>`
        : `<img src="${esc(it.src)}" alt="" loading="lazy">`}
      <figcaption>${esc(it.label || '')}</figcaption>
    </figure>`).join('')}</div>`;
}

function renderCoderPhotoWall(coderId){
  const items = getCoderGallery(coderId);
  if(!items.length) return '<p class="gallery-hint">No photos or videos yet — post an update with media.</p>';
  return `<p class="gallery-hint">Click a photo to flip it over.</p>
    <div class="photo-wall profile-photo-wall">${items.map((it, i) => {
      const layout = resolveGalleryLayout({ id: it.src || String(i), layoutPreset: i % GALLERY_LAYOUTS.length }, i);
      const neon = stableNeon(it.src || String(i), i);
      const wideClass = layout.gridWide ? ' layout-wide' : '';
      if(it.type === 'video'){
        return `<figure class="photo-flip scrap-item${wideClass} size-${layout.size}" style="--rot:${layout.rotate}deg;--shift-x:${layout.shiftX}px;--shift-y:${layout.shiftY}px;--flip-neon:${neon}">
          <div class="photo-flip-scene">
            <div class="photo-flip-inner">
              <div class="photo-flip-face photo-flip-front">
                <div class="photo-frame"><video src="${esc(it.src)}" controls playsinline></video></div>
                <figcaption class="photo-caption">${esc(it.label || 'Video')}</figcaption>
              </div>
              <div class="photo-flip-face photo-flip-back"><div class="flip-back-inner"><h3 class="flip-caption">${esc(it.label || 'Video')}</h3><span class="flip-hint-back">tap to flip back</span></div></div>
            </div>
          </div>
        </figure>`;
      }
      return `<figure class="photo-flip scrap-item${wideClass} size-${layout.size}" style="--rot:${layout.rotate}deg;--shift-x:${layout.shiftX}px;--shift-y:${layout.shiftY}px;--flip-neon:${neon}">
        <div class="photo-flip-scene">
          <div class="photo-flip-inner">
            <div class="photo-flip-face photo-flip-front">
              <div class="photo-frame"><img src="${esc(it.src)}" alt="" loading="lazy"></div>
              <figcaption class="photo-caption">${esc(it.label || 'Photo')}</figcaption>
            </div>
            <div class="photo-flip-face photo-flip-back"><div class="flip-back-inner"><h3 class="flip-caption">${esc(it.label || 'Photo')}</h3><span class="flip-hint-back">tap to flip back</span></div></div>
          </div>
        </div>
      </figure>`;
    }).join('')}</div>`;
}

function collectionMediaToDrama(m){
  const raw = (m.medium || 'film').toLowerCase().trim();
  const typeMap = {
    tv: 'tv', television: 'tv', series: 'tv', show: 'tv',
    film: 'film', movie: 'film', cinema: 'film',
    book: 'book', novel: 'book', read: 'book',
    album: 'album', lp: 'album', music: 'album',
    song: 'song', track: 'song', single: 'song',
  };
  const mediaType = typeMap[raw] || (MEDIA_SECTION_ORDER.includes(raw) ? raw : 'film');
  const mt = getMediaType(mediaType);
  const total = Number(m.totalEpisodes) || mt.defaultUnits;
  const current = m.currentEpisode != null
    ? Number(m.currentEpisode)
    : (m.status === 'completed' ? total : Math.min(1, total));
  const rating = Number(m.rating) || 0;
  const attrs = getMediaAttributes(mediaType);
  const epRatings = {};
  if(rating){
    attrs.forEach(a => { epRatings[a.id] = rating; });
  }
  return {
    id: m.id || uid('cmedia'),
    title: m.title || 'Untitled',
    mediaType,
    status: m.status || (current >= total ? 'completed' : 'watching'),
    genre: m.genre || '',
    country: m.country || '',
    image: m.image || '',
    currentEpisode: current,
    totalEpisodes: total,
    episodes: rating ? { '1': { ratings: epRatings } } : {},
    finalReview: m.review || m.notes || '',
  };
}

function buildDramaCardHtml(d, i, si){
  const type = d.mediaType || 'tv';
  const mt = getMediaType(type);
  const pct = d.totalEpisodes ? Math.round((d.currentEpisode / d.totalEpisodes) * 100) : 0;
  const ratingDots = computeShowRatingDots(d, stableNeon(d.id, 1));
  const reviewed = Object.keys(d.episodes || {}).length;
  const neon = stableNeon(d.id, i + si);
  const country = type === 'tv' && d.country ? `<span class="drama-country">${esc(d.country)}</span>` : '';
  return `<article class="drama-card media-card status-${d.status}" style="--drot:${((i % 5) * 0.6 - 1.2).toFixed(1)}deg;--media-neon:${neon}" data-drama-id="${esc(d.id)}">
    <div class="drama-card-art">${d.image ? `<img src="${esc(d.image)}" alt="">` : `<span class="drama-art-ph">${esc(d.title.charAt(0))}</span>`}</div>
    <div class="drama-card-body">
      <div class="drama-card-top"><span class="drama-status">${esc(mt.label)} · ${d.status}</span>${country}${ratingDots || ''}</div>
      <h3 class="drama-card-title">${esc(d.title)}</h3>
      <div class="drama-card-genre">${esc(d.genre || '')}</div>
      <div class="drama-ep-track"><span class="drama-ep-label">${mt.unit} ${d.currentEpisode}/${d.totalEpisodes} · ${reviewed} rated</span>
        <div class="drama-ep-bar"><div style="width:${pct}%"></div></div></div>
      ${d.finalReview ? `<p class="drama-card-review">${esc(d.finalReview.slice(0, 90))}${d.finalReview.length > 90 ? '…' : ''}</p>` : ''}
    </div></article>`;
}

function renderDramaDeckSections(dramas, opts = {}){
  const byType = {};
  (dramas || []).forEach(d => {
    const t = d.mediaType || 'tv';
    if(!byType[t]) byType[t] = [];
    byType[t].push(d);
  });
  return MEDIA_SECTION_ORDER.map((type, si) => {
    const items = byType[type];
    if(!items?.length) return '';
    const mt = getMediaType(type);
    const cards = items.map((d, i) => buildDramaCardHtml(d, i, si)).join('');
    return `<section class="media-type-section" style="--mts-neon:${stableNeon(type, 2)}">
      <h3 class="media-type-title">${mt.label}</h3>
      ${typeof renderCategoryRecommendationsHtml === 'function' && !opts.skipRecommendations ? renderCategoryRecommendationsHtml(type, mt.label) : ''}
      <div class="drama-deck media-type-deck">${cards}</div>
    </section>`;
  }).join('');
}

function openCoderMediaDetail(m){
  const d = collectionMediaToDrama(m);
  const mt = getMediaType(d.mediaType);
  const ratingDots = computeShowRatingDots(d, stableNeon(d.id, 1));
  const host = document.getElementById('dramaDetailContent');
  const back = document.getElementById('dramaDetailBack');
  if(!host || !back) return;
  host.innerHTML = `
    <h2 class="drama-detail-title">${esc(d.title)}</h2>
    <div class="drama-detail-meta">${esc(mt.label)} · ${esc(d.genre || '')}${d.mediaType === 'tv' && d.country ? ` · ${esc(d.country)}` : ''} · ${d.status}
      ${ratingDots ? ` · ${ratingDots}` : ''}</div>
    <div class="drama-final-review">
      <h4>Review</h4>
      ${d.finalReview ? `<p>${esc(d.finalReview)}</p>` : '<p class="empty-hint">No review yet.</p>'}
    </div>`;
  back.classList.remove('hidden');
}

function renderCoderProfileShell(c, opts = {}){
  const coderId = c.id;
  const accent = c.cardColor || '#e94ff5';
  const rank = typeof getCoderXpRank === 'function' ? getCoderXpRank(coderId) : null;
  const rankNeon = typeof getCoderRankNeon === 'function' ? getCoderRankNeon(rank) : accent;
  const lvl = typeof coderLevelFromPoints === 'function' ? coderLevelFromPoints(c.points || 0) : { level: 0, progress: 0, xpToNext: 100 };
  const online = typeof isCoderOnline === 'function' && isCoderOnline(coderId);
  const rankMap = typeof getCoderXpRankMap === 'function' ? getCoderXpRankMap() : new Map();
  const card = typeof buildFlipPlayerCard === 'function'
    ? buildFlipPlayerCard(c, 'character', 0, { accent, xpRank: rankMap.get(coderId), rankNeon, isOnline: online })
    : '';
  const isMine = opts.isMine || (typeof getMyCoderCard === 'function' && getMyCoderCard()?.id === coderId);
  const posts = getCoderPosts(coderId).filter(p => p.characterId === coderId).sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  const quests = getCoderQuests(coderId);
  const lvlPct = Math.round((lvl.progress || 0) * 100);
  const xpDisplay = typeof displayCoderXp === 'function' ? displayCoderXp(c) : String(c.points || 0);
  const sections = [
    { id: 'updates', label: 'Updates', icon: '◎', neon: '#fcd34d' },
    { id: 'photos', label: 'Photos', icon: '▣', neon: '#a78bfa' },
    { id: 'friends', label: 'Friends', icon: '♥', neon: '#f43f8e' },
    { id: 'skills', label: 'Skills', icon: '◆', neon: '#38bdf8' },
    { id: 'media', label: 'Media', icon: '◈', neon: '#22d3ee' },
    { id: 'places', label: 'Places', icon: '◇', neon: '#4ade80' },
    { id: 'quests', label: 'Quests', icon: '✦', neon: '#fb923c' },
  ];
  const railHtml = sections.map((s, i) =>
    `<button type="button" class="profile-rail-banner${i === 0 ? ' is-active' : ''}" data-ps-section="${s.id}" style="--pr-neon:${s.neon}"><span class="profile-rail-glow" aria-hidden="true"></span><span class="profile-rail-icon">${s.icon}</span><span class="profile-rail-label">${esc(s.label)}</span></button>`
  ).join('');
  const colSection = id => typeof GameHub !== 'undefined' && GameHub.renderCollectionSection
    ? GameHub.renderCollectionSection(coderId, id)
    : '';
  const questHtml = quests.length
    ? `<ul class="profile-quest-list">${quests.map(q => {
      const type = typeof QUEST_TYPES !== 'undefined' ? (QUEST_TYPES.find(t => t.id === q.type) || QUEST_TYPES[5]) : { neon: '#fb923c', icon: '✦', label: 'Quest' };
      return `<li class="profile-quest-row" style="--pq-neon:${type.neon}"><span class="profile-quest-type">${type.icon} ${esc(type.label)}</span><strong>${esc(q.title)}</strong><span class="profile-quest-st">${esc(q.status)}</span></li>`;
    }).join('')}</ul>`
    : '<p class="empty-hint">No quests sent yet.</p>';
  const feedHtml = typeof renderCoderUpdateFeed === 'function' ? renderCoderUpdateFeed(posts, accent) : '';
  return `<div class="profile-site" data-profile-coder="${esc(coderId)}" style="--ps-neon:${esc(accent)}">
    <header class="profile-site-hero">
      <div class="profile-site-hero-glow" aria-hidden="true"></div>
      <div class="profile-site-hero-inner">
        <div class="profile-site-card">${card}</div>
        <div class="profile-site-meta">
          <p class="profile-site-kicker">${online ? '<span class="profile-site-online">● online</span>' : ''}${isMine ? 'my profile' : esc(c.name)}</p>
          <h2 class="profile-site-name">${esc(c.name)}</h2>
          <div class="profile-site-chips">
            <span class="profile-id-chip" style="--pic-neon:${esc(accent)}">${xpDisplay} XP</span>
            <span class="profile-id-chip" style="--pic-neon:#3ad6e0">LV ${lvl.level}</span>
            ${rank && rank <= 3 && rankNeon ? `<span class="profile-id-chip" style="--rank-neon:${esc(rankNeon)}">#${rank}</span>` : rank ? `<span class="profile-id-chip">#${rank}</span>` : ''}
            ${isMine ? '<button type="button" class="btn profile-id-chip profile-edit-chip" id="editMyCardBtn">Edit</button>' : ''}
          </div>
          <div class="profile-site-level"><div class="profile-level-track"><div class="profile-level-fill" style="width:${lvlPct}%"></div></div><span class="profile-xp-next">${lvl.xpToNext} XP to next</span></div>
          <p class="profile-site-blurb">${esc(typeof sanitizeCardDescription === 'function' ? sanitizeCardDescription(c.cardDescription) : (c.cardDescription || c.vibe || ''))}</p>
          ${!isMine && typeof isCoderLoggedIn === 'function' && isCoderLoggedIn() && typeof GameHub !== 'undefined' ? (() => {
            const myId = getMyCoderCard()?.id;
            const rel = myId ? GameHub.getFriendRelation(myId, coderId) : 'none';
            if(rel === 'friends') return '<span class="profile-friend-status">Friends ✓</span>';
            if(rel === 'sent') return '<span class="profile-friend-status">Friend request sent…</span>';
            if(rel === 'received') return `<button type="button" class="btn primary profile-friend-req-btn" data-fr-accept-profile="${esc(coderId)}">Accept friend request</button>`;
            if(rel === 'none' && myId) return `<button type="button" class="btn profile-friend-req-btn" data-profile-friend="${esc(coderId)}">+ Send friend request</button>`;
            return '';
          })() : ''}
        </div>
      </div>
    </header>
    <div class="profile-site-body">
      <nav class="profile-side-rail" aria-label="Profile sections">${railHtml}</nav>
      <main class="profile-site-main">
        <section class="profile-site-panel is-active" data-ps-panel="updates">
          ${isMine && opts.showCompose ? '<div class="coder-compose-slot" id="coderComposeSlot"></div>' : ''}
          ${feedHtml}
        </section>
        <section class="profile-site-panel profile-site-panel--deck" data-ps-panel="photos">${renderCoderPhotoWall(coderId)}</section>
        <section class="profile-site-panel profile-site-panel--deck" data-ps-panel="friends">${colSection('friends')}</section>
        <section class="profile-site-panel profile-site-panel--deck" data-ps-panel="skills">${colSection('skills')}</section>
        <section class="profile-site-panel profile-site-panel--deck" data-ps-panel="media">${colSection('media')}</section>
        <section class="profile-site-panel profile-site-panel--deck" data-ps-panel="places">${colSection('places')}</section>
        <section class="profile-site-panel" data-ps-panel="quests">${questHtml}</section>
      </main>
    </div>
  </div>`;
}

function bindCoderProfileSite(host, coderId, opts = {}){
  if(!host) return;
  host.querySelectorAll('.profile-rail-banner').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = btn.closest('.profile-site');
      if(!site) return;
      site.querySelectorAll('.profile-rail-banner').forEach(b => b.classList.remove('is-active'));
      site.querySelectorAll('.profile-site-panel').forEach(p => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      site.querySelector(`[data-ps-panel="${btn.dataset.psSection}"]`)?.classList.add('is-active');
    });
  });
  if(typeof bindFlipPlayerCards === 'function') bindFlipPlayerCards(host);
  const skillDeck = host.querySelector('.profile-skill-deck');
  if(skillDeck && typeof bindSkillCards === 'function') bindSkillCards(skillDeck);
  host.querySelectorAll('.profile-drama-deck .drama-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.dramaId;
      const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
      const col = c?.collection;
      const m = (col?.media || []).find(x => x.id === id);
      if(m) openCoderMediaDetail(m);
    });
  });
  const photoWall = host.querySelector('.profile-photo-wall');
  if(photoWall && !photoWall._profilePhotoHandler){
    photoWall._profilePhotoHandler = e => {
      const fig = e.target.closest('.photo-flip');
      if(!fig || !photoWall.contains(fig)) return;
      const wasFlipped = fig.classList.contains('is-flipped');
      photoWall.querySelectorAll('.photo-flip.is-flipped').forEach(f => f.classList.remove('is-flipped'));
      if(!wasFlipped && fig.querySelector('.photo-flip-inner')) fig.classList.add('is-flipped');
    };
    photoWall.addEventListener('click', photoWall._profilePhotoHandler);
  }
  if(typeof GameHub !== 'undefined'){
    GameHub.bindProfileCollections(host, coderId);
  }
  bindPollVoteButtons(host);
  host.querySelectorAll('[data-profile-friend]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
      if(!mine?.id || typeof GameHub === 'undefined') return;
      GameHub.sendFriendRequest(mine.id, btn.dataset.profileFriend).then(ok => {
        if(ok){ btn.textContent = 'Request sent…'; btn.disabled = true; }
      });
    });
  });
  host.querySelectorAll('[data-fr-accept-profile]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
      const fromId = btn.dataset.frAcceptProfile;
      if(!mine?.id || typeof GameHub === 'undefined') return;
      const req = (state.friendRequests || []).find(r => r.status === 'pending' && r.fromId === fromId && r.toId === mine.id);
      if(req) GameHub.respondFriendRequest(req.id, true);
    });
  });
}

function renderCoderBoardPage(coderId){
  const host = document.getElementById('coderBoardSpread');
  if(!host) return;
  const c = getCoderByIdAny(coderId);
  if(!c){ host.innerHTML = '<p class="empty-hint">Player not found.</p>'; return; }
  const isMine = typeof getMyCoderCard === 'function' && getMyCoderCard()?.id === coderId;
  host.innerHTML = renderCoderProfileShell(c, { isMine, showCompose: isMine });
  if(isMine){
    const slot = host.querySelector('#coderComposeSlot');
    if(slot && typeof renderCoderComposeForm === 'function'){
      slot.innerHTML = renderCoderComposeForm();
      slot.querySelector('#playerStatusForm')?.addEventListener('submit', e => {
        e.preventDefault();
        if(typeof ViewerWorld !== 'undefined') ViewerWorld.submitPlayerStatus();
      });
      slot.querySelector('#statusTakePhoto')?.addEventListener('click', () => {
        if(typeof MediaCapture === 'undefined' || typeof ViewerWorld === 'undefined') return;
        MediaCapture.open({ mode: 'photo', onResult: r => { ViewerWorld.statusMedia = { photo: r.dataUrl, video: '' }; ViewerWorld.renderStatusMediaPreview(); }});
      });
      slot.querySelector('#statusTakeVideo')?.addEventListener('click', () => {
        if(typeof MediaCapture === 'undefined' || typeof ViewerWorld === 'undefined') return;
        MediaCapture.open({ mode: 'video', onResult: r => { ViewerWorld.statusMedia = { photo: '', video: r.dataUrl }; ViewerWorld.renderStatusMediaPreview(); }});
      });
    }
    host.querySelector('#editMyCardBtn')?.addEventListener('click', () => {
      if(typeof ViewerWorld !== 'undefined') ViewerWorld.openMyCardEditor(coderId);
    });
  }
  bindCoderProfileSite(host, coderId, { isMine });
}

function openCoderProfileModal(coderId){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId)
    || (typeof getCharacters === 'function' ? getCharacters() : []).find(x => x.id === coderId);
  if(!c) return;
  const posts = getCoderPosts(coderId);
  const quests = (state.quests || []).filter(q => q.fromCharacterId === coderId);
  const xpRows = (c.xpHistory || []).slice(0, 12).map(e =>
    `<li><time>${esc(new Date(e.at).toLocaleDateString())}</time> +${e.amount} · ${esc(e.label || e.reason)}</li>`
  ).join('');
  const postRows = posts.slice(0, 16).map(p =>
    `<article class="coder-profile-post"><time>${esc(new Date(p.time).toLocaleDateString())}</time><p>${esc(p.text?.slice(0, 200) || '')}</p>${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : ''}</article>`
  ).join('');
  document.getElementById('coderProfileBody').innerHTML = `
    <header class="coder-profile-head">
      <h3>${esc(c.name)}</h3>
      <p>Lv ${c.pokeCard?.level || 0} · ${c.points || 0} XP · ${c.questsSent || 0} quests sent · ${c.questsCompleted || 0} completed</p>
    </header>
    <section class="coder-profile-section">
      <button type="button" class="btn primary" data-coder-board-open="${esc(c.id)}">Open full update board →</button>
    </section>
    <section class="coder-profile-section">
      <h4>Update board (preview)</h4>
      <div class="coder-profile-posts">${postRows || '<p class="empty-hint">No community posts yet.</p>'}</div>
    </section>
    <section class="coder-profile-section">
      <h4>Recent XP</h4>
      <ul class="coder-profile-xp">${xpRows || '<li>No XP logged yet.</li>'}</ul>
    </section>
    <section class="coder-profile-section">
      <h4>Quests</h4>
      <ul>${quests.slice(0, 8).map(q => `<li>${esc(q.title)} · ${esc(q.status)}</li>`).join('') || '<li>No quests yet.</li>'}</ul>
    </section>`;
  const profileBack = document.getElementById('coderProfileBack');
  if(profileBack) profileBack.classList.remove('hidden');
  const closeBtn = document.getElementById('closeCoderProfile');
  if(closeBtn) closeBtn.onclick = () => profileBack?.classList.add('hidden');
  if(profileBack) profileBack.onclick = e => { if(e.target.id === 'coderProfileBack') profileBack.classList.add('hidden'); };
  document.querySelector('[data-coder-board-open]')?.addEventListener('click', () => {
    profileBack?.classList.add('hidden');
    navigateToCoderBoard(coderId);
  });
}

function renderCharacters(){
  const deck = document.getElementById('charDeck');
  if(!deck) return;
  const rankMap = getCoderXpRankMap();
  const chars = getRankedCoderCards();
  const onlineIds = typeof getOnlineCoderIds === 'function' ? getOnlineCoderIds() : new Set();
  const onlineCount = onlineIds.size;
  const header = document.getElementById('playerDeckMeta');
  if(header){
    header.innerHTML = `${onlineCount
      ? `<span class="player-online-count"><span class="player-online-pulse"></span>${onlineCount} player${onlineCount === 1 ? '' : 's'} online</span>`
      : ''}${isAdmin() && typeof GameHub !== 'undefined' ? GameHub.renderCardRepairTool() : ''}`;
    if(isAdmin() && typeof GameHub !== 'undefined') GameHub.bindCardRepair(header);
  }
  deck.innerHTML = chars.map((c, i) => {
    const card = buildFlipPlayerCard(c, 'character', i, {
      xpRank: rankMap.get(c.id),
      rankNeon: getCoderRankNeon(rankMap.get(c.id)),
      isOnline: onlineIds.has(c.id),
    });
    const quoteLog = isAdmin() && isCoderDeckCard(c) ? renderCoderQuoteLog(c) : '';
    const profileBtn = isCoderDeckCard(c)
      ? `<button type="button" class="btn coder-profile-btn" data-coder-board="${esc(c.id)}">View profile</button>`
      : '';
    const myId = typeof getMyCoderCard === 'function' ? getMyCoderCard()?.id : null;
    const canFriend = typeof isCoderLoggedIn === 'function' && isCoderLoggedIn() && myId && myId !== c.id && isCoderDeckCard(c);
    let friendBtn = '';
    if(canFriend && typeof GameHub !== 'undefined'){
      const rel = GameHub.getFriendRelation(myId, c.id);
      if(rel === 'friends') friendBtn = `<button type="button" class="btn coder-friend-btn" disabled>Friends ✓</button>`;
      else if(rel === 'sent') friendBtn = `<button type="button" class="btn coder-friend-btn" disabled>Requested…</button>`;
      else if(rel === 'received') friendBtn = `<button type="button" class="btn coder-friend-btn" data-fr-accept-deck="${esc(c.id)}">Accept friend</button>`;
      else friendBtn = `<button type="button" class="btn coder-friend-btn" data-coder-friend="${esc(c.id)}">+ Friend</button>`;
    }
    return `<div class="char-deck-item">${card}${profileBtn}${friendBtn}${quoteLog}</div>`;
  }).join('');
  bindFlipPlayerCards(deck);
  bindCoderQuoteLogs(deck);
  deck.querySelectorAll('[data-coder-board]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); navigateToCoderBoard(btn.dataset.coderBoard); });
  });
  deck.querySelectorAll('[data-coder-friend]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const fid = btn.dataset.coderFriend;
      const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
      if(!mine?.id || !fid || typeof GameHub === 'undefined') return;
      GameHub.sendFriendRequest(mine.id, fid).then(ok => {
        if(ok){ btn.textContent = 'Requested…'; btn.disabled = true; }
      });
    });
  });
  deck.querySelectorAll('[data-fr-accept-deck]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const fromId = btn.dataset.frAcceptDeck;
      const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
      if(!mine?.id || !fromId || typeof GameHub === 'undefined') return;
      const req = (state.friendRequests || []).find(r => r.status === 'pending' && r.fromId === fromId && r.toId === mine.id);
      if(req) GameHub.respondFriendRequest(req.id, true);
    });
  });
  deck.querySelectorAll('[data-coder-profile]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openCoderProfileModal(btn.dataset.coderProfile); });
  });
}

function findCoderCardByName(name){
  const n = (name || '').trim().toLowerCase();
  if(!n) return null;
  return (typeof getCharacters === 'function' ? getCharacters() : []).find(c => (c.name || '').trim().toLowerCase() === n)
    || (state.viewerCharacters || []).find(c => (c.name || '').trim().toLowerCase() === n)
    || null;
}

function addCoderQuoteByName(name, text, context){
  if(!name || !text?.trim() || !isAdmin()) return;
  const card = findCoderCardByName(name);
  if(!card?.id) return;
  let c = typeof ensureCoderXpRecord === 'function' ? ensureCoderXpRecord(card.id) : null;
  if(!c) c = (state.viewerCharacters || []).find(x => x.id === card.id);
  if(!c) return;
  if(!c.saidQuotes) c.saidQuotes = [];
  c.saidQuotes.unshift({
    id: uid('sq'),
    text: text.trim(),
    context: (context || '').trim(),
    at: new Date().toISOString(),
  });
  c.saidQuotes = c.saidQuotes.slice(0, 40);
  saveState();
  if(typeof postVisitorData === 'function') postVisitorData('updateCharacter', c);
}

function renderCoderQuoteLog(c){
  const quotes = (c.saidQuotes || []).slice(0, 3);
  const latest = quotes[0];
  const mini = latest
    ? `<blockquote class="coder-quote-mini"><p>${esc(latest.text)}</p></blockquote>`
    : '';
  const more = quotes.length > 1 ? `<span class="coder-quote-more">+${quotes.length - 1} more</span>` : '';
  return `<div class="coder-quote-compact" data-coder-id="${esc(c.id)}">
    ${mini}${more}
    <button type="button" class="btn coder-quote-toggle" data-quote-toggle="${esc(c.id)}">+ Add quote</button>
    <div class="coder-quote-panel hidden" data-quote-panel="${esc(c.id)}">
      <div class="coder-quote-list">${quotes.map(q => `<blockquote class="coder-quote-item"><p>${esc(q.text)}</p>${q.context ? `<cite>${esc(q.context)}</cite>` : ''}</blockquote>`).join('') || '<p class="empty-hint">No quotes yet.</p>'}</div>
      <form class="coder-quote-add-form">
        <textarea class="coder-quote-input" rows="2" placeholder="Funny thing they said…"></textarea>
        <button type="submit" class="btn">Save quote</button>
      </form>
    </div>
  </div>`;
}

function bindCoderQuoteLogs(container){
  if(!container || !isAdmin()) return;
  container.querySelectorAll('[data-quote-toggle]').forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const panel = container.querySelector(`[data-quote-panel="${btn.dataset.quoteToggle}"]`);
      panel?.classList.toggle('hidden');
      btn.textContent = panel?.classList.contains('hidden') ? '+ Add quote' : '− Hide quotes';
    });
  });
  container.querySelectorAll('.coder-quote-add-form').forEach(form => {
    if(form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', e => {
      e.preventDefault();
      const wrap = form.closest('.coder-quote-compact');
      const coderId = wrap?.dataset.coderId;
      const text = form.querySelector('.coder-quote-input')?.value?.trim();
      if(!coderId || !text) return;
      const card = (typeof getCharacters === 'function' ? getCharacters() : []).find(x => x.id === coderId);
      if(card?.name) addCoderQuoteByName(card.name, text, '');
      renderCharacters();
    });
  });
}

function getStreamQuotes(limit = 10){
  const all = [];
  Object.entries(state.entries || {}).forEach(([day, raw]) => {
    const nodes = raw?.stream?.nodes;
    if(!Array.isArray(nodes)) return;
    nodes.filter(n => n.type === 'quote').forEach(n => all.push({ ...n, day }));
  });
  return all.sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, limit);
}

function renderLiveQuoteBoard(admin){
  const quotes = getStreamQuotes(12);
  const addBtns = admin
    ? `<div class="live-quote-actions">
        <button type="button" class="btn" id="homeOpenQuotePulse">+ Quote</button>
        <button type="button" class="btn" id="homeOpenQuestPulse">+ Quest</button>
      </div>`
    : '';
  const rows = quotes.length
    ? quotes.map(q => {
      const who = q.data?.who || '';
      const text = q.data?.text || q.body || q.text || '';
      return `<blockquote class="live-quote-item"><span class="live-quote-who">${esc(who)}</span><p>${esc(text)}</p>${q.data?.context ? `<cite>${esc(q.data.context)}</cite>` : ''}</blockquote>`;
    }).join('')
    : `<p class="empty-hint">${admin ? 'Log quotes from the pulse board — funny lines attributed to coders.' : 'No quotes on the wire yet.'}</p>`;
  return `<section class="live-quote-board sketch-card${admin ? ' live-quote-board--edit' : ''}">
    <div class="live-quote-head">
      <h3 class="live-pulse-title">Quote log</h3>
      ${addBtns}
    </div>
    <div class="live-quote-list">${rows}</div>
  </section>`;
}

/* ---------- Skills ---------- */
function renderTierLegend(){
  const el = document.getElementById('tierLegend');
  if(!el) return;
  el.innerHTML = SKILL_TIERS.map(t =>
    `<span class="tier-chip" title="${t.hours}+ hrs">L${t.level} ${t.name}</span>`).join('');
}

function skillSlug(name, excludeId){
  const base = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid('skill');
  const skills = getSkills();
  let id = base;
  let n = 1;
  while(skills.some(s => s.id === id && s.id !== excludeId)) id = `${base}-${++n}`;
  return id;
}

function parseHobbyNamesInput(raw, fallbackName){
  const names = (raw || '').split(',').map(s => s.trim()).filter(Boolean);
  if(!names.length && fallbackName) return [fallbackName];
  return [...new Set(names)];
}

function openSkillEditor(skillId){
  if(!isAdmin()) return;
  ensureContentState();
  const isNew = !skillId;
  const skill = isNew ? null : getSkillById(skillId);
  if(!isNew && !skill) return;

  const isMandarin = skill?.id === 'mandarin';
  document.getElementById('skillEditTitle').textContent = isNew ? 'Add tower' : `Edit ${skill.name}`;
  document.getElementById('skillEditId').value = skill?.id || '';
  document.getElementById('skillEditName').value = skill?.name || '';
  document.getElementById('skillEditColor').value = skill?.color || '#7c4dff';

  const hobbiesField = document.getElementById('skillEditHobbies');
  const hobbiesWrap = hobbiesField.closest('.field');
  if(isMandarin){
    hobbiesWrap.classList.add('hidden');
    hobbiesField.value = '';
  } else {
    hobbiesWrap.classList.remove('hidden');
    const names = skill ? getHobbyNamesForSkill(skill) : [];
    const defaultName = skill?.name || '';
    hobbiesField.value = names.length === 1 && names[0] === defaultName ? '' : names.join(', ');
  }

  document.getElementById('deleteSkillBtn').classList.toggle('hidden', isNew || isMandarin);
  document.getElementById('skillEditBack').classList.remove('hidden');
}

function closeSkillEditor(){
  document.getElementById('skillEditBack').classList.add('hidden');
}

function saveSkillEditor(){
  if(!isAdmin()) return;
  ensureContentState();
  const existingId = document.getElementById('skillEditId').value.trim();
  const name = document.getElementById('skillEditName').value.trim();
  if(!name){
    alert('Tower name is required.');
    return;
  }

  const color = document.getElementById('skillEditColor').value || '#7c4dff';
  const isMandarin = existingId === 'mandarin';
  const hobbyNames = isMandarin ? [] : parseHobbyNamesInput(document.getElementById('skillEditHobbies').value, name);

  if(existingId){
    const skill = state.content.skills.find(s => s.id === existingId);
    if(!skill) return;
    skill.name = name;
    skill.color = color;
    if(!isMandarin) skill.hobbyNames = hobbyNames;
    delete skill.hobbyLabel;
  } else {
    state.content.skills.push({
      id: skillSlug(name),
      name,
      hours: 0,
      color,
      milestones: [],
      hobbyNames,
    });
    saveState();
    LiveSync?.skillUnlocked(name);
    closeSkillEditor();
    renderSkillSkyline();
    renderAbout();
    renderHomeCheckIn();
    return;
  }

  saveState();
  closeSkillEditor();
  renderSkillSkyline();
  renderAbout();
  renderHomeCheckIn();
  if(typeof renderSkillCardDeck === 'function') renderSkillCardDeck();
}

function deleteSkillEditor(){
  if(!isAdmin()) return;
  const skillId = document.getElementById('skillEditId').value.trim();
  if(!skillId || skillId === 'mandarin') return;
  const skill = getSkillById(skillId);
  if(!skill) return;
  if(!confirm(`Delete "${skill.name}" and remove its tower? Log entries keep their hobby text but hours won't count toward this tower.`)) return;

  ensureContentState();
  state.content.skills = state.content.skills.filter(s => s.id !== skillId);
  delete state.skillHours[skillId];
  saveState();
  closeSkillEditor();
  document.getElementById('skillJourneyBack')?.classList.add('hidden');
  renderSkillSkyline();
  renderAbout();
  renderHomeCheckIn();
  if(typeof renderSkillCardDeck === 'function') renderSkillCardDeck();
}

function renderSkillControls(){
  const skillCtrl = document.getElementById('skillControls');
  if(!skillCtrl) return;
  const skills = getSkills();
  if(!skills.length){
    skillCtrl.innerHTML = '<p class="gallery-hint">No towers yet — add one below.</p>';
    return;
  }
  skillCtrl.innerHTML = skills.map(skill => {
    const hrs = getTotalSkillHours(skill.id);
    const tier = getSkillTier(hrs);
    const hobbies = getHobbyNamesForSkill(skill);
    const hobbyHint = skill.id === 'mandarin'
      ? 'Daily log: Mandarin hours field'
      : hobbies.length
        ? `Hobbies: ${hobbies.map(h => esc(h)).join(', ')}`
        : 'No daily-log hobbies';
    return `<div class="skill-control-row">
      <div class="skill-control-meta">
        <strong>${esc(skill.name)}</strong> — L${tier.level} (${Math.round(hrs)}h)
        <div class="field-hint">${hobbyHint}</div>
      </div>
      <div class="skill-control-hours">
        <button type="button" class="btn" data-skill="${esc(skill.id)}" data-delta="-1">−1h</button>
        <button type="button" class="btn primary" data-skill="${esc(skill.id)}" data-delta="1">+1h</button>
      </div>
      <div class="skill-control-actions">
        <button type="button" class="btn" data-edit-skill="${esc(skill.id)}">Edit</button>
        ${skill.id !== 'mandarin' ? `<button type="button" class="btn admin-delete" data-del-skill="${esc(skill.id)}">Delete</button>` : ''}
      </div>
    </div>`;
  }).join('');

  skillCtrl.querySelectorAll('button[data-skill]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(!isAdmin()) return;
      const skill = getSkills().find(s => s.id === btn.dataset.skill);
      const delta = Number(btn.dataset.delta);
      const prevHrs = getTotalSkillHours(btn.dataset.skill);
      const prevTier = getSkillTier(prevHrs);
      state.skillHours[btn.dataset.skill] = Math.max(0, (state.skillHours[btn.dataset.skill] || 0) + delta);
      const newHrs = getTotalSkillHours(btn.dataset.skill);
      const newTier = getSkillTier(newHrs);
      saveState();
      if(skill){
        LiveSync?.skillUpdated(skill.name, delta);
        if(newTier.level > prevTier.level) LiveSync?.skillTierUp(skill.name, newTier.name, newTier.level);
      }
      renderSkillSkyline();
      renderAbout();
      renderHomeCheckIn();
    });
  });
  skillCtrl.querySelectorAll('[data-edit-skill]').forEach(btn => {
    btn.addEventListener('click', () => openSkillEditor(btn.dataset.editSkill));
  });
  skillCtrl.querySelectorAll('[data-del-skill]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('skillEditId').value = btn.dataset.delSkill;
      deleteSkillEditor();
    });
  });
}

function renderSkillSkyline(){
  const container = document.getElementById('skillSkyline');
  if(!container) return;
  const recHost = document.getElementById('skillRecommendations');
  if(recHost && typeof renderCategoryRecommendationsHtml === 'function'){
    recHost.innerHTML = renderCategoryRecommendationsHtml('skill', 'skills & hobbies');
  }
  const maxH = 280;
  const skills = getSkills();
  container.innerHTML = skills.map(skill => {
    const tier = getSkillTier(getTotalSkillHours(skill.id));
    const h = Math.max(36, ((tier.level-1)/9 + tier.progress/9) * maxH);
    let lights = '';
    for(let i = 0; i < Math.floor(tier.level*1.5); i++){
      lights += `<span class="skill-light" style="left:${10+Math.random()*75}%;bottom:${15+Math.random()*(h-25)}px;color:${skill.color};--flicker:${(1.2+Math.random()*2).toFixed(1)}s"></span>`;
    }
    return `<div class="skill-tower" style="--tower-color:${skill.color}" data-skill-id="${esc(skill.id)}" role="button" tabindex="0">
      <div class="skill-tower-bar" style="height:${h}px"><div class="skill-neon-top"></div><div class="skill-tier-badge">L${tier.level}</div>${lights}</div>
      <div class="skill-level">${tier.name}</div><div class="skill-label">${esc(skill.name)}</div>
      <div class="skill-hours">${Math.round(tier.hours)}h${tier.next?` · ${Math.ceil(tier.next.hours-tier.hours)}h to ${tier.next.name}`:''}</div></div>`;
  }).join('');

  container.querySelectorAll('.skill-tower').forEach(tower => {
    tower.addEventListener('click', () => openSkillJourney(tower.dataset.skillId));
    tower.addEventListener('keydown', e => { if(e.key === 'Enter') openSkillJourney(tower.dataset.skillId); });
  });

  renderSkillControls();
}

function getSkillById(id){
  return getSkills().find(s => s.id === id);
}

function updateSkillMilestones(skillId, milestones){
  ensureContentState();
  const skill = state.content.skills.find(s => s.id === skillId);
  if(skill) skill.milestones = milestones;
  saveState();
}

function openSkillJourney(skillId){
  const skill = getSkillById(skillId);
  if(!skill) return;
  const hrs = getTotalSkillHours(skillId);
  const tier = getSkillTier(hrs);
  const milestones = (skill.milestones || []).slice().sort((a,b) => (a.date||'').localeCompare(b.date||''));
  const maxFloor = Math.max(milestones.length, 1);

  let floorsHtml = milestones.map((ms, i) => {
    const lit = i < milestones.length;
    const floorH = 48 + (i / maxFloor) * 40;
    return `<button type="button" class="sjs-floor ${lit?'lit':''}" data-ms-idx="${i}" style="--floor-h:${floorH}px;--delay:${i*0.08}s">
      <div class="sjs-windows"></div>
      <div class="sjs-floor-meta">
        <span class="sjs-floor-date">${esc(ms.date || '')}</span>
        <span class="sjs-floor-title">${esc(ms.title || 'Milestone')}</span>
        <span class="sjs-floor-hrs">${ms.hours != null ? ms.hours + 'h' : ''}</span>
      </div>
    </button>`;
  }).join('');

  if(!milestones.length){
    floorsHtml = `<div class="sjs-empty-floor"><span>No milestones yet — the skyscraper is dark.</span></div>`;
  }

  document.getElementById('skillJourneyContent').innerHTML = `
    <h2 class="sjs-title">${esc(skill.name)} <span style="color:${skill.color}">· ${tier.name}</span></h2>
    <p class="sjs-sub">${Math.round(hrs)} hours · Level ${tier.level}${milestones.length ? ` · ${milestones.length} milestones` : ''}</p>
    <div class="skill-journey-layout">
      <div class="sjs-building" style="--skill-color:${skill.color}">
        <div class="sjs-antenna"></div>
        <div class="sjs-floors">${floorsHtml}</div>
        <div class="sjs-ground-line"></div>
      </div>
      <div class="sjs-detail" id="sjsDetail">
        <p class="sjs-detail-placeholder">${milestones.length ? 'Click a lit floor to read the story.' : 'Add milestones in editing mode.'}</p>
      </div>
    </div>
    ${isAdmin() ? `<div class="sjs-admin sketch-card">
      <h4>Add milestone</h4>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="msDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Hours at this point</label><input type="number" id="msHours" min="0" value="${Math.round(hrs)}"></div>
      </div>
      <div class="field"><label>Title</label><input type="text" id="msTitle" placeholder="What happened"></div>
      <div class="field"><label>Note</label><textarea id="msNote" rows="3" placeholder="The story of this step…"></textarea></div>
      <button type="button" class="btn primary" id="addMilestoneBtn">Add to journey</button>
    </div>` : ''}`;

  document.getElementById('skillJourneyBack').classList.remove('hidden');

  const detailEl = document.getElementById('sjsDetail');
  document.querySelectorAll('.sjs-floor').forEach(btn => {
    btn.addEventListener('click', () => {
      const ms = milestones[Number(btn.dataset.msIdx)];
      if(!ms) return;
      detailEl.innerHTML = `
        <div class="sjs-detail-card">
          <div class="sjs-detail-date">${esc(ms.date)} · ${ms.hours != null ? ms.hours + ' hours' : ''}</div>
          <h3>${esc(ms.title)}</h3>
          <p>${esc(ms.note || '')}</p>
          ${isAdmin() ? `<button type="button" class="btn admin-delete" data-del-ms="${esc(ms.id)}">Remove</button>` : ''}
        </div>`;
      detailEl.querySelector('[data-del-ms]')?.addEventListener('click', () => {
        const next = milestones.filter(m => m.id !== ms.id);
        updateSkillMilestones(skillId, next);
        openSkillJourney(skillId);
        renderSkillSkyline();
      });
    });
  });

  document.getElementById('addMilestoneBtn')?.addEventListener('click', () => {
    const title = document.getElementById('msTitle').value.trim();
    if(!title) return;
    const ms = {
      id: uid('ms'),
      date: document.getElementById('msDate').value,
      title,
      note: document.getElementById('msNote').value.trim(),
      hours: Number(document.getElementById('msHours').value) || 0,
    };
    updateSkillMilestones(skillId, [...milestones, ms]);
    const skill = getSkillById(skillId);
    if(skill) LiveSync?.skillMilestone(skill.name, title);
    openSkillJourney(skillId);
    renderSkillSkyline();
  });
}

document.getElementById('closeSkillJourney')?.addEventListener('click', () => document.getElementById('skillJourneyBack').classList.add('hidden'));
document.getElementById('skillJourneyBack')?.addEventListener('click', e => { if(e.target.id==='skillJourneyBack') document.getElementById('skillJourneyBack').classList.add('hidden'); });

document.getElementById('addSkillBtn')?.addEventListener('click', () => openSkillEditor(null));
document.getElementById('addSkillCardBtn')?.addEventListener('click', () => openSkillEditor(null));
document.getElementById('closeSkillEdit')?.addEventListener('click', closeSkillEditor);
document.getElementById('cancelSkillEdit')?.addEventListener('click', closeSkillEditor);
document.getElementById('saveSkillEdit')?.addEventListener('click', saveSkillEditor);
document.getElementById('deleteSkillBtn')?.addEventListener('click', deleteSkillEditor);
document.getElementById('skillEditBack')?.addEventListener('click', e => { if(e.target.id === 'skillEditBack') closeSkillEditor(); });

/* ---------- Media log (TV, film, books, albums, songs) ---------- */
const MEDIA_SECTION_ORDER = ['tv', 'film', 'book', 'album', 'song'];

function renderMediaRankings(){
  const host = document.getElementById('mediaRankings');
  if(!host) return;
  const ranked = allDramas()
    .map(d => ({ d, avg: Number(computeShowRating(d)), hasReview: !!d.finalReview?.trim() }))
    .filter(x => x.avg || x.hasReview)
    .sort((a, b) => (b.avg || 0) - (a.avg || 0));
  if(!ranked.length){
    host.innerHTML = '<p class="empty-hint">Final reviews and ratings will rank here as you log media.</p>';
    return;
  }
  host.innerHTML = `<section class="media-rankings-board sketch-card">
    <h3 class="media-rankings-title">All-time rankings</h3>
    <p class="gallery-hint">Sorted by neon-dot average · tap a row to open</p>
    <ol class="media-rankings-list">${ranked.map((row, i) => {
      const mt = getMediaType(row.d.mediaType);
      const dots = row.avg ? neonDots(row.avg, 5, stableNeon(row.d.id, 1)) : '';
      const country = row.d.mediaType === 'tv' && row.d.country ? ` · ${esc(row.d.country)}` : '';
      return `<li class="media-rank-row" data-drama-id="${esc(row.d.id)}">
        <span class="media-rank-num">#${i + 1}</span>
        <div class="media-rank-body">
          <strong>${esc(row.d.title)}</strong>
          <span class="media-rank-meta">${esc(mt.label)}${country}${row.avg ? ` · ${row.avg}/5` : ''} ${dots}</span>
          ${row.d.finalReview ? `<p class="media-rank-review">${esc(row.d.finalReview.slice(0, 140))}${row.d.finalReview.length > 140 ? '…' : ''}</p>` : ''}
        </div>
      </li>`;
    }).join('')}</ol>
  </section>`;
  host.querySelectorAll('[data-drama-id]').forEach(row => {
    row.addEventListener('click', () => openDramaDetail(row.dataset.dramaId));
  });
}

function renderDramaDeck(){
  const deck = document.getElementById('dramaDeck');
  if(!deck) return;
  const dramas = allDramas();
  renderMediaRankings();
  if(!dramas.length){ deck.innerHTML = '<p class="empty-hint">Empty shelf.</p>'; return; }

  deck.innerHTML = renderDramaDeckSections(dramas);

  deck.querySelectorAll('.drama-card').forEach(card => {
    card.addEventListener('click', () => openDramaDetail(card.dataset.dramaId));
  });
}

function openDramaDetail(id){
  const d = getDrama(id);
  if(!d) return;
  const mt = getMediaType(d.mediaType);
  const attrs = getMediaAttributes(d.mediaType);
  const ratingDots = computeShowRatingDots(d, stableNeon(d.id, 1));
  const reviewedCount = Object.keys(d.episodes||{}).length;
  const unitLabel = mt.unit;

  let epGrid = '';
  for(let i = 1; i <= d.totalEpisodes; i++){
    const ep = d.episodes?.[String(i)] || d.episodes?.[i];
    const hasReview = ep && ep.ratings;
    let dots = '';
    if(hasReview){
      const vals = attrs.map(a => ep.ratings[a.id]).filter(Boolean);
      if(vals.length){
        const avg = vals.reduce((s,v)=>s+Number(v),0)/vals.length;
        dots = neonDots(avg, 5, stableNeon(id, 2));
      }
    }
    epGrid += `<button class="ep-chip ${hasReview?'ep-reviewed':''} ${i<=d.currentEpisode?'ep-watched':''}" data-ep="${i}">
      ${i}${dots ? `<span class="ep-dots">${dots}</span>` : ''}</button>`;
  }

  document.getElementById('dramaDetailContent').innerHTML = `
    <h2 class="drama-detail-title">${esc(d.title)}</h2>
    <div class="drama-detail-meta">${esc(mt.label)} · ${esc(d.genre||'')}${d.mediaType === 'tv' && d.country ? ` · ${esc(d.country)}` : ''} · ${d.status} · ${unitLabel} ${d.currentEpisode}/${d.totalEpisodes}
      ${ratingDots ? ` · ${ratingDots} (${reviewedCount} rated)` : ''}</div>
    ${isAdmin()?`<div class="drama-admin-row">
      <button class="btn" id="dramaEpDown">− progress</button>
      <button class="btn primary" id="dramaEpUp">+ progress</button>
      <button class="btn" id="dramaEditMeta">Edit</button>
      <button class="btn admin-delete" id="dramaDeleteShow">Delete</button>
    </div>`:''}
    <h4 class="ep-grid-label">${unitLabel}s — click to ${isAdmin()?'rate':'view'}</h4>
    <div class="ep-grid">${epGrid}</div>
    <div class="drama-final-review">
      <h4>Final review</h4>
      ${d.finalReview ? `<p>${esc(d.finalReview)}</p>` : '<p class="empty-hint">Not written yet.</p>'}
      ${isAdmin()?`<textarea id="dramaFinalReview" rows="4" placeholder="Overall verdict once done...">${esc(d.finalReview)}</textarea>
        <button class="btn primary" id="saveFinalReview" style="margin-top:8px">Save final review</button>`:''}
    </div>`;

  document.getElementById('dramaDetailBack').classList.remove('hidden');

  document.getElementById('dramaDetailContent').querySelectorAll('.ep-chip').forEach(chip => {
    chip.addEventListener('click', () => openEpisodeModal(id, Number(chip.dataset.ep)));
  });

  document.getElementById('dramaEpUp')?.addEventListener('click', () => {
    ensureDramaState(id);
    const cur = getDrama(id).currentEpisode;
    state.dramaState[id].currentEpisode = Math.min(d.totalEpisodes, cur + 1);
    if(state.dramaState[id].currentEpisode >= d.totalEpisodes) state.dramaState[id].status = 'completed';
    saveState();
    LiveSync?.dramaUpdated(d.title, state.dramaState[id].currentEpisode);
    openDramaDetail(id); renderDramaDeck(); renderHomeCheckIn();
  });
  document.getElementById('dramaEpDown')?.addEventListener('click', () => {
    ensureDramaState(id);
    state.dramaState[id].currentEpisode = Math.max(0, getDrama(id).currentEpisode - 1);
    saveState(); openDramaDetail(id); renderDramaDeck();
  });
  document.getElementById('dramaEditMeta')?.addEventListener('click', () => { document.getElementById('dramaDetailBack').classList.add('hidden'); openDramaModal(id); });
  document.getElementById('dramaDeleteShow')?.addEventListener('click', () => {
    document.getElementById('dramaDetailBack').classList.add('hidden');
    deleteContentItem('drama', id);
  });
  document.getElementById('saveFinalReview')?.addEventListener('click', () => {
    ensureDramaState(id);
    state.dramaState[id].finalReview = document.getElementById('dramaFinalReview').value;
    saveState();
    awardGrayPoints(GRAY_XP_AWARDS.final_review.xp, 'final_review');
    openDramaDetail(id);
    renderDramaDeck();
  });
}

document.getElementById('closeDramaDetail')?.addEventListener('click', () => document.getElementById('dramaDetailBack').classList.add('hidden'));
document.getElementById('dramaDetailBack')?.addEventListener('click', e => { if(e.target.id==='dramaDetailBack') document.getElementById('dramaDetailBack').classList.add('hidden'); });

function openEpisodeModal(dramaId, epNum){
  const d = getDrama(dramaId);
  const ep = d.episodes?.[String(epNum)] || {};
  const mt = getMediaType(d.mediaType);
  const attrs = getMediaAttributes(d.mediaType);
  const dotColor = stableNeon(dramaId, 2);

  document.getElementById('epDate').parentElement.classList.remove('hidden');
  document.getElementById('epReview').parentElement.classList.remove('hidden');
  document.querySelector('#episodeModalBack .modal-actions')?.classList.remove('hidden');

  if(!isAdmin()) {
    if(!ep.ratings) return;
    showEpisodeReadOnly(d, epNum, ep);
    return;
  }

  document.getElementById('episodeModalTitle').textContent = `${d.title} — ${mt.unit} ${epNum}`;
  document.getElementById('epDramaId').value = dramaId;
  document.getElementById('epNum').value = epNum;
  document.getElementById('epDate').value = ep.watchedDate || new Date().toISOString().slice(0,10);
  document.getElementById('epReview').value = ep.review || '';

  document.getElementById('epAttrGrid').innerHTML = attrs.map(a => {
    const val = ep.ratings?.[a.id] || 3;
    return `<div class="ep-attr">
      <label>${esc(a.label)} <span class="attr-hint">${esc(a.short)}</span></label>
      <div class="attr-slider">
        <input type="range" min="1" max="5" value="${val}" data-attr="${a.id}">
        <span class="attr-dots" data-dots-for="${a.id}">${neonDots(val, 5, dotColor)}</span>
      </div>
    </div>`;
  }).join('');

  document.getElementById('epAttrGrid').querySelectorAll('input[type=range]').forEach(sl => {
    sl.addEventListener('input', () => {
      const dots = sl.parentElement.querySelector('.attr-dots');
      if(dots) dots.innerHTML = neonDots(sl.value, 5, dotColor);
    });
  });

  document.getElementById('episodeModalBack').classList.remove('hidden');
}

function showEpisodeReadOnly(d, epNum, ep){
  const mt = getMediaType(d.mediaType);
  const attrs = getMediaAttributes(d.mediaType);
  const dotColor = stableNeon(d.id, 2);
  const vals = attrs.map(a => ep.ratings?.[a.id]).filter(Boolean);
  const overall = vals.length ? (vals.reduce((s,v)=>s+Number(v),0)/vals.length) : 0;

  document.getElementById('episodeModalTitle').textContent = `${d.title} — ${mt.unit} ${epNum}`;
  document.getElementById('epDramaId').value = '';
  document.getElementById('epDate').parentElement.classList.add('hidden');
  document.getElementById('epReview').parentElement.classList.add('hidden');
  document.querySelector('#episodeModalBack .modal-actions')?.classList.add('hidden');

  document.getElementById('epAttrGrid').innerHTML = `
    <div class="ep-ro-overall">Overall ${overall ? neonDots(overall, 5, dotColor) : '—'}</div>
    ${attrs.map(a => {
      const v = ep.ratings?.[a.id];
      return v ? `<div class="ep-ro-attr"><span>${esc(a.label)}</span>${neonDots(v, 5, dotColor)}</div>` : '';
    }).join('')}
    ${ep.watchedDate ? `<div class="manga-date">Logged ${esc(ep.watchedDate)}</div>` : ''}
    ${ep.review ? `<p class="ep-ro-review">${esc(ep.review)}</p>` : ''}`;

  document.getElementById('episodeModalBack').classList.remove('hidden');
}

document.getElementById('closeEpisodeModal')?.addEventListener('click', closeEpisodeModal);
document.getElementById('cancelEpisode')?.addEventListener('click', closeEpisodeModal);
function closeEpisodeModal(){
  document.getElementById('episodeModalBack').classList.add('hidden');
  document.getElementById('epDate').parentElement.classList.remove('hidden');
  document.getElementById('epReview').parentElement.classList.remove('hidden');
  document.querySelector('#episodeModalBack .modal-actions')?.classList.remove('hidden');
}

document.getElementById('saveEpisode')?.addEventListener('click', () => {
  const dramaId = document.getElementById('epDramaId').value;
  const epNum = document.getElementById('epNum').value;
  ensureDramaState(dramaId);

  const ratings = {};
  document.getElementById('epAttrGrid').querySelectorAll('input[data-attr]').forEach(sl => {
    ratings[sl.dataset.attr] = Number(sl.value);
  });

  state.dramaState[dramaId].episodes[epNum] = {
    watchedDate: document.getElementById('epDate').value,
    ratings,
    review: document.getElementById('epReview').value,
  };

  const cur = getDrama(dramaId).currentEpisode;
  if(Number(epNum) > cur) state.dramaState[dramaId].currentEpisode = Number(epNum);

  saveState();
  awardGrayPoints(GRAY_XP_AWARDS.media_review.xp, 'media_review');
  closeEpisodeModal();
  if(!document.getElementById('dramaDetailBack').classList.contains('hidden')){
    openDramaDetail(dramaId);
  }
  renderDramaDeck();
  renderHomeCheckIn();
});

function openDramaModal(id){
  const d = id ? getDrama(id) : null;
  pendingDramaImage = null;
  document.getElementById('dramaModalTitle').textContent = d ? 'Edit media' : 'Add media';
  document.getElementById('dramaEditId').value = id || '';
  document.getElementById('dramaTitle').value = d?.title || '';
  document.getElementById('dramaMediaType').value = d?.mediaType || 'tv';
  document.getElementById('dramaGenre').value = d?.genre || '';
  document.getElementById('dramaCountry').value = d?.country || '';
  document.getElementById('dramaCountryField')?.classList.toggle('hidden', (d?.mediaType || 'tv') !== 'tv');
  document.getElementById('dramaTotal').value = d?.totalEpisodes || getMediaType(d?.mediaType || 'tv').defaultUnits;
  document.getElementById('dramaStatus').value = d?.status || 'watching';
  const posterHost = document.getElementById('dramaImageBlock');
  if(posterHost){
    posterHost.innerHTML = ImageTools.blockHtml({
      prefix: 'ce_drama',
      label: 'Cover / poster',
      currentUrl: d?.image || '',
      descValue: d?.imagePrompt || d?.genre || '',
      descPlaceholder: 'Neon noir thriller poster, rain, city lights…',
      hiddenId: 'dramaImage',
    });
    ImageTools.wire({
      prefix: 'ce_drama',
      kind: 'poster',
      hiddenId: 'dramaImage',
      onChange: url => { pendingDramaImage = url; },
    });
  } else {
    document.getElementById('dramaImage').value = d?.image || '';
  }
  updateMediaUnitsLabel();
  document.getElementById('dramaCountryField')?.classList.toggle('hidden', (document.getElementById('dramaMediaType')?.value || 'tv') !== 'tv');
  document.getElementById('dramaModalBack').classList.remove('hidden');
}

function updateMediaUnitsLabel(){
  const type = document.getElementById('dramaMediaType')?.value || 'tv';
  const mt = getMediaType(type);
  const lbl = document.getElementById('dramaTotalLabel');
  if(lbl) lbl.textContent = mt.unitsLabel;
}

document.getElementById('dramaMediaType')?.addEventListener('change', () => {
  const type = document.getElementById('dramaMediaType').value;
  const mt = getMediaType(type);
  const total = document.getElementById('dramaTotal');
  if(total && !document.getElementById('dramaEditId').value) total.value = mt.defaultUnits;
  document.getElementById('dramaCountryField')?.classList.toggle('hidden', type !== 'tv');
  updateMediaUnitsLabel();
});

document.getElementById('addDramaBtn')?.addEventListener('click', () => openDramaModal(null));
document.getElementById('cancelDrama')?.addEventListener('click', () => document.getElementById('dramaModalBack').classList.add('hidden'));
document.getElementById('saveDrama')?.addEventListener('click', () => {
  const title = document.getElementById('dramaTitle').value.trim();
  if(!title) return;
  const editId = document.getElementById('dramaEditId').value;
  const payload = {
    title,
    mediaType: document.getElementById('dramaMediaType').value || 'tv',
    genre: document.getElementById('dramaGenre').value.trim(),
    country: document.getElementById('dramaCountry')?.value?.trim() || '',
    totalEpisodes: Number(document.getElementById('dramaTotal').value) || getMediaType(document.getElementById('dramaMediaType').value).defaultUnits,
    status: document.getElementById('dramaStatus').value,
    imagePrompt: document.getElementById('ce_drama_desc')?.value?.trim() || '',
    image: pendingDramaImage !== null ? pendingDramaImage : document.getElementById('dramaImage')?.value?.trim() || '',
  };
  if(editId){
    ensureDramaState(editId);
    Object.assign(state.dramaState[editId], payload);
    const rt = state.runtimeDramas.find(x => x.id === editId);
    if(rt) Object.assign(rt, payload);
  } else {
    state.runtimeDramas.push({ id:'media-'+Date.now(), currentEpisode:0, ...payload });
  }
  saveState();
  pendingDramaImage = null;
  document.getElementById('dramaModalBack').classList.add('hidden');
  renderDramaDeck();
});

/* ---------- Press & Gallery ---------- */
let pressTagFilter = '';

function parseArticleTags(article){
  if(!article) return [];
  if(Array.isArray(article.tags)) return article.tags.map(t => String(t).trim()).filter(Boolean);
  return String(article.tags || '').split(/[,;]+/).map(t => t.trim()).filter(Boolean);
}

function generateWeeklyNewsletter(refDate = new Date()){
  const end = new Date(refDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const inRange = (iso) => {
    if(!iso) return false;
    const d = new Date(iso);
    return d >= start && d <= end;
  };
  const dayKeys = [];
  for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const places = new Set();
  const people = new Set();
  const pulses = [];
  dayKeys.forEach(k => {
    const n = typeof normalizeEntry === 'function' ? normalizeEntry(state.entries[k]) : {};
    (n.places || []).forEach(p => places.add(p));
    (n.people || []).forEach(p => people.add(p));
    const stream = typeof getDayStream === 'function' ? getDayStream(k) : { nodes: [] };
    stream.nodes.forEach(nd => {
      if(inRange(nd.at) && nd.type !== 'wake' && nd.type !== 'sleep') pulses.push({ ...nd, day: k });
    });
  });
  const media = (typeof getDramas === 'function' ? getDramas() : []).filter(d => {
    const eps = Object.values(d.episodes || {});
    return eps.some(ep => inRange(ep.date) || inRange(ep.reviewedAt));
  }).slice(0, 6);
  const articles = (typeof getArticles === 'function' ? getArticles() : []).filter(a => inRange(a.date)).slice(0, 4);
  const gallery = (state.pinboard || []).filter(p => inRange(p.time)).slice(0, 8);
  const skills = (typeof getSkills === 'function' ? getSkills() : []).map(s => ({
    name: s.name,
    hours: typeof getTotalSkillHours === 'function' ? getTotalSkillHours(s.id) : 0,
    color: s.color,
  })).filter(s => s.hours > 0).slice(0, 6);
  const title = `Week in review · ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const body = [
    `# ${title}`,
    '',
    places.size ? `## Places\n${[...places].map(p => `- ${p}`).join('\n')}` : '',
    people.size ? `## People\n${[...people].map(p => `- ${p}`).join('\n')}` : '',
    media.length ? `## Media\n${media.map(d => `- ${d.title} (${d.mediaType})`).join('\n')}` : '',
    skills.length ? `## Skills\n${skills.map(s => `- ${s.name}: ${s.hours}h`).join('\n')}` : '',
    articles.length ? `## Writing\n${articles.map(a => `- ${a.title}`).join('\n')}` : '',
    pulses.length ? `## Live moments\n${pulses.slice(0, 12).map(p => `- ${p.day}: ${p.text || p.type}`).join('\n')}` : '',
    gallery.length ? `## Gallery\n${gallery.map(p => p.photo ? `![${p.name}](photo)` : `- ${p.name}: ${p.text?.slice(0, 80)}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
  return { title, body, excerpt: body.split('\n').filter(Boolean).slice(1, 4).join(' · ').slice(0, 220) };
}

function renderPress(){
  const spread = document.getElementById('pressSpread');
  if(!spread) return;
  const articles = getArticles();
  const allTags = [...new Set(articles.flatMap(parseArticleTags))].sort((a, b) => a.localeCompare(b));
  const filtered = pressTagFilter
    ? articles.filter(a => parseArticleTags(a).includes(pressTagFilter))
    : articles;
  const tagBar = allTags.length
    ? `<div class="press-tag-bar">
        <button type="button" class="press-tag-chip${!pressTagFilter ? ' is-active' : ''}" data-press-tag="">All</button>
        ${allTags.map(tag => `<button type="button" class="press-tag-chip${pressTagFilter === tag ? ' is-active' : ''}" data-press-tag="${esc(tag)}">${esc(tag)}</button>`).join('')}
      </div>`
    : '';
  const recs = typeof renderCategoryRecommendationsHtml === 'function'
    ? renderCategoryRecommendationsHtml('press', 'The Press')
    : '';
  const newsletterBtn = isAdmin()
    ? `<div class="press-admin-tools"><button type="button" class="btn primary" id="generateWeeklyNewsletter">Generate weekly newsletter draft</button><p class="field-hint">Pulls places, people, media, skills, pulses &amp; gallery from the last 7 days — nothing from the overload vault.</p></div>`
    : '';
  const pressQueue = typeof GameHub !== 'undefined' ? GameHub.renderPressQueue() : '';
  const pressSubmit = typeof GameHub !== 'undefined' ? GameHub.renderPressSubmitForm() : '';
  spread.innerHTML = recs + pressQueue + pressSubmit + newsletterBtn + tagBar + filtered.map((a, i) => {
    const neon = stableNeon(a.id, i);
    const tags = parseArticleTags(a);
    const tagHtml = tags.length
      ? `<div class="press-tags">${tags.map(t => `<span class="press-tag">${esc(t)}</span>`).join('')}</div>`
      : '';
    return `
    <article class="manga-panel ${a.layout||'note'}" style="--panel-neon:${neon}" data-article-id="${esc(a.id)}">
      <div class="manga-section">${esc(a.section)}</div>
      <h3 class="manga-headline">${esc(a.title)}</h3>
      <div class="manga-date">${esc(a.date)}</div>
      ${tagHtml}
      ${a.image?`<div class="manga-panel-image"><img src="${esc(a.image)}" alt="" loading="lazy"></div>`:''}
      <p class="manga-excerpt">${esc(a.excerpt)}</p>
      ${isAdmin() ? '<span class="panel-edit-hint">click to edit</span>' : ''}
    </article>`;
  }).join('');

  spread.querySelectorAll('.press-tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      pressTagFilter = btn.dataset.pressTag || '';
      renderPress();
    });
  });
  if(typeof GameHub !== 'undefined'){
    GameHub.bindPressQueue(spread);
    GameHub.bindPressSubmit();
  }
  spread.querySelector('#generateWeeklyNewsletter')?.addEventListener('click', () => {
    const draft = generateWeeklyNewsletter();
    ensureContentState();
    const article = {
      id: uid('art'),
      section: 'Newsletter',
      title: draft.title,
      date: todayKey(),
      excerpt: draft.excerpt,
      body: draft.body,
      layout: 'feature',
      tags: 'newsletter,weekly',
      image: (state.pinboard || []).find(p => p.photo)?.photo || '',
    };
    if(!state.content.articles) state.content.articles = [];
    state.content.articles.unshift(article);
    saveState();
    if(typeof awardGrayPoints === 'function') awardGrayPoints(GRAY_XP_AWARDS.newsletter.xp, 'newsletter');
    openContentEditor('article', article.id, false);
    renderPress();
  });

  spread.querySelectorAll('.manga-panel').forEach(p => {
    p.addEventListener('click', () => {
      const a = articles.find(x => x.id === p.dataset.articleId);
      if(!a) return;
      if(isAdmin()) openContentEditor('article', a.id, false);
      else {
        const commentBtn = canCommunityInteract()
          ? `<div class="article-comment-row"><button type="button" class="btn community-comment-btn" data-cc-type="press" data-cc-id="${esc(a.id)}" data-cc-label="${esc(a.title)}">↩ Comment on Community</button></div>`
          : '';
        const tags = parseArticleTags(a);
        const tagLine = tags.length ? `<div class="press-tags">${tags.map(t => `<span class="press-tag">${esc(t)}</span>`).join('')}</div>` : '';
        document.getElementById('articleModalContent').innerHTML = `
          <div class="manga-section">${esc(a.section)} · ${esc(a.date)}</div>
          <h2 class="article-full-headline">${esc(a.title)}</h2>
          ${tagLine}
          ${a.image?`<div class="manga-panel-image"><img src="${esc(a.image)}" alt=""></div>`:''}
          <div class="article-full-body">${esc(a.body)}</div>
          ${commentBtn}`;
        wireCommunityCommentButtons(document.getElementById('articleModalContent'));
        document.getElementById('articleModalBack').classList.remove('hidden');
      }
    });
  });
}

document.getElementById('closeArticleModal')?.addEventListener('click', () => document.getElementById('articleModalBack').classList.add('hidden'));

const GALLERY_LAYOUTS = [
  { size: 'md', rotate: -2, shiftX: 0, shiftY: 4, width: '33.33%' },
  { size: 'md', rotate: 2, shiftX: 2, shiftY: 6, width: '33.33%' },
  { size: 'sm', rotate: -3, shiftX: -1, shiftY: 5, width: '33.33%' },
  { size: 'md', rotate: 1, shiftX: 3, shiftY: 8, width: '50%' },
  { size: 'md', rotate: -1, shiftX: -2, shiftY: 6, width: '50%' },
  { size: 'sm', rotate: 2, shiftX: 1, shiftY: 4, width: '50%' },
];

function clampGalleryWidth(w){
  const pct = parseFloat(String(w || '').replace('%', ''));
  if(!Number.isFinite(pct)) return '33.33%';
  if(pct > 50) return '50%';
  if(pct < 33) return '33.33%';
  return `${pct}%`;
}

function resolveGalleryLayout(photo, index){
  const presetIdx = photo.layoutPreset != null ? photo.layoutPreset : index % GALLERY_LAYOUTS.length;
  const preset = GALLERY_LAYOUTS[presetIdx];
  const width = clampGalleryWidth(photo.width || preset.width);
  const wide = parseFloat(width) >= 50 || presetIdx >= 3;
  return {
    ...photo,
    layoutPreset: presetIdx,
    size: photo.size || preset.size,
    rotate: photo.rotate != null && photo.rotate !== '' ? Number(photo.rotate) : preset.rotate,
    shiftX: photo.shiftX != null ? Number(photo.shiftX) : preset.shiftX,
    shiftY: photo.shiftY != null ? Number(photo.shiftY) : preset.shiftY,
    width,
    gridWide: wide,
  };
}

function nextGalleryLayoutIndex(){
  return getGallery().length % GALLERY_LAYOUTS.length;
}

function formatVisitDate(raw){
  if(!raw) return '';
  try{
    return new Date(`${raw}T12:00:00`).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
  }catch{
    return raw;
  }
}

function photoHasStory(photo){
  return !!(photo.place || photo.address || photo.visited || photo.description || photo.story);
}

function renderGalleryBack(photo){
  const visited = formatVisitDate(photo.visited);
  const rows = [
    visited ? `<div class="flip-row"><span class="flip-label">Visited</span><span>${esc(visited)}</span></div>` : '',
    photo.address ? `<div class="flip-row"><span class="flip-label">Address</span><span>${esc(photo.address)}</span></div>` : '',
  ].filter(Boolean).join('');

  const adminBtns = isAdmin() ? `<div class="flip-admin-row edit-when-editing">
    <button type="button" class="btn flip-edit-btn">Edit</button>
    <button type="button" class="btn admin-delete flip-del-btn" data-del-type="gallery" data-del-id="${esc(photo.id || '')}">Delete</button>
  </div>` : '';
  const commentBtn = canCommunityInteract()
    ? `<button type="button" class="btn community-comment-btn" data-cc-type="gallery" data-cc-id="${esc(photo.id || '')}" data-cc-label="${esc(photo.caption || photo.place || 'Photo')}">↩ Comment on Community</button>`
    : '';

  if(!photoHasStory(photo)){
    return `<div class="flip-back-inner">
      <h3 class="flip-caption">${esc(photo.caption || 'Untitled')}</h3>
      <p class="flip-empty">No story written for this one yet.</p>
      ${commentBtn}
      ${adminBtns}
      <span class="flip-hint-back">tap to flip back</span>
    </div>`;
  }

  return `<div class="flip-back-inner">
    <h3 class="flip-caption">${esc(photo.caption || 'Untitled')}</h3>
    ${photo.place ? `<p class="flip-place">${esc(photo.place)}</p>` : ''}
    ${rows ? `<div class="flip-details">${rows}</div>` : ''}
    ${photo.description ? `<p class="flip-desc">${esc(photo.description)}</p>` : ''}
    ${photo.story ? `<blockquote class="flip-story">${esc(photo.story)}</blockquote>` : ''}
    ${commentBtn}
    ${adminBtns}
    <span class="flip-hint-back">tap to flip back</span>
  </div>`;
}

function renderGallery(){
  const gallery = getGallery();
  const wall = document.getElementById('photoWall');
  if(!wall) return;
  wall.innerHTML = gallery.map((photo, i) => {
    const p = resolveGalleryLayout(photo, i);
    const id = p.id || String(i);
    const neon = stableNeon(id, i);
    const frontImg = p.src
      ? `<img src="${esc(p.src)}" alt="" loading="lazy">`
      : `<div class="photo-placeholder">◈</div>`;
    return `<figure class="photo-flip layout-${p.layoutPreset}${p.gridWide ? ' layout-wide' : ''} size-${p.size}${photoHasStory(p) ? ' has-story' : ''}" style="--rot:${p.rotate}deg;--shift-x:${p.shiftX}px;--shift-y:${p.shiftY}px;--flip-neon:${neon}" data-gallery-id="${esc(id)}">
      <div class="photo-flip-scene">
        <div class="photo-flip-inner">
          <div class="photo-flip-face photo-flip-front">
            <button type="button" class="card-edit-front flip-edit-btn edit-when-editing" aria-label="Edit photo">Edit</button>
            <div class="photo-frame">${frontImg}</div>
            <figcaption class="photo-caption">${esc(p.caption || 'Untitled')}</figcaption>
            <span class="flip-hint-front">↻ story</span>
          </div>
          <div class="photo-flip-face photo-flip-back">${renderGalleryBack(p)}</div>
        </div>
      </div>
    </figure>`;
  }).join('');

  if(!wall._galleryHandler){
    wall._galleryHandler = e => {
      const delBtn = e.target.closest('.flip-del-btn');
      if(delBtn){
        e.preventDefault();
        e.stopPropagation();
        deleteContentItem(delBtn.dataset.delType, delBtn.dataset.delId);
        return;
      }
      if(e.target.closest('.flip-edit-btn, .card-edit-front, .community-comment-btn')) return;
      const fig = e.target.closest('.photo-flip');
      if(!fig || !wall.contains(fig)) return;
      const wasFlipped = fig.classList.contains('is-flipped');
      wall.querySelectorAll('.photo-flip.is-flipped').forEach(f => f.classList.remove('is-flipped'));
      if(!wasFlipped) fig.classList.add('is-flipped');
    };
    wall.addEventListener('click', wall._galleryHandler);
  }
  wireCommunityCommentButtons(wall);
}

/* ---------- Community comments → pinboard ---------- */
function canCommunityInteract(){
  return isAdmin() || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());
}

function openCommunityCommentModal(source){
  if(!canCommunityInteract()) return;
  document.getElementById('ccSourceType').value = source.type || '';
  document.getElementById('ccSourceId').value = source.id || '';
  document.getElementById('ccSourceLabel').value = source.label || '';
  document.getElementById('communityCommentTitle').textContent = `Note on ${source.label || 'this post'}`;
  document.getElementById('communityCommentHint').textContent = 'Posts to the Community board — I see it there, even though you commented from here.';
  document.getElementById('ccText').value = '';
  document.getElementById('ccLocation').value = '';
  document.getElementById('communityCommentBack')?.classList.remove('hidden');
  document.getElementById('ccText')?.focus();
}

function wireCommunityCommentButtons(root){
  root?.querySelectorAll('.community-comment-btn').forEach(btn => {
    if(btn.dataset.ccBound) return;
    btn.dataset.ccBound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openCommunityCommentModal({
        type: btn.dataset.ccType,
        id: btn.dataset.ccId,
        label: btn.dataset.ccLabel,
      });
    });
  });
}

function initCommunityCommentModal(){
  const back = document.getElementById('communityCommentBack');
  if(!back || back.dataset.bound) return;
  back.dataset.bound = '1';
  document.getElementById('closeCommunityComment')?.addEventListener('click', () => back.classList.add('hidden'));
  document.getElementById('cancelCommunityComment')?.addEventListener('click', () => back.classList.add('hidden'));
  back.addEventListener('click', e => { if(e.target.id === 'communityCommentBack') back.classList.add('hidden'); });
  document.getElementById('communityCommentForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const author = pinSessionAuthor();
    if(!author){ alert('Log in with your card to comment.'); return; }
    const location = document.getElementById('ccLocation')?.value?.trim();
    const text = document.getElementById('ccText')?.value?.trim();
    const sourceType = document.getElementById('ccSourceType')?.value;
    const sourceId = document.getElementById('ccSourceId')?.value;
    const sourceLabel = document.getElementById('ccSourceLabel')?.value;
    if(!location || !text) return;
    const prefix = sourceLabel ? `Re: ${sourceLabel} — ` : '';
    state.pinboard.push({
      id: 'pin-' + Date.now(),
      name: author.name,
      characterId: author.characterId,
      location,
      text: prefix + text,
      photo: '',
      time: new Date().toISOString(),
      replies: [],
      sourceType: sourceType || '',
      sourceId: sourceId || '',
      sourceLabel: sourceLabel || '',
    });
    saveState();
    if(author.characterId && typeof awardCoderPoints === 'function'){
      awardCoderPoints(author.characterId, XP_AWARDS.community_comment.xp, 'community_comment');
    }
    if(typeof logCoderActivity === 'function'){
      logCoderActivity('community_comment', {
        coderId: author.characterId || '',
        name: author.name,
        detail: `${author.name} commented via ${sourceType || 'post'}`,
      });
    }
    LiveSync?.pinPosted(author.name, location);
    back.classList.add('hidden');
    renderPinboard();
    navigateToView('comm');
  });
}

/* ---------- Pinboard — community board ---------- */
function parsePollOptions(text){
  return (text || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8)
    .map((t, i) => ({ id: 'opt-' + i, text: t }));
}

function normalizePinPost(p){
  const postType = p.postType || (p.video ? 'video' : 'note');
  return {
    id: p.id,
    name: p.name || 'Anonymous',
    characterId: p.characterId || '',
    location: p.location || p.from || 'Unknown',
    text: p.text || '',
    photo: p.photo || '',
    video: p.video || '',
    postType,
    pollOptions: Array.isArray(p.pollOptions) ? p.pollOptions : [],
    pollVotes: p.pollVotes && typeof p.pollVotes === 'object' ? { ...p.pollVotes } : {},
    time: p.time || new Date().toISOString(),
    sourceType: p.sourceType || '',
    sourceId: p.sourceId || '',
    sourceLabel: p.sourceLabel || '',
    replies: Array.isArray(p.replies) ? p.replies.map(r => ({
      id: r.id,
      name: r.name || 'Anonymous',
      characterId: r.characterId || '',
      location: r.location || r.from || 'Unknown',
      text: r.text || '',
      photo: r.photo || '',
      time: r.time || new Date().toISOString(),
      parentId: r.parentId || p.id,
    })) : [],
  };
}

function renderPollBlock(p, viewerCoderId){
  const opts = p.pollOptions || [];
  const votes = p.pollVotes || {};
  const total = Object.keys(votes).length;
  const myVote = viewerCoderId ? votes[viewerCoderId] : '';
  const canVote = !!(viewerCoderId || isAdmin());
  return `<div class="pin-poll" data-poll-id="${esc(p.id)}">
    ${opts.map(o => {
      const count = Object.values(votes).filter(v => v === o.id).length;
      const pct = total ? Math.round((count / total) * 100) : 0;
      const voted = myVote === o.id;
      return `<div class="pin-poll-opt${voted ? ' is-voted' : ''}">
        ${canVote && !myVote ? `<button type="button" class="btn pin-poll-vote" data-poll-vote="${esc(p.id)}" data-poll-opt="${esc(o.id)}">${esc(o.text)}</button>` : `<span class="pin-poll-label">${esc(o.text)}</span>`}
        <span class="pin-poll-bar" style="--pp-pct:${pct}%"></span>
        <span class="pin-poll-count">${count}${voted ? ' ✓' : ''}</span>
      </div>`;
    }).join('')}
    <p class="pin-poll-total">${total} vote${total === 1 ? '' : 's'}</p>
  </div>`;
}

function votePoll(postId, optionId){
  const post = state.pinboard.find(p => p.id === postId);
  if(!post) return;
  const author = pinSessionAuthor();
  const voterId = author?.characterId || (isAdmin() ? 'gray' : '');
  if(!voterId){ alert('Log in to vote.'); return; }
  if(!post.pollVotes) post.pollVotes = {};
  if(post.pollVotes[voterId]) return;
  post.pollVotes[voterId] = optionId;
  saveState();
  renderPinboard();
  if(coderBoardId) renderCoderBoardPage(coderBoardId);
}

function bindPollVoteButtons(root){
  (root || document).querySelectorAll('[data-poll-vote]').forEach(btn => {
    btn.addEventListener('click', () => votePoll(btn.dataset.pollVote, btn.dataset.pollOpt));
  });
}

function renderPinPostBody(p){
  if(p.postType === 'poll') return renderPollBlock(p, getMyCoderCard()?.id);
  let html = '';
  if(p.video) html += `<div class="pin-video"><video controls playsinline src="${esc(p.video)}"></video></div>`;
  if(p.photo) html += `<div class="pin-photo"><img src="${esc(p.photo)}" alt="" loading="lazy"></div>`;
  if(p.text) html += `<p class="pin-text">${esc(p.text)}</p>`;
  return html;
}

function renderPinPostFull(p, viewerCoderId){
  const norm = normalizePinPost(p);
  return `<article class="pin-post community-pin pin-post-full" data-pin-id="${esc(norm.id)}">
    <header class="pin-post-head">
      ${pinAuthorBlock(norm)}
      <span class="pin-location">📍 ${esc(norm.location)}</span>
      <time class="pin-time">${esc(fmtPinDateTime(norm.time))}</time>
      ${norm.postType !== 'note' ? `<span class="pin-type-badge">${esc(norm.postType)}</span>` : ''}
    </header>
    ${renderPinPostBody(norm)}
  </article>`;
}

function buildCommFeedTabs(){
  const tabs = document.getElementById('commFeedTabs');
  if(!tabs) return;
  const coders = (state.viewerCharacters || []).filter(c => getCoderPosts(c.id).length);
  let html = `<button type="button" class="btn comm-feed-tab${commFeedFilter === 'all' ? ' is-active' : ''}" data-comm-feed="all">Recent</button>`;
  coders.forEach(c => {
    html += `<button type="button" class="btn comm-feed-tab${commFeedFilter === c.id ? ' is-active' : ''}" data-comm-feed="${esc(c.id)}">${esc(c.name)}</button>`;
  });
  tabs.innerHTML = html;
  tabs.querySelectorAll('[data-comm-feed]').forEach(btn => {
    btn.addEventListener('click', () => {
      commFeedFilter = btn.dataset.commFeed;
      renderPinboard();
    });
  });
}

function initPinFormHandlers(){
  const form = document.getElementById('pinForm');
  if(!form || form.dataset.pinBound) return;
  form.dataset.pinBound = '1';
  const typeSel = document.getElementById('pinPostType');
  const pollFields = document.getElementById('pinPollFields');
  const textLabel = document.getElementById('pinTextLabel');
  const syncType = () => {
    const t = typeSel?.value || 'note';
    pollFields?.classList.toggle('hidden', t !== 'poll');
    if(textLabel) textLabel.textContent = t === 'poll' ? 'Poll question' : 'Message';
  };
  typeSel?.addEventListener('change', syncType);
  syncType();
  document.getElementById('pinTakePhoto')?.addEventListener('click', () => {
    if(typeof MediaCapture !== 'undefined'){
      MediaCapture.open({ mode: 'photo', onResult: r => {
        pendingPinMedia.photo = r.dataUrl;
        pendingPinMedia.video = '';
        showPinMediaPreview();
      }});
    }
  });
  document.getElementById('pinTakeVideo')?.addEventListener('click', () => {
    if(typeof MediaCapture !== 'undefined'){
      MediaCapture.open({ mode: 'video', onResult: r => {
        pendingPinMedia.video = r.dataUrl;
        showPinMediaPreview();
      }});
    }
  });
  document.getElementById('pinPhoto')?.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => { pendingPinMedia.photo = r.result; showPinMediaPreview(); };
    r.readAsDataURL(f);
  });
  document.getElementById('pinVideoFile')?.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if(!f) return;
    if(f.size > 4 * 1024 * 1024){ alert('Max 4MB'); return; }
    const r = new FileReader();
    r.onload = () => { pendingPinMedia.video = r.result; showPinMediaPreview(); };
    r.readAsDataURL(f);
  });
}

function showPinMediaPreview(){
  const el = document.getElementById('pinMediaPreview');
  if(!el) return;
  if(!pendingPinMedia.photo && !pendingPinMedia.video){ el.classList.add('hidden'); el.innerHTML = ''; return; }
  el.classList.remove('hidden');
  el.innerHTML = `${pendingPinMedia.photo ? `<img src="${esc(pendingPinMedia.photo)}" alt="">` : ''}${pendingPinMedia.video ? `<video src="${esc(pendingPinMedia.video)}" controls playsinline></video>` : ''}<button type="button" class="btn" id="pinClearMedia">Clear</button>`;
  document.getElementById('pinClearMedia')?.addEventListener('click', () => {
    pendingPinMedia = { photo: '', video: '' };
    showPinMediaPreview();
  });
}

function pinAuthorBlock(p){
  if(p.characterId && typeof pinCoderThumb === 'function') return pinCoderThumb(p.characterId);
  return `<span class="pin-name">${esc(p.name)}</span>`;
}

function pinSessionAuthor(){
  if(isAdmin()) return { name: getPlayer().name || 'Gray', characterId: '' };
  if(typeof getMyCoderCard === 'function'){
    const c = getMyCoderCard();
    if(c) return { name: c.name, characterId: c.id };
  }
  return null;
}

function fmtPinDateTime(iso){
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function renderPinboard(){
  const wall = document.getElementById('pinWall');
  if(!wall) return;
  buildCommFeedTabs();
  let posts = (state.pinboard || []).map(normalizePinPost);
  if(commFeedFilter !== 'all'){
    posts = posts.filter(p => p.characterId === commFeedFilter);
  }
  if(!posts.length){
    const canPost = isAdmin() || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());
    wall.innerHTML = `<p class="empty-hint pin-empty">${canPost ? 'Be the first to leave a note on the board.' : 'Log in to post on the board.'}</p>`;
    return;
  }

  const canReply = isAdmin() || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());

  wall.innerHTML = posts.slice().reverse().map((p, i) => {
    const rot = [-1.5, 1.2, -0.8, 1.8, -1][i % 5];
    const replies = (p.replies || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return `<article class="pin-post community-pin scrap-pin" style="--prot:${rot}deg;--pin-neon:${stableNeon(p.characterId || p.name, i)}" data-pin-id="${esc(p.id)}">
      <div class="scrap-pin-tape" aria-hidden="true"></div>
      <header class="pin-post-head">
        <div class="pin-meta-block">
          ${pinAuthorBlock(p)}
          <span class="pin-location">📍 ${esc(p.location)}</span>
          <time class="pin-time">${esc(fmtPinDateTime(p.time))}</time>
          ${p.postType !== 'note' ? `<span class="pin-type-badge">${esc(p.postType)}</span>` : ''}
        </div>
        ${p.sourceLabel ? `<span class="pin-source-ref">↩ on ${esc(p.sourceType || 'post')}: ${esc(p.sourceLabel)}</span>` : ''}
        ${isAdmin() ? `<button type="button" class="pin-delete" data-pin="${esc(p.id)}" title="Remove">×</button>` : ''}
      </header>
      ${renderPinPostBody(p)}
      <div class="pin-replies">${replies.map(r => `
        <div class="pin-reply" data-reply-id="${esc(r.id)}">
          <header class="pin-reply-head">
            ${r.characterId && typeof pinCoderThumb === 'function' ? pinCoderThumb(r.characterId) : `<span class="pin-name">${esc(r.name)}</span>`}
            <span class="pin-location">📍 ${esc(r.location)}</span>
            <time class="pin-time">${esc(fmtPinDateTime(r.time))}</time>
          </header>
          ${r.photo ? `<div class="pin-photo pin-photo-sm"><img src="${esc(r.photo)}" alt="" loading="lazy"></div>` : ''}
          <p class="pin-text">${esc(r.text)}</p>
        </div>`).join('')}</div>
      ${canReply ? `<button type="button" class="btn pin-reply-btn" data-reply-to="${esc(p.id)}">↩ Reply</button>
      <form class="pin-reply-form hidden" data-reply-form="${esc(p.id)}">
        <div class="field"><label>Posting from</label><input type="text" class="pin-reply-location" required placeholder="where are you"></div>
        <div class="field"><label>Reply</label><textarea class="pin-reply-text" required rows="2"></textarea></div>
        <div class="field"><label>Photo (optional)</label><input type="file" class="pin-reply-photo" accept="image/*"></div>
        <div class="pin-reply-actions">
          <button type="button" class="btn pin-reply-cancel">Cancel</button>
          <button type="submit" class="btn primary">Post reply</button>
        </div>
      </form>` : ''}
    </article>`;
  }).join('');

  wall.querySelectorAll('.pin-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if(!confirm('Remove this post and all replies?')) return;
      state.pinboard = state.pinboard.filter(p => p.id !== btn.dataset.pin);
      saveState();
      renderPinboard();
    });
  });

  wall.querySelectorAll('.pin-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = wall.querySelector(`[data-reply-form="${btn.dataset.replyTo}"]`);
      form?.classList.toggle('hidden');
    });
  });

  wall.querySelectorAll('.pin-reply-cancel').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.pin-reply-form')?.classList.add('hidden'));
  });

  wall.querySelectorAll('.pin-reply-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const parentId = form.dataset.replyForm;
      const post = state.pinboard.find(p => p.id === parentId);
      if(!post) return;
      const author = pinSessionAuthor();
      if(!author){ alert('Log in to your card to reply.'); return; }
      const location = form.querySelector('.pin-reply-location')?.value?.trim();
      const text = form.querySelector('.pin-reply-text')?.value?.trim();
      const file = form.querySelector('.pin-reply-photo')?.files?.[0];
      if(!location || !text) return;
      const addReply = (photo) => {
        if(!Array.isArray(post.replies)) post.replies = [];
        post.replies.push({
          id: 'reply-' + Date.now(),
          parentId,
          name: author.name,
          characterId: author.characterId,
          location, text,
          photo: photo || '',
          time: new Date().toISOString(),
        });
        saveState();
        if(author.characterId && typeof awardCoderPoints === 'function'){
          awardCoderPoints(author.characterId, XP_AWARDS.community_comment.xp, 'community_comment');
        }
        if(typeof logCoderActivity === 'function'){
          logCoderActivity('community_reply', {
            coderId: author.characterId || '',
            name: author.name,
            detail: `${author.name} replied on Community`,
          });
        }
        LiveSync?.pinPosted(author.name, location);
        renderPinboard();
      };
      if(file){
        const reader = new FileReader();
        reader.onload = () => addReply(reader.result);
        reader.readAsDataURL(file);
      } else addReply('');
    });
  });
  bindPollVoteButtons(wall);
  wall.querySelectorAll('[data-coder-board-link]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); navigateToCoderBoard(btn.dataset.coderBoardLink); });
  });
}

document.getElementById('pinForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const author = pinSessionAuthor();
  if(!author){ alert(isAdmin() ? 'Something went wrong — try exiting and re-entering Player Gray mode.' : 'Log in to your card to post.'); return; }
  const location = document.getElementById('pinLocation').value.trim();
  const text = document.getElementById('pinText').value.trim();
  const postType = document.getElementById('pinPostType')?.value || 'note';
  if(!location || !text) return;

  const pollOptions = postType === 'poll' ? parsePollOptions(document.getElementById('pinPollOptions')?.value) : [];
  if(postType === 'poll' && pollOptions.length < 2){ alert('Add at least 2 poll options.'); return; }

  const photo = pendingPinMedia.photo || '';
  const video = pendingPinMedia.video || (postType === 'video' ? pendingPinMedia.video : '');
  const file = document.getElementById('pinPhoto')?.files?.[0];

  const pushPost = (photoData) => {
    state.pinboard.push({
      id: 'pin-' + Date.now(),
      name: author.name,
      characterId: author.characterId,
      location, text,
      photo: photoData || photo,
      video: video || '',
      postType,
      pollOptions,
      pollVotes: {},
      time: new Date().toISOString(),
      replies: [],
    });
    saveState();
    pendingPinMedia = { photo: '', video: '' };
    showPinMediaPreview();
    if(author.characterId && typeof awardCoderPoints === 'function'){
      awardCoderPoints(author.characterId, XP_AWARDS.community_post.xp, 'community_post');
    }
    if(typeof logCoderActivity === 'function'){
      logCoderActivity('community_post', {
        coderId: author.characterId || '',
        name: author.name,
        detail: `${author.name} posted ${postType} on Community`,
      });
    }
    LiveSync?.pinPosted(author.name, location);
    document.getElementById('pinForm').reset();
    document.getElementById('pinPostType').value = 'note';
    document.getElementById('pinPollFields')?.classList.add('hidden');
    renderPinboard();
  };

  if(file && !photo){
    const reader = new FileReader();
    reader.onload = () => pushPost(reader.result);
    reader.readAsDataURL(file);
  } else pushPost('');
});

/* ---------- Admin ---------- */
document.getElementById('adminUnlock')?.addEventListener('click', () => document.getElementById('adminModalBack').classList.remove('hidden'));
document.getElementById('cancelAdmin')?.addEventListener('click', () => document.getElementById('adminModalBack').classList.add('hidden'));
document.getElementById('confirmAdmin')?.addEventListener('click', () => {
  if(document.getElementById('adminKeyInput').value === ADMIN_KEY){
    document.getElementById('adminModalBack').classList.add('hidden');
    unlockAdmin({ toast: false, welcome: false, view: 'sync' });
  }
});

function safeRender(fn){
  try{ fn(); }catch(err){ console.error(fn.name || 'render', err); }
}

function renderAll(){
  [
    renderAbout,
    renderHomeCheckIn,
    renderLedger,
    renderPlaces,
    renderCharacters,
    renderTierLegend,
    renderSkillCardDeck,
    renderSkillSkyline,
    renderDramaDeck,
    renderPress,
    renderGallery,
    renderPinboard,
    () => { if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderAll(); },
  ].forEach(safeRender);
  applyAdminUI();
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
  if(isAdmin() && typeof renderCoderNotifyRail === 'function') renderCoderNotifyRail();
}
