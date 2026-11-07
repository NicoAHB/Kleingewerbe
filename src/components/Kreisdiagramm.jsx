import { useState } from 'react'
import { euro } from '../lib/format.js'

const R = 74
const STRICH = 26
const UMFANG = 2 * Math.PI * R
const LUECKE = 2.5 // Abstand zwischen Segmenten in px

/**
 * Kreisdiagramm (Ring) mit Legende.
 * daten: [{ id, name, wert (Cent), farbe (CSS-Farbe), symbol }]
 */
export function Kreisdiagramm({ daten, titelMitte = 'Gesamt' }) {
  const [auswahl, setAuswahl] = useState(null)
  const gesamt = daten.reduce((s, d) => s + d.wert, 0)
  if (gesamt <= 0) return null

  let versatz = 0
  const segmente = daten.map((d) => {
    const laenge = (d.wert / gesamt) * UMFANG
    const seg = { ...d, laenge, versatz }
    versatz += laenge
    return seg
  })
  const gewaehlt = daten.find((d) => d.id === auswahl)
  const prozent = (wert) => Math.round((wert / gesamt) * 100)
  const umschalten = (id) => setAuswahl((a) => (a === id ? null : id))

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative w-[200px] max-w-full shrink-0">
        <svg viewBox="0 0 200 200" className="block h-auto w-full" role="img" aria-label="Kosten nach Kategorie">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--surface-2)" strokeWidth={STRICH} />
          <g transform="rotate(-90 100 100)">
            {segmente.map((s) => {
              const sichtbar = segmente.length > 1 ? Math.max(s.laenge - LUECKE, 0.5) : s.laenge
              const gedimmt = auswahl && auswahl !== s.id
              return (
                <circle
                  key={s.id}
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  stroke={s.farbe}
                  strokeWidth={auswahl === s.id ? STRICH + 6 : STRICH}
                  strokeDasharray={`${sichtbar} ${UMFANG - sichtbar}`}
                  strokeDashoffset={-s.versatz}
                  opacity={gedimmt ? 0.3 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 150ms, stroke-width 150ms' }}
                  onClick={() => umschalten(s.id)}
                >
                  <title>{`${s.name}: ${euro(s.wert)} (${prozent(s.wert)} %)`}</title>
                </circle>
              )
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <span className="line-clamp-2 text-[12px] leading-tight text-ink-2">{gewaehlt ? gewaehlt.name : titelMitte}</span>
          <span className="zahl mt-0.5 font-display text-[19px] font-semibold">{euro(gewaehlt ? gewaehlt.wert : gesamt)}</span>
          {gewaehlt && <span className="zahl text-[12px] text-ink-3">{prozent(gewaehlt.wert)} %</span>}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1">
        {daten.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => umschalten(d.id)}
              aria-pressed={auswahl === d.id}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[14px] ${
                auswahl === d.id ? 'bg-surface-2' : ''
              } ${auswahl && auswahl !== d.id ? 'opacity-55' : ''}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.farbe }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{d.name}</span>
              <span className="zahl shrink-0 text-ink-3">{prozent(d.wert)} %</span>
              <span className="zahl w-[84px] shrink-0 text-right font-medium">{euro(d.wert)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
