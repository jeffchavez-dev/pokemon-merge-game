import { useMemo, useState } from 'react'
import { TYPE_IDS, typeLines, getCursor, isTypeComplete, isTypeUnlocked, FUSION_RECIPES, type Family } from '../data/families'

// Real-world species counts per type, sourced from Bulbapedia's per-type
// pages (each counts a species once if it carries that type in any form,
// including regional/alternate forms) — the built-in scarcity the Fusion
// Ladder is measured against, independent of this project's own roster.
const REAL_WORLD_COUNT: Record<string, number> = {
  ice: 60,
  fairy: 72,
  electric: 75,
  ghost: 76,
  dragon: 78,
  ground: 79,
  rock: 80,
  steel: 81,
  dark: 84,
  fighting: 86,
  poison: 89,
  fire: 90,
  bug: 94,
  psychic: 111,
  flying: 115,
  grass: 133,
  normal: 134,
  water: 162,
}

const RARITY_RANK = [...TYPE_IDS].sort((a, b) => REAL_WORLD_COUNT[a] - REAL_WORLD_COUNT[b])
const MAX_REAL_COUNT = Math.max(...Object.values(REAL_WORLD_COUNT))

function label(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function TypeCompendium({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [openTypes, setOpenTypes] = useState<Set<string>>(new Set())

  const typeStats = useMemo(() => {
    return TYPE_IDS.map((type) => {
      const lines = typeLines(type)
      const speciesCount = lines.reduce((sum, f) => sum + f.tiles.length, 0)
      return {
        type,
        lines,
        speciesCount,
        cursor: getCursor(type),
        complete: isTypeComplete(type),
        unlocked: isTypeUnlocked(type),
        real: REAL_WORLD_COUNT[type],
      }
    })
  }, [])

  const totalFamilies = typeStats.reduce((sum, t) => sum + t.lines.length, 0)
  const totalSpecies = typeStats.reduce((sum, t) => sum + t.speciesCount, 0)

  const q = query.trim().toLowerCase()
  // Locked types only match by type name — species search shouldn't leak
  // the names of Pokemon behind a type you haven't unlocked yet.
  function matchesQuery(type: string, lines: Family[], unlocked: boolean): boolean {
    if (!q) return true
    if (type.includes(q)) return true
    if (!unlocked) return false
    return lines.some((line) => line.tiles.some((t) => t.name.toLowerCase().includes(q)))
  }

  function toggle(type: string) {
    setOpenTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-white/97 backdrop-blur-sm dark:bg-slate-950/97"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-[480px] flex-col gap-4 overflow-y-auto px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Type Compendium</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{totalFamilies}</span> lines
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{totalSpecies}</span> species
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{TYPE_IDS.length}</span> types
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search a species or a type..."
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-yellow-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-yellow-400"
        />

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Real-world type rarity, least to greatest
          </h3>
          <p className="mb-2 text-xs text-slate-500">
            How many Pokemon species (any generation, any form) actually carry each type — the built-in scarcity the
            Fusion Ladder below chases.
          </p>
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            {RARITY_RANK.map((type) => {
              const count = REAL_WORLD_COUNT[type]
              const pct = (count / MAX_REAL_COUNT) * 100
              const color = typeLines(type)[0]?.color ?? '#94a3b8'
              return (
                <div key={type} className="grid grid-cols-[64px_1fr_28px] items-center gap-2">
                  <div className="text-right text-[11px] font-medium" style={{ color }}>
                    {label(type)}
                  </div>
                  <div className="h-3 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="text-right text-[10px] text-slate-500">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Fusion Ladder</h3>
          <p className="mb-2 text-xs text-slate-500">
            Once both sides are fully Type Complete (every line for that type discovered), colliding them accelerates
            a rarer type by one line instead of just exploding.
          </p>
          <div className="flex flex-col gap-1.5">
            {FUSION_RECIPES.map((recipe, i) => {
              const aReady = isTypeComplete(recipe.a)
              const bReady = isTypeComplete(recipe.b)
              const ready = aReady && bReady
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    ready
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={aReady ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}>
                      {label(recipe.a)}
                    </span>
                    <span className="text-slate-500">+</span>
                    <span className={bReady ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}>
                      {label(recipe.b)}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-300">{label(recipe.boosts)}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{recipe.note}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Roster, by type</h3>
          <div className="flex flex-col gap-2 pb-4">
            {typeStats
              .filter((t) => matchesQuery(t.type, t.lines, t.unlocked))
              .map(({ type, lines, speciesCount, cursor, complete, unlocked, real }) => {
                const open = unlocked && (openTypes.has(type) || (q !== '' && !type.includes(q)))
                const activeLine = lines[Math.min(cursor, lines.length - 1)]
                const coveragePct = Math.min(100, (speciesCount / real) * 100)
                return (
                  <div
                    key={type}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <button
                      onClick={() => unlocked && toggle(type)}
                      className={`flex w-full items-center gap-2 border-l-4 px-3 py-2.5 text-left ${!unlocked ? 'opacity-40' : ''}`}
                      style={{ borderLeftColor: unlocked ? (activeLine?.color ?? '#94a3b8') : '#475569' }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: unlocked ? (activeLine?.color ?? '#94a3b8') : '#475569' }}
                      />
                      <span className="flex-1 text-sm font-semibold">{unlocked ? label(type) : '???'}</span>
                      {unlocked && complete && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
                          COMPLETE
                        </span>
                      )}
                      {unlocked ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {lines.length} lines · {speciesCount} species
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Not yet unlocked</span>
                      )}
                      {unlocked && (
                        <span className={`text-xs text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
                      )}
                    </button>
                    <div className="h-1 bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full"
                        style={{ width: unlocked ? `${coveragePct}%` : '0%', backgroundColor: activeLine?.color ?? '#94a3b8' }}
                      />
                    </div>
                    {open && (
                      <div className="px-3 pt-2 pb-3">
                        <p className="mb-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{speciesCount}</span> of
                          an estimated{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{real}</span> real{' '}
                          {label(type)}-type Pokemon are in the game so far ({coveragePct.toFixed(0)}% coverage).
                        </p>
                        <div className="flex flex-col gap-1">
                          {lines.map((line, i) => {
                            const isActive = i === cursor && !complete
                            const isDone = i < cursor || complete
                            return (
                              <div
                                key={line.id}
                                className={`flex flex-wrap items-center gap-1 text-xs ${
                                  isActive
                                    ? 'font-semibold text-yellow-600 dark:text-yellow-300'
                                    : isDone
                                      ? 'text-slate-400 dark:text-slate-500'
                                      : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {line.tiles.map((tile, ti) => (
                                  <span key={tile.id} className="flex items-center gap-1">
                                    {ti > 0 && <span className="text-slate-400 dark:text-slate-600">→</span>}
                                    <span>{tile.name}</span>
                                  </span>
                                ))}
                                {isActive && (
                                  <span className="text-[10px] text-yellow-600 dark:text-yellow-500">← current</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
