// Every type is one continuous sequence of real evolution lines — merging
// two same-type, same-tier pieces (regardless of which line they came from)
// advances whichever line is currently active for that type. Reaching a
// line's own final real stage (with a second copy of it) doesn't invent a
// fictional "capstone" species — it hands off directly into the next line's
// first stage, so the whole type keeps going instead of dead-ending.
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

// One species' real evolution chain (1-3 stages) — the base unit inside a
// type's sequence. "family" is a legacy name for what's really "a line."
export type Family = {
  id: string
  name: string
  color: string
  tiles: Tile[]
}

const TIER_RADII = [26, 46, 90]
const TIER_SCORE = [1, 4, 14]

// A line's own final tier — the last real stage, whatever the line's length.
export function finalTier(family: Family): number {
  return family.tiles.length - 1
}

function localSprite(dexId: number): string {
  return `/pokemon/${dexId}.png`
}

function localShinySprite(dexId: number): string {
  return `/pokemon/shiny/${dexId}.png`
}

const collectedDexIds: number[] = []

// One species line, 1-3 real stages — no invented capstone, no padding
// tiles. dexIds/stageNames must be the same length (1, 2, or 3).
function buildLine(id: string, name: string, color: string, dexIds: number[], stageNames: string[]): Family {
  collectedDexIds.push(...dexIds)
  const tiles: Tile[] = stageNames.map((stageName, tier) => ({
    id: `${id}-${tier}`,
    name: stageName,
    familyId: id,
    tier,
    radius: TIER_RADII[tier],
    sprite: localSprite(dexIds[tier]),
    spriteSize: 475,
    scoreValue: TIER_SCORE[tier],
  }))
  return { id, name, color, tiles }
}

// The 18 canonical types, in the same order the roster was first built —
// used both for the fixed opening levels and as the type-rotation base.
export const TYPE_IDS = [
  'electric', 'fire', 'water', 'grass', 'bug', 'normal', 'fighting', 'flying',
  'poison', 'ground', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
  'ice', 'psychic',
]

// Level order: FAMILIES[0] is the first Electric line, etc. — grouped by
// type via typeLines() below, in this same array order. Dedenne (no real
// evolution) leads off Electric, so completing it hands straight into
// Pichu/Pikachu/Raichu.
export const FAMILIES: Family[] = [
  buildLine('electric0', 'Electric (Dedenne)', '#a8729e', [702], ['Dedenne']),
  buildLine('electric', 'Electric', '#facc15', [172, 25, 26], ['Pichu', 'Pikachu', 'Raichu']),
  buildLine('electric3', 'Electric (Mareep)', '#fde047', [179, 180, 181], ['Mareep', 'Flaaffy', 'Ampharos']),
  buildLine('electric4', 'Electric (Shinx)', '#1e293b', [403, 404, 405], ['Shinx', 'Luxio', 'Luxray']),
  buildLine('electric5', 'Electric (Tynamo)', '#fef08a', [602, 603, 604], ['Tynamo', 'Eelektrik', 'Eelektross']),
  buildLine('electric6', 'Electric (Elekid)', '#fde68a', [239, 125, 466], ['Elekid', 'Electabuzz', 'Electivire']),
  buildLine('electric8', 'Electric (Voltorb)', '#e3e744', [100, 101], ['Voltorb', 'Electrode']),
  buildLine('electric9', 'Electric (Electrike)', '#d2c22b', [309, 310], ['Electrike', 'Manectric']),
  buildLine('electric10', 'Electric (Blitzle)', '#d89d55', [522, 523], ['Blitzle', 'Zebstrika']),
  buildLine('electric12', 'Electric (Yamper)', '#cbb231', [835, 836], ['Yamper', 'Boltund']),
  buildLine('electric14', 'Electric (Tadbulb)', '#cb8435', [938, 939], ['Tadbulb', 'Bellibolt']),
  buildLine('electric11', 'Electric (Helioptile)', '#e3ae3f', [694, 695], ['Helioptile', 'Heliolisk']),
  buildLine('electric15', 'Electric (Wattrel)', '#dfa027', [940, 941], ['Wattrel', 'Kilowattrel']),
  buildLine('electric13', 'Electric (Toxel)', '#dcd53e', [848, 849], ['Toxel', 'Toxtricity']),
  buildLine('electric7', 'Electric (Pawmi)', '#f59e0b', [921, 922, 923], ['Pawmi', 'Pawmo', 'Pawmot']),
  buildLine('electric2', 'Electric (Magnemite)', '#eab308', [81, 82, 462], ['Magnemite', 'Magneton', 'Magnezone']),
  buildLine('fire4', 'Fire (Cyndaquil)', '#ea580c', [155, 156, 157], ['Cyndaquil', 'Quilava', 'Typhlosion']),
  buildLine('fire8', 'Fire (Scorbunny)', '#f87171', [813, 814, 815], ['Scorbunny', 'Raboot', 'Cinderace']),
  buildLine('fire10', 'Fire (Magby)', '#ef4444', [240, 126, 467], ['Magby', 'Magmar', 'Magmortar']),
  buildLine('fire11', 'Fire (Vulpix)', '#fdba74', [37, 38], ['Vulpix', 'Ninetales']),
  buildLine('fire12', 'Fire (Growlithe)', '#e1624b', [58, 59], ['Growlithe', 'Arcanine']),
  buildLine('fire13', 'Fire (Ponyta)', '#be7b25', [77, 78], ['Ponyta', 'Rapidash']),
  buildLine('fire16', 'Fire (Pansear)', '#b24831', [513, 514], ['Pansear', 'Simisear']),
  buildLine('fire17', 'Fire (Darumaka)', '#e04f47', [554, 555], ['Darumaka', 'Darmanitan']),
  buildLine('fire18', 'Fire (Litleo)', '#bd5921', [667, 668], ['Litleo', 'Pyroar']),
  buildLine('fire', 'Fire', '#f97316', [4, 5, 6], ['Charmander', 'Charmeleon', 'Charizard']),
  buildLine('fire2', 'Fire (Kalos)', '#f43f5e', [653, 654, 655], ['Fennekin', 'Braixen', 'Delphox']),
  buildLine('fire20', 'Fire (Charcadet)', '#b76731', [935, 936], ['Charcadet', 'Armarouge']),
  buildLine('fire19', 'Fire (Sizzlipede)', '#d35732', [850, 851], ['Sizzlipede', 'Centiskorch']),
  buildLine('fire5', 'Fire (Torchic)', '#fb923c', [255, 256, 257], ['Torchic', 'Combusken', 'Blaziken']),
  buildLine('fire6', 'Fire (Chimchar)', '#c2410c', [390, 391, 392], ['Chimchar', 'Monferno', 'Infernape']),
  buildLine('fire7', 'Fire (Tepig)', '#e11d48', [498, 499, 500], ['Tepig', 'Pignite', 'Emboar']),
  buildLine('fire3', 'Fire (Alola)', '#7f1d1d', [725, 726, 727], ['Litten', 'Torracat', 'Incineroar']),
  buildLine('fire14', 'Fire (Slugma)', '#af662e', [218, 219], ['Slugma', 'Magcargo']),
  buildLine('fire15', 'Fire (Numel)', '#e15c22', [322, 323], ['Numel', 'Camerupt']),
  buildLine('fire9', 'Fire (Fuecoco)', '#9a3412', [909, 910, 911], ['Fuecoco', 'Crocalor', 'Skeledirge']),
  buildLine('fire21', 'Fire (Charcadet)', '#c17621', [935, 937], ['Charcadet', 'Ceruledge']),
  buildLine('water', 'Water', '#38bdf8', [7, 8, 9], ['Squirtle', 'Wartortle', 'Blastoise']),
  buildLine('water6', 'Water (Totodile)', '#2563eb', [158, 159, 160], ['Totodile', 'Croconaw', 'Feraligatr']),
  buildLine('water11', 'Water (Oshawott)', '#0891b2', [501, 502, 503], ['Oshawott', 'Dewott', 'Samurott']),
  buildLine('water13', 'Water (Sobble)', '#60a5fa', [816, 817, 818], ['Sobble', 'Drizzile', 'Inteleon']),
  buildLine('water16', 'Water (Psyduck)', '#3d8dcd', [54, 55], ['Psyduck', 'Golduck']),
  buildLine('water20', 'Water (Krabby)', '#5ac2dd', [98, 99], ['Krabby', 'Kingler']),
  buildLine('water21', 'Water (Goldeen)', '#366ec7', [118, 119], ['Goldeen', 'Seaking']),
  buildLine('water28', 'Water (Corsola)', '#54b0d0', [222, 864], ['Corsola', 'Cursola']),
  buildLine('water29', 'Water (Remoraid)', '#215bce', [223, 224], ['Remoraid', 'Octillery']),
  buildLine('water32', 'Water (Wailmer)', '#5483d5', [320, 321], ['Wailmer', 'Wailord']),
  buildLine('water35', 'Water (Feebas)', '#4795e7', [349, 350], ['Feebas', 'Milotic']),
  buildLine('water36', 'Water (Clamperl)', '#356ad3', [366, 367], ['Clamperl', 'Huntail']),
  buildLine('water37', 'Water (Clamperl)', '#45b8e0', [366, 368], ['Clamperl', 'Gorebyss']),
  buildLine('water38', 'Water (Buizel)', '#49b3e3', [418, 419], ['Buizel', 'Floatzel']),
  buildLine('water40', 'Water (Finneon)', '#246fbe', [456, 457], ['Finneon', 'Lumineon']),
  buildLine('water42', 'Water (Phione)', '#2892b6', [489, 490], ['Phione', 'Manaphy']),
  buildLine('water43', 'Water (Panpour)', '#1f5ed9', [515, 516], ['Panpour', 'Simipour']),
  buildLine('water48', 'Water (Clauncher)', '#4b9de2', [692, 693], ['Clauncher', 'Clawitzer']),
  buildLine('water51', 'Water (Arrokuda)', '#4ec0e6', [846, 847], ['Arrokuda', 'Barraskewda']),
  buildLine('water52', 'Water (Wiglett)', '#228bcb', [960, 961], ['Wiglett', 'Wugtrio']),
  buildLine('water53', 'Water (Finizen)', '#1a70c8', [963, 964], ['Finizen', 'Palafin']),
  buildLine('water9', 'Water (Lotad)', '#22d3ee', [270, 271, 272], ['Lotad', 'Lombre', 'Ludicolo']),
  buildLine('water23', 'Water (Magikarp)', '#2e91c3', [129, 130], ['Magikarp', 'Gyarados']),
  buildLine('water30', 'Water (Wingull)', '#3b9bd0', [278, 279], ['Wingull', 'Pelipper']),
  buildLine('water41', 'Water (Mantyke)', '#3386b9', [458, 226], ['Mantyke', 'Mantine']),
  buildLine('water46', 'Water (Ducklett)', '#36bbe3', [580, 581], ['Ducklett', 'Swanna']),
  buildLine('water7', 'Water (Slowpoke)', '#fda4af', [79, 80, 199], ['Slowpoke', 'Slowbro', 'Slowking']),
  buildLine('water22', 'Water (Staryu)', '#519cdc', [120, 121], ['Staryu', 'Starmie']),
  buildLine('water49', 'Water (Dewpider)', '#2d99ce', [751, 752], ['Dewpider', 'Araquanid']),
  buildLine('water17', 'Water (Tentacool)', '#2964b5', [72, 73], ['Tentacool', 'Tentacruel']),
  buildLine('water26', 'Water (Wooper)', '#409ee7', [194, 980], ['Wooper', 'Clodsire']),
  buildLine('water4', 'Water (Poliwag)', '#0ea5e9', [60, 61, 62], ['Poliwag', 'Poliwhirl', 'Poliwrath']),
  buildLine('water14', 'Water (Quaxly)', '#0c4a6e', [912, 913, 914], ['Quaxly', 'Quaxwell', 'Quaquaval']),
  buildLine('water2', 'Water (Kalos)', '#1e3a8a', [656, 657, 658], ['Froakie', 'Frogadier', 'Greninja']),
  buildLine('water27', 'Water (Qwilfish)', '#44a3ce', [211, 904], ['Qwilfish', 'Overqwil']),
  buildLine('water31', 'Water (Carvanha)', '#2e8ce4', [318, 319], ['Carvanha', 'Sharpedo']),
  buildLine('water34', 'Water (Corphish)', '#5cabdc', [341, 342], ['Corphish', 'Crawdaunt']),
  buildLine('water10', 'Water (Piplup)', '#1d4ed8', [393, 394, 395], ['Piplup', 'Prinplup', 'Empoleon']),
  buildLine('water45', 'Water (Tirtouga)', '#2ba1e2', [564, 565], ['Tirtouga', 'Carracosta']),
  buildLine('water50', 'Water (Chewtle)', '#3b70d7', [833, 834], ['Chewtle', 'Drednaw']),
  buildLine('water8', 'Water (Mudkip)', '#0369a1', [258, 259, 260], ['Mudkip', 'Marshtomp', 'Swampert']),
  buildLine('water12', 'Water (Tympole)', '#0e7490', [535, 536, 537], ['Tympole', 'Palpitoad', 'Seismitoad']),
  buildLine('water25', 'Water (Wooper)', '#2f6bc2', [194, 195], ['Wooper', 'Quagsire']),
  buildLine('water33', 'Water (Barboach)', '#45b1d2', [339, 340], ['Barboach', 'Whiscash']),
  buildLine('water39', 'Water (Shellos)', '#2277b9', [422, 423], ['Shellos', 'Gastrodon']),
  buildLine('water5', 'Water (Horsea)', '#0284c7', [116, 117, 230], ['Horsea', 'Seadra', 'Kingdra']),
  buildLine('water44', 'Water (Basculin)', '#3084d3', [550, 902], ['Basculin', 'Basculegion']),
  buildLine('water47', 'Water (Frillish)', '#5085e2', [592, 593], ['Frillish', 'Jellicent']),
  buildLine('water24', 'Water (Chinchou)', '#22b3d4', [170, 171], ['Chinchou', 'Lanturn']),
  buildLine('water3', 'Water (Alola)', '#818cf8', [728, 729, 730], ['Popplio', 'Brionne', 'Primarina']),
  buildLine('water15', 'Water (Azurill)', '#7dd3fc', [298, 183, 184], ['Azurill', 'Marill', 'Azumarill']),
  buildLine('water18', 'Water (Seel)', '#2597b7', [86, 87], ['Seel', 'Dewgong']),
  buildLine('water19', 'Water (Shellder)', '#2085bb', [90, 91], ['Shellder', 'Cloyster']),
  buildLine('grass4', 'Grass (Alola II)', '#db2777', [761, 762, 763], ['Bounsweet', 'Steenee', 'Tsareena']),
  buildLine('grass7', 'Grass (Chikorita)', '#16a34a', [152, 153, 154], ['Chikorita', 'Bayleef', 'Meganium']),
  buildLine('grass9', 'Grass (Treecko)', '#15803d', [252, 253, 254], ['Treecko', 'Grovyle', 'Sceptile']),
  buildLine('grass12', 'Grass (Snivy)', '#059669', [495, 496, 497], ['Snivy', 'Servine', 'Serperior']),
  buildLine('grass13', 'Grass (Grookey)', '#65a30d', [810, 811, 812], ['Grookey', 'Thwackey', 'Rillaboom']),
  buildLine('grass19', 'Grass (Tangela)', '#64d83f', [114, 465], ['Tangela', 'Tangrowth']),
  buildLine('grass20', 'Grass (Sunkern)', '#78cc22', [191, 192], ['Sunkern', 'Sunflora']),
  buildLine('grass23', 'Grass (Cherubi)', '#3fcc2f', [420, 421], ['Cherubi', 'Cherrim']),
  buildLine('grass25', 'Grass (Pansage)', '#65c325', [511, 512], ['Pansage', 'Simisage']),
  buildLine('grass27', 'Grass (Petilil)', '#66de56', [548, 549], ['Petilil', 'Lilligant']),
  buildLine('grass30', 'Grass (Skiddo)', '#4be336', [672, 673], ['Skiddo', 'Gogoat']),
  buildLine('grass31', 'Grass (Fomantis)', '#59cb33', [753, 754], ['Fomantis', 'Lurantis']),
  buildLine('grass33', 'Grass (Gossifleur)', '#a1db5f', [829, 830], ['Gossifleur', 'Eldegoss']),
  buildLine('grass15', 'Grass (Smoliv)', '#4d7c0f', [928, 929, 930], ['Smoliv', 'Dolliv', 'Arboliva']),
  buildLine('grass8', 'Grass (Hoppip)', '#86efac', [187, 188, 189], ['Hoppip', 'Skiploom', 'Jumpluff']),
  buildLine('grass18', 'Grass (Exeggcute)', '#53c943', [102, 103], ['Exeggcute', 'Exeggutor']),
  buildLine('grass35', 'Grass (Capsakid)', '#60c941', [951, 952], ['Capsakid', 'Scovillain']),
  buildLine('grass', 'Grass', '#4ade80', [1, 2, 3], ['Bulbasaur', 'Ivysaur', 'Venusaur']),
  buildLine('grass5', 'Grass (Oddish)', '#84cc16', [43, 44, 45], ['Oddish', 'Gloom', 'Vileplume']),
  buildLine('grass6', 'Grass (Bellsprout)', '#4d7c0f', [69, 70, 71], ['Bellsprout', 'Weepinbell', 'Victreebel']),
  buildLine('grass16', 'Grass (Budew)', '#65a30d', [406, 315, 407], ['Budew', 'Roselia', 'Roserade']),
  buildLine('grass28', 'Grass (Foongus)', '#9fdd51', [590, 591], ['Foongus', 'Amoonguss']),
  buildLine('grass2', 'Grass (Kalos)', '#65a30d', [650, 651, 652], ['Chespin', 'Quilladin', 'Chesnaught']),
  buildLine('grass21', 'Grass (Shroomish)', '#6dd62e', [285, 286], ['Shroomish', 'Breloom']),
  buildLine('grass10', 'Grass (Seedot)', '#365314', [273, 274, 275], ['Seedot', 'Nuzleaf', 'Shiftry']),
  buildLine('grass14', 'Grass (Sprigatito)', '#22c55e', [906, 907, 908], ['Sprigatito', 'Floragato', 'Meowscarada']),
  buildLine('grass22', 'Grass (Cacnea)', '#40c519', [331, 332], ['Cacnea', 'Cacturne']),
  buildLine('grass29', 'Grass (Ferroseed)', '#66b928', [597, 598], ['Ferroseed', 'Ferrothorn']),
  buildLine('grass11', 'Grass (Turtwig)', '#3f6212', [387, 388, 389], ['Turtwig', 'Grotle', 'Torterra']),
  buildLine('grass17', 'Grass (Applin)', '#7f1d1d', [840, 1011, 1019], ['Applin', 'Dipplin', 'Hydrapple']),
  buildLine('grass3', 'Grass (Alola)', '#166534', [722, 723, 724], ['Rowlet', 'Dartrix', 'Decidueye']),
  buildLine('grass34', 'Grass (Bramblin)', '#36d625', [946, 947], ['Bramblin', 'Brambleghast']),
  buildLine('grass36', 'Grass (Poltchageist)', '#79cc47', [1012, 1013], ['Poltchageist', 'Sinistcha']),
  buildLine('grass26', 'Grass (Cottonee)', '#51de21', [546, 547], ['Cottonee', 'Whimsicott']),
  buildLine('grass32', 'Grass (Morelull)', '#8be74e', [755, 756], ['Morelull', 'Shiinotic']),
  buildLine('grass24', 'Grass (Snover)', '#98dd4b', [459, 460], ['Snover', 'Abomasnow']),
  buildLine('bug19', 'Bug (Kricketot)', '#abb72e', [401, 402], ['Kricketot', 'Kricketune']),
  buildLine('bug26', 'Bug (Shelmet)', '#a5b530', [616, 617], ['Shelmet', 'Accelgor']),
  buildLine('bug30', 'Bug (Tarountula)', '#9bd832', [917, 918], ['Tarountula', 'Spidops']),
  buildLine('bug29', 'Bug (Wimpod)', '#dbe254', [767, 768], ['Wimpod', 'Golisopod']),
  buildLine('bug5', 'Bug (Sewaddle)', '#65a30d', [540, 541, 542], ['Sewaddle', 'Swadloon', 'Leavanny']),
  buildLine('bug8', 'Bug (Paras)', '#97d421', [46, 47], ['Paras', 'Parasect']),
  buildLine('bug20', 'Bug (Burmy)', '#84c227', [412, 413], ['Burmy', 'Wormadam']),
  buildLine('bug', 'Bug', '#a3e635', [10, 11, 12], ['Caterpie', 'Metapod', 'Butterfree']),
  buildLine('bug2', 'Bug (Kalos)', '#c084fc', [664, 665, 666], ['Scatterbug', 'Spewpa', 'Vivillon']),
  buildLine('bug12', 'Bug (Ledyba)', '#84e634', [165, 166], ['Ledyba', 'Ledian']),
  buildLine('bug14', 'Bug (Yanma)', '#afd633', [193, 469], ['Yanma', 'Yanmega']),
  buildLine('bug16', 'Bug (Surskit)', '#84df30', [283, 284], ['Surskit', 'Masquerain']),
  buildLine('bug17', 'Bug (Nincada)', '#ace454', [290, 291], ['Nincada', 'Ninjask']),
  buildLine('bug21', 'Bug (Burmy)', '#7ed234', [412, 414], ['Burmy', 'Mothim']),
  buildLine('bug22', 'Bug (Combee)', '#abbf37', [415, 416], ['Combee', 'Vespiquen']),
  buildLine('bug7', 'Bug (Blipbug)', '#bef264', [824, 825, 826], ['Blipbug', 'Dottler', 'Orbeetle']),
  buildLine('bug32', 'Bug (Rellor)', '#d1dc56', [953, 954], ['Rellor', 'Rabsca']),
  buildLine('bug4', 'Bug (Kanto II)', '#7c2d92', [13, 14, 15], ['Weedle', 'Kakuna', 'Beedrill']),
  buildLine('bug6', 'Bug (Venipede)', '#7e22ce', [543, 544, 545], ['Venipede', 'Whirlipede', 'Scolipede']),
  buildLine('bug9', 'Bug (Venonat)', '#7dc32c', [48, 49], ['Venonat', 'Venomoth']),
  buildLine('bug13', 'Bug (Spinarak)', '#8fe11e', [167, 168], ['Spinarak', 'Ariados']),
  buildLine('bug31', 'Bug (Nymble)', '#abd71d', [919, 920], ['Nymble', 'Lokix']),
  buildLine('bug10', 'Bug (Scyther)', '#b7da58', [123, 212], ['Scyther', 'Scizor']),
  buildLine('bug15', 'Bug (Pineco)', '#d0e52f', [204, 205], ['Pineco', 'Forretress']),
  buildLine('bug24', 'Bug (Karrablast)', '#a4d74f', [588, 589], ['Karrablast', 'Escavalier']),
  buildLine('bug11', 'Bug (Scyther)', '#b0c81a', [123, 900], ['Scyther', 'Kleavor']),
  buildLine('bug23', 'Bug (Dwebble)', '#b4d853', [557, 558], ['Dwebble', 'Crustle']),
  buildLine('bug18', 'Bug (Nincada)', '#bdde44', [290, 292], ['Nincada', 'Shedinja']),
  buildLine('bug3', 'Bug (Alola)', '#0d9488', [736, 737, 738], ['Grubbin', 'Charjabug', 'Vikavolt']),
  buildLine('bug25', 'Bug (Joltik)', '#7fd729', [595, 596], ['Joltik', 'Galvantula']),
  buildLine('bug28', 'Bug (Cutiefly)', '#9ce04b', [742, 743], ['Cutiefly', 'Ribombee']),
  buildLine('bug27', 'Bug (Larvesta)', '#a2cc23', [636, 637], ['Larvesta', 'Volcarona']),
  buildLine('normal', 'Normal', '#a8a29e', [506, 507, 508], ['Lillipup', 'Herdier', 'Stoutland']),
  buildLine('normal3', 'Normal (Slakoth)', '#d6d3d1', [287, 288, 289], ['Slakoth', 'Vigoroth', 'Slaking']),
  buildLine('normal4', 'Normal (Whismur)', '#fda4af', [293, 294, 295], ['Whismur', 'Loudred', 'Exploud']),
  buildLine('normal6', 'Normal (Happiny)', '#fbcfe8', [440, 113, 242], ['Happiny', 'Chansey', 'Blissey']),
  buildLine('normal8', 'Normal (Rattata)', '#b8936d', [19, 20], ['Rattata', 'Raticate']),
  buildLine('normal10', 'Normal (Meowth)', '#c6ad91', [52, 53], ['Meowth', 'Persian']),
  buildLine('normal11', 'Normal (Meowth)', '#b79f74', [52, 863], ['Meowth', 'Perrserker']),
  buildLine('normal12', "Normal (Farfetch'd)", '#c1b27b', [83, 865], ['Farfetch\'d', 'Sirfetch\'d']),
  buildLine('normal14', 'Normal (Lickitung)', '#bb9b74', [108, 463], ['Lickitung', 'Lickilicky']),
  buildLine('normal15', 'Normal (Sentret)', '#beaa81', [161, 162], ['Sentret', 'Furret']),
  buildLine('normal17', 'Normal (Aipom)', '#ae8e78', [190, 424], ['Aipom', 'Ambipom']),
  buildLine('normal19', 'Normal (Dunsparce)', '#b5986d', [206, 982], ['Dunsparce', 'Dudunsparce']),
  buildLine('normal22', 'Normal (Skitty)', '#c6ad98', [300, 301], ['Skitty', 'Delcatty']),
  buildLine('normal25', 'Normal (Buneary)', '#c9b18d', [427, 428], ['Buneary', 'Lopunny']),
  buildLine('normal26', 'Normal (Glameow)', '#bda58e', [431, 432], ['Glameow', 'Purugly']),
  buildLine('normal27', 'Normal (Munchlax)', '#b69684', [446, 143], ['Munchlax', 'Snorlax']),
  buildLine('normal28', 'Normal (Patrat)', '#cbbd90', [504, 505], ['Patrat', 'Watchog']),
  buildLine('normal29', 'Normal (Minccino)', '#c8b79b', [572, 573], ['Minccino', 'Cinccino']),
  buildLine('normal33', 'Normal (Yungoos)', '#bfa975', [734, 735], ['Yungoos', 'Gumshoos']),
  buildLine('normal35', 'Normal (Type: Null)', '#c6a587', [772, 773], ['Type: Null', 'Silvally']),
  buildLine('normal36', 'Normal (Skwovet)', '#c2b095', [819, 820], ['Skwovet', 'Greedent']),
  buildLine('normal37', 'Normal (Wooloo)', '#bdab7b', [831, 832], ['Wooloo', 'Dubwool']),
  buildLine('normal38', 'Normal (Lechonk)', '#be9378', [915, 916], ['Lechonk', 'Oinkologne']),
  buildLine('normal39', 'Normal (Tandemaus)', '#ba9268', [924, 925], ['Tandemaus', 'Maushold']),
  buildLine('normal24', 'Normal (Bidoof)', '#b4a67e', [399, 400], ['Bidoof', 'Bibarel']),
  buildLine('normal30', 'Normal (Deerling)', '#caa998', [585, 586], ['Deerling', 'Sawsbuck']),
  buildLine('normal9', 'Normal (Spearow)', '#c5a897', [21, 22], ['Spearow', 'Fearow']),
  buildLine('normal13', 'Normal (Doduo)', '#c9aa97', [84, 85], ['Doduo', 'Dodrio']),
  buildLine('normal16', 'Normal (Hoothoot)', '#bb8169', [163, 164], ['Hoothoot', 'Noctowl']),
  buildLine('normal21', 'Normal (Taillow)', '#b7996f', [276, 277], ['Taillow', 'Swellow']),
  buildLine('normal31', 'Normal (Rufflet)', '#cdac91', [627, 628], ['Rufflet', 'Braviary']),
  buildLine('normal18', 'Normal (Girafarig)', '#bb9c82', [203, 981], ['Girafarig', 'Farigiraf']),
  buildLine('normal20', 'Normal (Stantler)', '#c0ae81', [234, 899], ['Stantler', 'Wyrdeer']),
  buildLine('normal34', 'Normal (Stufful)', '#b48e79', [759, 760], ['Stufful', 'Bewear']),
  buildLine('normal5', 'Normal (Zigzagoon)', '#a16207', [263, 264, 862], ['Zigzagoon', 'Linoone', 'Obstagoon']),
  buildLine('normal2', 'Normal (Teddiursa)', '#92400e', [216, 217, 901], ['Teddiursa', 'Ursaring', 'Ursaluna']),
  buildLine('normal32', 'Normal (Bunnelby)', '#c4ac8a', [659, 660], ['Bunnelby', 'Diggersby']),
  buildLine('normal23', 'Normal (Swablu)', '#cea794', [333, 334], ['Swablu', 'Altaria']),
  buildLine('normal7', 'Normal (Igglybuff)', '#fecdd3', [174, 39, 40], ['Igglybuff', 'Jigglypuff', 'Wigglytuff']),
  buildLine('fighting', 'Fighting', '#b91c1c', [66, 67, 68], ['Machop', 'Machoke', 'Machamp']),
  buildLine('fighting2', 'Fighting (Timburr)', '#991b1b', [532, 533, 534], ['Timburr', 'Gurdurr', 'Conkeldurr']),
  buildLine('fighting4', 'Fighting (Tyrogue)', '#cc4c1f', [236, 106], ['Tyrogue', 'Hitmonlee']),
  buildLine('fighting5', 'Fighting (Tyrogue)', '#c31c34', [236, 107], ['Tyrogue', 'Hitmonchan']),
  buildLine('fighting6', 'Fighting (Tyrogue)', '#e04446', [236, 237], ['Tyrogue', 'Hitmontop']),
  buildLine('fighting7', 'Fighting (Makuhita)', '#df695a', [296, 297], ['Makuhita', 'Hariyama']),
  buildLine('fighting10', 'Fighting (Mienfoo)', '#e96a4d', [619, 620], ['Mienfoo', 'Mienshao']),
  buildLine('fighting13', 'Fighting (Clobbopus)', '#e47b4b', [852, 853], ['Clobbopus', 'Grapploct']),
  buildLine('fighting8', 'Fighting (Meditite)', '#cf3150', [307, 308], ['Meditite', 'Medicham']),
  buildLine('fighting11', 'Fighting (Pancham)', '#b52a21', [674, 675], ['Pancham', 'Pangoro']),
  buildLine('fighting14', 'Fighting (Kubfu)', '#e25e3b', [891, 892], ['Kubfu', 'Urshifu']),
  buildLine('fighting3', 'Fighting (Mankey)', '#7c2d12', [56, 57, 979], ['Mankey', 'Primeape', 'Annihilape']),
  buildLine('fighting12', 'Fighting (Crabrawler)', '#ca404c', [739, 740], ['Crabrawler', 'Crabominable']),
  buildLine('fighting9', 'Fighting (Riolu)', '#dd404b', [447, 448], ['Riolu', 'Lucario']),
  buildLine('flying', 'Flying', '#a5b4fc', [16, 17, 18], ['Pidgey', 'Pidgeotto', 'Pidgeot']),
  buildLine('flying3', 'Flying (Alola)', '#fbbf24', [731, 732, 733], ['Pikipek', 'Trumbeak', 'Toucannon']),
  buildLine('flying4', 'Flying (Starly)', '#cbd5e1', [396, 397, 398], ['Starly', 'Staravia', 'Staraptor']),
  buildLine('flying5', 'Flying (Pidove)', '#e2e8f0', [519, 520, 521], ['Pidove', 'Tranquill', 'Unfezant']),
  buildLine('flying2', 'Flying (Kalos)', '#dc2626', [661, 662, 663], ['Fletchling', 'Fletchinder', 'Talonflame']),
  buildLine('flying6', 'Flying (Rookidee)', '#334155', [821, 822, 823], ['Rookidee', 'Corvisquire', 'Corviknight']),
  buildLine('flying7', 'Flying (Noibat)', '#3f74d4', [714, 715], ['Noibat', 'Noivern']),
  buildLine('poison4', 'Poison (Ekans)', '#b154d3', [23, 24], ['Ekans', 'Arbok']),
  buildLine('poison5', 'Poison (Grimer)', '#bb26d4', [88, 89], ['Grimer', 'Muk']),
  buildLine('poison6', 'Poison (Koffing)', '#be2dbc', [109, 110], ['Koffing', 'Weezing']),
  buildLine('poison7', 'Poison (Gulpin)', '#9d38e0', [316, 317], ['Gulpin', 'Swalot']),
  buildLine('poison11', 'Poison (Trubbish)', '#8721c0', [568, 569], ['Trubbish', 'Garbodor']),
  buildLine('poison13', 'Poison (Mareanie)', '#ca34d7', [747, 748], ['Mareanie', 'Toxapex']),
  buildLine('poison16', 'Poison (Shroodle)', '#c840be', [944, 945], ['Shroodle', 'Grafaiai']),
  buildLine('poison', 'Poison', '#c026d3', [41, 42, 169], ['Zubat', 'Golbat', 'Crobat']),
  buildLine('poison14', 'Poison (Salandit)', '#9532af', [757, 758], ['Salandit', 'Salazzle']),
  buildLine('poison10', 'Poison (Croagunk)', '#912bb0', [453, 454], ['Croagunk', 'Toxicroak']),
  buildLine('poison8', 'Poison (Stunky)', '#a41bd1', [434, 435], ['Stunky', 'Skuntank']),
  buildLine('poison9', 'Poison (Skorupi)', '#c724de', [451, 452], ['Skorupi', 'Drapion']),
  buildLine('poison2', 'Poison (Nidoran-F)', '#a21caf', [29, 30, 31], ['Nidoran♀', 'Nidorina', 'Nidoqueen']),
  buildLine('poison3', 'Poison (Nidoran-M)', '#701a75', [32, 33, 34], ['Nidoran♂', 'Nidorino', 'Nidoking']),
  buildLine('poison12', 'Poison (Skrelp)', '#ca47c4', [690, 691], ['Skrelp', 'Dragalge']),
  buildLine('poison15', 'Poison (Poipole)', '#a133d8', [803, 804], ['Poipole', 'Naganadel']),
  buildLine('ground3', 'Ground (Sandshrew)', '#9e5b33', [27, 28], ['Sandshrew', 'Sandslash']),
  buildLine('ground4', 'Ground (Diglett)', '#bfa146', [50, 51], ['Diglett', 'Dugtrio']),
  buildLine('ground5', 'Ground (Cubone)', '#9e7634', [104, 105], ['Cubone', 'Marowak']),
  buildLine('ground7', 'Ground (Phanpy)', '#c8b849', [231, 232], ['Phanpy', 'Donphan']),
  buildLine('ground9', 'Ground (Hippopotas)', '#bf8a3a', [449, 450], ['Hippopotas', 'Hippowdon']),
  buildLine('ground12', 'Ground (Mudbray)', '#ba7138', [749, 750], ['Mudbray', 'Mudsdale']),
  buildLine('ground13', 'Ground (Silicobra)', '#c78c40', [843, 844], ['Silicobra', 'Sandaconda']),
  buildLine('ground14', 'Ground (Toedscool)', '#b18b40', [948, 949], ['Toedscool', 'Toedscruel']),
  buildLine('ground6', 'Ground (Gligar)', '#c27734', [207, 472], ['Gligar', 'Gliscor']),
  buildLine('ground8', 'Ground (Baltoy)', '#af8f39', [343, 344], ['Baltoy', 'Claydol']),
  buildLine('ground10', 'Ground (Drilbur)', '#c39e4e', [529, 530], ['Drilbur', 'Excadrill']),
  buildLine('ground2', 'Ground (Rhyhorn)', '#b45309', [111, 112, 464], ['Rhyhorn', 'Rhydon', 'Rhyperior']),
  buildLine('ground', 'Ground', '#ca8a04', [328, 329, 330], ['Trapinch', 'Vibrava', 'Flygon']),
  buildLine('ground11', 'Ground (Golett)', '#b9a654', [622, 623], ['Golett', 'Golurk']),
  buildLine('rock3', 'Rock (Roggenrola)', '#525252', [524, 525, 526], ['Roggenrola', 'Boldore', 'Gigalith']),
  buildLine('rock5', 'Rock (Nacli)', '#78716c', [932, 933, 934], ['Nacli', 'Naclstack', 'Garganacl']),
  buildLine('rock12', 'Rock (Cranidos)', '#836644', [408, 409], ['Cranidos', 'Rampardos']),
  buildLine('rock14', 'Rock (Bonsly)', '#805f53', [438, 185], ['Bonsly', 'Sudowoodo']),
  buildLine('rock19', 'Rock (Rockruff)', '#7f5c48', [744, 745], ['Rockruff', 'Lycanroc']),
  buildLine('rock7', 'Rock (Omanyte)', '#926954', [138, 139], ['Omanyte', 'Omastar']),
  buildLine('rock8', 'Rock (Kabuto)', '#805f49', [140, 141], ['Kabuto', 'Kabutops']),
  buildLine('rock16', 'Rock (Binacle)', '#6d553b', [688, 689], ['Binacle', 'Barbaracle']),
  buildLine('rock10', 'Rock (Lileep)', '#745548', [345, 346], ['Lileep', 'Cradily']),
  buildLine('rock15', 'Rock (Archen)', '#72523e', [566, 567], ['Archen', 'Archeops']),
  buildLine('rock11', 'Rock (Anorith)', '#755b48', [347, 348], ['Anorith', 'Armaldo']),
  buildLine('rock4', 'Rock (Rolycoly)', '#1c1917', [837, 838, 839], ['Rolycoly', 'Carkol', 'Coalossal']),
  buildLine('rock20', 'Rock (Glimmet)', '#945e4e', [969, 970], ['Glimmet', 'Glimmora']),
  buildLine('rock2', 'Rock (Larvitar)', '#44403c', [246, 247, 248], ['Larvitar', 'Pupitar', 'Tyranitar']),
  buildLine('rock6', 'Rock (Onix)', '#6a5643', [95, 208], ['Onix', 'Steelix']),
  buildLine('rock9', 'Rock (Nosepass)', '#8e6556', [299, 476], ['Nosepass', 'Probopass']),
  buildLine('rock13', 'Rock (Shieldon)', '#8b764b', [410, 411], ['Shieldon', 'Bastiodon']),
  buildLine('rock', 'Rock', '#78716c', [74, 75, 76], ['Geodude', 'Graveler', 'Golem']),
  buildLine('rock17', 'Rock (Tyrunt)', '#7f6a44', [696, 697], ['Tyrunt', 'Tyrantrum']),
  buildLine('rock18', 'Rock (Amaura)', '#6f4e44', [698, 699], ['Amaura', 'Aurorus']),
  buildLine('ghost2', 'Ghost (Duskull)', '#4c1d95', [355, 356, 477], ['Duskull', 'Dusclops', 'Dusknoir']),
  buildLine('ghost4', 'Ghost (Misdreavus)', '#4529b2', [200, 429], ['Misdreavus', 'Mismagius']),
  buildLine('ghost5', 'Ghost (Shuppet)', '#963ece', [353, 354], ['Shuppet', 'Banette']),
  buildLine('ghost7', 'Ghost (Yamask)', '#8149e8', [562, 563], ['Yamask', 'Cofagrigus']),
  buildLine('ghost12', 'Ghost (Sinistea)', '#b047e2', [854, 855], ['Sinistea', 'Polteageist']),
  buildLine('ghost13', 'Ghost (Greavard)', '#623cc7', [971, 972], ['Greavard', 'Houndstone']),
  buildLine('ghost9', 'Ghost (Phantump)', '#a447da', [708, 709], ['Phantump', 'Trevenant']),
  buildLine('ghost10', 'Ghost (Pumpkaboo)', '#6527ba', [710, 711], ['Pumpkaboo', 'Gourgeist']),
  buildLine('ghost6', 'Ghost (Drifloon)', '#712cbc', [425, 426], ['Drifloon', 'Drifblim']),
  buildLine('ghost3', 'Ghost (Litwick)', '#6d28d9', [607, 608, 609], ['Litwick', 'Lampent', 'Chandelure']),
  buildLine('ghost', 'Ghost', '#7c3aed', [92, 93, 94], ['Gastly', 'Haunter', 'Gengar']),
  buildLine('ghost8', 'Ghost (Yamask)', '#7457d5', [562, 867], ['Yamask', 'Runerigus']),
  buildLine('ghost11', 'Ghost (Sandygast)', '#732fab', [769, 770], ['Sandygast', 'Palossand']),
  buildLine('ghost14', 'Ghost (Gimmighoul)', '#742cce', [999, 1000], ['Gimmighoul', 'Gholdengo']),
  buildLine('dragon2', 'Dragon (Kalos)', '#c4b5fd', [704, 705, 706], ['Goomy', 'Sliggoo', 'Goodra']),
  buildLine('dragon6', 'Dragon (Axew)', '#3730a3', [610, 611, 612], ['Axew', 'Fraxure', 'Haxorus']),
  buildLine('dragon', 'Dragon', '#6366f1', [147, 148, 149], ['Dratini', 'Dragonair', 'Dragonite']),
  buildLine('dragon4', 'Dragon (Bagon)', '#4338ca', [371, 372, 373], ['Bagon', 'Shelgon', 'Salamence']),
  buildLine('dragon3', 'Dragon (Alola)', '#92400e', [782, 783, 784], ['Jangmo-o', 'Hakamo-o', 'Kommo-o']),
  buildLine('dragon5', 'Dragon (Gible)', '#312e81', [443, 444, 445], ['Gible', 'Gabite', 'Garchomp']),
  buildLine('dragon7', 'Dragon (Dreepy)', '#5b21b6', [885, 886, 887], ['Dreepy', 'Drakloak', 'Dragapult']),
  buildLine('dragon8', 'Dragon (Frigibax)', '#155e75', [996, 997, 998], ['Frigibax', 'Arctibax', 'Baxcalibur']),
  buildLine('dark9', 'Dark (Poochyena)', '#2e3059', [261, 262], ['Poochyena', 'Mightyena']),
  buildLine('dark10', 'Dark (Purrloin)', '#2e2e4c', [509, 510], ['Purrloin', 'Liepard']),
  buildLine('dark12', 'Dark (Zorua)', '#352d47', [570, 571], ['Zorua', 'Zoroark']),
  buildLine('dark15', 'Dark (Nickit)', '#37284e', [827, 828], ['Nickit', 'Thievul']),
  buildLine('dark16', 'Dark (Maschiff)', '#483a70', [942, 943], ['Maschiff', 'Mabosstiff']),
  buildLine('dark5', 'Dark (Murkrow)', '#4f3f64', [198, 430], ['Murkrow', 'Honchkrow']),
  buildLine('dark13', 'Dark (Vullaby)', '#2d264d', [629, 630], ['Vullaby', 'Mandibuzz']),
  buildLine('dark14', 'Dark (Inkay)', '#2b2c4e', [686, 687], ['Inkay', 'Malamar']),
  buildLine('dark8', 'Dark (Houndour)', '#4f3b72', [228, 229], ['Houndour', 'Houndoom']),
  buildLine('dark7', 'Dark (Sneasel)', '#362f5a', [215, 903], ['Sneasel', 'Sneasler']),
  buildLine('dark11', 'Dark (Scraggy)', '#443061', [559, 560], ['Scraggy', 'Scrafty']),
  buildLine('dark3', 'Dark (Pawniard)', '#3f3f46', [624, 625, 983], ['Pawniard', 'Bisharp', 'Kingambit']),
  buildLine('dark', 'Dark', '#57534e', [551, 552, 553], ['Sandile', 'Krokorok', 'Krookodile']),
  buildLine('dark2', 'Dark (Deino)', '#292524', [633, 634, 635], ['Deino', 'Zweilous', 'Hydreigon']),
  buildLine('dark4', 'Dark (Impidimp)', '#581c87', [859, 860, 861], ['Impidimp', 'Morgrem', 'Grimmsnarl']),
  buildLine('dark6', 'Dark (Sneasel)', '#323152', [215, 461], ['Sneasel', 'Weavile']),
  buildLine('steel4', 'Steel (Klink)', '#71717a', [599, 600, 601], ['Klink', 'Klang', 'Klinklang']),
  buildLine('steel6', 'Steel (Cufant)', '#6e889e', [878, 879], ['Cufant', 'Copperajah']),
  buildLine('steel3', 'Steel (Beldum)', '#475569', [374, 375, 376], ['Beldum', 'Metang', 'Metagross']),
  buildLine('steel5', 'Steel (Bronzor)', '#8997a9', [436, 437], ['Bronzor', 'Bronzong']),
  buildLine('steel8', 'Steel (Varoom)', '#6c779d', [965, 966], ['Varoom', 'Revavroom']),
  buildLine('steel', 'Steel', '#94a3b8', [304, 305, 306], ['Aron', 'Lairon', 'Aggron']),
  buildLine('steel7', 'Steel (Duraludon)', '#7a94a1', [884, 1018], ['Duraludon', 'Archaludon']),
  buildLine('steel2', 'Steel (Kalos)', '#64748b', [679, 680, 681], ['Honedge', 'Doublade', 'Aegislash']),
  buildLine('fairy', 'Fairy', '#f0abfc', [173, 35, 36], ['Cleffa', 'Clefairy', 'Clefable']),
  buildLine('fairy2', 'Fairy (Kalos)', '#f9a8d4', [669, 670, 671], ['Flabébé', 'Floette', 'Florges']),
  buildLine('fairy5', 'Fairy (Snubbull)', '#e1258f', [209, 210], ['Snubbull', 'Granbull']),
  buildLine('fairy6', 'Fairy (Spritzee)', '#db5fb8', [682, 683], ['Spritzee', 'Aromatisse']),
  buildLine('fairy7', 'Fairy (Swirlix)', '#c43562', [684, 685], ['Swirlix', 'Slurpuff']),
  buildLine('fairy8', 'Fairy (Milcery)', '#e5418d', [868, 869], ['Milcery', 'Alcremie']),
  buildLine('fairy9', 'Fairy (Fidough)', '#aa2e77', [926, 927], ['Fidough', 'Dachsbun']),
  buildLine('fairy3', 'Fairy (Hatenna)', '#fce7f3', [856, 857, 858], ['Hatenna', 'Hattrem', 'Hatterene']),
  buildLine('fairy4', 'Fairy (Tinkatink)', '#ec4899', [957, 958, 959], ['Tinkatink', 'Tinkatuff', 'Tinkaton']),
  buildLine('ice3', 'Ice (Vanillite)', '#bae6fd', [582, 583, 584], ['Vanillite', 'Vanillish', 'Vanilluxe']),
  buildLine('ice5', 'Ice (Snorunt)', '#2f89ab', [361, 362], ['Snorunt', 'Glalie']),
  buildLine('ice7', 'Ice (Cubchoo)', '#1dc6ca', [613, 614], ['Cubchoo', 'Beartic']),
  buildLine('ice8', 'Ice (Bergmite)', '#30b2a5', [712, 713], ['Bergmite', 'Avalugg']),
  buildLine('ice10', 'Ice (Cetoddle)', '#60c5d8', [974, 975], ['Cetoddle', 'Cetitan']),
  buildLine('ice2', 'Ice (Spheal)', '#93c5fd', [363, 364, 365], ['Spheal', 'Sealeo', 'Walrein']),
  buildLine('ice4', 'Ice (Smoochum)', '#318cca', [238, 124], ['Smoochum', 'Jynx']),
  buildLine('ice9', 'Ice (Snom)', '#2fa5d9', [872, 873], ['Snom', 'Frosmoth']),
  buildLine('ice', 'Ice', '#67e8f9', [220, 221, 473], ['Swinub', 'Piloswine', 'Mamoswine']),
  buildLine('ice6', 'Ice (Snorunt)', '#4dbfd4', [361, 478], ['Snorunt', 'Froslass']),
  buildLine('psychic', 'Psychic', '#f472b6', [63, 64, 65], ['Abra', 'Kadabra', 'Alakazam']),
  buildLine('psychic4', 'Psychic (Gothita)', '#4f46e5', [574, 575, 576], ['Gothita', 'Gothorita', 'Gothitelle']),
  buildLine('psychic5', 'Psychic (Solosis)', '#a78bfa', [577, 578, 579], ['Solosis', 'Duosion', 'Reuniclus']),
  buildLine('psychic8', 'Psychic (Drowzee)', '#d34fa9', [96, 97], ['Drowzee', 'Hypno']),
  buildLine('psychic10', 'Psychic (Spoink)', '#c9417e', [325, 326], ['Spoink', 'Grumpig']),
  buildLine('psychic11', 'Psychic (Wynaut)', '#b2289e', [360, 202], ['Wynaut', 'Wobbuffet']),
  buildLine('psychic12', 'Psychic (Chingling)', '#ba3395', [433, 358], ['Chingling', 'Chimecho']),
  buildLine('psychic13', 'Psychic (Munna)', '#d2218b', [517, 518], ['Munna', 'Musharna']),
  buildLine('psychic15', 'Psychic (Elgyem)', '#e337ce', [605, 606], ['Elgyem', 'Beheeyem']),
  buildLine('psychic16', 'Psychic (Espurr)', '#db5fbc', [677, 678], ['Espurr', 'Meowstic']),
  buildLine('psychic17', 'Psychic (Flittle)', '#db3a9e', [955, 956], ['Flittle', 'Espathra']),
  buildLine('psychic9', 'Psychic (Natu)', '#e14bc4', [177, 178], ['Natu', 'Xatu']),
  buildLine('psychic14', 'Psychic (Woobat)', '#c31b6a', [527, 528], ['Woobat', 'Swoobat']),
  buildLine('psychic2', 'Psychic (Ralts)', '#e879f9', [280, 281, 282], ['Ralts', 'Kirlia', 'Gardevoir']),
  buildLine('psychic3', 'Psychic (Mime Jr.)', '#d946ef', [439, 122, 866], ['Mime Jr.', 'Mr. Mime', 'Mr. Rime']),
  buildLine('psychic6', 'Psychic (Cosmog/Solgaleo)', '#fef9c3', [789, 790, 791], ['Cosmog', 'Cosmoem', 'Solgaleo']),
  buildLine('psychic7', 'Psychic (Cosmog/Lunala)', '#c7d2fe', [789, 790, 792], ['Cosmog', 'Cosmoem', 'Lunala']),
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

// With ~800 species now reachable in one continuous session (not just one
// family per level), a species can easily be the first-ever request for its
// sprite URL right as it's needed — the browser hasn't fetched it yet, so it
// draws as a blank/invisible circle for a frame or two. Warming every sprite
// into the browser's image cache up front means nothing is ever drawn before
// it's already loaded.
//
// The loaded Image objects have to be kept alive somewhere (not just a local
// loop variable) — otherwise nothing holds a reference to them once this
// function returns, and the browser can garbage-collect an in-flight Image
// before its request finishes, silently cancelling the fetch. With ~800
// requests kicked off at once, most are still in flight when the loop ends,
// so without this array the "preload" was mostly a no-op.
const preloadedImages: HTMLImageElement[] = []
let spritesPreloaded = false
export function preloadSprites(): void {
  if (spritesPreloaded || typeof window === 'undefined') return
  spritesPreloaded = true
  const urls = new Set<string>()
  for (const family of FAMILIES) for (const tile of family.tiles) urls.add(tile.sprite)
  for (const tile of EEVEELUTIONS) urls.add(tile.sprite)
  urls.add(MEW_TILE.sprite)
  for (const url of urls) {
    const img = new Image()
    img.src = url
    preloadedImages.push(img)
  }
}

export function typeOf(familyId: string): string {
  return familyId.replace(/\d+$/, '')
}

// Every line that belongs to a type, in roster order — the sequence a
// type's cursor walks through one line at a time.
export function typeLines(type: string): Family[] {
  return FAMILIES.filter((f) => typeOf(f.id) === type)
}

// How far each type has progressed through its own line sequence. Module-
// level (not React state) because it's game-engine state persisted via
// save/restore, same as everything else in this file.
const cursor: Record<string, number> = Object.fromEntries(TYPE_IDS.map((t) => [t, 0]))

export function getCursor(type: string): number {
  return cursor[type] ?? 0
}

// A type is "complete" once its cursor has walked every line it has — its
// pieces stop advancing on their own and become Fusion Ladder fuel instead.
export function isTypeComplete(type: string): boolean {
  return getCursor(type) >= typeLines(type).length - 1
}

export function advanceCursor(type: string): void {
  cursor[type] = Math.min(getCursor(type) + 1, typeLines(type).length - 1)
}

export function currentLine(type: string): Family {
  return typeLines(type)[getCursor(type)]
}

export function getCursors(): Record<string, number> {
  return { ...cursor }
}

// Restores cursor progress from a save, clamping to each type's actual
// current line count in case the roster changed since the save was made.
export function setCursors(saved: Record<string, number>): void {
  for (const t of TYPE_IDS) {
    const value = saved[t]
    if (typeof value === 'number') {
      cursor[t] = Math.max(0, Math.min(value, typeLines(t).length - 1))
    }
  }
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

function buildLevelOrder(): string[] {
  return [...TYPE_IDS.slice(0, FIXED_LEVEL_COUNT), ...shuffled(TYPE_IDS.slice(FIXED_LEVEL_COUNT))]
}

let levelOrder: string[] = buildLevelOrder()

// Call on a full restart (not a level retry) so a fresh run gets a fresh
// shuffle rather than repeating the exact same order every time.
export function reshuffleLevelOrder(): void {
  levelOrder = buildLevelOrder()
}

export function getLevelOrder(): string[] {
  return levelOrder
}

// Restores a previously-saved type order exactly, so a resumed game shows
// the same goal at the same level it did before. Returns false (and leaves
// the order untouched) if the ids don't cleanly map onto the current 18
// types, e.g. an old save from before this refactor.
export function setLevelOrder(ids: string[]): boolean {
  if (ids.length !== TYPE_IDS.length) return false
  if (!ids.every((id) => TYPE_IDS.includes(id))) return false
  levelOrder = ids
  return true
}

// Levels loop through the (partly shuffled) 18 types forever — level N's
// type is getLevelOrder()[N % 18], so the game never runs out of content.
export function getLevelType(levelIndex: number): string {
  return levelOrder[levelIndex % TYPE_IDS.length]
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

// The Fusion Ladder: once both sides are fully "Type Complete," colliding
// them accelerates a rarer type by one line instead of just bouncing (or,
// if neither type has a recipe together, exploding like any other pair of
// maxed-out pieces). Grounded in real dual-type Pokemon where one exists;
// noted as pure game design where it doesn't.
export type FusionRecipe = {
  a: string
  b: string
  boosts: string
  note: string
}

export const FUSION_RECIPES: FusionRecipe[] = [
  { a: 'water', b: 'rock', boosts: 'ground', note: 'Omastar, Whiscash' },
  { a: 'normal', b: 'flying', boosts: 'dragon', note: 'Dragonite, Altaria, Salamence' },
  { a: 'grass', b: 'bug', boosts: 'poison', note: 'Venonat/Venomoth, Bulbasaur line' },
  { a: 'psychic', b: 'ghost', boosts: 'dark', note: 'thematic' },
  { a: 'fire', b: 'steel', boosts: 'fighting', note: 'thematic' },
  { a: 'fighting', b: 'poison', boosts: 'dark', note: 'Croagunk/Toxicroak' },
  { a: 'dark', b: 'dragon', boosts: 'ghost', note: 'thematic (Spiritomb-flavored)' },
  { a: 'ground', b: 'electric', boosts: 'fairy', note: 'grounded by Dedenne (Electric/Fairy)' },
  { a: 'ghost', b: 'fairy', boosts: 'ice', note: 'final recipe' },
  { a: 'water', b: 'fairy', boosts: 'ice', note: 'final recipe (alternate)' },
]

export function findFusionRecipe(typeA: string, typeB: string): FusionRecipe | undefined {
  return FUSION_RECIPES.find((r) => (r.a === typeA && r.b === typeB) || (r.a === typeB && r.b === typeA))
}
