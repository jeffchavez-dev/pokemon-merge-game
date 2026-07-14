# Pokemon Merge

A Suika Game–style physics merge game built with real Pokemon sprites. Drop Pokemon into a jar, merge matching pairs to evolve them, and clear each level's goal before the pile reaches the top.

Live: https://pokemon-merge-game.vercel.app/

> This is a personal/portfolio project. It uses real Pokemon artwork (fetched from [PokeAPI](https://pokeapi.co/)) for fun — Pokemon is the property of Nintendo/Game Freak/The Pokemon Company. Not intended for commercial release.

## Gameplay

- **Drag to aim, release to drop** — works with touch and mouse.
- **Merge two matching Pokemon** (same species, same evolution stage) to evolve them into the next stage. Evolved forms are noticeably bigger, so the board fills up fast as you progress.
- **5 levels, one per type family** — Electric, Fire, Water, Grass, Bug. Each level shows a silhouette of its goal Pokemon (e.g. "Form a Raichu"); reaching it clears the level and moves you to the next.
- **The drop pool grows as you progress** — Level 1 only drops Electric Pokemon, but by Level 2 you're dropping a mix of Electric *and* Fire, and so on, so earlier families stay in play.
- **Each family maxes out at a "new discovery"** — after the final real evolution (e.g. Raichu), merging two of those forms an original capstone creature (Voltaris, Pyrothane, Aquoros, Florabyss, Chitinox) instead of a real Pokemon.
- **Game over** when a settled Pokemon rests above the danger line — retry the current level or restart from Level 1.
- **The board background tints** to match the current level's type (yellow for Electric, red for Fire, etc.).
- **Type-themed merge effects** — electric sparks, fire embers, water ripples, grass leaves, bug dust — triggered on every evolution.

## Special powers

One new power unlocks per level, each with limited charges that refill on retry/next level. A red banner pulses when a piece is resting dangerously close to the top, prompting you to use one.

| Level | Power | Effect |
|---|---|---|
| 1 | **Poke Ball** | Tap a Pokemon to throw a ball at it (with a spinning, arcing throw animation) and remove it from the board. |
| 2 | **Thunder Strike** | Tap a spot to call down a lightning bolt from the top of the board, zapping up to 3 nearby Pokemon. |
| 3 | **Tidal Wave** | Tosses every Pokemon on the board into the air — merges can still chain as they resettle. |
| 4 | **Rare Candy** | Instantly merges one matching pair anywhere on the board. |
| 5 | **Earthquake** | Clears every lowest-stage Pokemon cluttering the board. |

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool and dev server
- [Matter.js](https://brm.io/matter-js/) — 2D physics engine driving the drop/merge simulation
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — installable PWA support (manifest, service worker, icons)
- Sprites sourced from [PokeAPI](https://pokeapi.co/), pre-downloaded into `public/pokemon/`

## Responsive design

The board scales to fit any screen — width capped at its native size, but the whole board (canvas included) shrinks proportionally on short/narrow phone screens so it always fits within one viewport without clipping or requiring a scroll.

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build    # type-check + production build (also generates the PWA service worker)
npm run preview  # serve the production build locally
npm run lint      # oxlint
```

To refresh the local Pokemon sprites (or add more species), edit `src/data/families.ts` and rerun:

```bash
node scripts/fetch-sprites.mjs
```

## Project structure

```
src/
  data/
    families.ts   # type families, evolution chains, sizes, scoring
    powers.ts     # special power definitions
  game/
    engine.ts     # Matter.js physics, merges, powers, effects, level/goal logic
  components/
    Game.tsx      # UI: header bar, board, level dots, game-over/victory screens
public/
  pokemon/        # pre-downloaded PokeAPI sprites
scripts/
  fetch-sprites.mjs
```

## Installing as an app (PWA)

Open the deployed link on your phone:
- **Android (Chrome)** — an "Install app" prompt appears automatically.
- **iOS (Safari)** — tap the Share icon → "Add to Home Screen".

PWA install only works over HTTPS (or `localhost`) — running the local dev server and opening it from another device over plain HTTP won't trigger install prompts.
