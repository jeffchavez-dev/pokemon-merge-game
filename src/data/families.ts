// Each family is a chain of 4 tiles: the 3 real evolution stages, plus a
// "new discovery" capstone once the final real stage is maxed out.
export type Tile = {
  id: string
  name: string
  familyId: string
  tier: number
  radius: number
  sprite: string
  spriteSize: number
  scoreValue: number
  // Set for a "charged" tile that reuses an earlier real stage's sprite
  // rather than a new species — the engine draws a pulsing halo around it
  // so it still reads as distinct progress. See buildFamily2.
  glow?: boolean
}

export type Family = {
  id: string
  name: string
  color: string
  tiles: Tile[]
  // Unset for the (overwhelming) common case of a 3-real-stage family —
  // those fall back to the global GOAL_TIER/MAX_TIER below. A family built
  // with a shorter real chain (see buildFamily2) sets these explicitly so
  // its own goal/capstone land at the right tier instead.
  goalTier?: number
  maxTier?: number
}

const TIER_RADII = [26, 46, 90, 116]
const TIER_SCORE = [1, 4, 14, 40]

// Tier 2 (the final real evolution, e.g. Raichu) is this level's goal, for
// every normal (3-real-stage) family — the vast majority of the roster.
export const GOAL_TIER = 2
export const MAX_TIER = 3

export function familyGoalTier(family: Family): number {
  return family.goalTier ?? GOAL_TIER
}

export function familyMaxTier(family: Family): number {
  return family.maxTier ?? MAX_TIER
}

function capstoneSprite(hex: string, glyph: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="g" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
          <stop offset="35%" stop-color="${hex}"/>
          <stop offset="100%" stop-color="${hex}" stop-opacity="0.85"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill="url(#g)" stroke="#ffffff" stroke-width="4" stroke-opacity="0.6"/>
      <text x="100" y="128" font-size="90" text-anchor="middle" font-family="system-ui, sans-serif" fill="#ffffff">${glyph}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function localSprite(dexId: number): string {
  return `/pokemon/${dexId}.png`
}

function localShinySprite(dexId: number): string {
  return `/pokemon/shiny/${dexId}.png`
}

const collectedDexIds: number[] = []

function buildFamily(
  id: string,
  name: string,
  color: string,
  dexIds: [number, number, number],
  stageNames: [string, string, string],
  capstoneName: string,
  glyph: string,
): Family {
  collectedDexIds.push(...dexIds)
  const tiles: Tile[] = [0, 1, 2].map((tier) => ({
    id: `${id}-${tier}`,
    name: stageNames[tier],
    familyId: id,
    tier,
    radius: TIER_RADII[tier],
    sprite: localSprite(dexIds[tier]),
    spriteSize: 475,
    scoreValue: TIER_SCORE[tier],
  }))
  tiles.push({
    id: `${id}-3`,
    name: capstoneName,
    familyId: id,
    tier: 3,
    radius: TIER_RADII[3],
    sprite: capstoneSprite(color, glyph),
    spriteSize: 200,
    scoreValue: TIER_SCORE[3],
  })
  return { id, name, color, tiles }
}

// For a real chain with only 2 stages — the majority of the Pokemon roster
// (full 3-stage lines are the minority). Rather than skipping a tier, each
// real stage gets a "glowing" tier first: the same sprite again, just with a
// pulsing halo drawn around it (see engine.ts's drawGlowHalos). That keeps
// the merge effort before each real evolution the same as a genuine 3rd
// stage would take. The glowing 2nd stage IS the capstone — there's no
// invented 3rd species; Vulpix -> Glowing Vulpix -> Ninetales -> Glowing
// Ninetales, 4 tiers total, same shape as a normal 3-stage family.
function buildFamily2(id: string, name: string, color: string, dexIds: [number, number], stageNames: [string, string]): Family {
  collectedDexIds.push(...dexIds)
  const goalTier = 2
  const maxTier = 3
  const tiles: Tile[] = [
    {
      id: `${id}-0`,
      name: stageNames[0],
      familyId: id,
      tier: 0,
      radius: TIER_RADII[0],
      sprite: localSprite(dexIds[0]),
      spriteSize: 475,
      scoreValue: TIER_SCORE[0],
    },
    {
      id: `${id}-1`,
      name: `Glowing ${stageNames[0]}`,
      familyId: id,
      tier: 1,
      radius: TIER_RADII[1],
      sprite: localSprite(dexIds[0]),
      spriteSize: 475,
      scoreValue: TIER_SCORE[1],
      glow: true,
    },
    {
      id: `${id}-2`,
      name: stageNames[1],
      familyId: id,
      tier: 2,
      radius: TIER_RADII[2],
      sprite: localSprite(dexIds[1]),
      spriteSize: 475,
      scoreValue: TIER_SCORE[2],
    },
    {
      id: `${id}-3`,
      name: `Glowing ${stageNames[1]}`,
      familyId: id,
      tier: 3,
      radius: TIER_RADII[3],
      sprite: localSprite(dexIds[1]),
      spriteSize: 475,
      scoreValue: TIER_SCORE[3],
      glow: true,
    },
  ]
  return { id, name, color, tiles, goalTier, maxTier }
}

// Level order: FAMILIES[0] is level 1, FAMILIES[1] is level 2, etc.
export const FAMILIES: Family[] = [
  buildFamily(
    'electric',
    'Electric',
    '#facc15',
    [172, 25, 26],
    ['Pichu', 'Pikachu', 'Raichu'],
    'Voltaris',
    '⚡',
  ),
  buildFamily(
    'fire',
    'Fire',
    '#f97316',
    [4, 5, 6],
    ['Charmander', 'Charmeleon', 'Charizard'],
    'Pyrothane',
    '🔥',
  ),
  buildFamily(
    'water',
    'Water',
    '#38bdf8',
    [7, 8, 9],
    ['Squirtle', 'Wartortle', 'Blastoise'],
    'Aquoros',
    '💧',
  ),
  buildFamily(
    'grass',
    'Grass',
    '#4ade80',
    [1, 2, 3],
    ['Bulbasaur', 'Ivysaur', 'Venusaur'],
    'Florabyss',
    '🌿',
  ),
  buildFamily(
    'bug',
    'Bug',
    '#a3e635',
    [10, 11, 12],
    ['Caterpie', 'Metapod', 'Butterfree'],
    'Chitinox',
    '🦋',
  ),
  buildFamily(
    'normal',
    'Normal',
    '#a8a29e',
    [506, 507, 508],
    ['Lillipup', 'Herdier', 'Stoutland'],
    'Omniform',
    '⭐',
  ),
  buildFamily(
    'fighting',
    'Fighting',
    '#b91c1c',
    [66, 67, 68],
    ['Machop', 'Machoke', 'Machamp'],
    'Kravaxis',
    '🥊',
  ),
  buildFamily(
    'flying',
    'Flying',
    '#a5b4fc',
    [16, 17, 18],
    ['Pidgey', 'Pidgeotto', 'Pidgeot'],
    'Aerovant',
    '🕊️',
  ),
  buildFamily(
    'poison',
    'Poison',
    '#c026d3',
    [41, 42, 169],
    ['Zubat', 'Golbat', 'Crobat'],
    'Toxidra',
    '☠️',
  ),
  buildFamily(
    'ground',
    'Ground',
    '#ca8a04',
    [328, 329, 330],
    ['Trapinch', 'Vibrava', 'Flygon'],
    'Dunevrai',
    '⛰️',
  ),
  buildFamily(
    'rock',
    'Rock',
    '#78716c',
    [74, 75, 76],
    ['Geodude', 'Graveler', 'Golem'],
    'Terraclast',
    '🪨',
  ),
  buildFamily(
    'ghost',
    'Ghost',
    '#7c3aed',
    [92, 93, 94],
    ['Gastly', 'Haunter', 'Gengar'],
    'Specthollow',
    '👻',
  ),
  buildFamily(
    'dragon',
    'Dragon',
    '#6366f1',
    [147, 148, 149],
    ['Dratini', 'Dragonair', 'Dragonite'],
    'Wyrmveil',
    '🐉',
  ),
  buildFamily(
    'dark',
    'Dark',
    '#57534e',
    [551, 552, 553],
    ['Sandile', 'Krokorok', 'Krookodile'],
    'Umbraleth',
    '🌑',
  ),
  buildFamily(
    'steel',
    'Steel',
    '#94a3b8',
    [304, 305, 306],
    ['Aron', 'Lairon', 'Aggron'],
    'Ferrolith',
    '⚙️',
  ),
  buildFamily(
    'fairy',
    'Fairy',
    '#f0abfc',
    [173, 35, 36],
    ['Cleffa', 'Clefairy', 'Clefable'],
    'Fayendra',
    '✨',
  ),
  buildFamily(
    'ice',
    'Ice',
    '#67e8f9',
    [220, 221, 473],
    ['Swinub', 'Piloswine', 'Mamoswine'],
    'Glacindra',
    '❄️',
  ),
  buildFamily(
    'psychic',
    'Psychic',
    '#f472b6',
    [63, 64, 65],
    ['Abra', 'Kadabra', 'Alakazam'],
    'Psywarden',
    '🔮',
  ),
  // Gen 6 (Kalos) additions — extra chains layered onto types that already
  // have a Kanto-era family, so the roster keeps growing without needing
  // new type slots.
  buildFamily(
    'grass2',
    'Grass (Kalos)',
    '#65a30d',
    [650, 651, 652],
    ['Chespin', 'Quilladin', 'Chesnaught'],
    'Thornvex',
    '🌰',
  ),
  buildFamily(
    'fire2',
    'Fire (Kalos)',
    '#f43f5e',
    [653, 654, 655],
    ['Fennekin', 'Braixen', 'Delphox'],
    'Vulpyre',
    '🦊',
  ),
  buildFamily(
    'water2',
    'Water (Kalos)',
    '#1e3a8a',
    [656, 657, 658],
    ['Froakie', 'Frogadier', 'Greninja'],
    'Umbrogill',
    '🥷',
  ),
  buildFamily(
    'flying2',
    'Flying (Kalos)',
    '#dc2626',
    [661, 662, 663],
    ['Fletchling', 'Fletchinder', 'Talonflame'],
    'Talonyx',
    '🦅',
  ),
  buildFamily(
    'bug2',
    'Bug (Kalos)',
    '#c084fc',
    [664, 665, 666],
    ['Scatterbug', 'Spewpa', 'Vivillon'],
    'Prismawing',
    '🎨',
  ),
  buildFamily(
    'fairy2',
    'Fairy (Kalos)',
    '#f9a8d4',
    [669, 670, 671],
    ['Flabébé', 'Floette', 'Florges'],
    'Blossomveil',
    '🌸',
  ),
  buildFamily(
    'steel2',
    'Steel (Kalos)',
    '#64748b',
    [679, 680, 681],
    ['Honedge', 'Doublade', 'Aegislash'],
    'Ironward',
    '⚔️',
  ),
  buildFamily(
    'dragon2',
    'Dragon (Kalos)',
    '#c4b5fd',
    [704, 705, 706],
    ['Goomy', 'Sliggoo', 'Goodra'],
    'Sliminox',
    '🐌',
  ),
  // Gen 7 (Alola) additions — same idea as the Kalos batch: extra chains
  // on top of existing types, since Alola only has a handful of clean
  // 3-stage lines (most of its new Pokemon stop at 2 stages).
  buildFamily(
    'grass3',
    'Grass (Alola)',
    '#166534',
    [722, 723, 724],
    ['Rowlet', 'Dartrix', 'Decidueye'],
    'Shadowquill',
    '🏹',
  ),
  buildFamily(
    'fire3',
    'Fire (Alola)',
    '#7f1d1d',
    [725, 726, 727],
    ['Litten', 'Torracat', 'Incineroar'],
    'Embermane',
    '🌋',
  ),
  buildFamily(
    'water3',
    'Water (Alola)',
    '#818cf8',
    [728, 729, 730],
    ['Popplio', 'Brionne', 'Primarina'],
    'Sirenova',
    '🎤',
  ),
  buildFamily(
    'flying3',
    'Flying (Alola)',
    '#fbbf24',
    [731, 732, 733],
    ['Pikipek', 'Trumbeak', 'Toucannon'],
    'Beakstorm',
    '🦜',
  ),
  buildFamily(
    'bug3',
    'Bug (Alola)',
    '#0d9488',
    [736, 737, 738],
    ['Grubbin', 'Charjabug', 'Vikavolt'],
    'Voltcarap',
    '🪲',
  ),
  buildFamily(
    'grass4',
    'Grass (Alola II)',
    '#db2777',
    [761, 762, 763],
    ['Bounsweet', 'Steenee', 'Tsareena'],
    'Regalthorn',
    '👑',
  ),
  buildFamily(
    'dragon3',
    'Dragon (Alola)',
    '#92400e',
    [782, 783, 784],
    ['Jangmo-o', 'Hakamo-o', 'Kommo-o'],
    'Scaleguard',
    '🛡️',
  ),
  // Every remaining pure 3-stage (real evolution) chain across Gen 1-5,
  // 8, and 9 that wasn't already used above. Gen 6/7 were already maxed
  // out in earlier rounds — they only had the chains already included.
  // Some entries splice in a later generation's third evolution onto an
  // older 2-stage line (e.g. Magnemite -> Magnezone came in Gen 4); the
  // electric/fairy/ice families above already used this same trick.

  // ---- Gen 1 (Kanto) ----
  buildFamily('bug4', 'Bug (Kanto II)', '#7c2d92', [13, 14, 15], ['Weedle', 'Kakuna', 'Beedrill'], 'Stingrave', '🐝'),
  buildFamily(
    'poison2',
    'Poison (Nidoran-F)',
    '#a21caf',
    [29, 30, 31],
    ['Nidoran♀', 'Nidorina', 'Nidoqueen'],
    'Venomourn',
    '👑',
  ),
  buildFamily(
    'poison3',
    'Poison (Nidoran-M)',
    '#701a75',
    [32, 33, 34],
    ['Nidoran♂', 'Nidorino', 'Nidoking'],
    'Toxireign',
    '🗡️',
  ),
  buildFamily('grass5', 'Grass (Oddish)', '#84cc16', [43, 44, 45], ['Oddish', 'Gloom', 'Vileplume'], 'Petalgloom', '🌺'),
  buildFamily(
    'water4',
    'Water (Poliwag)',
    '#0ea5e9',
    [60, 61, 62],
    ['Poliwag', 'Poliwhirl', 'Poliwrath'],
    'Tidalfist',
    '🌀',
  ),
  buildFamily(
    'grass6',
    'Grass (Bellsprout)',
    '#4d7c0f',
    [69, 70, 71],
    ['Bellsprout', 'Weepinbell', 'Victreebel'],
    'Maweed',
    '🪤',
  ),
  buildFamily(
    'electric2',
    'Electric (Magnemite)',
    '#eab308',
    [81, 82, 462],
    ['Magnemite', 'Magneton', 'Magnezone'],
    'Ferromag',
    '🧲',
  ),
  buildFamily(
    'ground2',
    'Ground (Rhyhorn)',
    '#b45309',
    [111, 112, 464],
    ['Rhyhorn', 'Rhydon', 'Rhyperior'],
    'Rhinocrag',
    '🦏',
  ),
  buildFamily('water5', 'Water (Horsea)', '#0284c7', [116, 117, 230], ['Horsea', 'Seadra', 'Kingdra'], 'Serpentide', '🐠'),

  // ---- Gen 2 (Johto) ----
  buildFamily(
    'grass7',
    'Grass (Chikorita)',
    '#16a34a',
    [152, 153, 154],
    ['Chikorita', 'Bayleef', 'Meganium'],
    'Verdantle',
    '🌻',
  ),
  buildFamily(
    'fire4',
    'Fire (Cyndaquil)',
    '#ea580c',
    [155, 156, 157],
    ['Cyndaquil', 'Quilava', 'Typhlosion'],
    'Blazehowl',
    '🌪️',
  ),
  buildFamily(
    'water6',
    'Water (Totodile)',
    '#2563eb',
    [158, 159, 160],
    ['Totodile', 'Croconaw', 'Feraligatr'],
    'Jawtide',
    '🐊',
  ),
  buildFamily(
    'electric3',
    'Electric (Mareep)',
    '#fde047',
    [179, 180, 181],
    ['Mareep', 'Flaaffy', 'Ampharos'],
    'Woolamp',
    '🐑',
  ),
  buildFamily(
    'grass8',
    'Grass (Hoppip)',
    '#86efac',
    [187, 188, 189],
    ['Hoppip', 'Skiploom', 'Jumpluff'],
    'Windrift',
    '🌬️',
  ),
  buildFamily(
    'rock2',
    'Rock (Larvitar)',
    '#44403c',
    [246, 247, 248],
    ['Larvitar', 'Pupitar', 'Tyranitar'],
    'Gigashell',
    '🦖',
  ),
  buildFamily(
    'normal2',
    'Normal (Teddiursa)',
    '#92400e',
    [216, 217, 901],
    ['Teddiursa', 'Ursaring', 'Ursaluna'],
    'Moonclaw',
    '🌙',
  ),
  buildFamily(
    'water7',
    'Water (Slowpoke)',
    '#fda4af',
    [79, 80, 199],
    ['Slowpoke', 'Slowbro', 'Slowking'],
    'Dozenroy',
    '😴',
  ),

  // ---- Gen 3 (Hoenn) ----
  buildFamily(
    'grass9',
    'Grass (Treecko)',
    '#15803d',
    [252, 253, 254],
    ['Treecko', 'Grovyle', 'Sceptile'],
    'Leafblade',
    '🍃',
  ),
  buildFamily(
    'fire5',
    'Fire (Torchic)',
    '#fb923c',
    [255, 256, 257],
    ['Torchic', 'Combusken', 'Blaziken'],
    'Cinderkick',
    '👊',
  ),
  buildFamily(
    'water8',
    'Water (Mudkip)',
    '#0369a1',
    [258, 259, 260],
    ['Mudkip', 'Marshtomp', 'Swampert'],
    'Mudtitan',
    '💦',
  ),
  buildFamily('water9', 'Water (Lotad)', '#22d3ee', [270, 271, 272], ['Lotad', 'Lombre', 'Ludicolo'], 'Sambadrop', '🎉'),
  buildFamily(
    'grass10',
    'Grass (Seedot)',
    '#365314',
    [273, 274, 275],
    ['Seedot', 'Nuzleaf', 'Shiftry'],
    'Gustleaf',
    '🍂',
  ),
  buildFamily(
    'psychic2',
    'Psychic (Ralts)',
    '#e879f9',
    [280, 281, 282],
    ['Ralts', 'Kirlia', 'Gardevoir'],
    'Wishveil',
    '💃',
  ),
  buildFamily(
    'normal3',
    'Normal (Slakoth)',
    '#d6d3d1',
    [287, 288, 289],
    ['Slakoth', 'Vigoroth', 'Slaking'],
    'Idlebrawn',
    '💤',
  ),
  buildFamily(
    'normal4',
    'Normal (Whismur)',
    '#fda4af',
    [293, 294, 295],
    ['Whismur', 'Loudred', 'Exploud'],
    'Soundwave',
    '📢',
  ),
  buildFamily(
    'ghost2',
    'Ghost (Duskull)',
    '#4c1d95',
    [355, 356, 477],
    ['Duskull', 'Dusclops', 'Dusknoir'],
    'Nightbound',
    '⚰️',
  ),
  buildFamily('ice2', 'Ice (Spheal)', '#93c5fd', [363, 364, 365], ['Spheal', 'Sealeo', 'Walrein'], 'Frostail', '🦭'),
  buildFamily('dragon4', 'Dragon (Bagon)', '#4338ca', [371, 372, 373], ['Bagon', 'Shelgon', 'Salamence'], 'Skyrend', '🐲'),
  buildFamily(
    'steel3',
    'Steel (Beldum)',
    '#475569',
    [374, 375, 376],
    ['Beldum', 'Metang', 'Metagross'],
    'Ironmind',
    '🧠',
  ),
  buildFamily(
    'normal5',
    'Normal (Zigzagoon)',
    '#a16207',
    [263, 264, 862],
    ['Zigzagoon', 'Linoone', 'Obstagoon'],
    'Bandithief',
    '🦝',
  ),

  // ---- Gen 4 (Sinnoh) ----
  buildFamily(
    'grass11',
    'Grass (Turtwig)',
    '#3f6212',
    [387, 388, 389],
    ['Turtwig', 'Grotle', 'Torterra'],
    'Terraboom',
    '🌳',
  ),
  buildFamily(
    'fire6',
    'Fire (Chimchar)',
    '#c2410c',
    [390, 391, 392],
    ['Chimchar', 'Monferno', 'Infernape'],
    'Flarepunch',
    '🔥',
  ),
  buildFamily(
    'water10',
    'Water (Piplup)',
    '#1d4ed8',
    [393, 394, 395],
    ['Piplup', 'Prinplup', 'Empoleon'],
    'Frostcrown',
    '🐧',
  ),
  buildFamily(
    'flying4',
    'Flying (Starly)',
    '#cbd5e1',
    [396, 397, 398],
    ['Starly', 'Staravia', 'Staraptor'],
    'Skysunder',
    '🦢',
  ),
  buildFamily(
    'electric4',
    'Electric (Shinx)',
    '#1e293b',
    [403, 404, 405],
    ['Shinx', 'Luxio', 'Luxray'],
    'Voltmane',
    '🦁',
  ),
  buildFamily(
    'normal6',
    'Normal (Happiny)',
    '#fbcfe8',
    [440, 113, 242],
    ['Happiny', 'Chansey', 'Blissey'],
    'Joydrop',
    '💗',
  ),
  buildFamily(
    'psychic3',
    'Psychic (Mime Jr.)',
    '#d946ef',
    [439, 122, 866],
    ['Mime Jr.', 'Mr. Mime', 'Mr. Rime'],
    'Jestervane',
    '🎭',
  ),
  buildFamily(
    'dragon5',
    'Dragon (Gible)',
    '#312e81',
    [443, 444, 445],
    ['Gible', 'Gabite', 'Garchomp'],
    'Fangstorm',
    '🦈',
  ),

  // ---- Gen 5 (Unova) ----
  buildFamily(
    'grass12',
    'Grass (Snivy)',
    '#059669',
    [495, 496, 497],
    ['Snivy', 'Servine', 'Serperior'],
    'Emeraldcoil',
    '🐍',
  ),
  buildFamily('fire7', 'Fire (Tepig)', '#e11d48', [498, 499, 500], ['Tepig', 'Pignite', 'Emboar'], 'Cinderhoof', '🐗'),
  buildFamily(
    'water11',
    'Water (Oshawott)',
    '#0891b2',
    [501, 502, 503],
    ['Oshawott', 'Dewott', 'Samurott'],
    'Ronintide',
    '⚔️',
  ),
  buildFamily(
    'flying5',
    'Flying (Pidove)',
    '#e2e8f0',
    [519, 520, 521],
    ['Pidove', 'Tranquill', 'Unfezant'],
    'Windcrest',
    '🕊️',
  ),
  buildFamily(
    'rock3',
    'Rock (Roggenrola)',
    '#525252',
    [524, 525, 526],
    ['Roggenrola', 'Boldore', 'Gigalith'],
    'Stonebound',
    '🗿',
  ),
  buildFamily(
    'fighting2',
    'Fighting (Timburr)',
    '#991b1b',
    [532, 533, 534],
    ['Timburr', 'Gurdurr', 'Conkeldurr'],
    'Hammerforge',
    '🔨',
  ),
  buildFamily(
    'water12',
    'Water (Tympole)',
    '#0e7490',
    [535, 536, 537],
    ['Tympole', 'Palpitoad', 'Seismitoad'],
    'Quakecroak',
    '🐸',
  ),
  buildFamily(
    'bug5',
    'Bug (Sewaddle)',
    '#65a30d',
    [540, 541, 542],
    ['Sewaddle', 'Swadloon', 'Leavanny'],
    'Silkleaf',
    '🧵',
  ),
  buildFamily(
    'bug6',
    'Bug (Venipede)',
    '#7e22ce',
    [543, 544, 545],
    ['Venipede', 'Whirlipede', 'Scolipede'],
    'Toxispike',
    '☣️',
  ),
  buildFamily(
    'psychic4',
    'Psychic (Gothita)',
    '#4f46e5',
    [574, 575, 576],
    ['Gothita', 'Gothorita', 'Gothitelle'],
    'Starveil',
    '🌠',
  ),
  buildFamily(
    'psychic5',
    'Psychic (Solosis)',
    '#a78bfa',
    [577, 578, 579],
    ['Solosis', 'Duosion', 'Reuniclus'],
    'Cerebryx',
    '🧬',
  ),
  buildFamily(
    'ice3',
    'Ice (Vanillite)',
    '#bae6fd',
    [582, 583, 584],
    ['Vanillite', 'Vanillish', 'Vanilluxe'],
    'Frostspire',
    '🍦',
  ),
  buildFamily('steel4', 'Steel (Klink)', '#71717a', [599, 600, 601], ['Klink', 'Klang', 'Klinklang'], 'Coglathe', '⚙️'),
  buildFamily(
    'electric5',
    'Electric (Tynamo)',
    '#fef08a',
    [602, 603, 604],
    ['Tynamo', 'Eelektrik', 'Eelektross'],
    'VoltEel',
    '⚡',
  ),
  buildFamily(
    'ghost3',
    'Ghost (Litwick)',
    '#6d28d9',
    [607, 608, 609],
    ['Litwick', 'Lampent', 'Chandelure'],
    'Waxwraith',
    '🕯️',
  ),
  buildFamily('dragon6', 'Dragon (Axew)', '#3730a3', [610, 611, 612], ['Axew', 'Fraxure', 'Haxorus'], 'Tuskcarve', '🪓'),
  buildFamily('dark2', 'Dark (Deino)', '#292524', [633, 634, 635], ['Deino', 'Zweilous', 'Hydreigon'], 'Triarch', '🐺'),
  buildFamily(
    'dark3',
    'Dark (Pawniard)',
    '#3f3f46',
    [624, 625, 983],
    ['Pawniard', 'Bisharp', 'Kingambit'],
    'Bladeliege',
    '🪖',
  ),

  // ---- Gen 8 (Galar) ----
  buildFamily(
    'grass13',
    'Grass (Grookey)',
    '#65a30d',
    [810, 811, 812],
    ['Grookey', 'Thwackey', 'Rillaboom'],
    'Drumbeat',
    '🥁',
  ),
  buildFamily(
    'fire8',
    'Fire (Scorbunny)',
    '#f87171',
    [813, 814, 815],
    ['Scorbunny', 'Raboot', 'Cinderace'],
    'Blazekick',
    '⚽',
  ),
  buildFamily(
    'water13',
    'Water (Sobble)',
    '#60a5fa',
    [816, 817, 818],
    ['Sobble', 'Drizzile', 'Inteleon'],
    'Snipertear',
    '🎯',
  ),
  buildFamily(
    'flying6',
    'Flying (Rookidee)',
    '#334155',
    [821, 822, 823],
    ['Rookidee', 'Corvisquire', 'Corviknight'],
    'Ironfeather',
    '🪶',
  ),
  buildFamily(
    'bug7',
    'Bug (Blipbug)',
    '#bef264',
    [824, 825, 826],
    ['Blipbug', 'Dottler', 'Orbeetle'],
    'Mindshell',
    '🛸',
  ),
  buildFamily(
    'rock4',
    'Rock (Rolycoly)',
    '#1c1917',
    [837, 838, 839],
    ['Rolycoly', 'Carkol', 'Coalossal'],
    'Cindercoal',
    '⛏️',
  ),
  buildFamily(
    'fairy3',
    'Fairy (Hatenna)',
    '#fce7f3',
    [856, 857, 858],
    ['Hatenna', 'Hattrem', 'Hatterene'],
    'Mindveil',
    '🎩',
  ),
  buildFamily(
    'dark4',
    'Dark (Impidimp)',
    '#581c87',
    [859, 860, 861],
    ['Impidimp', 'Morgrem', 'Grimmsnarl'],
    'Trickhex',
    '🃏',
  ),
  buildFamily(
    'dragon7',
    'Dragon (Dreepy)',
    '#5b21b6',
    [885, 886, 887],
    ['Dreepy', 'Drakloak', 'Dragapult'],
    'Phantomjet',
    '💨',
  ),

  // ---- Gen 9 (Paldea) ----
  buildFamily(
    'grass14',
    'Grass (Sprigatito)',
    '#22c55e',
    [906, 907, 908],
    ['Sprigatito', 'Floragato', 'Meowscarada'],
    'Shadowpetal',
    '🌹',
  ),
  buildFamily(
    'fire9',
    'Fire (Fuecoco)',
    '#9a3412',
    [909, 910, 911],
    ['Fuecoco', 'Crocalor', 'Skeledirge'],
    'Ashcrown',
    '💀',
  ),
  buildFamily(
    'water14',
    'Water (Quaxly)',
    '#0c4a6e',
    [912, 913, 914],
    ['Quaxly', 'Quaxwell', 'Quaquaval'],
    'Waveblade',
    '🕺',
  ),
  buildFamily(
    'grass15',
    'Grass (Smoliv)',
    '#4d7c0f',
    [928, 929, 930],
    ['Smoliv', 'Dolliv', 'Arboliva'],
    'Olivance',
    '🫒',
  ),
  buildFamily('rock5', 'Rock (Nacli)', '#78716c', [932, 933, 934], ['Nacli', 'Naclstack', 'Garganacl'], 'Saltbastion', '🧂'),
  buildFamily(
    'fairy4',
    'Fairy (Tinkatink)',
    '#ec4899',
    [957, 958, 959],
    ['Tinkatink', 'Tinkatuff', 'Tinkaton'],
    'Hammerbell',
    '🔔',
  ),
  buildFamily(
    'dragon8',
    'Dragon (Frigibax)',
    '#155e75',
    [996, 997, 998],
    ['Frigibax', 'Arctibax', 'Baxcalibur'],
    'Glacierfang',
    '🧊',
  ),
  // A second pass over Gen 1-9 for chains missed the first time round —
  // mostly "baby Pokemon" cases where a later generation retroactively
  // added a pre-evolution to an existing 2-stage pair (the same trick the
  // original electric/fairy/ice families already used), plus a couple of
  // brand new Gen 9 3-stage lines.
  buildFamily(
    'normal7',
    'Normal (Igglybuff)',
    '#fecdd3',
    [174, 39, 40],
    ['Igglybuff', 'Jigglypuff', 'Wigglytuff'],
    'Lullabloom',
    '🎵',
  ),
  buildFamily(
    'water15',
    'Water (Azurill)',
    '#7dd3fc',
    [298, 183, 184],
    ['Azurill', 'Marill', 'Azumarill'],
    'Bubblemaw',
    '🐭',
  ),
  buildFamily(
    'grass16',
    'Grass (Budew)',
    '#65a30d',
    [406, 315, 407],
    ['Budew', 'Roselia', 'Roserade'],
    'Thornrose',
    '🌹',
  ),
  buildFamily(
    'fire10',
    'Fire (Magby)',
    '#ef4444',
    [240, 126, 467],
    ['Magby', 'Magmar', 'Magmortar'],
    'Cannonblaze',
    '💪',
  ),
  buildFamily(
    'electric6',
    'Electric (Elekid)',
    '#fde68a',
    [239, 125, 466],
    ['Elekid', 'Electabuzz', 'Electivire'],
    'Thundercharge',
    '💥',
  ),
  buildFamily(
    'fighting3',
    'Fighting (Mankey)',
    '#7c2d12',
    [56, 57, 979],
    ['Mankey', 'Primeape', 'Annihilape'],
    'Furymask',
    '👹',
  ),
  buildFamily(
    'electric7',
    'Electric (Pawmi)',
    '#f59e0b',
    [921, 922, 923],
    ['Pawmi', 'Pawmo', 'Pawmot'],
    'Sparkwhisker',
    '🐹',
  ),
  buildFamily(
    'grass17',
    'Grass (Applin)',
    '#7f1d1d',
    [840, 1011, 1019],
    ['Applin', 'Dipplin', 'Hydrapple'],
    'Ambrosia',
    '🍎',
  ),
  // The roster's first legendaries: Cosmog and Cosmoem branch into either
  // Solgaleo or Lunala depending on version, same as the real games — so
  // both are included as separate families sharing the first two stages.
  buildFamily(
    'psychic6',
    'Psychic (Cosmog/Solgaleo)',
    '#fef9c3',
    [789, 790, 791],
    ['Cosmog', 'Cosmoem', 'Solgaleo'],
    'Solmajesty',
    '☀️',
  ),
  buildFamily(
    'psychic7',
    'Psychic (Cosmog/Lunala)',
    '#c7d2fe',
    [789, 790, 792],
    ['Cosmog', 'Cosmoem', 'Lunala'],
    'Lunashroud',
    '🌙',
  ),
  // 2-real-stage families (buildFamily2) — Vulpix has only one evolution, so
  // its chain is Vulpix -> Glowing Vulpix -> Ninetales (goal) -> Glowing
  // Ninetales (capstone), matching a normal family's 4-tier depth.
  buildFamily2('fire11', 'Fire (Vulpix)', '#fdba74', [37, 38], ['Vulpix', 'Ninetales']),

  // ---- 2-real-stage families (buildFamily2) ----
  // The rest of the roster's 2-stage lines: species with exactly one real
  // evolution. Each still takes 4 merges to cap out, same as a normal
  // 3-stage family — see buildFamily2's own comment for how.
  buildFamily2('normal8', 'Normal (Rattata)', '#b8936d', [19, 20], ['Rattata', 'Raticate']),
  buildFamily2('normal9', 'Normal (Spearow)', '#c5a897', [21, 22], ['Spearow', 'Fearow']),
  buildFamily2('poison4', 'Poison (Ekans)', '#b154d3', [23, 24], ['Ekans', 'Arbok']),
  buildFamily2('ground3', 'Ground (Sandshrew)', '#9e5b33', [27, 28], ['Sandshrew', 'Sandslash']),
  buildFamily2('bug8', 'Bug (Paras)', '#97d421', [46, 47], ['Paras', 'Parasect']),
  buildFamily2('bug9', 'Bug (Venonat)', '#7dc32c', [48, 49], ['Venonat', 'Venomoth']),
  buildFamily2('ground4', 'Ground (Diglett)', '#bfa146', [50, 51], ['Diglett', 'Dugtrio']),
  buildFamily2('normal10', 'Normal (Meowth)', '#c6ad91', [52, 53], ['Meowth', 'Persian']),
  buildFamily2('normal11', 'Normal (Meowth)', '#b79f74', [52, 863], ['Meowth', 'Perrserker']),
  buildFamily2('water16', 'Water (Psyduck)', '#3d8dcd', [54, 55], ['Psyduck', 'Golduck']),
  buildFamily2('fire12', 'Fire (Growlithe)', '#e1624b', [58, 59], ['Growlithe', 'Arcanine']),
  buildFamily2('water17', 'Water (Tentacool)', '#2964b5', [72, 73], ['Tentacool', 'Tentacruel']),
  buildFamily2('fire13', 'Fire (Ponyta)', '#be7b25', [77, 78], ['Ponyta', 'Rapidash']),
  buildFamily2('normal12', "Normal (Farfetch'd)", '#c1b27b', [83, 865], ["Farfetch'd", "Sirfetch'd"]),
  buildFamily2('normal13', 'Normal (Doduo)', '#c9aa97', [84, 85], ['Doduo', 'Dodrio']),
  buildFamily2('water18', 'Water (Seel)', '#2597b7', [86, 87], ['Seel', 'Dewgong']),
  buildFamily2('poison5', 'Poison (Grimer)', '#bb26d4', [88, 89], ['Grimer', 'Muk']),
  buildFamily2('water19', 'Water (Shellder)', '#2085bb', [90, 91], ['Shellder', 'Cloyster']),
  buildFamily2('rock6', 'Rock (Onix)', '#6a5643', [95, 208], ['Onix', 'Steelix']),
  buildFamily2('psychic8', 'Psychic (Drowzee)', '#d34fa9', [96, 97], ['Drowzee', 'Hypno']),
  buildFamily2('water20', 'Water (Krabby)', '#5ac2dd', [98, 99], ['Krabby', 'Kingler']),
  buildFamily2('electric8', 'Electric (Voltorb)', '#e3e744', [100, 101], ['Voltorb', 'Electrode']),
  buildFamily2('grass18', 'Grass (Exeggcute)', '#53c943', [102, 103], ['Exeggcute', 'Exeggutor']),
  buildFamily2('ground5', 'Ground (Cubone)', '#9e7634', [104, 105], ['Cubone', 'Marowak']),
  buildFamily2('normal14', 'Normal (Lickitung)', '#bb9b74', [108, 463], ['Lickitung', 'Lickilicky']),
  buildFamily2('poison6', 'Poison (Koffing)', '#be2dbc', [109, 110], ['Koffing', 'Weezing']),
  buildFamily2('grass19', 'Grass (Tangela)', '#64d83f', [114, 465], ['Tangela', 'Tangrowth']),
  buildFamily2('water21', 'Water (Goldeen)', '#366ec7', [118, 119], ['Goldeen', 'Seaking']),
  buildFamily2('water22', 'Water (Staryu)', '#519cdc', [120, 121], ['Staryu', 'Starmie']),
  buildFamily2('bug10', 'Bug (Scyther)', '#b7da58', [123, 212], ['Scyther', 'Scizor']),
  buildFamily2('bug11', 'Bug (Scyther)', '#b0c81a', [123, 900], ['Scyther', 'Kleavor']),
  buildFamily2('water23', 'Water (Magikarp)', '#2e91c3', [129, 130], ['Magikarp', 'Gyarados']),
  buildFamily2('rock7', 'Rock (Omanyte)', '#926954', [138, 139], ['Omanyte', 'Omastar']),
  buildFamily2('rock8', 'Rock (Kabuto)', '#805f49', [140, 141], ['Kabuto', 'Kabutops']),
  buildFamily2('normal15', 'Normal (Sentret)', '#beaa81', [161, 162], ['Sentret', 'Furret']),
  buildFamily2('normal16', 'Normal (Hoothoot)', '#bb8169', [163, 164], ['Hoothoot', 'Noctowl']),
  buildFamily2('bug12', 'Bug (Ledyba)', '#84e634', [165, 166], ['Ledyba', 'Ledian']),
  buildFamily2('bug13', 'Bug (Spinarak)', '#8fe11e', [167, 168], ['Spinarak', 'Ariados']),
  buildFamily2('water24', 'Water (Chinchou)', '#22b3d4', [170, 171], ['Chinchou', 'Lanturn']),
  buildFamily2('psychic9', 'Psychic (Natu)', '#e14bc4', [177, 178], ['Natu', 'Xatu']),
  buildFamily2('normal17', 'Normal (Aipom)', '#ae8e78', [190, 424], ['Aipom', 'Ambipom']),
  buildFamily2('grass20', 'Grass (Sunkern)', '#78cc22', [191, 192], ['Sunkern', 'Sunflora']),
  buildFamily2('bug14', 'Bug (Yanma)', '#afd633', [193, 469], ['Yanma', 'Yanmega']),
  buildFamily2('water25', 'Water (Wooper)', '#2f6bc2', [194, 195], ['Wooper', 'Quagsire']),
  buildFamily2('water26', 'Water (Wooper)', '#409ee7', [194, 980], ['Wooper', 'Clodsire']),
  buildFamily2('dark5', 'Dark (Murkrow)', '#4f3f64', [198, 430], ['Murkrow', 'Honchkrow']),
  buildFamily2('ghost4', 'Ghost (Misdreavus)', '#4529b2', [200, 429], ['Misdreavus', 'Mismagius']),
  buildFamily2('normal18', 'Normal (Girafarig)', '#bb9c82', [203, 981], ['Girafarig', 'Farigiraf']),
  buildFamily2('bug15', 'Bug (Pineco)', '#d0e52f', [204, 205], ['Pineco', 'Forretress']),
  buildFamily2('normal19', 'Normal (Dunsparce)', '#b5986d', [206, 982], ['Dunsparce', 'Dudunsparce']),
  buildFamily2('ground6', 'Ground (Gligar)', '#c27734', [207, 472], ['Gligar', 'Gliscor']),
  buildFamily2('fairy5', 'Fairy (Snubbull)', '#e1258f', [209, 210], ['Snubbull', 'Granbull']),
  buildFamily2('water27', 'Water (Qwilfish)', '#44a3ce', [211, 904], ['Qwilfish', 'Overqwil']),
  buildFamily2('dark6', 'Dark (Sneasel)', '#323152', [215, 461], ['Sneasel', 'Weavile']),
  buildFamily2('dark7', 'Dark (Sneasel)', '#362f5a', [215, 903], ['Sneasel', 'Sneasler']),
  buildFamily2('fire14', 'Fire (Slugma)', '#af662e', [218, 219], ['Slugma', 'Magcargo']),
  buildFamily2('water28', 'Water (Corsola)', '#54b0d0', [222, 864], ['Corsola', 'Cursola']),
  buildFamily2('water29', 'Water (Remoraid)', '#215bce', [223, 224], ['Remoraid', 'Octillery']),
  buildFamily2('dark8', 'Dark (Houndour)', '#4f3b72', [228, 229], ['Houndour', 'Houndoom']),
  buildFamily2('ground7', 'Ground (Phanpy)', '#c8b849', [231, 232], ['Phanpy', 'Donphan']),
  buildFamily2('normal20', 'Normal (Stantler)', '#c0ae81', [234, 899], ['Stantler', 'Wyrdeer']),
  buildFamily2('fighting4', 'Fighting (Tyrogue)', '#cc4c1f', [236, 106], ['Tyrogue', 'Hitmonlee']),
  buildFamily2('fighting5', 'Fighting (Tyrogue)', '#c31c34', [236, 107], ['Tyrogue', 'Hitmonchan']),
  buildFamily2('fighting6', 'Fighting (Tyrogue)', '#e04446', [236, 237], ['Tyrogue', 'Hitmontop']),
  buildFamily2('ice4', 'Ice (Smoochum)', '#318cca', [238, 124], ['Smoochum', 'Jynx']),
  buildFamily2('dark9', 'Dark (Poochyena)', '#2e3059', [261, 262], ['Poochyena', 'Mightyena']),
  buildFamily2('normal21', 'Normal (Taillow)', '#b7996f', [276, 277], ['Taillow', 'Swellow']),
  buildFamily2('water30', 'Water (Wingull)', '#3b9bd0', [278, 279], ['Wingull', 'Pelipper']),
  buildFamily2('bug16', 'Bug (Surskit)', '#84df30', [283, 284], ['Surskit', 'Masquerain']),
  buildFamily2('grass21', 'Grass (Shroomish)', '#6dd62e', [285, 286], ['Shroomish', 'Breloom']),
  buildFamily2('bug17', 'Bug (Nincada)', '#ace454', [290, 291], ['Nincada', 'Ninjask']),
  buildFamily2('bug18', 'Bug (Nincada)', '#bdde44', [290, 292], ['Nincada', 'Shedinja']),
  buildFamily2('fighting7', 'Fighting (Makuhita)', '#df695a', [296, 297], ['Makuhita', 'Hariyama']),
  buildFamily2('rock9', 'Rock (Nosepass)', '#8e6556', [299, 476], ['Nosepass', 'Probopass']),
  buildFamily2('normal22', 'Normal (Skitty)', '#c6ad98', [300, 301], ['Skitty', 'Delcatty']),
  buildFamily2('fighting8', 'Fighting (Meditite)', '#cf3150', [307, 308], ['Meditite', 'Medicham']),
  buildFamily2('electric9', 'Electric (Electrike)', '#d2c22b', [309, 310], ['Electrike', 'Manectric']),
  buildFamily2('poison7', 'Poison (Gulpin)', '#9d38e0', [316, 317], ['Gulpin', 'Swalot']),
  buildFamily2('water31', 'Water (Carvanha)', '#2e8ce4', [318, 319], ['Carvanha', 'Sharpedo']),
  buildFamily2('water32', 'Water (Wailmer)', '#5483d5', [320, 321], ['Wailmer', 'Wailord']),
  buildFamily2('fire15', 'Fire (Numel)', '#e15c22', [322, 323], ['Numel', 'Camerupt']),
  buildFamily2('psychic10', 'Psychic (Spoink)', '#c9417e', [325, 326], ['Spoink', 'Grumpig']),
  buildFamily2('grass22', 'Grass (Cacnea)', '#40c519', [331, 332], ['Cacnea', 'Cacturne']),
  buildFamily2('normal23', 'Normal (Swablu)', '#cea794', [333, 334], ['Swablu', 'Altaria']),
  buildFamily2('water33', 'Water (Barboach)', '#45b1d2', [339, 340], ['Barboach', 'Whiscash']),
  buildFamily2('water34', 'Water (Corphish)', '#5cabdc', [341, 342], ['Corphish', 'Crawdaunt']),
  buildFamily2('ground8', 'Ground (Baltoy)', '#af8f39', [343, 344], ['Baltoy', 'Claydol']),
  buildFamily2('rock10', 'Rock (Lileep)', '#745548', [345, 346], ['Lileep', 'Cradily']),
  buildFamily2('rock11', 'Rock (Anorith)', '#755b48', [347, 348], ['Anorith', 'Armaldo']),
  buildFamily2('water35', 'Water (Feebas)', '#4795e7', [349, 350], ['Feebas', 'Milotic']),
  buildFamily2('ghost5', 'Ghost (Shuppet)', '#963ece', [353, 354], ['Shuppet', 'Banette']),
  buildFamily2('psychic11', 'Psychic (Wynaut)', '#b2289e', [360, 202], ['Wynaut', 'Wobbuffet']),
  buildFamily2('ice5', 'Ice (Snorunt)', '#2f89ab', [361, 362], ['Snorunt', 'Glalie']),
  buildFamily2('ice6', 'Ice (Snorunt)', '#4dbfd4', [361, 478], ['Snorunt', 'Froslass']),
  buildFamily2('water36', 'Water (Clamperl)', '#356ad3', [366, 367], ['Clamperl', 'Huntail']),
  buildFamily2('water37', 'Water (Clamperl)', '#45b8e0', [366, 368], ['Clamperl', 'Gorebyss']),
  buildFamily2('normal24', 'Normal (Bidoof)', '#b4a67e', [399, 400], ['Bidoof', 'Bibarel']),
  buildFamily2('bug19', 'Bug (Kricketot)', '#abb72e', [401, 402], ['Kricketot', 'Kricketune']),
  buildFamily2('rock12', 'Rock (Cranidos)', '#836644', [408, 409], ['Cranidos', 'Rampardos']),
  buildFamily2('rock13', 'Rock (Shieldon)', '#8b764b', [410, 411], ['Shieldon', 'Bastiodon']),
  buildFamily2('bug20', 'Bug (Burmy)', '#84c227', [412, 413], ['Burmy', 'Wormadam']),
  buildFamily2('bug21', 'Bug (Burmy)', '#7ed234', [412, 414], ['Burmy', 'Mothim']),
  buildFamily2('bug22', 'Bug (Combee)', '#abbf37', [415, 416], ['Combee', 'Vespiquen']),
  buildFamily2('water38', 'Water (Buizel)', '#49b3e3', [418, 419], ['Buizel', 'Floatzel']),
  buildFamily2('grass23', 'Grass (Cherubi)', '#3fcc2f', [420, 421], ['Cherubi', 'Cherrim']),
  buildFamily2('water39', 'Water (Shellos)', '#2277b9', [422, 423], ['Shellos', 'Gastrodon']),
  buildFamily2('ghost6', 'Ghost (Drifloon)', '#712cbc', [425, 426], ['Drifloon', 'Drifblim']),
  buildFamily2('normal25', 'Normal (Buneary)', '#c9b18d', [427, 428], ['Buneary', 'Lopunny']),
  buildFamily2('normal26', 'Normal (Glameow)', '#bda58e', [431, 432], ['Glameow', 'Purugly']),
  buildFamily2('psychic12', 'Psychic (Chingling)', '#ba3395', [433, 358], ['Chingling', 'Chimecho']),
  buildFamily2('poison8', 'Poison (Stunky)', '#a41bd1', [434, 435], ['Stunky', 'Skuntank']),
  buildFamily2('steel5', 'Steel (Bronzor)', '#8997a9', [436, 437], ['Bronzor', 'Bronzong']),
  buildFamily2('rock14', 'Rock (Bonsly)', '#805f53', [438, 185], ['Bonsly', 'Sudowoodo']),
  buildFamily2('normal27', 'Normal (Munchlax)', '#b69684', [446, 143], ['Munchlax', 'Snorlax']),
  buildFamily2('fighting9', 'Fighting (Riolu)', '#dd404b', [447, 448], ['Riolu', 'Lucario']),
  buildFamily2('ground9', 'Ground (Hippopotas)', '#bf8a3a', [449, 450], ['Hippopotas', 'Hippowdon']),
  buildFamily2('poison9', 'Poison (Skorupi)', '#c724de', [451, 452], ['Skorupi', 'Drapion']),
  buildFamily2('poison10', 'Poison (Croagunk)', '#912bb0', [453, 454], ['Croagunk', 'Toxicroak']),
  buildFamily2('water40', 'Water (Finneon)', '#246fbe', [456, 457], ['Finneon', 'Lumineon']),
  buildFamily2('water41', 'Water (Mantyke)', '#3386b9', [458, 226], ['Mantyke', 'Mantine']),
  buildFamily2('grass24', 'Grass (Snover)', '#98dd4b', [459, 460], ['Snover', 'Abomasnow']),
  buildFamily2('water42', 'Water (Phione)', '#2892b6', [489, 490], ['Phione', 'Manaphy']),
  buildFamily2('normal28', 'Normal (Patrat)', '#cbbd90', [504, 505], ['Patrat', 'Watchog']),
  buildFamily2('dark10', 'Dark (Purrloin)', '#2e2e4c', [509, 510], ['Purrloin', 'Liepard']),
  buildFamily2('grass25', 'Grass (Pansage)', '#65c325', [511, 512], ['Pansage', 'Simisage']),
  buildFamily2('fire16', 'Fire (Pansear)', '#b24831', [513, 514], ['Pansear', 'Simisear']),
  buildFamily2('water43', 'Water (Panpour)', '#1f5ed9', [515, 516], ['Panpour', 'Simipour']),
  buildFamily2('psychic13', 'Psychic (Munna)', '#d2218b', [517, 518], ['Munna', 'Musharna']),
  buildFamily2('electric10', 'Electric (Blitzle)', '#d89d55', [522, 523], ['Blitzle', 'Zebstrika']),
  buildFamily2('psychic14', 'Psychic (Woobat)', '#c31b6a', [527, 528], ['Woobat', 'Swoobat']),
  buildFamily2('ground10', 'Ground (Drilbur)', '#c39e4e', [529, 530], ['Drilbur', 'Excadrill']),
  buildFamily2('grass26', 'Grass (Cottonee)', '#51de21', [546, 547], ['Cottonee', 'Whimsicott']),
  buildFamily2('grass27', 'Grass (Petilil)', '#66de56', [548, 549], ['Petilil', 'Lilligant']),
  buildFamily2('water44', 'Water (Basculin)', '#3084d3', [550, 902], ['Basculin', 'Basculegion']),
  buildFamily2('fire17', 'Fire (Darumaka)', '#e04f47', [554, 555], ['Darumaka', 'Darmanitan']),
  buildFamily2('bug23', 'Bug (Dwebble)', '#b4d853', [557, 558], ['Dwebble', 'Crustle']),
  buildFamily2('dark11', 'Dark (Scraggy)', '#443061', [559, 560], ['Scraggy', 'Scrafty']),
  buildFamily2('ghost7', 'Ghost (Yamask)', '#8149e8', [562, 563], ['Yamask', 'Cofagrigus']),
  buildFamily2('ghost8', 'Ghost (Yamask)', '#7457d5', [562, 867], ['Yamask', 'Runerigus']),
  buildFamily2('water45', 'Water (Tirtouga)', '#2ba1e2', [564, 565], ['Tirtouga', 'Carracosta']),
  buildFamily2('rock15', 'Rock (Archen)', '#72523e', [566, 567], ['Archen', 'Archeops']),
  buildFamily2('poison11', 'Poison (Trubbish)', '#8721c0', [568, 569], ['Trubbish', 'Garbodor']),
  buildFamily2('dark12', 'Dark (Zorua)', '#352d47', [570, 571], ['Zorua', 'Zoroark']),
  buildFamily2('normal29', 'Normal (Minccino)', '#c8b79b', [572, 573], ['Minccino', 'Cinccino']),
  buildFamily2('water46', 'Water (Ducklett)', '#36bbe3', [580, 581], ['Ducklett', 'Swanna']),
  buildFamily2('normal30', 'Normal (Deerling)', '#caa998', [585, 586], ['Deerling', 'Sawsbuck']),
  buildFamily2('bug24', 'Bug (Karrablast)', '#a4d74f', [588, 589], ['Karrablast', 'Escavalier']),
  buildFamily2('grass28', 'Grass (Foongus)', '#9fdd51', [590, 591], ['Foongus', 'Amoonguss']),
  buildFamily2('water47', 'Water (Frillish)', '#5085e2', [592, 593], ['Frillish', 'Jellicent']),
  buildFamily2('bug25', 'Bug (Joltik)', '#7fd729', [595, 596], ['Joltik', 'Galvantula']),
  buildFamily2('grass29', 'Grass (Ferroseed)', '#66b928', [597, 598], ['Ferroseed', 'Ferrothorn']),
  buildFamily2('psychic15', 'Psychic (Elgyem)', '#e337ce', [605, 606], ['Elgyem', 'Beheeyem']),
  buildFamily2('ice7', 'Ice (Cubchoo)', '#1dc6ca', [613, 614], ['Cubchoo', 'Beartic']),
  buildFamily2('bug26', 'Bug (Shelmet)', '#a5b530', [616, 617], ['Shelmet', 'Accelgor']),
  buildFamily2('fighting10', 'Fighting (Mienfoo)', '#e96a4d', [619, 620], ['Mienfoo', 'Mienshao']),
  buildFamily2('ground11', 'Ground (Golett)', '#b9a654', [622, 623], ['Golett', 'Golurk']),
  buildFamily2('normal31', 'Normal (Rufflet)', '#cdac91', [627, 628], ['Rufflet', 'Braviary']),
  buildFamily2('dark13', 'Dark (Vullaby)', '#2d264d', [629, 630], ['Vullaby', 'Mandibuzz']),
  buildFamily2('bug27', 'Bug (Larvesta)', '#a2cc23', [636, 637], ['Larvesta', 'Volcarona']),
  buildFamily2('normal32', 'Normal (Bunnelby)', '#c4ac8a', [659, 660], ['Bunnelby', 'Diggersby']),
  buildFamily2('fire18', 'Fire (Litleo)', '#bd5921', [667, 668], ['Litleo', 'Pyroar']),
  buildFamily2('grass30', 'Grass (Skiddo)', '#4be336', [672, 673], ['Skiddo', 'Gogoat']),
  buildFamily2('fighting11', 'Fighting (Pancham)', '#b52a21', [674, 675], ['Pancham', 'Pangoro']),
  buildFamily2('psychic16', 'Psychic (Espurr)', '#db5fbc', [677, 678], ['Espurr', 'Meowstic']),
  buildFamily2('fairy6', 'Fairy (Spritzee)', '#db5fb8', [682, 683], ['Spritzee', 'Aromatisse']),
  buildFamily2('fairy7', 'Fairy (Swirlix)', '#c43562', [684, 685], ['Swirlix', 'Slurpuff']),
  buildFamily2('dark14', 'Dark (Inkay)', '#2b2c4e', [686, 687], ['Inkay', 'Malamar']),
  buildFamily2('rock16', 'Rock (Binacle)', '#6d553b', [688, 689], ['Binacle', 'Barbaracle']),
  buildFamily2('poison12', 'Poison (Skrelp)', '#ca47c4', [690, 691], ['Skrelp', 'Dragalge']),
  buildFamily2('water48', 'Water (Clauncher)', '#4b9de2', [692, 693], ['Clauncher', 'Clawitzer']),
  buildFamily2('electric11', 'Electric (Helioptile)', '#e3ae3f', [694, 695], ['Helioptile', 'Heliolisk']),
  buildFamily2('rock17', 'Rock (Tyrunt)', '#7f6a44', [696, 697], ['Tyrunt', 'Tyrantrum']),
  buildFamily2('rock18', 'Rock (Amaura)', '#6f4e44', [698, 699], ['Amaura', 'Aurorus']),
  buildFamily2('ghost9', 'Ghost (Phantump)', '#a447da', [708, 709], ['Phantump', 'Trevenant']),
  buildFamily2('ghost10', 'Ghost (Pumpkaboo)', '#6527ba', [710, 711], ['Pumpkaboo', 'Gourgeist']),
  buildFamily2('ice8', 'Ice (Bergmite)', '#30b2a5', [712, 713], ['Bergmite', 'Avalugg']),
  buildFamily2('flying7', 'Flying (Noibat)', '#3f74d4', [714, 715], ['Noibat', 'Noivern']),
  buildFamily2('normal33', 'Normal (Yungoos)', '#bfa975', [734, 735], ['Yungoos', 'Gumshoos']),
  buildFamily2('fighting12', 'Fighting (Crabrawler)', '#ca404c', [739, 740], ['Crabrawler', 'Crabominable']),
  buildFamily2('bug28', 'Bug (Cutiefly)', '#9ce04b', [742, 743], ['Cutiefly', 'Ribombee']),
  buildFamily2('rock19', 'Rock (Rockruff)', '#7f5c48', [744, 745], ['Rockruff', 'Lycanroc']),
  buildFamily2('poison13', 'Poison (Mareanie)', '#ca34d7', [747, 748], ['Mareanie', 'Toxapex']),
  buildFamily2('ground12', 'Ground (Mudbray)', '#ba7138', [749, 750], ['Mudbray', 'Mudsdale']),
  buildFamily2('water49', 'Water (Dewpider)', '#2d99ce', [751, 752], ['Dewpider', 'Araquanid']),
  buildFamily2('grass31', 'Grass (Fomantis)', '#59cb33', [753, 754], ['Fomantis', 'Lurantis']),
  buildFamily2('grass32', 'Grass (Morelull)', '#8be74e', [755, 756], ['Morelull', 'Shiinotic']),
  buildFamily2('poison14', 'Poison (Salandit)', '#9532af', [757, 758], ['Salandit', 'Salazzle']),
  buildFamily2('normal34', 'Normal (Stufful)', '#b48e79', [759, 760], ['Stufful', 'Bewear']),
  buildFamily2('bug29', 'Bug (Wimpod)', '#dbe254', [767, 768], ['Wimpod', 'Golisopod']),
  buildFamily2('ghost11', 'Ghost (Sandygast)', '#732fab', [769, 770], ['Sandygast', 'Palossand']),
  buildFamily2('normal35', 'Normal (Type: Null)', '#c6a587', [772, 773], ['Type: Null', 'Silvally']),
  buildFamily2('poison15', 'Poison (Poipole)', '#a133d8', [803, 804], ['Poipole', 'Naganadel']),
  buildFamily2('normal36', 'Normal (Skwovet)', '#c2b095', [819, 820], ['Skwovet', 'Greedent']),
  buildFamily2('dark15', 'Dark (Nickit)', '#37284e', [827, 828], ['Nickit', 'Thievul']),
  buildFamily2('grass33', 'Grass (Gossifleur)', '#a1db5f', [829, 830], ['Gossifleur', 'Eldegoss']),
  buildFamily2('normal37', 'Normal (Wooloo)', '#bdab7b', [831, 832], ['Wooloo', 'Dubwool']),
  buildFamily2('water50', 'Water (Chewtle)', '#3b70d7', [833, 834], ['Chewtle', 'Drednaw']),
  buildFamily2('electric12', 'Electric (Yamper)', '#cbb231', [835, 836], ['Yamper', 'Boltund']),
  buildFamily2('ground13', 'Ground (Silicobra)', '#c78c40', [843, 844], ['Silicobra', 'Sandaconda']),
  buildFamily2('water51', 'Water (Arrokuda)', '#4ec0e6', [846, 847], ['Arrokuda', 'Barraskewda']),
  buildFamily2('electric13', 'Electric (Toxel)', '#dcd53e', [848, 849], ['Toxel', 'Toxtricity']),
  buildFamily2('fire19', 'Fire (Sizzlipede)', '#d35732', [850, 851], ['Sizzlipede', 'Centiskorch']),
  buildFamily2('fighting13', 'Fighting (Clobbopus)', '#e47b4b', [852, 853], ['Clobbopus', 'Grapploct']),
  buildFamily2('ghost12', 'Ghost (Sinistea)', '#b047e2', [854, 855], ['Sinistea', 'Polteageist']),
  buildFamily2('fairy8', 'Fairy (Milcery)', '#e5418d', [868, 869], ['Milcery', 'Alcremie']),
  buildFamily2('ice9', 'Ice (Snom)', '#2fa5d9', [872, 873], ['Snom', 'Frosmoth']),
  buildFamily2('steel6', 'Steel (Cufant)', '#6e889e', [878, 879], ['Cufant', 'Copperajah']),
  buildFamily2('steel7', 'Steel (Duraludon)', '#7a94a1', [884, 1018], ['Duraludon', 'Archaludon']),
  buildFamily2('fighting14', 'Fighting (Kubfu)', '#e25e3b', [891, 892], ['Kubfu', 'Urshifu']),
  buildFamily2('normal38', 'Normal (Lechonk)', '#be9378', [915, 916], ['Lechonk', 'Oinkologne']),
  buildFamily2('bug30', 'Bug (Tarountula)', '#9bd832', [917, 918], ['Tarountula', 'Spidops']),
  buildFamily2('bug31', 'Bug (Nymble)', '#abd71d', [919, 920], ['Nymble', 'Lokix']),
  buildFamily2('normal39', 'Normal (Tandemaus)', '#ba9268', [924, 925], ['Tandemaus', 'Maushold']),
  buildFamily2('fairy9', 'Fairy (Fidough)', '#aa2e77', [926, 927], ['Fidough', 'Dachsbun']),
  buildFamily2('fire20', 'Fire (Charcadet)', '#b76731', [935, 936], ['Charcadet', 'Armarouge']),
  buildFamily2('fire21', 'Fire (Charcadet)', '#c17621', [935, 937], ['Charcadet', 'Ceruledge']),
  buildFamily2('electric14', 'Electric (Tadbulb)', '#cb8435', [938, 939], ['Tadbulb', 'Bellibolt']),
  buildFamily2('electric15', 'Electric (Wattrel)', '#dfa027', [940, 941], ['Wattrel', 'Kilowattrel']),
  buildFamily2('dark16', 'Dark (Maschiff)', '#483a70', [942, 943], ['Maschiff', 'Mabosstiff']),
  buildFamily2('poison16', 'Poison (Shroodle)', '#c840be', [944, 945], ['Shroodle', 'Grafaiai']),
  buildFamily2('grass34', 'Grass (Bramblin)', '#36d625', [946, 947], ['Bramblin', 'Brambleghast']),
  buildFamily2('ground14', 'Ground (Toedscool)', '#b18b40', [948, 949], ['Toedscool', 'Toedscruel']),
  buildFamily2('grass35', 'Grass (Capsakid)', '#60c941', [951, 952], ['Capsakid', 'Scovillain']),
  buildFamily2('bug32', 'Bug (Rellor)', '#d1dc56', [953, 954], ['Rellor', 'Rabsca']),
  buildFamily2('psychic17', 'Psychic (Flittle)', '#db3a9e', [955, 956], ['Flittle', 'Espathra']),
  buildFamily2('water52', 'Water (Wiglett)', '#228bcb', [960, 961], ['Wiglett', 'Wugtrio']),
  buildFamily2('water53', 'Water (Finizen)', '#1a70c8', [963, 964], ['Finizen', 'Palafin']),
  buildFamily2('steel8', 'Steel (Varoom)', '#6c779d', [965, 966], ['Varoom', 'Revavroom']),
  buildFamily2('rock20', 'Rock (Glimmet)', '#945e4e', [969, 970], ['Glimmet', 'Glimmora']),
  buildFamily2('ghost13', 'Ghost (Greavard)', '#623cc7', [971, 972], ['Greavard', 'Houndstone']),
  buildFamily2('ice10', 'Ice (Cetoddle)', '#60c5d8', [974, 975], ['Cetoddle', 'Cetitan']),
  buildFamily2('ghost14', 'Ghost (Gimmighoul)', '#742cce', [999, 1000], ['Gimmighoul', 'Gholdengo']),
  buildFamily2('grass36', 'Grass (Poltchageist)', '#79cc47', [1012, 1013], ['Poltchageist', 'Sinistcha']),
]

export const ALL_DEX_IDS = Array.from(new Set(collectedDexIds))

// Eevee is a special side-collectible, not a normal level family: it never
// appears as a level goal and never merges (nothing else shares its family
// id), so it lives outside FAMILIES/the level rotation entirely. Its 9 forms
// are addressed by "tier" 0-8 purely as a slot index into this array, not a
// real evolution stage.
export const EEVEE_FAMILY_ID = 'eevee'

export const EEVEELUTIONS: Tile[] = [
  { id: 'eevee-0', name: 'Eevee', familyId: EEVEE_FAMILY_ID, tier: 0, radius: 46, sprite: localShinySprite(133), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-1', name: 'Vaporeon', familyId: EEVEE_FAMILY_ID, tier: 1, radius: 46, sprite: localShinySprite(134), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-2', name: 'Jolteon', familyId: EEVEE_FAMILY_ID, tier: 2, radius: 46, sprite: localShinySprite(135), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-3', name: 'Flareon', familyId: EEVEE_FAMILY_ID, tier: 3, radius: 46, sprite: localShinySprite(136), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-4', name: 'Espeon', familyId: EEVEE_FAMILY_ID, tier: 4, radius: 46, sprite: localShinySprite(196), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-5', name: 'Umbreon', familyId: EEVEE_FAMILY_ID, tier: 5, radius: 46, sprite: localShinySprite(197), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-6', name: 'Leafeon', familyId: EEVEE_FAMILY_ID, tier: 6, radius: 46, sprite: localShinySprite(470), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-7', name: 'Glaceon', familyId: EEVEE_FAMILY_ID, tier: 7, radius: 46, sprite: localShinySprite(471), spriteSize: 475, scoreValue: 20 },
  { id: 'eevee-8', name: 'Sylveon', familyId: EEVEE_FAMILY_ID, tier: 8, radius: 46, sprite: localShinySprite(700), spriteSize: 475, scoreValue: 20 },
]

const EEVEE_PSEUDO_FAMILY: Family = {
  id: EEVEE_FAMILY_ID,
  name: 'Eevee',
  color: '#c9a87c',
  tiles: EEVEELUTIONS,
}

export function randomEeveelutionTier(): number {
  return Math.floor(Math.random() * EEVEELUTIONS.length)
}

// Espeon, Umbreon, and Sylveon needed a special condition to evolve in the
// real games (friendship + time of day; a fairy-bond mechanic) — so they're
// worth double on trade-in here too, making which form you catch matter.
const EEVEE_RARE_TIERS = new Set([4, 5, 8])

export function eeveeTradeValue(tier: number): number {
  return EEVEE_RARE_TIERS.has(tier) ? 2 : 1
}

// Mew: the same kind of side-collectible as Eevee (outside FAMILIES/the
// level rotation, never merges), but a single mythical with no evolution
// forms — so it's just one tile rather than a tier-indexed array. Catching
// it isn't banked for later; it triggers an immediate board-clearing blast
// instead (see PokemonMergeGame.catchMew).
export const MEW_FAMILY_ID = 'mew'

export const MEW_TILE: Tile = {
  id: 'mew-0',
  name: 'Mew',
  familyId: MEW_FAMILY_ID,
  tier: 0,
  radius: 46,
  sprite: localShinySprite(151),
  spriteSize: 475,
  scoreValue: 20,
}

const MEW_PSEUDO_FAMILY: Family = {
  id: MEW_FAMILY_ID,
  name: 'Mew',
  color: '#f9a8d4',
  tiles: [MEW_TILE],
}

// The first 5 levels stay in a fixed, predictable order (Electric, Fire,
// Water, Grass, Bug) so the early game teaches the mechanics consistently.
// Everything after that is shuffled once per game session — so which type
// comes next stops being memorizable and each run's discoveries feel fresh.
const FIXED_LEVEL_COUNT = 5

function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildLevelOrder(): Family[] {
  return [...FAMILIES.slice(0, FIXED_LEVEL_COUNT), ...shuffled(FAMILIES.slice(FIXED_LEVEL_COUNT))]
}

let levelOrder: Family[] = buildLevelOrder()

// Call on a full restart (not a level retry) so a fresh run gets a fresh
// shuffle rather than repeating the exact same order every time.
export function reshuffleLevelOrder(): void {
  levelOrder = buildLevelOrder()
}

export function getLevelOrder(): Family[] {
  return levelOrder
}

// Restores a previously-saved level order (by family id) exactly, so a
// resumed game shows the same goal at the same level it did before —
// rather than silently re-shuffling and drifting out of sync with the
// saved level index. Returns false (and leaves the order untouched) if the
// ids don't cleanly map onto the current roster, e.g. an old save from
// before a roster change.
export function setLevelOrder(ids: string[]): boolean {
  const byId = new Map(FAMILIES.map((f) => [f.id, f]))
  const restored = ids.map((id) => byId.get(id)).filter((f): f is Family => !!f)
  if (restored.length !== FAMILIES.length) return false
  levelOrder = restored
  return true
}

// Levels loop through the (partly shuffled) roster forever — level N's
// family is getLevelOrder()[N % FAMILIES.length], so the game never runs
// out of content.
export function getLevelFamily(levelIndex: number): Family {
  return levelOrder[levelIndex % FAMILIES.length]
}

export function getTile(familyId: string, tier: number): Tile {
  if (familyId === EEVEE_FAMILY_ID) return EEVEELUTIONS[tier]
  if (familyId === MEW_FAMILY_ID) return MEW_TILE
  const family = FAMILIES.find((f) => f.id === familyId)!
  return family.tiles.find((t) => t.tier === tier)!
}

export function getFamily(familyId: string): Family {
  if (familyId === EEVEE_FAMILY_ID) return EEVEE_PSEUDO_FAMILY
  if (familyId === MEW_FAMILY_ID) return MEW_PSEUDO_FAMILY
  return FAMILIES.find((f) => f.id === familyId)!
}

// Every family id is either the bare elemental type ("electric") or that
// type plus a trailing generation-variant number ("electric2", "electric3",
// ...) — a convention kept consistently across every expansion so far. This
// strips the digits to recover the shared type, letting different families
// of the same type (e.g. Raichu vs Luxray) be recognized as related even
// though they're separate evolution chains.
export function typeOf(familyId: string): string {
  return familyId.replace(/\d+$/, '')
}
