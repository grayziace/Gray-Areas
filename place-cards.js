/* ===== Place cards — separate from people/player cards ===== */

function normalizePlaceCard(item){
  const base = typeof defaultPlaceCard === 'function' ? defaultPlaceCard() : {
    level: 1, vibeRank: 0, experienceRank: 0, utilityRank: 0, description: '',
  };
  if(item?.placeCard) return { ...base, ...item.placeCard };
  if(item?.pokeCard){
    return {
      ...base,
      level: item.pokeCard.level || 1,
      description: item.pokeCard.vibe || item.vibe || item.memory || item.quote || '',
      vibeRank: 3, experienceRank: 3, utilityRank: 3,
    };
  }
  return {
    ...base,
    description: item?.vibe || item?.memory || item?.description || '',
  };
}

function getPlaceLevel(item){
  const card = normalizePlaceCard(item);
  const fromLogs = typeof countPlaceVisits === 'function' ? countPlaceVisits(item.name) : 0;
  return Math.min(100, Math.max(card.level || 1, fromLogs));
}

function parsePlaceCardText(raw){
  if(!raw?.trim()) return null;
  const t = raw.replace(/\r/g, '').trim();
  const pick = (re) => {
    const m = t.match(re);
    return m ? m[1].trim() : '';
  };
  const name = pick(/(?:Location Name|1\.\s*Location Name)\s*:?\s*(.+)$/im)
    || pick(/^Name\s*:?\s*(.+)$/im);
  const level = parseInt(pick(/(?:Level|2\.\s*Level)\s*:?\s*(\d+)/im), 10) || 1;
  const vibeRank = parseRank(pick(/(?:Vibe Rank|3\.\s*Vibe Rank)[^:]*:?\s*(\d+)/im));
  const experienceRank = parseRank(pick(/(?:Experience Rank|4\.\s*Experience Rank)[^:]*:?\s*(\d+)/im));
  const utilityRank = parseRank(pick(/(?:Utility Rank|5\.\s*Utility Rank)[^:]*:?\s*(\d+)/im));
  const descMatch = t.match(/(?:Description|6\.\s*Description)\s*:?\s*([\s\S]+)$/im);
  const description = descMatch ? descMatch[1].trim() : '';

  return {
    name,
    placeCard: {
      level: Math.min(100, Math.max(1, level)),
      vibeRank, experienceRank, utilityRank, description,
    },
  };
}

function itemToPlaceBlob(item){
  const pc = normalizePlaceCard(item);
  return [
    'Place Card Template',
    '',
    `1. Location Name: ${item.name || ''}`,
    `2. Level: ${pc.level}`,
    `3. Vibe Rank (1-5): ${pc.vibeRank || ''}`,
    `4. Experience Rank (1-5): ${pc.experienceRank || ''}`,
    `5. Utility Rank (1-5): ${pc.utilityRank || ''}`,
    `6. Description: ${pc.description || ''}`,
  ].join('\n');
}

function placeRankRow(label, rank, accent){
  if(!rank) return '';
  return `<div class="plc-rank-row"><span class="plc-rank-label">${label}</span>${neonDots(rank, 5, accent)}</div>`;
}

function placeOverallRank(pc){
  const ranks = [pc.vibeRank, pc.experienceRank, pc.utilityRank].map(r => parseRank(r)).filter(r => r > 0);
  if(!ranks.length) return 0;
  return Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length);
}

function buildPlaceCardFront(item, unlocked, opts = {}){
  const pc = normalizePlaceCard(item);
  const level = unlocked ? getPlaceLevel(item) : '??';
  const accent = opts.accent || stableNeon(item.id || item.name, 0);
  const artSrc = item.image;
  const name = unlocked ? esc(item.name) : '???';
  const art = buildCardPhotoHtml(artSrc, unlocked, item.name, { x: item.imageFocusX, y: item.imageFocusY });
  const overall = placeOverallRank(pc);

  return `<div class="pc-front plc-front" style="--pc-accent:${accent}">
    ${adminCardEditBtn()}
    <div class="pc-frame-glow"></div>
    <div class="pc-head pc-head-simple">
      <span class="pc-name">${name}</span>
      <span class="pc-lv" title="Times visited">×${level}</span>
    </div>
    <div class="pc-art">${art}</div>
    ${unlocked && overall ? `<div class="plc-ranks plc-overall">${placeRankRow('Score', overall, accent)}</div>` : ''}
    <span class="flip-hint-front">↻ details</span>
  </div>`;
}

function buildPlaceCardBack(item, unlocked, opts = {}){
  const pc = normalizePlaceCard(item);
  const accent = opts.accent || stableNeon(item.id || item.name, 0);
  const cardId = opts.cardId || item.id || '';
  if(!unlocked){
    return `<div class="pc-back locked-back" style="--pc-accent:${accent}"><p class="pc-locked">Locked — visit to unlock</p><span class="flip-hint-back">flip back</span></div>`;
  }
  const level = getPlaceLevel(item);
  return `<div class="pc-back plc-back" style="--pc-accent:${accent}">
    <div class="pc-back-title">${esc(item.name)}</div>
    <div class="pc-row"><span>Visits</span><span>×${level}</span></div>
    ${placeRankRow('Vibe', pc.vibeRank, accent)}
    ${placeRankRow('Experience', pc.experienceRank, accent)}
    ${placeRankRow('Utility', pc.utilityRank, accent)}
    ${pc.description ? `<div class="plc-desc"><p>${esc(pc.description)}</p></div>` : ''}
    <div class="pc-card-actions">
      <button type="button" class="btn card-visit-btn" data-visit-name="${esc(item.name)}">◎ Visited today</button>
    </div>
    <div class="pc-admin-row edit-when-editing">
      <button type="button" class="btn flip-edit-btn">Edit</button>
      ${cardId ? `<button type="button" class="btn admin-delete flip-del-btn" data-del-type="place" data-del-id="${esc(cardId)}">Delete</button>` : ''}
    </div>
    <span class="flip-hint-back">flip back</span>
  </div>`;
}

function buildFlipPlaceCard(item, index){
  const unlocked = item.unlocked || getUnlockedZones().includes(item.name);
  const id = item.id || item.name;
  const accent = stableNeon(id, index);
  const tilt = ((index % 3) * 0.9 - 0.9).toFixed(1);
  const cls = ['poke-flip', 'place-flip', !unlocked ? 'locked' : ''].filter(Boolean).join(' ');

  return `<figure class="${cls}" style="--pc-accent:${accent};--tilt:${tilt}deg" data-card-id="${esc(id)}" data-card-type="place">
    <div class="poke-flip-scene"><div class="poke-flip-inner">
      <div class="poke-flip-face poke-flip-front">${buildPlaceCardFront(item, unlocked, { accent })}</div>
      <div class="poke-flip-face poke-flip-back">${buildPlaceCardBack(item, unlocked, { accent, cardId: id })}</div>
    </div></div>
  </figure>`;
}

function placeCardEditorHtml(item){
  const blob = item?.placeBlob || itemToPlaceBlob(item || { name: '', placeCard: {} });
  const img = item?.image || '';
  return `
    <div class="place-card-editor">
      <div class="field"><label>Paste place card template</label>
        <textarea id="ce_place_blob" rows="12">${esc(blob)}</textarea>
      </div>
      <button type="button" class="btn" id="parsePlaceBtn">Build card from text</button>
      <p class="gen-note" id="parsePlacePreview"></p>
      ${ImageTools.blockHtml({
        prefix: 'ce_place_photo',
        label: 'Place photo',
        currentUrl: img || '',
        descValue: item?.photoPrompt || '',
        descPlaceholder: 'Neon alley, noodle shop glow, rain-slick pavement…',
        hiddenId: 'ce_image',
        imageFocusX: item?.imageFocusX,
        imageFocusY: item?.imageFocusY,
      })}
    </div>`;
}

function wirePlaceCardEditor(){
  document.getElementById('parsePlaceBtn')?.addEventListener('click', () => {
    const parsed = parsePlaceCardText(document.getElementById('ce_place_blob')?.value);
    const el = document.getElementById('parsePlacePreview');
    if(el) el.textContent = parsed?.name
      ? `✓ ${parsed.name} · ×${parsed.placeCard.level} visits · V${parsed.placeCard.vibeRank} E${parsed.placeCard.experienceRank} U${parsed.placeCard.utilityRank}`
      : 'Could not parse — check template format.';
  });

  ImageTools.wire({
    prefix: 'ce_place_photo',
    kind: 'place',
    hiddenId: 'ce_image',
    cropAspect: [3, 4],
    onChange: url => { pendingContentImage = url; },
  });
}

function readPlaceCardForm(){
  const blob = document.getElementById('ce_place_blob')?.value || '';
  const parsed = parsePlaceCardText(blob);
  const placeCard = parsed?.placeCard ? { ...parsed.placeCard } : normalizePlaceCard({});
  return {
    parsed,
    placeCard,
    placeBlob: blob,
    photoPrompt: document.getElementById('ce_place_photo_desc')?.value?.trim() || '',
  };
}
