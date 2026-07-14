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
}

export type Family = {
  id: string
  name: string
  color: string
  tiles: Tile[]
}

const TIER_RADII = [26, 46, 90, 116]
const TIER_SCORE = [1, 4, 14, 40]

// Tier 2 (the final real evolution, e.g. Raichu) is this level's goal.
export const GOAL_TIER = 2
export const MAX_TIER = 3

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
]

export const ALL_DEX_IDS = Array.from(new Set(collectedDexIds))

// Levels loop through the roster forever — level N's family is
// FAMILIES[N % FAMILIES.length], so the game never runs out of content.
export function getLevelFamily(levelIndex: number): Family {
  return FAMILIES[levelIndex % FAMILIES.length]
}

export function getTile(familyId: string, tier: number): Tile {
  const family = FAMILIES.find((f) => f.id === familyId)!
  return family.tiles.find((t) => t.tier === tier)!
}

export function getFamily(familyId: string): Family {
  return FAMILIES.find((f) => f.id === familyId)!
}
