export type OpenDotaHero = {
  id: number
  name: string
  localized_name: string
  img: string
}

export type OpenDotaPlayer = {
  account_id: number | null
  player_slot: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  gold_per_min: number
  xp_per_min: number
  last_hits: number
  hero_damage: number
}

export type OpenDotaMatch = {
  match_id: number
  duration: number
  start_time: number
  radiant_win: boolean
  players: OpenDotaPlayer[]
}

const heroes: OpenDotaHero[] = [
  { id: 1, name: 'npc_dota_hero_antimage', localized_name: 'Anti-Mage', img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/antimage.png' },
  { id: 18, name: 'npc_dota_hero_juggernaut', localized_name: 'Juggernaut', img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png' },
  { id: 23, name: 'npc_dota_hero_kunkka', localized_name: 'Kunkka', img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/kunkka.png' },
  { id: 7, name: 'npc_dota_hero_vengefulspirit', localized_name: 'Vengeful Spirit', img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/vengefulspirit.png' },
  { id: 86, name: 'npc_dota_hero_rubick', localized_name: 'Rubick', img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/rubick.png' },
]

export async function getHeroConstants(): Promise<OpenDotaHero[]> {
  return heroes
}

/** Jugador esperado en la partida. Solo lo usa el mock para generar una partida coherente con el encuentro. */
export type MockRosterEntry = { accountId: number; isRadiant: boolean }

/**
 * MOCK. La versión real hará GET https://api.opendota.com/api/matches/{matchId} desde el servidor.
 * `roster` solo existe para que el mock devuelva los mismos jugadores que tiene asignados el encuentro.
 */
export async function getMatch(matchId: number, roster?: MockRosterEntry[]): Promise<OpenDotaMatch> {
  if (!Number.isSafeInteger(matchId) || matchId < 1) throw new Error('MATCH_NOT_AVAILABLE')
  const entries: MockRosterEntry[] = roster?.length
    ? roster
    : Array.from({ length: 10 }, (_, index) => ({ accountId: 1000 + index, isRadiant: index < 5 }))
  let radiantSlot = 0
  let direSlot = 0
  return {
    match_id: matchId,
    duration: 2420,
    start_time: Date.now() / 1000 - 3600,
    radiant_win: matchId % 2 === 0,
    players: entries.map((entry, index) => ({
      account_id: entry.accountId,
      player_slot: entry.isRadiant ? radiantSlot++ : 128 + direSlot++,
      hero_id: heroes[index % heroes.length].id,
      kills: 4 + (index % 7),
      deaths: 2 + (index % 4),
      assists: 8 + (index % 9),
      gold_per_min: 360 + index * 18,
      xp_per_min: 420 + index * 15,
      last_hits: 120 + index * 11,
      hero_damage: 14000 + index * 1300,
    })),
  }
}

export function isRadiantSlot(playerSlot: number) {
  return playerSlot < 128
}
