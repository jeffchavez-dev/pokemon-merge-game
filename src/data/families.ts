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

function buildFamily(
  id: string,
  name: string,
  color: string,
  dexIds: [number, number, number],
  stageNames: [string, string, string],
  capstoneName: string,
  glyph: string,
): Family {
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
]

export const ALL_DEX_IDS = [172, 25, 26, 4, 5, 6, 7, 8, 9, 1, 2, 3, 10, 11, 12]

export function getTile(familyId: string, tier: number): Tile {
  const family = FAMILIES.find((f) => f.id === familyId)!
  return family.tiles.find((t) => t.tier === tier)!
}

export function getFamily(familyId: string): Family {
  return FAMILIES.find((f) => f.id === familyId)!
}
