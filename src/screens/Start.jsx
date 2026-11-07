import { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { euro, monatsName } from '../lib/format.js'
import { monatsBilanz, monatVon, jahrVon, sortiereNeuesteZuerst, summenNachKategorie } from '../lib/auswertung.js'
import { farbVariable } from '../lib/kategorien.js'
import { Abschnitt, LeererZustand } from '../components/ui.jsx'
import { Kreisdiagramm } from '../components/Kreisdiagramm.jsx'
import { BuchungZeile } from '../components/Buchung.jsx'
import { IconPlus, IconWeiter, IconZurueck } from '../components/Icons.jsx'

export function Start({ onOeffnen }) {
  const { buchungen, kategorienById } = useApp()
  const heute = new Date()
  const [zeitraum, setZeitraum] = useState({ jahr: heute.getFullYear(), monat: heute.getMonth() + 1 })
  const { jahr, monat } = zeitraum

  const bilanz = monatsBilanz(buchungen, jahr, monat)
  const istAktuellerMonat = jahr === heute.getFullYear() && monat === heute.getMonth() + 1

  const kosten = useMemo(() => {
    const ausgaben = buchungen.filter((b) => b.art === 'ausgabe' && jahrVon(b) === jahr && monatVon(b) === monat)
    return summenNachKategorie(ausgaben).map(({ kategorie_id, summe }) => {
      const k = kategorienById[kategorie_id]
      return { id: kategorie_id, name: k?.name ?? 'Ohne Kategorie', wert: summe, farbe: farbVariable(k?.farbe) }
    })
  }, [buchungen, kategorienById, jahr, monat])

  const letzte = sortiereNeuesteZuerst(buchungen).slice(0, 5)

  function blaettern(richtung) {
    setZeitraum(({ jahr: j, monat: m }) => {
      const neu = m + richtung
      if (neu < 1) return { jahr: j - 1, monat: 12 }
      if (neu > 12) return { jahr: j + 1, monat: 1 }
      return { jahr: j, monat: neu }
    })
  }

  if (buchungen.length === 0) {
    return (
      <LeererZustand
        symbol={<IconPlus size={30} />}
        titel="Noch keine Einträge"
        text="Tippe auf +, um deine erste Ausgabe oder Einnahme zu erfassen."
      />
    )
  }

  return (
    <div className="flex flex-col gap-7 pt-2">
      {/* Monatsbilanz */}
      <section className="rounded-[20px] bg-surface p-4 pb-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => blaettern(-1)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 active:bg-surface-2"
            aria-label="Vorheriger Monat"
          >
            <IconZurueck size={20} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-3">Monatsbilanz</p>
            <h2 className="font-display text-[17px] font-semibold">
              {monatsName(monat)} {jahr}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => blaettern(1)}
            disabled={istAktuellerMonat}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 active:bg-surface-2 disabled:opacity-25"
            aria-label="Nächster Monat"
          >
            <IconWeiter size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-income-soft px-3.5 py-3">
            <p className="text-[13px] text-ink-2">Einnahmen</p>
            <p className="zahl font-display text-[21px] font-semibold text-income">{euro(bilanz.einnahmen)}</p>
          </div>
          <div className="rounded-2xl bg-expense-soft px-3.5 py-3">
            <p className="text-[13px] text-ink-2">Ausgaben</p>
            <p className="zahl font-display text-[21px] font-semibold text-expense">{euro(bilanz.ausgaben)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between px-1">
          <p className="text-[15px] text-ink-2">Ergebnis</p>
          <p className={`zahl font-display text-[26px] font-semibold ${bilanz.ergebnis < 0 ? 'text-expense' : 'text-ink'}`}>
            {bilanz.ergebnis > 0 ? '+' : bilanz.ergebnis < 0 ? '−' : ''}
            {bilanz.ergebnis !== 0 && ' '}
            {euro(Math.abs(bilanz.ergebnis))}
          </p>
        </div>
      </section>

      <Abschnitt titel={`Kosten im ${monatsName(monat)}`}>
        <div className="rounded-[20px] bg-surface p-4">
          {kosten.length > 0 ? (
            <Kreisdiagramm daten={kosten} titelMitte="Ausgaben gesamt" />
          ) : (
            <p className="py-6 text-center text-[15px] text-ink-2">In diesem Monat noch keine Ausgaben.</p>
          )}
        </div>
      </Abschnitt>

      <Abschnitt titel="Letzte Einträge">
        <div className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface">
          {letzte.map((b) => (
            <BuchungZeile key={b.id} buchung={b} onClick={() => onOeffnen(b.id)} />
          ))}
        </div>
      </Abschnitt>
    </div>
  )
}
