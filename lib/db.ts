import { getMatch, isRadiantSlot, type MockRosterEntry } from './opendota'

// MOCK en memoria. Cuando conectes Supabase, sustituye el cuerpo de estas funciones
// manteniendo las mismas firmas (y haz applyResult/revertResult dentro de una RPC transaccional).

export type PlayerRank = 'ancient' | 'legend' | 'archon' | 'guardian'
export type LobbyPlayer = {
  id: string
  name: string
  accountId: number
  points: number
  wins: number
  losses: number
  played: number
  /** Medalla. En la versión real sale de OpenDota (rank_tier). */
  medal: string
  rank: PlayerRank
  /** Avatar de Steam. En la versión real sale de OpenDota. */
  avatarUrl?: string
}
export type Encounter = {
  id: string
  name: string
  time: string
  radiantName: string
  direName: string
  radiant: string[]
  dire: string[]
  winner: 'radiant' | 'dire' | null
  dotaMatchId?: number
  importedAt?: string
}
export type PlayerMatchStat = { id: string; encounterId: string; playerId: string; heroId: number; kills: number; deaths: number; assists: number; goldPerMin: number; xpPerMin: number; lastHits: number; heroDamage: number; durationSeconds: number; isRadiant: boolean; won: boolean; playedAt: string }

const players: LobbyPlayer[] = [
  { id: '1', name: 'Crisp', accountId: 1000, points: 1280, wins: 42, losses: 19, played: 61, medal: 'Ancient V', rank: 'ancient' },
  { id: '2', name: 'Kuroky', accountId: 1001, points: 1195, wins: 38, losses: 21, played: 59, medal: 'Legend IV', rank: 'legend' },
  { id: '3', name: 'Luna', accountId: 1002, points: 1140, wins: 36, losses: 21, played: 57, medal: 'Legend III', rank: 'legend' },
  { id: '4', name: 'Pudgecito', accountId: 1003, points: 980, wins: 31, losses: 24, played: 55, medal: 'Archon V', rank: 'archon' },
  { id: '5', name: 'Miau', accountId: 1004, points: 920, wins: 29, losses: 24, played: 53, medal: 'Archon IV', rank: 'archon' },
  { id: '6', name: 'InvokerMain', accountId: 1005, points: 870, wins: 25, losses: 23, played: 48, medal: 'Archon II', rank: 'archon' },
  { id: '7', name: 'Roshán', accountId: 1006, points: 760, wins: 22, losses: 24, played: 46, medal: 'Guardian V', rank: 'guardian' },
  { id: '8', name: 'TinyDancer', accountId: 1007, points: 680, wins: 19, losses: 25, played: 44, medal: 'Guardian III', rank: 'guardian' },
  { id: '9', name: 'Nox', accountId: 1008, points: 640, wins: 18, losses: 23, played: 41, medal: 'Guardian II', rank: 'guardian' },
  { id: '10', name: 'Sombra', accountId: 1009, points: 590, wins: 16, losses: 24, played: 40, medal: 'Guardian I', rank: 'guardian' },
]

const encounters: Encounter[] = [
  { id: 'enc-1', name: 'Encuentro 1', time: '21:00', radiantName: 'Los Ancianos', direName: 'Los Errantes', radiant: ['1', '3', '4', '5', '7'], dire: ['2', '6', '8', '9', '10'], winner: null },
  { id: 'enc-2', name: 'Encuentro 2', time: '21:45', radiantName: 'Guardia del Alba', direName: 'Orden del Vacío', radiant: ['2', '5', '9', '1', '10'], dire: ['3', '4', '6', '7', '8'], winner: null },
]

const stats: PlayerMatchStat[] = []

/**
 * Libro de resultados aplicados: qué sumó cada encuentro a cada jugador.
 * Permite deshacer un resultado antes de aplicar otro, así importar dos veces
 * o cambiar el ganador nunca suma puntos de más.
 */
const ledger = new Map<string, { playerId: string; won: boolean }[]>()

// --- DEMO: partidas de ejemplo para que los perfiles muestren gráficas. Pon false para empezar vacío. ---
const SEED_DEMO_STATS = true
const DEMO_HERO_IDS = [1, 18, 23, 7, 86]
if (SEED_DEMO_STATS) {
  let seed = 42
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
  const now = Date.now()
  for (const player of players) {
    for (let match = 0; match < 8; match += 1) {
      const won = rand() > 0.45
      stats.push({
        id: `demo-${match}-${player.id}`, encounterId: `demo-${match}`, playerId: player.id,
        heroId: DEMO_HERO_IDS[Math.floor(rand() * DEMO_HERO_IDS.length)],
        kills: 2 + Math.floor(rand() * 14), deaths: 1 + Math.floor(rand() * 9), assists: 3 + Math.floor(rand() * 18),
        goldPerMin: 330 + Math.floor(rand() * 330), xpPerMin: 380 + Math.floor(rand() * 300),
        lastHits: 90 + Math.floor(rand() * 220), heroDamage: 9000 + Math.floor(rand() * 26000),
        durationSeconds: 1800 + Math.floor(rand() * 1500), isRadiant: rand() > 0.5, won,
        playedAt: new Date(now - (8 - match) * 86_400_000).toISOString(),
      })
    }
  }
}

export async function listEncounters() { return encounters }
export async function listPlayers() { return [...players].sort((a, b) => b.points - a.points) }
export async function getPlayerById(id: string) { return players.find((player) => player.id === id) ?? null }
export async function getPlayerByAccountId(accountId: number) { return players.find((player) => player.accountId === accountId) ?? null }

/** Deshace lo que el encuentro sumó a cada jugador (si no había nada aplicado, no hace nada). */
function revertResult(encounterId: string) {
  for (const entry of ledger.get(encounterId) ?? []) {
    const player = players.find((item) => item.id === entry.playerId)
    if (!player) continue
    player.played = Math.max(0, player.played - 1)
    if (entry.won) {
      player.wins = Math.max(0, player.wins - 1)
      player.points = Math.max(0, player.points - 1)
    } else {
      player.losses = Math.max(0, player.losses - 1)
    }
  }
  ledger.delete(encounterId)
}

/** Suma el resultado: +1 punto y +1 victoria a cada jugador ganador, +1 derrota a cada perdedor, +1 jugada a todos. */
function applyResult(encounter: Encounter, winningSide: 'radiant' | 'dire') {
  const applied: { playerId: string; won: boolean }[] = []
  for (const [side, ids] of [['radiant', encounter.radiant], ['dire', encounter.dire]] as const) {
    for (const playerId of ids) {
      const player = players.find((item) => item.id === playerId)
      if (!player) continue
      const won = side === winningSide
      player.played += 1
      if (won) { player.points += 1; player.wins += 1 } else { player.losses += 1 }
      applied.push({ playerId, won })
    }
  }
  ledger.set(encounter.id, applied)
}

export async function importMatch(encounterId: string, matchId: number, force = false) {
  const encounter = encounters.find((item) => item.id === encounterId)
  if (!encounter) throw new Error('ENCOUNTER_NOT_FOUND')

  const assigned = [
    ...encounter.radiant.map((id) => ({ id, isRadiant: true })),
    ...encounter.dire.map((id) => ({ id, isRadiant: false })),
  ].flatMap((entry) => { const player = players.find((item) => item.id === entry.id); return player ? [{ player, isRadiant: entry.isRadiant }] : [] })
  const roster: MockRosterEntry[] = assigned.map((entry) => ({ accountId: entry.player.accountId, isRadiant: entry.isRadiant }))

  const match = await getMatch(matchId, roster)
  if (match.players.length !== 10) throw new Error('MATCH_NOT_AVAILABLE')
  const duplicate = encounters.some((item) => item.dotaMatchId === matchId && (item.id !== encounterId || !force))
  if (duplicate) throw new Error('MATCH_ALREADY_IMPORTED')

  // Emparejar por account_id (nunca por posición). Los perfiles privados llegan con account_id null.
  const mapped = match.players.map((matchPlayer) => ({
    matchPlayer,
    player: matchPlayer.account_id == null ? undefined : assigned.find((entry) => entry.player.accountId === matchPlayer.account_id)?.player,
  }))
  if (mapped.some((entry) => !entry.player)) throw new Error('UNMAPPED_PLAYERS')

  // Todo validado: a partir de aquí se modifica el estado. En Supabase, esto va dentro de una única transacción.
  revertResult(encounterId)
  for (let index = stats.length - 1; index >= 0; index -= 1) if (stats[index].encounterId === encounterId) stats.splice(index, 1)

  // La partida manda: el bando real de cada jugador sale de player_slot.
  encounter.radiant = mapped.filter((entry) => isRadiantSlot(entry.matchPlayer.player_slot)).map((entry) => entry.player!.id)
  encounter.dire = mapped.filter((entry) => !isRadiantSlot(entry.matchPlayer.player_slot)).map((entry) => entry.player!.id)
  encounter.dotaMatchId = match.match_id
  encounter.importedAt = new Date().toISOString()
  encounter.winner = match.radiant_win ? 'radiant' : 'dire'

  for (const { matchPlayer, player } of mapped) {
    const isRadiant = isRadiantSlot(matchPlayer.player_slot)
    stats.push({
      id: `${encounterId}-${player!.id}`, encounterId, playerId: player!.id, heroId: matchPlayer.hero_id,
      kills: matchPlayer.kills, deaths: matchPlayer.deaths, assists: matchPlayer.assists,
      goldPerMin: matchPlayer.gold_per_min, xpPerMin: matchPlayer.xp_per_min, lastHits: matchPlayer.last_hits,
      heroDamage: matchPlayer.hero_damage, durationSeconds: match.duration, isRadiant,
      won: match.radiant_win === isRadiant, playedAt: new Date(match.start_time * 1000).toISOString(),
    })
  }
  applyResult(encounter, encounter.winner)
  return encounter
}

/** Fallback manual para encuentros sin ID de partida. Se puede cambiar el ganador las veces que haga falta. */
export async function markWinner(encounterId: string, winner: 'radiant' | 'dire') {
  const encounter = encounters.find((item) => item.id === encounterId)
  if (!encounter) throw new Error('ENCOUNTER_NOT_FOUND')
  if (encounter.dotaMatchId) throw new Error('ENCOUNTER_IMPORTED')
  revertResult(encounterId)
  encounter.winner = winner
  applyResult(encounter, winner)
  return encounter
}

export async function getPlayerMatchStats(playerId: string) {
  return stats
    .filter((stat) => stat.playerId === playerId)
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
    .slice(0, 20)
}
