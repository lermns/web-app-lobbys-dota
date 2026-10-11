import { Trophy } from 'lucide-react'
import { RankingTable } from '@/components/ranking-table'
import { SiteNav } from '@/components/site-nav'
import { listPlayers } from '@/lib/db'

export const metadata = { title: 'Ranking | Dota Lobbies' }

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  const players = await listPlayers()
  return (
    <main className="site-shell">
      <div className="video-overlay" />
      <SiteNav />
      <div className="content-grid single">
        <section className="main-column">
          <div className="eyebrow"><span className="live-dot" /> CLASIFICACIÓN <span className="rule" /> TEMPORADA 04</div>
          <div className="page-title-row">
            <div><h1>Ranking</h1><p>Un punto por cada encuentro ganado en los lobbys.</p></div>
            <Trophy size={34} className="trophy-icon" />
          </div>
          <RankingTable players={players} />
        </section>
      </div>
    </main>
  )
}
