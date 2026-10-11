'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Shield, Swords, Trophy, Users, ChevronRight, Clock3, CircleUserRound } from 'lucide-react'

const players = [
  { id: '1', name: 'Crisp', points: 1280, wins: 42, played: 61, medal: 'Ancient V', rank: 'ancient', avatar: 'CR' },
  { id: '2', name: 'Kuroky', points: 1195, wins: 38, played: 59, medal: 'Legend IV', rank: 'legend', avatar: 'KU' },
  { id: '3', name: 'Luna', points: 1140, wins: 36, played: 57, medal: 'Legend III', rank: 'legend', avatar: 'LU' },
  { id: '4', name: 'Pudgecito', points: 980, wins: 31, played: 55, medal: 'Archon V', rank: 'archon', avatar: 'PU' },
  { id: '5', name: 'Miau', points: 920, wins: 29, played: 53, medal: 'Archon IV', rank: 'archon', avatar: 'MI' },
  { id: '6', name: 'InvokerMain', points: 870, wins: 25, played: 48, medal: 'Archon II', rank: 'archon', avatar: 'IN' },
  { id: '7', name: 'Roshán', points: 760, wins: 22, played: 46, medal: 'Guardian V', rank: 'guardian', avatar: 'RO' },
  { id: '8', name: 'TinyDancer', points: 680, wins: 19, played: 44, medal: 'Guardian III', rank: 'guardian', avatar: 'TI' },
]

const encounters = [
  { title: 'Encuentro 1', time: '21:00', radiant: { name: 'Los Ancianos', players: ['Crisp', 'Luna', 'Pudgecito', 'Miau', 'Roshán'] }, dire: { name: 'Los Errantes', players: ['Kuroky', 'InvokerMain', 'TinyDancer', 'Nox', 'Sombra'] }, winner: 'radiant' },
  { title: 'Encuentro 2', time: '21:45', radiant: { name: 'Guardia del Alba', players: ['Kuroky', 'Miau', 'Nox', 'Crisp', 'Sombra'] }, dire: { name: 'Orden del Vacío', players: ['Luna', 'Pudgecito', 'InvokerMain', 'Roshán', 'TinyDancer'] }, winner: null },
]

function TeamPanel({ side, team, winner }: { side: 'radiant' | 'dire'; team: { name: string; players: string[] }; winner: boolean }) {
  const isRadiant = side === 'radiant'
  return <div className={`team-panel ${side} ${winner ? 'winner' : ''}`}>
    <div className="team-heading">
      <div><span className="side-label">{isRadiant ? 'RADIANT' : 'DIRE'}</span><h3>{team.name}</h3></div>
      {winner && <span className="winner-badge"><Trophy size={12} /> GANADOR</span>}
    </div>
    <div className="player-list">{team.players.map((player) => <Link href={`/jugador/${player.toLowerCase()}`} key={player} className="player-row"><span className="player-avatar">{player.slice(0, 2).toUpperCase()}</span><span>{player}</span><ChevronRight size={14} /></Link>)}</div>
  </div>
}

function Encounter({ encounter, index }: { encounter: typeof encounters[number]; index: number }) {
  return <article className="encounter-card fade-in" style={{ animationDelay: `${index * 90}ms` }}>
    <div className="encounter-meta"><span>{encounter.title}</span><span><Clock3 size={14} /> {encounter.time}</span></div>
    <div className="teams-wrap"><TeamPanel side="radiant" team={encounter.radiant} winner={encounter.winner === 'radiant'} /><div className="versus">VS</div><TeamPanel side="dire" team={encounter.dire} winner={encounter.winner === 'dire'} /></div>
  </article>
}

export default function Page() {
  const [query, setQuery] = useState('')
  const filteredPlayers = useMemo(() => players.filter((player) => player.name.toLowerCase().includes(query.toLowerCase())), [query])
  return <main className="site-shell">
    <video className="background-video" autoPlay muted loop playsInline poster="/placeholder.jpg"><source src="/bg/dota-menu.webm" type="video/webm" /></video><div className="video-overlay" />
    <nav className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Swords size={17} /></span><span>DOTA <b>LOBBIES</b></span></Link><div className="nav-links"><a className="active" href="#lobbys">Lobbys</a><a href="#ranking">Ranking</a></div><Link href="/admin" className="admin-link"><Shield size={15} /> Admin</Link></nav>
    <div className="content-grid">
      <section className="main-column" id="lobbys"><div className="eyebrow"><span className="live-dot" /> TEMPORADA 04 <span className="rule" /> COMUNIDAD</div><div className="page-title-row"><div><h1>Lobbys</h1><p>Partidas de hoy <span>·</span> 24 de octubre, 2024</p></div><div className="next-lobby"><span>PRÓXIMO LOBBY</span><strong>21:00</strong></div></div><div className="encounters">{encounters.map((encounter, index) => <Encounter key={encounter.title} encounter={encounter} index={index} />)}</div></section>
      <aside className="ranking-panel" id="ranking"><div className="panel-heading"><div><span className="eyebrow-small">CLASIFICACIÓN</span><h2>Ranking</h2></div><Trophy size={20} /></div><div className="search-box"><Search size={16} /><input aria-label="Buscar jugador" placeholder="Buscar jugador..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="ranking-list">{filteredPlayers.map((player, index) => <Link href={`/jugador/${player.id}`} className="rank-row" key={player.id}><span className="position">{String(index + 1).padStart(2, '0')}</span><span className={`rank-avatar ${player.rank}`}>{player.avatar}</span><span className="rank-name"><b>{player.name}</b><small>{player.medal}</small></span><span className="rank-points">{player.points.toLocaleString('es-ES')} <small>PTS</small></span></Link>)}</div><Link href="/ranking" className="all-ranking">Ver ranking completo <ChevronRight size={15} /></Link></aside>
    </div>
    <footer><span><Users size={14} /> 42 jugadores registrados</span><span>Actualizado hace 8 min</span><span className="status"><i /> SERVIDOR ONLINE</span></footer>
  </main>
}
