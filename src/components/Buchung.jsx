import { useEffect, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { datum as fmtDatum, euro } from '../lib/format.js'
import { Betrag, Blatt, KategorieSymbol, Rueckfrage } from './ui.jsx'
import { BelegAnsicht, BelegKachel } from './BelegAnzeige.jsx'
import { Erfassung } from './Erfassung.jsx'
import { IconBeleg, IconMuell, IconStift } from './Icons.jsx'

/** Eine Zeile in Listen */
export function BuchungZeile({ buchung, onClick }) {
  const { kategorienById, belegeNachBuchung } = useApp()
  const kategorie = kategorienById[buchung.kategorie_id]
  const hatBeleg = (belegeNachBuchung[buchung.id] || []).length > 0
  const titel = buchung.anbieter_quelle || kategorie?.name || (buchung.art === 'einnahme' ? 'Einnahme' : 'Ausgabe')
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-surface-2"
    >
      <KategorieSymbol kategorie={kategorie} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium">{titel}</span>
        <span className="flex items-center gap-1 truncate text-[13px] text-ink-2">
          <span className="truncate">{kategorie?.name ?? 'Ohne Kategorie'}</span>
          <span aria-hidden="true">·</span>
          <span className="zahl shrink-0">{fmtDatum(buchung.datum)}</span>
          {hatBeleg && (
            <span className="ml-0.5 shrink-0 text-ink-3" title="Beleg vorhanden">
              <IconBeleg size={14} />
              <span className="sr-only">Beleg vorhanden</span>
            </span>
          )}
        </span>
      </span>
      <Betrag art={buchung.art} cent={buchung.betrag_cent} className="text-[16px] font-semibold" />
    </button>
  )
}

function GespeicherteKachel({ beleg, onAnsehen }) {
  const { belegDatei } = useApp()
  const [blob, setBlob] = useState(null)
  useEffect(() => {
    belegDatei(beleg.id).then(setBlob)
  }, [beleg.id, belegDatei])
  return <BelegKachel blob={blob} typ={beleg.dateityp} name={beleg.dateiname} onClick={() => onAnsehen(beleg, blob)} />
}

/** Detailansicht mit Belegen, Bearbeiten und Löschen */
export function BuchungDetail({ buchungId, onSchliessen }) {
  const { buchungen, kategorienById, belegeNachBuchung, buchungLoeschen, zeigeMeldung } = useApp()
  const [bearbeiten, setBearbeiten] = useState(false)
  const [loeschenFragen, setLoeschenFragen] = useState(false)
  const [ansicht, setAnsicht] = useState(null)

  const buchung = buchungen.find((b) => b.id === buchungId)
  if (!buchung) return null

  const kategorie = kategorienById[buchung.kategorie_id]
  const belege = belegeNachBuchung[buchung.id] || []
  const istEinnahme = buchung.art === 'einnahme'
  const artName = istEinnahme ? 'Einnahme' : 'Ausgabe'

  async function loeschen() {
    await buchungLoeschen(buchung.id)
    zeigeMeldung(`${artName} gelöscht`)
    onSchliessen()
  }

  const zeilen = [
    ['Datum', fmtDatum(buchung.datum)],
    [istEinnahme ? 'Auszahlung von' : 'Anbieter', buchung.anbieter_quelle || '–'],
    [istEinnahme ? 'Quelle' : 'Kategorie', kategorie?.name ?? 'Ohne Kategorie'],
  ]

  return (
    <Blatt titel={artName} onSchliessen={onSchliessen}>
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex items-center gap-3.5 rounded-2xl bg-surface p-4">
          <KategorieSymbol kategorie={kategorie} groesse={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] text-ink-2">{buchung.anbieter_quelle || kategorie?.name}</p>
            <p className={`zahl font-display text-[30px] leading-tight font-semibold ${istEinnahme ? 'text-income' : 'text-expense'}`}>
              {istEinnahme ? '+' : '−'}
              {' '}
              {euro(buchung.betrag_cent)}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-line rounded-2xl bg-surface">
          {zeilen.map(([name, wert]) => (
            <div key={name} className="flex justify-between gap-4 px-4 py-3 text-[15px]">
              <dt className="text-ink-2">{name}</dt>
              <dd className="zahl min-w-0 text-right font-medium break-words">{wert}</dd>
            </div>
          ))}
          {buchung.notiz && (
            <div className="px-4 py-3 text-[15px]">
              <dt className="text-ink-2">Notiz</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{buchung.notiz}</dd>
            </div>
          )}
        </dl>

        <div>
          <h3 className="mb-2 px-1 text-[14px] font-medium text-ink-2">
            {belege.length === 0 ? 'Kein Beleg angehängt' : belege.length === 1 ? '1 Beleg' : `${belege.length} Belege`}
          </h3>
          {belege.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {belege.map((b) => (
                <GespeicherteKachel key={b.id} beleg={b} onAnsehen={(beleg, blob) => setAnsicht({ beleg, blob })} />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <button
            type="button"
            onClick={() => setBearbeiten(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-soft font-semibold text-accent"
          >
            <IconStift size={18} /> Bearbeiten
          </button>
          <button
            type="button"
            onClick={() => setLoeschenFragen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-danger-soft font-semibold text-danger"
          >
            <IconMuell size={18} /> Löschen
          </button>
        </div>
      </div>

      {bearbeiten && <Erfassung art={buchung.art} buchung={buchung} onSchliessen={() => setBearbeiten(false)} />}
      {ansicht && <BelegAnsicht beleg={ansicht.beleg} blob={ansicht.blob} onSchliessen={() => setAnsicht(null)} />}
      {loeschenFragen && (
        <Rueckfrage
          titel={`${artName} löschen?`}
          text={`${buchung.anbieter_quelle || kategorie?.name || artName} über ${euro(buchung.betrag_cent)} vom ${fmtDatum(
            buchung.datum,
          )}${belege.length ? ` und ${belege.length === 1 ? 'der Beleg werden' : `${belege.length} Belege werden`}` : ' wird'} endgültig gelöscht.`}
          onBestaetigen={loeschen}
          onAbbrechen={() => setLoeschenFragen(false)}
        />
      )}
    </Blatt>
  )
}
