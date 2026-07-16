/* ===== Skill cards — collectible flip cards ===== */

const SKILL_CARD_NEW = '__new__';

function skillCardAccent(skill){
  return skill?.color || '#7c4dff';
}

function resolveSkillCardHours(skill, opts = {}){
  if(opts.useStoredHours) return Number(skill.hours) || 0;
  if(typeof getTotalSkillHours === 'function' && typeof getSkills === 'function' && getSkills().some(s => s.id === skill.id)){
    return getTotalSkillHours(skill.id);
  }
  return Number(skill.hours) || 0;
}

function buildSkillCardFront(skill, opts = {}){
  const accent = skillCardAccent(skill);
  const hrs = resolveSkillCardHours(skill, opts);
  const tier = typeof getSkillTier === 'function' ? getSkillTier(hrs) : { level: 1, name: 'Initiate' };
  const icon = (skill.name || '?').charAt(0).toUpperCase();
  return `<div class="pc-front skc-front" style="--pc-accent:${accent}">
    ${typeof adminCardEditBtn === 'function' ? adminCardEditBtn() : ''}
    <div class="pc-frame-glow"></div>
    <div class="pc-head pc-head-simple">
      <span class="pc-name">${esc(skill.name)}</span>
      <span class="pc-lv">Lv ${tier.level}</span>
    </div>
    <div class="skc-art" aria-hidden="true"><span class="skc-glyph">${esc(icon)}</span></div>
    <p class="skc-tier-name">${esc(tier.name)}</p>
    <p class="skc-hours">${Math.round(hrs * 10) / 10}h logged</p>
    <span class="flip-hint-front">↻ progress</span>
  </div>`;
}

function buildSkillCardBack(skill, opts = {}){
  const accent = skillCardAccent(skill);
  const hrs = resolveSkillCardHours(skill, opts);
  const tier = typeof getSkillTier === 'function' ? getSkillTier(hrs) : { level: 1, name: 'Initiate', next: null };
  const hobbies = typeof getHobbyNamesForSkill === 'function' ? getHobbyNamesForSkill(skill) : [];
  const ms = (skill.milestones || []).length;
  const next = tier.next ? `${Math.ceil(tier.next.hours - hrs)}h to ${tier.next.name}` : 'MAX TIER';
  return `<div class="pc-back skc-back" style="--pc-accent:${accent}">
    <div class="pc-back-title">${esc(skill.name)}</div>
    <div class="pc-row"><span>Tier</span><span>${esc(tier.name)}</span></div>
    <div class="pc-row"><span>Hours</span><span>${Math.round(hrs * 10) / 10}h</span></div>
    <div class="pc-row"><span>Next</span><span>${esc(next)}</span></div>
    <div class="pc-row"><span>Milestones</span><span>${ms}</span></div>
    ${hobbies.length ? `<div class="skc-hobbies"><span class="skc-hobbies-label">Daily log hobbies</span><p>${esc(hobbies.join(', '))}</p></div>` : ''}
    <button type="button" class="btn skill-open-journey" data-skill-id="${esc(skill.id)}">View journey</button>
    <div class="pc-admin-row edit-when-editing">
      <button type="button" class="btn flip-edit-btn" data-skill-edit="${esc(skill.id)}">Edit tower</button>
    </div>
    <span class="flip-hint-back">flip back</span>
  </div>`;
}

function buildFlipSkillCard(skill, index, opts = {}){
  const accent = skillCardAccent(skill);
  const tilt = ((index % 5) * 1.1 - 2.2).toFixed(1);
  const id = skill.id;
  const cardOpts = { accent, ...opts };
  return `<figure class="poke-flip skill-flip" style="--pc-accent:${accent};--tilt:${tilt}deg" data-card-id="${esc(id)}" data-card-type="skill">
    <div class="poke-flip-scene"><div class="poke-flip-inner">
      <div class="poke-flip-face poke-flip-front">${buildSkillCardFront(skill, cardOpts)}</div>
      <div class="poke-flip-face poke-flip-back">${buildSkillCardBack(skill, cardOpts)}</div>
    </div></div>
  </figure>`;
}

function bindSkillCards(container){
  if(!container) return;
  if(typeof bindFlipPlayerCards === 'function') bindFlipPlayerCards(container);
  container.querySelectorAll('.skill-open-journey').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if(typeof openSkillJourney === 'function') openSkillJourney(btn.dataset.skillId);
    });
  });
  container.querySelectorAll('[data-skill-edit]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if(typeof openSkillEditor === 'function') openSkillEditor(btn.dataset.skillEdit);
    });
  });
}

function renderSkillCardDeck(){
  const deck = document.getElementById('skillDeck');
  if(!deck) return;
  const skills = typeof getSkills === 'function' ? getSkills() : [];
  if(!skills.length){
    deck.innerHTML = '<p class="empty-hint">No skill cards yet — add a tower in edit mode.</p>';
    return;
  }
  deck.innerHTML = skills.map((s, i) => buildFlipSkillCard(s, i)).join('');
  bindSkillCards(deck);
}
