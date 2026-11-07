import { useMemo } from 'react'
import { useApp, kategorienDerArt } from '../lib/store.jsx'
import { euro, MONATE, monatsName } from '../lib/format.js'
import { filterBuchungen, nachMonatGruppieren, sortiereNeuesteZuerst, verfuegbareJahre } from '../lib/auswertung.js'
import { LeererZustand } from '../components/ui.jsx'
import { BuchungZeile } from '../components/Buchung.jsx'
import { IconAusgaben, IconEinnahmen, IconSuche } from '../components/Icons.jsx'

export function leererFilter() {
  return { jahr: String(new Date().getFullYear()), monat: '', kategorieId: '', suche: '' }
}

const TEXTE = {
  ausgabe: { mehrzahl: 'Ausgaben', leer: 'Noch keine Ausgaben – tippe auf +', kategorie: 'Kategorie' },
  einnahme: { mehrzahl: 'Einnahmen', leer: 'Noch keine Einnahmen – tippe auf +', kategorie: 'Quelle' },
}

export function Buchungsliste({ art, filter, setFilter, onOeffnen }) {
  const { buchungen, kategorien, kategorienById } = useApp()
  const t = TEXTE[art]
  const dieserArt = useMemo(() => buchungen.filter((b) => b.art === art), [buchungen, art])
  const jahre = verfuegbareJahre(dieserArt, new Date().getFullYear())
  const kategorienAuswahl = kategorienDerArt(kategorien, art)

  const gefiltert = useMemo(
    () => sortiereNeuesteZuerst(filterBuchungen(dieserArt, filter, kategorienById)),
    [dieserArt, filter, kategorienById],
  )
  const gruppen = nachMonatGruppieren(gefiltert)
  const gesamt = gefiltert.reduce((s, b) => s + b.betrag_cent, 0)
  const aendern = (feld) => (e) => setFilter({ ...filter, [feld]: e.target.value })

  if (dieserArt.length === 0) {
    return (
      <LeererZustand
        symbol={art === 'ausgabe' ? <IconAusgaben size={30} /> : <IconEinnahmen size={30} />}
        titel={t.leer}
        text={
          art === 'ausgabe'
            ? 'Erfasse Kosten wie das Apple-Entwicklerkonto direkt mit Foto vom Beleg.'
            : 'Erfasse Auszahlungen aus Werbung, Abos und Sonstigem.'
        }
      />
    )
  }

  const zeitraumText = filter.monat
    ? `${monatsName(Number(filter.monat))} ${filter.jahr || ''}`.trim()
    : filter.jahr
      ? `Jahr ${filter.jahr}`
      : 'Alle Jahre'

  return (
    <div className="flex flex-col gap-4 pt-2">
      <section className={`rounded-[20px] px-4 py-3.5 ${art === 'ausgabe' ? 'bg-expense-soft' : 'bg-income-soft'}`}>
        <p className="text-[13px] text-ink-2">
          {t.mehrzahl} · {zeitraumText}
          {filter.kategorieId && ` · ${kategorienById[filter.kategorieId]?.name ?? ''}`}
        </p>
        <p className={`zahl font-display text-[28px] font-semibold ${art === 'ausgabe' ? 'text-expense' : 'text-income'}`}>
          {euro(gesamt)}
        </p>
        <p className="text-[13px] text-ink-2">
          {gefiltert.length === 1 ? '1 Eintrag' : `${gefiltert.length} Einträge`}
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <label className="relative block">
          <span className="sr-only">Suchen</span>
          <IconSuche size={20} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            className="feld pl-11"
            placeholder="Anbieter oder Notiz suchen"
            value={filter.suche}
            onChange={aendern('suche')}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="sr-only">Jahr</span>
            <select className="feld min-h-11" value={filter.jahr} onChange={aendern('jahr')}>
              <option value="">Alle Jahre</option>
              {jahre.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Monat</span>
            <select className="feld min-h-11" value={filter.monat} onChange={aendern('monat')}>
              <option value="">Alle Monate</option>
              {MONATE.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2">
            <span className="sr-only">{t.kategorie}</span>
            <select className="feld min-h-11" value={filter.kategorieId} onChange={aendern('kategorieId')}>
              <option value="">Alle {art === 'ausgabe' ? 'Kategorien' : 'Quellen'}</option>
              {kategorienAuswahl.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {gruppen.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-[15px] text-ink-2">Keine Einträge für diese Auswahl.</p>
          <button
            type="button"
            onClick={() => setFilter({ ...leererFilter(), jahr: '' })}
            className="mt-3 h-11 rounded-full bg-accent-soft px-5 font-semibold text-accent"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        gruppen.map((g) => (
          <section key={g.schluessel}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                {monatsName(g.monat)} {g.jahr}
              </h2>
              <span className="zahl text-[14px] font-medium text-ink-2">{euro(g.summe)}</span>
            </div>
            <div className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface">
              {g.buchungen.map((b) => (
                <BuchungZeile key={b.id} buchung={b} onClick={() => onOeffnen(b.id)} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
