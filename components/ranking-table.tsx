'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { LobbyPlayer } from '@/lib/db'

/** `players` llega ya ordenado por puntos; la posición se calcula sobre la lista completa, no sobre el filtro. */
export function RankingTable({ players }: { players: LobbyPlayer[] }) {
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return players
      .map((player, index) => ({ player, position: index + 1 }))
      .filter(({ player }) => !term || player.name.toLowerCase().includes(term) || String(player.accountId).includes(term))
  }, [players, query])

  return (
    <div>
      <div className="search-box ranking-search">
        <Search size={16} />
        <input aria-label="Buscar jugador" placeholder="Buscar por nickname o ID de Dota…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="table-scroll">
        <table className="ranking-table">
          <thead>
            <tr><th>#</th><th>Jugador</th><th>Medalla</th><th className="num">Puntos</th><th className="num">Jugadas</th><th className="num">Victorias</th><th className="num">Derrotas</th><th className="num">% Victorias</th></tr>
          </thead>
          <tbody>
            {rows.map(({ player, position }) => (
              <tr key={player.id} className={position <= 3 ? `podium podium-${position}` : undefined}>
                <td className="position">{String(position).padStart(2, '0')}</td>
                <td><Link href={`/jugador/${player.accountId}`} className="ranking-player"><span className={`rank-avatar ${player.rank}`}>{player.name.slice(0, 2).toUpperCase()}</span><span><b>{player.name}</b><small>ID {player.accountId}</small></span></Link></td>
                <td>{player.medal}</td>
                <td className="num strong">{player.points.toLocaleString('es-ES')}</td>
                <td className="num">{player.played}</td>
                <td className="num">{player.wins}</td>
                <td className="num">{player.losses}</td>
                <td className="num">{player.played ? Math.round((player.wins / player.played) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty-state">Ningún jugador coincide con “{query}”.</p>}
      </div>
    </div>
  )
}
