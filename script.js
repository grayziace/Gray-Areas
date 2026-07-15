/* ===== Gray Areas ===== */

const STORAGE_KEY = 'gray-areas-shenzhen-v6';

function checkAdminFromUrl(){
  const key = new URLSearchParams(location.search).get('key');
  if(key && key === ADMIN_KEY){
    sessionStorage.setItem('ga-admin', '1');
    history.replaceState({}, '', location.pathname);
    queueMicrotask(() => unlockAdmin({ toast: false }));
  }
}
function isAdmin(){ return sessionStorage.getItem('ga-admin') === '1'; }

function applyAdminUI(){
  const admin = isAdmin();
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('hidden', !admin));
  document.getElementById('adminBar')?.classList.toggle('hidden', !admin);
  document.getElementById('adminUnlock')?.classList.toggle('hidden', admin);
  document.body.classList.toggle('is-editing', admin);
  if(admin && typeof DailyLog !== 'undefined') DailyLog.onAdminReady();
  else if(admin) renderSkillControls();
}

function lockAdmin(){
  sessionStorage.removeItem('ga-admin');
  applyAdminUI();
  renderAll();
  const toast = document.getElementById('editToast');
  if(toast){
    toast.textContent = 'Viewing.';
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); toast.textContent = 'Editing.'; }, 2200);
  }
}

checkAdminFromUrl();

function unlockAdmin(opts = {}){
  sessionStorage.setItem('ga-admin', '1');
  applyAdminUI();
  renderAll();
  if(opts.toast !== false){
    const toast = document.getElementById('editToast');
    toast?.classList.remove('hidden');
    setTimeout(() => toast?.classList.add('hidden'), 2200);
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
  if(Array.isArray(s.overloadLogs)) state.overloadLogs = s.overloadLogs;
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
  if(state.content?.player && typeof state.content.player === 'object'){
    const p = state.content.player;
    return {
      ...base,
      ...p,
      bio: p.bio ?? state.bio ?? CONTENT.player.bio,
      pokeCard: { ...(CONTENT.player.pokeCard || {}), ...(p.pokeCard || {}) },
    };
  }
  return base;
}

function getContentList(key, fallback){
  if(state.content && Array.isArray(state.content[key]) && state.content[key].length){
    return state.content[key];
  }
  return fallback;
}

function getCharacters(){
  return getContentList('characters', [...CONTENT.characters, ...(state.runtimeCharacters || [])]);
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
  ensureContentState();

  if(type === 'player'){
    state.content.player = { ...state.content.player, ...data };
  } else if(type === 'character'){
    if(!data.name) return;
    if(id){
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
  pendingContentImage = null;
  pendingSpiritImage = null;
  document.getElementById('contentEditBack').classList.add('hidden');
  document.getElementById('cardModalBack')?.classList.add('hidden');
  renderAll();
}

function deleteContentItem(type, id){
  if(!id || !confirm('Delete this?')) return;
  ensureContentState();

  if(type === 'character') state.content.characters = state.content.characters.filter(c => c.id !== id);
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

    document.getElementById('logMood')?.addEventListener('input', e => {
      document.getElementById('logMoodVal').textContent = e.target.value;
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
    document.getElementById('logMood').value = n.mood || 7;
    document.getElementById('logMoodVal').textContent = n.mood || 7;
    document.getElementById('logSteps').value = n.steps || 0;
    document.getElementById('logWork').value = n.workHours || 0;
    document.getElementById('logMandarin').value = n.mandarinHours || 0;
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

    const existing = state.entries[key] || {};
    state.entries[key] = {
      mood: document.getElementById('logMood').value,
      steps: document.getElementById('logSteps').value,
      workHours: document.getElementById('logWork').value,
      mandarinHours: document.getElementById('logMandarin').value,
      hobby: document.getElementById('logHobbySelect').value,
      hobbyHours: document.getElementById('logHobbyHours').value,
      people,
      places,
      diary: document.getElementById('logDiary').value,
      photos: pendingDayPhotos,
      stream: existing.stream || null,
    };

    places.forEach(z => { if(!state.unlockedZones.includes(z)) state.unlockedZones.push(z); });
    saveState();
    document.getElementById('logEditHint').textContent = `Saved ${fmtDateLong(key)}`;
    renderLogCalendar();
    renderHomeCheckIn();
  },

  deleteDay(){
    const key = this.currentKey();
    if(!key || !confirm(`Delete the log for ${fmtDateLong(key)}?`)) return;
    delete state.entries[key];
    saveState();
    pendingDayPhotos = [];
    this.activeKey = key;
    document.getElementById('logDateKey').value = key;
    document.getElementById('logMood').value = 7;
    document.getElementById('logMoodVal').textContent = '7';
    document.getElementById('logSteps').value = 0;
    document.getElementById('logWork').value = 0;
    document.getElementById('logMandarin').value = 0;
    document.getElementById('logPeople').value = '';
    document.getElementById('logPlaces').value = '';
    document.getElementById('logDiary').value = '';
    document.getElementById('logHobbySelect').value = '';
    document.getElementById('logHobbyHours').value = 0;
    document.getElementById('logZone').value = '';
    this.renderPhotoPreview();
    document.getElementById('logEditHint').textContent = `Deleted ${fmtDateLong(key)}`;
    document.getElementById('logEditorTitle').textContent = fmtDateLong(key);
    renderLogCalendar();
    renderHomeCheckIn();
    safeRender(renderAbout);
  },

  clearSelection(){
    this.activeKey = null;
    document.getElementById('logDateKey').value = '';
    document.getElementById('logEditHint').textContent = 'Click any day to edit it';
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
  const n = Number(m);
  if(n >= 9) return 'On fire';
  if(n >= 7) return 'Solid';
  if(n >= 5) return 'Fine';
  if(n >= 3) return 'Meh';
  return 'Rough';
}

function moodColor(m){
  const n = Number(m);
  if(n >= 8) return '#3ad6e0';
  if(n >= 5) return '#9b5cff';
  return '#ff4fd8';
}

function normalizeEntry(e){
  if(!e) return {};
  const people = e.people || (e.person ? [e.person] : []);
  const places = e.places || (e.zone ? [e.zone] : []);
  return {
    mood: e.mood,
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

const STREAM_NODE_META = {
  wake: { label: 'Wake', neon: '#6ee7a0', icon: '◉' },
  sleep: { label: 'Sleep', neon: '#71717a', icon: '◎' },
  song: { label: 'Song', neon: '#f472b6', icon: '♫' },
  book: { label: 'Book', neon: '#a78bfa', icon: '▣' },
  film: { label: 'Film', neon: '#f43f8e', icon: '▶' },
  note: { label: 'Note', neon: '#3ad6e0', icon: '◆' },
};

function fmtClockTime(tz){
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function fmtNodeTime(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function streamDiaryDraft(nodes){
  return nodes
    .filter(n => n.type !== 'wake' && n.type !== 'sleep')
    .map(n => `[${fmtNodeTime(n.at)}] ${STREAM_NODE_META[n.type]?.label || n.type}: ${n.text}`)
    .join('\n');
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

/* ---------- Skills ---------- */
function getHobbyNamesForSkill(skill){
  if(!skill || skill.id === 'mandarin') return [];
  if(Array.isArray(skill.hobbyNames) && skill.hobbyNames.length) return skill.hobbyNames.filter(Boolean);
  if(skill.hobbyLabel) return [skill.hobbyLabel];
  return [skill.name];
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
    if(skillId === 'mandarin') hrs += Number(e.mandarinHours) || 0;
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
    document.querySelectorAll('.node-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view)?.classList.add('active');
  });
}

function bootApp(){
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
  try{ HomeCheckIn.init(); }catch(err){ console.error('Home check-in init failed:', err); }
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
    return n.mood || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length;
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
    const active = n.mood || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length;
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
    mandarin: sum(e => Number(e.mandarinHours) || 0),
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
    recents.pin ? { label: 'Pinboard', text: `${recents.pin.name}: ${(recents.pin.text||'').slice(0, 50)}`, view: 'comm' } : null,
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
          <span class="profile-id-chip" style="--pic-neon:#ff4fd8">LV ${pc.level || 1}</span>
          ${pc.mbti ? `<span class="profile-id-chip" style="--pic-neon:#3ad6e0">${esc(pc.mbti)}</span>` : ''}
          ${pc.vibe ? `<span class="profile-id-chip profile-id-wide" style="--pic-neon:#9b5cff">${esc(pc.vibe)}</span>` : ''}
          <span class="profile-id-chip" style="--pic-neon:#4fa3ff">${esc(player.from)} → Shenzhen</span>
        </div>
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
        profileStatCell('Avg mood', stats.week.avgMood, stats.week.days + ' active days', '#f472b6'),
        profileStatCell('Steps', stats.week.steps.toLocaleString(), 'this week', '#3ad6e0'),
        profileStatCell('Mandarin', stats.week.mandarin + 'h', 'study hours', '#7c4dff'),
        profileStatCell('Work', stats.week.work + 'h', 'logged', '#e8a87c'),
        profileStatCell('Hobby', stats.week.hobby + 'h', stats.week.people + ' people met', '#a78bfa'),
      ].join(''), '#3ad6e0')}

      ${profileStatGroup('Vitals · 30 days', [
        profileStatCell('Avg mood', stats.month.avgMood, 'rolling month', '#f472b6'),
        profileStatCell('Steps', stats.month.steps.toLocaleString(), 'month total', '#3ad6e0'),
        profileStatCell('Mandarin', stats.month.mandarin + 'h', 'study hours', '#7c4dff'),
        profileStatCell('Work', stats.month.work + 'h', 'logged', '#e8a87c'),
        profileStatCell('Places', stats.month.places, 'discovered this month', '#4fa3ff'),
      ].join(''), '#9b5cff')}

      ${profileStatGroup('All-time totals', [
        profileStatCell('Steps', stats.allTime.steps.toLocaleString(), 'lifetime counter', '#3ad6e0'),
        profileStatCell('Mandarin', stats.allTime.mandarin + 'h', 'total study', '#7c4dff'),
        profileStatCell('Work', stats.allTime.work + 'h', 'total logged', '#e8a87c'),
        profileStatCell('People', stats.people, 'unique names met', '#e94ff5'),
        profileStatCell('Places', stats.places, 'unique locations', '#4fa3ff'),
        profileStatCell('Best mood', stats.bestMood ? stats.bestMood.mood + '/10' : '—', stats.bestMood ? fmtDate(stats.bestMood.key) : '', '#6ee7a0'),
        profileStatCell('Low mood', stats.lowMood ? stats.lowMood.mood + '/10' : '—', stats.lowMood ? fmtDate(stats.lowMood.key) : '', '#f43f8e'),
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
}

/* ---------- Home Check-In — live day stream ---------- */
const HomeCheckIn = {
  clockTimer: null,
  inited: false,

  init(){
    if(this.inited) return;
    this.inited = true;
    document.getElementById('closeEndDay')?.addEventListener('click', () => this.closeEndDay());
    document.getElementById('cancelEndDay')?.addEventListener('click', () => this.closeEndDay());
    document.getElementById('saveEndDay')?.addEventListener('click', () => this.saveEndDay());
    document.getElementById('endMood')?.addEventListener('input', e => {
      document.getElementById('endMoodVal').textContent = e.target.value;
    });
    document.getElementById('endDayBack')?.addEventListener('click', e => {
      if(e.target.id === 'endDayBack') this.closeEndDay();
    });
    this.startClock();
  },

  bindSpread(spread){
    spread.querySelector('#homeStartDay')?.addEventListener('click', () => this.startDay());
    spread.querySelector('#homeEndDay')?.addEventListener('click', () => this.openEndDay());
    spread.querySelector('#homeAddSong')?.addEventListener('click', () => this.addPulse('song', 'homeSongInput'));
    spread.querySelector('#homeAddBook')?.addEventListener('click', () => this.addPulse('book', 'homeBookInput'));
    spread.querySelector('#homeAddFilm')?.addEventListener('click', () => this.addPulse('film', 'homeFilmInput'));
    spread.querySelector('#homeAddNote')?.addEventListener('click', () => this.addPulse('note', 'homeNoteInput'));
    ['homeSongInput', 'homeBookInput', 'homeFilmInput', 'homeNoteInput'].forEach(id => {
      spread.querySelector('#' + id)?.addEventListener('keydown', e => {
        if(e.key === 'Enter'){
          const map = { homeSongInput: 'song', homeBookInput: 'book', homeFilmInput: 'film', homeNoteInput: 'note' };
          this.addPulse(map[id], id);
        }
      });
    });
  },

  startClock(){
    clearInterval(this.clockTimer);
    const tick = () => {
      const sz = document.getElementById('clockShenzhen');
      const uk = document.getElementById('clockUk');
      if(sz) sz.textContent = fmtClockTime('Asia/Shanghai');
      if(uk) uk.textContent = fmtClockTime('Europe/London');
    };
    tick();
    this.clockTimer = setInterval(tick, 1000);
  },

  addNode(type, text){
    const key = ensureTodayStream();
    const stream = getDayStream(key);
    stream.nodes.push({
      id: 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      at: new Date().toISOString(),
      type,
      text: text.trim(),
    });
    state.entries[key].stream = stream;
    saveState();
    renderHomeCheckIn();
    renderLogCalendar();
  },

  addPulse(type, inputId){
    if(!isAdmin()) return;
    const input = document.getElementById(inputId);
    const text = input?.value?.trim();
    if(!text) return;
    const stream = getDayStream(todayKey());
    if(!stream.startedAt){
      alert('Tap Start day first.');
      return;
    }
    if(stream.endedAt){
      alert('Day already ended. Start a new day tomorrow.');
      return;
    }
    this.addNode(type, text);
    if(input) input.value = '';
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
    }
    const now = new Date().toISOString();
    stream.startedAt = now;
    stream.nodes.push({ id: 'n-wake-' + Date.now(), at: now, type: 'wake', text: 'Day started' });
    state.entries[key].stream = stream;
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
    document.getElementById('endMood').value = n.mood || 7;
    document.getElementById('endMoodVal').textContent = n.mood || 7;
    document.getElementById('endSteps').value = n.steps || 0;
    document.getElementById('endWork').value = n.workHours || 0;
    document.getElementById('endMandarin').value = n.mandarinHours || 0;
    const hobbySel = document.getElementById('endHobbySelect');
    hobbySel.innerHTML = '<option value="">—</option>' + getHobbyOptions().map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join('');
    hobbySel.value = n.hobby || '';
    document.getElementById('endHobbyHours').value = n.hobbyHours || 0;
    document.getElementById('endPeople').value = (n.people || []).join(', ');
    document.getElementById('endPlaces').value = (n.places || []).filter(p => !CONTENT.zones.includes(p)).join(', ');
    const draft = streamDiaryDraft(stream.nodes);
    document.getElementById('endDiary').value = n.diary || draft;
    document.getElementById('endDayBack')?.classList.remove('hidden');
  },

  closeEndDay(){
    document.getElementById('endDayBack')?.classList.add('hidden');
  },

  saveEndDay(){
    if(!isAdmin()) return;
    const key = todayKey();
    const stream = getDayStream(key);
    const now = new Date().toISOString();
    stream.endedAt = now;
    stream.nodes.push({ id: 'n-sleep-' + Date.now(), at: now, type: 'sleep', text: 'Day ended' });
    const people = document.getElementById('endPeople').value.split(',').map(s => s.trim()).filter(Boolean);
    const places = document.getElementById('endPlaces').value.split(',').map(s => s.trim()).filter(Boolean);
    const existing = state.entries[key] || {};
    state.entries[key] = {
      mood: document.getElementById('endMood').value,
      steps: document.getElementById('endSteps').value,
      workHours: document.getElementById('endWork').value,
      mandarinHours: document.getElementById('endMandarin').value,
      hobby: document.getElementById('endHobbySelect').value,
      hobbyHours: document.getElementById('endHobbyHours').value,
      people,
      places,
      diary: document.getElementById('endDiary').value,
      photos: existing.photos || [],
      stream,
    };
    places.forEach(z => { if(z && !state.unlockedZones.includes(z)) state.unlockedZones.push(z); });
    saveState();
    this.closeEndDay();
    renderHomeCheckIn();
    renderLogCalendar();
    safeRender(renderAbout);
    document.querySelector('.node-btn[data-view="ledger"]')?.click();
  },

  renderTimeline(stream){
    if(!stream.nodes.length){
      return '<p class="home-timeline-empty">No pulses yet. Start your day and drop song, book, film, or note updates.</p>';
    }
    const sorted = [...stream.nodes].sort((a, b) => (a.at || '').localeCompare(b.at || ''));
    return `<div class="home-timeline">${sorted.map((node, i) => {
      const meta = STREAM_NODE_META[node.type] || { label: node.type, neon: '#3ad6e0', icon: '•' };
      const next = sorted[i + 1];
      const gap = next && node.at && next.at
        ? Math.round((new Date(next.at) - new Date(node.at)) / 60000) + 'm'
        : '';
      return `<div class="home-node" style="--hn-neon:${meta.neon}">
        <div class="home-node-rail"><span class="home-node-dot"></span><span class="home-node-line"></span></div>
        <div class="home-node-body">
          <div class="home-node-meta">
            <span class="home-node-time">${fmtNodeTime(node.at)}</span>
            <span class="home-node-type">${meta.icon} ${meta.label}</span>
            ${gap ? `<span class="home-node-gap">+${gap}</span>` : ''}
          </div>
          <p class="home-node-text">${esc(node.text || '')}</p>
        </div>
      </div>`;
    }).join('')}</div>`;
  },

  dayStatus(stream){
    if(stream.endedAt) return `Day closed · sleep ${fmtNodeTime(stream.endedAt)}`;
    if(stream.startedAt) return `Day active · wake ${fmtNodeTime(stream.startedAt)}`;
    return 'Day not started';
  },
};

function renderHomeCheckIn(){
  const spread = document.getElementById('homeSpread');
  if(!spread) return;

  const key = todayKey();
  const stream = getDayStream(key);
  const today = normalizeEntry(state.entries[key]);
  const admin = isAdmin();
  const last7 = last7Entries();
  const totalSteps = last7.reduce((s,[,e]) => s + (Number(normalizeEntry(e).steps)||0), 0);
  const avgMood = last7.length ? Math.round(last7.reduce((s,[,e]) => s + (Number(normalizeEntry(e).mood)||0), 0) / last7.length) : null;

  spread.innerHTML = `
    <article class="manga-panel home-clock-panel" style="--panel-neon:#3ad6e0">
      <div class="manga-section">Now</div>
      <div class="home-clocks">
        <div class="home-clock"><span class="home-clock-lbl">Shenzhen</span><span class="home-clock-val" id="clockShenzhen">--:--:--</span></div>
        <div class="home-clock"><span class="home-clock-lbl">UK</span><span class="home-clock-val" id="clockUk">--:--:--</span></div>
      </div>
      <p class="home-day-status">${esc(HomeCheckIn.dayStatus(stream))}</p>
      ${admin ? `<div class="home-day-actions">
        <button type="button" class="btn primary" id="homeStartDay" ${stream.startedAt && !stream.endedAt ? 'disabled' : ''}>Start day</button>
        <button type="button" class="btn" id="homeEndDay" ${!stream.startedAt || stream.endedAt ? 'disabled' : ''}>End day</button>
      </div>` : ''}
    </article>

    ${admin ? `<article class="manga-panel home-pulse-panel admin-only" style="--panel-neon:#f472b6">
      <div class="manga-section">Quick pulse</div>
      <div class="home-pulse-grid">
        <div class="home-pulse-row"><label>♫ Song</label><input type="text" id="homeSongInput" placeholder="track · artist"><button type="button" class="btn" id="homeAddSong">+</button></div>
        <div class="home-pulse-row"><label>▣ Book</label><input type="text" id="homeBookInput" placeholder="title · progress"><button type="button" class="btn" id="homeAddBook">+</button></div>
        <div class="home-pulse-row"><label>▶ Film</label><input type="text" id="homeFilmInput" placeholder="title · ep/scene"><button type="button" class="btn" id="homeAddFilm">+</button></div>
        <div class="home-pulse-row"><label>◆ Note</label><input type="text" id="homeNoteInput" placeholder="quick thought"><button type="button" class="btn" id="homeAddNote">+</button></div>
      </div>
    </article>` : ''}

    <article class="manga-panel home-timeline-panel wide" style="--panel-neon:#9b5cff">
      <div class="manga-section">Today's stream</div>
      ${HomeCheckIn.renderTimeline(stream)}
    </article>

    <article class="manga-panel hero home-hero" style="--panel-neon:${stableNeon('home-hero', 0)}">
      <div class="manga-section">This week</div>
      <h3 class="manga-headline">${avgMood ? moodWord(avgMood) : 'Quiet start'}</h3>
      <div class="home-stat-row">
        <div class="home-stat"><span class="hs-num">${totalSteps.toLocaleString()}</span><span class="hs-lbl">steps</span></div>
        <div class="home-stat"><span class="hs-num">${today.mood || '—'}</span><span class="hs-lbl">mood today</span></div>
      </div>
    </article>`;

  HomeCheckIn.bindSpread(spread);
}

/* ---------- Daily Log — calendar ---------- */
function dayKeyFromParts(y, m, d){
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function buildDayDetailHTML(key, e){
  const n = normalizeEntry(e);
  if(!Object.keys(n).some(k => n[k] && (Array.isArray(n[k])?n[k].length:n[k]))){
    return '<p class="empty-day">No entry yet — log mood, steps, diary, and more.</p>';
  }
  const mood = Number(n.mood);
  const hobbyLine = n.hobby ? `${esc(n.hobby)}${n.hobbyHours ? ` · ${n.hobbyHours}h` : ''}` : '';
  let html = `<div class="day-detail-header" style="--mc:${moodColor(mood)}">
    <span class="day-detail-date">${fmtDateLong(key)}</span>
    ${mood ? `<span class="day-detail-mood">${mood}/10 · ${moodWord(mood)}</span>` : ''}
  </div>
  <div class="day-log-template">
    ${mood ? `<div class="dlt-row"><span>Mood (1–10)</span><span>${mood}/10</span></div>`:''}
    ${n.steps ? `<div class="dlt-row"><span>Steps</span><span>${Number(n.steps).toLocaleString()}</span></div>`:''}
    ${n.workHours ? `<div class="dlt-row"><span>Work (hours)</span><span>${n.workHours}h</span></div>`:''}
    ${n.mandarinHours ? `<div class="dlt-row"><span>Mandarin (hours)</span><span>${n.mandarinHours}h</span></div>`:''}
    ${hobbyLine ? `<div class="dlt-row"><span>Hobby</span><span>${hobbyLine}</span></div>`:''}
    ${n.people.length ? `<div class="dlt-row"><span>People met</span><span>${esc(n.people.join(', '))}</span></div>`:''}
    ${n.places.length ? `<div class="dlt-row"><span>Places visited</span><span>${esc(n.places.join(', '))}</span></div>`:''}
  </div>`;
  if(n.diary) html += `<div class="day-detail-section"><h4>Diary entry</h4><p class="day-diary">${esc(n.diary)}</p></div>`;
  const stream = e.stream || n.stream;
  if(stream?.nodes?.length){
    html += `<div class="day-detail-section"><h4>Day stream</h4><div class="day-stream-mini">`;
    [...stream.nodes].sort((a,b) => (a.at||'').localeCompare(b.at||'')).forEach(node => {
      const meta = STREAM_NODE_META[node.type] || { label: node.type, neon: '#3ad6e0' };
      html += `<div class="dsm-row" style="--dsm-neon:${meta.neon}"><span>${fmtNodeTime(node.at)}</span><span>${meta.label}</span><span>${esc(node.text||'')}</span></div>`;
    });
    html += `</div></div>`;
  }
  if(n.photos?.length){
    html += `<div class="day-detail-section"><h4>Photos</h4><div class="day-photo-grid">${n.photos.map(p=>
      `<img src="${esc(typeof p==='string'?p:p.src)}" alt="">`).join('')}</div></div>`;
  }
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
    const hasEntry = !!(e && (n.mood || n.steps || n.diary || n.people?.length || n.places?.length || n.photos?.length));
    const neon = stableNeon(key, d);
    const isToday = key === tk;
    const isEditing = isAdmin() && key === DailyLog.activeKey;
    html += `<button type="button" class="cal-cell cal-day${hasEntry ? ' has-entry' : ''}${isToday ? ' is-today' : ''}${isEditing ? ' is-editing-day' : ''}"
      style="--cal-neon:${neon}" data-log-day="${key}">
      <span class="cal-day-num">${d}</span>
      ${hasEntry && n.mood ? `<span class="cal-mood">${n.mood}</span>` : ''}
      ${hasEntry ? `<span class="cal-dot"></span>` : ''}
    </button>`;
  }

  grid.innerHTML = html;
}

function renderLedger(){
  renderLogCalendar();
}

function openDayModal(key){
  const e = state.entries[key];
  document.getElementById('dayModalTitle').textContent = fmtDateLong(key);
  const detailEl = document.getElementById('dayDetailView');
  detailEl.classList.remove('hidden');
  detailEl.innerHTML = buildDayDetailHTML(key, e);
  document.getElementById('dayModalBack').classList.remove('hidden');
}

document.getElementById('closeDayModal')?.addEventListener('click', () => document.getElementById('dayModalBack').classList.add('hidden'));

/* ---------- Cards ---------- */
function renderPlaces(){
  const deck = document.getElementById('placeDeck');
  if(!deck) return;
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
  }

  saveState();
  closeSkillEditor();
  renderSkillSkyline();
  renderAbout();
  renderHomeCheckIn();
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
      state.skillHours[btn.dataset.skill] = Math.max(0, (state.skillHours[btn.dataset.skill] || 0) + Number(btn.dataset.delta));
      saveState();
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
    openSkillJourney(skillId);
    renderSkillSkyline();
  });
}

document.getElementById('closeSkillJourney')?.addEventListener('click', () => document.getElementById('skillJourneyBack').classList.add('hidden'));
document.getElementById('skillJourneyBack')?.addEventListener('click', e => { if(e.target.id==='skillJourneyBack') document.getElementById('skillJourneyBack').classList.add('hidden'); });

document.getElementById('addSkillBtn')?.addEventListener('click', () => openSkillEditor(null));
document.getElementById('closeSkillEdit')?.addEventListener('click', closeSkillEditor);
document.getElementById('cancelSkillEdit')?.addEventListener('click', closeSkillEditor);
document.getElementById('saveSkillEdit')?.addEventListener('click', saveSkillEditor);
document.getElementById('deleteSkillBtn')?.addEventListener('click', deleteSkillEditor);
document.getElementById('skillEditBack')?.addEventListener('click', e => { if(e.target.id === 'skillEditBack') closeSkillEditor(); });

/* ---------- Media log (TV, film, books, albums, songs) ---------- */
function renderDramaDeck(){
  const deck = document.getElementById('dramaDeck');
  if(!deck) return;
  const dramas = allDramas();
  if(!dramas.length){ deck.innerHTML = '<p class="empty-hint">Empty shelf.</p>'; return; }

  deck.innerHTML = dramas.map((d, i) => {
    const pct = d.totalEpisodes ? Math.round((d.currentEpisode/d.totalEpisodes)*100) : 0;
    const ratingDots = computeShowRatingDots(d, stableNeon(d.id, 1));
    const reviewed = Object.keys(d.episodes||{}).length;
    const mt = getMediaType(d.mediaType);
    const neon = stableNeon(d.id, i);
    return `<article class="drama-card media-card status-${d.status}" style="--drot:${((i % 5) * 0.6 - 1.2).toFixed(1)}deg;--media-neon:${neon}" data-drama-id="${esc(d.id)}">
      <div class="drama-card-art">${d.image?`<img src="${esc(d.image)}" alt="">`:`<span class="drama-art-ph">${esc(d.title.charAt(0))}</span>`}</div>
      <div class="drama-card-body">
        <div class="drama-card-top"><span class="drama-status">${esc(mt.label)} · ${d.status}</span>${ratingDots || ''}</div>
        <h3 class="drama-card-title">${esc(d.title)}</h3>
        <div class="drama-card-genre">${esc(d.genre||'')}</div>
        <div class="drama-ep-track"><span class="drama-ep-label">${mt.unit} ${d.currentEpisode}/${d.totalEpisodes} · ${reviewed} rated</span>
          <div class="drama-ep-bar"><div style="width:${pct}%"></div></div></div>
      </div></article>`;
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
    <div class="drama-detail-meta">${esc(mt.label)} · ${esc(d.genre||'')} · ${d.status} · ${unitLabel} ${d.currentEpisode}/${d.totalEpisodes}
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
    saveState(); openDramaDetail(id); renderDramaDeck(); renderHomeCheckIn();
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
    saveState(); openDramaDetail(id);
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
  spread.innerHTML = articles.map((a, i) => {
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
        document.getElementById('articleModalContent').innerHTML = `
          <div class="manga-section">${esc(a.section)} · ${esc(a.date)}</div>
          <h2 class="article-full-headline">${esc(a.title)}</h2>
          ${a.image?`<div class="manga-panel-image"><img src="${esc(a.image)}" alt=""></div>`:''}
          <div class="article-full-body">${esc(a.body)}</div>`;
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

  const adminBtns = `<div class="flip-admin-row edit-when-editing">
    <button type="button" class="btn flip-edit-btn">Edit</button>
    <button type="button" class="btn admin-delete flip-del-btn" data-del-type="gallery" data-del-id="${esc(photo.id || '')}">Delete</button>
  </div>`;

  if(!photoHasStory(photo)){
    return `<div class="flip-back-inner">
      <h3 class="flip-caption">${esc(photo.caption || 'Untitled')}</h3>
      <p class="flip-empty">No story written for this one yet.</p>
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
      if(e.target.closest('.flip-edit-btn, .card-edit-front')) return;
      const fig = e.target.closest('.photo-flip');
      if(!fig || !wall.contains(fig)) return;
      const wasFlipped = fig.classList.contains('is-flipped');
      wall.querySelectorAll('.photo-flip.is-flipped').forEach(f => f.classList.remove('is-flipped'));
      if(!wasFlipped) fig.classList.add('is-flipped');
    };
    wall.addEventListener('click', wall._galleryHandler);
  }
}

/* ---------- Pinboard ---------- */
function renderPinboard(){
  const wall = document.getElementById('pinWall');
  if(!wall) return;
  const posts = state.pinboard || [];
  if(!posts.length){ wall.innerHTML = '<p class="empty-hint pin-empty">Be the first to pin something.</p>'; return; }

  wall.innerHTML = posts.slice().reverse().map((p, i) => {
    const rot = [-2, 1.5, -1, 2.5, -0.5][i % 5];
    const pinColor = p.neonColor || moodColor(p.mood);
    return `<article class="pin-post" style="--prot:${rot}deg;--pmc:${pinColor}">
      <div class="pin-post-head">
        <span class="pin-name">${esc(p.name)}</span>
        <span class="pin-mood">${p.mood}/10</span>
        ${isAdmin() ? `<button type="button" class="pin-delete" data-pin="${esc(p.id)}" title="Remove">×</button>` : ''}
      </div>
      ${p.photo?`<div class="pin-photo"><img src="${esc(p.photo)}" alt=""></div>`:''}
      <p class="pin-text">${esc(p.text)}</p>
      <div class="pin-time">${new Date(p.time).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div>
    </article>`;
  }).join('');

  wall.querySelectorAll('.pin-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.pinboard = state.pinboard.filter(p => p.id !== btn.dataset.pin);
      saveState();
      renderPinboard();
    });
  });
}

document.getElementById('pinForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('pinName').value.trim();
  const text = document.getElementById('pinText').value.trim();
  const mood = document.getElementById('pinMood').value;
  const file = document.getElementById('pinPhoto').files[0];

  const addPost = (photo) => {
    const pinColor = document.getElementById('pinColor')?.value || '#3ad6e0';
    state.pinboard.push({ id:'pin-'+Date.now(), name, text, mood, photo: photo||'', neonColor: pinColor, time: new Date().toISOString() });
    saveState();
    document.getElementById('pinForm').reset();
    document.getElementById('pinMood').value = 7;
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
    renderSkillSkyline,
    renderDramaDeck,
    renderPress,
    renderGallery,
    renderPinboard,
  ].forEach(safeRender);
  applyAdminUI();
}

bootApp();
