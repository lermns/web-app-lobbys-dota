// Gráficas SVG sin dependencias. Escalan con el ancho del contenedor (viewBox) y tienen tamaño propio,
// así que no pueden quedarse en 0 px de alto como pasa con ResponsiveContainer de Recharts.

const W = 600
const H = 180
const PAD = { top: 16, right: 16, bottom: 26, left: 40 }

function scale(values: number[], min = 0) {
  const max = Math.max(...values, min + 1)
  const low = Math.min(min, ...values)
  return { low, max, y: (value: number) => PAD.top + (1 - (value - low) / (max - low)) * (H - PAD.top - PAD.bottom) }
}

export function LineChart({ values, color = 'var(--radiant)', label }: { values: number[]; color?: string; label: string }) {
  if (values.length === 0) return null
  const { low, max, y } = scale(values)
  const innerW = W - PAD.left - PAD.right
  const x = (index: number) => PAD.left + (values.length === 1 ? innerW / 2 : (index / (values.length - 1)) * innerW)
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const area = `${PAD.left},${H - PAD.bottom} ${points} ${x(values.length - 1)},${H - PAD.bottom}`
  const ticks = [low, (low + max) / 2, max]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="chart-svg">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="rgba(210,220,205,.12)" />
          <text x={PAD.left - 8} y={y(tick) + 3} textAnchor="end" fill="#77827b" fontSize="10">{Math.round(tick)}</text>
        </g>
      ))}
      <polygon points={area} fill={color} opacity=".1" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {values.map((value, index) => (
        <g key={index}>
          <circle cx={x(index)} cy={y(value)} r="3.5" fill="#0b100f" stroke={color} strokeWidth="2"><title>{`Partida ${index + 1}: ${value}`}</title></circle>
          <text x={x(index)} y={H - 8} textAnchor="middle" fill="#77827b" fontSize="10">{index + 1}</text>
        </g>
      ))}
    </svg>
  )
}

export function KdaBars({ matches }: { matches: { kills: number; deaths: number; assists: number }[] }) {
  if (matches.length === 0) return null
  const max = Math.max(...matches.flatMap((match) => [match.kills, match.deaths, match.assists]), 1)
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const slot = innerW / matches.length
  const bar = Math.min(10, (slot - 8) / 3)
  const series = [['kills', 'var(--radiant)'], ['deaths', 'var(--dire)'], ['assists', '#7fadd9']] as const
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kills, muertes y asistencias por partida" className="chart-svg">
      {[0, max / 2, max].map((tick) => {
        const ty = PAD.top + (1 - tick / max) * innerH
        return (
          <g key={tick}>
            <line x1={PAD.left} x2={W - PAD.right} y1={ty} y2={ty} stroke="rgba(210,220,205,.12)" />
            <text x={PAD.left - 8} y={ty + 3} textAnchor="end" fill="#77827b" fontSize="10">{Math.round(tick)}</text>
          </g>
        )
      })}
      {matches.map((match, index) => (
        <g key={index} transform={`translate(${PAD.left + index * slot + (slot - bar * 3) / 2},0)`}>
          {series.map(([key, fill], seriesIndex) => {
            const value = match[key]
            const height = (value / max) * innerH
            return <rect key={key} x={seriesIndex * bar} y={PAD.top + innerH - height} width={bar - 1} height={height} fill={fill} opacity=".85"><title>{`Partida ${index + 1} · ${key}: ${value}`}</title></rect>
          })}
          <text x={bar * 1.5} y={H - 8} textAnchor="middle" fill="#77827b" fontSize="10">{index + 1}</text>
        </g>
      ))}
    </svg>
  )
}
