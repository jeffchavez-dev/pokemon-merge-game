import { useEffect, useRef, useState } from 'react'
import { PokemonMergeGame, GAME_WIDTH, GAME_HEIGHT } from '../game/engine'
import { FAMILIES, GOAL_TIER, getTile } from '../data/families'
import { POWERS, type PowerId } from '../data/powers'

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<PokemonMergeGame | null>(null)

  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [levelIndex, setLevelIndex] = useState(0)
  const [familyId, setFamilyId] = useState(FAMILIES[0].id)
  const [dropFamilyId, setDropFamilyId] = useState(FAMILIES[0].id)
  const [nextFamilyId, setNextFamilyId] = useState(FAMILIES[0].id)
  const [levelBanner, setLevelBanner] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isGameComplete, setIsGameComplete] = useState(false)
  const [powerCharges, setPowerCharges] = useState<Record<PowerId, number>>(
    Object.fromEntries(POWERS.map((p) => [p.id, p.chargesPerLevel])) as Record<PowerId, number>,
  )
  const [armedPower, setArmedPower] = useState<PowerId | null>(null)
  const [inDanger, setInDanger] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const game = new PokemonMergeGame(containerRef.current, {
      onScoreChange: setScore,
      onLevelChange: (idx, fam) => {
        setLevelIndex(idx)
        setFamilyId(fam)
        setLevelBanner(false)
      },
      onLevelComplete: () => {
        setLevelBanner(true)
      },
      onGameOver: (finalScore) => {
        setIsGameOver(true)
        setBestScore((prev) => Math.max(prev, finalScore))
      },
      onGameComplete: (finalScore) => {
        setIsGameComplete(true)
        setBestScore((prev) => Math.max(prev, finalScore))
      },
      onQueueChange: (dropFam, nextFam) => {
        setDropFamilyId(dropFam)
        setNextFamilyId(nextFam)
      },
      onPowerChargesChange: setPowerCharges,
      onArmedPowerChange: setArmedPower,
      onDangerChange: setInDanger,
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
    setIsGameComplete(false)
    setScore(0)
    gameRef.current?.restartGame()
  }

  const family = FAMILIES[levelIndex]
  const nowTile = getTile(dropFamilyId, 0)
  const nextTile = getTile(nextFamilyId, 0)
  const goalTile = getTile(familyId, GOAL_TIER)
  const activePowers = POWERS.filter((p) => p.unlockLevel <= levelIndex)

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-slate-950 px-4 py-6 text-slate-100">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pokemon Merge</h1>

      <div className="flex w-full max-w-[380px] items-center justify-between gap-3 text-sm">
        <div className="rounded-lg bg-slate-800 px-3 py-2">
          <div className="text-xs text-slate-400">Score</div>
          <div className="text-lg font-bold">{score}</div>
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2">
          <div className="text-xs text-slate-400">Best</div>
          <div className="text-lg font-bold">{bestScore}</div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400">Now</span>
            <img src={nowTile.sprite} alt={nowTile.name} className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col items-center opacity-60">
            <span className="text-[10px] text-slate-400">Next</span>
            <img src={nextTile.sprite} alt={nextTile.name} className="h-6 w-6 object-contain" />
          </div>
        </div>
      </div>

      <GoalPanel levelIndex={levelIndex} familyName={family.name} goalTile={goalTile} />

      <PowerBar
        powers={activePowers}
        charges={powerCharges}
        armedPower={armedPower}
        inDanger={inDanger}
        onUse={handleUsePower}
      />

      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerMove}
        className={`relative touch-none overflow-hidden rounded-2xl border-2 shadow-2xl transition-colors ${
          armedPower ? 'border-yellow-400' : 'border-slate-700'
        }`}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '92vw' }}
      >
        {levelBanner && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-sm">
            <div className="text-lg font-bold text-yellow-300">Level Complete!</div>
            <img src={goalTile.sprite} alt={goalTile.name} className="h-16 w-16 object-contain" />
            <div className="text-slate-200">You formed a {goalTile.name}!</div>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/85 backdrop-blur-sm">
            <div className="text-xl font-bold">Game Over</div>
            <div className="text-slate-300">Score: {score}</div>
            <button
              onClick={handleRetryLevel}
              className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-slate-900 active:scale-95"
            >
              Retry Level
            </button>
            <button onClick={handleRestartGame} className="text-xs text-slate-400 underline">
              Restart from Level 1
            </button>
          </div>
        )}

        {isGameComplete && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/90 backdrop-blur-sm">
            <div className="text-xl font-bold text-yellow-300">All Levels Complete!</div>
            <div className="text-slate-300">Final Score: {score}</div>
            <button
              onClick={handleRestartGame}
              className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-slate-900 active:scale-95"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <LevelDots levelIndex={levelIndex} />

      <p className="max-w-[380px] text-center text-xs text-slate-500">
        {armedPower
          ? 'Tap the board to use your power.'
          : 'Drag to aim, release to drop. Merge two of the same Pokemon to evolve them.'}
      </p>
    </div>
  )
}

function GoalPanel({
  levelIndex,
  familyName,
  goalTile,
}: {
  levelIndex: number
  familyName: string
  goalTile: ReturnType<typeof getTile>
}) {
  return (
    <div className="flex w-full max-w-[380px] items-center justify-center gap-3 rounded-lg bg-slate-800 px-4 py-2">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-slate-400">Goal</span>
        <img
          src={goalTile.sprite}
          alt="???"
          className="h-12 w-12 object-contain"
          style={{ filter: 'brightness(0) opacity(0.55)' }}
        />
      </div>
      <div className="text-sm">
        <div className="font-semibold text-slate-200">
          Level {levelIndex + 1} — {familyName}
        </div>
        <div className="text-slate-400">Form a {goalTile.name}</div>
      </div>
    </div>
  )
}

function PowerBar({
  powers,
  charges,
  armedPower,
  inDanger,
  onUse,
}: {
  powers: typeof POWERS
  charges: Record<PowerId, number>
  armedPower: PowerId | null
  inDanger: boolean
  onUse: (id: PowerId) => void
}) {
  return (
    <div
      className={`flex w-full max-w-[380px] items-center justify-center gap-2 rounded-lg px-3 py-2 transition-shadow ${
        inDanger ? 'bg-red-950/40 shadow-[0_0_0_2px_rgba(248,113,113,0.6)] animate-pulse' : 'bg-slate-800'
      }`}
    >
      {inDanger && <span className="text-xs font-semibold text-red-300">Use a power!</span>}
      {powers.map((power) => {
        const count = charges[power.id] ?? 0
        const disabled = count <= 0
        const armed = armedPower === power.id
        return (
          <button
            key={power.id}
            disabled={disabled}
            onClick={() => onUse(power.id)}
            title={power.description}
            className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-full border text-lg transition-transform ${
              disabled
                ? 'border-slate-700 bg-slate-900 opacity-30'
                : armed
                  ? 'border-yellow-300 bg-yellow-400/20 scale-110'
                  : 'border-slate-500 bg-slate-700 active:scale-95'
            }`}
          >
            {power.id === 'pokeball' ? <PokeballIcon /> : power.icon}
            <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-950 px-1 text-[10px] font-semibold text-slate-200">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function PokeballIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
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

function LevelDots({ levelIndex }: { levelIndex: number }) {
  return (
    <div className="flex w-full max-w-[380px] flex-wrap items-center justify-center gap-2">
      {FAMILIES.map((f, i) => {
        const state = i < levelIndex ? 'done' : i === levelIndex ? 'current' : 'locked'
        return (
          <div
            key={f.id}
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-opacity ${
              state === 'locked' ? 'border-slate-800 opacity-30' : 'border-slate-600 opacity-100'
            }`}
            style={{ backgroundColor: state !== 'locked' ? `${f.color}22` : undefined }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: state !== 'locked' ? f.color : '#475569' }}
            />
            {state === 'locked' ? '???' : f.name}
            {state === 'done' && ' ✓'}
          </div>
        )
      })}
    </div>
  )
}
