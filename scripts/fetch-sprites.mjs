import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEX_IDS = [172, 25, 26, 4, 5, 6, 7, 8, 9, 1, 2, 3, 10, 11, 12]
const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'pokemon')

async function fetchSprite(dexId) {
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexId}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${dexId}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(path.join(OUT_DIR, `${dexId}.png`), buffer)
  console.log(`Saved ${dexId}.png (${buffer.length} bytes)`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  for (const dexId of DEX_IDS) {
    await fetchSprite(dexId)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
