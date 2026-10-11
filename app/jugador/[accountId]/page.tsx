import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KdaBars, LineChart } from '@/components/charts'
import { SiteNav } from '@/components/site-nav'
import { getPlayerByAccountId, getPlayerMatchStats } from '@/lib/db'
import { getHeroConstants } from '@/lib/opendota'

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0)
const format = (value: number, digits = 0) => value.toLocaleString('es-ES', { maximumFractionDigits: digits, minimumFractionDigits: digits })

export default async function PlayerPage({ params }: { params: Promise<{ accountId: string }> }) {
  // En Next 15+ `params` es una promesa: sin await, accountId llega vacío.
  const { accountId } = await params
  const player = /^\d+$/.test(accountId) ? await getPlayerByAccountId(Number(accountId)) : null

  if (!player) {
    return (
      <main className="site-shell">
        <div className="video-overlay" />
        <SiteNav />
        <div className="content-grid single">
          <section className="main-column profile-missing">
            <h1>Jugador no encontrado</h1>
            <p className="empty-state">No hay ningún jugador con el ID “{accountId}”.</p>
            <Link href="/ranking" className="all-ranking"><ArrowLeft size={15} /> Volver al ranking</Link>
          </section>
        </div>
      </main>
    )
  }

  const [recent, heroes] = await Promise.all([getPlayerMatchStats(player.id), getHeroConstants()])
  const chronological = [...recent].reverse()
  const heroById = new Map(heroes.map((hero) => [hero.id, hero]))
  const winRate = player.played ? Math.round((player.wins / player.played) * 100) : 0

  const topHeroes = [...recent.reduce((map, match) => {
    const entry = map.get(match.heroId) ?? { heroId: match.heroId, games: 0, wins: 0 }
    entry.games += 1
    entry.wins += match.won ? 1 : 0
    return map.set(match.heroId, entry)
  }, new Map<number, { heroId: number; games: number; wins: number }>()).values()].sort((a, b) => b.games - a.games).slice(0, 5)

  const keyStats = [
    ['Puntos', format(player.points)], ['Lobbys jugados', format(player.played)], ['Victorias', format(player.wins)],
    ['Derrotas', format(player.losses)], ['% victorias', `${winRate}%`],
  ]

  return (
    <main className="site-shell">
      <div className="video-overlay" />
      <SiteNav />
      <div className="content-grid single profile">
        <Link href="/ranking" className="all-ranking back-link"><ArrowLeft size={15} /> Volver al ranking</Link>

        <div className="profile-photo-wrap">
          {player.avatarUrl
            ? <img className="profile-photo" src={player.avatarUrl} alt={`Avatar de ${player.name}`} width={160} height={160} />
            : <div className={`profile-photo rank-avatar ${player.rank}`} aria-label={`Avatar de ${player.name}`}>{player.name.slice(0, 2).toUpperCase()}</div>}
        </div>

        <section className="profile-card">
          <span className="eyebrow-small">JUGADOR · ID {player.accountId}</span>
          <h1>{player.name}</h1>
          <p className="profile-medal"><span className={`rank-dot ${player.rank}`} /> {player.medal}</p>
          <dl className="key-stats">{keyStats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section>

        <section className="profile-section">
          <div className="section-heading"><span className="eyebrow-small">RENDIMIENTO RECIENTE</span><h2>Últimas {recent.length} partidas de lobby</h2></div>
          {recent.length === 0 ? (
            <p className="empty-state">Este jugador todavía no tiene partidas de lobby importadas.</p>
          ) : (
            <>
              <div className="chart-grid">
                <article className="chart-card"><header><h3>Oro por minuto (GPM)</h3><strong>{format(average(recent.map((m) => m.goldPerMin)))} <small>media</small></strong></header><LineChart values={chronological.map((m) => m.goldPerMin)} label="Oro por minuto por partida" /></article>
                <article className="chart-card"><header><h3>Experiencia por minuto (XPM)</h3><strong>{format(average(recent.map((m) => m.xpPerMin)))} <small>media</small></strong></header><LineChart values={chronological.map((m) => m.xpPerMin)} color="#7fadd9" label="Experiencia por minuto por partida" /></article>
                <article className="chart-card wide"><header><h3>K / D / A por partida</h3><strong>{format(average(recent.map((m) => m.kills)), 1)} / {format(average(recent.map((m) => m.deaths)), 1)} / {format(average(recent.map((m) => m.assists)), 1)} <small>media</small></strong></header><KdaBars matches={chronological} /><p className="legend"><span className="k">Kills</span><span className="d">Muertes</span><span className="a">Asistencias</span></p></article>
              </div>

              <div className="profile-columns">
                <article className="chart-card">
                  <header><h3>Héroes más jugados</h3></header>
                  <ul className="hero-list">
                    {topHeroes.map((entry) => {
                      const hero = heroById.get(entry.heroId)
                      return (
                        <li key={entry.heroId}>
                          {hero ? <img src={hero.img} alt="" width={44} height={25} /> : <span className="hero-fallback" />}
                          <span className="hero-name">{hero?.localized_name ?? `Héroe #${entry.heroId}`}</span>
                          <span className="hero-bar"><i style={{ width: `${(entry.wins / entry.games) * 100}%` }} /></span>
                          <span className="hero-meta">{entry.games} {entry.games === 1 ? 'partida' : 'partidas'} · {Math.round((entry.wins / entry.games) * 100)}%</span>
                        </li>
                      )
                    })}
                  </ul>
                </article>

                <article className="chart-card">
                  <header><h3>Partidas recientes</h3></header>
                  <ul className="match-list">
                    {recent.slice(0, 8).map((match) => (
                      <li key={match.id}>
                        <span className={match.won ? 'result win' : 'result loss'}>{match.won ? 'Victoria' : 'Derrota'}</span>
                        <span>{heroById.get(match.heroId)?.localized_name ?? `Héroe #${match.heroId}`}</span>
                        <span className="kda">{match.kills}/{match.deaths}/{match.assists}</span>
                        <span className="muted">{Math.round(match.durationSeconds / 60)} min · {new Date(match.playedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
