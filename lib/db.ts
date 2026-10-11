import { getMatch, isRadiantSlot, type OpenDotaMatch } from './opendota'

export type LobbyPlayer = { id: string; name: string; accountId: number; points: number; wins: number; losses: number; played: number }
export type Encounter = { id: string; name: string; radiant: string[]; dire: string[]; winner: 'radiant' | 'dire' | null; dotaMatchId?: number; importedAt?: string }
export type PlayerMatchStat = { id: string; encounterId: string; playerId: string; heroId: number; kills: number; deaths: number; assists: number; goldPerMin: number; xpPerMin: number; lastHits: number; heroDamage: number; durationSeconds: number; isRadiant: boolean; won: boolean; playedAt: string }

const players: LobbyPlayer[] = [
  { id: '1', name: 'Crisp', accountId: 1000, points: 1280, wins: 42, losses: 19, played: 61 },
  { id: '2', name: 'Kuroky', accountId: 1001, points: 1195, wins: 38, losses: 21, played: 59 },
  { id: '3', name: 'Luna', accountId: 1002, points: 1140, wins: 36, losses: 21, played: 57 },
  { id: '4', name: 'Pudgecito', accountId: 1003, points: 980, wins: 31, losses: 24, played: 55 },
  { id: '5', name: 'Miau', accountId: 1004, points: 920, wins: 29, losses: 24, played: 53 },
  { id: '6', name: 'InvokerMain', accountId: 1005, points: 870, wins: 25, losses: 23, played: 48 },
  { id: '7', name: 'Roshán', accountId: 1006, points: 760, wins: 22, losses: 24, played: 46 },
  { id: '8', name: 'TinyDancer', accountId: 1007, points: 680, wins: 19, losses: 25, played: 44 },
  { id: '9', name: 'Nox', accountId: 1008, points: 640, wins: 18, losses: 23, played: 41 },
  { id: '10', name: 'Sombra', accountId: 1009, points: 590, wins: 16, losses: 24, played: 40 },
]

const encounters: Encounter[] = [
  { id: 'enc-1', name: 'Encuentro 1', radiant: ['1', '3', '4', '5', '7'], dire: ['2', '6', '8', '9', '10'], winner: null },
  { id: 'enc-2', name: 'Encuentro 2', radiant: ['2', '5', '9', '1', '10'], dire: ['3', '4', '6', '7', '8'], winner: null },
]
const stats: PlayerMatchStat[] = []

export async function listEncounters() { return encounters }
export async function listPlayers() { return players }

function applyResult(encounter: Encounter, match: OpenDotaMatch) {
  const winningSide = match.radiant_win ? 'radiant' : 'dire'
  const assignedIds = [...encounter.radiant, ...encounter.dire]
  for (const playerId of assignedIds) {
    const player = players.find((item) => item.id === playerId)
    if (!player) continue
    const won = (winningSide === 'radiant' ? encounter.radiant : encounter.dire).includes(playerId)
    player.played += 1
    player.points += won ? 1 : 0
    player.wins += won ? 1 : 0
    player.losses += won ? 0 : 1
  }
}

export async function importMatch(encounterId: string, matchId: number, force = false) {
  const encounter = encounters.find((item) => item.id === encounterId)
  if (!encounter) throw new Error('ENCOUNTER_NOT_FOUND')
  const match = await getMatch(matchId)
  if (match.players.length !== 10) throw new Error('MATCH_NOT_AVAILABLE')
  if (!force && (encounter.dotaMatchId === matchId || encounters.some((item) => item.id !== encounterId && item.dotaMatchId === matchId))) throw new Error('MATCH_ALREADY_IMPORTED')
  if (force && encounter.dotaMatchId) {
    for (const playerId of [...encounter.radiant, ...encounter.dire]) {
      const player = players.find((item) => item.id === playerId)
      if (!player) continue
      const previous = stats.find((stat) => stat.encounterId === encounterId && stat.playerId === playerId)
      if (previous) {
        player.played = Math.max(0, player.played - 1)
        player.wins = Math.max(0, player.wins - (previous.won ? 1 : 0))
        player.losses = Math.max(0, player.losses - (previous.won ? 0 : 1))
        player.points = Math.max(0, player.points - (previous.won ? 1 : 0))
      }
    }
    for (let index = stats.length - 1; index >= 0; index -= 1) if (stats[index].encounterId === encounterId) stats.splice(index, 1)
  }
  encounter.dotaMatchId = match.match_id
  encounter.importedAt = new Date().toISOString()
  encounter.winner = match.radiant_win ? 'radiant' : 'dire'
  match.players.forEach((matchPlayer, index) => {
    const playerId = players[index]?.id
    if (!playerId) return
    stats.push({ id: `${encounterId}-${playerId}`, encounterId, playerId, heroId: matchPlayer.hero_id, kills: matchPlayer.kills, deaths: matchPlayer.deaths, assists: matchPlayer.assists, goldPerMin: matchPlayer.gold_per_min, xpPerMin: matchPlayer.xp_per_min, lastHits: matchPlayer.last_hits, heroDamage: matchPlayer.hero_damage, durationSeconds: match.duration, isRadiant: isRadiantSlot(matchPlayer.player_slot), won: match.radiant_win === isRadiantSlot(matchPlayer.player_slot), playedAt: new Date(match.start_time * 1000).toISOString() })
  })
  applyResult(encounter, match)
  return encounter
}

export async function markWinner(encounterId: string, winner: 'radiant' | 'dire') {
  const encounter = encounters.find((item) => item.id === encounterId)
  if (!encounter) throw new Error('ENCOUNTER_NOT_FOUND')
  encounter.winner = winner
  const fakeMatch = await getMatch(Date.now())
  fakeMatch.radiant_win = winner === 'radiant'
  applyResult(encounter, fakeMatch)
  return encounter
}

export async function getPlayerMatchStats(playerId: string) { return stats.filter((stat) => stat.playerId === playerId).slice(-20).reverse() }
