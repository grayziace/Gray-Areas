/* ===== Game hub: watch vs play fork, chat, collections, press queue, card repair ===== */

const SITE_MODE_KEY = 'ga-site-mode';
const WATCH_MODE = 'watch';
const GAME_MODE = 'game';
const CHAT_POLL_MS = 4000;
const CHAT_XP_DAY_KEY = 'ga-chat-xp-day';

const GameHub = {
  chatPollTimer: null,

  init(){
    document.getElementById('enterWatchMode')?.addEventListener('click', () => this.enterWatchMode());
    document.getElementById('enterGameMode')?.addEventListener('click', () => this.showGameLogin());
    document.getElementById('loginBackToFork')?.addEventListener('click', () => this.showLandingFork());
    document.getElementById('switchToGameBanner')?.addEventListener('click', () => {
      this.showLandingFork(true);
      if(typeof showEntryGate === 'function') showEntryGate({ force: true });
    });
    document.getElementById('chatSendForm')?.addEventListener('submit', e => {
      e.preventDefault();
      this.sendChatMessage();
    });
    if(isWatchMode() && !isAdmin() && !isCoderLoggedIn()) this.applySiteModeUI();
  },

  enterWatchMode(){
    try{
      sessionStorage.setItem(SITE_MODE_KEY, WATCH_MODE);
      sessionStorage.removeItem('ga-coder-card-id');
      sessionStorage.removeItem('ga-guest');
      sessionStorage.removeItem('ga-admin');
    }catch(e){}
    if(typeof enterMainSite === 'function') enterMainSite();
    this.applySiteModeUI();
    if(typeof applyAdminUI === 'function') applyAdminUI();
    if(typeof navigateToView === 'function') navigateToView('sync');
    if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderAll();
  },

  showGameLogin(forceGate){
    try{ sessionStorage.setItem(SITE_MODE_KEY, GAME_MODE); }catch(e){}
    document.getElementById('loginFork')?.classList.add('hidden');
    document.getElementById('loginGamePanel')?.classList.remove('hidden');
    const sub = document.querySelector('.login-page-sub');
    if(sub) sub.textContent = 'project shenzhen · play the game';
  },

  showLandingFork(fromGame){
    document.getElementById('loginFork')?.classList.remove('hidden');
    document.getElementById('loginGamePanel')?.classList.add('hidden');
    const sub = document.querySelector('.login-page-sub');
    if(sub) sub.textContent = fromGame ? 'project shenzhen · pick your path' : 'project shenzhen · pick your path';
    if(fromGame){
      try{ sessionStorage.removeItem(SITE_MODE_KEY); }catch(e){}
    }
  },

  applySiteModeUI(){
    const watch = isWatchMode() && !isAdmin() && !isCoderLoggedIn();
    const game = isGameMode() || isAdmin() || isCoderLoggedIn();
    document.body.classList.toggle('is-watch-mode', watch);
    document.body.classList.toggle('is-game-mode', game && !isAdmin());
    document.querySelectorAll('.game-only-nav').forEach(el => el.classList.toggle('hidden', watch));
    document.querySelectorAll('.watch-only-banner').forEach(el => el.classList.toggle('hidden', !watch));
    document.querySelectorAll('.sidebar-console-wrap').forEach(el => {
      el.classList.toggle('hidden', watch || (!isAdmin() && !isCoderLoggedIn()));
    });
    const fork = document.getElementById('loginFork');
    const panel = document.getElementById('loginGamePanel');
    if(fork && panel && document.body.classList.contains('login-screen-active')){
      const inGameFlow = sessionStorage.getItem(SITE_MODE_KEY) === GAME_MODE;
      fork.classList.toggle('hidden', inGameFlow);
      panel.classList.toggle('hidden', !inGameFlow);
    }
  },
};

function isWatchMode(){
  try{ return sessionStorage.getItem(SITE_MODE_KEY) === WATCH_MODE; }catch(e){ return false; }
}

function isGameMode(){
  try{
    if(sessionStorage.getItem(SITE_MODE_KEY) === GAME_MODE) return true;
    if(isCoderLoggedIn()) return true;
    if(isAdmin()) return true;
  }catch(e){}
  return false;
}

function ensureHubState(){
  if(!state.chatMessages) state.chatMessages = [];
  if(!state.pressSubmissions) state.pressSubmissions = [];
}

function mergeHubVisitorData(remote){
  if(!remote) return;
  ensureHubState();
  if(Array.isArray(remote.chatMessages)){
    remote.chatMessages.forEach(m => {
      if(!m?.id) return;
      if(!state.chatMessages.some(x => x.id === m.id)) state.chatMessages.unshift(m);
    });
    state.chatMessages = state.chatMessages.slice(0, 400);
  }
  if(Array.isArray(remote.pressSubmissions)){
    remote.pressSubmissions.forEach(s => {
      if(!s?.id) return;
      const i = state.pressSubmissions.findIndex(x => x.id === s.id);
      if(i >= 0) state.pressSubmissions[i] = { ...state.pressSubmissions[i], ...s };
      else state.pressSubmissions.unshift(s);
    });
    state.pressSubmissions = state.pressSubmissions.slice(0, 80);
  }
  mergeCoderPresence(remote.coderPresence);
}

function ensurePlayerCollection(c){
  if(!c) return { places: [], skills: [], friends: [] };
  if(!c.collection || typeof c.collection !== 'object') c.collection = { places: [], skills: [], friends: [] };
  if(!Array.isArray(c.collection.places)) c.collection.places = [];
  if(!Array.isArray(c.collection.skills)) c.collection.skills = [];
  if(!Array.isArray(c.collection.friends)) c.collection.friends = [];
  return c.collection;
}

function getPlayerCollectionPlaces(c){
  return ensurePlayerCollection(c).places;
}

function chatAuthorThumb(coderId){
  if(typeof pinCoderThumb === 'function') return pinCoderThumb(coderId);
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c) return '';
  return `<span class="chat-author-name">${esc(c.name)}</span>`;
}

GameHub.renderChat = function(){
  const host = document.getElementById('chatSpread');
  if(!host) return;
  if(!isCoderLoggedIn() && !isAdmin()){
    host.innerHTML = '<p class="empty-hint">Log in to play the game and join the chat room.</p>';
    return;
  }
  ensureHubState();
  const msgs = (state.chatMessages || []).slice().sort((a, b) => (a.at || '').localeCompare(b.at || '')).slice(-120);
  const online = typeof getOnlineCoderIds === 'function' ? getOnlineCoderIds().size : 0;
  host.innerHTML = `
    <header class="chat-room-head sketch-card">
      <h3 class="viewer-wizard-title">Game chat</h3>
      <p class="field-hint">Talk in real time — your player card icon shows beside every message. Occasionally funny lines earn +1–2 XP.</p>
      ${online ? `<span class="chat-online-pill">${online} online</span>` : ''}
    </header>
    <div class="chat-messages" id="chatMessages">${msgs.map(m => this.renderChatLine(m)).join('') || '<p class="empty-hint chat-empty">Say hi — the room is quiet.</p>'}</div>
    <form class="chat-compose sketch-card" id="chatSendForm">
      <textarea id="chatInput" rows="2" required placeholder="type something…" maxlength="500"></textarea>
      <button type="submit" class="btn primary">Send</button>
    </form>`;
  const box = host.querySelector('.chat-messages');
  if(box) box.scrollTop = box.scrollHeight;
};

GameHub.renderChatLine = function(m){
  const thumb = m.characterId ? chatAuthorThumb(m.characterId) : `<span class="chat-author-name">${esc(m.name || 'Gray')}</span>`;
  const xpNote = m.xpAwarded ? `<span class="chat-xp-drop">+${m.xpAwarded} XP</span>` : '';
  return `<article class="chat-line" style="--chat-neon:${esc(m.cardColor || '#38bdf8')}">
    <div class="chat-line-head">${thumb}<time>${esc(new Date(m.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))}</time>${xpNote}</div>
    <p class="chat-line-text">${esc(m.text)}</p>
  </article>`;
};

GameHub.sendChatMessage = async function(){
  const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
  const text = document.getElementById('chatInput')?.value?.trim();
  if(!text) return;
  if(!mine && !isAdmin()){ alert('Log in to chat.'); return; }
  const msg = {
    id: uid('chat'),
    characterId: mine?.id || '',
    name: mine?.name || (typeof getPlayer === 'function' ? getPlayer().name : 'Gray'),
    text,
    cardColor: mine?.cardColor || '#ff4fd8',
    avatar: mine?.avatar || mine?.image || '',
    at: new Date().toISOString(),
  };
  const xp = mine ? this.maybeAwardChatFunnyXp(msg) : 0;
  if(xp) msg.xpAwarded = xp;
  ensureHubState();
  state.chatMessages.push(msg);
  state.chatMessages = state.chatMessages.slice(-400);
  saveState();
  await postVisitorData('postChatMessage', msg);
  if(typeof logCoderActivity === 'function' && mine){
    logCoderActivity('chat', { coderId: mine.id, name: mine.name, detail: `${mine.name} chatted` });
  }
  document.getElementById('chatInput').value = '';
  this.renderChat();
};

GameHub.maybeAwardChatFunnyXp = function(msg){
  if(!msg.characterId) return 0;
  const funny = /lol|lmao|haha|hehe|bruh|dead|💀|😂|🤣|wtf|omg|iconic|unhinged|feral/i.test(msg.text);
  if(!funny || msg.text.length < 8) return 0;
  try{
    const day = typeof todayKey === 'function' ? todayKey() : new Date().toISOString().slice(0, 10);
    const key = `${CHAT_XP_DAY_KEY}:${msg.characterId}:${day}`;
    const n = parseInt(sessionStorage.getItem(key) || '0', 10);
    if(n >= 2) return 0;
    if(Math.random() > 0.4) return 0;
    const pts = Math.random() < 0.6 ? 1 : 2;
    sessionStorage.setItem(key, String(n + 1));
    if(typeof awardCoderPoints === 'function') awardCoderPoints(msg.characterId, pts, 'chat_funny');
    return pts;
  }catch(e){ return 0; }
};

GameHub.startChatPoll = function(){
  this.stopChatPoll();
  this.chatPollTimer = setInterval(() => {
    if(document.body.dataset.activeView !== 'chat') return;
    if(typeof fetchVisitorData === 'function') fetchVisitorData();
    else this.renderChat();
  }, CHAT_POLL_MS);
};

GameHub.stopChatPoll = function(){
  if(this.chatPollTimer) clearInterval(this.chatPollTimer);
  this.chatPollTimer = null;
};

GameHub.renderProfileCollections = function(coderId){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c) return '';
  const col = ensurePlayerCollection(c);
  const isMine = typeof getMyCoderCard === 'function' && getMyCoderCard()?.id === coderId;
  const canEdit = isMine || isAdmin();
  const placeRows = col.places.map(p => `
    <li class="pcol-place"><strong>${esc(p.name)}</strong>${p.vibe ? `<span>${esc(p.vibe)}</span>` : ''}</li>`).join('');
  const skillRows = col.skills.map(s => `
    <li class="pcol-skill"><strong>${esc(s.name)}</strong>${s.tier ? `<span class="pcol-tier">${esc(s.tier)}</span>` : ''}</li>`).join('');
  const friendRows = col.friends.map(fid => {
    const f = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(fid) : null;
    if(!f) return '';
    return `<li><button type="button" class="btn pcol-friend" data-coder-board="${esc(fid)}">${esc(f.name)}</button></li>`;
  }).join('');
  const editBlock = canEdit ? `
    <form class="pcol-add-form sketch-card" data-pcol-form="${esc(coderId)}">
      <h4>Add to collection</h4>
      <div class="field-row">
        <div class="field"><label>Place name</label><input type="text" class="pcol-place-name" placeholder="café, park…"></div>
        <div class="field"><label>Vibe</label><input type="text" class="pcol-place-vibe" placeholder="optional"></div>
      </div>
      <button type="button" class="btn" data-pcol-add-place="${esc(coderId)}">+ Place card</button>
      <div class="field-row" style="margin-top:10px">
        <div class="field"><label>Skill</label><input type="text" class="pcol-skill-name" placeholder="e.g. piano"></div>
        <div class="field"><label>Tier</label><input type="text" class="pcol-skill-tier" placeholder="bronze, gold…"></div>
      </div>
      <button type="button" class="btn" data-pcol-add-skill="${esc(coderId)}">+ Skill card</button>
      <div class="field" style="margin-top:10px"><label>Link player card (friend)</label>
        <select class="pcol-friend-pick"><option value="">— pick —</option>
          ${(state.viewerCharacters || []).filter(x => x.id !== coderId).map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}
        </select>
      </div>
      <button type="button" class="btn" data-pcol-add-friend="${esc(coderId)}">+ Link friend</button>
    </form>` : '';
  return `<section class="coder-board-section sketch-card coder-collections">
    <h3>Collection</h3>
    <div class="pcol-grid">
      <div><h4>Place cards</h4><ul class="pcol-list">${placeRows || '<li class="empty-hint">None yet</li>'}</ul></div>
      <div><h4>Skill cards</h4><ul class="pcol-list">${skillRows || '<li class="empty-hint">None yet</li>'}</ul></div>
      <div><h4>Player friends</h4><ul class="pcol-list pcol-friends">${friendRows || '<li class="empty-hint">None linked</li>'}</ul></div>
    </div>
    ${editBlock}
  </section>`;
};

GameHub.bindProfileCollections = function(root, coderId){
  const host = root || document;
  host.querySelector(`[data-pcol-add-place="${coderId}"]`)?.addEventListener('click', () => {
    const form = host.querySelector(`[data-pcol-form="${coderId}"]`);
    const name = form?.querySelector('.pcol-place-name')?.value?.trim();
    const vibe = form?.querySelector('.pcol-place-vibe')?.value?.trim();
    if(!name) return;
    this.addCollectionPlace(coderId, { name, vibe });
  });
  host.querySelector(`[data-pcol-add-skill="${coderId}"]`)?.addEventListener('click', () => {
    const form = host.querySelector(`[data-pcol-form="${coderId}"]`);
    const name = form?.querySelector('.pcol-skill-name')?.value?.trim();
    const tier = form?.querySelector('.pcol-skill-tier')?.value?.trim();
    if(!name) return;
    this.addCollectionSkill(coderId, { name, tier });
  });
  host.querySelector(`[data-pcol-add-friend="${coderId}"]`)?.addEventListener('click', () => {
    const form = host.querySelector(`[data-pcol-form="${coderId}"]`);
    const fid = form?.querySelector('.pcol-friend-pick')?.value;
    if(!fid) return;
    this.addCollectionFriend(coderId, fid);
  });
  host.querySelectorAll('[data-coder-board]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(typeof navigateToCoderBoard === 'function') navigateToCoderBoard(btn.dataset.coderBoard);
    });
  });
};

GameHub.savePlayerCollection = function(coderId){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  saveState();
  postVisitorData('updateCharacter', c);
};

GameHub.addCollectionPlace = function(coderId, data){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  ensurePlayerCollection(c).places.unshift({ id: uid('pplace'), name: data.name, vibe: data.vibe || '', at: new Date().toISOString() });
  this.savePlayerCollection(coderId);
  if(typeof renderCoderBoardPage === 'function') renderCoderBoardPage(coderId);
  if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderViewerCard();
};

GameHub.addCollectionSkill = function(coderId, data){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  ensurePlayerCollection(c).skills.unshift({ id: uid('pskill'), name: data.name, tier: data.tier || '', at: new Date().toISOString() });
  this.savePlayerCollection(coderId);
  if(typeof renderCoderBoardPage === 'function') renderCoderBoardPage(coderId);
};

GameHub.addCollectionFriend = function(coderId, friendId){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c || friendId === coderId) return;
  const col = ensurePlayerCollection(c);
  if(col.friends.includes(friendId)) return;
  col.friends.unshift(friendId);
  this.savePlayerCollection(coderId);
  if(typeof renderCoderBoardPage === 'function') renderCoderBoardPage(coderId);
};

GameHub.renderPressSubmitForm = function(){
  if(!isCoderLoggedIn() || isWatchMode()) return '';
  const mine = getMyCoderCard();
  if(!mine) return '';
  return `<section class="press-submit-board sketch-card">
    <h3 class="viewer-wizard-title">Submit to The Press</h3>
    <p class="field-hint">Write something — I read every submission and publish what fits.</p>
    <form id="pressSubmitForm">
      <div class="field"><label>Headline</label><input type="text" id="pressSubmitTitle" required></div>
      <div class="field"><label>Excerpt</label><input type="text" id="pressSubmitExcerpt" placeholder="one-line teaser"></div>
      <div class="field"><label>Article</label><textarea id="pressSubmitBody" rows="6" required></textarea></div>
      <button type="submit" class="btn primary">Send to Gray</button>
    </form>
  </section>`;
};

GameHub.bindPressSubmit = function(){
  const form = document.getElementById('pressSubmitForm');
  if(!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', e => {
    e.preventDefault();
    this.submitPressArticle();
  });
};

GameHub.submitPressArticle = async function(){
  const mine = getMyCoderCard();
  if(!mine) return;
  const title = document.getElementById('pressSubmitTitle')?.value?.trim();
  const excerpt = document.getElementById('pressSubmitExcerpt')?.value?.trim() || title?.slice(0, 120) || '';
  const body = document.getElementById('pressSubmitBody')?.value?.trim();
  if(!title || !body) return;
  const sub = {
    id: uid('presssub'),
    characterId: mine.id,
    name: mine.name,
    title,
    excerpt,
    body,
    status: 'pending',
    at: new Date().toISOString(),
  };
  ensureHubState();
  state.pressSubmissions.unshift(sub);
  saveState();
  await postVisitorData('submitPressSubmission', sub);
  if(typeof logCoderActivity === 'function'){
    logCoderActivity('press_submit', { coderId: mine.id, name: mine.name, detail: `${mine.name} submitted Press: ${title}` });
  }
  alert('Sent — I\'ll read it soon.');
  document.getElementById('pressSubmitForm')?.reset();
  if(typeof renderPress === 'function') renderPress();
};

GameHub.renderPressQueue = function(){
  if(!isAdmin()) return '';
  ensureHubState();
  const pending = (state.pressSubmissions || []).filter(s => s.status === 'pending');
  if(!pending.length) return '';
  return `<section class="press-queue-board sketch-card">
    <h3 class="viewer-wizard-title">Press submissions (${pending.length})</h3>
    ${pending.map(s => `<article class="press-queue-item" data-press-sub="${esc(s.id)}">
      <header><strong>${esc(s.title)}</strong> <span>by ${esc(s.name)}</span> <time>${esc(new Date(s.at).toLocaleDateString())}</time></header>
      <p>${esc(s.excerpt || s.body?.slice(0, 160) || '')}</p>
      <div class="press-queue-actions">
        <button type="button" class="btn primary" data-press-approve="${esc(s.id)}">Publish</button>
        <button type="button" class="btn" data-press-reject="${esc(s.id)}">Decline</button>
      </div>
    </article>`).join('')}
  </section>`;
};

GameHub.bindPressQueue = function(root){
  (root || document).querySelectorAll('[data-press-approve]').forEach(btn => {
    btn.addEventListener('click', () => this.approvePressSubmission(btn.dataset.pressApprove));
  });
  (root || document).querySelectorAll('[data-press-reject]').forEach(btn => {
    btn.addEventListener('click', () => this.rejectPressSubmission(btn.dataset.pressReject));
  });
};

GameHub.approvePressSubmission = function(subId){
  const sub = (state.pressSubmissions || []).find(s => s.id === subId);
  if(!sub) return;
  ensureContentState();
  const article = {
    id: uid('art'),
    section: 'Community',
    title: sub.title,
    date: todayKey(),
    excerpt: sub.excerpt || sub.body?.slice(0, 140) || '',
    body: sub.body,
    layout: 'note',
    tags: `submission,${sub.name}`,
    image: '',
    authorId: sub.characterId,
    authorName: sub.name,
  };
  if(!state.content.articles) state.content.articles = [];
  state.content.articles.unshift(article);
  sub.status = 'approved';
  saveState();
  postVisitorData('updatePressSubmission', sub);
  if(sub.characterId && typeof awardCoderPoints === 'function'){
    awardCoderPoints(sub.characterId, 15, 'press_published');
  }
  if(typeof renderPress === 'function') renderPress();
};

GameHub.rejectPressSubmission = function(subId){
  const sub = (state.pressSubmissions || []).find(s => s.id === subId);
  if(!sub) return;
  sub.status = 'rejected';
  saveState();
  postVisitorData('updatePressSubmission', sub);
  if(typeof renderPress === 'function') renderPress();
};

function findBrokenCardDescriptions(){
  const broken = [];
  (typeof getCharacters === 'function' ? getCharacters() : []).forEach(c => {
    const d = c.cardDescription || '';
    if(!d) return;
    const bad = /(.)\1{4,}/.test(d) || (typeof sanitizeCardDescription === 'function' && !sanitizeCardDescription(d));
    if(bad) broken.push(c);
  });
  return broken;
}

GameHub.renderCardRepairTool = function(){
  if(!isAdmin()) return '';
  const broken = findBrokenCardDescriptions();
  if(!broken.length) return '<p class="field-hint card-repair-ok">All player card lines look OK.</p>';
  return `<section class="card-repair-board sketch-card">
    <h3 class="viewer-wizard-title">Repair glitched card lines (${broken.length})</h3>
    <p class="field-hint">AI sometimes repeats characters — clear or regenerate the front tagline.</p>
    <ul class="card-repair-list">${broken.map(c => `<li class="card-repair-row" data-repair-id="${esc(c.id)}">
      <strong>${esc(c.name)}</strong>
      <code class="card-repair-bad">${esc((c.cardDescription || '').slice(0, 60))}</code>
      <button type="button" class="btn" data-repair-clear="${esc(c.id)}">Clear line</button>
      <button type="button" class="btn primary" data-repair-regen="${esc(c.id)}">Regenerate</button>
    </li>`).join('')}</ul>
  </section>`;
};

GameHub.bindCardRepair = function(root){
  (root || document).querySelectorAll('[data-repair-clear]').forEach(btn => {
    btn.addEventListener('click', () => this.clearCardLine(btn.dataset.repairClear));
  });
  (root || document).querySelectorAll('[data-repair-regen]').forEach(btn => {
    btn.addEventListener('click', () => this.regenCardLine(btn.dataset.repairRegen));
  });
};

GameHub.clearCardLine = function(coderId){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId)
    || (typeof getCharacters === 'function' ? getCharacters() : []).find(x => x.id === coderId);
  if(!c) return;
  c.cardDescription = '';
  saveState();
  postVisitorData('updateCharacter', c);
  if(typeof renderCharacters === 'function') renderCharacters();
};

GameHub.regenCardLine = async function(coderId){
  const c = (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c || typeof generateCoderCardDescription !== 'function') return;
  c.cardDescription = '';
  await generateCoderCardDescription(c);
  saveState();
  await postVisitorData('updateCharacter', c);
  if(typeof renderCharacters === 'function') renderCharacters();
};
