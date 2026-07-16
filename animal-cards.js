/* ===== Community animal cards — coder-spotted creatures ===== */

function buildAnimalCardFront(animal, opts = {}){
  const accent = animal.color || stableNeon(animal.id || animal.name, opts.index || 0);
  const art = animal.image
    ? `<img src="${esc(animal.image)}" alt="" loading="lazy">`
    : `<span class="animal-art-ph">${esc((animal.name || '?').charAt(0).toUpperCase())}</span>`;
  const creator = animal.creatorName
    ? `<button type="button" class="animal-creator-chip" data-coder-board="${esc(animal.creatorId || '')}">Spotted by ${esc(animal.creatorName)}</button>`
    : '';
  return `<div class="pc-front animal-front" style="--pc-accent:${accent}">
    <div class="pc-frame-glow"></div>
    <div class="pc-head pc-head-simple">
      <span class="pc-name">${esc(animal.name || 'Animal')}</span>
      <span class="pc-lv">${esc(animal.species || 'creature')}</span>
    </div>
    <div class="pc-art animal-art">${art}</div>
    ${animal.whereSeen ? `<p class="animal-where-tease">📍 ${esc(animal.whereSeen.slice(0, 48))}${animal.whereSeen.length > 48 ? '…' : ''}</p>` : ''}
    ${creator}
    <span class="flip-hint-front">↻ story</span>
  </div>`;
}

function buildAnimalCardBack(animal, opts = {}){
  const accent = animal.color || stableNeon(animal.id || animal.name, opts.index || 0);
  const canEdit = !!opts.canEdit;
  return `<div class="pc-back animal-back" style="--pc-accent:${accent}">
    <div class="pc-back-title">${esc(animal.name || 'Animal')}</div>
    ${animal.species ? `<div class="pc-row"><span>Species</span><span>${esc(animal.species)}</span></div>` : ''}
    ${animal.whereSeen ? `<div class="pc-block"><div class="pc-block-title">Where spotted</div><p>${esc(animal.whereSeen)}</p></div>` : ''}
    ${animal.story ? `<div class="pc-block"><div class="pc-block-title">Hangout story</div><p>${esc(animal.story)}</p></div>` : ''}
    ${animal.vibe ? `<div class="pc-row"><span>Vibe</span><span>${esc(animal.vibe)}</span></div>` : ''}
    ${animal.creatorName ? `<div class="pc-row"><span>Card by</span><span>${esc(animal.creatorName)}</span></div>` : ''}
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
  return `<figure class="poke-flip animal-flip" style="--pc-accent:${accent};--tilt:${tilt}deg" data-card-id="${esc(animal.id)}" data-card-type="animal" data-creator-id="${esc(animal.creatorId || '')}">
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
