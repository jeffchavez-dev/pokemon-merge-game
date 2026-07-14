import Matter from 'matter-js'
import { FAMILIES, getTile, getFamily, GOAL_TIER, MAX_TIER, type Tile } from '../data/families'
import { POWERS, getPower, type PowerId } from '../data/powers'

export const GAME_WIDTH = 380
export const GAME_HEIGHT = 520

const WALL_THICKNESS = 24
const DROP_Y = 46
const GAME_OVER_LINE_Y = 118
const GAME_OVER_GRACE_MS = 1200
const DROP_COOLDOWN_MS = 450
const RESTING_SPEED = 0.15
const LEVEL_TRANSITION_MS = 1700
const DANGER_ZONE_Y = GAME_OVER_LINE_Y + 140
const THUNDER_RADIUS = 90
const THUNDER_MAX_TARGETS = 3
const BOARD_BASE_BG = '#0f172a'

type TilePlugin = {
  tileId: string
  familyId: string
  tier: number
  merging: boolean
  settleTimer: number
  isPreview?: boolean
}

type ParticleKind = 'spark' | 'ember' | 'drop' | 'ring' | 'leaf' | 'dust' | 'flash'

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
  onGameOver: (finalScore: number) => void
  onGameComplete: (finalScore: number) => void
  onQueueChange: (dropFamilyId: string, nextFamilyId: string) => void
  onPowerChargesChange: (charges: Record<PowerId, number>) => void
  onArmedPowerChange: (powerId: PowerId | null) => void
  onDangerChange: (inDanger: boolean) => void
}

function spriteScale(tile: Tile): number {
  return (tile.radius * 2) / tile.spriteSize
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

function mixColor(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16)
  const b = parseInt(hexB.slice(1), 16)
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`
}

// A dark, level-themed tint so the board subtly reads as "Electric",
// "Fire", etc. without the family color overpowering the sprites.
function boardBackgroundFor(familyId: string): string {
  return mixColor(BOARD_BASE_BG, getFamily(familyId).color, 0.3)
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
  private particles: Particle[] = []
  private pokeballThrows: PokeballThrow[] = []
  private lightningStrikes: LightningStrike[] = []

  private levelIndex = 0
  private score = 0
  private aimX = GAME_WIDTH / 2
  private canDrop = true
  private gameOver = false
  private frozen = false
  private dropFamilyId = FAMILIES[0].id
  private nextDropFamilyId = FAMILIES[0].id
  private powerCharges: Record<PowerId, number> = this.freshCharges()
  private armedPower: PowerId | null = null
  private isDanger = false

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container
    this.callbacks = callbacks
    this.initWorld()
    this.startLevel(0, false)
  }

  private initWorld() {
    this.engine = Matter.Engine.create({ gravity: { x: 0, y: 1.05 } })
    this.render = Matter.Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: '#1e293b',
      },
    })
    this.runner = Matter.Runner.create()

    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.4,
      render: { fillStyle: '#334155' },
    }
    const floor = Matter.Bodies.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT + WALL_THICKNESS / 2,
      GAME_WIDTH + WALL_THICKNESS * 2,
      WALL_THICKNESS,
      wallOptions,
    )
    const leftWall = Matter.Bodies.rectangle(
      -WALL_THICKNESS / 2,
      GAME_HEIGHT / 2,
      WALL_THICKNESS,
      GAME_HEIGHT * 2,
      wallOptions,
    )
    const rightWall = Matter.Bodies.rectangle(
      GAME_WIDTH + WALL_THICKNESS / 2,
      GAME_HEIGHT / 2,
      WALL_THICKNESS,
      GAME_HEIGHT * 2,
      wallOptions,
    )
    Matter.Composite.add(this.engine.world, [floor, leftWall, rightWall])

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair.bodyA, pair.bodyB)
      }
    })

    Matter.Events.on(this.engine, 'afterUpdate', () => {
      this.processPendingMerges()
      this.updateParticles()
      this.updatePokeballThrows()
      this.updateLightningStrikes()
      this.updateDangerState()
      this.checkGameOver()
    })

    Matter.Events.on(this.render, 'afterRender', () => {
      this.drawGameOverLine()
      this.drawParticles()
      this.drawPokeballThrows()
      this.drawLightningStrikes()
    })

    Matter.Render.run(this.render)
    Matter.Runner.run(this.runner, this.engine)
  }

  private currentFamily() {
    return FAMILIES[this.levelIndex]
  }

  // The families a player can drop during this level: the level's target
  // family plus every family from earlier, completed levels.
  private activePool() {
    return FAMILIES.slice(0, this.levelIndex + 1)
  }

  private randomPoolFamilyId(): string {
    const pool = this.activePool()
    return pool[Math.floor(Math.random() * pool.length)].id
  }

  private freshCharges(): Record<PowerId, number> {
    const charges = {} as Record<PowerId, number>
    for (const p of POWERS) charges[p.id] = p.chargesPerLevel
    return charges
  }

  // Powers a player has unlocked so far (one unlocks per level).
  activePowers() {
    return POWERS.filter((p) => p.unlockLevel <= this.levelIndex)
  }

  private startLevel(index: number, keepScore: boolean) {
    this.levelIndex = index
    this.gameOver = false
    this.frozen = false
    this.canDrop = true
    this.particles = []
    this.pokeballThrows = []
    this.lightningStrikes = []
    this.armedPower = null
    this.powerCharges = this.freshCharges()
    this.isDanger = false
    if (!keepScore) this.score = 0

    const dynamicBodies = this.engine.world.bodies.filter((b) => !b.isStatic)
    Matter.Composite.remove(this.engine.world, dynamicBodies)
    this.previewBody = null

    this.aimX = GAME_WIDTH / 2
    this.dropFamilyId = this.randomPoolFamilyId()
    this.nextDropFamilyId = this.randomPoolFamilyId()
    this.spawnPreview()
    this.render.options.background = boardBackgroundFor(this.currentFamily().id)

    this.callbacks.onScoreChange(this.score)
    this.callbacks.onLevelChange(this.levelIndex, this.currentFamily().id)
    this.callbacks.onQueueChange(this.dropFamilyId, this.nextDropFamilyId)
    this.callbacks.onPowerChargesChange({ ...this.powerCharges })
    this.callbacks.onArmedPowerChange(null)
    this.callbacks.onDangerChange(false)
  }

  private drawGameOverLine() {
    const ctx = this.render.context
    ctx.save()
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(0, GAME_OVER_LINE_Y)
    ctx.lineTo(GAME_WIDTH, GAME_OVER_LINE_Y)
    ctx.stroke()
    ctx.restore()
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
    const color = getFamily(familyId).color
    switch (familyId) {
      case 'electric':
        for (let i = 0; i < 10; i++) {
          const angle = rand(0, Math.PI * 2)
          const speed = rand(3, 7)
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0,
            life: rand(150, 300),
            maxLife: 300,
            size: 2,
            color: '#fef08a',
            kind: 'spark',
            angle: 0,
          })
        }
        break
      case 'fire':
        for (let i = 0; i < 12; i++) {
          this.particles.push({
            x: x + rand(-6, 6),
            y: y + rand(-4, 4),
            vx: rand(-1, 1),
            vy: rand(-3.5, -1.5),
            gravity: -0.02,
            life: rand(400, 700),
            maxLife: 700,
            size: rand(3, 6),
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
          size: 10,
          color,
          kind: 'ring',
          angle: 0,
        })
        for (let i = 0; i < 8; i++) {
          const angle = rand(Math.PI * 0.15, Math.PI * 0.85)
          const speed = rand(2, 5)
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed,
            gravity: 0.35,
            life: rand(400, 650),
            maxLife: 650,
            size: rand(2, 4),
            color: '#38bdf8',
            kind: 'drop',
            angle: 0,
          })
        }
        break
      case 'grass':
        for (let i = 0; i < 9; i++) {
          const angle = rand(0, Math.PI * 2)
          const speed = rand(1.5, 3.5)
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            gravity: 0.05,
            life: rand(500, 800),
            maxLife: 800,
            size: rand(4, 7),
            color: '#4ade80',
            kind: 'leaf',
            angle: rand(0, Math.PI * 2),
          })
        }
        break
      case 'bug':
        for (let i = 0; i < 10; i++) {
          const angle = rand(0, Math.PI * 2)
          const speed = rand(1, 3)
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            gravity: 0.02,
            life: rand(300, 550),
            maxLife: 550,
            size: rand(1.5, 3),
            color: '#a3e635',
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
    const tile = getTile(this.dropFamilyId, 0)
    const body = Matter.Bodies.circle(this.aimX, DROP_Y, tile.radius, {
      isStatic: true,
      isSensor: true,
      render: {
        sprite: {
          texture: tile.sprite,
          xScale: spriteScale(tile),
          yScale: spriteScale(tile),
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
      isPreview: true,
    })
    this.previewBody = body
    Matter.Composite.add(this.engine.world, body)
  }

  setAimX(clientX: number, rect: DOMRect) {
    if (this.gameOver || this.frozen) return
    const tile = getTile(this.dropFamilyId, 0)
    const ratio = GAME_WIDTH / rect.width
    const rawX = (clientX - rect.left) * ratio
    const clamped = Math.min(
      GAME_WIDTH - WALL_THICKNESS / 2 - tile.radius,
      Math.max(WALL_THICKNESS / 2 + tile.radius, rawX),
    )
    this.aimX = clamped
    if (this.previewBody) {
      Matter.Body.setPosition(this.previewBody, { x: clamped, y: DROP_Y })
    }
  }

  drop() {
    if (this.gameOver || this.frozen || !this.canDrop) return
    const tile = getTile(this.dropFamilyId, 0)
    const body = Matter.Bodies.circle(this.aimX, DROP_Y, tile.radius, {
      restitution: 0.15,
      friction: 0.2,
      frictionAir: 0.0015,
      density: 0.0015,
      render: {
        sprite: {
          texture: tile.sprite,
          xScale: spriteScale(tile),
          yScale: spriteScale(tile),
        },
      },
    })
    withPlugin(body, {
      tileId: tile.id,
      familyId: tile.familyId,
      tier: tile.tier,
      merging: false,
      settleTimer: 0,
    })
    Matter.Composite.add(this.engine.world, body)

    this.dropFamilyId = this.nextDropFamilyId
    this.nextDropFamilyId = this.randomPoolFamilyId()
    this.callbacks.onQueueChange(this.dropFamilyId, this.nextDropFamilyId)
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
    if (pa.merging || pb.merging) return
    if (pa.familyId !== pb.familyId || pa.tier !== pb.tier) return
    if (pa.tier >= MAX_TIER) return
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

  // Merges two same-family, same-tier bodies into the next tier. Returns
  // true if this merge completed the current level (caller should stop).
  private applyMerge(a: Matter.Body, b: Matter.Body): boolean {
    const pa = pluginOf(a)!
    const midX = (a.position.x + b.position.x) / 2
    const midY = (a.position.y + b.position.y) / 2
    Matter.Composite.remove(this.engine.world, [a, b])
    this.spawnMergeEffect(pa.familyId, midX, midY)

    const newTier = pa.tier + 1
    const tile = getTile(pa.familyId, newTier)
    const newBody = Matter.Bodies.circle(midX, midY, tile.radius, {
      restitution: 0.15,
      friction: 0.2,
      frictionAir: 0.0015,
      density: 0.0015,
      render: {
        sprite: {
          texture: tile.sprite,
          xScale: spriteScale(tile),
          yScale: spriteScale(tile),
        },
      },
    })
    withPlugin(newBody, {
      tileId: tile.id,
      familyId: tile.familyId,
      tier: tile.tier,
      merging: false,
      settleTimer: 0,
    })
    Matter.Body.setVelocity(newBody, { x: 0, y: -1.5 })
    Matter.Composite.add(this.engine.world, newBody)

    this.score += tile.scoreValue
    this.callbacks.onScoreChange(this.score)

    if (newTier === GOAL_TIER && tile.familyId === this.currentFamily().id) {
      this.completeLevel()
      return true
    }
    return false
  }

  private completeLevel() {
    this.frozen = true
    this.callbacks.onLevelComplete(this.levelIndex)
    setTimeout(() => {
      const nextIndex = this.levelIndex + 1
      if (nextIndex >= FAMILIES.length) {
        this.callbacks.onGameComplete(this.score)
      } else {
        this.startLevel(nextIndex, true)
      }
    }, LEVEL_TRANSITION_MS)
  }

  private checkGameOver() {
    if (this.gameOver || this.frozen) return
    const delta = this.engine.timing.lastDelta || 16.666
    for (const body of this.engine.world.bodies) {
      const plugin = pluginOf(body)
      if (!plugin || plugin.isPreview || body.isStatic) continue
      const topY = body.position.y - (body.circleRadius ?? 0)
      const speed = Matter.Body.getSpeed(body)
      if (topY < GAME_OVER_LINE_Y && speed < RESTING_SPEED) {
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

  private updateDangerState() {
    let danger = false
    for (const body of this.dynamicBodies()) {
      const topY = body.position.y - (body.circleRadius ?? 0)
      const speed = Matter.Body.getSpeed(body)
      // Only settled (resting) pieces count — a freshly dropped piece is
      // still falling through this zone and shouldn't trigger a false alarm.
      if (topY < DANGER_ZONE_Y && speed < RESTING_SPEED) {
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
    this.startLevel(this.levelIndex, true)
  }

  restartGame() {
    this.startLevel(0, false)
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
    const ratioX = GAME_WIDTH / rect.width
    const ratioY = GAME_HEIGHT / rect.height
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
      startX: GAME_WIDTH / 2,
      startY: GAME_HEIGHT + 24,
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
          Matter.Composite.remove(this.engine.world, throwObj.targetBody)
          this.spawnPokeballEffect(throwObj.endX, throwObj.endY)
          this.spawnCaptureFlash(throwObj.endX, throwObj.endY)
        }
      }
    }
    this.pokeballThrows = this.pokeballThrows.filter((t) => !t.landed)
  }

  private drawPokeballThrows() {
    if (this.pokeballThrows.length === 0) return
    const ctx = this.render.context
    const arcHeight = 100
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
      ctx.ellipse(x, groundY + 6, 11 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      drawPokeballShape(ctx, x, y, 13 * scale, t * Math.PI * 7)
    }
  }

  private useThunderStrike(x: number, y: number): boolean {
    const bodies = this.dynamicBodies()
      .map((body) => ({ body, d: (body.position.x - x) ** 2 + (body.position.y - y) ** 2 }))
      .filter(({ d }) => d <= THUNDER_RADIUS * THUNDER_RADIUS)
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
      const spread = (1 - progress) * 26 + 6
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
      ctx.lineWidth = 9
      ctx.globalCompositeOperation = 'lighter'
      ctx.beginPath()
      strike.path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()

      // Bright core.
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
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
      Matter.Body.setVelocity(body, { x: rand(-7, 7), y: rand(-9, -4) })
      Matter.Body.setAngularVelocity(body, rand(-0.2, 0.2))
    }
    this.spawnMergeEffect('water', GAME_WIDTH / 2, GAME_HEIGHT * 0.4)
    return true
  }

  private useRareCandy(): boolean {
    const bodies = this.dynamicBodies()
    const groups = new Map<string, Matter.Body[]>()
    for (const body of bodies) {
      const plugin = pluginOf(body)!
      if (plugin.tier >= MAX_TIER) continue
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
      const speed = rand(1.5, 4)
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        gravity: 0.15,
        life: rand(300, 500),
        maxLife: 500,
        size: rand(2, 4),
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
      size: 6,
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
        size: 8,
        color,
        kind: 'ring',
        angle: 0,
      })
    }
  }

  destroy() {
    Matter.Render.stop(this.render)
    Matter.Runner.stop(this.runner)
    Matter.World.clear(this.engine.world, false)
    Matter.Engine.clear(this.engine)
    this.render.canvas.remove()
  }
}
