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
      : 'Give Gray missions — places, food, comfort, Press pieces, meetups.';
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
  const pinForm = document.getElementById('pinForm');
  if(pinForm) pinForm.classList.toggle('hidden', !canPost);
  const commHint = document.getElementById('commBoardHint');
  if(commHint){
    commHint.textContent = admin
      ? 'Player Gray mode — post as yourself. Your notes stay on the board permanently.'
      : canPost
        ? 'Posts stay permanently. Your Coders Card shows on your note.'
        : 'Guest watch-only — log in or make My Card to post.';
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
  if(typeof hideEntryGate === 'function') hideEntryGate();
  else if(typeof enterMainSite === 'function') enterMainSite();
  applyAdminUI();
  renderAll();
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
  if(opts.view){
    const btn = document.querySelector(`.node-btn[data-view="${opts.view}"]`);
    btn?.click();
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
    content: null,
    overloadLogs: [],
    privateBodyLog: [],
    privateVentLogs: [],
    currentMood: '',
    moodCatalog: [],
    viewerCharacters: [],
    quests: [],
    videoDiary: [],
    liveTodos: [],
    instructionsHtml: '',
    playerPoints: 0,
    playerXpHistory: [],
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
  saveState();
}
mergeSiteStateFromFile();
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

function isCoderDeckCard(c){
  return !!(c && (c.isCoderCard || (state.viewerCharacters || []).some(v => v.id === c.id)));
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
    return {
      title: g('ce_title'), section: g('ce_section'), date: g('ce_date'), layout: g('ce_layout') || 'note',
      excerpt: g('ce_excerpt'), body: g('ce_body'),
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
      renderLogCalendar();
    });
    document.getElementById('calNext')?.addEventListener('click', () => {
      const { year, month } = getCalendarView();
      const d = new Date(year, month + 1, 1);
      setCalendarView(d.getFullYear(), d.getMonth());
      renderLogCalendar();
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
      this.selectDay(todayKey());
    });

    if(isAdmin()) this.onAdminReady();
  },

  onAdminReady(){
    document.getElementById('dailyLogEditor')?.classList.remove('hidden');
    if(!this.activeKey) this.selectDay(todayKey());
    renderSkillControls();
  },

  selectDay(key){
    if(!key) return;
    if(!isAdmin()){
      openDayModal(key);
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
    const stream = getDayStream(key);
    if(preview){
      if(stream.endedAt){
        preview.classList.remove('hidden');
        preview.innerHTML = buildDayDetailHTML(key, e);
      } else {
        preview.classList.add('hidden');
        preview.innerHTML = '';
      }
    }

    renderLogCalendar();
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
    renderLogCalendar();
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
    renderLogCalendar();
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
  note: { label: 'Note', neon: '#3ad6e0', icon: '◆' },
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
  call: { label: 'Call', neon: '#34d399', icon: '☎' },
  message: { label: 'Message', neon: '#7dd3fc', icon: '✉' },
  news: { label: 'News', neon: '#fca5a5', icon: '▤' },
  learn: { label: 'Learned', neon: '#86efac', icon: '?' },
  vibe: { label: 'Vibe', neon: '#e879f9', icon: '◇' },
  memory: { label: 'Memory', neon: '#fda4af', icon: '⌛' },
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
    { id: 'title', label: 'Headline', type: 'text', placeholder: 'Short label for the rail' },
    { id: 'body', label: 'Message', type: 'textarea', rows: 8, required: true, placeholder: 'Full update — as detailed as you need' },
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
  quest_complete: { label: 'Quest completed for a coder', xp: 20 },
  todo_done: { label: 'Live to-do ticked off', xp: 3 },
  media_review: { label: 'Media unit rated', xp: 4 },
  final_review: { label: 'Final media review written', xp: 15 },
  new_card: { label: 'New player/place card', xp: 10 },
  overload_session: { label: 'Overload session archived', xp: 12 },
  custom: { label: 'Custom award', xp: 0 },
  login: { label: 'Daily login', xp: 3 },
};

function getGrayPoints(){
  return state.playerPoints || 0;
}

function grayLevelFromPoints(points){
  const pts = points || 0;
  const level = Math.max(1, 1 + Math.floor(pts / 100));
  return { level, points: pts, progress: (pts % 100) / 100 };
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
  const rows = Object.entries(GRAY_XP_AWARDS)
    .filter(([k]) => k !== 'custom')
    .map(([, v]) => `<li><strong>+${v.xp}</strong> ${esc(v.label)}</li>`).join('');
  return `<section class="gray-xp-guide sketch-card">
    <h3 class="profile-feed-title">How Gray levels up</h3>
    <p class="gallery-hint">Every 100 XP = +1 level. Coders earn XP from quests; you earn XP from living the board.</p>
    <ul class="gray-xp-list">${rows}</ul>
    <p class="gray-xp-formula">Level = 1 + floor(XP ÷ 100)</p>
  </section>`;
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
    default: return data.body || data.title || data.what || data.name || '';
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
  if(typeof renderCoderWelcomeBar === 'function') renderCoderWelcomeBar();
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
  try{ renderAll(); }catch(err){ console.error('Render failed:', err); }
  try{ if(typeof OverloadLog !== 'undefined') OverloadLog.init(); }catch(err){ console.error('Overload log init failed:', err); }
  try{ if(typeof GoogleSteps !== 'undefined') GoogleSteps.init(); }catch(err){ console.error('Google steps init failed:', err); }
  try{ HomeCheckIn.init(); }catch(err){ console.error('Home check-in init failed:', err); }
  try{ bindCommunityConsole(); }catch(err){ console.error('Community console failed:', err); }
  try{ if(typeof ViewerWorld !== 'undefined') ViewerWorld.init(); }catch(err){ console.error('Viewer world init failed:', err); }
  try{ initCommunityCommentModal(); }catch(err){ console.error('Community comment modal failed:', err); }
  document.getElementById('toggleCoderNotify')?.addEventListener('click', toggleCoderNotify);
  document.getElementById('coderNotifyBackdrop')?.addEventListener('click', closeCoderNotify);
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
      ${profileStatGroup('Operational', [
        profileStatCell('Days in Shenzhen', stats.szDays, 'since ' + getArrivalDate(), '#ff4fd8'),
        profileStatCell('Days logged', stats.loggedDays, stats.streak ? stats.streak + ' day streak' : 'start a streak', '#9b5cff'),
        profileStatCell('Zones unlocked', stats.unlocked, stats.places + ' places tagged', '#4fa3ff'),
        profileStatCell('Pinboard', stats.pins, 'community signals', '#38bdf8'),
      ].join(''), '#ff4fd8')}

      ${profileStatGroup('Vitals · 7 days', [
        profileStatCell('Current mood', moodLabel(getCurrentMood()), moodIcon(getCurrentMood()) + ' live signal', moodNeon(getCurrentMood())),
        profileStatCell('Steps', stats.week.steps.toLocaleString(), 'this week', '#3ad6e0'),
        profileStatCell('Mandarin', stats.week.mandarin + 'h', 'study hours', '#7c4dff'),
        profileStatCell('Work', stats.week.work + 'h', 'logged', '#e8a87c'),
        profileStatCell('Hobby', stats.week.hobby + 'h', stats.week.people + ' people met', '#a78bfa'),
      ].join(''), '#3ad6e0')}

      ${profileStatGroup('Vitals · 30 days', [
        profileStatCell('Current mood', moodLabel(getCurrentMood()), 'right now', moodNeon(getCurrentMood())),
        profileStatCell('Steps', stats.month.steps.toLocaleString(), 'month total', '#3ad6e0'),
        profileStatCell('Mandarin', stats.month.mandarin + 'h', 'study hours', '#7c4dff'),
        profileStatCell('Work', stats.month.work + 'h', 'logged', '#e8a87c'),
        profileStatCell('Places', stats.month.places, 'discovered this month', '#4fa3ff'),
      ].join(''), '#9b5cff')}

      ${profileStatGroup('All-time totals', [
        profileStatCell('Steps', stats.allTime.steps.toLocaleString(), 'lifetime counter', '#3ad6e0'),
        profileStatCell('Mandarin', getTotalSkillHours('mandarin') + 'h', 'skill matrix + hobby logs', '#7c4dff'),
        profileStatCell('Work', stats.allTime.work + 'h', 'total logged', '#e8a87c'),
        profileStatCell('People', stats.people, 'unique names met', '#e94ff5'),
        profileStatCell('Places', stats.places, 'unique locations', '#4fa3ff'),
        profileStatCell('Overload logs', stats.overloadCount, 'archived sessions', '#f43f8e'),
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
          <p class="gray-xp-meta">${player.points || 0} XP · ${100 - Math.round(grayLvl.progress * 100)} to next level</p>
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
    if(typeof tryCoderLoginFromConsole === 'function' && tryCoderLoginFromConsole(v)){
      if(!isAdmin()) navigateToView(typeof defaultViewForSession === 'function' ? defaultViewForSession() : 'sync');
      resetConsoleInput(input);
      return;
    }
    resetConsoleInput(input);
  });
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
    const body = data.body || data.caption || data.message || '';
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
    if(Object.keys(patch).length) state.entries[metaKey] = { ...state.entries[metaKey], ...patch };

    saveState();
    this.closePulseComposer();
    awardGrayPoints(GRAY_XP_AWARDS.pulse.xp, 'pulse');
    renderHomeCheckIn();
    renderLogCalendar();
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
    renderLogCalendar();
    safeRender(renderAbout);
    document.querySelector('.node-btn[data-view="ledger"]')?.click();
    DailyLog.selectDay(key);
    openDayModal(key);
  },

  renderTimeline(stream, refDayKey){
    const admin = isAdmin();
    if(!stream.nodes.length){
      return `<div class="live-rail-empty">
        <div class="live-rail-spine"></div>
        <p>${admin ? 'Awaiting transmission. Hit ▶ Start day, then drop pulses.' : 'Awaiting transmission. Start day, then pulse updates.'}</p>
      </div>`;
    }
    const sorted = [...stream.nodes].sort((a, b) => (a.at || '').localeCompare(b.at || ''));
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
          const body = node.body && node.body !== node.text ? node.body : '';
          const bodyHtml = body ? `<p class="live-node-body">${esc(body.length > 220 ? body.slice(0, 220) + '…' : body)}</p>` : '';
          const canDel = admin && node.type !== 'wake' && node.type !== 'sleep';
          const delBtn = canDel ? `<button type="button" class="live-node-del" data-live-node-del="${esc(node.id)}" title="Remove pulse">×</button>` : '';
          return `<article class="live-node${canDel ? ' is-editable' : ''}" style="--ln-neon:${meta.neon}">
            <div class="live-node-marker" title="${meta.label}">
              <span class="live-node-glow"></span>
              <span class="live-node-core"></span>
            </div>
            <div class="live-node-card">
              <div class="live-node-top">
                <time class="live-node-time">${fmtNodeStamp(node.at, refDayKey)}</time>
                <span class="live-node-type">${meta.icon} ${meta.label}</span>
                ${moodBadge}
                ${gap ? `<span class="live-node-gap">Δ ${gap}</span>` : ''}
                ${delBtn}
              </div>
              <p class="live-node-text">${esc(node.text || '')}</p>
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

  renderLiveTodos(admin){
    const todos = state.liveTodos || [];
    if(!todos.length && !admin){
      return `<section class="live-todo-board viewer-todo-board">
        <h3 class="live-todo-title">Gray's to-do list</h3>
        <p class="live-todo-hint">Nothing queued yet — check back for live missions.</p>
      </section>`;
    }
    const rows = todos.map(t => {
      const subs = (t.subtasks || []).map(s => `
        <li class="live-todo-sub ${s.done ? 'is-done' : ''}">
          ${admin ? `<input type="checkbox" data-live-sub="${esc(t.id)}" data-live-sub-id="${esc(s.id)}" ${s.done ? 'checked' : ''}>` : `<span class="live-todo-check ${s.done ? 'done' : ''}">${s.done ? '✓' : '○'}</span>`}
          ${admin ? `<input type="text" class="live-todo-sub-input" data-live-sub-text="${esc(t.id)}" data-live-sub-id="${esc(s.id)}" value="${esc(s.text)}">` : `<span>${esc(s.text)}</span>`}
          ${admin ? `<button type="button" class="live-todo-del" data-live-sub-del="${esc(t.id)}" data-live-sub-id="${esc(s.id)}" title="Remove">×</button>` : ''}
        </li>`).join('');
      return `<li class="live-todo-item ${t.done ? 'is-done' : ''}">
        <div class="live-todo-row">
          ${admin ? `<input type="checkbox" data-live-todo="${esc(t.id)}" ${t.done ? 'checked' : ''}>` : `<span class="live-todo-check ${t.done ? 'done' : ''}">${t.done ? '✓' : '○'}</span>`}
          ${admin ? `<input type="text" class="live-todo-input" data-live-todo-text="${esc(t.id)}" value="${esc(t.text)}">` : `<strong class="live-todo-label">${esc(t.text)}</strong>`}
          ${admin ? `<button type="button" class="live-todo-del" data-live-todo-del="${esc(t.id)}" title="Remove">×</button>` : ''}
        </div>
        ${subs ? `<ul class="live-todo-subs">${subs}</ul>` : ''}
        ${admin ? `<button type="button" class="btn live-todo-add-sub" data-live-add-sub="${esc(t.id)}">+ sub-task</button>` : ''}
      </li>`;
    }).join('');
    return `<section class="live-todo-board ${admin ? 'admin-todo-board' : 'viewer-todo-board'}">
      <div class="live-todo-head">
        <h3 class="live-todo-title">Gray's to-do list</h3>
        <p class="live-todo-hint">${admin ? 'Tick items to broadcast on the neon timeline. Viewers see this list read-only.' : 'What Gray is working through today — completed items light up on the transmission log.'}</p>
      </div>
      <ul class="live-todo-list">${rows || `<li class="empty-hint">No items yet.</li>`}</ul>
      ${admin ? `<div class="live-todo-compose">
        <input type="text" id="liveTodoNew" placeholder="Add a to-do…">
        <button type="button" class="btn primary" id="liveTodoAdd">Add</button>
      </div>` : ''}
    </section>`;
  },

  bindLiveTodos(spread){
    spread.querySelector('#liveTodoAdd')?.addEventListener('click', () => this.addLiveTodo());
    spread.querySelector('#liveTodoNew')?.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); this.addLiveTodo(); }
    });
    spread.querySelectorAll('[data-live-todo]').forEach(cb => {
      cb.addEventListener('change', () => this.toggleLiveTodo(cb.dataset.liveTodo, cb.checked));
    });
    spread.querySelectorAll('[data-live-sub]').forEach(cb => {
      cb.addEventListener('change', () => this.toggleLiveSubtask(cb.dataset.liveSub, cb.dataset.liveSubId, cb.checked));
    });
    spread.querySelectorAll('[data-live-todo-text]').forEach(inp => {
      inp.addEventListener('change', () => this.updateLiveTodoText(inp.dataset.liveTodoText, inp.value));
    });
    spread.querySelectorAll('[data-live-sub-text]').forEach(inp => {
      inp.addEventListener('change', () => this.updateLiveSubtaskText(inp.dataset.liveSubText, inp.dataset.liveSubId, inp.value));
    });
    spread.querySelectorAll('[data-live-todo-del]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteLiveTodo(btn.dataset.liveTodoDel));
    });
    spread.querySelectorAll('[data-live-sub-del]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteLiveSubtask(btn.dataset.liveSubDel, btn.dataset.liveSubId));
    });
    spread.querySelectorAll('[data-live-add-sub]').forEach(btn => {
      btn.addEventListener('click', () => this.addLiveSubtask(btn.dataset.liveAddSub));
    });
  },

  addLiveTodo(){
    if(!isAdmin()) return;
    const inp = document.getElementById('liveTodoNew');
    const text = inp?.value?.trim();
    if(!text) return;
    if(!state.liveTodos) state.liveTodos = [];
    state.liveTodos.push({ id: uid('todo'), text, done: false, subtasks: [] });
    saveState();
    inp.value = '';
    renderHomeCheckIn();
  },

  addLiveSubtask(todoId){
    if(!isAdmin()) return;
    const text = prompt('Sub-task:')?.trim();
    if(!text) return;
    const t = (state.liveTodos || []).find(x => x.id === todoId);
    if(!t) return;
    if(!t.subtasks) t.subtasks = [];
    t.subtasks.push({ id: uid('sub'), text, done: false });
    saveState();
    renderHomeCheckIn();
  },

  updateLiveTodoText(todoId, text){
    if(!isAdmin()) return;
    const t = (state.liveTodos || []).find(x => x.id === todoId);
    if(!t) return;
    t.text = text.trim() || t.text;
    saveState();
  },

  updateLiveSubtaskText(todoId, subId, text){
    if(!isAdmin()) return;
    const t = (state.liveTodos || []).find(x => x.id === todoId);
    const s = t?.subtasks?.find(x => x.id === subId);
    if(!s) return;
    s.text = text.trim() || s.text;
    saveState();
  },

  deleteLiveTodo(todoId){
    if(!isAdmin()) return;
    state.liveTodos = (state.liveTodos || []).filter(x => x.id !== todoId);
    saveState();
    renderHomeCheckIn();
  },

  deleteLiveSubtask(todoId, subId){
    if(!isAdmin()) return;
    const t = (state.liveTodos || []).find(x => x.id === todoId);
    if(!t?.subtasks) return;
    t.subtasks = t.subtasks.filter(s => s.id !== subId);
    saveState();
    renderHomeCheckIn();
  },

  pushTodoTimelineNode(label, parent){
    const key = todayKey();
    const stream = getDayStream(key);
    const now = new Date().toISOString();
    stream.nodes.push({
      id: 'n-todo-' + Date.now(),
      at: now,
      type: 'todo',
      text: label,
      body: parent ? `Part of: ${parent}` : '',
    });
    if(!state.entries[key]) state.entries[key] = {};
    state.entries[key].stream = stream;
  },

  toggleLiveTodo(todoId, done){
    if(!isAdmin()) return;
    const t = (state.liveTodos || []).find(x => x.id === todoId);
    if(!t || t.done === done) return;
    t.done = done;
    t.doneAt = done ? new Date().toISOString() : null;
    if(done) this.pushTodoTimelineNode(t.text);
    if(done) awardGrayPoints(GRAY_XP_AWARDS.todo_done.xp, 'todo_done');
    saveState();
    renderHomeCheckIn();
  },

  toggleLiveSubtask(todoId, subId, done){
    if(!isAdmin()) return;
    const t = (state.liveTodos || []).find(x => x.id === todoId);
    const s = t?.subtasks?.find(x => x.id === subId);
    if(!s || s.done === done) return;
    s.done = done;
    s.doneAt = done ? new Date().toISOString() : null;
    if(done) this.pushTodoTimelineNode(s.text, t?.text);
    saveState();
    renderHomeCheckIn();
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
  const nodeCount = stream.nodes.length;
  const onAir = stream.startedAt && !stream.endedAt;

  spread.className = admin ? 'live-broadcast live-broadcast--edit' : 'live-broadcast';

  spread.innerHTML = `
    <aside class="live-rail-col">
      <div class="live-rail-head">
        <span class="live-rail-label">Transmission log</span>
        <span class="live-rail-count">${nodeCount} node${nodeCount === 1 ? '' : 's'}${admin ? ' · edit' : ''}</span>
      </div>
      <div class="live-rail-scroll">${HomeCheckIn.renderTimeline(stream, key)}</div>
    </aside>

    <main class="live-stage-col">
      ${admin ? `<div class="live-edit-banner sketch-card">
        <span class="live-edit-dot" aria-hidden="true"></span>
        <div>
          <p class="live-edit-kicker">Player Gray · edit mode</p>
          <p class="live-edit-text">Start your day, edit the to-do list, drop pulses. Viewers see updates on the transmission log — tap × on a pulse to remove it.</p>
        </div>
      </div>` : ''}

      <div class="live-on-air ${onAir ? 'is-live' : ''}">
        <span class="live-on-air-dot"></span>
        <span class="live-on-air-text">${onAir ? 'ON AIR' : 'OFF AIR'} · Coming To You Live</span>
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

      ${admin ? `<section class="live-pulse-board live-pulse-board--edit">
        <div class="live-pulse-head">
          <div>
            <h3 class="live-pulse-title">Drop a pulse</h3>
            <p class="live-pulse-hint">Person, place, and hobby pulses use your card library — pick existing or create new on the spot.</p>
          </div>
          <button type="button" class="btn primary" id="homeOpenPulse">+ Compose pulse</button>
        </div>
        <div class="live-pulse-quick">
          ${['note','photo','mood','food','person','place','message','song','vibe','anxiety','win','travel','health'].map(id => {
            const meta = STREAM_NODE_META[id];
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

function buildDayDetailHTML(key, e){
  const n = normalizeEntry(e);
  const stream = getDayStream(key);
  const hasContent = !!(resolveEntryMood(n) || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length || stream.nodes.length || n.dayReflection?.favoriteThing);
  if(!hasContent){
    return '<p class="empty-day">No entry yet — start a day, drop pulses, then seal it in the log.</p>';
  }
  const moodId = resolveEntryMood(n);
  const completed = !!stream.endedAt;
  const duration = fmtDayDuration(stream) || fmtDurationMs(n.daySummary?.durationMs);
  const nodeCount = stream.nodes.length;
  const deltas = n.daySummary?.deltas?.length ? n.daySummary.deltas : computeDayScoreDeltas(key);
  const hobbyLine = n.hobby ? `${esc(n.hobby)}${n.hobbyHours ? ` · ${n.hobbyHours}h` : ''}` : '';

  let html = `<div class="day-ledger">
    <header class="day-ledger-hero" style="--mc:${moodColor(moodId)}">
      <span class="day-ledger-status${completed ? ' is-sealed' : ''}">${completed ? '◉ Day sealed' : '◎ In progress'}</span>
      <span class="day-detail-date">${fmtDateLong(key)}</span>
      ${moodId ? `<span class="day-detail-mood">${moodIcon(moodId)} ${esc(moodLabel(moodId))}</span>` : ''}
      ${stream.startedAt ? `<span class="day-ledger-span">Wake ${fmtNodeStamp(stream.startedAt, key)}${stream.endedAt ? ` → Sleep ${fmtNodeStamp(stream.endedAt, key)}` : ''}</span>` : ''}
      ${duration ? `<span class="day-ledger-duration">${duration} awake</span>` : ''}
    </header>

    ${renderDayScoreChips(deltas)}
    ${renderDayReflectionHTML(n.dayReflection)}

    ${stream.nodes.length ? `<section class="day-ledger-timeline">
      <div class="day-rail-wrap">
        <div class="day-rail-head">
          <span class="live-rail-label">Neon transmission</span>
          <span class="live-rail-count">${nodeCount} node${nodeCount === 1 ? '' : 's'}</span>
        </div>
        <div class="day-rail-scroll">${HomeCheckIn.renderTimeline(stream, key)}</div>
      </div>
    </section>` : ''}

    <section class="day-detail-section">
      <h4>Day totals</h4>
      <div class="day-log-template">
        ${moodId ? `<div class="dlt-row"><span>Current mood</span><span>${moodIcon(moodId)} ${esc(moodLabel(moodId))}</span></div>`:''}
        ${n.steps ? `<div class="dlt-row"><span>Steps</span><span>${Number(n.steps).toLocaleString()}</span></div>`:''}
        ${n.workHours ? `<div class="dlt-row"><span>Work (hours)</span><span>${n.workHours}h</span></div>`:''}
        ${mandarinHoursFromEntry(n) ? `<div class="dlt-row"><span>Mandarin (hobby+skill)</span><span>${mandarinHoursFromEntry(n)}h</span></div>`:''}
        ${hobbyLine ? `<div class="dlt-row"><span>Hobby</span><span>${hobbyLine}</span></div>`:''}
        ${n.people.length ? `<div class="dlt-row"><span>People met</span><span>${esc(n.people.join(', '))}</span></div>`:''}
        ${n.places.length ? `<div class="dlt-row"><span>Places visited</span><span>${esc(n.places.join(', '))}</span></div>`:''}
      </div>
    </section>`;

  if(n.diary) html += `<section class="day-detail-section"><h4>Diary entry</h4><p class="day-diary">${esc(n.diary)}</p></section>`;
  if(n.photos?.length){
    html += `<section class="day-detail-section"><h4>Photos</h4><div class="day-photo-grid">${n.photos.map(p=>
      `<img src="${esc(typeof p==='string'?p:p.src)}" alt="">`).join('')}</div></section>`;
  }
  html += `</div>`;
  return html;
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
    const isComplete = !!stream.endedAt;
    const hasEntry = !!(e && (isComplete || resolveEntryMood(n) || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length || stream.nodes.length));
    const moodId = resolveEntryMood(n);
    const neon = stableNeon(key, d);
    const isToday = key === tk;
    const isEditing = isAdmin() && key === DailyLog.activeKey;
    html += `<button type="button" class="cal-cell cal-day${hasEntry ? ' has-entry' : ''}${isComplete ? ' is-complete' : ''}${isToday ? ' is-today' : ''}${isEditing ? ' is-editing-day' : ''}"
      style="--cal-neon:${neon}" data-log-day="${key}">
      <span class="cal-day-num">${d}</span>
      ${hasEntry && moodId ? `<span class="cal-mood">${moodIcon(moodId)}</span>` : ''}
      ${hasEntry ? `<span class="cal-dot"></span>` : ''}
    </button>`;
  }

  grid.innerHTML = html;
}

function renderLedger(){
  renderLogCalendar();
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
  renderLogCalendar();
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

function renderCharacters(){
  const deck = document.getElementById('charDeck');
  if(!deck) return;
  const chars = getCharacters();
  deck.innerHTML = chars.map((c, i) => buildFlipPlayerCard(c, 'character', i)).join('');
  bindFlipPlayerCards(deck);
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

  const byType = {};
  dramas.forEach(d => {
    const t = d.mediaType || 'tv';
    if(!byType[t]) byType[t] = [];
    byType[t].push(d);
  });

  deck.innerHTML = MEDIA_SECTION_ORDER.map((type, si) => {
    const items = byType[type];
    if(!items?.length) return '';
    const mt = getMediaType(type);
    const cards = items.map((d, i) => {
      const pct = d.totalEpisodes ? Math.round((d.currentEpisode/d.totalEpisodes)*100) : 0;
      const ratingDots = computeShowRatingDots(d, stableNeon(d.id, 1));
      const reviewed = Object.keys(d.episodes||{}).length;
      const neon = stableNeon(d.id, i + si);
      const country = type === 'tv' && d.country ? `<span class="drama-country">${esc(d.country)}</span>` : '';
      return `<article class="drama-card media-card status-${d.status}" style="--drot:${((i % 5) * 0.6 - 1.2).toFixed(1)}deg;--media-neon:${neon}" data-drama-id="${esc(d.id)}">
        <div class="drama-card-art">${d.image?`<img src="${esc(d.image)}" alt="">`:`<span class="drama-art-ph">${esc(d.title.charAt(0))}</span>`}</div>
        <div class="drama-card-body">
          <div class="drama-card-top"><span class="drama-status">${esc(mt.label)} · ${d.status}</span>${country}${ratingDots || ''}</div>
          <h3 class="drama-card-title">${esc(d.title)}</h3>
          <div class="drama-card-genre">${esc(d.genre||'')}</div>
          <div class="drama-ep-track"><span class="drama-ep-label">${mt.unit} ${d.currentEpisode}/${d.totalEpisodes} · ${reviewed} rated</span>
            <div class="drama-ep-bar"><div style="width:${pct}%"></div></div></div>
          ${d.finalReview ? `<p class="drama-card-review">${esc(d.finalReview.slice(0, 90))}${d.finalReview.length > 90 ? '…' : ''}</p>` : ''}
        </div></article>`;
    }).join('');
    return `<section class="media-type-section" style="--mts-neon:${stableNeon(type, 2)}">
      <h3 class="media-type-title">${mt.label}</h3>
      ${typeof renderCategoryRecommendationsHtml === 'function' ? renderCategoryRecommendationsHtml(type, mt.label) : ''}
      <div class="drama-deck media-type-deck">${cards}</div>
    </section>`;
  }).join('');

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
function renderPress(){
  const spread = document.getElementById('pressSpread');
  if(!spread) return;
  const articles = getArticles();
  const recs = typeof renderCategoryRecommendationsHtml === 'function'
    ? renderCategoryRecommendationsHtml('press', 'The Press')
    : '';
  spread.innerHTML = recs + articles.map((a, i) => {
    const neon = stableNeon(a.id, i);
    return `
    <article class="manga-panel ${a.layout||'note'}" style="--panel-neon:${neon}" data-article-id="${esc(a.id)}">
      <div class="manga-section">${esc(a.section)}</div>
      <h3 class="manga-headline">${esc(a.title)}</h3>
      <div class="manga-date">${esc(a.date)}</div>
      ${a.image?`<div class="manga-panel-image"><img src="${esc(a.image)}" alt="" loading="lazy"></div>`:''}
      <p class="manga-excerpt">${esc(a.excerpt)}</p>
      ${isAdmin() ? '<span class="panel-edit-hint">click to edit</span>' : ''}
    </article>`;
  }).join('');

  spread.querySelectorAll('.manga-panel').forEach(p => {
    p.addEventListener('click', () => {
      const a = articles.find(x => x.id === p.dataset.articleId);
      if(!a) return;
      if(isAdmin()) openContentEditor('article', a.id, false);
      else {
        const commentBtn = canCommunityInteract()
          ? `<div class="article-comment-row"><button type="button" class="btn community-comment-btn" data-cc-type="press" data-cc-id="${esc(a.id)}" data-cc-label="${esc(a.title)}">↩ Comment on Community</button></div>`
          : '';
        document.getElementById('articleModalContent').innerHTML = `
          <div class="manga-section">${esc(a.section)} · ${esc(a.date)}</div>
          <h2 class="article-full-headline">${esc(a.title)}</h2>
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
  document.getElementById('communityCommentHint').textContent = 'Posts to the Community board — Gray sees it there, even though you commented from here.';
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
    if(typeof logCoderActivity === 'function'){
      logCoderActivity(author.characterId ? 'community_post' : 'community_post', {
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
function normalizePinPost(p){
  return {
    id: p.id,
    name: p.name || 'Anonymous',
    characterId: p.characterId || '',
    location: p.location || p.from || 'Unknown',
    text: p.text || '',
    photo: p.photo || '',
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
  const posts = (state.pinboard || []).map(normalizePinPost);
  if(!posts.length){
    const canPost = isAdmin() || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());
    wall.innerHTML = `<p class="empty-hint pin-empty">${canPost ? 'Be the first to leave a note on the board.' : 'Log in to post on the board.'}</p>`;
    return;
  }

  const canReply = isAdmin() || (typeof isCoderLoggedIn === 'function' && isCoderLoggedIn());

  wall.innerHTML = posts.slice().reverse().map((p, i) => {
    const rot = [-1.5, 1.2, -0.8, 1.8, -1][i % 5];
    const replies = (p.replies || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return `<article class="pin-post community-pin" style="--prot:${rot}deg" data-pin-id="${esc(p.id)}">
      <header class="pin-post-head">
        <div class="pin-meta-block">
          ${pinAuthorBlock(p)}
          <span class="pin-location">📍 ${esc(p.location)}</span>
          <time class="pin-time">${esc(fmtPinDateTime(p.time))}</time>
        </div>
        ${p.sourceLabel ? `<span class="pin-source-ref">↩ on ${esc(p.sourceType || 'post')}: ${esc(p.sourceLabel)}</span>` : ''}
        ${isAdmin() ? `<button type="button" class="pin-delete" data-pin="${esc(p.id)}" title="Remove">×</button>` : ''}
      </header>
      ${p.photo ? `<div class="pin-photo"><img src="${esc(p.photo)}" alt="" loading="lazy"></div>` : ''}
      <p class="pin-text">${esc(p.text)}</p>
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
}

document.getElementById('pinForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const author = pinSessionAuthor();
  if(!author){ alert(isAdmin() ? 'Something went wrong — try exiting and re-entering Player Gray mode.' : 'Log in to your card to post.'); return; }
  const location = document.getElementById('pinLocation').value.trim();
  const text = document.getElementById('pinText').value.trim();
  const file = document.getElementById('pinPhoto').files[0];
  if(!location || !text) return;

  const addPost = (photo) => {
    state.pinboard.push({
      id: 'pin-' + Date.now(),
      name: author.name,
      characterId: author.characterId,
      location, text,
      photo: photo || '',
      time: new Date().toISOString(),
      replies: [],
    });
    saveState();
    if(typeof logCoderActivity === 'function'){
      logCoderActivity(author.characterId ? 'community_post' : 'community_post', {
        coderId: author.characterId || '',
        name: author.name,
        detail: `${author.name} posted on Community`,
      });
    }
    LiveSync?.pinPosted(author.name, location);
    document.getElementById('pinForm').reset();
    renderPinboard();
  };

  if(file){
    const reader = new FileReader();
    reader.onload = () => addPost(reader.result);
    reader.readAsDataURL(file);
  } else addPost('');
});

/* ---------- Admin ---------- */
document.getElementById('adminUnlock')?.addEventListener('click', () => document.getElementById('adminModalBack').classList.remove('hidden'));
document.getElementById('cancelAdmin')?.addEventListener('click', () => document.getElementById('adminModalBack').classList.add('hidden'));
document.getElementById('confirmAdmin')?.addEventListener('click', () => {
  if(document.getElementById('adminKeyInput').value === ADMIN_KEY){
    document.getElementById('adminModalBack').classList.add('hidden');
    unlockAdmin({ toast: false });
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
