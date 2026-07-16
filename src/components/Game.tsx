import { useEffect, useRef, useState } from 'react'
import { PokemonMergeGame } from '../game/engine'
import { FAMILIES, TYPE_IDS, EEVEE_FAMILY_ID, getTile, getFamily, currentLine, finalTier } from '../data/families'
import { POWERS, type PowerId } from '../data/powers'
import TypeCompendium from './TypeCompendium'

const BEST_SCORE_KEY = 'pokemon-merge-best-score'

function loadBestScore(): number {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<PokemonMergeGame | null>(null)
  const mergeToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(loadBestScore)
  const [unlockedTypes, setUnlockedTypes] = useState<string[]>([])
  const [dropFamilyId, setDropFamilyId] = useState(FAMILIES[0].id)
  const [dropTier, setDropTier] = useState(0)
  const [nextFamilyId, setNextFamilyId] = useState(FAMILIES[0].id)
  const [nextTier, setNextTier] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [powerCharges, setPowerCharges] = useState<Record<PowerId, number>>(
    Object.fromEntries(POWERS.map((p) => [p.id, p.chargesPerLevel])) as Record<PowerId, number>,
  )
  const [armedPower, setArmedPower] = useState<PowerId | null>(null)
  const [inDanger, setInDanger] = useState(false)
  const [discovered, setDiscovered] = useState<Set<string>>(new Set())
  const [infoOpen, setInfoOpen] = useState(false)
  const [compendiumOpen, setCompendiumOpen] = useState(false)
  const [activePowerIds, setActivePowerIds] = useState<PowerId[]>([POWERS[0].id])
  const [capstoneInfo, setCapstoneInfo] = useState<{ familyId: string; aName: string; bName: string } | null>(null)
  const [mergeToast, setMergeToast] = useState<string | null>(null)
  const [eeveeCaught, setEeveeCaught] = useState(0)
  const [eeveeBanner, setEeveeBanner] = useState(false)
  const [eeveeToast, setEeveeToast] = useState<string | null>(null)
  const [mewBanner, setMewBanner] = useState(false)
  const [mewToast, setMewToast] = useState<string | null>(null)
  const [fusionToast, setFusionToast] = useState<string | null>(null)

  const showMergeToast = (text: string, duration = 2200) => {
    if (mergeToastTimeoutRef.current) clearTimeout(mergeToastTimeoutRef.current)
    setMergeToast(text)
    mergeToastTimeoutRef.current = setTimeout(() => setMergeToast(null), duration)
  }

  useEffect(() => {
    if (!containerRef.current) return
    const game = new PokemonMergeGame(containerRef.current, {
      onScoreChange: setScore,
      onTypesUnlockedChange: setUnlockedTypes,
      onGameOver: (finalScore) => {
        setIsGameOver(true)
        setBestScore((prev) => {
          const next = Math.max(prev, finalScore)
          try {
            localStorage.setItem(BEST_SCORE_KEY, String(next))
          } catch {
            // ignore — best score just won't persist this session
          }
          return next
        })
      },
      onQueueChange: (dropFam, dTier, nextFam, nTier) => {
        setDropFamilyId(dropFam)
        setDropTier(dTier)
        setNextFamilyId(nextFam)
        setNextTier(nTier)
      },
      onPowerChargesChange: setPowerCharges,
      onArmedPowerChange: setArmedPower,
      onDangerChange: setInDanger,
      onDiscovered: (fam, tier) => {
        setDiscovered((prev) => new Set(prev).add(`${fam}-${tier}`))
      },
      onActivePowersChange: setActivePowerIds,
      onCapstoneFormed: (fam, aName, bName) => {
        setCapstoneInfo({ familyId: fam, aName, bName })
      },
      onFusionFormed: (boostedType, speciesName) => {
        setFusionToast(`Fusion! ${boostedType[0].toUpperCase()}${boostedType.slice(1)} surges ahead — ${speciesName}!`)
        setTimeout(() => setFusionToast(null), 2400)
      },
      onMergeFormed: ({ aName, bName, resultName, type, kind }) => {
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
        if (kind === 'handoff') {
          showMergeToast(`${aName} + ${bName} → ${typeLabel} continues with ${resultName}!`)
        } else if (kind === 'lineFinal') {
          showMergeToast(`${resultName} formed — ${typeLabel}'s current final. Bump another maxed ${typeLabel} Pokemon to continue.`)
        } else if (aName !== bName) {
          showMergeToast(`${aName} + ${bName} → ${resultName} (both ${typeLabel})`)
        }
      },
      onEeveeCaughtChange: setEeveeCaught,
      onEeveeLevelAnnounced: () => {
        setEeveeBanner(true)
        setTimeout(() => setEeveeBanner(false), 1800)
      },
      onEeveeCaught: (name, value) => {
        setEeveeToast(`Caught shiny ${name}! +${value}`)
        setTimeout(() => setEeveeToast(null), 2000)
      },
      onMewLevelAnnounced: () => {
        setMewBanner(true)
        setTimeout(() => setMewBanner(false), 1800)
      },
      onMewCaught: () => {
        setMewToast("Mew's psychic blast cleared the board!")
        setTimeout(() => setMewToast(null), 2200)
      },
    })
    gameRef.current = game
    return () => game.destroy()
  }, [])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    gameRef.current?.setAimX(e.clientX, rect)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const usedPower = gameRef.current?.resolveBoardTap(e.clientX, e.clientY, rect)
    if (!usedPower) {
      gameRef.current?.drop()
    }
  }

  const handleUsePower = (id: PowerId) => {
    gameRef.current?.usePower(id)
  }

  const handleRetryLevel = () => {
    setIsGameOver(false)
    gameRef.current?.retryLevel()
  }

  const handleRestartGame = () => {
    setIsGameOver(false)
    setScore(0)
    gameRef.current?.restartGame()
  }

  const handleChoosePower = (id: PowerId) => {
    gameRef.current?.choosePower(id)
    setCapstoneInfo(null)
  }

  const handleExchangeEevee = () => {
    gameRef.current?.useEeveeExchange()
  }

  const nowTile = getTile(dropFamilyId, dropTier)
  const nextTile = getTile(nextFamilyId, nextTier)
  // Ambient tint/silhouette tracks whichever piece is queued up to drop right
  // now — there's no single "goal" anymore since every unlocked type is
  // equally active, so the mood just follows whatever's about to come down.
  const dropFamily = getFamily(dropFamilyId)
  const activePowers = POWERS.filter((p) => activePowerIds.includes(p.id))

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-full w-full max-w-[480px] flex-1 flex-col gap-2 px-2 pt-2 pb-2">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-base font-bold tracking-tight">Pokemon Merge</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCompendiumOpen(true)}
              aria-label="Type Compendium"
              title="Type Compendium"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm text-slate-300 active:scale-95"
            >
              📘
            </button>
            <button
              onClick={() => setInfoOpen(true)}
              aria-label="Info and progress"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm text-slate-300 active:scale-95"
            >
              ⓘ
            </button>
          </div>
        </div>

        <HeaderBar
          score={score}
          bestScore={bestScore}
          unlockedTypes={unlockedTypes}
          nowTile={nowTile}
          nextTile={nextTile}
          powers={activePowers}
          charges={powerCharges}
          armedPower={armedPower}
          inDanger={inDanger}
          onUsePower={handleUsePower}
          eeveeCaught={eeveeCaught}
          onExchangeEevee={handleExchangeEevee}
        />

        <div className="relative min-h-0 flex-1">
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl bg-slate-900 transition-colors duration-500"
            style={{ backgroundColor: `${dropFamily.color}1a` }}
          >
            <div
              key={nowTile.id}
              aria-hidden
              className="absolute top-1/2 left-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 opacity-40"
              style={{
                backgroundColor: dropFamily.color,
                WebkitMaskImage: `url(${nowTile.sprite})`,
                maskImage: `url(${nowTile.sprite})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
          </div>
          {eeveeBanner && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-amber-300 bg-slate-950/90 px-4 py-1.5 text-sm font-semibold text-amber-200 shadow-lg">
              A wild Eevee appeared!
            </div>
          )}

          {eeveeToast && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-amber-300 bg-slate-950/90 px-4 py-1.5 text-sm font-semibold text-amber-200 shadow-lg">
              {eeveeToast}
            </div>
          )}

          {mewBanner && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-pink-300 bg-slate-950/90 px-4 py-1.5 text-sm font-semibold text-pink-200 shadow-lg">
              A wild Mew appeared!
            </div>
          )}

          {mewToast && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-pink-300 bg-slate-950/90 px-4 py-1.5 text-sm font-semibold text-pink-200 shadow-lg">
              {mewToast}
            </div>
          )}

          {fusionToast && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-300 bg-slate-950/90 px-4 py-1.5 text-sm font-semibold text-emerald-200 shadow-lg">
              {fusionToast}
            </div>
          )}

          {mergeToast && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-slate-500 bg-slate-950/90 px-3 py-1.5 text-center text-xs font-medium text-slate-200 shadow-lg">
              {mergeToast}
            </div>
          )}

          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerDown={handlePointerMove}
            className={`game-board absolute inset-0 touch-none overflow-hidden rounded-2xl border-2 shadow-2xl transition-colors ${
              armedPower ? 'border-yellow-400' : 'border-slate-700'
            }`}
          >
            {isGameOver && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/85 backdrop-blur-sm">
                <div className="text-xl font-bold">Game Over</div>
                <div className="text-slate-300">Score: {score}</div>
                <button
                  onClick={handleRetryLevel}
                  className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-slate-900 active:scale-95"
                >
                  Retry
                </button>
                <button onClick={handleRestartGame} className="text-xs text-slate-400 underline">
                  Restart Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {infoOpen && (
        <InfoOverlay
          unlockedTypes={unlockedTypes}
          armedPower={armedPower}
          discovered={discovered}
          onClose={() => setInfoOpen(false)}
        />
      )}

      {compendiumOpen && <TypeCompendium onClose={() => setCompendiumOpen(false)} />}

      {capstoneInfo && (
        <CapstonePowerModal
          familyId={capstoneInfo.familyId}
          aName={capstoneInfo.aName}
          bName={capstoneInfo.bName}
          activePowerIds={activePowerIds}
          charges={powerCharges}
          onChoose={handleChoosePower}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span className="text-[9px] text-slate-400">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-6 w-px shrink-0 bg-slate-700" />
}

function HeaderBar({
  score,
  bestScore,
  unlockedTypes,
  nowTile,
  nextTile,
  powers,
  charges,
  armedPower,
  inDanger,
  onUsePower,
  eeveeCaught,
  onExchangeEevee,
}: {
  score: number
  bestScore: number
  unlockedTypes: string[]
  nowTile: ReturnType<typeof getTile>
  nextTile: ReturnType<typeof getTile>
  powers: typeof POWERS
  charges: Record<PowerId, number>
  armedPower: PowerId | null
  inDanger: boolean
  onUsePower: (id: PowerId) => void
  eeveeCaught: number
  onExchangeEevee: () => void
}) {
  return (
    <div
      className={`flex w-full shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-2 rounded-lg px-2 py-2 transition-shadow ${
        inDanger ? 'bg-red-950/40 shadow-[0_0_0_2px_rgba(248,113,113,0.6)] animate-pulse' : 'bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Stat label="Score" value={score} />
        <Stat label="Best" value={bestScore} />
        <Stat label="Types" value={`${unlockedTypes.length}/${TYPE_IDS.length}`} />
      </div>

      <Divider />

      <div className="flex items-center gap-1" title={`Unlocked: ${unlockedTypes.join(', ')}`}>
        {unlockedTypes.map((type) => (
          <span
            key={type}
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: currentLine(type).color }}
          />
        ))}
      </div>

      <Divider />

      <div className="flex items-center gap-1">
        <img src={nowTile.sprite} alt={nowTile.name} className="h-6 w-6 object-contain" />
        <img src={nextTile.sprite} alt={nextTile.name} className="h-4 w-4 object-contain opacity-60" />
      </div>

      <div className="flex items-center gap-1.5">
        {powers.map((power) => {
          const count = charges[power.id] ?? 0
          const disabled = count <= 0
          const armed = armedPower === power.id
          return (
            <button
              key={power.id}
              disabled={disabled}
              onClick={() => onUsePower(power.id)}
              title={power.description}
              className={`relative flex h-9 w-9 flex-col items-center justify-center rounded-full border text-base transition-transform ${
                disabled
                  ? 'border-slate-700 bg-slate-900 opacity-30'
                  : armed
                    ? 'border-yellow-300 bg-yellow-400/20 scale-110'
                    : 'border-slate-500 bg-slate-700 active:scale-95'
              }`}
            >
              {power.id === 'pokeball' ? <PokeballIcon /> : power.icon}
              <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-950 px-1 text-[9px] font-semibold text-slate-200">
                {count}
              </span>
            </button>
          )
        })}

        <button
          disabled={eeveeCaught <= 0}
          onClick={onExchangeEevee}
          title="Trade a caught Eevee for a bonus power"
          className={`relative flex h-9 w-9 flex-col items-center justify-center rounded-full border transition-transform ${
            eeveeCaught <= 0
              ? 'border-slate-700 bg-slate-900 opacity-30'
              : 'border-amber-300 bg-amber-400/20 active:scale-95'
          }`}
        >
          <img src={getTile(EEVEE_FAMILY_ID, 0).sprite} alt="Eevee" className="h-6 w-6 object-contain" />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-950 px-1 text-[9px] font-semibold text-slate-200">
            {eeveeCaught}
          </span>
        </button>
      </div>
    </div>
  )
}

function PokeballIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden>
      <defs>
        <radialGradient id="pb-top" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff8a8a" />
          <stop offset="55%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>
        <radialGradient id="pb-bottom" cx="35%" cy="70%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
        <clipPath id="pb-top-clip">
          <rect x="0" y="0" width="40" height="20" />
        </clipPath>
        <clipPath id="pb-bottom-clip">
          <rect x="0" y="20" width="40" height="20" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="17" fill="url(#pb-top)" clipPath="url(#pb-top-clip)" />
      <circle cx="20" cy="20" r="17" fill="url(#pb-bottom)" clipPath="url(#pb-bottom-clip)" />
      <line x1="3" y1="20" x2="37" y2="20" stroke="#0f172a" strokeWidth="3.2" />
      <circle cx="20" cy="20" r="17" fill="none" stroke="#0f172a" strokeWidth="1.8" />
      <circle cx="20" cy="20" r="6.5" fill="#0f172a" />
      <circle cx="20" cy="20" r="3.8" fill="#f8fafc" />
      <ellipse cx="14" cy="12" rx="4" ry="2.4" fill="#ffffff" opacity="0.55" transform="rotate(-30 14 12)" />
    </svg>
  )
}

function InfoOverlay({
  unlockedTypes,
  armedPower,
  discovered,
  onClose,
}: {
  unlockedTypes: string[]
  armedPower: PowerId | null
  discovered: Set<string>
  onClose: () => void
}) {
  const totalDiscovered = discovered.size
  const totalTiles = FAMILIES.reduce((sum, f) => sum + f.tiles.length, 0)

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-950/97 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto flex h-full w-full max-w-[480px] flex-col gap-4 overflow-y-auto px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Progress</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-slate-400">
          {unlockedTypes.length} of {TYPE_IDS.length} types unlocked
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TYPE_IDS.map((type) => {
            const unlocked = unlockedTypes.includes(type)
            const line = currentLine(type)
            const label = type.charAt(0).toUpperCase() + type.slice(1)
            return (
              <div
                key={type}
                className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-opacity ${
                  unlocked ? 'border-slate-600 opacity-100' : 'border-slate-800 opacity-30'
                }`}
                style={{ backgroundColor: unlocked ? `${line.color}22` : undefined }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: unlocked ? line.color : '#475569' }}
                />
                {unlocked ? label : '???'}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-slate-500">
          {armedPower
            ? 'Tap the board to use your power.'
            : 'Drag to aim, release to drop. Merge two of the same Pokemon to evolve them.'}
        </p>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Discovered</h3>
          <span className="text-xs text-slate-500">
            {totalDiscovered} / {totalTiles}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pb-4 sm:grid-cols-6">
          {FAMILIES.map((family) =>
            family.tiles.map((tile) => {
              const key = `${family.id}-${tile.tier}`
              const found = discovered.has(key)
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-1 rounded-lg bg-slate-900 px-1 py-2 text-center"
                >
                  <img
                    src={tile.sprite}
                    alt={found ? tile.name : '???'}
                    className="h-10 w-10 object-contain"
                    style={found ? undefined : { filter: 'brightness(0) opacity(0.5)' }}
                  />
                  <span className="text-[9px] leading-tight text-slate-400">{found ? tile.name : '???'}</span>
                </div>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}

function CapstonePowerModal({
  familyId,
  aName,
  bName,
  activePowerIds,
  charges,
  onChoose,
}: {
  familyId: string
  aName: string
  bName: string
  activePowerIds: PowerId[]
  charges: Record<PowerId, number>
  onChoose: (id: PowerId) => void
}) {
  const isEeveeTrade = familyId === EEVEE_FAMILY_ID
  const capstone = isEeveeTrade ? getTile(EEVEE_FAMILY_ID, 0) : getTile(familyId, finalTier(getFamily(familyId)))

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/92 px-6 backdrop-blur-sm">
      <img src={capstone.sprite} alt={capstone.name} className="h-20 w-20 object-contain" />
      <div className="text-center">
        <div className="text-lg font-bold text-yellow-300">
          {isEeveeTrade ? 'Traded an Eevee!' : `${capstone.name} discovered!`}
        </div>
        {!isEeveeTrade && (
          <div className="text-xs text-slate-500">
            {aName} + {bName} → hands the line off
          </div>
        )}
        <div className="text-sm text-slate-400">Choose a power to boost:</div>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        {POWERS.map((power) => {
          const isNew = !activePowerIds.includes(power.id)
          return (
            <button
              key={power.id}
              onClick={() => onChoose(power.id)}
              className="flex items-center gap-3 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-left active:scale-95"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-500 bg-slate-700 text-base">
                {power.id === 'pokeball' ? <PokeballIcon /> : power.icon}
              </span>
              <span className="flex-1">
                <div className="text-sm font-semibold text-slate-100">{power.name}</div>
                <div className="text-xs text-slate-400">{power.description}</div>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                  isNew ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isNew ? 'NEW!' : `+1 (${charges[power.id] ?? 0})`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
