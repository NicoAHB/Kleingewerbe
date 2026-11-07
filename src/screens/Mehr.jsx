import { useRef, useState } from 'react'
import { useApp, kategorienDerArt, IST_VORSCHAU } from '../lib/store.jsx'
import { FARBEN, farbVariable } from '../lib/kategorien.js'
import { Abschnitt, Blatt, KategorieSymbol, Rueckfrage } from '../components/ui.jsx'
import { useBlobUrl } from '../components/BelegAnzeige.jsx'
import standardLogo from '../assets/logo.svg'
import {
  IconEtikett,
  IconExport,
  IconInfo,
  IconPlus,
  IconSchild,
  IconWeiter,
  IconWiederholen,
  IconZahnrad,
  IconZurueck,
} from '../components/Icons.jsx'

function MenuePunkt({ Icon, titel, text, onClick, spaeter }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(spaeter)}
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left active:bg-surface-2 disabled:active:bg-transparent"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${spaeter ? 'bg-surface-2 text-ink-3' : 'bg-accent-soft text-accent'}`}>
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[16px] font-medium ${spaeter ? 'text-ink-2' : ''}`}>{titel}</span>
        {text && <span className="block text-[13px] text-ink-3">{text}</span>}
      </span>
      {spaeter ? (
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-ink-2">{spaeter}</span>
      ) : (
        <IconWeiter size={18} className="shrink-0 text-ink-3" />
      )}
    </button>
  )
}

function Unterseite({ titel, onZurueck, children }) {
  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onZurueck}
          className="-ml-2 flex h-10 items-center gap-0.5 rounded-full pr-3 pl-1 font-medium text-accent"
        >
          <IconZurueck size={22} /> Mehr
        </button>
      </div>
      <h2 className="px-1 font-display text-[24px] font-semibold">{titel}</h2>
      {children}
    </div>
  )
}

export function Mehr() {
  const [seite, setSeite] = useState(null)

  if (seite === 'kategorien') return <KategorienSeite onZurueck={() => setSeite(null)} />
  if (seite === 'einstellungen') return <EinstellungenSeite onZurueck={() => setSeite(null)} />

  return (
    <div className="flex flex-col gap-7 pt-2">
      <div className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface">
        <MenuePunkt Icon={IconEtikett} titel="Kategorien" text="Ausgaben-Kategorien und Einnahme-Quellen" onClick={() => setSeite('kategorien')} />
        <MenuePunkt Icon={IconZahnrad} titel="Einstellungen" text="Firmenname und Logo" onClick={() => setSeite('einstellungen')} />
        <MenuePunkt Icon={IconWiederholen} titel="Wiederkehrende Kosten" spaeter="Phase 2" />
        <MenuePunkt Icon={IconExport} titel="Export" text="PDF, CSV, Steuerberater-Paket" spaeter="Phase 2" />
      </div>

      <Abschnitt titel="Hinweise">
        <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-4 text-[14px] text-ink-2">
          <p className="flex gap-2.5">
            <IconInfo size={20} className="mt-px shrink-0 text-ink-3" />
            <span>
              Diese App ist keine Steuerberatung. Bei Auszahlungen von Apple, Google oder Werbenetzwerken mit
              Steuerberater oder Finanzamt klären, welcher Betrag als Umsatz zählt.
            </span>
          </p>
          <p className="flex gap-2.5">
            <IconInfo size={20} className="mt-px shrink-0 text-ink-3" />
            <span>
              Belege und Buchungen unterliegen Aufbewahrungsfristen. Die genauen Fristen bitte mit dem Steuerberater
              klären.
            </span>
          </p>
          <p className="flex gap-2.5">
            <IconSchild size={20} className="mt-px shrink-0 text-ink-3" />
            <span>
              {IST_VORSCHAU
                ? 'Vorschau: Alle Einträge bleiben nur in diesem Browser.'
                : 'Entwurf: Alle Einträge liegen bisher nur auf diesem Gerät. Mit Schritt 2 kommen Login, PIN und die gesicherte Ablage in Supabase.'}
            </span>
          </p>
        </div>
      </Abschnitt>
    </div>
  )
}

/* ---------- Kategorien ---------- */

function KategorienSeite({ onZurueck }) {
  const { kategorien } = useApp()
  const [art, setArt] = useState('ausgabe')
  const [bearbeiten, setBearbeiten] = useState(null) // Kategorie oder { neu: true }
  const liste = kategorienDerArt(kategorien, art)

  return (
    <Unterseite titel="Kategorien" onZurueck={onZurueck}>
      <div className="grid grid-cols-2 rounded-xl bg-surface-2 p-1" role="tablist">
        {[
          ['ausgabe', 'Ausgaben'],
          ['einnahme', 'Einnahmen'],
        ].map(([wert, name]) => (
          <button
            key={wert}
            type="button"
            role="tab"
            aria-selected={art === wert}
            onClick={() => setArt(wert)}
            className={`h-10 rounded-lg text-[15px] font-medium ${art === wert ? 'bg-surface shadow-sm' : 'text-ink-2'}`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface">
        {liste.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setBearbeiten(k)}
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-surface-2"
          >
            <KategorieSymbol kategorie={k} />
            <span className="min-w-0 flex-1 truncate text-[16px]">{k.name}</span>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: farbVariable(k.farbe) }} aria-hidden="true" />
            <IconWeiter size={18} className="shrink-0 text-ink-3" />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setBearbeiten({ neu: true, art })}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-soft font-semibold text-accent"
      >
        <IconPlus size={18} /> Neue {art === 'ausgabe' ? 'Kategorie' : 'Quelle'}
      </button>

      {bearbeiten && <KategorieBearbeiten kategorie={bearbeiten} onSchliessen={() => setBearbeiten(null)} />}
    </Unterseite>
  )
}

function KategorieBearbeiten({ kategorie, onSchliessen }) {
  const { buchungen, kategorieSpeichern, kategorieLoeschen, zeigeMeldung } = useApp()
  const neu = Boolean(kategorie.neu)
  const [name, setName] = useState(neu ? '' : kategorie.name)
  const [symbol, setSymbol] = useState(neu ? '' : kategorie.symbol)
  const [farbe, setFarbe] = useState(neu ? 'cat-1' : kategorie.farbe)
  const [fehler, setFehler] = useState('')
  const [loeschenFragen, setLoeschenFragen] = useState(false)
  const verwendet = neu ? 0 : buchungen.filter((b) => b.kategorie_id === kategorie.id).length

  async function speichern(e) {
    e.preventDefault()
    if (!name.trim()) return setFehler('Bitte einen Namen eingeben')
    await kategorieSpeichern({ ...(neu ? { art: kategorie.art } : kategorie), name, symbol: symbol.trim(), farbe })
    zeigeMeldung(neu ? 'Kategorie angelegt' : 'Kategorie gespeichert')
    onSchliessen()
  }

  async function loeschen() {
    await kategorieLoeschen(kategorie.id)
    zeigeMeldung('Kategorie gelöscht')
    onSchliessen()
  }

  return (
    <Blatt
      titel={neu ? 'Neue Kategorie' : 'Kategorie bearbeiten'}
      onSchliessen={onSchliessen}
      fusszeile={
        <button type="submit" form="kategorie-form" className="h-14 w-full rounded-2xl bg-accent text-[17px] font-semibold text-on-accent">
          Speichern
        </button>
      }
    >
      <form id="kategorie-form" onSubmit={speichern} className="flex flex-col gap-5 pt-1" noValidate>
        <div className="flex items-end gap-3">
          <div className="w-20 shrink-0">
            <label htmlFor="kat-symbol" className="mb-1.5 block px-1 text-[14px] font-medium text-ink-2">
              Symbol
            </label>
            <input
              id="kat-symbol"
              className="feld text-center text-[22px]"
              maxLength={4}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="🙂"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="kat-name" className="mb-1.5 block px-1 text-[14px] font-medium text-ink-2">
              Name
            </label>
            <input id="kat-name" className="feld" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Hardware" />
          </div>
        </div>
        {fehler && <p className="-mt-3 px-1 text-[14px] text-danger">{fehler}</p>}

        <fieldset>
          <legend className="mb-2 px-1 text-[14px] font-medium text-ink-2">Farbe</legend>
          <div className="flex flex-wrap gap-2.5">
            {FARBEN.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFarbe(f)}
                aria-pressed={farbe === f}
                aria-label={`Farbe ${FARBEN.indexOf(f) + 1}`}
                className="grid h-11 w-11 place-items-center rounded-full"
                style={{ boxShadow: farbe === f ? `0 0 0 2px var(--bg), 0 0 0 4px ${farbVariable(f)}` : 'none' }}
              >
                <span className="h-8 w-8 rounded-full" style={{ background: farbVariable(f) }} />
              </button>
            ))}
          </div>
        </fieldset>

        {!neu && (
          <div className="rounded-2xl bg-surface p-4">
            {verwendet > 0 ? (
              <p className="text-[14px] text-ink-2">
                Wird von {verwendet === 1 ? '1 Buchung' : `${verwendet} Buchungen`} verwendet und kann deshalb nicht
                gelöscht werden.
              </p>
            ) : (
              <button type="button" onClick={() => setLoeschenFragen(true)} className="font-semibold text-danger">
                Kategorie löschen
              </button>
            )}
          </div>
        )}
      </form>

      {loeschenFragen && (
        <Rueckfrage
          titel="Kategorie löschen?"
          text={`„${kategorie.name}“ wird endgültig entfernt.`}
          onBestaetigen={loeschen}
          onAbbrechen={() => setLoeschenFragen(false)}
        />
      )}
    </Blatt>
  )
}

/* ---------- Einstellungen ---------- */

function EinstellungenSeite({ onZurueck }) {
  const { einstellungen, einstellungenSpeichern, zeigeMeldung } = useApp()
  const [firmenname, setFirmenname] = useState(einstellungen.firmenname)
  const logoRef = useRef(null)
  const eigenesLogo = useBlobUrl(einstellungen.logo)

  async function nameSpeichern(e) {
    e.preventDefault()
    await einstellungenSpeichern({ firmenname: firmenname.trim() || 'NvF Digital' })
    zeigeMeldung('Firmenname gespeichert')
  }

  async function logoGewaehlt(e) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return
    await einstellungenSpeichern({ logo: datei })
    zeigeMeldung('Logo gespeichert')
  }

  return (
    <Unterseite titel="Einstellungen" onZurueck={onZurueck}>
      <Abschnitt titel="Firmendaten">
        <form onSubmit={nameSpeichern} className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
          <label htmlFor="firmenname" className="px-1 text-[14px] font-medium text-ink-2">
            Firmenname
          </label>
          <input id="firmenname" className="feld" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          <button type="submit" className="h-12 rounded-xl bg-accent font-semibold text-on-accent">
            Speichern
          </button>
        </form>
      </Abschnitt>

      <Abschnitt titel="Logo">
        <div className="flex items-center gap-4 rounded-[20px] bg-surface p-4">
          <img src={eigenesLogo || standardLogo} alt="Aktuelles Logo" className="h-16 w-16 rounded-2xl object-contain" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <button type="button" onClick={() => logoRef.current?.click()} className="h-11 rounded-xl bg-accent-soft font-semibold text-accent">
              Logo wählen
            </button>
            {einstellungen.logo && (
              <button
                type="button"
                onClick={() => einstellungenSpeichern({ logo: null })}
                className="h-10 rounded-xl text-[14px] font-medium text-ink-2"
              >
                Standard-Logo verwenden
              </button>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" hidden onChange={logoGewaehlt} />
        </div>
      </Abschnitt>

      <Abschnitt titel="Kommt später">
        <div className="divide-y divide-line rounded-[20px] bg-surface text-[15px]">
          <div className="flex justify-between gap-3 px-4 py-3">
            <span>Login und App-PIN</span>
            <span className="text-ink-3">Schritt 2</span>
          </div>
          <div className="flex justify-between gap-3 px-4 py-3">
            <span>Kleinunternehmer-Grenzen</span>
            <span className="text-ink-3">Phase 2</span>
          </div>
          <div className="flex justify-between gap-3 px-4 py-3">
            <span>Gründungsdatum, Umsatz Vorjahr</span>
            <span className="text-ink-3">Phase 2</span>
          </div>
        </div>
      </Abschnitt>
    </Unterseite>
  )
}
