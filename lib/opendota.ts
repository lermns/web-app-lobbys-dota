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
  { id: 1, name: 'npc_dota_hero_antimage', localized_name: 'Anti-Mage', img: '/heroes/antimage.png' },
  { id: 18, name: 'npc_dota_hero_juggernaut', localized_name: 'Juggernaut', img: '/heroes/juggernaut.png' },
  { id: 23, name: 'npc_dota_hero_kunkka', localized_name: 'Kunkka', img: '/heroes/kunkka.png' },
  { id: 7, name: 'npc_dota_hero_vengefulspirit', localized_name: 'Vengeful Spirit', img: '/heroes/vengefulspirit.png' },
  { id: 86, name: 'npc_dota_hero_rubick', localized_name: 'Rubick', img: '/heroes/rubick.png' },
]

export async function getHeroConstants(): Promise<OpenDotaHero[]> {
  return heroes
}

export async function getMatch(matchId: number): Promise<OpenDotaMatch> {
  if (!Number.isSafeInteger(matchId) || matchId < 1) throw new Error('MATCH_NOT_AVAILABLE')
  return {
    match_id: matchId,
    duration: 2420,
    start_time: Date.now() / 1000 - 3600,
    radiant_win: matchId % 2 === 0,
    players: Array.from({ length: 10 }, (_, index) => ({
      account_id: 1000 + index,
      player_slot: index < 5 ? index : 128 + index,
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
