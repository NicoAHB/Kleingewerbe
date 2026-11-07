import { useEffect, useState } from 'react'
import { Blatt } from './ui.jsx'
import { IconPdf } from './Icons.jsx'
import { dateiGroesse } from '../lib/format.js'

/** Erzeugt eine temporäre Adresse für einen Blob und räumt sie wieder auf */
export function useBlobUrl(blob) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!blob) return setUrl(null)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export function istBild(typ) {
  return typ?.startsWith('image/')
}

/** Kleine Vorschau-Kachel für Bild oder PDF */
export function BelegKachel({ blob, typ, name, onClick, children }) {
  const url = useBlobUrl(istBild(typ) ? blob : null)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="grid h-24 w-20 place-items-center overflow-hidden rounded-xl border border-line bg-surface"
        aria-label={`Beleg ${name} ansehen`}
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-ink-2">
            <IconPdf size={26} />
            <span className="text-[11px] font-semibold tracking-wide">PDF</span>
          </span>
        )}
      </button>
      {children}
    </div>
  )
}

/** Vollansicht eines Belegs */
export function BelegAnsicht({ beleg, blob, onSchliessen }) {
  const url = useBlobUrl(blob)
  const bild = istBild(beleg.dateityp)
  return (
    <Blatt titel={beleg.dateiname} onSchliessen={onSchliessen} voll>
      {!url && <p className="py-10 text-center text-ink-2">Beleg wird geladen …</p>}
      {url && bild && (
        <img src={url} alt={`Beleg ${beleg.dateiname}`} className="mx-auto max-h-full rounded-xl bg-surface" />
      )}
      {url && !bild && (
        <div className="flex h-full flex-col gap-3">
          <iframe title={beleg.dateiname} src={url} className="min-h-[60dvh] w-full flex-1 rounded-xl border border-line bg-surface" />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center rounded-xl bg-accent-soft font-semibold text-accent"
          >
            PDF in neuem Fenster öffnen
          </a>
        </div>
      )}
      {url && <p className="mt-3 text-center text-[13px] text-ink-3">{dateiGroesse(beleg.groesse)}</p>}
    </Blatt>
  )
}
