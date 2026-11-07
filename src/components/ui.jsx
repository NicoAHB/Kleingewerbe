import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { IconSchliessen } from './Icons.jsx'
import { farbVariable } from '../lib/kategorien.js'
import { euro } from '../lib/format.js'

let offeneBlaetter = 0

function useScrollSperre() {
  useEffect(() => {
    offeneBlaetter += 1
    document.body.style.overflow = 'hidden'
    return () => {
      offeneBlaetter -= 1
      if (offeneBlaetter === 0) document.body.style.overflow = ''
    }
  }, [])
}

function useEscape(onSchliessen) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onSchliessen?.()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSchliessen])
}

/** Blatt, das von unten hereinfährt. fusszeile bleibt unten sichtbar (z. B. Speichern). */
export function Blatt({ titel, onSchliessen, children, fusszeile, voll = false, kopfAktion }) {
  const titelId = useId()
  useScrollSperre()
  useEscape(onSchliessen)
  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby={titelId}>
      <div className="scrim-animation absolute inset-0 bg-scrim" onClick={onSchliessen} />
      <div
        className={`blatt-animation relative mx-auto flex w-full max-w-xl flex-col rounded-t-[22px] bg-bg shadow-2xl ${
          voll ? 'h-[94dvh]' : 'max-h-[92dvh]'
        }`}
      >
        <div className="gutter flex items-center gap-3 pt-3 pb-2">
          <h2 id={titelId} className="min-w-0 flex-1 truncate font-display text-[19px] font-semibold">
            {titel}
          </h2>
          {kopfAktion}
          <button
            type="button"
            onClick={onSchliessen}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 active:scale-95"
            aria-label="Schließen"
          >
            <IconSchliessen size={20} />
          </button>
        </div>
        <div className="gutter min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">{children}</div>
        {fusszeile && (
          <div
            className="gutter border-t border-line bg-bg pt-3"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
          >
            {fusszeile}
          </div>
        )}
        {!fusszeile && <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />}
      </div>
    </div>,
    document.body,
  )
}

/** Rückfrage vor endgültigen Aktionen (ersetzt window.confirm) */
export function Rueckfrage({ titel, text, bestaetigen = 'Löschen', onBestaetigen, onAbbrechen, gefaehrlich = true }) {
  const titelId = useId()
  useScrollSperre()
  useEscape(onAbbrechen)
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-6" role="alertdialog" aria-modal="true" aria-labelledby={titelId}>
      <div className="scrim-animation absolute inset-0 bg-scrim" onClick={onAbbrechen} />
      <div className="blatt-animation relative w-full max-w-sm rounded-[20px] bg-surface p-5 shadow-2xl">
        <h2 id={titelId} className="font-display text-[18px] font-semibold">
          {titel}
        </h2>
        {text && <p className="mt-2 text-[15px] text-ink-2">{text}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onAbbrechen} className="h-12 rounded-xl bg-surface-2 font-medium" autoFocus>
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onBestaetigen}
            className={`h-12 rounded-xl font-semibold ${gefaehrlich ? 'bg-danger text-on-accent' : 'bg-accent text-on-accent'}`}
          >
            {bestaetigen}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function KategorieSymbol({ kategorie, groesse = 40 }) {
  const farbe = farbVariable(kategorie?.farbe)
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: groesse,
        height: groesse,
        fontSize: groesse * 0.46,
        background: `color-mix(in srgb, ${farbe} 16%, var(--surface))`,
        boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${farbe} 45%, transparent)`,
      }}
      aria-hidden="true"
    >
      {kategorie?.symbol || '•'}
    </span>
  )
}

/** Betrag mit Vorzeichen-Farbe: Einnahmen grün, Ausgaben rot-orange */
export function Betrag({ art, cent, className = '' }) {
  const istEinnahme = art === 'einnahme'
  return (
    <span className={`zahl whitespace-nowrap ${istEinnahme ? 'text-income' : 'text-expense'} ${className}`}>
      {istEinnahme ? '+' : '−'}
      {' '}
      {euro(cent)}
    </span>
  )
}

export function LeererZustand({ symbol, titel, text, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {symbol && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">{symbol}</div>
      )}
      <p className="font-display text-[18px] font-semibold">{titel}</p>
      {text && <p className="mt-1.5 max-w-[30ch] text-[15px] text-ink-2">{text}</p>}
      {children}
    </div>
  )
}

export function Meldung({ text }) {
  if (!text) return null
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
      role="status"
    >
      <div className="blatt-animation rounded-full bg-ink px-4 py-2.5 text-[15px] font-medium text-bg shadow-lg">{text}</div>
    </div>,
    document.body,
  )
}

export function Abschnitt({ titel, aktion, children, className = '' }) {
  return (
    <section className={className}>
      {(titel || aktion) && (
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-3">{titel}</h2>
          {aktion}
        </div>
      )}
      {children}
    </section>
  )
}
