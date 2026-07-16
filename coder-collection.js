/* ===== Coder profile collection — editors, tab persistence, Gray recommendations ===== */

let pendingCoderPlaceImage = null;
let pendingCoderPhotoImage = null;

function getCoderProfileActiveTab(coderId){
  try{ return sessionStorage.getItem(`coderProfileTab:${coderId}`) || 'updates'; }catch(e){ return 'updates'; }
}

function setCoderProfileActiveTab(coderId, tab){
  try{ sessionStorage.setItem(`coderProfileTab:${coderId}`, tab || 'updates'); }catch(e){}
}

function restoreCoderProfileTab(coderId){
  const tab = getCoderProfileActiveTab(coderId);
  const site = document.querySelector(`.profile-site[data-profile-coder="${coderId}"]`);
  if(!site || tab === 'updates') return;
  site.querySelectorAll('.profile-rail-banner').forEach(b => {
    b.classList.toggle('is-active', b.dataset.psSection === tab);
  });
  site.querySelectorAll('.profile-site-panel').forEach(p => {
    p.classList.toggle('is-active', p.dataset.psPanel === tab);
  });
}

function findCoderProfileHost(coderId){
  return document.querySelector(`#coderBoardSpread .profile-site[data-profile-coder="${coderId}"]`)
    || document.querySelector(`#viewerCardSpread .profile-site[data-profile-coder="${coderId}"]`)
    || document.querySelector(`.profile-site[data-profile-coder="${coderId}"]`);
}

function refreshCoderProfileUI(coderId, opts = {}){
  if(opts.tab) setCoderProfileActiveTab(coderId, opts.tab);
  const host = findCoderProfileHost(coderId);
  if(host && typeof hydrateCoderProfileDecks === 'function'){
    hydrateCoderProfileDecks(coderId, host.closest('#coderBoardSpread, #viewerCardSpread') || host);
    if(typeof GameHub !== 'undefined') GameHub.bindProfileCollections(host, coderId);
    restoreCoderProfileTab(coderId);
    return;
  }
  const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
  if(mine?.id === coderId && typeof ViewerWorld !== 'undefined'){
    ViewerWorld.renderViewerCard();
    restoreCoderProfileTab(coderId);
    return;
  }
  if(typeof renderCoderBoardPage === 'function') renderCoderBoardPage(coderId);
  restoreCoderProfileTab(coderId);
}

function getCoderCollectionItem(coderId, type, id){
  const col = typeof getCoderCollection === 'function' ? getCoderCollection(coderId) : null;
  if(!col) return null;
  const list = col[type] || [];
  return list.find(x => x.id === id) || null;
}

function upsertCoderCollectionItem(coderId, type, item){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c || typeof ensurePlayerCollection !== 'function') return;
  const col = ensurePlayerCollection(c);
  const list = col[type];
  const i = list.findIndex(x => x.id === item.id);
  if(i >= 0) list[i] = { ...list[i], ...item };
  else list.unshift(item);
  if(typeof GameHub !== 'undefined') GameHub.savePlayerCollection(coderId);
}

function deleteCoderCollectionItem(coderId, type, id){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c || typeof ensurePlayerCollection !== 'function') return;
  const col = ensurePlayerCollection(c);
  col[type] = (col[type] || []).filter(x => x.id !== id);
  if(typeof GameHub !== 'undefined') GameHub.savePlayerCollection(coderId);
}

function canEditCoderCollection(coderId){
  const mine = typeof getMyCoderCard === 'function' ? getMyCoderCard() : null;
  return (mine?.id === coderId) || (typeof isAdmin === 'function' && isAdmin());
}

/* ---------- Recommend to Gray ---------- */
function ensureCoderRecommendations(){
  if(!state.coderRecommendations) state.coderRecommendations = [];
}

async function submitRecommendToGray(coderId, category, payload){
  const c = typeof getCoderByIdAny === 'function' ? getCoderByIdAny(coderId) : null;
  if(!c) return;
  ensureCoderRecommendations();
  const rec = {
    id: uid('crec'),
    fromId: coderId,
    fromName: c.name,
    category,
    payload,
    status: 'pending',
    at: new Date().toISOString(),
  };
  state.coderRecommendations.unshift(rec);
  saveState();
  if(typeof postVisitorData === 'function'){
    await postVisitorData('submitRecommendation', rec);
  }
  alert('Sent to me privately — thanks for the recommendation.');
}

/* ---------- Place editor ---------- */
function openCoderPlaceEditor(coderId, placeId){
  if(!canEditCoderCollection(coderId)) return;
  const p = placeId ? getCoderCollectionItem(coderId, 'places', placeId) : null;
  pendingCoderPlaceImage = null;
  document.getElementById('coderPlaceCoderId').value = coderId;
  document.getElementById('coderPlaceEditId').value = placeId || '';
  document.getElementById('coderPlaceModalTitle').textContent = p ? 'Edit place card' : 'Add place card';
  document.getElementById('coderPlaceName').value = p?.name || '';
  document.getElementById('coderPlaceVibe').value = p?.vibe || '';
  document.getElementById('coderPlaceVibeRank').value = p?.vibeRank || p?.placeCard?.vibeRank || 3;
  document.getElementById('coderPlaceExpRank').value = p?.experienceRank || p?.placeCard?.experienceRank || 3;
  document.getElementById('coderPlaceUtilRank').value = p?.utilityRank || p?.placeCard?.utilityRank || 3;
  document.getElementById('coderPlaceLevel').value = p?.level || p?.placeCard?.level || 1;
  document.getElementById('coderPlaceDesc').value = p?.description || p?.placeCard?.description || '';
  const imgHost = document.getElementById('coderPlaceImageBlock');
  if(imgHost && typeof ImageTools !== 'undefined'){
    imgHost.innerHTML = ImageTools.blockHtml({
      prefix: 'ce_cplace',
      label: 'Place photo',
      currentUrl: p?.image || '',
      descValue: p?.photoPrompt || p?.vibe || '',
      descPlaceholder: 'Neon alley, noodle shop, rain-slick pavement…',
      hiddenId: 'coderPlaceImage',
    });
    ImageTools.wire({
      prefix: 'ce_cplace',
      kind: 'place',
      hiddenId: 'coderPlaceImage',
      onChange: url => { pendingCoderPlaceImage = url; },
    });
  }
  document.getElementById('coderPlaceModalBack').classList.remove('hidden');
}

function saveCoderPlace(){
  const coderId = document.getElementById('coderPlaceCoderId').value;
  const editId = document.getElementById('coderPlaceEditId').value;
  const name = document.getElementById('coderPlaceName').value.trim();
  if(!name || !coderId) return;
  const item = {
    id: editId || uid('pplace'),
    name,
    vibe: document.getElementById('coderPlaceVibe').value.trim(),
    vibeRank: parseInt(document.getElementById('coderPlaceVibeRank').value, 10) || 3,
    experienceRank: parseInt(document.getElementById('coderPlaceExpRank').value, 10) || 3,
    utilityRank: parseInt(document.getElementById('coderPlaceUtilRank').value, 10) || 3,
    level: parseInt(document.getElementById('coderPlaceLevel').value, 10) || 1,
    description: document.getElementById('coderPlaceDesc').value.trim(),
    image: pendingCoderPlaceImage !== null ? pendingCoderPlaceImage : document.getElementById('coderPlaceImage')?.value?.trim() || '',
    placeCard: {
      level: parseInt(document.getElementById('coderPlaceLevel').value, 10) || 1,
      vibeRank: parseInt(document.getElementById('coderPlaceVibeRank').value, 10) || 3,
      experienceRank: parseInt(document.getElementById('coderPlaceExpRank').value, 10) || 3,
      utilityRank: parseInt(document.getElementById('coderPlaceUtilRank').value, 10) || 3,
      description: document.getElementById('coderPlaceDesc').value.trim(),
    },
    at: new Date().toISOString(),
  };
  upsertCoderCollectionItem(coderId, 'places', item);
  pendingCoderPlaceImage = null;
  document.getElementById('coderPlaceModalBack').classList.add('hidden');
  setCoderProfileActiveTab(coderId, 'places');
  refreshCoderProfileUI(coderId, { tab: 'places' });
  if(typeof awardCoderPoints === 'function' && !editId) awardCoderPoints(coderId, 5, 'collection_place');
}

/* ---------- Skill editor ---------- */
function openCoderSkillEditor(coderId, skillId){
  if(!canEditCoderCollection(coderId)) return;
  const s = skillId ? getCoderCollectionItem(coderId, 'skills', skillId) : null;
  document.getElementById('coderSkillCoderId').value = coderId;
  document.getElementById('coderSkillEditId').value = skillId || '';
  document.getElementById('coderSkillModalTitle').textContent = s ? 'Edit skill card' : 'Add skill card';
  document.getElementById('coderSkillName').value = s?.name || '';
  document.getElementById('coderSkillHours').value = s?.hours || 0;
  document.getElementById('coderSkillColor').value = s?.color || '#7c4dff';
  const journeyBtn = document.getElementById('coderSkillJourneyBtn');
  if(journeyBtn){
    journeyBtn.classList.toggle('hidden', !skillId);
    journeyBtn.dataset.coderId = coderId;
    journeyBtn.dataset.skillId = skillId || '';
  }
  document.getElementById('coderSkillModalBack').classList.remove('hidden');
}

function saveCoderSkill(){
  const coderId = document.getElementById('coderSkillCoderId').value;
  const editId = document.getElementById('coderSkillEditId').value;
  const name = document.getElementById('coderSkillName').value.trim();
  if(!name || !coderId) return;
  const existing = editId ? getCoderCollectionItem(coderId, 'skills', editId) : null;
  const item = {
    id: editId || uid('pskill'),
    name,
    hours: parseFloat(document.getElementById('coderSkillHours').value) || 0,
    color: document.getElementById('coderSkillColor').value || '#7c4dff',
    milestones: existing?.milestones || [],
    at: new Date().toISOString(),
  };
  upsertCoderCollectionItem(coderId, 'skills', item);
  document.getElementById('coderSkillModalBack').classList.add('hidden');
  setCoderProfileActiveTab(coderId, 'skills');
  refreshCoderProfileUI(coderId, { tab: 'skills' });
  if(typeof awardCoderPoints === 'function' && !editId) awardCoderPoints(coderId, 5, 'collection_skill');
}

function openCoderSkillJourneyEditor(coderId, skillId){
  const skill = getCoderCollectionItem(coderId, 'skills', skillId);
  if(!skill) return;
  const hrs = parseFloat(skill.hours) || 0;
  const tier = typeof getSkillTier === 'function' ? getSkillTier(hrs) : { level: 1, name: 'Initiate' };
  const milestones = (skill.milestones || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const maxFloor = Math.max(milestones.length, 1);
  const canEdit = canEditCoderCollection(coderId);
  let floorsHtml = milestones.map((ms, i) => {
    const floorH = 48 + (i / maxFloor) * 40;
    return `<button type="button" class="sjs-floor lit" data-ms-idx="${i}" style="--floor-h:${floorH}px;--delay:${i * 0.08}s">
      <div class="sjs-windows"></div>
      <div class="sjs-floor-meta">
        <span class="sjs-floor-date">${esc(ms.date || '')}</span>
        <span class="sjs-floor-title">${esc(ms.title || 'Milestone')}</span>
        <span class="sjs-floor-hrs">${ms.hours != null ? ms.hours + 'h' : ''}</span>
      </div>
    </button>`;
  }).join('');
  if(!milestones.length){
    floorsHtml = `<div class="sjs-empty-floor"><span>No milestones yet — add your first step below.</span></div>`;
  }
  document.getElementById('skillJourneyContent').innerHTML = `
    <h2 class="sjs-title">${esc(skill.name)} <span style="color:${skill.color}">· ${tier.name}</span></h2>
    <p class="sjs-sub">${Math.round(hrs)} hours · Level ${tier.level}${milestones.length ? ` · ${milestones.length} milestones` : ''}</p>
    ${canEdit ? `<div class="sjs-hours-row sketch-card">
      <label>Hours logged</label>
      <div class="skill-control-hours">
        <button type="button" class="btn" data-coder-skill-hrs="${esc(skillId)}" data-coder-id="${esc(coderId)}" data-delta="-1">−1h</button>
        <span class="sjs-hours-val">${Math.round(hrs * 10) / 10}h</span>
        <button type="button" class="btn primary" data-coder-skill-hrs="${esc(skillId)}" data-coder-id="${esc(coderId)}" data-delta="1">+1h</button>
        <button type="button" class="btn" data-coder-skill-edit="${esc(skillId)}" data-coder-id="${esc(coderId)}">Edit card</button>
      </div>
    </div>` : ''}
    <div class="skill-journey-layout">
      <div class="sjs-building" style="--skill-color:${skill.color}">
        <div class="sjs-antenna"></div>
        <div class="sjs-floors">${floorsHtml}</div>
        <div class="sjs-ground-line"></div>
      </div>
      <div class="sjs-detail" id="sjsDetail">
        <p class="sjs-detail-placeholder">${milestones.length ? 'Click a lit floor to read the story.' : 'Add milestones as you grow.'}</p>
      </div>
    </div>
    ${canEdit ? `<div class="sjs-admin sketch-card" data-coder-ms-form="${esc(coderId)}" data-coder-ms-skill="${esc(skillId)}">
      <h4>Add milestone</h4>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="coderMsDate" value="${new Date().toISOString().slice(0, 10)}"></div>
        <div class="field"><label>Hours at this point</label><input type="number" id="coderMsHours" min="0" value="${Math.round(hrs)}"></div>
      </div>
      <div class="field"><label>Title</label><input type="text" id="coderMsTitle" placeholder="What happened"></div>
      <div class="field"><label>Note</label><textarea id="coderMsNote" rows="3" placeholder="The story of this step…"></textarea></div>
      <button type="button" class="btn primary" id="coderAddMilestoneBtn">Add to journey</button>
      <button type="button" class="btn" id="coderRecommendSkillBtn">Send to me</button>
    </div>` : ''}`;
  document.getElementById('skillJourneyBack').classList.remove('hidden');
  const detailEl = document.getElementById('sjsDetail');
  document.querySelectorAll('#skillJourneyContent .sjs-floor').forEach(btn => {
    btn.addEventListener('click', () => {
      const ms = milestones[Number(btn.dataset.msIdx)];
      if(!ms) return;
      detailEl.innerHTML = `
        <div class="sjs-detail-card">
          <div class="sjs-detail-date">${esc(ms.date || '')}${ms.hours != null ? ` · ${ms.hours} hours` : ''}</div>
          <h3>${esc(ms.title || 'Milestone')}</h3>
          <p>${esc(ms.note || '')}</p>
        </div>`;
    });
  });
  document.getElementById('coderAddMilestoneBtn')?.addEventListener('click', () => {
    const title = document.getElementById('coderMsTitle').value.trim();
    if(!title) return;
    const next = [...milestones, {
      id: uid('cms'),
      date: document.getElementById('coderMsDate').value,
      hours: parseFloat(document.getElementById('coderMsHours').value) || hrs,
      title,
      note: document.getElementById('coderMsNote').value.trim(),
    }];
    upsertCoderCollectionItem(coderId, 'skills', { ...skill, milestones: next });
    openCoderSkillJourneyEditor(coderId, skillId);
    refreshCoderProfileUI(coderId, { tab: 'skills' });
  });
  document.querySelectorAll('[data-coder-skill-hrs]').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = Number(btn.dataset.delta) || 0;
      const s = getCoderCollectionItem(btn.dataset.coderId, 'skills', btn.dataset.coderSkillHrs);
      if(!s) return;
      upsertCoderCollectionItem(btn.dataset.coderId, 'skills', { ...s, hours: Math.max(0, (parseFloat(s.hours) || 0) + delta) });
      openCoderSkillJourneyEditor(btn.dataset.coderId, btn.dataset.coderSkillHrs);
      refreshCoderProfileUI(btn.dataset.coderId, { tab: 'skills' });
    });
  });
  document.querySelector('[data-coder-skill-edit]')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('skillJourneyBack').classList.add('hidden');
    openCoderSkillEditor(e.currentTarget.dataset.coderId, e.currentTarget.dataset.coderSkillEdit);
  });
  document.getElementById('coderRecommendSkillBtn')?.addEventListener('click', () => {
    submitRecommendToGray(coderId, 'skill', { ...skill, hours: hrs, milestones });
  });
}

/* ---------- Media (reuse drama modals) ---------- */
window.coderMediaCtx = null;
window.coderEpisodeCtx = null;

function getCoderMediaAsDrama(coderId, mediaId){
  const m = getCoderCollectionItem(coderId, 'media', mediaId);
  return m && typeof collectionMediaToDrama === 'function' ? collectionMediaToDrama(m) : null;
}

function openCoderMediaEditor(coderId, mediaId){
  if(!canEditCoderCollection(coderId)) return;
  const m = mediaId ? getCoderCollectionItem(coderId, 'media', mediaId) : null;
  const d = m ? collectionMediaToDrama(m) : null;
  window.coderMediaCtx = { coderId, mediaId: mediaId || null };
  pendingDramaImage = null;
  document.getElementById('dramaModalTitle').textContent = d ? 'Edit media' : 'Add media';
  document.getElementById('dramaEditId').value = mediaId || '';
  document.getElementById('dramaTitle').value = d?.title || '';
  document.getElementById('dramaMediaType').value = d?.mediaType || 'tv';
  document.getElementById('dramaGenre').value = d?.genre || '';
  document.getElementById('dramaCountry').value = d?.country || '';
  document.getElementById('dramaCountryField')?.classList.toggle('hidden', (d?.mediaType || 'tv') !== 'tv');
  document.getElementById('dramaTotal').value = d?.totalEpisodes || getMediaType(d?.mediaType || 'tv').defaultUnits;
  document.getElementById('dramaStatus').value = d?.status || 'watching';
  const posterHost = document.getElementById('dramaImageBlock');
  if(posterHost && typeof ImageTools !== 'undefined'){
    posterHost.innerHTML = ImageTools.blockHtml({
      prefix: 'ce_drama',
      label: 'Cover / poster',
      currentUrl: d?.image || '',
      descValue: d?.imagePrompt || d?.genre || '',
      descPlaceholder: 'Neon noir thriller poster, rain, city lights…',
      hiddenId: 'dramaImage',
    });
    ImageTools.wire({ prefix: 'ce_drama', kind: 'poster', hiddenId: 'dramaImage', onChange: url => { pendingDramaImage = url; } });
  }
  if(typeof updateMediaUnitsLabel === 'function') updateMediaUnitsLabel();
  document.getElementById('dramaModalBack').classList.remove('hidden');
}

function saveCoderMediaFromModal(){
  const ctx = window.coderMediaCtx;
  if(!ctx?.coderId) return false;
  const title = document.getElementById('dramaTitle').value.trim();
  if(!title){ alert('Add a title first.'); return true; }
  const editId = document.getElementById('dramaEditId').value;
  const existing = editId ? getCoderCollectionItem(ctx.coderId, 'media', editId) : null;
  const mediaType = document.getElementById('dramaMediaType').value || 'tv';
  const item = {
    id: editId || uid('pmedia'),
    title,
    medium: mediaType,
    mediaType,
    genre: document.getElementById('dramaGenre').value.trim(),
    country: document.getElementById('dramaCountry')?.value?.trim() || '',
    totalEpisodes: Number(document.getElementById('dramaTotal').value) || getMediaType(mediaType).defaultUnits,
    currentEpisode: existing?.currentEpisode || 0,
    status: document.getElementById('dramaStatus').value,
    image: pendingDramaImage !== null ? pendingDramaImage : document.getElementById('dramaImage')?.value?.trim() || '',
    imagePrompt: document.getElementById('ce_drama_desc')?.value?.trim() || '',
    episodes: existing?.episodes || {},
    finalReview: existing?.finalReview || existing?.review || '',
    review: existing?.review || '',
    at: new Date().toISOString(),
  };
  upsertCoderCollectionItem(ctx.coderId, 'media', item);
  pendingDramaImage = null;
  window.coderMediaCtx = null;
  document.getElementById('dramaModalBack').classList.add('hidden');
  setCoderProfileActiveTab(ctx.coderId, 'media');
  refreshCoderProfileUI(ctx.coderId, { tab: 'media' });
  if(typeof awardCoderPoints === 'function' && !editId) awardCoderPoints(ctx.coderId, 5, 'collection_media');
  return true;
}

function openCoderMediaDetailFull(coderId, mediaId){
  const m = getCoderCollectionItem(coderId, 'media', mediaId);
  if(!m) return;
  const d = collectionMediaToDrama(m);
  const mt = getMediaType(d.mediaType);
  const attrs = getMediaAttributes(d.mediaType);
  const ratingDots = typeof computeShowRatingDots === 'function' ? computeShowRatingDots(d, stableNeon(d.id, 1)) : '';
  const reviewedCount = Object.keys(d.episodes || {}).length;
  const unitLabel = mt.unit;
  const canEdit = canEditCoderCollection(coderId);
  let epGrid = '';
  for(let i = 1; i <= d.totalEpisodes; i++){
    const ep = d.episodes?.[String(i)] || d.episodes?.[i];
    const hasReview = ep && ep.ratings;
    let dots = '';
    if(hasReview){
      const vals = attrs.map(a => ep.ratings[a.id]).filter(Boolean);
      if(vals.length){
        const avg = vals.reduce((s, v) => s + Number(v), 0) / vals.length;
        dots = neonDots(avg, 5, stableNeon(mediaId, 2));
      }
    }
    epGrid += `<button class="ep-chip ${hasReview ? 'ep-reviewed' : ''} ${i <= d.currentEpisode ? 'ep-watched' : ''}" data-coder-ep="${i}" data-coder-media="${esc(mediaId)}" data-coder-id="${esc(coderId)}">
      ${i}${dots ? `<span class="ep-dots">${dots}</span>` : ''}</button>`;
  }
  document.getElementById('dramaDetailContent').innerHTML = `
    <h2 class="drama-detail-title">${esc(d.title)}</h2>
    <div class="drama-detail-meta">${esc(mt.label)} · ${esc(d.genre || '')}${d.mediaType === 'tv' && d.country ? ` · ${esc(d.country)}` : ''} · ${d.status} · ${unitLabel} ${d.currentEpisode}/${d.totalEpisodes}
      ${ratingDots ? ` · ${ratingDots} (${reviewedCount} rated)` : ''}</div>
    ${canEdit ? `<div class="drama-admin-row">
      <button class="btn" id="coderDramaEpDown">− progress</button>
      <button class="btn primary" id="coderDramaEpUp">+ progress</button>
      <button class="btn" id="coderDramaEditMeta">Edit</button>
      <button class="btn admin-delete" id="coderDramaDelete">Delete</button>
      <button class="btn" id="coderDramaRecommend">Send to me</button>
    </div>` : ''}
    <h4 class="ep-grid-label">${unitLabel}s — click to ${canEdit ? 'rate' : 'view'}</h4>
    <div class="ep-grid">${epGrid}</div>
    <div class="drama-final-review">
      <h4>Final review</h4>
      ${d.finalReview ? `<p>${esc(d.finalReview)}</p>` : '<p class="empty-hint">Not written yet.</p>'}
      ${canEdit ? `<textarea id="coderDramaFinalReview" rows="4" placeholder="Overall verdict once done…">${esc(d.finalReview || '')}</textarea>
        <button class="btn primary" id="coderSaveFinalReview" style="margin-top:8px">Save final review</button>` : ''}
    </div>`;
  document.getElementById('dramaDetailBack').classList.remove('hidden');
  window.coderDetailCtx = { coderId, mediaId };

  document.getElementById('dramaDetailContent').querySelectorAll('[data-coder-ep]').forEach(chip => {
    chip.addEventListener('click', () => openCoderEpisodeModal(chip.dataset.coderId, chip.dataset.coderMedia, Number(chip.dataset.coderEp)));
  });
  document.getElementById('coderDramaEpUp')?.addEventListener('click', () => {
    const cur = d.currentEpisode;
    upsertCoderCollectionItem(coderId, 'media', { ...m, currentEpisode: Math.min(d.totalEpisodes, cur + 1), status: cur + 1 >= d.totalEpisodes ? 'completed' : m.status });
    openCoderMediaDetailFull(coderId, mediaId);
    refreshCoderProfileUI(coderId, { tab: 'media' });
  });
  document.getElementById('coderDramaEpDown')?.addEventListener('click', () => {
    upsertCoderCollectionItem(coderId, 'media', { ...m, currentEpisode: Math.max(0, d.currentEpisode - 1) });
    openCoderMediaDetailFull(coderId, mediaId);
    refreshCoderProfileUI(coderId, { tab: 'media' });
  });
  document.getElementById('coderDramaEditMeta')?.addEventListener('click', () => {
    document.getElementById('dramaDetailBack').classList.add('hidden');
    openCoderMediaEditor(coderId, mediaId);
  });
  document.getElementById('coderDramaDelete')?.addEventListener('click', () => {
    if(!confirm('Delete this media entry?')) return;
    deleteCoderCollectionItem(coderId, 'media', mediaId);
    document.getElementById('dramaDetailBack').classList.add('hidden');
    refreshCoderProfileUI(coderId, { tab: 'media' });
  });
  document.getElementById('coderDramaRecommend')?.addEventListener('click', () => submitRecommendToGray(coderId, 'media', m));
  document.getElementById('coderSaveFinalReview')?.addEventListener('click', () => {
    upsertCoderCollectionItem(coderId, 'media', { ...m, finalReview: document.getElementById('coderDramaFinalReview').value, review: document.getElementById('coderDramaFinalReview').value });
    openCoderMediaDetailFull(coderId, mediaId);
    refreshCoderProfileUI(coderId, { tab: 'media' });
  });
}

function openCoderEpisodeModal(coderId, mediaId, epNum){
  const m = getCoderCollectionItem(coderId, 'media', mediaId);
  if(!m) return;
  const d = collectionMediaToDrama(m);
  const ep = d.episodes?.[String(epNum)] || d.episodes?.[epNum] || {};
  const mt = getMediaType(d.mediaType);
  const attrs = getMediaAttributes(d.mediaType);
  const canEdit = canEditCoderCollection(coderId);
  if(!canEdit && !ep.ratings) return;

  window.coderEpisodeCtx = { coderId, mediaId, epNum };

  if(!canEdit){
    if(typeof showEpisodeReadOnly === 'function') showEpisodeReadOnly(d, epNum, ep);
    return;
  }

  document.getElementById('episodeModalTitle').textContent = `${d.title} — ${mt.unit} ${epNum}`;
  document.getElementById('epDramaId').value = mediaId;
  document.getElementById('epNum').value = epNum;
  document.getElementById('epDate').value = ep.watchedDate || new Date().toISOString().slice(0, 10);
  document.getElementById('epReview').value = ep.review || '';
  const grid = document.getElementById('epAttrGrid');
  if(grid){
    grid.innerHTML = attrs.map(a => {
      const val = ep.ratings?.[a.id] || 3;
      return `<div class="ep-attr"><label>${esc(a.label)}</label>
        <input type="range" min="1" max="5" step="1" value="${val}" data-attr="${esc(a.id)}">
        <span class="ep-attr-val">${val}</span></div>`;
    }).join('');
    grid.querySelectorAll('input[data-attr]').forEach(sl => {
      sl.addEventListener('input', () => { sl.nextElementSibling.textContent = sl.value; });
    });
  }
  document.getElementById('episodeModalBack').classList.remove('hidden');
}

function saveCoderEpisodeFromModal(){
  const ctx = window.coderEpisodeCtx;
  if(!ctx) return false;
  const m = getCoderCollectionItem(ctx.coderId, 'media', ctx.mediaId);
  if(!m) return true;
  const ratings = {};
  document.getElementById('epAttrGrid')?.querySelectorAll('input[data-attr]').forEach(sl => {
    ratings[sl.dataset.attr] = Number(sl.value);
  });
  const episodes = { ...(m.episodes || {}) };
  episodes[String(ctx.epNum)] = {
    watchedDate: document.getElementById('epDate').value,
    ratings,
    review: document.getElementById('epReview').value,
  };
  const cur = m.currentEpisode || 0;
  const nextEp = Math.max(cur, Number(ctx.epNum));
  upsertCoderCollectionItem(ctx.coderId, 'media', { ...m, episodes, currentEpisode: nextEp });
  window.coderEpisodeCtx = null;
  if(typeof closeEpisodeModal === 'function') closeEpisodeModal();
  if(!document.getElementById('dramaDetailBack').classList.contains('hidden')){
    openCoderMediaDetailFull(ctx.coderId, ctx.mediaId);
  }
  refreshCoderProfileUI(ctx.coderId, { tab: 'media' });
  return true;
}

/* ---------- Photo editor ---------- */
function openCoderPhotoEditor(coderId, photoId){
  if(!canEditCoderCollection(coderId)) return;
  const p = photoId ? getCoderCollectionItem(coderId, 'photos', photoId) : null;
  pendingCoderPhotoImage = null;
  document.getElementById('coderPhotoCoderId').value = coderId;
  document.getElementById('coderPhotoEditId').value = photoId || '';
  document.getElementById('coderPhotoCaption').value = p?.caption || '';
  document.getElementById('coderPhotoStory').value = p?.story || '';
  const imgHost = document.getElementById('coderPhotoImageBlock');
  if(imgHost && typeof ImageTools !== 'undefined'){
    imgHost.innerHTML = ImageTools.blockHtml({
      prefix: 'ce_cphoto',
      label: 'Photo',
      currentUrl: p?.src || '',
      descValue: p?.caption || '',
      hiddenId: 'coderPhotoSrc',
    });
    ImageTools.wire({ prefix: 'ce_cphoto', kind: 'gallery', hiddenId: 'coderPhotoSrc', onChange: url => { pendingCoderPhotoImage = url; } });
  }
  document.getElementById('coderPhotoModalBack').classList.remove('hidden');
}

function saveCoderPhoto(){
  const coderId = document.getElementById('coderPhotoCoderId').value;
  const editId = document.getElementById('coderPhotoEditId').value;
  const src = pendingCoderPhotoImage !== null ? pendingCoderPhotoImage : document.getElementById('coderPhotoSrc')?.value?.trim() || '';
  if(!src || !coderId) return;
  const item = {
    id: editId || uid('cphoto'),
    src,
    caption: document.getElementById('coderPhotoCaption').value.trim(),
    story: document.getElementById('coderPhotoStory').value.trim(),
    at: new Date().toISOString(),
  };
  upsertCoderCollectionItem(coderId, 'photos', item);
  pendingCoderPhotoImage = null;
  document.getElementById('coderPhotoModalBack').classList.add('hidden');
  setCoderProfileActiveTab(coderId, 'photos');
  refreshCoderProfileUI(coderId, { tab: 'photos' });
}

function formatRecommendationPayload(category, payload){
  if(!payload || typeof payload !== 'object') return '';
  if(category === 'place'){
    return [payload.name, payload.vibe, payload.description].filter(Boolean).join(' · ');
  }
  if(category === 'skill'){
    const ms = (payload.milestones || []).length;
    return `${payload.name || 'Skill'} · ${payload.hours || 0}h${ms ? ` · ${ms} milestones` : ''}`;
  }
  if(category === 'media'){
    return `${payload.title || 'Media'} · ${payload.genre || payload.medium || ''}${payload.review || payload.finalReview ? ` — ${(payload.review || payload.finalReview).slice(0, 120)}` : ''}`;
  }
  return JSON.stringify(payload).slice(0, 200);
}

function bindCoderSkillCards(container, coderId){
  if(!container) return;
  if(typeof bindFlipPlayerCards === 'function') bindFlipPlayerCards(container);
  container.querySelectorAll('.skill-open-journey').forEach(btn => {
    if(btn.dataset.coderSkillBound) return;
    btn.dataset.coderSkillBound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openCoderSkillJourneyEditor(coderId, btn.dataset.skillId);
    });
  });
  container.querySelectorAll('[data-skill-edit]').forEach(btn => {
    if(btn.dataset.coderSkillBound) return;
    btn.dataset.coderSkillBound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openCoderSkillJourneyEditor(coderId, btn.dataset.skillEdit);
    });
  });
}

/* ---------- Gray recommendations queue ---------- */
function renderGrayRecommendationsQueue(){
  if(typeof isAdmin === 'function' && !isAdmin()) return '';
  ensureCoderRecommendations();
  const pending = (state.coderRecommendations || []).filter(r => r.status === 'pending');
  const items = pending.map(r => `<li class="gray-rec-item" data-gray-rec="${esc(r.id)}">
      <header><strong>${esc(r.fromName)}</strong> · <span class="gray-rec-cat">${esc(r.category)}</span> · <time>${esc(new Date(r.at).toLocaleDateString())}</time></header>
      <p class="gray-rec-body">${esc(formatRecommendationPayload(r.category, r.payload))}</p>
      <div class="gray-rec-actions">
        <button type="button" class="btn primary" data-gray-rec-done="${esc(r.id)}">Mark read</button>
      </div>
    </li>`).join('');
  return `<section class="gray-rec-queue sketch-card">
    <h3 class="viewer-wizard-title">Coder recommendations (${pending.length})</h3>
    <p class="field-hint">Private picks from coders — places, skills, media.</p>
    ${pending.length ? `<ul class="gray-rec-list">${items}</ul>` : '<p class="empty-hint">No private recommendations yet.</p>'}
  </section>`;
}

function bindGrayRecommendations(root){
  (root || document).querySelectorAll('[data-gray-rec-done]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = (state.coderRecommendations || []).find(r => r.id === btn.dataset.grayRecDone);
      if(rec) rec.status = 'read';
      saveState();
      if(typeof ViewerWorld !== 'undefined') ViewerWorld.renderInbox?.();
    });
  });
}

/* ---------- Bind profile collection UI ---------- */
function bindCoderCollectionUI(host, coderId){
  if(!host) return;

  host.querySelectorAll('[data-coder-add-place]').forEach(btn => {
    if(btn.dataset.coderUiBound) return;
    btn.dataset.coderUiBound = '1';
    btn.addEventListener('click', () => openCoderPlaceEditor(coderId, null));
  });
  host.querySelectorAll('[data-coder-add-skill]').forEach(btn => {
    if(btn.dataset.coderUiBound) return;
    btn.dataset.coderUiBound = '1';
    btn.addEventListener('click', () => openCoderSkillEditor(coderId, null));
  });
  host.querySelectorAll('[data-coder-add-media]').forEach(btn => {
    if(btn.dataset.coderUiBound) return;
    btn.dataset.coderUiBound = '1';
    btn.addEventListener('click', () => openCoderMediaEditor(coderId, null));
  });
  host.querySelectorAll('[data-coder-add-photo]').forEach(btn => {
    if(btn.dataset.coderUiBound) return;
    btn.dataset.coderUiBound = '1';
    btn.addEventListener('click', () => openCoderPhotoEditor(coderId, null));
  });
}

function wireCoderCollectionModals(){
  document.getElementById('saveCoderPlace')?.addEventListener('click', saveCoderPlace);
  document.getElementById('cancelCoderPlace')?.addEventListener('click', () => document.getElementById('coderPlaceModalBack').classList.add('hidden'));
  document.getElementById('coderRecommendPlace')?.addEventListener('click', () => {
    const coderId = document.getElementById('coderPlaceCoderId').value;
    submitRecommendToGray(coderId, 'place', {
      name: document.getElementById('coderPlaceName').value,
      description: document.getElementById('coderPlaceDesc').value,
    });
  });

  document.getElementById('saveCoderSkill')?.addEventListener('click', saveCoderSkill);
  document.getElementById('cancelCoderSkill')?.addEventListener('click', () => document.getElementById('coderSkillModalBack').classList.add('hidden'));
  document.getElementById('coderSkillJourneyBtn')?.addEventListener('click', e => {
    const btn = e.currentTarget;
    if(!btn.dataset.skillId) return;
    document.getElementById('coderSkillModalBack').classList.add('hidden');
    openCoderSkillJourneyEditor(btn.dataset.coderId, btn.dataset.skillId);
  });
  document.getElementById('coderRecommendSkillCardBtn')?.addEventListener('click', () => {
    const coderId = document.getElementById('coderSkillCoderId').value;
    const editId = document.getElementById('coderSkillEditId').value;
    const skill = editId ? getCoderCollectionItem(coderId, 'skills', editId) : null;
    submitRecommendToGray(coderId, 'skill', skill || {
      name: document.getElementById('coderSkillName').value,
      hours: document.getElementById('coderSkillHours').value,
    });
  });

  document.getElementById('saveCoderPhoto')?.addEventListener('click', saveCoderPhoto);
  document.getElementById('cancelCoderPhoto')?.addEventListener('click', () => document.getElementById('coderPhotoModalBack').classList.add('hidden'));
}

if(typeof document !== 'undefined'){
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireCoderCollectionModals);
  } else {
    wireCoderCollectionModals();
  }
}
