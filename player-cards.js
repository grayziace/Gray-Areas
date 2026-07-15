/* ===== Player card parse, render, editor ===== */

function normalizePokeCard(item){
  const base = typeof defaultPokeCard === 'function' ? defaultPokeCard() : {
    level: 1, mbti: '', spiritAnimalImage: '', spiritPrompt: '', cardColor: '', colorPalette: '',
    vibe: '', subtitle: '', abilities: [{ name: '', effect: '' }, { name: '', effect: '' }],
    moves: [{ name: '', effect: '' }, { name: '', effect: '' }],
    weakness: { name: '', effect: '' }, resistance: { name: '', effect: '' },
    retreatCost: '1', quote: '',
  };
  const pc = { ...base, ...(item?.pokeCard || item?.playerCard || {}) };
  if(!pc.cardColor && item?.cardColor) pc.cardColor = item.cardColor;
  if(!pc.quote && item?.quote) pc.quote = item.quote;
  if(!pc.subtitle && item?.cardSubtitle) pc.subtitle = item.cardSubtitle;
  if(!pc.abilities?.length) pc.abilities = base.abilities;
  if(!pc.moves?.length) pc.moves = base.moves;
  return pc;
}

function normalizeCardBlob(raw){
  return (raw || '')
    .replace(/\r/g, '')
    .replace(/AttributeDetail/gi, '')
    .replace(/(Card:|Name|Level|MBTI|Spirit Animal|Color Palette|Character Vibe|Abilities & Moves|Stats & Conditions|Weakness:|Resistance:|Retreat Cost:|Quote|Ability:|Move \d+:|Effect:)/gi, '\n$1')
    .replace(/\n+/g, '\n')
    .trim();
}

function pickLineField(text, labels){
  for(const label of labels){
    const re = new RegExp(`^${label}\\s*:?\\s*(.+)$`, 'im');
    const m = text.match(re);
    if(m) return m[1].trim();
  }
  return '';
}

function extractSection(text, startLabel, endLabels){
  const end = endLabels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`^${startLabel}\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n(?:${end})\\s*:|$)`, 'im');
  return re.exec(text)?.[1]?.trim() || '';
}

function splitStatLine(raw){
  const body = (raw || '').trim();
  if(!body) return { name: '', effect: '' };
  const structured = body.match(/^(.+?)\nEffect:\s*([\s\S]+)$/i);
  if(structured) return { name: structured[1].trim(), effect: structured[2].trim() };
  const dot = body.search(/\.\s+/);
  if(dot > 0 && dot < 120){
    return { name: body.slice(0, dot).trim(), effect: body.slice(dot + 2).trim() };
  }
  return { name: body, effect: '' };
}

function parseNameEffectLines(section){
  const entries = [];
  (section || '').split('\n').forEach(line => {
    line = line.trim();
    if(!line || /^stats\s/i.test(line)) return;
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if(m) entries.push({ name: m[1].trim(), effect: m[2].trim() });
  });
  return entries;
}

function parseStructuredAbilities(section){
  const abilities = [];
  const moves = [];
  section.split(/(?=(?:Ability:|Move\s*\d+:))/gi).filter(Boolean).forEach(chunk => {
    const nameM = chunk.match(/^(Ability:|Move\s*\d+:)\s*(.+?)(?:\n|$)/i);
    if(!nameM) return;
    const effectM = chunk.match(/Effect:\s*([\s\S]+?)$/i);
    const entry = { name: nameM[2].trim(), effect: effectM ? effectM[1].trim() : '' };
    if(/^Ability:/i.test(nameM[1])) abilities.push(entry);
    else moves.push(entry);
  });
  return { abilities, moves };
}

function distributeAbilityEntries(entries){
  if(!entries.length) return { abilities: [], moves: [] };
  if(entries.length <= 2) return { abilities: entries, moves: [] };
  const split = Math.ceil(entries.length / 2);
  return { abilities: entries.slice(0, split), moves: entries.slice(split) };
}

function parsePlayerCardText(raw){
  if(!raw?.trim()) return null;
  const text = raw.replace(/\r/g, '').trim();
  const out = {
    name: '', cardSubtitle: '', level: 1, mbti: '', spiritPrompt: '', colorPalette: '', vibe: '',
    abilities: [], moves: [],
    weakness: { name: '', effect: '' }, resistance: { name: '', effect: '' },
    retreatCost: '1', quote: '',
  };

  const titleMatch = text.match(/(?:Character Card|Card)\s*:\s*(.+?)(?:\n|$)/i);
  if(titleMatch){
    const parts = titleMatch[1].split(',').map(s => s.trim());
    out.name = parts[0] || '';
    out.cardSubtitle = parts.slice(1).join(', ') || '';
  }

  out.name = out.name || pickLineField(text, ['Name']);
  out.level = parseInt(pickLineField(text, ['Level']), 10) || 1;
  out.mbti = pickLineField(text, ['MBTI']);
  out.spiritPrompt = pickLineField(text, ['Spirit Animal']);
  out.colorPalette = pickLineField(text, ['Colour Palette', 'Color Palette']);
  out.vibe = pickLineField(text, ['Character Vibe']);

  const quoteIdx = text.search(/^Quote\s*:?/im);
  if(quoteIdx >= 0){
    out.quote = text.slice(quoteIdx)
      .replace(/^Quote\s*:?\s*/i, '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();
  }

  const retreat = pickLineField(text, ['Retreat Cost']);
  if(retreat) out.retreatCost = retreat.match(/^\d+/)?.[0] || retreat.split(/[—–-]/)[0].trim() || '1';

  const weakLine = pickLineField(text, ['Weakness']);
  if(weakLine) out.weakness = splitStatLine(weakLine);
  else {
    const wm = text.match(/Weakness:\s*([^\n]+)\nEffect:\s*([\s\S]*?)(?=\n(?:Resistance|Retreat|Quote)|$)/i);
    if(wm) out.weakness = { name: wm[1].trim(), effect: wm[2].trim() };
  }

  const resistLine = pickLineField(text, ['Resistance']);
  if(resistLine) out.resistance = splitStatLine(resistLine);
  else {
    const rm = text.match(/Resistance:\s*([^\n]+)\nEffect:\s*([\s\S]*?)(?=\n(?:Retreat|Quote)|$)/i);
    if(rm) out.resistance = { name: rm[1].trim(), effect: rm[2].trim() };
  }

  const abSection = extractSection(text, 'Abilities(?:\\s*&\\s*|\\s+and\\s+)Moves', ['Stats(?:\\s*&\\s*|\\s+and\\s+)Conditions', 'Weakness', 'Resistance', 'Retreat Cost', 'Quote']);
  if(/Ability:|Move\s*\d+:/i.test(abSection)){
    const parsed = parseStructuredAbilities(abSection);
    out.abilities = parsed.abilities;
    out.moves = parsed.moves;
  } else {
    const entries = parseNameEffectLines(abSection);
    const split = distributeAbilityEntries(entries);
    out.abilities = split.abilities;
    out.moves = split.moves;
  }

  if(!out.abilities.length && !out.moves.length){
    const legacy = normalizeCardBlob(raw);
    const section = legacy.match(/Abilities\s*(?:&|and)\s*Moves([\s\S]*?)(?:Stats\s*(?:&|and)\s*Conditions|$)/i)?.[1] || '';
    const parsed = parseStructuredAbilities(section);
    out.abilities = parsed.abilities;
    out.moves = parsed.moves;
  }

  return {
    name: out.name,
    cardSubtitle: out.cardSubtitle,
    pokeCard: {
      level: out.level, mbti: out.mbti, spiritPrompt: out.spiritPrompt,
      colorPalette: out.colorPalette, vibe: out.vibe, subtitle: out.cardSubtitle,
      abilities: out.abilities.filter(a => a.name),
      moves: out.moves.filter(m => m.name),
      weakness: out.weakness, resistance: out.resistance,
      retreatCost: out.retreatCost, quote: out.quote,
    },
  };
}

function itemToCardBlob(item, opts = {}){
  const pc = normalizePokeCard(item);
  const sub = pc.subtitle || item.cardSubtitle || '';
  const isPlace = opts.isPlace;
  const title = sub ? `Character Card: ${item.name || 'Unknown'}, ${sub}` : `Character Card: ${item.name || 'Unknown'}`;
  const lines = [
    title, '',
    `Level: ${pc.level}`, `MBTI: ${pc.mbti}`,
  ];
  if(!isPlace) lines.push(`Spirit Animal: ${pc.spiritPrompt || ''}`);
  lines.push(
    `Colour Palette: ${pc.colorPalette}`,
    `Character Vibe: ${pc.vibe}`,
    '',
    'Abilities and Moves:',
    '',
  );
  [...pc.abilities, ...pc.moves].filter(e => e?.name).forEach(e => {
    lines.push(`${e.name}: ${e.effect || ''}`);
  });
  lines.push('', 'Stats and Conditions:', '');
  if(pc.weakness?.name){
    lines.push(`Weakness: ${pc.weakness.name}${pc.weakness.effect ? `. ${pc.weakness.effect}` : ''}`);
  }
  if(pc.resistance?.name){
    lines.push(`Resistance: ${pc.resistance.name}${pc.resistance.effect ? `. ${pc.resistance.effect}` : ''}`);
  }
  if(pc.retreatCost) lines.push(`Retreat Cost: ${pc.retreatCost}`);
  lines.push('', 'Quote:', '', `"${pc.quote || ''}"`);
  return lines.join('\n');
}

function paletteToAccent(palette){
  const t = (palette || '').toLowerCase();
  if(t.includes('rose gold') || t.includes('rose')) return '#e8a87c';
  if(t.includes('pink')) return '#ff4fd8';
  if(t.includes('cyan')) return '#3ad6e0';
  if(t.includes('blue')) return '#4fa3ff';
  if(t.includes('purple')) return '#9b5cff';
  if(t.includes('gold')) return '#fbbf24';
  return '#ff4fd8';
}

function hexToRgb(hex){
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if(!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b){
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if(max === min){ h = s = 0; }
  else{
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l){
  h /= 360; s /= 100; l /= 100;
  if(s === 0){
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1/3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1/3) * 255,
  };
}

function toNeonAccent(hex){
  const rgb = hexToRgb(hex);
  if(!rgb) return null;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.min(100, Math.max(72, hsl.s * 1.15));
  hsl.l = Math.min(68, Math.max(48, hsl.l * 1.08 + 6));
  const out = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(out.r, out.g, out.b);
}

function getPlayerAccent(item, opts = {}){
  if(opts.heroAccent) return opts.heroAccent;
  if(opts.accent) return opts.accent;
  const pc = normalizePokeCard(item);
  if(pc.cardColor){
    return toNeonAccent(pc.cardColor) || pc.cardColor;
  }
  return paletteToAccent(pc.colorPalette);
}

function playerBriefDesc(item){
  if(item?.cardDescription?.trim()) return item.cardDescription.trim();
  const pc = normalizePokeCard(item);
  return pc.vibe || item.cardSubtitle || pc.subtitle || '';
}

function buildCardPhotoHtml(src, unlocked, name, focus){
  const fx = focus?.x ?? focus?.imageFocusX ?? 50;
  const fy = focus?.y ?? focus?.imageFocusY ?? 50;
  if(unlocked && src){
    return `<div class="card-photo-frame"><img src="${esc(src)}" alt="" loading="lazy" style="object-position:${fx}% ${fy}%"></div>`;
  }
  const ch = unlocked ? esc((name || '?').charAt(0)) : '?';
  return `<div class="card-photo-frame"><span class="pc-art-ph">${ch}</span></div>`;
}

function buildPlayerCardFront(item, unlocked, opts = {}){
  const pc = normalizePokeCard(item);
  const accent = getPlayerAccent(item, opts);
  const hideSpirit = opts.hideSpirit;
  const artSrc = item.image || item.avatar;
  const name = unlocked ? esc(item.name) : '???';
  const brief = unlocked ? playerBriefDesc(item) : '';
  const focus = { x: item.imageFocusX, y: item.imageFocusY };
  const spirit = !hideSpirit && unlocked && pc.spiritAnimalImage
    ? `<div class="pc-spirit-sticker"><img src="${esc(pc.spiritAnimalImage)}" alt=""></div>` : '';

  return `<div class="pc-front ${opts.hero ? 'pc-front-hero' : ''}" style="--pc-accent:${accent}">
    ${adminCardEditBtn()}
    <div class="pc-frame-glow"></div>
    <div class="pc-head pc-head-simple">
      <span class="pc-name">${name}</span>
      <span class="pc-lv">Lv ${unlocked ? pc.level : '??'}</span>
    </div>
    <div class="pc-art">${buildCardPhotoHtml(artSrc, unlocked, item.name, focus)}${spirit}</div>
    ${brief ? `<p class="pc-blurb">${esc(brief)}</p>` : ''}
    <span class="flip-hint-front">↻ details</span>
  </div>`;
}

function buildPlayerCardBack(item, unlocked, opts = {}){
  const pc = normalizePokeCard(item);
  const accent = getPlayerAccent(item, opts);
  const hideSpirit = opts.hideSpirit;
  const cardType = opts.cardType || 'character';
  const cardId = opts.cardId || item.id || '';
  if(!unlocked){
    return `<div class="pc-back locked-back" style="--pc-accent:${accent}"><p class="pc-locked">Locked</p><span class="flip-hint-back">flip back</span></div>`;
  }
  const row = (l, v) => v ? `<div class="pc-row"><span>${l}</span><span>${esc(String(v))}</span></div>` : '';
  const block = (l, n, e) => n ? `<div class="pc-block"><div class="pc-block-title">${l}: ${esc(n)}</div><p>${esc(e || '')}</p></div>` : '';

  return `<div class="pc-back" style="--pc-accent:${accent}">
    <div class="pc-back-title">${esc(item.name)}</div>
    ${pc.subtitle || item.cardSubtitle ? `<div class="pc-row"><span>Title</span><span>${esc(pc.subtitle || item.cardSubtitle)}</span></div>` : ''}
    ${row('Level', pc.level)}${row('MBTI', pc.mbti)}${row('Palette', pc.colorPalette)}
    ${pc.vibe ? `<div class="pc-block"><div class="pc-block-title">Vibe</div><p>${esc(pc.vibe)}</p></div>` : ''}
    ${!hideSpirit ? (pc.spiritAnimalImage ? `<div class="pc-spirit-row"><span>Spirit</span><img src="${esc(pc.spiritAnimalImage)}" alt=""></div>` : row('Spirit', pc.spiritPrompt)) : ''}
    ${pc.abilities.filter(a => a.name).map(a => block('Ability', a.name, a.effect)).join('')}
    ${pc.moves.filter(m => m.name).map(m => block('Move', m.name, m.effect)).join('')}
    ${block('Weakness', pc.weakness?.name, pc.weakness?.effect)}
    ${block('Resistance', pc.resistance?.name, pc.resistance?.effect)}
    ${row('Retreat', pc.retreatCost)}
    ${pc.quote ? `<div class="pc-quote">"${esc(pc.quote)}"</div>` : ''}
    <div class="pc-card-actions">
      <button type="button" class="btn card-meet-btn" data-meet-name="${esc(item.name)}">◎ Met up today</button>
    </div>
    <div class="pc-admin-row edit-when-editing">
      <button type="button" class="btn flip-edit-btn">Edit</button>
      ${cardType !== 'player' && cardId ? `<button type="button" class="btn admin-delete flip-del-btn" data-del-type="${esc(cardType)}" data-del-id="${esc(cardId)}">Delete</button>` : ''}
    </div>
    <span class="flip-hint-back">flip back</span>
  </div>`;
}

function buildFlipPlayerCard(item, cardType, index, opts = {}){
  const isPlace = cardType === 'place';
  const unlocked = isPlace ? (item.unlocked || getUnlockedZones().includes(item.name)) : true;
  const id = item.id || item.name;
  const accent = isPlace ? (opts.heroAccent || stableNeon(id, index)) : getPlayerAccent(item, opts);
  const tilt = opts.hero ? 0 : ((index % 5) * 1.2 - 2.4).toFixed(1);
  const cls = ['poke-flip', opts.hero ? 'player-card-hero' : '', isPlace ? 'place-flip' : '', !unlocked ? 'locked' : ''].filter(Boolean).join(' ');

  const faceOpts = { ...opts, hideSpirit: isPlace, accent, heroAccent: opts.heroAccent };

  return `<figure class="${cls}" style="--pc-accent:${accent};--tilt:${tilt}deg" data-card-id="${esc(id)}" data-card-type="${cardType}">
    <div class="poke-flip-scene"><div class="poke-flip-inner">
      <div class="poke-flip-face poke-flip-front">${buildPlayerCardFront(item, unlocked, faceOpts)}</div>
      <div class="poke-flip-face poke-flip-back">${buildPlayerCardBack(item, unlocked, { hideSpirit: isPlace, cardType, cardId: id, accent })}</div>
    </div></div>
  </figure>`;
}

function openCardEditor(fig){
  if(!fig || typeof openContentEditor !== 'function') return;
  const t = fig.dataset.cardType;
  const id = fig.dataset.cardId;
  if(t === 'player') openContentEditor('player', 'player', false);
  else if(t === 'place') openContentEditor('place', id, false);
  else openContentEditor('character', id, false);
}

function bindFlipPlayerCards(container){
  if(!container) return;
  if(container._flipHandler) container.removeEventListener('click', container._flipHandler);
  container._flipHandler = e => {
    const delBtn = e.target.closest('.flip-del-btn');
    if(delBtn){
      e.preventDefault();
      e.stopPropagation();
      if(delBtn.dataset.delId && typeof deleteContentItem === 'function'){
        deleteContentItem(delBtn.dataset.delType, delBtn.dataset.delId);
      }
      return;
    }
    const meetBtn = e.target.closest('.card-meet-btn');
    if(meetBtn){
      e.preventDefault();
      e.stopPropagation();
      if(typeof recordPlayerMeetup === 'function') recordPlayerMeetup(meetBtn.dataset.meetName);
      meetBtn.textContent = '✓ logged';
      meetBtn.disabled = true;
      return;
    }
    const visitBtn = e.target.closest('.card-visit-btn');
    if(visitBtn){
      e.preventDefault();
      e.stopPropagation();
      if(typeof recordPlaceVisit === 'function') recordPlaceVisit(visitBtn.dataset.visitName);
      visitBtn.textContent = '✓ logged';
      visitBtn.disabled = true;
      return;
    }
    if(e.target.closest('.flip-edit-btn, .card-edit-front')) return;
    const fig = e.target.closest('.poke-flip');
    if(!fig || !container.contains(fig)) return;
    const was = fig.classList.contains('is-flipped');
    container.querySelectorAll('.poke-flip.is-flipped').forEach(f => f.classList.remove('is-flipped'));
    if(!was) fig.classList.add('is-flipped');
    if(typeof OverloadLog !== 'undefined' && fig.classList.contains('player-card-hero') && fig.dataset.cardType === 'player'){
      OverloadLog.onHeroCardFlip();
    }
  };
  container.addEventListener('click', container._flipHandler);
}

function playerCardEditorHtml(item, opts = {}){
  const isPlace = opts.isPlace;
  const showSpirit = !isPlace;
  const blob = item?.cardBlob || itemToCardBlob(item || { name: '', pokeCard: {} }, { isPlace });
  const img = item?.image || item?.avatar;
  const pc = normalizePokeCard(item);
  const cardColor = pc.cardColor || '#ff4fd8';
  return `
    <div class="player-card-editor">
      <div class="field"><label>Paste character card</label>
        <span class="field-hint">Paste your full block — stats appear on the back when flipped.</span>
        <textarea id="ce_card_blob" rows="16" placeholder="Character Card: Name, Title&#10;&#10;Level: 22&#10;MBTI: ENTJ&#10;...">${esc(blob)}</textarea>
      </div>
      <button type="button" class="btn primary" id="parseCardBtn">Build card from text</button>
      <p class="gen-note" id="parseCardPreview"></p>
      <div class="field"><label>Card description <span class="field-hint">shows on front of card</span></label>
        <textarea id="ce_card_desc" rows="3" placeholder="Who they are in a sentence or two…">${esc(item?.cardDescription || '')}</textarea>
      </div>
      ${showSpirit ? `
      <div class="field player-color-field">
        <label>Card border colour <span class="field-hint">auto-neon glow</span></label>
        <div class="player-color-row">
          <input type="color" id="ce_card_color" value="${esc(cardColor)}">
          <span class="player-color-swatch" id="ce_card_color_preview" style="--swatch:${esc(toNeonAccent(cardColor) || cardColor)}"></span>
        </div>
      </div>` : ''}
      ${ImageTools.blockHtml({
        prefix: 'ce_portrait',
        label: 'Portrait',
        currentUrl: img || '',
        descValue: item?.lookPrompt || '',
        descPlaceholder: 'Rose gold hair, sharp eyes, cyberpunk jacket, neon rain…',
        hiddenId: 'ce_image',
        imageFocusX: item?.imageFocusX,
        imageFocusY: item?.imageFocusY,
      })}
      <input type="hidden" id="ce_avatar" value="${esc(item?.avatar || img || '')}">
      ${showSpirit ? ImageTools.blockHtml({
        prefix: 'ce_spirit',
        label: 'Spirit animal',
        currentUrl: pc.spiritAnimalImage || '',
        descValue: pc.spiritPrompt || '',
        descPlaceholder: 'Rose gold cybernetic fox, glowing pink eyes, neon tail…',
        hiddenId: 'ce_spirit_image',
      }) : ''}
    </div>`;
}

function wirePlayerCardEditor(opts = {}){
  const showSpirit = !opts.isPlace;

  document.getElementById('parseCardBtn')?.addEventListener('click', () => {
    const blob = document.getElementById('ce_card_blob')?.value || '';
    const parsed = parsePlayerCardText(blob);
    const el = document.getElementById('parseCardPreview');
    if(!parsed?.name){
      if(el) el.textContent = 'Could not parse — start with "Character Card: Name, Title"';
      return;
    }
    const pc = parsed.pokeCard;
    const abCount = (pc.abilities?.length || 0) + (pc.moves?.length || 0);
    if(el){
      el.textContent = `✓ ${parsed.name}${parsed.cardSubtitle ? ` · ${parsed.cardSubtitle}` : ''} · Lv ${pc.level} · ${pc.mbti || '—'} · ${abCount} abilities/moves`;
    }
    const desc = document.getElementById('ce_card_desc');
    if(desc && !desc.value.trim() && pc.vibe) desc.value = pc.vibe;
    if(showSpirit && pc.spiritPrompt){
      const sd = document.getElementById('ce_spirit_desc');
      if(sd && !sd.value.trim()) sd.value = pc.spiritPrompt;
    }
    if(showSpirit && pc.colorPalette){
      const color = paletteToAccent(pc.colorPalette);
      const colorInput = document.getElementById('ce_card_color');
      const colorPreview = document.getElementById('ce_card_color_preview');
      if(colorInput){
        colorInput.value = color;
        if(colorPreview) colorPreview.style.setProperty('--swatch', toNeonAccent(color) || color);
      }
    }
  });

  const colorInput = document.getElementById('ce_card_color');
  const colorPreview = document.getElementById('ce_card_color_preview');
  colorInput?.addEventListener('input', () => {
    if(colorPreview) colorPreview.style.setProperty('--swatch', toNeonAccent(colorInput.value) || colorInput.value);
  });

  ImageTools.wire({
    prefix: 'ce_portrait',
    kind: 'portrait',
    hiddenId: 'ce_image',
    mirrorIds: ['ce_avatar'],
    cropAspect: [3, 4],
    imageFocusX: document.getElementById('ce_portrait_focus_x')?.value || 50,
    imageFocusY: document.getElementById('ce_portrait_focus_y')?.value || 50,
    onChange: url => { pendingContentImage = url; },
  });

  if(showSpirit){
    ImageTools.wire({
      prefix: 'ce_spirit',
      kind: 'spirit',
      hiddenId: 'ce_spirit_image',
      cropAspect: [1, 1],
      onChange: url => { pendingSpiritImage = url; },
    });
  }
}

function readPlayerCardForm(opts = {}){
  const blob = document.getElementById('ce_card_blob')?.value || '';
  const parsed = parsePlayerCardText(blob);
  const pc = parsed?.pokeCard ? { ...parsed.pokeCard } : normalizePokeCard({});
  if(!opts.isPlace){
    const spiritDesc = document.getElementById('ce_spirit_desc')?.value?.trim();
    if(spiritDesc) pc.spiritPrompt = spiritDesc;
    pc.spiritAnimalImage = pendingSpiritImage !== null ? pendingSpiritImage : (document.getElementById('ce_spirit_image')?.value || pc.spiritAnimalImage || '');
    const cardColor = document.getElementById('ce_card_color')?.value?.trim();
    if(cardColor) pc.cardColor = cardColor;
  } else {
    pc.spiritAnimalImage = '';
    pc.spiritPrompt = '';
  }
  return { parsed, pokeCard: pc, cardBlob: blob };
}

function readLookPromptFromForm(){
  return document.getElementById('ce_portrait_desc')?.value?.trim() || '';
}
