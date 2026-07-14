export type PowerId = 'pokeball' | 'thunder' | 'tidal' | 'rareCandy' | 'quake'

export type Power = {
  id: PowerId
  name: string
  description: string
  icon: string
  // Level index (0-based) at which this power becomes available.
  unlockLevel: number
  chargesPerLevel: number
  // Targeted powers require the player to tap a spot on the board.
  targeted: boolean
}

export const POWERS: Power[] = [
  {
    id: 'pokeball',
    name: 'Poke Ball',
    description: 'Tap a Pokemon to remove it from the board.',
    icon: '⚪',
    unlockLevel: 0,
    chargesPerLevel: 2,
    targeted: true,
  },
  {
    id: 'thunder',
    name: 'Thunder Strike',
    description: 'Tap a spot to zap up to 3 nearby Pokemon away.',
    icon: '⚡',
    unlockLevel: 1,
    chargesPerLevel: 2,
    targeted: true,
  },
  {
    id: 'tidal',
    name: 'Tidal Wave',
    description: 'Wash the whole board around — merges can still chain.',
    icon: '🌊',
    unlockLevel: 2,
    chargesPerLevel: 1,
    targeted: false,
  },
  {
    id: 'rareCandy',
    name: 'Rare Candy',
    description: 'Instantly merges one matching pair anywhere on the board.',
    icon: '🍬',
    unlockLevel: 3,
    chargesPerLevel: 2,
    targeted: false,
  },
  {
    id: 'quake',
    name: 'Earthquake',
    description: 'Clears every lowest-stage Pokemon cluttering the board.',
    icon: '🌎',
    unlockLevel: 4,
    chargesPerLevel: 1,
    targeted: false,
  },
]

export function getPower(id: PowerId): Power {
  return POWERS.find((p) => p.id === id)!
}
