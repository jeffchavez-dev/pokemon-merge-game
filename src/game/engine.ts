import Matter from 'matter-js'
import {
  FAMILIES,
  getTile,
  getFamily,
  getLevelFamily,
  getLevelOrder,
  reshuffleLevelOrder,
  setLevelOrder,
  typeOf,
  randomEeveelutionTier,
  eeveeTradeValue,
  EEVEE_FAMILY_ID,
  MEW_FAMILY_ID,
  familyGoalTier,
  familyMaxTier,
  type Tile,
  type Family,
} from '../data/families'
import { POWERS, getPower, type PowerId } from '../data/powers'

// The tile radii / spacing in families.ts were tuned assuming a board this
// wide. Every board is scaled relative to this reference so the game feels
// consistent whether it's rendered on a small phone or a wide tablet.
const REFERENCE_WIDTH = 380
const MIN_WIDTH = 240
const MIN_HEIGHT = 320

const GAME_OVER_GRACE_MS = 1200
const DROP_COOLDOWN_MS = 450
const RESTING_SPEED = 0.15
const CELEBRATION_MS = 1500
const LEVEL_TRANSITION_MS = 1700
const CYCLE_BANNER_MS = 2200
const THUNDER_MAX_TARGETS = 3
const EXPLOSION_MS = 650
const EXPLOSION_COOLDOWN_MS = 900
// Capstones can't merge further, so two of them colliding is a dedicated
// "boom" moment instead: a blast radius that crushes whatever weaker pieces
// are caught nearby, rather than the two just bouncing off each other.
const CAPSTONE_BLAST_RADIUS = 170
// Every 3rd level, a wild Eevee is guaranteed in the queue; every 5th level,
// Mew is instead (Mew wins on the rare level that's a multiple of both).
// Both keep hopping on this interval for as long as they're uncaught — they
// never settle down and give up, so leaving them too long stays risky.
const SPECIAL_HOP_INTERVAL_MS = 1100
const MEW_LEVEL_INTERVAL = 5
const EEVEE_LEVEL_INTERVAL = 3
// How many distinct families can drop during a given level. Keeping this
// small (rather than letting the whole ever-growing roster compete) means
// the current level's goal family stays a frequent drop instead of getting
// buried among 100+ other species once the roster's grown this large.
const ACTIVE_POOL_SIZE = 12
// Mew's catch is a screen-filling event rather than a local one.
const MEW_BLAST_MS = 900

// Collision categories: walls get their own category so the special
// collectibles' mask can target "walls only" — they need to still bounce
// off the board edges, but should pass straight through other pieces
// rather than getting physically wedged in place on a crowded board.
const WALL_CATEGORY = 0x0002
const SPECIAL_CATEGORY = 0x0004

// Progress persists across a page refresh (or just closing the tab) so a
// reload resumes exactly where you left off — only "Restart from Level 1"
// (an explicit choice) actually clears it. Bumped SAVE_VERSION invalidates
// any old save whose shape no longer matches, rather than crashing on it.
const SAVE_KEY = 'pokemon-merge-save'
const SAVE_VERSION = 1
const AUTOSAVE_INTERVAL_MS = 2000

type SavedBody = {
  familyId: string
  tier: number
  x: number
  y: number
}

type SavedGame = {
  version: number
  levelIndex: number
  score: number
  levelOrderIds: string[]
  discovered: string[]
  powerCharges: Record<PowerId, number>
  bonusUnlockedPowerIds: PowerId[]
  eeveeCaught: number
  dropFamilyId: string
  dropTier: number
  nextDropFamilyId: string
  nextDropTier: number
  bodies: SavedBody[]
}

type TilePlugin = {
  tileId: string
  familyId: string
  tier: number
  merging: boolean
  settleTimer: number
  isPreview?: boolean
  explodeCooldown?: number
  // Eevee/Mew only: when it landed, and how many times it's already
  // hopped — the longer it sits uncaught, the more it tries to flee upward.
  bornAt?: number
  hopCount?: number
  // A "charged" tile (see buildFamily2) — drawn with a pulsing halo since
  // it reuses an earlier stage's sprite rather than a new one.
  glow?: boolean
}

type ParticleKind = 'spark' | 'ember' | 'drop' | 'ring' | 'leaf' | 'dust' | 'flash' | 'twinkle'

type PokeballThrow = {
  startX: number
  startY: number
  endX: number
  endY: number
  t: number
  duration: number
  targetBody: Matter.Body
  landed: boolean
}

type LightningStrike = {
  path: Array<{ x: number; y: number }>
  targetX: number
  targetY: number
  t: number
  duration: number
  targetBody: Matter.Body
  landed: boolean
  flicker: number
}

type Celebration = {
  x: number
  y: number
  t: number
  duration: number
  familyId: string
}

type TidalWaveEffect = {
  t: number
  duration: number
}

type ExplosionEffect = {
  x: number
  y: number
  t: number
  duration: number
  // Mew's catch blast reuses this same effect, just scaled way up so it
  // reads as a screen-filling event rather than a local explosion.
  big?: boolean
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  life: number
  maxLife: number
  size: number
  color: string
  kind: ParticleKind
  angle: number
}

function withPlugin(body: Matter.Body, plugin: TilePlugin) {
  ;(body.plugin as unknown) = plugin
  return body
}

function pluginOf(body: Matter.Body): TilePlugin | undefined {
  return body.plugin as TilePlugin | undefined
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void
  onLevelChange: (levelIndex: number, familyId: string) => void
  onLevelComplete: (levelIndex: number) => void
  onCycleComplete: (cycleNumber: number) => void
  onGameOver: (finalScore: number) => void
  onQueueChange: (dropFamilyId: string, dropTier: number, nextFamilyId: string, nextTier: number) => void
  onPowerChargesChange: (charges: Record<PowerId, number>) => void
  onArmedPowerChange: (powerId: PowerId | null) => void
  onDangerChange: (inDanger: boolean) => void
  onDiscovered: (familyId: string, tier: number) => void
  onActivePowersChange: (ids: PowerId[]) => void
  onCapstoneFormed: (familyId: string) => void
  onEeveeCaughtChange: (count: number) => void
  onEeveeLevelAnnounced: () => void
  onEeveeCaught: (name: string, value: number) => void
  onMewLevelAnnounced: () => void
  onMewCaught: () => void
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha))
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

// Draws a shaded, spinnable Poke Ball at (cx, cy). The red/white/band
// pattern rotates with `rotation` (the tumble); the specular highlight is
// drawn after un-rotating so it reads as a fixed light source, which is
// what sells the "glossy sphere" look rather than a flat rotating sticker.
function drawPokeballShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number) {
  ctx.save()
  ctx.translate(cx, cy)

  ctx.save()
  ctx.rotate(rotation)

  ctx.save()
  ctx.beginPath()
  ctx.rect(-r - 2, -r - 2, (r + 2) * 2, r + 2)
  ctx.clip()
  const topGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2)
  topGrad.addColorStop(0, '#ff8a8a')
  topGrad.addColorStop(0.5, '#ef4444')
  topGrad.addColorStop(1, '#b91c1c')
  ctx.fillStyle = topGrad
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.rect(-r - 2, 0, (r + 2) * 2, r + 2)
  ctx.clip()
  const botGrad = ctx.createRadialGradient(-r * 0.3, r * 0.4, r * 0.1, 0, 0, r * 1.2)
  botGrad.addColorStop(0, '#ffffff')
  botGrad.addColorStop(1, '#cbd5e1')
  ctx.fillStyle = botGrad
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = Math.max(1.5, r * 0.16)
  ctx.beginPath()
  ctx.moveTo(-r, 0)
  ctx.lineTo(r, 0)
  ctx.stroke()

  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.lineWidth = Math.max(1, r * 0.08)
  ctx.strokeStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export class PokemonMergeGame {
  private container: HTMLElement
  private callbacks: GameCallbacks
  private engine!: Matter.Engine
  private render!: Matter.Render
  private runner!: Matter.Runner
  private previewBody: Matter.Body | null = null
  private pendingMerges: Array<[Matter.Body, Matter.Body]> = []
  private pendingExplosions: Array<[Matter.Body, Matter.Body]> = []
  private particles: Particle[] = []
  private pokeballThrows: PokeballThrow[] = []
  private lightningStrikes: LightningStrike[] = []
  private celebration: Celebration | null = null
  private waveEffect: TidalWaveEffect | null = null
  private explosions: ExplosionEffect[] = []
  private discovered = new Set<string>()

  // Real measured board size (device viewport driven) and the scale factor
  // relative to the reference design width the tile radii were tuned for.
  private width: number
  private height: number
  private scale: number
  private wallThickness: number
  private dropY: number
  private gameOverLineY: number
  private dangerZoneY: number
  private thunderRadius: number

  private levelIndex = 0
  private score = 0
  private aimX = 0
  private canDrop = true
  private gameOver = false
  private frozen = false
  private dropFamilyId = FAMILIES[0].id
  private dropTier = 0
  private nextDropFamilyId = FAMILIES[0].id
  private nextDropTier = 0
  private powerCharges: Record<PowerId, number> = this.freshCharges()
  private armedPower: PowerId | null = null
  private isDanger = false
  // Powers unlocked early via a capstone bonus pick, on top of the normal
  // one-per-level schedule. Persists for the whole game session.
  private bonusUnlockedPowers = new Set<PowerId>()
  // Eevee-line pieces caught with Poke Ball, banked here instead of just
  // vanishing — spent later to trade for a bonus power. Persists across
  // levels (like bonusUnlockedPowers), only cleared on a full restart.
  private eeveeCaught = 0
  private saveIntervalId: ReturnType<typeof setInterval> | null = null

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container
    this.callbacks = callbacks

    const rect = container.getBoundingClientRect()
    this.width = Math.max(MIN_WIDTH, Math.round(rect.width) || REFERENCE_WIDTH)
    this.height = Math.max(MIN_HEIGHT, Math.round(rect.height) || 520)
    this.scale = this.width / REFERENCE_WIDTH
    this.wallThickness = 24 * this.scale
    this.dropY = this.height * (46 / 520)
    this.gameOverLineY = this.height * (118 / 520)
    this.dangerZoneY = this.gameOverLineY + 140 * this.scale
    this.thunderRadius = 90 * this.scale
    this.aimX = this.width / 2

    this.initWorld()
    const saved = this.loadSave()
    if (saved) {
      this.resumeFromSave(saved)
    } else {
      this.startLevel(0, false, true)
    }
    this.saveIntervalId = setInterval(() => this.persist(), AUTOSAVE_INTERVAL_MS)
  }

  private persist() {
    try {
      const bodies: SavedBody[] = this.dynamicBodies().map((b) => {
        const plugin = pluginOf(b)!
        return { familyId: plugin.familyId, tier: plugin.tier, x: b.position.x, y: b.position.y }
      })
      const saved: SavedGame = {
        version: SAVE_VERSION,
        levelIndex: this.levelIndex,
        score: this.score,
        levelOrderIds: getLevelOrder().map((f) => f.id),
        discovered: Array.from(this.discovered),
        powerCharges: this.powerCharges,
        bonusUnlockedPowerIds: Array.from(this.bonusUnlockedPowers),
        eeveeCaught: this.eeveeCaught,
        dropFamilyId: this.dropFamilyId,
        dropTier: this.dropTier,
        nextDropFamilyId: this.nextDropFamilyId,
        nextDropTier: this.nextDropTier,
        bodies,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved))
    } catch {
      // Storage unavailable or full — persistence is a nice-to-have, not
      // worth crashing the game over.
    }
  }

  private loadSave(): SavedGame | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as SavedGame
      if (parsed.version !== SAVE_VERSION) return null
      return parsed
    } catch {
      return null
    }
  }

  private clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      // ignore
    }
  }

  // Rebuilds the board and all progress from a save instead of starting
  // fresh at level 1 — a page refresh (or just reopening the tab later)
  // should resume exactly where the player left off.
  private resumeFromSave(saved: SavedGame) {
    if (!setLevelOrder(saved.levelOrderIds)) {
      // Save doesn't match the current roster (e.g. an old save from
      // before families were added) — safer to start clean than show a
      // mismatched level/goal pairing.
      this.startLevel(0, false, true)
      return
    }
    this.levelIndex = saved.levelIndex
    this.score = saved.score
    this.discovered = new Set(saved.discovered)
    this.powerCharges = saved.powerCharges
    this.bonusUnlockedPowers = new Set(saved.bonusUnlockedPowerIds)
    this.eeveeCaught = saved.eeveeCaught
    this.dropFamilyId = saved.dropFamilyId
    this.dropTier = saved.dropTier
    this.nextDropFamilyId = saved.nextDropFamilyId
    this.nextDropTier = saved.nextDropTier
    this.gameOver = false
    this.frozen = false
    this.canDrop = true
    this.aimX = this.width / 2

    for (const b of saved.bodies) {
      const tile = getTile(b.familyId, b.tier)
      const body = Matter.Bodies.circle(b.x, b.y, this.radius(tile), {
        restitution: 0.15,
        friction: 0.2,
        frictionAir: 0.0015,
        density: 0.0015,
        render: {
          sprite: {
            texture: tile.sprite,
            xScale: this.spriteScale(tile),
            yScale: this.spriteScale(tile),
          },
        },
      })
      const isSpecial = this.isSpecialFamily(tile.familyId)
      withPlugin(body, {
        tileId: tile.id,
        familyId: tile.familyId,
        tier: tile.tier,
        merging: false,
        settleTimer: 0,
        glow: tile.glow,
        ...(isSpecial ? { bornAt: this.engine.timing.timestamp, hopCount: 0 } : {}),
      })
      if (isSpecial) {
        body.collisionFilter = { category: SPECIAL_CATEGORY, mask: WALL_CATEGORY, group: 0 }
      }
      Matter.Composite.add(this.engine.world, body)
    }

    this.spawnPreview()

    this.callbacks.onScoreChange(this.score)
    this.callbacks.onLevelChange(this.levelIndex, this.currentFamily().id)
    this.callbacks.onQueueChange(this.dropFamilyId, this.dropTier, this.nextDropFamilyId, this.nextDropTier)
    this.callbacks.onPowerChargesChange({ ...this.powerCharges })
    this.callbacks.onArmedPowerChange(null)
    this.callbacks.onDangerChange(false)
    this.callbacks.onActivePowersChange(this.activePowers().map((p) => p.id))
    this.callbacks.onEeveeCaughtChange(this.eeveeCaught)
    for (const key of this.discovered) {
      const idx = key.lastIndexOf('-')
      this.callbacks.onDiscovered(key.slice(0, idx), Number(key.slice(idx + 1)))
    }
  }

  private initWorld() {
    this.engine = Matter.Engine.create({ gravity: { x: 0, y: 1.05 * this.scale } })
    this.render = Matter.Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: this.width,
        height: this.height,
        wireframes: false,
        // Transparent: the tinted background + goal-Pokemon silhouette live
        // as DOM layers behind this canvas (see Game.tsx) rather than being
        // drawn on the canvas itself — Matter repaints its own background
        // fill between every render pass, so anything drawn "underneath"
        // the bodies here would just get wiped each frame.
        background: 'transparent',
      },
    })
    this.runner = Matter.Runner.create()

    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.4,
      render: { fillStyle: '#334155' },
      collisionFilter: { category: WALL_CATEGORY },
    }
    const t = this.wallThickness
    const floor = Matter.Bodies.rectangle(this.width / 2, this.height + t / 2, this.width + t * 2, t, wallOptions)
    const leftWall = Matter.Bodies.rectangle(-t / 2, this.height / 2, t, this.height * 2, wallOptions)
    const rightWall = Matter.Bodies.rectangle(this.width + t / 2, this.height / 2, t, this.height * 2, wallOptions)
    Matter.Composite.add(this.engine.world, [floor, leftWall, rightWall])

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair.bodyA, pair.bodyB)
      }
    })

    Matter.Events.on(this.engine, 'afterUpdate', () => {
      this.processPendingExplosions()
      this.processPendingMerges()
      this.updateExplodeCooldowns()
      this.updateParticles()
      this.updatePokeballThrows()
      this.updateLightningStrikes()
      this.updateCelebration()
      this.updateTidalWave()
      this.updateExplosions()
      this.updateSpecialSparkles()
      this.updateSpecialEscape()
      this.updateDangerState()
      this.checkGameOver()
    })

    Matter.Events.on(this.render, 'afterRender', () => {
      this.drawGameOverLine()
      this.drawGlowHalos()
      this.drawParticles()
      this.drawPokeballThrows()
      this.drawLightningStrikes()
      this.drawCelebration()
      this.drawTidalWave()
      this.drawExplosions()
    })

    Matter.Render.run(this.render)
    Matter.Runner.run(this.runner, this.engine)
  }

  private currentFamily() {
    return getLevelFamily(this.levelIndex)
  }

  // Families shrink the further back they are from whichever family is
  // the CURRENT level's goal (wrapping around the roster), so the active
  // challenge always reads as the biggest thing on the board and families
  // you cleared a while ago fade into the background rather than cluttering
  // it at full size forever.
  private familySizeMultiplier(familyId: string): number {
    // Eevee/Mew aren't part of the level rotation, so they have no
    // "distance back" to measure — always render at full size since
    // they're rare finds.
    if (familyId === EEVEE_FAMILY_ID || familyId === MEW_FAMILY_ID) return 1
    const order = getLevelOrder()
    const currentIdx = this.levelIndex % order.length
    const familyIdx = order.findIndex((f) => f.id === familyId)
    const distanceBack = (currentIdx - familyIdx + order.length) % order.length
    const shrinkPerStep = 0.05
    const minMultiplier = 0.55
    return Math.max(minMultiplier, 1 - distanceBack * shrinkPerStep)
  }

  private radius(tile: Tile): number {
    return tile.radius * this.scale * this.familySizeMultiplier(tile.familyId)
  }

  private spriteScale(tile: Tile): number {
    return (this.radius(tile) * 2) / tile.spriteSize
  }

  // The families a player can drop during this level: the current goal
  // family plus the ACTIVE_POOL_SIZE - 1 families closest to it (by modular
  // distance in the level order, same measure familySizeMultiplier uses),
  // capped to whatever's actually been unlocked so far on a fresh run.
  // Sorted closest-first, so index 0 is always the current level's family.
  private activePool(): Family[] {
    const order = getLevelOrder()
    const currentIdx = this.levelIndex % order.length
    const poolSize = Math.min(ACTIVE_POOL_SIZE, this.levelIndex + 1, order.length)
    return order
      .map((f, i) => ({ f, distanceBack: (currentIdx - i + order.length) % order.length }))
      .sort((a, b) => a.distanceBack - b.distanceBack)
      .slice(0, poolSize)
      .map((x) => x.f)
  }

  // Weighted so the current level's family (and other recently-seen ones)
  // come up far more often than families from long ago — capping the pool
  // above already keeps variety in check; this keeps the goal family itself
  // frequent within that smaller pool.
  private weightedPoolFamilyId(): string {
    const pool = this.activePool()
    const decay = 0.7
    const weights = pool.map((_, i) => Math.pow(decay, i))
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i]
      if (r <= 0) return pool[i].id
    }
    return pool[0].id
  }

  // Base-stage drops are the norm, but once a few levels have passed,
  // occasionally drop an already-evolved (tier 1) Pokemon instead — capped
  // so it stays a spice, not the majority of drops. Never for the current
  // level's target family though: an evolved-form freebie there would skip
  // most of the grind toward that level's actual goal.
  private rollDropTier(familyId: string): 0 | 1 {
    if (familyId === this.currentFamily().id) return 0
    const evolvedChance = Math.min(0.3, this.levelIndex * 0.02)
    return Math.random() < evolvedChance ? 1 : 0
  }

  private freshCharges(): Record<PowerId, number> {
    const charges = {} as Record<PowerId, number>
    for (const p of POWERS) charges[p.id] = p.chargesPerLevel
    return charges
  }

  // Powers a player has unlocked so far: one per level on the normal
  // schedule, plus any picked early via a capstone bonus.
  activePowers() {
    return POWERS.filter((p) => p.unlockLevel <= this.levelIndex || this.bonusUnlockedPowers.has(p.id))
  }

  // clearBoard is false for normal level-to-level progression — the board
  // (and its growing clutter) carries over, since the goal just changes.
  // It's only cleared on an explicit retry (after game over) or a full
  // restart, where a fresh board is actually needed.
  private startLevel(index: number, keepScore: boolean, clearBoard: boolean) {
    this.levelIndex = index
    this.gameOver = false
    this.frozen = false
    this.canDrop = true
    this.particles = []
    this.pokeballThrows = []
    this.lightningStrikes = []
    this.celebration = null
    this.waveEffect = null
    this.explosions = []
    this.pendingExplosions = []
    this.armedPower = null
    this.powerCharges = this.freshCharges()
    this.isDanger = false
    if (!keepScore) this.score = 0

    if (clearBoard) {
      const dynamicBodies = this.engine.world.bodies.filter((b) => !b.isStatic)
      Matter.Composite.remove(this.engine.world, dynamicBodies)
    }

    this.aimX = this.width / 2
    this.dropFamilyId = this.weightedPoolFamilyId()
    this.dropTier = this.rollDropTier(this.dropFamilyId)
    // A wild Eevee (one of its 9 forms, picked fresh each visit) is queued
    // up as the second drop, guaranteed, every 3rd level. Every 5th level,
    // Mew shows up instead — on the rare level that's a multiple of both,
    // Mew wins since it's the bigger event.
    const isMewLevel = (this.levelIndex + 1) % MEW_LEVEL_INTERVAL === 0
    const isEeveeLevel = !isMewLevel && (this.levelIndex + 1) % EEVEE_LEVEL_INTERVAL === 0
    if (isMewLevel) {
      this.nextDropFamilyId = MEW_FAMILY_ID
      this.nextDropTier = 0
    } else if (isEeveeLevel) {
      this.nextDropFamilyId = EEVEE_FAMILY_ID
      this.nextDropTier = randomEeveelutionTier()
    } else {
      this.nextDropFamilyId = this.weightedPoolFamilyId()
      this.nextDropTier = this.rollDropTier(this.nextDropFamilyId)
    }
    this.spawnPreview()

    this.callbacks.onScoreChange(this.score)
    this.callbacks.onLevelChange(this.levelIndex, this.currentFamily().id)
    this.callbacks.onQueueChange(this.dropFamilyId, this.dropTier, this.nextDropFamilyId, this.nextDropTier)
    this.callbacks.onPowerChargesChange({ ...this.powerCharges })
    this.callbacks.onArmedPowerChange(null)
    this.callbacks.onDangerChange(false)
    this.callbacks.onActivePowersChange(this.activePowers().map((p) => p.id))
    if (isMewLevel) this.callbacks.onMewLevelAnnounced()
    else if (isEeveeLevel) this.callbacks.onEeveeLevelAnnounced()
    this.persist()
  }

  private markDiscovered(familyId: string, tier: number) {
    // Eevee/Mew aren't part of the discovered-species dex (they're not in
    // FAMILIES), so they don't belong in that count.
    if (familyId === EEVEE_FAMILY_ID || familyId === MEW_FAMILY_ID) return
    const key = `${familyId}-${tier}`
    if (this.discovered.has(key)) return
    this.discovered.add(key)
    this.callbacks.onDiscovered(familyId, tier)
  }

  private drawGameOverLine() {
    const ctx = this.render.context
    ctx.save()
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(0, this.gameOverLineY)
    ctx.lineTo(this.width, this.gameOverLineY)
    ctx.stroke()
    ctx.restore()
  }

  // A "charged" tile (buildFamily2) reuses an earlier stage's sprite, so it
  // needs some other signal that it's progress — a pulsing golden halo plus
  // a slowly-rotating dashed ring, drawn with additive blending so it reads
  // as a glow around the sprite rather than a wash over it.
  private drawGlowHalos() {
    const now = this.engine.timing.timestamp
    const pulse = 0.5 + 0.5 * Math.sin(now / 220)
    const ctx = this.render.context
    for (const body of this.engine.world.bodies) {
      const plugin = pluginOf(body)
      if (!plugin || !plugin.glow) continue
      const r = body.circleRadius ?? 30
      const haloRadius = r * (1.25 + 0.15 * pulse)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      const grad = ctx.createRadialGradient(body.position.x, body.position.y, r * 0.6, body.position.x, body.position.y, haloRadius)
      grad.addColorStop(0, withAlpha('#fde047', 0))
      grad.addColorStop(0.75, withAlpha('#fde047', 0.5 + 0.2 * pulse))
      grad.addColorStop(1, withAlpha('#fde047', 0))
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(body.position.x, body.position.y, haloRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 0.6 + 0.3 * pulse
      ctx.strokeStyle = '#fef9c3'
      ctx.lineWidth = 2 * this.scale
      ctx.setLineDash([r * 0.35, r * 0.25])
      ctx.lineDashOffset = -(now / 12) % (r * 2)
      ctx.beginPath()
      ctx.arc(body.position.x, body.position.y, r * 1.08, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()
    }
  }

  private drawParticles() {
    const ctx = this.render.context
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.strokeStyle = p.color
      switch (p.kind) {
        case 'spark': {
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 0.12, p.y - p.vy * 0.12)
          ctx.stroke()
          break
        }
        case 'ring': {
          const growth = (1 - alpha) * p.size * 2.2
          ctx.lineWidth = 2
          ctx.globalAlpha = alpha * 0.7
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size + growth, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
        case 'leaf': {
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'flash': {
          const growth = p.size * (1 + (1 - alpha) * 3)
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, growth)
          grad.addColorStop(0, withAlpha('#ffffff', alpha))
          grad.addColorStop(1, withAlpha('#ffffff', 0))
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, growth, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'twinkle': {
          // A tiny 4-point sparkle glint (two crossed diamonds) rather than
          // a plain dot, so it actually reads as "shiny" rather than dust.
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          const s = p.size * 2.4
          ctx.beginPath()
          ctx.moveTo(0, -s)
          ctx.lineTo(s * 0.28, -s * 0.28)
          ctx.lineTo(s, 0)
          ctx.lineTo(s * 0.28, s * 0.28)
          ctx.lineTo(0, s)
          ctx.lineTo(-s * 0.28, s * 0.28)
          ctx.lineTo(-s, 0)
          ctx.lineTo(-s * 0.28, -s * 0.28)
          ctx.closePath()
          ctx.fill()
          break
        }
        default: {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }
  }

  private updateParticles() {
    const dt = this.engine.timing.lastDelta || 16.666
    const step = dt / 16.666
    this.particles = this.particles.filter((p) => {
      p.life -= dt
      p.x += p.vx * step
      p.y += p.vy * step
      p.vy += p.gravity * step
      p.angle += 0.08 * step
      return p.life > 0
    })
  }

  private spawnMergeEffect(familyId: string, x: number, y: number) {
    const s = this.scale
    const color = getFamily(familyId).color
    switch (familyId) {
      case 'electric':
        for (let i = 0; i < 10; i++) {
          const angle = rand(0, Math.PI * 2)
          const speed = rand(3, 7) * s
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0,
            life: rand(150, 300),
            maxLife: 300,
            size: 2 * s,
            color: '#fef08a',
            kind: 'spark',
            angle: 0,
          })
        }
        break
      case 'fire':
        for (let i = 0; i < 12; i++) {
          this.particles.push({
            x: x + rand(-6, 6) * s,
            y: y + rand(-4, 4) * s,
            vx: rand(-1, 1) * s,
            vy: rand(-3.5, -1.5) * s,
            gravity: -0.02,
            life: rand(400, 700),
            maxLife: 700,
            size: rand(3, 6) * s,
            color: Math.random() > 0.5 ? '#f97316' : '#fde047',
            kind: 'ember',
            angle: 0,
          })
        }
        break
      case 'water':
        this.particles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          gravity: 0,
          life: 500,
          maxLife: 500,
          size: 10 * s,
          color,
          kind: 'ring',
          angle: 0,
        })
        for (let i = 0; i < 8; i++) {
          const angle = rand(Math.PI * 0.15, Math.PI * 0.85)
          const speed = rand(2, 5) * s
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed,
            gravity: 0.35,
            life: rand(400, 650),
            maxLife: 650,
            size: rand(2, 4) * s,
            color: '#38bdf8',
            kind: 'drop',
            angle: 0,
          })
        }
        break
      case 'grass':
        for (let i = 0; i < 9; i++) {
          const angle = rand(0, Math.PI * 2)
          const speed = rand(1.5, 3.5) * s
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            gravity: 0.05,
            life: rand(500, 800),
            maxLife: 800,
            size: rand(4, 7) * s,
            color: '#4ade80',
            kind: 'leaf',
            angle: rand(0, Math.PI * 2),
          })
        }
        break
      // All newer type families share a generic sparkle/glow burst in their
      // own color, rather than needing a bespoke effect per type.
      default:
        for (let i = 0; i < 10; i++) {
          const angle = rand(0, Math.PI * 2)
          const speed = rand(1.5, 4) * s
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            gravity: 0.03,
            life: rand(350, 600),
            maxLife: 600,
            size: rand(2, 4) * s,
            color,
            kind: 'dust',
            angle: 0,
          })
        }
        break
    }
  }

  private spawnPreview() {
    if (this.previewBody) {
      Matter.Composite.remove(this.engine.world, this.previewBody)
    }
    const tile = getTile(this.dropFamilyId, this.dropTier)
    const body = Matter.Bodies.circle(this.aimX, this.dropY, this.radius(tile), {
      isStatic: true,
      isSensor: true,
      render: {
        sprite: {
          texture: tile.sprite,
          xScale: this.spriteScale(tile),
          yScale: this.spriteScale(tile),
        },
        opacity: 0.55,
      },
    })
    withPlugin(body, {
      tileId: tile.id,
      familyId: tile.familyId,
      tier: tile.tier,
      merging: false,
      settleTimer: 0,
      glow: tile.glow,
      isPreview: true,
    })
    this.previewBody = body
    Matter.Composite.add(this.engine.world, body)
  }

  setAimX(clientX: number, rect: DOMRect) {
    if (this.gameOver || this.frozen) return
    const tile = getTile(this.dropFamilyId, this.dropTier)
    const ratio = this.width / rect.width
    const rawX = (clientX - rect.left) * ratio
    const r = this.radius(tile)
    const clamped = Math.min(this.width - this.wallThickness / 2 - r, Math.max(this.wallThickness / 2 + r, rawX))
    this.aimX = clamped
    if (this.previewBody) {
      Matter.Body.setPosition(this.previewBody, { x: clamped, y: this.dropY })
    }
  }

  drop() {
    if (this.gameOver || this.frozen || !this.canDrop) return
    const tile = getTile(this.dropFamilyId, this.dropTier)
    const body = Matter.Bodies.circle(this.aimX, this.dropY, this.radius(tile), {
      restitution: 0.15,
      friction: 0.2,
      frictionAir: 0.0015,
      density: 0.0015,
      render: {
        sprite: {
          texture: tile.sprite,
          xScale: this.spriteScale(tile),
          yScale: this.spriteScale(tile),
        },
      },
    })
    const isSpecial = tile.familyId === EEVEE_FAMILY_ID || tile.familyId === MEW_FAMILY_ID
    withPlugin(body, {
      tileId: tile.id,
      familyId: tile.familyId,
      tier: tile.tier,
      merging: false,
      settleTimer: 0,
      glow: tile.glow,
      ...(isSpecial ? { bornAt: this.engine.timing.timestamp, hopCount: 0 } : {}),
    })
    if (isSpecial) {
      // Only collides with the walls/floor, not with other pieces — so it
      // can hop and slip through a crowded board instead of getting
      // physically wedged in place.
      body.collisionFilter = { category: SPECIAL_CATEGORY, mask: WALL_CATEGORY, group: 0 }
    }
    Matter.Composite.add(this.engine.world, body)
    this.markDiscovered(tile.familyId, tile.tier)

    this.dropFamilyId = this.nextDropFamilyId
    this.dropTier = this.nextDropTier
    this.nextDropFamilyId = this.weightedPoolFamilyId()
    this.nextDropTier = this.rollDropTier(this.nextDropFamilyId)
    this.callbacks.onQueueChange(this.dropFamilyId, this.dropTier, this.nextDropFamilyId, this.nextDropTier)
    this.spawnPreview()

    this.canDrop = false
    setTimeout(() => {
      this.canDrop = true
    }, DROP_COOLDOWN_MS)
  }

  private handleCollision(a: Matter.Body, b: Matter.Body) {
    if (this.frozen) return
    const pa = pluginOf(a)
    const pb = pluginOf(b)
    if (!pa || !pb || pa.isPreview || pb.isPreview) return

    // Two capstones can't merge into anything further — instead, any pair of
    // them slamming together (same family or not) sets off a blast that
    // crushes weaker pieces nearby, so it's still a dramatic moment rather
    // than a dead end. Each side's own family decides what tier its capstone
    // sits at (families with a shorter chain, like a 2-stage test line, cap
    // out earlier than the usual tier 3).
    const paMax = familyMaxTier(getFamily(pa.familyId))
    const pbMax = familyMaxTier(getFamily(pb.familyId))
    if (pa.tier >= paMax && pb.tier >= pbMax) {
      if ((pa.explodeCooldown ?? 0) > 0 || (pb.explodeCooldown ?? 0) > 0) return
      this.pendingExplosions.push([a, b])
      return
    }

    if (pa.merging || pb.merging) return
    if (pa.tier !== pb.tier) return
    if (pa.tier >= paMax) return

    const sameFamily = pa.familyId === pb.familyId
    // Two different families' final evolutions (e.g. Raichu and Luxray —
    // different chains, both "electric") can also fuse into that type's
    // capstone, not just two of the exact same species. Each side must be
    // at its OWN family's goal tier, not just numerically equal — a 2-stage
    // family's capstone tier can coincide with a 3-stage family's goal tier.
    const paGoal = familyGoalTier(getFamily(pa.familyId))
    const pbGoal = familyGoalTier(getFamily(pb.familyId))
    const sameTypeFinal = pa.tier === paGoal && pb.tier === pbGoal && typeOf(pa.familyId) === typeOf(pb.familyId)
    if (!sameFamily && !sameTypeFinal) return

    pa.merging = true
    pb.merging = true
    this.pendingMerges.push([a, b])
  }

  private processPendingMerges() {
    if (this.pendingMerges.length === 0 || this.frozen) return
    const merges = this.pendingMerges
    this.pendingMerges = []
    for (const [a, b] of merges) {
      if (!this.engine.world.bodies.includes(a) || !this.engine.world.bodies.includes(b)) continue
      if (this.applyMerge(a, b)) return
    }
  }

  private processPendingExplosions() {
    if (this.pendingExplosions.length === 0 || this.frozen) return
    const explosions = this.pendingExplosions
    this.pendingExplosions = []
    for (const [a, b] of explosions) {
      if (!this.engine.world.bodies.includes(a) || !this.engine.world.bodies.includes(b)) continue
      this.applyCapstoneExplosion(a, b)
    }
  }

  // Two capstones collided: they survive (there's no further tier to merge
  // into) and knock apart, but everything weaker caught inside the blast
  // radius gets crushed for a partial score payout.
  private applyCapstoneExplosion(a: Matter.Body, b: Matter.Body) {
    const pa = pluginOf(a)!
    const pb = pluginOf(b)!
    pa.explodeCooldown = EXPLOSION_COOLDOWN_MS
    pb.explodeCooldown = EXPLOSION_COOLDOWN_MS

    const midX = (a.position.x + b.position.x) / 2
    const midY = (a.position.y + b.position.y) / 2
    const blastRadius = CAPSTONE_BLAST_RADIUS * this.scale

    const casualties = this.dynamicBodies().filter((body) => {
      if (body === a || body === b) return false
      const dx = body.position.x - midX
      const dy = body.position.y - midY
      return dx * dx + dy * dy <= blastRadius * blastRadius
    })

    for (const body of casualties) {
      const plugin = pluginOf(body)!
      const tile = getTile(plugin.familyId, plugin.tier)
      this.score += Math.max(1, Math.round(tile.scoreValue / 2))
      this.spawnMergeEffect(plugin.familyId, body.position.x, body.position.y)
      Matter.Composite.remove(this.engine.world, body)
    }
    if (casualties.length > 0) this.callbacks.onScoreChange(this.score)

    const dx = a.position.x - b.position.x || rand(-1, 1)
    const dy = a.position.y - b.position.y || 0
    const dist = Math.hypot(dx, dy) || 1
    const kick = 7 * this.scale
    Matter.Body.setVelocity(a, { x: (dx / dist) * kick, y: (dy / dist) * kick - 2 * this.scale })
    Matter.Body.setVelocity(b, { x: (-dx / dist) * kick, y: (-dy / dist) * kick - 2 * this.scale })

    this.explosions.push({ x: midX, y: midY, t: 0, duration: EXPLOSION_MS })
    this.spawnExplosionParticles(midX, midY)
  }

  private updateExplodeCooldowns() {
    const dt = this.engine.timing.lastDelta || 16.666
    for (const body of this.engine.world.bodies) {
      const plugin = pluginOf(body)
      if (!plugin || !plugin.explodeCooldown) continue
      plugin.explodeCooldown = Math.max(0, plugin.explodeCooldown - dt)
    }
  }

  private updateExplosions() {
    if (this.explosions.length === 0) return
    const dt = this.engine.timing.lastDelta || 16.666
    this.explosions = this.explosions.filter((e) => {
      e.t += dt
      return e.t < e.duration
    })
  }

  private drawExplosions() {
    if (this.explosions.length === 0) return
    const ctx = this.render.context
    const boardSpan = Math.hypot(this.width, this.height)
    for (const e of this.explosions) {
      const progress = e.t / e.duration
      ctx.save()

      const flashMaxRadius = e.big ? boardSpan * 0.85 : 90 * this.scale
      const flashAlpha = Math.max(0, 1 - progress * (e.big ? 1.6 : 3))
      if (flashAlpha > 0) {
        const flashColor = e.big ? '#fdf4ff' : '#fff7ed'
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, flashMaxRadius)
        grad.addColorStop(0, withAlpha(flashColor, flashAlpha))
        grad.addColorStop(1, withAlpha(flashColor, 0))
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(e.x, e.y, flashMaxRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      const ringCount = e.big ? 3 : 2
      const ringSpan = e.big ? boardSpan * 0.95 : 150 * this.scale
      const ringColors = e.big ? ['#f472b6', '#e879f9', '#f8fafc'] : ['#fb923c', '#f8fafc']
      for (let i = 0; i < ringCount; i++) {
        const ringProgress = Math.min(1, progress + i * 0.16)
        if (ringProgress >= 1) continue
        const ringRadius = (e.big ? 30 : 20) * this.scale + ringProgress * ringSpan
        ctx.globalAlpha = (1 - ringProgress) * 0.85
        ctx.strokeStyle = ringColors[i]
        ctx.lineWidth = (i === 0 ? (e.big ? 10 : 6) : e.big ? 5 : 3) * this.scale
        ctx.beginPath()
        ctx.arc(e.x, e.y, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  private spawnExplosionParticles(x: number, y: number) {
    const s = this.scale
    for (let i = 0; i < 34; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(4, 11) * s
      const roll = Math.random()
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0, 2) * s,
        gravity: 0.18,
        life: rand(500, 950),
        maxLife: 950,
        size: rand(3, 7) * s,
        color: roll > 0.66 ? '#f97316' : roll > 0.33 ? '#78716c' : '#fef08a',
        kind: Math.random() > 0.4 ? 'dust' : 'spark',
        angle: 0,
      })
    }
  }

  // Mew's board-clearing catch — a much bigger, psychic pink/purple/white
  // burst than the regular capstone explosion, since it's meant to read as
  // a screen-filling event rather than a local one.
  private spawnMewBlastParticles(x: number, y: number) {
    const s = this.scale
    const palette = ['#f472b6', '#e879f9', '#c4b5fd', '#f8fafc']
    for (let i = 0; i < 55; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(6, 16) * s
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0, 2) * s,
        gravity: 0.08,
        life: rand(600, 1100),
        maxLife: 1100,
        size: rand(2.5, 5) * s,
        color: palette[i % palette.length],
        kind: Math.random() > 0.35 ? 'twinkle' : 'dust',
        angle: rand(0, Math.PI * 2),
      })
    }
  }

  // Merges two matching bodies into the next tier. Two of the exact same
  // family advance one tier as usual; two different families' final
  // evolutions that share a type (e.g. Raichu + Luxray) instead fuse
  // straight into that type's capstone. Returns true if this merge
  // completed the current level (caller should stop).
  private applyMerge(a: Matter.Body, b: Matter.Body): boolean {
    const pa = pluginOf(a)!
    const pb = pluginOf(b)!
    const midX = (a.position.x + b.position.x) / 2
    const midY = (a.position.y + b.position.y) / 2
    Matter.Composite.remove(this.engine.world, [a, b])

    const sameFamily = pa.familyId === pb.familyId
    const resultFamilyId = sameFamily ? pa.familyId : typeOf(pa.familyId)
    const newTier = sameFamily ? pa.tier + 1 : familyMaxTier(getFamily(resultFamilyId))
    this.spawnMergeEffect(resultFamilyId, midX, midY)

    const tile = getTile(resultFamilyId, newTier)
    const newBody = Matter.Bodies.circle(midX, midY, this.radius(tile), {
      restitution: 0.15,
      friction: 0.2,
      frictionAir: 0.0015,
      density: 0.0015,
      render: {
        sprite: {
          texture: tile.sprite,
          xScale: this.spriteScale(tile),
          yScale: this.spriteScale(tile),
        },
      },
    })
    withPlugin(newBody, {
      tileId: tile.id,
      familyId: tile.familyId,
      tier: tile.tier,
      merging: false,
      settleTimer: 0,
      glow: tile.glow,
    })
    Matter.Body.setVelocity(newBody, { x: 0, y: -1.5 * this.scale })
    Matter.Composite.add(this.engine.world, newBody)
    this.markDiscovered(tile.familyId, tile.tier)

    this.score += tile.scoreValue
    this.callbacks.onScoreChange(this.score)

    const resultFamily = getFamily(tile.familyId)
    if (newTier === familyGoalTier(resultFamily) && tile.familyId === this.currentFamily().id) {
      this.beginCelebration(tile.familyId, midX, midY)
      return true
    }
    if (newTier === familyMaxTier(resultFamily)) {
      this.beginCapstoneBonus(tile.familyId, midX, midY)
      return true
    }
    return false
  }

  // A capstone ("new discovery") forming is a bonus moment independent of
  // level progress — freeze the board and let the player pick a power to
  // unlock early (or a bonus charge if they already have every power).
  private beginCapstoneBonus(familyId: string, x: number, y: number) {
    this.frozen = true
    this.spawnCelebrationEffect(familyId, x, y)
    this.callbacks.onCapstoneFormed(familyId)
  }

  // Resolves a capstone bonus choice: unlocks the power if it isn't active
  // yet, otherwise grants a bonus charge for the rest of this level.
  choosePower(id: PowerId) {
    if (!this.activePowers().some((p) => p.id === id)) {
      this.bonusUnlockedPowers.add(id)
      this.callbacks.onActivePowersChange(this.activePowers().map((p) => p.id))
    } else {
      this.powerCharges[id] = (this.powerCharges[id] ?? 0) + 1
      this.callbacks.onPowerChargesChange({ ...this.powerCharges })
    }
    this.frozen = false
  }

  // Goal reached: freeze the board and let the newly-formed Pokemon sit
  // there with a celebratory burst before the "Level Complete" banner
  // appears, so the player actually gets to see what they made.
  private beginCelebration(familyId: string, x: number, y: number) {
    this.frozen = true
    this.celebration = { x, y, t: 0, duration: CELEBRATION_MS, familyId }
    this.spawnCelebrationEffect(familyId, x, y)

    setTimeout(() => {
      this.celebration = null
      this.callbacks.onLevelComplete(this.levelIndex)
      setTimeout(() => {
        const nextIndex = this.levelIndex + 1
        const wrapsToNewCycle = nextIndex > 0 && nextIndex % FAMILIES.length === 0
        if (wrapsToNewCycle) {
          this.callbacks.onCycleComplete(nextIndex / FAMILIES.length)
          setTimeout(() => this.startLevel(nextIndex, true, false), CYCLE_BANNER_MS)
        } else {
          this.startLevel(nextIndex, true, false)
        }
      }, LEVEL_TRANSITION_MS)
    }, CELEBRATION_MS)
  }

  private updateCelebration() {
    if (!this.celebration) return
    const dt = this.engine.timing.lastDelta || 16.666
    this.celebration.t += dt
  }

  private drawCelebration() {
    if (!this.celebration) return
    const { x, y, t, familyId } = this.celebration
    const color = getFamily(familyId).color
    const ctx = this.render.context
    ctx.save()
    for (let i = 0; i < 3; i++) {
      const ringT = (t - i * 220) / 650
      if (ringT <= 0 || ringT >= 1) continue
      const ringRadius = (18 + ringT * 70) * this.scale
      ctx.globalAlpha = (1 - ringT) * 0.8
      ctx.strokeStyle = color
      ctx.lineWidth = 3 * this.scale
      ctx.beginPath()
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }

  private spawnCelebrationEffect(familyId: string, x: number, y: number) {
    const s = this.scale
    const color = getFamily(familyId).color
    for (let i = 0; i < 26; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(2, 6) * s
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(1, 3) * s,
        gravity: 0.12,
        life: rand(700, 1300),
        maxLife: 1300,
        size: rand(2.5, 5) * s,
        color: Math.random() > 0.5 ? color : '#ffffff',
        kind: Math.random() > 0.5 ? 'dust' : 'leaf',
        angle: rand(0, Math.PI * 2),
      })
    }
  }

  private checkGameOver() {
    if (this.gameOver || this.frozen) return
    const delta = this.engine.timing.lastDelta || 16.666
    for (const body of this.engine.world.bodies) {
      const plugin = pluginOf(body)
      if (!plugin || plugin.isPreview || body.isStatic) continue
      // Game over only once the piece's entire body has cleared the line —
      // its bottom edge (position.y + radius) must be above the line, so a
      // piece that's still half-hanging below the line doesn't count yet.
      const speed = Matter.Body.getSpeed(body)
      const bottomY = body.position.y + (body.circleRadius ?? 0)
      if (bottomY < this.gameOverLineY && speed < RESTING_SPEED) {
        plugin.settleTimer += delta
        if (plugin.settleTimer > GAME_OVER_GRACE_MS) {
          this.triggerGameOver()
          return
        }
      } else {
        plugin.settleTimer = 0
      }
    }
  }

  private triggerGameOver() {
    this.gameOver = true
    this.callbacks.onGameOver(this.score)
  }

  private dynamicBodies(): Matter.Body[] {
    return this.engine.world.bodies.filter((b) => {
      const plugin = pluginOf(b)
      return !b.isStatic && plugin && !plugin.isPreview
    })
  }

  private isSpecialFamily(familyId: string): boolean {
    return familyId === EEVEE_FAMILY_ID || familyId === MEW_FAMILY_ID
  }

  // A faint twinkle around any Eevee or Mew currently on the board, so it
  // visually announces itself rather than blending in as just another drop.
  private updateSpecialSparkles() {
    if (this.frozen) return
    for (const body of this.dynamicBodies()) {
      const plugin = pluginOf(body)
      if (!plugin || !this.isSpecialFamily(plugin.familyId)) continue
      if (Math.random() > 0.12) continue
      const angle = rand(0, Math.PI * 2)
      const dist = rand(0.3, 0.9) * (body.circleRadius ?? 20)
      this.particles.push({
        x: body.position.x + Math.cos(angle) * dist,
        y: body.position.y + Math.sin(angle) * dist,
        vx: 0,
        vy: -rand(0.2, 0.5) * this.scale,
        gravity: 0,
        life: rand(300, 550),
        maxLife: 550,
        size: rand(1.5, 3) * this.scale,
        color: Math.random() > 0.5 ? '#fef9c3' : '#f8fafc',
        kind: 'twinkle',
        angle: rand(0, Math.PI * 2),
      })
    }
  }

  // The longer a wild Eevee or Mew sits uncaught, the more it tries to hop
  // away — it keeps at it indefinitely, so leaving it too long stays risky.
  private updateSpecialEscape() {
    if (this.frozen) return
    const now = this.engine.timing.timestamp
    for (const body of this.dynamicBodies()) {
      const plugin = pluginOf(body)
      if (!plugin || !this.isSpecialFamily(plugin.familyId) || plugin.bornAt === undefined) continue
      const hopCount = plugin.hopCount ?? 0
      const dueHops = Math.floor((now - plugin.bornAt) / SPECIAL_HOP_INTERVAL_MS)
      if (dueHops <= hopCount) continue
      plugin.hopCount = hopCount + 1
      Matter.Body.setVelocity(body, { x: rand(-5, 5) * this.scale, y: -rand(7, 11) * this.scale })
      this.spawnMergeEffect(plugin.familyId, body.position.x, body.position.y)
    }
  }

  private updateDangerState() {
    let danger = false
    for (const body of this.dynamicBodies()) {
      const topY = body.position.y - (body.circleRadius ?? 0)
      const speed = Matter.Body.getSpeed(body)
      // Only settled (resting) pieces count — a freshly dropped piece is
      // still falling through this zone and shouldn't trigger a false alarm.
      if (topY < this.dangerZoneY && speed < RESTING_SPEED) {
        danger = true
        break
      }
    }
    if (danger !== this.isDanger) {
      this.isDanger = danger
      this.callbacks.onDangerChange(danger)
    }
  }

  retryLevel() {
    this.startLevel(this.levelIndex, true, true)
  }

  restartGame() {
    this.bonusUnlockedPowers.clear()
    this.eeveeCaught = 0
    this.callbacks.onEeveeCaughtChange(this.eeveeCaught)
    this.clearSave()
    reshuffleLevelOrder()
    this.startLevel(0, false, true)
  }

  // --- Eevee collectible --------------------------------------------------

  private catchEevee(tier: number, x: number, y: number) {
    const tile = getTile(EEVEE_FAMILY_ID, tier)
    const value = eeveeTradeValue(tier)
    this.eeveeCaught += value
    this.callbacks.onEeveeCaughtChange(this.eeveeCaught)
    this.callbacks.onEeveeCaught(tile.name, value)
    this.spawnShinyCaptureEffect(x, y)
  }

  // A bigger, gold/rainbow-tinted burst for an Eevee catch specifically —
  // the regular Poke Ball capture flash is white, so this reads as a
  // distinctly bigger deal.
  private spawnShinyCaptureEffect(x: number, y: number) {
    const s = this.scale
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      gravity: 0,
      life: 320,
      maxLife: 320,
      size: 10 * s,
      color: '#fef08a',
      kind: 'flash',
      angle: 0,
    })
    const rainbow = ['#f87171', '#fbbf24', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#e879f9']
    for (let i = 0; i < 22; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(2.5, 6.5) * s
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0.5, 2) * s,
        gravity: 0.1,
        life: rand(500, 850),
        maxLife: 850,
        size: rand(2, 3.5) * s,
        color: rainbow[i % rainbow.length],
        kind: 'twinkle',
        angle: rand(0, Math.PI * 2),
      })
    }
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        gravity: 0,
        life: 420 - i * 80,
        maxLife: 420,
        size: 8 * s,
        color: '#fde047',
        kind: 'ring',
        angle: 0,
      })
    }
  }

  // Mew's catch isn't banked — it fires immediately: every piece on the
  // board except the current level's target family gets swept away in one
  // big blast, clearing clutter down to just what you actually need for
  // the goal.
  private catchMew(x: number, y: number) {
    const currentFamilyId = this.currentFamily().id
    const casualties = this.dynamicBodies().filter((body) => {
      const plugin = pluginOf(body)!
      return plugin.familyId !== currentFamilyId
    })
    for (const body of casualties) {
      const plugin = pluginOf(body)!
      const tile = getTile(plugin.familyId, plugin.tier)
      this.score += Math.max(1, Math.round(tile.scoreValue / 2))
      Matter.Composite.remove(this.engine.world, body)
    }
    if (casualties.length > 0) this.callbacks.onScoreChange(this.score)

    this.explosions.push({ x, y, t: 0, duration: MEW_BLAST_MS, big: true })
    this.spawnMewBlastParticles(x, y)
    this.callbacks.onMewCaught()
  }

  // Spends one banked Eevee to open the same choose-a-power modal a
  // capstone discovery triggers. Returns false if there's nothing to spend
  // or the board isn't in a state to accept it.
  useEeveeExchange(): boolean {
    if (this.eeveeCaught <= 0 || this.frozen || this.gameOver) return false
    this.eeveeCaught -= 1
    this.callbacks.onEeveeCaughtChange(this.eeveeCaught)
    this.frozen = true
    this.callbacks.onCapstoneFormed(EEVEE_FAMILY_ID)
    return true
  }

  // --- Special powers ---------------------------------------------------

  getPowerCharges() {
    return { ...this.powerCharges }
  }

  // Arms a targeted power (Poke Ball / Thunder Strike) so the next board
  // tap uses it instead of dropping a Pokemon, or fires an instant power
  // (Tidal Wave / Rare Candy / Earthquake) right away.
  usePower(id: PowerId) {
    if (this.gameOver || this.frozen) return
    if ((this.powerCharges[id] ?? 0) <= 0) return
    const power = getPower(id)

    if (power.targeted) {
      this.armedPower = this.armedPower === id ? null : id
      this.callbacks.onArmedPowerChange(this.armedPower)
      return
    }

    const used = this.executePower(id)
    if (used) this.spendCharge(id)
  }

  // Resolves an armed targeted power at a tapped board position. Returns
  // true if the tap was consumed by a power (caller should skip the drop).
  resolveBoardTap(clientX: number, clientY: number, rect: DOMRect): boolean {
    if (!this.armedPower) return false
    const id = this.armedPower
    const ratioX = this.width / rect.width
    const ratioY = this.height / rect.height
    const x = (clientX - rect.left) * ratioX
    const y = (clientY - rect.top) * ratioY

    const used = this.executePower(id, x, y)
    this.armedPower = null
    this.callbacks.onArmedPowerChange(null)
    if (used) this.spendCharge(id)
    return true
  }

  private spendCharge(id: PowerId) {
    this.powerCharges[id] = Math.max(0, (this.powerCharges[id] ?? 0) - 1)
    this.callbacks.onPowerChargesChange({ ...this.powerCharges })
  }

  private executePower(id: PowerId, x?: number, y?: number): boolean {
    switch (id) {
      case 'pokeball':
        return this.usePokeBall(x!, y!)
      case 'thunder':
        return this.useThunderStrike(x!, y!)
      case 'tidal':
        return this.useTidalWave()
      case 'rareCandy':
        return this.useRareCandy()
      case 'quake':
        return this.useQuake()
    }
  }

  private usePokeBall(x: number, y: number): boolean {
    const bodies = this.dynamicBodies()
    if (bodies.length === 0) return false
    let closest = bodies[0]
    let closestDist = Infinity
    for (const body of bodies) {
      const d = (body.position.x - x) ** 2 + (body.position.y - y) ** 2
      if (d < closestDist) {
        closestDist = d
        closest = body
      }
    }
    this.pokeballThrows.push({
      startX: this.width / 2,
      startY: this.height + 24 * this.scale,
      endX: closest.position.x,
      endY: closest.position.y,
      t: 0,
      duration: 550,
      targetBody: closest,
      landed: false,
    })
    return true
  }

  private updatePokeballThrows() {
    if (this.pokeballThrows.length === 0) return
    const dt = this.engine.timing.lastDelta || 16.666
    for (const throwObj of this.pokeballThrows) {
      if (throwObj.landed) continue
      throwObj.t += dt
      if (throwObj.t >= throwObj.duration) {
        throwObj.landed = true
        if (this.engine.world.bodies.includes(throwObj.targetBody)) {
          const plugin = pluginOf(throwObj.targetBody)
          Matter.Composite.remove(this.engine.world, throwObj.targetBody)
          this.spawnPokeballEffect(throwObj.endX, throwObj.endY)
          if (plugin?.familyId === EEVEE_FAMILY_ID) {
            this.catchEevee(plugin.tier, throwObj.endX, throwObj.endY)
          } else if (plugin?.familyId === MEW_FAMILY_ID) {
            this.catchMew(throwObj.endX, throwObj.endY)
          } else {
            this.spawnCaptureFlash(throwObj.endX, throwObj.endY)
          }
        }
      }
    }
    this.pokeballThrows = this.pokeballThrows.filter((t) => !t.landed)
  }

  private drawPokeballThrows() {
    if (this.pokeballThrows.length === 0) return
    const ctx = this.render.context
    const arcHeight = 100 * this.scale
    for (const throwObj of this.pokeballThrows) {
      const t = Math.min(1, throwObj.t / throwObj.duration)
      const x = throwObj.startX + (throwObj.endX - throwObj.startX) * t
      const groundY = throwObj.startY + (throwObj.endY - throwObj.startY) * t
      const lift = Math.sin(Math.PI * t) * arcHeight
      const y = groundY - lift
      // Bigger + shadow-lighter mid-arc reads as "closer to the camera" —
      // a cheap but effective 2D stand-in for real perspective.
      const scale = 0.75 + 0.5 * Math.sin(Math.PI * t)
      const shadowScale = 1 - 0.6 * Math.sin(Math.PI * t)

      ctx.save()
      ctx.globalAlpha = 0.32 * shadowScale
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(
        x,
        groundY + 6 * this.scale,
        11 * shadowScale * this.scale,
        4.5 * shadowScale * this.scale,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      ctx.restore()

      drawPokeballShape(ctx, x, y, 13 * scale * this.scale, t * Math.PI * 7)
    }
  }

  private useThunderStrike(x: number, y: number): boolean {
    const bodies = this.dynamicBodies()
      .map((body) => ({ body, d: (body.position.x - x) ** 2 + (body.position.y - y) ** 2 }))
      .filter(({ d }) => d <= this.thunderRadius * this.thunderRadius)
      .sort((a, b) => a.d - b.d)
      .slice(0, THUNDER_MAX_TARGETS)
    if (bodies.length === 0) return false
    for (const { body } of bodies) {
      this.lightningStrikes.push({
        path: this.buildBoltPath(body.position.x, body.position.y),
        targetX: body.position.x,
        targetY: body.position.y,
        t: 0,
        duration: 260,
        targetBody: body,
        landed: false,
        flicker: rand(0, Math.PI * 2),
      })
    }
    return true
  }

  // Jagged top-down path from the ceiling to the target, using midpoint
  // displacement so each bolt looks hand-drawn rather than a straight line.
  private buildBoltPath(targetX: number, targetY: number): Array<{ x: number; y: number }> {
    const segments = 7
    const points: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments
      const y = targetY * progress
      const spread = ((1 - progress) * 26 + 6) * this.scale
      const x = i === segments ? targetX : targetX + rand(-spread, spread)
      points.push({ x, y })
    }
    return points
  }

  private updateLightningStrikes() {
    if (this.lightningStrikes.length === 0) return
    const dt = this.engine.timing.lastDelta || 16.666
    for (const strike of this.lightningStrikes) {
      if (strike.landed) continue
      strike.t += dt
      if (strike.t >= strike.duration) {
        strike.landed = true
        if (this.engine.world.bodies.includes(strike.targetBody)) {
          Matter.Composite.remove(this.engine.world, strike.targetBody)
          this.spawnMergeEffect('electric', strike.targetX, strike.targetY)
          this.spawnCaptureFlash(strike.targetX, strike.targetY)
        }
      }
    }
    this.lightningStrikes = this.lightningStrikes.filter((s) => !s.landed)
  }

  private drawLightningStrikes() {
    if (this.lightningStrikes.length === 0) return
    const ctx = this.render.context
    for (const strike of this.lightningStrikes) {
      const progress = strike.t / strike.duration
      const flicker = 0.55 + 0.45 * Math.sin(progress * 40 + strike.flicker)

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Soft outer glow.
      ctx.strokeStyle = '#fde047'
      ctx.lineWidth = 9 * this.scale
      ctx.globalCompositeOperation = 'lighter'
      ctx.beginPath()
      strike.path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()

      // Bright core.
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3 * this.scale
      ctx.beginPath()
      strike.path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
      ctx.restore()
    }
  }

  private useTidalWave(): boolean {
    const bodies = this.dynamicBodies()
    if (bodies.length === 0) return false
    for (const body of bodies) {
      Matter.Body.setVelocity(body, { x: rand(-7, 7) * this.scale, y: rand(-9, -4) * this.scale })
      Matter.Body.setAngularVelocity(body, rand(-0.2, 0.2))
    }
    this.waveEffect = { t: 0, duration: 1000 }
    for (let i = 0; i < 3; i++) {
      this.spawnMergeEffect('water', (this.width / 4) * (i + 1), this.height * 0.6)
    }
    return true
  }

  private updateTidalWave() {
    if (!this.waveEffect) return
    const dt = this.engine.timing.lastDelta || 16.666
    this.waveEffect.t += dt
    if (this.waveEffect.t >= this.waveEffect.duration) this.waveEffect = null
  }

  // A real sweeping wave crest — rises up from the bottom of the board,
  // peaks, then recedes — rather than just a puff of particles, so Tidal
  // Wave actually reads as water washing across the board.
  private drawTidalWave() {
    if (!this.waveEffect) return
    const { t, duration } = this.waveEffect
    const progress = t / duration
    const surge = Math.sin(Math.PI * progress) // rises then falls back to 0
    const ctx = this.render.context

    const baseY = this.height - surge * this.height * 0.7
    const amplitude = 12 * this.scale * (0.4 + surge)
    const waveLength = this.width / 2.5
    const steps = 28

    const crest: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * this.width
      const y = baseY + Math.sin(x / waveLength + t / 140) * amplitude
      crest.push({ x, y })
    }

    ctx.save()
    ctx.globalAlpha = 0.35 + 0.35 * surge

    const grad = ctx.createLinearGradient(0, baseY - amplitude, 0, this.height)
    grad.addColorStop(0, '#bae6fd')
    grad.addColorStop(0.4, '#38bdf8')
    grad.addColorStop(1, '#0369a1')
    ctx.fillStyle = grad

    ctx.beginPath()
    ctx.moveTo(0, this.height)
    for (const p of crest) ctx.lineTo(p.x, p.y)
    ctx.lineTo(this.width, this.height)
    ctx.closePath()
    ctx.fill()

    // Foam line along the crest.
    ctx.globalAlpha = 0.7 + 0.3 * surge
    ctx.strokeStyle = '#f0f9ff'
    ctx.lineWidth = 3 * this.scale
    ctx.beginPath()
    crest.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.stroke()

    // Small foam caps riding the crest.
    for (let i = 2; i < crest.length; i += 5) {
      const p = crest[i]
      ctx.globalAlpha = 0.6 * surge
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5 * this.scale, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  private useRareCandy(): boolean {
    const bodies = this.dynamicBodies()
    const groups = new Map<string, Matter.Body[]>()
    for (const body of bodies) {
      const plugin = pluginOf(body)!
      if (plugin.tier >= familyMaxTier(getFamily(plugin.familyId))) continue
      const key = `${plugin.familyId}-${plugin.tier}`
      const list = groups.get(key) ?? []
      list.push(body)
      groups.set(key, list)
    }
    for (const list of groups.values()) {
      if (list.length >= 2) {
        this.applyMerge(list[0], list[1])
        return true
      }
    }
    return false
  }

  private useQuake(): boolean {
    const bodies = this.dynamicBodies()
    if (bodies.length === 0) return false
    let minTier = Infinity
    for (const body of bodies) {
      const tier = pluginOf(body)!.tier
      if (tier < minTier) minTier = tier
    }
    const targets = bodies.filter((b) => pluginOf(b)!.tier === minTier)
    for (const body of targets) {
      this.spawnMergeEffect('bug', body.position.x, body.position.y)
      Matter.Composite.remove(this.engine.world, body)
    }
    return true
  }

  private spawnPokeballEffect(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(1.5, 4) * this.scale
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        gravity: 0.15,
        life: rand(300, 500),
        maxLife: 500,
        size: rand(2, 4) * this.scale,
        color: Math.random() > 0.5 ? '#ef4444' : '#f8fafc',
        kind: 'dust',
        angle: 0,
      })
    }
  }

  private spawnCaptureFlash(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      gravity: 0,
      life: 220,
      maxLife: 220,
      size: 6 * this.scale,
      color: '#ffffff',
      kind: 'flash',
      angle: 0,
    })
    for (const [color, delay] of [
      ['#ffffff', 0],
      ['#ef4444', 60],
    ] as const) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        gravity: 0,
        life: 380 - delay,
        maxLife: 380,
        size: 8 * this.scale,
        color,
        kind: 'ring',
        angle: 0,
      })
    }
  }

  destroy() {
    if (this.saveIntervalId !== null) clearInterval(this.saveIntervalId)
    this.persist()
    Matter.Render.stop(this.render)
    Matter.Runner.stop(this.runner)
    Matter.World.clear(this.engine.world, false)
    Matter.Engine.clear(this.engine)
    this.render.canvas.remove()
  }
}
