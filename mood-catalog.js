/* ===== Mood catalog — current mood + editable emotions ===== */

const DEFAULT_MOOD_CATALOG = [
  { id: 'calm', label: 'Calm', icon: '◇', neon: '#6ee7a0', group: 'baseline' },
  { id: 'content', label: 'Content', icon: '◈', neon: '#4ade80', group: 'baseline' },
  { id: 'neutral', label: 'Neutral', icon: '○', neon: '#94a3b8', group: 'baseline' },
  { id: 'tired', label: 'Tired', icon: '◌', neon: '#64748b', group: 'baseline' },
  { id: 'wired', label: 'Wired', icon: '⚡', neon: '#fbbf24', group: 'baseline' },
  { id: 'focused', label: 'Focused', icon: '◎', neon: '#38bdf8', group: 'baseline' },
  { id: 'happy', label: 'Happy', icon: '★', neon: '#facc15', group: 'positive' },
  { id: 'excited', label: 'Excited', icon: '✦', neon: '#fb923c', group: 'positive' },
  { id: 'grateful', label: 'Grateful', icon: '♥', neon: '#f9a8d4', group: 'positive' },
  { id: 'hopeful', label: 'Hopeful', icon: '↑', neon: '#86efac', group: 'positive' },
  { id: 'proud', label: 'Proud', icon: '▲', neon: '#a78bfa', group: 'positive' },
  { id: 'peaceful', label: 'Peaceful', icon: '☼', neon: '#7dd3fc', group: 'positive' },
  { id: 'loved', label: 'Loved', icon: '❖', neon: '#f472b6', group: 'positive' },
  { id: 'energised', label: 'Energised', icon: '⟡', neon: '#fcd34d', group: 'positive' },
  { id: 'anxious', label: 'Anxious', icon: '⎋', neon: '#fb923c', group: 'stress' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '▤', neon: '#f43f8e', group: 'stress' },
  { id: 'stressed', label: 'Stressed', icon: '⌁', neon: '#ef4444', group: 'stress' },
  { id: 'frustrated', label: 'Frustrated', icon: '⊘', neon: '#e8c547', group: 'stress' },
  { id: 'angry', label: 'Angry', icon: '⊗', neon: '#dc2626', group: 'stress' },
  { id: 'irritated', label: 'Irritated', icon: '⨯', neon: '#f87171', group: 'stress' },
  { id: 'panicked', label: 'Panicked', icon: '!!', neon: '#ff0040', group: 'stress' },
  { id: 'restless', label: 'Restless', icon: '≈', neon: '#f97316', group: 'stress' },
  { id: 'sad', label: 'Sad', icon: '▼', neon: '#4fa3ff', group: 'low' },
  { id: 'lonely', label: 'Lonely', icon: '◌', neon: '#818cf8', group: 'low' },
  { id: 'empty', label: 'Empty', icon: '□', neon: '#71717a', group: 'low' },
  { id: 'numb', label: 'Numb', icon: '░', neon: '#a1a1aa', group: 'low' },
  { id: 'hopeless', label: 'Hopeless', icon: '▽', neon: '#6366f1', group: 'low' },
  { id: 'grieving', label: 'Grieving', icon: '⌓', neon: '#7c3aed', group: 'low' },
  { id: 'disappointed', label: 'Disappointed', icon: '⊖', neon: '#64748b', group: 'low' },
  { id: 'guilty', label: 'Guilty', icon: '⌗', neon: '#78716c', group: 'low' },
  { id: 'ashamed', label: 'Ashamed', icon: '⊠', neon: '#57534e', group: 'low' },
  { id: 'jealous', label: 'Jealous', icon: '◆', neon: '#84cc16', group: 'low' },
  { id: 'envious', label: 'Envious', icon: '◇', neon: '#65a30d', group: 'low' },
  { id: 'sick', label: 'Sick', icon: '⊕', neon: '#94a3b8', group: 'body' },
  { id: 'unwell', label: 'Unwell', icon: '✚', neon: '#22d3ee', group: 'body' },
  { id: 'in_pain', label: 'In pain', icon: '⚠', neon: '#f43f8e', group: 'body' },
  { id: 'exhausted', label: 'Exhausted', icon: '⊡', neon: '#52525b', group: 'body' },
  { id: 'burnt_out', label: 'Burnt out', icon: '▧', neon: '#3f3f46', group: 'body' },
  { id: 'hungover', label: 'Hungover', icon: '◎', neon: '#a8a29e', group: 'body' },
  { id: 'stagnant', label: 'Stagnant', icon: '▮', neon: '#6b7280', group: 'stuck' },
  { id: 'bored', label: 'Bored', icon: '…', neon: '#9ca3af', group: 'stuck' },
  { id: 'stuck', label: 'Stuck', icon: '⊞', neon: '#78716c', group: 'stuck' },
  { id: 'confused', label: 'Confused', icon: '?', neon: '#c084fc', group: 'stuck' },
  { id: 'uncertain', label: 'Uncertain', icon: '⁇', neon: '#a78bfa', group: 'stuck' },
  { id: 'indecisive', label: 'Indecisive', icon: '⇄', neon: '#8b5cf6', group: 'stuck' },
  { id: 'curious', label: 'Curious', icon: '◎', neon: '#2dd4bf', group: 'active' },
  { id: 'creative', label: 'Creative', icon: '✧', neon: '#e879f9', group: 'active' },
  { id: 'motivated', label: 'Motivated', icon: '→', neon: '#34d399', group: 'active' },
  { id: 'determined', label: 'Determined', icon: '»', neon: '#10b981', group: 'active' },
  { id: 'nostalgic', label: 'Nostalgic', icon: '⌛', neon: '#fda4af', group: 'reflective' },
  { id: 'reflective', label: 'Reflective', icon: '◐', neon: '#93c5fd', group: 'reflective' },
  { id: 'melancholy', label: 'Melancholy', icon: '☾', neon: '#818cf8', group: 'reflective' },
  { id: 'bittersweet', label: 'Bittersweet', icon: '◑', neon: '#f0abfc', group: 'reflective' },
  { id: 'vulnerable', label: 'Vulnerable', icon: '◇', neon: '#fbcfe8', group: 'reflective' },
  { id: 'sensitive', label: 'Sensitive', icon: '◎', neon: '#fda4af', group: 'reflective' },
];

function getMoodCatalog(){
  const custom = Array.isArray(state?.moodCatalog) ? state.moodCatalog : [];
  const seen = new Set();
  const out = [];
  [...DEFAULT_MOOD_CATALOG, ...custom].forEach(m => {
    if(!m?.id || seen.has(m.id)) return;
    seen.add(m.id);
    out.push(m);
  });
  return out;
}

function getMoodById(id){
  if(!id) return null;
  return getMoodCatalog().find(m => m.id === id) || null;
}

function moodLabel(id){
  return getMoodById(id)?.label || (id ? String(id).replace(/_/g, ' ') : '—');
}

function moodIcon(id){
  return getMoodById(id)?.icon || '○';
}

function moodNeon(id){
  return getMoodById(id)?.neon || '#9b5cff';
}

function renderMoodPickerHTML(name, selectedId, opts = {}){
  const catalog = getMoodCatalog();
  const groups = [...new Set(catalog.map(m => m.group || 'other'))];
  const inputName = name || 'currentMood';
  let html = `<div class="mood-picker ${opts.compact ? 'mood-picker-compact' : ''}" data-mood-picker="${inputName}">`;
  groups.forEach(group => {
    const items = catalog.filter(m => (m.group || 'other') === group);
    if(!items.length) return;
    html += `<div class="mood-picker-group"><span class="mood-picker-group-label">${esc(group.replace(/_/g, ' '))}</span><div class="mood-picker-grid">`;
    items.forEach(m => {
      const active = m.id === selectedId ? ' active' : '';
      html += `<label class="mood-pick${active}" style="--mp-neon:${m.neon}" title="${esc(m.label)}">
        <input type="radio" name="${inputName}" value="${esc(m.id)}"${m.id === selectedId ? ' checked' : ''}>
        <span class="mood-pick-icon">${m.icon}</span>
        <span class="mood-pick-label">${esc(m.label)}</span>
      </label>`;
    });
    html += `</div></div>`;
  });
  if(opts.editable && typeof isAdmin === 'function' && isAdmin()){
    html += `<div class="mood-picker-admin">
      <input type="text" class="mood-custom-label" placeholder="Custom mood label" data-mood-custom-label>
      <button type="button" class="btn" data-mood-add-custom>+ Add mood</button>
    </div>`;
  }
  html += `</div>`;
  return html;
}

function readMoodPickerValue(root, name){
  return root?.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function bindMoodPicker(root, opts = {}){
  if(!root) return;
  const name = opts.name || 'currentMood';
  const picker = root.querySelector('[data-mood-picker]') || root;
  picker.querySelectorAll('.mood-pick input').forEach(input => {
    input.addEventListener('change', () => {
      picker.querySelectorAll('.mood-pick').forEach(l => l.classList.remove('active'));
      input.closest('.mood-pick')?.classList.add('active');
      opts.onChange?.(input.value);
    });
  });
  picker.querySelector('[data-mood-add-custom]')?.addEventListener('click', () => {
    const label = picker.querySelector('[data-mood-custom-label]')?.value?.trim();
    if(!label) return;
    const id = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Date.now().toString(36).slice(2, 5);
    if(!Array.isArray(state.moodCatalog)) state.moodCatalog = [];
    state.moodCatalog.push({ id, label, icon: '◈', neon: '#e879f9', group: 'custom' });
    saveState();
    const host = root.parentElement;
    const fieldLabel = host?.querySelector(':scope > label');
    if(host){
      host.innerHTML = (fieldLabel ? fieldLabel.outerHTML : '') + renderMoodPickerHTML(name, id, { editable: opts.editable, compact: opts.compact });
      bindMoodPicker(host, { ...opts, name });
    }
    opts.onChange?.(id);
  });
}

function setCurrentMood(id){
  state.currentMood = id || '';
  saveState();
  if(id && typeof LiveSync !== 'undefined') LiveSync.moodChanged(moodLabel(id));
}

function getCurrentMood(){
  return state.currentMood || '';
}

function legacyMoodDisplay(val){
  const n = Number(val);
  if(!val || Number.isNaN(n)) return moodLabel(val);
  if(n >= 9) return 'On fire';
  if(n >= 7) return 'Solid';
  if(n >= 5) return 'Fine';
  if(n >= 3) return 'Meh';
  return 'Rough';
}

function resolveEntryMood(entry){
  if(!entry) return '';
  if(entry.currentMood) return entry.currentMood;
  if(entry.mood && getMoodById(entry.mood)) return entry.mood;
  return entry.mood || '';
}
