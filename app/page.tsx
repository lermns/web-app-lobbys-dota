import Link from 'next/link'
import { ChevronRight, Clock3, Trophy, Users } from 'lucide-react'
import { SiteNav } from '@/components/site-nav'
import { listEncounters, listPlayers, type Encounter, type LobbyPlayer } from '@/lib/db'

type Team = { name: string; players: LobbyPlayer[] }

function TeamPanel({ side, team, winner }: { side: 'radiant' | 'dire'; team: Team; winner: boolean }) {
  const isRadiant = side === 'radiant'
  return (
    <div className={`team-panel ${side} ${winner ? 'winner' : ''}`}>
      <div className="team-heading">
        <div><span className="side-label">{isRadiant ? 'RADIANT' : 'DIRE'}</span><h3>{team.name}</h3></div>
        {winner && <span className="winner-badge"><Trophy size={12} /> GANADOR</span>}
      </div>
      <div className="player-list">
        {team.players.map((player) => (
          <Link href={`/jugador/${player.accountId}`} key={player.id} className="player-row">
            <span className="player-avatar">{player.name.slice(0, 2).toUpperCase()}</span>
            <span>{player.name}</span>
            <ChevronRight size={14} />
          </Link>
        ))}
      </div>
    </div>
  )
}

function EncounterCard({ encounter, byId, index }: { encounter: Encounter; byId: Map<string, LobbyPlayer>; index: number }) {
  const team = (name: string, ids: string[]): Team => ({ name, players: ids.flatMap((id) => byId.get(id) ?? []) })
  return (
    <article className="encounter-card fade-in" style={{ animationDelay: `${index * 90}ms` }}>
      <div className="encounter-meta"><span>{encounter.name}</span><span><Clock3 size={14} /> {encounter.time}</span></div>
      <div className="teams-wrap">
        <TeamPanel side="radiant" team={team(encounter.radiantName, encounter.radiant)} winner={encounter.winner === 'radiant'} />
        <div className="versus">VS</div>
        <TeamPanel side="dire" team={team(encounter.direName, encounter.dire)} winner={encounter.winner === 'dire'} />
      </div>
    </article>
  )
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [encounters, players] = await Promise.all([listEncounters(), listPlayers()])
  const byId = new Map(players.map((player) => [player.id, player]))
  const next = encounters.find((encounter) => !encounter.winner) ?? encounters[0]
  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="site-shell">
      <video className="background-video" autoPlay muted loop playsInline poster="/placeholder.jpg"><source src="/bg/dota-menu.webm" type="video/webm" /></video>
      <div className="video-overlay" />
      <SiteNav />
      <div className="content-grid single">
        <section className="main-column">
          <div className="eyebrow"><span className="live-dot" /> TEMPORADA 04 <span className="rule" /> COMUNIDAD</div>
          <div className="page-title-row">
            <div><h1>Lobbys</h1><p>Partidas de hoy <span>·</span> {today}</p></div>
            {next && <div className="next-lobby"><span>PRÓXIMO LOBBY</span><strong>{next.time}</strong></div>}
          </div>
          <div className="encounters">
            {encounters.map((encounter, index) => <EncounterCard key={encounter.id} encounter={encounter} byId={byId} index={index} />)}
            {encounters.length === 0 && <p className="empty-state">Todavía no hay lobbys programados para hoy.</p>}
          </div>
        </section>
      </div>
      <footer><span><Users size={14} /> {players.length} jugadores registrados</span><span className="status"><i /> SERVIDOR ONLINE</span></footer>
    </main>
  )
}
