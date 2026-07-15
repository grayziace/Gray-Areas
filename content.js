/* ===== GRAY AREAS — content ===== */

const ADMIN_KEY = 'gray-shenzhen-2026';

const SKILL_TIERS = [
  { level: 1,  name: 'Novice',      hours: 1 },
  { level: 2,  name: 'Apprentice',  hours: 10 },
  { level: 3,  name: 'Competent',   hours: 50 },
  { level: 4,  name: 'Adept',       hours: 100 },
  { level: 5,  name: 'Specialist',  hours: 250 },
  { level: 6,  name: 'Expert',      hours: 500 },
  { level: 7,  name: 'Artisan',     hours: 1000 },
  { level: 8,  name: 'Elite',       hours: 2500 },
  { level: 9,  name: 'Paragon',     hours: 5000 },
  { level: 10, name: 'Grandmaster', hours: 10000 },
];

const THEME_NEONS = ['#ff4fd8','#3ad6e0','#9b5cff','#4fa3ff','#e94ff5','#38bdf8','#f472b6','#7c4dff','#f43f8e','#a78bfa'];

function stableNeon(seed, offset = 0){
  let h = 0;
  const s = String(seed ?? '');
  for(let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return THEME_NEONS[(Math.abs(h) + offset) % THEME_NEONS.length];
}

function parseRank(v){
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 0;
}

function neonDots(score, max = 5, color = 'var(--neon-cyan)'){
  const n = Math.max(0, Math.min(max, Math.round(Number(score) || 0)));
  let html = `<span class="neon-dots" style="--dot-neon:${color}">`;
  for(let i = 1; i <= max; i++) html += `<span class="neon-dot${i <= n ? ' lit' : ''}"></span>`;
  return html + '</span>';
}

const EPISODE_ATTRIBUTES = [
  { id: 'engagement', label: 'Screen Lock', short: 'Phone checks vs glued' },
  { id: 'pace',       label: 'Pace',        short: 'Crawled vs flew by' },
  { id: 'likeability',label: 'Characters',  short: 'Annoying vs adored' },
  { id: 'twists',     label: 'Jaw-Drop',    short: 'Flat vs gasp' },
  { id: 'satisfaction',label: 'Payoff',     short: 'Waste vs perfection' },
];

const MEDIA_TYPES = {
  tv:    { label: 'TV Series', unit: 'Episode',  unitsLabel: 'Total episodes', defaultUnits: 24 },
  film:  { label: 'Film',      unit: 'Viewing',  unitsLabel: 'Times watched',  defaultUnits: 1 },
  book:  { label: 'Book',      unit: 'Chapter',  unitsLabel: 'Total chapters', defaultUnits: 20 },
  album: { label: 'Album',     unit: 'Track',    unitsLabel: 'Total tracks',   defaultUnits: 12 },
  song:  { label: 'Song',      unit: 'Listen',   unitsLabel: 'Total listens',  defaultUnits: 1 },
};

const MEDIA_ATTRIBUTES = {
  tv: EPISODE_ATTRIBUTES,
  film: [
    { id: 'engagement', label: 'Engagement', short: 'Checked out vs locked in' },
    { id: 'pace', label: 'Pace', short: 'Dragged vs breathless' },
    { id: 'visuals', label: 'Visuals', short: 'Flat vs stunning' },
    { id: 'story', label: 'Story', short: 'Weak vs unforgettable' },
    { id: 'payoff', label: 'Payoff', short: 'Hollow vs perfect landing' },
  ],
  book: [
    { id: 'writing', label: 'Writing', short: 'Clunky vs luminous' },
    { id: 'characters', label: 'Characters', short: 'Flat vs alive' },
    { id: 'pace', label: 'Pace', short: 'Slog vs page-turner' },
    { id: 'world', label: 'World', short: 'Thin vs immersive' },
    { id: 'ending', label: 'Ending', short: 'Rushed vs satisfying' },
  ],
  album: [
    { id: 'production', label: 'Production', short: 'Rough vs polished' },
    { id: 'flow', label: 'Flow', short: 'Scattered vs seamless' },
    { id: 'replay', label: 'Replay', short: 'Once vs on repeat' },
    { id: 'standout', label: 'Standouts', short: 'Filler vs bangers' },
    { id: 'mood', label: 'Mood', short: 'Flat vs transportive' },
  ],
  song: [
    { id: 'hook', label: 'Hook', short: 'Forgettable vs earworm' },
    { id: 'production', label: 'Production', short: 'Thin vs rich' },
    { id: 'replay', label: 'Replay', short: 'Skip vs loop' },
    { id: 'lyrics', label: 'Lyrics', short: 'Empty vs piercing' },
    { id: 'vibe', label: 'Vibe', short: 'Off vs perfect mood' },
  ],
};

function getMediaAttributes(type){ return MEDIA_ATTRIBUTES[type] || EPISODE_ATTRIBUTES; }
function getMediaType(type){ return MEDIA_TYPES[type] || MEDIA_TYPES.tv; }

function defaultPlaceCard(overrides = {}){
  return { level: 1, vibeRank: 0, experienceRank: 0, utilityRank: 0, description: '', ...overrides };
}

function defaultPokeCard(overrides = {}){
  return {
    level: 1,
    mbti: '',
    spiritAnimalImage: '',
    spiritPrompt: '',
    cardColor: '',
    colorPalette: 'Pink & Cyan',
    vibe: '',
    abilities: [
      { name: '', effect: '' },
      { name: '', effect: '' },
    ],
    moves: [
      { name: '', effect: '' },
      { name: '', effect: '' },
    ],
    weakness: { name: '', effect: '' },
    resistance: { name: '', effect: '' },
    retreatCost: '1',
    quote: '',
    ...overrides,
  };
}

function adminCardEditBtn(){
  return `<button type="button" class="card-edit-front flip-edit-btn edit-when-editing" aria-label="Edit card">Edit</button>`;
}

const CONTENT = {
  player: {
    name: 'Gray',
    bio: 'UK → Shenzhen. Architect energy. Two steps ahead, refuses to fold under pressure. Learning Mandarin badly, running when the air allows it, writing when something sticks.',
    avatar: '',
    lookPrompt: 'young person, rose gold hair, sharp gray eyes, black cyberpunk jacket with pink neon trim, confident expression, rain',
    from: 'United Kingdom',
    since: '2026',
    arrivalDate: '2026-01-05',
    pokeCard: defaultPokeCard({
      level: 22,
      cardColor: '#ff4fd8',
      mbti: 'INTJ',
      spiritPrompt: 'rose gold cybernetic fox, glowing pink eyes, neon tail, fierce loyal companion',
      subtitle: 'The Rose Gold Commander',
      colorPalette: 'Pink & Rose Gold',
      vibe: 'The Architect / Unyielding Leader',
      abilities: [
        { name: 'Total Perception', effect: 'You are always two steps ahead. Your opponent must play with their hand revealed. Immune to being Confused.' },
        { name: 'Resilience of the Fox', effect: 'Once per turn, if your Active Pokémon would be Knocked Out, discard one energy card instead — left with 10 HP. You refuse to fold under pressure.' },
      ],
      moves: [
        { name: 'Decisive Strike', effect: 'Singular determination. 100 damage. If the target survives, they become Paralyzed by relentless pressure.' },
        { name: 'Sever Ties', effect: 'Detach emotionally to optimize strategy. Discard all support cards attached to opponent\'s Pokémon.' },
      ],
      weakness: { name: 'The Void of Boredom & Harshness', effect: 'If forced to skip a turn, lose 50 HP from internal frustration. Healing from teammates/items reduced by half.' },
      resistance: { name: 'Validation Immunity', effect: 'Immune to opponent Support/Buff manipulation. Cannot be Charmed, Confused, or Attracted.' },
      retreatCost: '2',
      quote: 'The world is wide and life is short.',
    }),
  },

  characters: [
    {
      id: 'example-person',
      name: 'Yuèlíng',
      type: 'Person',
      subtype: 'Fellow Teacher',
      image: '',
      lookPrompt: 'woman, long cyan hair in pigtails, golden eyes, white jacket blue trim, cybernetic cheek lines, rain',
      quote: '"The city never sleeps, but we do — eventually."',
      personality: 'Warm, sharp-witted, always carrying too many books.',
      distinction: 'Showed her where the real dumplings are.',
      met: '2026-01-12',
      pokeCard: defaultPokeCard({
        level: 18,
        mbti: 'ENFP',
        spiritPrompt: 'small neon owl with cyan glowing wings',
        colorPalette: 'Cyan & Gold',
        vibe: 'The Lantern / Quiet Brilliance',
        quote: '"The city never sleeps, but we do — eventually."',
      }),
    },
    {
      id: 'example-cat',
      name: 'Lobby Cat',
      type: 'Creature',
      subtype: 'Stray',
      image: '',
      lookPrompt: 'regal black cat, one cybernetic golden eye, neon collar, apartment lobby at night',
      quote: '*judges you silently*',
      personality: 'Regal. Unbothered.',
      distinction: 'Apartment lobby royalty.',
      met: '2026-01-08',
      pokeCard: defaultPokeCard({
        level: 7,
        mbti: 'INTP',
        spiritPrompt: 'shadow cat silhouette made of neon purple smoke',
        colorPalette: 'Purple & Gold',
        vibe: 'The Sovereign / Silent Judge',
        quote: '*judges you silently*',
      }),
    },
  ],

  places: [
    {
      id: 'oct-loft',
      name: 'OCT Loft',
      type: 'District',
      image: '',
      unlocked: true,
      placeCard: defaultPlaceCard({
        level: 12,
        vibeRank: 5,
        experienceRank: 4,
        utilityRank: 4,
        description: 'Art warehouses, coffee, rain on corrugated roofs. First solo wander — lost twice, found a sketch shop. Creative decay with good wifi.',
      }),
    },
    {
      id: 'lianhuashan',
      name: 'Lianhuashan Park',
      type: 'Park',
      image: '',
      unlocked: false,
      placeCard: defaultPlaceCard({
        level: 3,
        vibeRank: 5,
        experienceRank: 5,
        utilityRank: 3,
        description: 'Green lungs. Kites. City spread out below. Sunset run — legs on fire, worth it.',
      }),
    },
  ],

  skills: [
    { id: 'mandarin', name: 'Mandarin', hours: 0, color: '#ff4fd8', milestones: [
      { id: 'ms-m1', date: '2026-01-05', title: 'First lesson', note: 'Could only say nǐ hǎo. Badly.', hours: 1 },
      { id: 'ms-m2', date: '2026-01-22', title: 'Ordered lunch alone', note: 'Pointed at menu. Small win.', hours: 14 },
    ]},
    { id: 'skateboarding', name: 'Skateboarding', hours: 0, color: '#9b5cff', milestones: [] },
    { id: 'writing', name: 'Writing', hours: 0, color: '#4fa3ff', milestones: [] },
    { id: 'creatives', name: 'Creatives', hours: 0, color: '#3ad6e0', milestones: [], hobbyNames: ['Photography', 'Sketching', 'Other'] },
    { id: 'running', name: 'Running', hours: 0, color: '#38bdf8', milestones: [] },
  ],

  dramas: [
    {
      id: 'example-drama',
      title: 'Love Between Fairy and Devil',
      mediaType: 'tv',
      genre: 'xianxia romance',
      totalEpisodes: 36,
      currentEpisode: 12,
      status: 'watching',
      image: '',
    },
  ],

  articles: [
    {
      id: 'welcome',
      title: 'Dispatch #001 — Arrival',
      date: '2026-01-05',
      section: 'Front Page',
      excerpt: 'Cloud, neon, vertical everything.',
      body: 'Cloud, neon, vertical everything.\n\nMore soon.',
      image: '',
      layout: 'hero',
    },
    {
      id: 'rain-note',
      title: 'Rain in a vertical city',
      date: '2026-01-14',
      section: 'Essay',
      excerpt: 'Rain slides down glass like code.',
      body: 'Rain slides down glass like code.',
      image: '',
      layout: 'note',
    },
  ],

  gallery: [
    { id: 'g1', src: '', caption: 'Neon alley', place: 'OCT Loft backstreets', address: 'Nanshan, Shenzhen', visited: '2026-01-12', description: 'A narrow alley where every surface reflects magenta and cyan. Smells like rain and street food.', story: 'Midnight wander. Got lost on purpose.', layoutPreset: 1, size: 'lg', rotate: 5, skew: 2, shiftX: -10, shiftY: -8, scale: 1.02, width: '56%' },
    { id: 'g2', src: '', caption: 'Morning market', place: 'Dongmen market', address: 'Luohu District', visited: '2026-01-18', description: 'Loud, steamy, alive before the city fully wakes up.', story: '', layoutPreset: 2, size: 'md', rotate: -3, skew: 5, shiftX: 14, shiftY: 6, scale: 0.94, width: '42%' },
    { id: 'g3', src: '', caption: 'From the window', place: 'Apartment', address: '', visited: '2026-01-05', description: 'First morning. Still jet-lagged. The view made it real.', story: 'The city from the 14th floor looks like a circuit board breathing.', layoutPreset: 0, size: 'sm', rotate: -6, skew: -4, shiftX: 6, shiftY: 14, scale: 0.88, width: '34%' },
    { id: 'g4', src: '', caption: 'Shekou waterfront', place: 'Shekou Sea World', address: 'Shekou, Nanshan', visited: '2026-02-02', description: 'Wind off the water. Neon reflecting on wet pavement.', story: '', layoutPreset: 3, size: 'md', rotate: 7, skew: -3, shiftX: -6, shiftY: 18, scale: 0.9, width: '38%' },
  ],

  zones: [
    'Futian CBD', 'Nanshan', 'OCT Loft', 'Shekou Sea World',
    'Lianhuashan Park', 'Coco Park', 'Dongmen', 'Talent Park',
  ],

  contact: { formspreeId: '' },
};
