import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEX_IDS = [
  // Electric, Fire, Water, Grass, Bug
  172, 25, 26, 4, 5, 6, 7, 8, 9, 1, 2, 3, 10, 11, 12,
  // Normal, Fighting, Flying, Poison, Ground
  506, 507, 508, 66, 67, 68, 16, 17, 18, 41, 42, 169, 328, 329, 330,
  // Rock, Ghost, Dragon, Dark, Steel
  74, 75, 76, 92, 93, 94, 147, 148, 149, 551, 552, 553, 304, 305, 306,
  // Fairy, Ice, Psychic
  173, 35, 36, 220, 221, 473, 63, 64, 65,
  // Gen 6 (Kalos): Chespin, Fennekin, Froakie, Fletchling, Scatterbug,
  // Flabébé, Honedge, Goomy lines
  650, 651, 652, 653, 654, 655, 656, 657, 658, 661, 662, 663, 664, 665, 666,
  669, 670, 671, 679, 680, 681, 704, 705, 706,
  // Gen 7 (Alola): Rowlet, Litten, Popplio, Pikipek, Grubbin, Bounsweet,
  // Jangmo-o lines
  722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 736, 737, 738,
  761, 762, 763, 782, 783, 784,
  // Every other remaining pure 3-stage chain across Gen 1-5, 8, 9 (see
  // families.ts for the full family-by-family breakdown)
  13, 14, 15, 29, 30, 31, 32, 33, 34, 43, 44, 45, 60, 61, 62, 69, 70, 71, 81,
  82, 462, 111, 112, 464, 116, 117, 230, 152, 153, 154, 155, 156, 157, 158,
  159, 160, 179, 180, 181, 187, 188, 189, 246, 247, 248, 216, 217, 901, 79,
  80, 199, 252, 253, 254, 255, 256, 257, 258, 259, 260, 270, 271, 272, 273,
  274, 275, 280, 281, 282, 287, 288, 289, 293, 294, 295, 355, 356, 477, 363,
  364, 365, 371, 372, 373, 374, 375, 376, 263, 264, 862, 387, 388, 389, 390,
  391, 392, 393, 394, 395, 396, 397, 398, 403, 404, 405, 440, 113, 242, 439,
  122, 866, 443, 444, 445, 495, 496, 497, 498, 499, 500, 501, 502, 503, 519,
  520, 521, 524, 525, 526, 532, 533, 534, 535, 536, 537, 540, 541, 542, 543,
  544, 545, 574, 575, 576, 577, 578, 579, 582, 583, 584, 599, 600, 601, 602,
  603, 604, 607, 608, 609, 610, 611, 612, 633, 634, 635, 624, 625, 983, 810,
  811, 812, 813, 814, 815, 816, 817, 818, 821, 822, 823, 824, 825, 826, 837,
  838, 839, 856, 857, 858, 859, 860, 861, 885, 886, 887, 906, 907, 908, 909,
  910, 911, 912, 913, 914, 928, 929, 930, 932, 933, 934, 957, 958, 959, 996,
  997, 998,
  // Eevee + its 8 evolutions (Vaporeon, Jolteon, Flareon, Espeon, Umbreon,
  // Leafeon, Glaceon, Sylveon) — the special collectible line, not part of
  // the normal level rotation
  133, 134, 135, 136, 196, 197, 470, 471, 700,
  // Second pass: "baby Pokemon" chains missed the first time (Igglybuff,
  // Azurill, Budew, Magby, Elekid lines), newer Gen 9 3-stage lines
  // (Mankey/Primeape/Annihilape, Pawmi line, Applin/Dipplin/Hydrapple),
  // and the Cosmog/Cosmoem/Solgaleo + Lunala legendary branches
  174, 39, 40, 298, 183, 184, 406, 315, 407, 240, 126, 467, 239, 125, 466, 56,
  57, 979, 921, 922, 923, 840, 1011, 1019, 789, 790, 791, 792,
]

// Eevee + its 8 evolutions render as shiny sprites (see families.ts) to make
// the rare per-level catch feel special, so they need the shiny artwork too.
const SHINY_DEX_IDS = [133, 134, 135, 136, 196, 197, 470, 471, 700, 151]

const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'pokemon')
const SHINY_OUT_DIR = path.join(OUT_DIR, 'shiny')

async function fetchSprite(dexId, outDir, shiny = false) {
  const shinyPart = shiny ? 'shiny/' : ''
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shinyPart}${dexId}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${dexId}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(path.join(outDir, `${dexId}.png`), buffer)
  console.log(`Saved ${shinyPart}${dexId}.png (${buffer.length} bytes)`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(SHINY_OUT_DIR, { recursive: true })
  for (const dexId of DEX_IDS) {
    await fetchSprite(dexId, OUT_DIR)
  }
  for (const dexId of SHINY_DEX_IDS) {
    await fetchSprite(dexId, SHINY_OUT_DIR, true)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
