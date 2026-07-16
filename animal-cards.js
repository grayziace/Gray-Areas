/* ===== Community animal cards — spotted creatures & pets ===== */

function normalizeAnimalKind(animal){
  const k = (animal?.kind || animal?.animalType || 'spotted').toLowerCase();
  return k === 'pet' ? 'pet' : 'spotted';
}

function animalKindMeta(kind){
  if(kind === 'pet'){
    return {
      badge: 'My pet',
      whereTitle: 'Where they live',
      whereTease: '🏠',
      storyPlaceholder: 'How you met, their personality, favourite things…',
    };
  }
  return {
    badge: 'Spotted',
    whereTitle: 'Where spotted',
    whereTease: '📍',
    storyPlaceholder: 'The story of how you met them — where, what happened…',
  };
}

function buildAnimalCoderSticker(creatorId){
  if(!creatorId) return '';
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(creatorId)
    : (typeof getCoderById === 'function' ? getCoderById(creatorId) : null);
  if(!c) return '';
  const img = c.avatar || c.image;
  const accent = c.cardColor || '#38bdf8';
  const inner = img
    ? `<img src="${esc(img)}" alt="${esc(c.name || '')}">`
    : `<span class="animal-coder-initial">${esc((c.name || '?').charAt(0))}</span>`;
  return `<button type="button" class="animal-coder-sticker" data-coder-board="${esc(creatorId)}" style="--coder-neon:${esc(accent)}" title="${esc(c.name || 'Coder')}">${inner}</button>`;
}

function buildAnimalCardFront(animal, opts = {}){
  const accent = animal.color || stableNeon(animal.id || animal.name, opts.index || 0);
  const kind = normalizeAnimalKind(animal);
  const meta = animalKindMeta(kind);
  const art = animal.image
    ? `<img src="${esc(animal.image)}" alt="" loading="lazy">`
    : `<span class="animal-art-ph">${esc((animal.name || '?').charAt(0).toUpperCase())}</span>`;
  const creator = buildAnimalCoderSticker(animal.creatorId);
  return `<div class="pc-front animal-front" style="--pc-accent:${accent}">
    <div class="pc-frame-glow"></div>
    <div class="pc-head pc-head-simple">
      <span class="pc-name">${esc(animal.name || 'Animal')}</span>
      <span class="pc-lv">${esc(animal.species || 'creature')}</span>
    </div>
    <span class="animal-kind-badge">${esc(meta.badge)}</span>
    <div class="pc-art animal-art">${art}${creator}</div>
    ${animal.whereSeen ? `<p class="animal-where-tease">${meta.whereTease} ${esc(animal.whereSeen.slice(0, 48))}${animal.whereSeen.length > 48 ? '…' : ''}</p>` : ''}
    <span class="flip-hint-front">↻ animal story</span>
  </div>`;
}

function buildAnimalCardBack(animal, opts = {}){
  const accent = animal.color || stableNeon(animal.id || animal.name, opts.index || 0);
  const kind = normalizeAnimalKind(animal);
  const meta = animalKindMeta(kind);
  const canEdit = !!opts.canEdit;
  return `<div class="pc-back animal-back" style="--pc-accent:${accent}">
    <div class="pc-back-title">${esc(animal.name || 'Animal')}</div>
    <div class="pc-row"><span>Type</span><span>${esc(meta.badge)}</span></div>
    ${animal.species ? `<div class="pc-row"><span>Species</span><span>${esc(animal.species)}</span></div>` : ''}
    ${animal.whereSeen ? `<div class="pc-block"><div class="pc-block-title">${esc(meta.whereTitle)}</div><p>${esc(animal.whereSeen)}</p></div>` : ''}
    ${animal.story ? `<div class="pc-block"><div class="pc-block-title">Animal story</div><p>${esc(animal.story)}</p></div>` : ''}
    ${animal.vibe ? `<div class="pc-row"><span>Vibe</span><span>${esc(animal.vibe)}</span></div>` : ''}
    ${canEdit ? `<div class="pc-admin-row edit-when-editing">
      <button type="button" class="btn flip-edit-btn" data-animal-edit="${esc(animal.id)}">Edit</button>
      <button type="button" class="btn admin-delete" data-animal-del="${esc(animal.id)}">Delete</button>
    </div>` : ''}
    <span class="flip-hint-back">flip back</span>
  </div>`;
}

function buildFlipAnimalCard(animal, index, opts = {}){
  const accent = animal.color || stableNeon(animal.id || animal.name, index);
  const tilt = ((index % 5) * 1.0 - 2).toFixed(1);
  const cardOpts = { ...opts, index };
  return `<figure class="poke-flip animal-flip" style="--pc-accent:${accent};--tilt:${tilt}deg" data-card-id="${esc(animal.id)}" data-card-type="animal" data-creator-id="${esc(animal.creatorId || '')}" data-animal-kind="${esc(normalizeAnimalKind(animal))}">
    <div class="poke-flip-scene"><div class="poke-flip-inner">
      <div class="poke-flip-face poke-flip-front">${buildAnimalCardFront(animal, cardOpts)}</div>
      <div class="poke-flip-face poke-flip-back">${buildAnimalCardBack(animal, cardOpts)}</div>
    </div></div>
  </figure>`;
}

function bindAnimalCards(container, opts = {}){
  if(!container) return;
  if(typeof bindFlipPlayerCards === 'function') bindFlipPlayerCards(container);
  container.querySelectorAll('[data-coder-board]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if(btn.dataset.coderBoard && typeof navigateToCoderBoard === 'function'){
        navigateToCoderBoard(btn.dataset.coderBoard);
      }
    });
  });
  container.querySelectorAll('[data-animal-edit]').forEach(btn => {
    if(btn.dataset.animalBound) return;
    btn.dataset.animalBound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const fig = btn.closest('.animal-flip');
      const ownerId = fig?.dataset.creatorId;
      if(ownerId && typeof openCoderAnimalEditor === 'function') openCoderAnimalEditor(ownerId, btn.dataset.animalEdit);
    });
  });
  container.querySelectorAll('[data-animal-del]').forEach(btn => {
    if(btn.dataset.animalBound) return;
    btn.dataset.animalBound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const fig = btn.closest('.animal-flip');
      const ownerId = fig?.dataset.creatorId;
      if(!ownerId || !confirm('Remove this animal card?')) return;
      if(typeof deleteCoderCollectionItem === 'function') deleteCoderCollectionItem(ownerId, 'animals', btn.dataset.animalDel);
      if(typeof refreshCoderProfileUI === 'function') refreshCoderProfileUI(ownerId, { tab: 'animals' });
      if(typeof renderCommunityAnimals === 'function') renderCommunityAnimals();
    });
  });
}
