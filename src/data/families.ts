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
