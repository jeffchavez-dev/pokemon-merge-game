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
  // 2-stage-family prototype (Vulpix/Ninetales)
  37, 38,
  // The rest of the roster's 2-stage lines (buildFamily2, second pass) —
  // every remaining species with exactly one real evolution. See
  // families.ts's "2-real-stage families" block for the full list.
  19, 20, 21, 22, 23, 24, 27, 28, 46, 47, 48, 49,
  50, 51, 52, 53, 54, 55, 58, 59, 72, 73, 77, 78,
  83, 84, 85, 86, 87, 88, 89, 90, 91, 95, 96, 97,
  98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
  110, 114, 118, 119, 120, 121, 123, 124, 129, 130, 138, 139,
  140, 141, 143, 161, 162, 163, 164, 165, 166, 167, 168, 170,
  171, 177, 178, 185, 190, 191, 192, 193, 194, 195, 198, 200,
  202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 215,
  218, 219, 222, 223, 224, 226, 228, 229, 231, 232, 234, 236,
  237, 238, 261, 262, 276, 277, 278, 279, 283, 284, 285, 286,
  290, 291, 292, 296, 297, 299, 300, 301, 307, 308, 309, 310,
  316, 317, 318, 319, 320, 321, 322, 323, 325, 326, 331, 332,
  333, 334, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348,
  349, 350, 353, 354, 358, 360, 361, 362, 366, 367, 368, 399,
  400, 401, 402, 408, 409, 410, 411, 412, 413, 414, 415, 416,
  418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429,
  430, 431, 432, 433, 434, 435, 436, 437, 438, 446, 447, 448,
  449, 450, 451, 452, 453, 454, 456, 457, 458, 459, 460, 461,
  463, 465, 469, 472, 476, 478, 489, 490, 504, 505, 509, 510,
  511, 512, 513, 514, 515, 516, 517, 518, 522, 523, 527, 528,
  529, 530, 546, 547, 548, 549, 550, 554, 555, 557, 558, 559,
  560, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572,
  573, 580, 581, 585, 586, 588, 589, 590, 591, 592, 593, 595,
  596, 597, 598, 605, 606, 613, 614, 616, 617, 619, 620, 622,
  623, 627, 628, 629, 630, 636, 637, 659, 660, 667, 668, 672,
  673, 674, 675, 677, 678, 682, 683, 684, 685, 686, 687, 688,
  689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 708,
  709, 710, 711, 712, 713, 714, 715, 734, 735, 739, 740, 742,
  743, 744, 745, 747, 748, 749, 750, 751, 752, 753, 754, 755,
  756, 757, 758, 759, 760, 767, 768, 769, 770, 772, 773, 803,
  804, 819, 820, 827, 828, 829, 830, 831, 832, 833, 834, 835,
  836, 843, 844, 846, 847, 848, 849, 850, 851, 852, 853, 854,
  855, 863, 864, 865, 867, 868, 869, 872, 873, 878, 879, 884,
  891, 892, 899, 900, 902, 903, 904, 915, 916, 917, 918, 919,
  920, 924, 925, 926, 927, 935, 936, 937, 938, 939, 940, 941,
  942, 943, 944, 945, 946, 947, 948, 949, 951, 952, 953, 954,
  955, 956, 960, 961, 963, 964, 965, 966, 969, 970, 971, 972,
  974, 975, 980, 981, 982, 999, 1000, 1012, 1013, 1018,
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
