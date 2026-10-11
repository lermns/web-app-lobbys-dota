'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Database, Import, Plus, Save, Shield, Trophy, Users } from 'lucide-react'
import { importMatch, listEncounters, markWinner, type Encounter } from '@/lib/db'

export default function AdminPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [matchIds, setMatchIds] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { void listEncounters().then(setEncounters) }, [])

  async function handleImport(encounterId: string, force = false) {
    const matchId = Number(matchIds[encounterId])
    if (!Number.isSafeInteger(matchId) || matchId < 1) {
      setMessage({ type: 'error', text: 'Introduce un ID de partida válido.' })
      return
    }
    if (force) setMessage(null)
    setBusyId(encounterId)
    try {
      const updated = await importMatch(encounterId, matchId, force)
      setEncounters((current) => current.map((encounter) => encounter.id === updated.id ? { ...updated } : encounter))
      setMessage({ type: 'success', text: `${updated.name} importado. Estadísticas y ranking actualizados.` })
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN'
      if (code === 'MATCH_ALREADY_IMPORTED') {
        const confirmed = window.confirm('Esta partida ya fue importada. ¿Quieres recomputar sus estadísticas y puntos desde cero?')
        if (confirmed) await handleImport(encounterId, true)
      } else if (code === 'MATCH_NOT_AVAILABLE') {
        setMessage({ type: 'error', text: 'OpenDota todavía no tiene esta partida. Puede tardar unos minutos en aparecer.' })
      } else {
        setMessage({ type: 'error', text: 'No se pudo importar la partida. Revisa el ID e inténtalo de nuevo.' })
      }
    } finally {
      setBusyId(null)
    }
  }

  async function handleWinner(encounterId: string, winner: 'radiant' | 'dire') {
    setBusyId(encounterId)
    const updated = await markWinner(encounterId, winner)
    setEncounters((current) => current.map((encounter) => encounter.id === updated.id ? { ...updated } : encounter))
    setMessage({ type: 'success', text: `${updated.name}: ganador marcado y ranking actualizado.` })
    setBusyId(null)
  }

  return <main className="site-shell admin-shell">
    <div className="video-overlay" />
    <nav className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Shield size={17} /></span><span>DOTA <b>LOBBIES</b></span></Link><Link href="/" className="admin-link"><ArrowLeft size={15} /> Volver a lobbys</Link></nav>
    <section className="admin-content">
      <div className="eyebrow"><span className="live-dot" /> PANEL DE CONTROL <span className="rule" /> ADMINISTRACIÓN</div>
      <div className="page-title-row"><div><h1>Admin</h1><p>Importa partidas oficiales y gestiona los resultados de tus lobbys.</p></div><span className="admin-status"><i /> Sesión de administrador</span></div>
      {message && <div className={`admin-notice ${message.type}`} role="status">{message.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}<span>{message.text}</span>{message.type === 'error' && message.text.includes('unos minutos') && <button onClick={() => setMessage(null)}>Reintentar</button>}</div>}
      <div className="admin-grid">
        <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow-small">NUEVO LOBBY</span><h2>Crear lobby</h2></div><Clock3 size={20} /></div><div className="admin-form-grid"><label>Título<input placeholder="Lobby de hoy" /></label><label>Fecha y hora<input type="datetime-local" /></label></div><button className="admin-button"><Save size={15} /> Guardar lobby</button></section>
        <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow-small">DATOS</span><h2>Fuente de estadísticas</h2></div><Database size={20} /></div><p className="admin-muted">Las gráficas de los perfiles usan únicamente partidas importadas de estos lobbys. OpenDota solo aporta los datos de la partida y héroes.</p><div className="data-pill"><i /> Supabase preparado · OpenDota preparado</div></section>
      </div>
      <section className="admin-card results-card"><div className="admin-card-heading"><div><span className="eyebrow-small">IMPORTACIÓN DE PARTIDAS</span><h2>Encuentros</h2></div><Import size={20} /></div><p className="admin-muted">Introduce el ID de Dota cuando la partida esté disponible en OpenDota. La importación actualiza el ganador, puntos, victorias, derrotas y estadísticas de cada jugador.</p><div className="admin-encounters">{encounters.map((encounter) => <div className="admin-encounter expanded" key={encounter.id}><div className="encounter-copy"><strong>{encounter.name}</strong><span>{encounter.dotaMatchId ? `Partida ${encounter.dotaMatchId} · importada` : 'Pendiente de importar'}</span></div><span className={encounter.dotaMatchId ? 'imported-badge' : 'pending-badge'}>{encounter.dotaMatchId ? 'Importado' : 'Pendiente'}</span><div className="import-row"><label htmlFor={`match-${encounter.id}`}>ID de la partida de Dota<input id={`match-${encounter.id}`} inputMode="numeric" placeholder="Ej. 8123456789" value={matchIds[encounter.id] ?? ''} onChange={(event) => setMatchIds((current) => ({ ...current, [encounter.id]: event.target.value }))} /></label><button className="admin-button" disabled={busyId === encounter.id} onClick={() => void handleImport(encounter.id)}><Import size={15} /> {busyId === encounter.id ? 'Importando…' : 'Importar partida'}</button></div><div className="winner-actions"><span>Fallback manual:</span><button disabled={busyId === encounter.id} onClick={() => void handleWinner(encounter.id, 'radiant')}>Radiant ganador</button><button disabled={busyId === encounter.id} onClick={() => void handleWinner(encounter.id, 'dire')}>Dire ganador</button></div></div>)}</div><button className="admin-button secondary"><Plus size={15} /> Añadir encuentro</button></section>
      <section className="admin-card results-card"><div className="admin-card-heading"><div><span className="eyebrow-small">SEGURIDAD DE IMPORTACIÓN</span><h2>Operaciones seguras</h2></div><Trophy size={20} /></div><p className="admin-muted">La implementación mock mantiene interfaces listas para sustituir por una ruta de servidor y una función RPC transaccional en Supabase, incluyendo el recálculo idempotente de puntos.</p></section>
    </section>
  </main>
}
