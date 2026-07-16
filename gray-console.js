/* ===== System Console — private AI friend for Player Gray ===== */

const SYSTEM_CONSOLE_MODES = {
  friend: { label: 'Friend', icon: '◎', hint: 'Talk freely — remembers what you share.' },
  career: { label: 'Career', icon: '⌁', hint: 'Jobs, skills, qualifications, next moves.' },
  personality: { label: 'Personality', icon: '◇', hint: 'Who you are, patterns, growth, inner work.' },
};

function ensureSystemConsoleMemory(){
  if(!state.systemConsoleMemory || typeof state.systemConsoleMemory !== 'object'){
    state.systemConsoleMemory = {
      facts: [], career: [], personality: [], qualifications: [], messages: [],
    };
  }
  const m = state.systemConsoleMemory;
  ['facts', 'career', 'personality', 'qualifications', 'messages'].forEach(k => {
    if(!Array.isArray(m[k])) m[k] = [];
  });
  return m;
}

function collectSiteQualifications(){
  const lines = [];
  const player = typeof getPlayer === 'function' ? getPlayer() : {};
  const pc = player.pokeCard || {};
  if(player.cardDescription) lines.push(`Profile: ${player.cardDescription.slice(0, 200)}`);
  if(player.cardSubtitle || pc.subtitle) lines.push(`Title: ${player.cardSubtitle || pc.subtitle}`);
  if(pc.mbti) lines.push(`MBTI: ${pc.mbti}`);
  (pc.abilities || []).forEach(a => { if(a?.name) lines.push(`Ability: ${a.name}`); });
  (typeof getSkills === 'function' ? getSkills() : []).forEach(s => {
    const hrs = typeof getTotalSkillHours === 'function' ? getTotalSkillHours(s.id) : 0;
    const tier = typeof getSkillTier === 'function' ? getSkillTier(hrs) : null;
    lines.push(`Skill ${s.name}: ${hrs}h · tier ${tier?.name || '—'}`);
    (s.milestones || []).forEach(ms => {
      if(ms?.title) lines.push(`Milestone [${s.name}]: ${ms.title} — ${ms.note || ''}`.trim());
    });
  });
  (typeof getArticles === 'function' ? getArticles() : []).slice(0, 6).forEach(a => {
    lines.push(`Writing [${a.section}]: ${a.title}`);
  });
  (typeof getCharacters === 'function' ? getCharacters() : []).slice(0, 8).forEach(c => {
    if(c.cardDescription) lines.push(`Connection ${c.name}: ${c.cardDescription.slice(0, 120)}`);
  });
  if(state.bio) lines.push(`Bio: ${state.bio}`);
  return [...new Set(lines)].slice(0, 48);
}

function syncSiteQualificationsToMemory(){
  const mem = ensureSystemConsoleMemory();
  const site = collectSiteQualifications();
  site.forEach(line => {
    if(!mem.qualifications.includes(line)) mem.qualifications.unshift(line);
  });
  if(mem.qualifications.length > 60) mem.qualifications.length = 60;
  saveState();
}

function buildSystemContext(){
  syncSiteQualificationsToMemory();
  const mem = ensureSystemConsoleMemory();
  const player = typeof getPlayer === 'function' ? getPlayer() : {};
  const skills = typeof getSkills === 'function' ? getSkills() : [];
  const recentDays = Object.keys(state.entries || {}).sort().slice(-7).map(k => {
    const n = typeof normalizeEntry === 'function' ? normalizeEntry(state.entries[k]) : {};
    return `${k}: mood=${n.currentMood || n.mood || '—'}, people=${(n.people || []).join(', ') || '—'}, places=${(n.places || []).join(', ')}`;
  });
  const quests = (state.quests || []).filter(q => q.status === 'completed').slice(0, 5)
    .map(q => `Quest done: ${q.title} (from ${q.fromName})`);
  const media = (typeof allDramas === 'function' ? allDramas() : []).filter(d => d.status === 'watching' || d.finalReview)
    .slice(0, 5).map(d => `Media: ${d.title} (${d.mediaType})`);
  return [
    `You are the System Console — Gray's private AI inside Gray Areas, a personal life-logging game site.`,
    `Gray (she/her) uses this in Shenzhen and the UK. Be warm, direct, a little playful — like a smart friend who knows the whole board.`,
    `Player profile: ${player.name || 'Gray'}, level ${player.pokeCard?.level || 0}, ${state.playerPoints || 0} XP.`,
    `Bio: ${state.bio || player.bio || '—'}`,
    `Card line: ${player.cardDescription || '—'}`,
    `Skills: ${skills.map(s => {
      const hrs = typeof getTotalSkillHours === 'function' ? getTotalSkillHours(s.id) : 0;
      const t = typeof getSkillTier === 'function' ? getSkillTier(hrs) : {};
      return `${s.name} ${hrs}h · ${t.name || 'tier?'}`;
    }).join(', ') || 'none'}`,
    `Qualifications & site knowledge: ${mem.qualifications.slice(0, 20).join(' · ') || 'building…'}`,
    `Recent days: ${recentDays.join(' | ') || 'none'}`,
    `Quests completed lately: ${quests.join(' · ') || 'none'}`,
    `Media: ${media.join(' · ') || 'none'}`,
    `Career notes (Gray told you): ${mem.career.slice(0, 14).join(' · ') || 'none yet'}`,
    `Personality notes: ${mem.personality.slice(0, 14).join(' · ') || 'none yet'}`,
    `General facts: ${mem.facts.slice(0, 16).join(' · ') || 'none yet'}`,
    `Never mention System Overload vault contents, body logs, vents, calories, or weight — strictly private.`,
  ].join('\n');
}

const SystemConsole = {
  mode: 'friend',
  busy: false,

  init(){
    const back = document.getElementById('systemConsoleBack');
    if(!back || back.dataset.bound) return;
    back.dataset.bound = '1';
    document.getElementById('closeSystemConsole')?.addEventListener('click', () => this.close());
    back.addEventListener('click', e => { if(e.target.id === 'systemConsoleBack') this.close(); });
    document.getElementById('systemConsoleForm')?.addEventListener('submit', e => {
      e.preventDefault();
      this.send();
    });
    document.querySelectorAll('[data-console-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.consoleMode || 'friend';
        document.querySelectorAll('[data-console-mode]').forEach(b => b.classList.toggle('is-active', b.dataset.consoleMode === this.mode));
      });
    });
  },

  open(){
    if(!isAdmin()) return;
    this.init();
    ensureSystemConsoleMemory();
    syncSiteQualificationsToMemory();
    document.getElementById('systemConsoleBack')?.classList.remove('hidden');
    document.body.classList.add('system-console-open');
    this.renderMessages();
    document.getElementById('systemConsoleInput')?.focus();
  },

  close(){
    document.getElementById('systemConsoleBack')?.classList.add('hidden');
    document.body.classList.remove('system-console-open');
    if(typeof resetConsoleInput === 'function'){
      const inp = document.getElementById('communityConsoleInput');
      resetConsoleInput(inp);
    }
  },

  renderMessages(){
    const host = document.getElementById('systemConsoleMessages');
    if(!host) return;
    const mem = ensureSystemConsoleMemory();
    const rows = mem.messages.slice(-40).map(m => `
      <div class="sys-console-msg is-${m.role}">
        <span class="sys-console-role">${m.role === 'user' ? 'Gray' : 'System'}</span>
        <p>${esc(m.text)}</p>
      </div>`).join('');
    host.innerHTML = rows || '<p class="empty-hint">Say anything — I pull from your whole site and remember what you tell me.</p>';
    host.scrollTop = host.scrollHeight;
  },

  rememberSnippet(text, mode){
    const mem = ensureSystemConsoleMemory();
    const line = text.trim().slice(0, 320);
    if(!line || line.length < 8) return;
    const bucket = mode === 'career' ? mem.career : mode === 'personality' ? mem.personality : mem.facts;
    if(!bucket.includes(line)) bucket.unshift(line);
    if(bucket.length > 50) bucket.length = 50;
    saveState();
  },

  async send(){
    if(this.busy || !isAdmin()) return;
    const inp = document.getElementById('systemConsoleInput');
    const text = inp?.value?.trim();
    if(!text) return;
    const mem = ensureSystemConsoleMemory();
    mem.messages.push({ role: 'user', text, mode: this.mode, at: new Date().toISOString() });
    this.rememberSnippet(text, this.mode);
    inp.value = '';
    this.renderMessages();
    this.busy = true;
    const replyHost = document.getElementById('systemConsoleMessages');
    if(replyHost) replyHost.insertAdjacentHTML('beforeend', '<div class="sys-console-msg is-assistant"><span class="sys-console-role">System</span><p class="sys-console-typing">…</p></div>');
    try{
      const modeHint = SYSTEM_CONSOLE_MODES[this.mode]?.hint || '';
      const prompt = `${buildSystemContext()}\n\nMode: ${this.mode} — ${modeHint}\n\nGray says: ${text}\n\nReply in 2–6 sentences. Use "I" when speaking as the system friend. Reference site data when relevant.`;
      const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), { method: 'GET' });
      let reply = res.ok ? (await res.text()).trim() : 'Signal weak — try again in a moment.';
      if(reply.length > 1400) reply = reply.slice(0, 1400) + '…';
      mem.messages.push({ role: 'assistant', text: reply, mode: this.mode, at: new Date().toISOString() });
      if(typeof awardGrayPoints === 'function') awardGrayPoints(GRAY_XP_AWARDS.console_chat.xp, 'console_chat');
      saveState();
    }catch(err){
      mem.messages.push({ role: 'assistant', text: 'Could not reach the text relay — check connection (works in CN/UK via pollinations).', mode: this.mode, at: new Date().toISOString() });
      saveState();
    }
    this.busy = false;
    replyHost?.querySelector('.sys-console-typing')?.closest('.sys-console-msg')?.remove();
    this.renderMessages();
  },
};
