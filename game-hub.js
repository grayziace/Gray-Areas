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
    document.querySelectorAll('.watch-hide-nav').forEach(el => el.classList.toggle('hidden', watch));
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
  if(!state.friendRequests) state.friendRequests = [];
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
  if(Array.isArray(remote.friendRequests)){
    remote.friendRequests.forEach(r => {
      if(!r?.id) return;
      const i = (state.friendRequests || []).findIndex(x => x.id === r.id);
      if(i >= 0) state.friendRequests[i] = { ...state.friendRequests[i], ...r };
      else (state.friendRequests = state.friendRequests || []).unshift(r);
    });
    state.friendRequests = state.friendRequests.slice(0, 200);
  }
}

function ensurePlayerCollection(c){
  if(!c) return { places: [], skills: [], media: [], friends: [] };
  if(!c.collection || typeof c.collection !== 'object') c.collection = { places: [], skills: [], media: [], friends: [] };
  if(!Array.isArray(c.collection.places)) c.collection.places = [];
  if(!Array.isArray(c.collection.skills)) c.collection.skills = [];
  if(!Array.isArray(c.collection.media)) c.collection.media = [];
  if(!Array.isArray(c.collection.friends)) c.collection.friends = [];
  return c.collection;
}

function buildCollectionPlaceFlip(p, i){
  const item = {
    id: p.id || uid('cplace'),
    name: p.name || 'Place',
    unlocked: true,
    vibe: p.vibe || '',
    placeCard: {
      level: p.level || 1,
      vibeRank: p.vibeRank || 3,
      experienceRank: p.experienceRank || 3,
      utilityRank: p.utilityRank || 3,
      description: p.description || p.vibe || '',
    },
    image: p.image || '',
  };
  if(typeof buildFlipPlaceCard === 'function') return buildFlipPlaceCard(item, i);
  return `<div class="col-card-fallback">${esc(item.name)}</div>`;
}

function buildCollectionSkillFlip(s, i){
  const skill = {
    id: s.id || uid('cskill'),
    name: s.name || 'Skill',
    color: s.color || '#7c4dff',
    hours: s.hours || 0,
    milestones: [],
  };
  if(typeof buildFlipSkillCard === 'function') return buildFlipSkillCard(skill, i, { useStoredHours: true });
  return `<div class="col-card-fallback">${esc(skill.name)}</div>`;
}

function buildCollectionMediaFlip(m, i){
  const accent = stableNeon(m.id || m.title, i);
  const tilt = ((i % 5) * 1.1 - 2.2).toFixed(1);
  const rating = m.rating ? `${m.rating}/5` : '';
  return `<figure class="poke-flip media-col-flip" style="--pc-accent:${accent};--tilt:${tilt}deg">
    <div class="poke-flip-scene"><div class="poke-flip-inner">
      <div class="poke-flip-face poke-flip-front">
        <div class="pc-front mcc-front" style="--pc-accent:${accent}">
          <div class="pc-frame-glow"></div>
          <div class="pc-head pc-head-simple"><span class="pc-name">${esc(m.title || 'Media')}</span><span class="pc-lv">${esc(m.medium || 'log')}</span></div>
          <div class="pc-art">${m.image ? `<div class="card-photo-frame"><img src="${esc(m.image)}" alt=""></div>` : `<span class="pc-art-ph">▶</span>`}</div>
          ${rating ? `<p class="pc-blurb">${esc(rating)}</p>` : ''}
          <span class="flip-hint-front">↻ review</span>
        </div>
      </div>
      <div class="poke-flip-face poke-flip-back">
        <div class="pc-back mcc-back" style="--pc-accent:${accent}">
          <div class="pc-back-title">${esc(m.title || '')}</div>
          <div class="pc-row"><span>Medium</span><span>${esc(m.medium || '—')}</span></div>
          ${m.rating ? `<div class="pc-row"><span>Rating</span><span>${esc(rating)}</span></div>` : ''}
          ${m.review ? `<div class="pc-block"><div class="pc-block-title">Notes</div><p>${esc(m.review)}</p></div>` : ''}
          <span class="flip-hint-back">flip back</span>
        </div>
      </div>
    </div></div>
  </figure>`;
}

GameHub.mirrorUpdateToChat = function(text, mine){
  if(!mine || !text) return;
  ensureHubState();
  const msg = {
    id: uid('chat'),
    characterId: mine.id,
    name: mine.name,
    text: `📡 ${text}`,
    cardColor: mine.cardColor || '#38bdf8',
    avatar: mine.avatar || mine.image || '',
    at: new Date().toISOString(),
    isUpdate: true,
  };
  state.chatMessages.push(msg);
  state.chatMessages = state.chatMessages.slice(-400);
  saveState();
  postVisitorData('postChatMessage', msg);
  if(document.body.dataset.activeView === 'chat') this.renderChat();
};

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
    host.innerHTML = '<p class="empty-hint">Log in to join the coder chat.</p>';
    return;
  }
  ensureHubState();
  const msgs = (state.chatMessages || []).slice().sort((a, b) => (a.at || '').localeCompare(b.at || '')).slice(-120);
  const online = typeof getOnlineCoderIds === 'function' ? getOnlineCoderIds().size : 0;
  host.innerHTML = `
    <div class="chat-room-wrap">
      <header class="chat-room-head">
        <div class="chat-room-title-block">
          <p class="chat-room-kicker">// live room</p>
          <h3 class="chat-room-title">Coder chat</h3>
        </div>
        ${online ? `<span class="chat-online-pill"><span class="chat-online-dot"></span>${online} online</span>` : ''}
      </header>
      <div class="chat-messages neon-scroll" id="chatMessages">${msgs.map(m => this.renderChatLine(m)).join('') || '<p class="empty-hint chat-empty">Say hi — the room is quiet.</p>'}</div>
      <form class="chat-compose" id="chatSendForm">
        <div class="chat-compose-inner">
          <textarea id="chatInput" rows="2" required placeholder="say something…" maxlength="500"></textarea>
          <button type="submit" class="btn primary chat-send-btn">Send</button>
        </div>
        <p class="chat-compose-hint">Funny lines sometimes earn +1–2 XP. Updates echo here automatically.</p>
      </form>
    </div>`;
  const box = host.querySelector('.chat-messages');
  if(box) box.scrollTop = box.scrollHeight;
};

GameHub.renderChatLine = function(m){
  const c = m.characterId && typeof getCoderByIdAny === 'function' ? getCoderByIdAny(m.characterId) : null;
  const accent = m.cardColor || c?.cardColor || '#38bdf8';
  const avatar = c?.avatar || c?.image || m.avatar;
  const thumb = m.characterId
    ? `<div class="chat-avatar" style="--chat-neon:${esc(accent)}">${avatar ? `<img src="${esc(avatar)}" alt="">` : `<span>${esc((m.name || '?').charAt(0))}</span>`}</div>`
    : `<div class="chat-avatar is-gray"><span>G</span></div>`;
  const xpNote = m.xpAwarded ? `<span class="chat-xp-drop">+${m.xpAwarded} XP</span>` : '';
  const updateTag = m.isUpdate ? `<span class="chat-update-tag">update</span>` : '';
  return `<article class="chat-line${m.isUpdate ? ' is-update' : ''}" style="--chat-neon:${esc(accent)}">
    ${thumb}
    <div class="chat-line-body">
      <div class="chat-line-head"><strong class="chat-author-name">${esc(m.name || 'Gray')}</strong>${updateTag}<time>${esc(new Date(m.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))}</time>${xpNote}</div>
      <p class="chat-line-text">${esc(m.text)}</p>
    </div>
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

GameHub.getFriendRelation = function(myId, targetId){
  if(!myId || !targetId || myId === targetId) return 'self';
  const mine = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(myId) : null;
  if(mine && ensurePlayerCollection(mine).friends.includes(targetId)) return 'friends';
  const reqs = state.friendRequests || [];
  const sent = reqs.find(r => r.status === 'pending' && r.fromId === myId && r.toId === targetId);
  if(sent) return 'sent';
  const recv = reqs.find(r => r.status === 'pending' && r.fromId === targetId && r.toId === myId);
  if(recv) return 'received';
  return 'none';
};

GameHub.sendFriendRequest = async function(fromId, toId){
  if(!fromId || !toId || fromId === toId) return false;
  if(this.getFriendRelation(fromId, toId) !== 'none') return false;
  const from = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(fromId) : null;
  const to = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(toId) : null;
  if(!from || !to) return false;
  ensureHubState();
  const req = {
    id: uid('fr'),
    fromId,
    toId,
    fromName: from.name || 'Coder',
    toName: to.name || 'Coder',
    status: 'pending',
    at: new Date().toISOString(),
  };
  state.friendRequests.unshift(req);
  saveState();
  if(typeof postVisitorData === 'function') await postVisitorData('sendFriendRequest', req);
  if(typeof renderCharacters === 'function') renderCharacters();
  return true;
};

GameHub.respondFriendRequest = async function(requestId, accept){
  const req = (state.friendRequests || []).find(r => r.id === requestId);
  if(!req || req.status !== 'pending') return false;
  req.status = accept ? 'accepted' : 'declined';
  req.respondedAt = new Date().toISOString();
  if(accept){
    this.addCollectionFriend(req.fromId, req.toId);
    this.addCollectionFriend(req.toId, req.fromId);
  }
  saveState();
  if(typeof postVisitorData === 'function') await postVisitorData('respondFriendRequest', req);
  if(typeof renderCharacters === 'function') renderCharacters();
  if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderViewerCard?.();
  if(typeof renderCoderBoardPage === 'function' && typeof coderBoardId !== 'undefined') renderCoderBoardPage(coderBoardId);
  return true;
};

GameHub.renderFriendRequestInbox = function(coderId){
  const incoming = (state.friendRequests || []).filter(r => r.status === 'pending' && r.toId === coderId);
  if(!incoming.length) return '';
  return `<section class="friend-request-inbox sketch-card">
    <h4 class="viewer-wizard-title">Friend requests</h4>
    <ul class="friend-request-list">${incoming.map(r => `
      <li class="friend-request-row">
        <span><strong>${esc(r.fromName || 'Coder')}</strong> wants to connect</span>
        <div class="friend-request-actions">
          <button type="button" class="btn primary" data-fr-accept="${esc(r.id)}">Accept</button>
          <button type="button" class="btn" data-fr-decline="${esc(r.id)}">Decline</button>
        </div>
      </li>`).join('')}</ul>
  </section>`;
};

GameHub.bindFriendRequests = function(host){
  if(!host) return;
  host.querySelectorAll('[data-fr-accept]').forEach(btn => {
    btn.addEventListener('click', () => this.respondFriendRequest(btn.dataset.frAccept, true));
  });
  host.querySelectorAll('[data-fr-decline]').forEach(btn => {
    btn.addEventListener('click', () => this.respondFriendRequest(btn.dataset.frDecline, false));
  });
};

function profileCollectionAddForm(coderId, section, canEdit){
  if(!canEdit) return '';
  if(section === 'places'){
    return `<details class="col-add-studio sketch-card profile-col-add"><summary class="col-add-toggle">+ Add place</summary>
      <div class="col-add-panels" data-pcol-form="${esc(coderId)}" data-pcol-section="places">
        <div class="field-row"><div class="field"><label>Name</label><input type="text" class="pcol-place-name" placeholder="café, park…"></div>
        <div class="field"><label>Vibe</label><input type="text" class="pcol-place-vibe" placeholder="neon, cozy…"></div></div>
        <button type="button" class="btn primary" data-pcol-add-place="${esc(coderId)}">Create place card</button>
      </div></details>`;
  }
  if(section === 'skills'){
    return `<details class="col-add-studio sketch-card profile-col-add"><summary class="col-add-toggle">+ Add skill card</summary>
      <div class="col-add-panels" data-pcol-form="${esc(coderId)}" data-pcol-section="skills">
        <div class="field-row"><div class="field"><label>Skill</label><input type="text" class="pcol-skill-name" placeholder="piano, mandarin…"></div>
        <div class="field"><label>Hours</label><input type="number" class="pcol-skill-hours" min="0" step="0.5" placeholder="0"></div></div>
        <button type="button" class="btn primary" data-pcol-add-skill="${esc(coderId)}">Create skill card</button>
      </div></details>`;
  }
  if(section === 'media'){
    return `<details class="col-add-studio sketch-card profile-col-add"><summary class="col-add-toggle">+ Add media</summary>
      <div class="col-add-panels" data-pcol-form="${esc(coderId)}" data-pcol-section="media">
        <div class="field-row"><div class="field"><label>Title</label><input type="text" class="pcol-media-title" placeholder="film, album…"></div>
        <div class="field"><label>Type</label><input type="text" class="pcol-media-medium" placeholder="film, book, album"></div></div>
        <div class="field-row"><div class="field"><label>Rating /5</label><input type="number" class="pcol-media-rating" min="1" max="5"></div>
        <div class="field"><label>Notes</label><input type="text" class="pcol-media-review" placeholder="short review"></div></div>
        <button type="button" class="btn primary" data-pcol-add-media="${esc(coderId)}">Create media card</button>
      </div></details>`;
  }
  return '';
}

GameHub.renderCollectionSection = function(coderId, section){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c) return '';
  const isMine = typeof getMyCoderCard === 'function' && getMyCoderCard()?.id === coderId;
  const canEdit = isMine || isAdmin();
  const add = profileCollectionAddForm(coderId, section, canEdit);
  if(section === 'places'){
    return `<div class="profile-gray-view profile-gray-view--places neon-section" style="--sec-neon:#4fa3ff" data-coder-gray-view="places">
      <p class="gallery-hint">Click a card to flip it over.</p>
      <div class="profile-place-rec" data-coder-rec="place"></div>
      <div class="card-deck profile-place-deck" data-coder-deck="places"></div>
      ${add}
    </div>`;
  }
  if(section === 'skills'){
    return `<div class="profile-gray-view profile-gray-view--skills neon-section" style="--sec-neon:#7c4dff" data-coder-gray-view="skills">
      <p class="gallery-hint">Collectible cards — flip to see tier, hours, and milestones. Add a card to grow your skyline.</p>
      <div class="profile-skill-rec" data-coder-rec="skill"></div>
      <div class="card-deck skill-card-deck profile-skill-deck" data-coder-deck="skills"></div>
      <div class="tier-legend profile-tier-legend" data-coder-tier-legend></div>
      <div class="skill-skyline-wrap">
        <div class="skill-skyline profile-skill-skyline" data-coder-skyline></div>
        <div class="skill-ground"></div>
      </div>
      <p class="gallery-hint">Click a tower to see the skill journey.</p>
      ${add}
    </div>`;
  }
  if(section === 'media'){
    return `<div class="profile-gray-view profile-gray-view--media neon-section" style="--sec-neon:#f43f8e" data-coder-gray-view="media">
      <p class="gallery-hint">TV, film, books, albums, songs — sectioned shelves, final reviews, and live rankings.</p>
      <div class="profile-media-rankings" data-coder-media-rankings></div>
      <div class="drama-deck profile-drama-deck" data-coder-deck="media" data-profile-coder="${esc(coderId)}"></div>
      ${add}
    </div>`;
  }
  if(section === 'friends'){
    const col = ensurePlayerCollection(c);
    const isMine = typeof getMyCoderCard === 'function' && getMyCoderCard()?.id === coderId;
    const canEdit = isMine || isAdmin();
    const empty = msg => `<p class="empty-hint">${msg}</p>`;
    const friendDeck = col.friends.map((fid, i) => {
      const f = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(fid) : null;
      if(!f || typeof buildFlipPlayerCard !== 'function') return '';
      const viewBtn = `<button type="button" class="btn profile-friend-view" data-coder-board="${esc(fid)}">View log →</button>`;
      return `<div class="profile-friend-card">${buildFlipPlayerCard(f, 'character', i, { accent: f.cardColor })}${viewBtn}</div>`;
    }).join('');
    const friendAdd = canEdit ? `<details class="col-add-studio sketch-card"><summary class="col-add-toggle">+ Collect coder card</summary><div class="col-add-panels" data-pcol-form="${esc(coderId)}" data-pcol-section="friends"><p class="field-hint">Pick someone who already has an account — or grab them from Coder Cards.</p><select class="pcol-friend-pick"><option value="">— pick coder —</option>${(state.viewerCharacters || []).filter(x => x.id !== coderId).map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select><button type="button" class="btn primary" data-pcol-add-friend="${esc(coderId)}">Collect coder card</button></div></details>` : '';
    return `<div class="profile-col-wrap"><div class="card-deck col-card-deck profile-friend-deck">${friendDeck || empty('No coder cards collected yet — find friends in Coder Cards.')}</div>${friendAdd}</div>`;
  }
  return '';
};

GameHub.renderProfileCollections = function(coderId){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c) return '';
  const col = ensurePlayerCollection(c);
  const isMine = typeof getMyCoderCard === 'function' && getMyCoderCard()?.id === coderId;
  const canEdit = isMine || isAdmin();
  const placeDeck = col.places.map((p, i) => buildCollectionPlaceFlip(p, i)).join('');
  const skillDeck = col.skills.map((s, i) => buildCollectionSkillFlip({ ...s, hours: parseFloat(s.hours) || 0, color: s.color || '#7c4dff' }, i)).join('');
  const mediaDeck = col.media.map((m, i) => buildCollectionMediaFlip(m, i)).join('');
  const friendDeck = col.friends.map((fid, i) => {
    const f = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(fid) : null;
    if(!f || typeof buildFlipPlayerCard !== 'function') return '';
    return buildFlipPlayerCard(f, 'character', i, { accent: f.cardColor });
  }).join('');
  const editBlock = canEdit ? `
    <details class="col-add-studio sketch-card">
      <summary class="col-add-toggle">+ Add to collection</summary>
      <div class="col-add-panels" data-pcol-form="${esc(coderId)}">
        <div class="col-add-section">
          <h4>Place card</h4>
          <div class="field-row"><div class="field"><label>Name</label><input type="text" class="pcol-place-name" placeholder="café, park…"></div>
          <div class="field"><label>Vibe</label><input type="text" class="pcol-place-vibe" placeholder="neon, cozy…"></div></div>
          <button type="button" class="btn primary" data-pcol-add-place="${esc(coderId)}">Create place card</button>
        </div>
        <div class="col-add-section">
          <h4>Skill card</h4>
          <div class="field-row"><div class="field"><label>Skill</label><input type="text" class="pcol-skill-name" placeholder="piano, mandarin…"></div>
          <div class="field"><label>Hours</label><input type="number" class="pcol-skill-hours" min="0" step="0.5" placeholder="0"></div></div>
          <button type="button" class="btn primary" data-pcol-add-skill="${esc(coderId)}">Create skill card</button>
        </div>
        <div class="col-add-section">
          <h4>Media card</h4>
          <div class="field-row"><div class="field"><label>Title</label><input type="text" class="pcol-media-title" placeholder="film, album…"></div>
          <div class="field"><label>Type</label><input type="text" class="pcol-media-medium" placeholder="film, book, album"></div></div>
          <div class="field-row"><div class="field"><label>Rating /5</label><input type="number" class="pcol-media-rating" min="1" max="5"></div>
          <div class="field"><label>Notes</label><input type="text" class="pcol-media-review" placeholder="short review"></div></div>
          <button type="button" class="btn primary" data-pcol-add-media="${esc(coderId)}">Create media card</button>
        </div>
        <div class="col-add-section">
          <h4>Coder card (friend)</h4>
          <p class="field-hint">Collect another coder who already has an account — no creating new people.</p>
          <select class="pcol-friend-pick"><option value="">— pick coder —</option>
            ${(state.viewerCharacters || []).filter(x => x.id !== coderId).map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}
          </select>
          <button type="button" class="btn primary" data-pcol-add-friend="${esc(coderId)}">Collect coder card</button>
        </div>
      </div>
    </details>` : '';
  return `<div class="collection-hub">
    <nav class="col-cat-tabs">
      <button type="button" class="btn col-cat-tab is-active" data-col-cat="places">Places (${col.places.length})</button>
      <button type="button" class="btn col-cat-tab" data-col-cat="skills">Skills (${col.skills.length})</button>
      <button type="button" class="btn col-cat-tab" data-col-cat="media">Media (${col.media.length})</button>
      <button type="button" class="btn col-cat-tab" data-col-cat="coders">Coders (${col.friends.length})</button>
    </nav>
    <div class="col-cat-panel is-active" data-col-panel="places"><div class="card-deck col-card-deck">${placeDeck || '<p class="empty-hint">No place cards yet — add places you\'ve been.</p>'}</div></div>
    <div class="col-cat-panel" data-col-panel="skills"><div class="card-deck col-card-deck">${skillDeck || '<p class="empty-hint">No skill cards yet.</p>'}</div></div>
    <div class="col-cat-panel" data-col-panel="media"><div class="card-deck col-card-deck">${mediaDeck || '<p class="empty-hint">No media logged yet.</p>'}</div></div>
    <div class="col-cat-panel" data-col-panel="coders"><div class="card-deck col-card-deck">${friendDeck || '<p class="empty-hint">No coder cards collected — link friends who play.</p>'}</div></div>
    ${editBlock}
  </div>`;
};

function profileCollectionFormFromBtn(btn){
  return btn.closest('.col-add-panels') || btn.closest('.col-add-section');
}

GameHub.bindProfileCollections = function(root, coderId){
  const host = root || document;
  host.querySelectorAll('.col-cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const hub = tab.closest('.collection-hub');
      if(!hub) return;
      hub.querySelectorAll('.col-cat-tab').forEach(t => t.classList.remove('is-active'));
      hub.querySelectorAll('.col-cat-panel').forEach(p => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      hub.querySelector(`[data-col-panel="${tab.dataset.colCat}"]`)?.classList.add('is-active');
    });
  });
  host.querySelectorAll(`[data-pcol-add-place="${coderId}"]`).forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const form = profileCollectionFormFromBtn(btn);
      const name = form?.querySelector('.pcol-place-name')?.value?.trim();
      const vibe = form?.querySelector('.pcol-place-vibe')?.value?.trim();
      if(!name) return;
      GameHub.addCollectionPlace(coderId, { name, vibe, description: vibe });
    });
  });
  host.querySelectorAll(`[data-pcol-add-skill="${coderId}"]`).forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const form = profileCollectionFormFromBtn(btn);
      const name = form?.querySelector('.pcol-skill-name')?.value?.trim();
      const hours = form?.querySelector('.pcol-skill-hours')?.value;
      if(!name) return;
      GameHub.addCollectionSkill(coderId, { name, hours: parseFloat(hours) || 0 });
    });
  });
  host.querySelectorAll(`[data-pcol-add-media="${coderId}"]`).forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const form = profileCollectionFormFromBtn(btn);
      const title = form?.querySelector('.pcol-media-title')?.value?.trim();
      const medium = form?.querySelector('.pcol-media-medium')?.value?.trim();
      const rating = form?.querySelector('.pcol-media-rating')?.value;
      const review = form?.querySelector('.pcol-media-review')?.value?.trim();
      if(!title) return;
      GameHub.addCollectionMedia(coderId, { title, medium, rating: rating ? parseInt(rating, 10) : 0, review });
    });
  });
  host.querySelectorAll(`[data-pcol-add-friend="${coderId}"]`).forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const form = profileCollectionFormFromBtn(btn);
      const fid = form?.querySelector('.pcol-friend-pick')?.value;
      if(!fid) return;
      GameHub.addCollectionFriend(coderId, fid);
    });
  });
  host.querySelectorAll('[data-coder-board]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if(typeof navigateToCoderBoard === 'function') navigateToCoderBoard(btn.dataset.coderBoard);
    });
  });
  if(typeof bindFlipPlayerCards === 'function') bindFlipPlayerCards(host);
  if(typeof hydrateCoderProfileDecks === 'function') hydrateCoderProfileDecks(coderId, host);
};

GameHub.savePlayerCollection = function(coderId){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  saveState();
  postVisitorData('updateCharacter', c);
};

GameHub.addCollectionPlace = function(coderId, data){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  ensurePlayerCollection(c).places.unshift({ id: uid('pplace'), name: data.name, vibe: data.vibe || '', description: data.description || data.vibe || '', at: new Date().toISOString() });
  this.savePlayerCollection(coderId);
  if(typeof awardCoderPoints === 'function') awardCoderPoints(coderId, 5, 'collection_place');
  this.refreshProfile(coderId);
};

GameHub.addCollectionSkill = function(coderId, data){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  ensurePlayerCollection(c).skills.unshift({ id: uid('pskill'), name: data.name, hours: data.hours || 0, color: data.color || '#7c4dff', at: new Date().toISOString() });
  this.savePlayerCollection(coderId);
  if(typeof awardCoderPoints === 'function') awardCoderPoints(coderId, 5, 'collection_skill');
  this.refreshProfile(coderId);
};

GameHub.addCollectionMedia = function(coderId, data){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c) return;
  ensurePlayerCollection(c).media.unshift({ id: uid('pmedia'), title: data.title, medium: data.medium || '', rating: data.rating || 0, review: data.review || '', at: new Date().toISOString() });
  this.savePlayerCollection(coderId);
  if(typeof awardCoderPoints === 'function') awardCoderPoints(coderId, 5, 'collection_media');
  this.refreshProfile(coderId);
};

GameHub.addCollectionFriend = function(coderId, friendId){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : (state.viewerCharacters || []).find(x => x.id === coderId);
  if(!c || friendId === coderId) return;
  const col = ensurePlayerCollection(c);
  if(col.friends.includes(friendId)) return;
  col.friends.unshift(friendId);
  this.savePlayerCollection(coderId);
  if(typeof awardCoderPoints === 'function') awardCoderPoints(coderId, 10, 'friend_card');
  this.refreshProfile(coderId);
};

GameHub.refreshProfile = function(coderId){
  const site = document.querySelector(`.profile-site[data-profile-coder="${coderId}"]`);
  const activeSection = site?.querySelector('.profile-rail-banner.is-active')?.dataset.psSection;
  if(typeof renderCoderBoardPage === 'function') renderCoderBoardPage(coderId);
  if(activeSection && activeSection !== 'updates'){
    const nextSite = document.querySelector(`.profile-site[data-profile-coder="${coderId}"]`);
    if(nextSite){
      nextSite.querySelectorAll('.profile-rail-banner').forEach(b => {
        b.classList.toggle('is-active', b.dataset.psSection === activeSection);
      });
      nextSite.querySelectorAll('.profile-site-panel').forEach(p => {
        p.classList.toggle('is-active', p.dataset.psPanel === activeSection);
      });
    }
  }
  if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderViewerCard();
};

GameHub.renderPressSubmitForm = function(){
  if(!isCoderLoggedIn() || isWatchMode()) return '';
  const mine = getMyCoderCard();
  if(!mine) return '';
  return `<section class="press-submit-board sketch-card">
    <h3 class="viewer-wizard-title">Submit to The Press</h3>
    <p class="field-hint">Write an article and send it in — <strong>I read everything</strong> and choose what gets published on The Press.</p>
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
