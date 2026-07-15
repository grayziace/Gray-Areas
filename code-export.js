/* ===== Export browser edits → content.js + site-state.js ===== */

function downloadTextFile(filename, text){
  const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function jsLiteral(value, indent){
  const pad = '  '.repeat(indent);
  const padIn = '  '.repeat(indent + 1);
  if(value === null || value === undefined) return 'null';
  if(typeof value === 'string') return JSON.stringify(value);
  if(typeof value === 'number' || typeof value === 'boolean') return String(value);
  if(Array.isArray(value)){
    if(!value.length) return '[]';
    return `[\n${value.map(v => `${padIn}${jsLiteral(v, indent + 1)}`).join(',\n')}\n${pad}]`;
  }
  const keys = Object.keys(value).filter(k => value[k] !== undefined);
  if(!keys.length) return '{}';
  return `{\n${keys.map(k => `${padIn}${JSON.stringify(k)}: ${jsLiteral(value[k], indent + 1)}`).join(',\n')}\n${pad}}`;
}

function stripPokeCard(pc){
  if(!pc || typeof pc !== 'object') return pc;
  const out = JSON.parse(JSON.stringify(pc));
  delete out.subtitle;
  return out;
}

function exportPlayer(){
  const p = typeof getPlayer === 'function' ? getPlayer() : CONTENT.player;
  const player = JSON.parse(JSON.stringify(p));
  if(state.arrivalDate) player.arrivalDate = state.arrivalDate;
  if(player.pokeCard) player.pokeCard = stripPokeCard(player.pokeCard);
  return player;
}

function exportCharacters(){
  const chars = typeof getCharacters === 'function' ? getCharacters() : CONTENT.characters;
  return chars.map(c => {
    const copy = JSON.parse(JSON.stringify(c));
    if(copy.pokeCard) copy.pokeCard = stripPokeCard(copy.pokeCard);
    return copy;
  });
}

function exportPlaces(){
  return typeof getPlaces === 'function' ? JSON.parse(JSON.stringify(getPlaces())) : CONTENT.places;
}

function exportGallery(){
  return typeof getGallery === 'function' ? JSON.parse(JSON.stringify(getGallery())) : CONTENT.gallery;
}

function exportArticles(){
  return typeof getArticles === 'function' ? JSON.parse(JSON.stringify(getArticles())) : CONTENT.articles;
}

function exportSkills(){
  return typeof getSkills === 'function' ? JSON.parse(JSON.stringify(getSkills())) : CONTENT.skills;
}

function exportDramasForContent(){
  const dramas = typeof allDramas === 'function' ? allDramas() : CONTENT.dramas;
  return dramas.map(d => ({
    id: d.id,
    title: d.title,
    mediaType: d.mediaType || 'tv',
    genre: d.genre || '',
    totalEpisodes: d.totalEpisodes || 1,
    currentEpisode: d.currentEpisode || 0,
    status: d.status || 'watching',
    image: d.image || '',
  }));
}

function formatPokeCardBlock(pc, indent){
  const pad = '  '.repeat(indent);
  return `${pad}pokeCard: defaultPokeCard(${jsLiteral(stripPokeCard(pc), indent + 1)}),`;
}

function formatPlaceCardBlock(pc, indent){
  const pad = '  '.repeat(indent);
  return `${pad}placeCard: defaultPlaceCard(${jsLiteral(pc, indent + 1)}),`;
}

function formatContentItem(item, indent){
  const pad = '  '.repeat(indent);
  const padIn = '  '.repeat(indent + 1);
  const lines = [`${pad}{`];
  Object.keys(item).forEach(key => {
    if(key === 'pokeCard' && item.pokeCard){
      lines.push(formatPokeCardBlock(item.pokeCard, indent + 1));
      return;
    }
    if(key === 'placeCard' && item.placeCard){
      lines.push(formatPlaceCardBlock(item.placeCard, indent + 1));
      return;
    }
    lines.push(`${padIn}${JSON.stringify(key)}: ${jsLiteral(item[key], indent + 1)},`);
  });
  lines.push(`${pad}}`);
  return lines.join('\n');
}

function buildContentObjectSource(){
  if(typeof ensureContentState === 'function') ensureContentState();
  const player = exportPlayer();
  const lines = [
    '{',
    '  player: {',
    ...Object.keys(player).filter(k => k !== 'pokeCard').map(k =>
      `    ${JSON.stringify(k)}: ${jsLiteral(player[k], 2)},`),
    formatPokeCardBlock(player.pokeCard, 2),
    '  },',
    '',
    '  characters: [',
    exportCharacters().map(c => formatContentItem(c, 2)).join(',\n'),
    '  ],',
    '',
    '  places: [',
    exportPlaces().map(p => formatContentItem(p, 2)).join(',\n'),
    '  ],',
    '',
    `  skills: ${jsLiteral(exportSkills(), 1)},`,
    '',
    '  dramas: [',
    exportDramasForContent().map(d => formatContentItem(d, 2)).join(',\n'),
    '  ],',
    '',
    '  articles: [',
    exportArticles().map(a => formatContentItem(a, 2)).join(',\n'),
    '  ],',
    '',
    '  gallery: [',
    exportGallery().map(g => formatContentItem(g, 2)).join(',\n'),
    '  ],',
    '',
    `  zones: ${jsLiteral(CONTENT.zones, 1)},`,
    '',
    `  contact: ${jsLiteral(CONTENT.contact, 1)},`,
    '}',
  ];
  return lines.join('\n');
}

function buildSiteStateSource(){
  const payload = {
    entries: state.entries || {},
    skillHours: state.skillHours || {},
    pinboard: state.pinboard || [],
    arrivalDate: state.arrivalDate || '',
    unlockedZones: state.unlockedZones || [],
    dramaState: state.dramaState || {},
    hiddenDramas: state.hiddenDramas || [],
    overloadLogs: state.overloadLogs || [],
    currentMood: state.currentMood || '',
    moodCatalog: state.moodCatalog || [],
    viewerCharacters: state.viewerCharacters || [],
    quests: state.quests || [],
    videoDiary: state.videoDiary || [],
    liveTodos: state.liveTodos || [],
  };
  return `/* Exported from Gray Areas — commit this file and redeploy */\nconst SITE_STATE = ${jsLiteral(payload, 0)};\n`;
}

async function buildContentJsFile(){
  const res = await fetch('content.js', { cache: 'no-store' });
  if(!res.ok) throw new Error('Could not read content.js from this site.');
  const src = await res.text();
  const marker = 'const CONTENT = ';
  const idx = src.indexOf(marker);
  if(idx < 0) throw new Error('content.js format not recognized.');
  const header = src.slice(0, idx);
  return `${header}const CONTENT = ${buildContentObjectSource()};\n`;
}

async function exportEditsToCodeFiles(){
  if(typeof isAdmin === 'function' && !isAdmin()){
    alert('Unlock editing mode first.');
    return;
  }
  try{
    const contentJs = await buildContentJsFile();
    const siteStateJs = buildSiteStateSource();
    downloadTextFile('content.js', contentJs);
    setTimeout(() => downloadTextFile('site-state.js', siteStateJs), 400);
    alert(
      'Downloaded content.js and site-state.js.\n\n' +
      'On Cloudflare Pages, edits usually auto-sync to git — use this only as a fallback.\n\n' +
      '1. Replace both files in your Gray-Areas repo folder\n' +
      '2. Commit and push to GitHub'
    );
  }catch(err){
    console.error(err);
    alert('Export failed: ' + (err.message || err));
  }
}

document.getElementById('exportCodeBtn')?.addEventListener('click', exportEditsToCodeFiles);
