/* ===== Live sync — auto-pulse site activity to Coming To You Live ===== */

const LIVE_SOURCE_META = {
  overload: { type: 'glitch', label: 'System Glitch', text: 'SYSTEM GLITCH' },
  press: { type: 'press', label: 'The Press' },
  gallery: { type: 'photo', label: 'Photo Wall' },
  hobby: { type: 'hobby', label: 'Hobby' },
  skill: { type: 'hobby', label: 'Skill' },
  pinboard: { type: 'message', label: 'Community' },
  drama: { type: 'film', label: 'Media' },
  place: { type: 'place', label: 'Place' },
  character: { type: 'person', label: 'Player' },
  log: { type: 'note', label: 'Daily Log' },
  mood: { type: 'mood', label: 'Mood' },
  steps: { type: 'health', label: 'Steps' },
  meetup: { type: 'person', label: 'Meetup' },
  unlock: { type: 'win', label: 'Unlock' },
};

const LiveSync = {
  _busy: false,

  pulse(source, detail, opts = {}){
    if(this._busy) return;
    const meta = LIVE_SOURCE_META[source] || { type: 'event', label: source };
    const type = opts.type || meta.type || 'note';
    const text = opts.text || detail || meta.text || meta.label || source;
    const key = typeof ensureTodayStream === 'function' ? ensureTodayStream() : todayKey();
    const stream = typeof getDayStream === 'function' ? getDayStream(key) : { nodes: [] };
    const node = {
      id: 'n-auto-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      at: opts.at || new Date().toISOString(),
      type,
      source,
      text: String(text).slice(0, 240),
      body: opts.body ? String(opts.body).slice(0, 2000) : undefined,
      auto: true,
    };
    stream.nodes.push(node);
    if(!state.entries[key]) state.entries[key] = {};
    state.entries[key].stream = stream;
    this._busy = true;
    try{ saveState(); }finally{ this._busy = false; }
    if(typeof renderHomeCheckIn === 'function') safeRender(renderHomeCheckIn);
    if(typeof renderLogCalendar === 'function') safeRender(renderLogCalendar);
  },

  overloadArchived(title, emotions){
    const flags = (emotions || []).slice(0, 4).join(', ');
    this.pulse('overload', 'SYSTEM GLITCH', {
      type: 'glitch',
      body: title ? `Offload: ${title}${flags ? ' · ' + flags : ''}` : 'Mental health offload archived',
    });
  },

  pressSaved(title){ this.pulse('press', title ? `Published: ${title}` : 'New press post', { type: 'press' }); },
  gallerySaved(caption){ this.pulse('gallery', caption || 'New photo on wall', { type: 'photo' }); },

  hobbyLogged(name, hours){
    this.pulse('hobby', hours ? `${name} · ${hours}h` : `${name}`, { type: 'hobby', body: hours ? `Hobby session logged` : undefined });
  },

  skillUpdated(name, delta){
    this.pulse('skill', `${name} ${delta > 0 ? '+' : ''}${delta}h`, { type: 'hobby' });
  },

  skillTierUp(name, tierName, level){
    this.pulse('skill', `${name} → Lv ${level} · ${tierName}`, { type: 'win', body: 'Skill milestone reached' });
  },

  skillMilestone(name, title){
    this.pulse('skill', `${name}: ${title}`, { type: 'win', body: 'New skill milestone logged' });
  },

  skillUnlocked(name){
    this.pulse('unlock', `New skill tower: ${name}`, { type: 'win' });
  },

  playerMet(name){
    this.pulse('meetup', `Met up with ${name}`, { type: 'person' });
  },

  placeVisited(name){
    this.pulse('place', `Visited ${name}`, { type: 'place' });
  },

  cardUnlocked(kind, name){
    const label = kind === 'place' ? 'place' : (kind === 'skill' ? 'skill' : 'player');
    this.pulse('unlock', `New ${label} unlocked: ${name}`, { type: 'win' });
  },

  pinPosted(name, location){
    const label = location ? `Board: ${name} from ${location}` : (name ? `Board: ${name}` : 'New community post');
    this.pulse('pinboard', label, { type: 'message' });
  },

  dramaUpdated(title, ep){ this.pulse('drama', `${title} · ep ${ep}`, { type: 'film' }); },
  moodChanged(label){ this.pulse('mood', `Mood → ${label}`, { type: 'mood' }); },
  stepsSynced(count){ this.pulse('steps', `Steps synced: ${Number(count).toLocaleString()}`, { type: 'health' }); },
};
