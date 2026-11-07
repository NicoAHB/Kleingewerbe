import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, kategorienDerArt } from '../lib/store.jsx'
import { centZuEingabe, heuteISO, parseBetrag } from '../lib/format.js'
import { Blatt, KategorieSymbol } from './ui.jsx'
import { BelegAnsicht, BelegKachel } from './BelegAnzeige.jsx'
import { IconBild, IconKamera, IconPdf, IconSchliessen, IconPlus } from './Icons.jsx'

const TEXTE = {
  ausgabe: {
    neu: 'Neue Ausgabe',
    bearbeiten: 'Ausgabe bearbeiten',
    anbieter: 'Anbieter',
    anbieterPlatzhalter: 'z. B. Apple, IONOS, Figma',
    kategorie: 'Kategorie',
    speichern: 'Ausgabe speichern',
    gespeichert: 'Ausgabe gespeichert',
  },
  einnahme: {
    neu: 'Neue Einnahme',
    bearbeiten: 'Einnahme bearbeiten',
    anbieter: 'Auszahlung von (optional)',
    anbieterPlatzhalter: 'z. B. Apple, Google AdMob',
    kategorie: 'Quelle',
    speichern: 'Einnahme speichern',
    gespeichert: 'Einnahme gespeichert',
  },
}

/** Gespeicherten Beleg nachladen und als Kachel zeigen */
function GespeicherterBeleg({ beleg, onEntfernen, onAnsehen }) {
  const { belegDatei } = useApp()
  const [blob, setBlob] = useState(null)
  useEffect(() => {
    belegDatei(beleg.id).then(setBlob)
  }, [beleg.id, belegDatei])
  return (
    <BelegKachel blob={blob} typ={beleg.dateityp} name={beleg.dateiname} onClick={() => onAnsehen(beleg, blob)}>
      <EntfernenKnopf onClick={onEntfernen} name={beleg.dateiname} />
    </BelegKachel>
  )
}

function EntfernenKnopf({ onClick, name }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-bg shadow"
      aria-label={`${name} entfernen`}
    >
      <IconSchliessen size={14} strokeWidth={2.4} />
    </button>
  )
}

export function Erfassung({ art, buchung, onSchliessen }) {
  const { kategorien, buchungen, belegeNachBuchung, buchungSpeichern, zeigeMeldung } = useApp()
  const t = TEXTE[art]
  const bearbeiten = Boolean(buchung)

  const [betrag, setBetrag] = useState(centZuEingabe(buchung?.betrag_cent))
  const [datum, setDatum] = useState(buchung?.datum || heuteISO())
  const [anbieter, setAnbieter] = useState(buchung?.anbieter_quelle || '')
  const [kategorieId, setKategorieId] = useState(buchung?.kategorie_id || '')
  const [notiz, setNotiz] = useState(buchung?.notiz || '')
  const [neueDateien, setNeueDateien] = useState([])
  const [entfernteBelegIds, setEntfernteBelegIds] = useState([])
  const [fehler, setFehler] = useState({})
  const [speichert, setSpeichert] = useState(false)
  const [ansicht, setAnsicht] = useState(null)

  // Fehlermeldung eines Feldes verschwindet, sobald es geändert wird
  const aendern = (setter, feld) => (wert) => {
    setter(wert)
    setFehler((f) => (f[feld] ? { ...f, [feld]: undefined } : f))
  }

  const kameraRef = useRef(null)
  const bildRef = useRef(null)
  const pdfRef = useRef(null)

  const passendeKategorien = kategorienDerArt(kategorien, art)
  const vorhandeneBelege = (belegeNachBuchung[buchung?.id] || []).filter((b) => !entfernteBelegIds.includes(b.id))
  const anzahlBelege = vorhandeneBelege.length + neueDateien.length

  // Vorschläge für das Anbieter-Feld aus bisherigen Buchungen
  const anbieterVorschlaege = useMemo(() => {
    const namen = new Set(buchungen.filter((b) => b.art === art && b.anbieter_quelle).map((b) => b.anbieter_quelle))
    return [...namen].sort((a, b) => a.localeCompare(b, 'de'))
  }, [buchungen, art])

  function dateienGewaehlt(e) {
    const dateien = [...(e.target.files || [])]
    if (dateien.length) setNeueDateien((d) => [...d, ...dateien])
    e.target.value = ''
  }

  async function speichern(e) {
    e?.preventDefault()
    const betragCent = parseBetrag(betrag)
    const neueFehler = {}
    if (!betragCent) neueFehler.betrag = 'Bitte einen Betrag eingeben, z. B. 12,99'
    if (!datum) neueFehler.datum = 'Bitte ein Datum wählen'
    if (art === 'ausgabe' && !anbieter.trim()) neueFehler.anbieter = 'Bitte den Anbieter eingeben'
    if (!kategorieId) neueFehler.kategorie = `Bitte eine ${t.kategorie} wählen`
    setFehler(neueFehler)
    if (Object.keys(neueFehler).length) return

    setSpeichert(true)
    try {
      await buchungSpeichern(
        {
          ...buchung,
          art,
          datum,
          betrag_cent: betragCent,
          anbieter_quelle: anbieter,
          kategorie_id: kategorieId,
          notiz,
        },
        { neueDateien, entfernteBelegIds },
      )
      zeigeMeldung(bearbeiten ? 'Änderungen gespeichert' : t.gespeichert)
      onSchliessen()
    } catch {
      setFehler({ allgemein: 'Speichern hat nicht geklappt. Bitte noch einmal versuchen.' })
      setSpeichert(false)
    }
  }

  const belegKnoepfe = [
    { ref: kameraRef, label: 'Kamera', Icon: IconKamera },
    { ref: bildRef, label: 'Bild', Icon: IconBild },
    { ref: pdfRef, label: 'PDF', Icon: IconPdf },
  ]

  return (
    <Blatt
      titel={bearbeiten ? t.bearbeiten : t.neu}
      onSchliessen={onSchliessen}
      voll
      fusszeile={
        <>
          {fehler.allgemein && <p className="mb-2 text-[14px] text-danger">{fehler.allgemein}</p>}
          <button
            type="submit"
            form="erfassung"
            disabled={speichert}
            className="h-14 w-full rounded-2xl bg-accent text-[17px] font-semibold text-on-accent active:scale-[0.99] disabled:opacity-60"
          >
            {speichert ? 'Wird gespeichert …' : t.speichern}
          </button>
        </>
      }
    >
      <form id="erfassung" onSubmit={speichern} className="flex flex-col gap-5 pt-1" noValidate>
        {/* Beleg zuerst und groß */}
        <fieldset>
          <legend className="mb-2 px-1 text-[14px] font-medium text-ink-2">
            Beleg {anzahlBelege > 0 && <span className="text-ink-3">· {anzahlBelege}</span>}
          </legend>
          {anzahlBelege === 0 ? (
            <div className="grid grid-cols-3 gap-2.5">
              {belegKnoepfe.map(({ ref, label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => ref.current?.click()}
                  className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-surface text-accent active:scale-[0.98]"
                >
                  <Icon size={28} />
                  <span className="text-[15px] font-medium text-ink">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-start gap-3 pt-2">
              {vorhandeneBelege.map((b) => (
                <GespeicherterBeleg
                  key={b.id}
                  beleg={b}
                  onAnsehen={(beleg, blob) => setAnsicht({ beleg, blob })}
                  onEntfernen={() => setEntfernteBelegIds((ids) => [...ids, b.id])}
                />
              ))}
              {neueDateien.map((datei, i) => (
                <BelegKachel
                  key={`${datei.name}-${i}`}
                  blob={datei}
                  typ={datei.type}
                  name={datei.name}
                  onClick={() =>
                    setAnsicht({
                      beleg: { dateiname: datei.name, dateityp: datei.type, groesse: datei.size },
                      blob: datei,
                    })
                  }
                >
                  <EntfernenKnopf name={datei.name} onClick={() => setNeueDateien((d) => d.filter((_, j) => j !== i))} />
                </BelegKachel>
              ))}
              <div className="flex flex-col gap-1.5">
                {belegKnoepfe.map(({ ref, label, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => ref.current?.click()}
                    className="flex h-[29px] items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 text-[13px] font-medium text-ink-2"
                  >
                    <Icon size={16} />
                    <IconPlus size={12} strokeWidth={2.4} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input ref={kameraRef} type="file" accept="image/*" capture="environment" hidden onChange={dateienGewaehlt} />
          <input ref={bildRef} type="file" accept="image/*" multiple hidden onChange={dateienGewaehlt} />
          <input ref={pdfRef} type="file" accept="application/pdf,.pdf" multiple hidden onChange={dateienGewaehlt} />
        </fieldset>

        <div>
          <label htmlFor="betrag" className="mb-1.5 block px-1 text-[14px] font-medium text-ink-2">
            Betrag
          </label>
          <div className="relative">
            <input
              id="betrag"
              className="feld zahl h-16 pr-12 font-display text-[28px] font-semibold"
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              placeholder="0,00"
              value={betrag}
              onChange={(e) => aendern(setBetrag, 'betrag')(e.target.value)}
              aria-invalid={Boolean(fehler.betrag)}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[22px] text-ink-3">€</span>
          </div>
          {fehler.betrag && <p className="mt-1.5 px-1 text-[14px] text-danger">{fehler.betrag}</p>}
        </div>

        <div>
          <label htmlFor="datum" className="mb-1.5 block px-1 text-[14px] font-medium text-ink-2">
            Datum
          </label>
          <input id="datum" type="date" className="feld" value={datum} onChange={(e) => aendern(setDatum, 'datum')(e.target.value)} />
          {fehler.datum && <p className="mt-1.5 px-1 text-[14px] text-danger">{fehler.datum}</p>}
        </div>

        <div>
          <label htmlFor="anbieter" className="mb-1.5 block px-1 text-[14px] font-medium text-ink-2">
            {t.anbieter}
          </label>
          <input
            id="anbieter"
            className="feld"
            placeholder={t.anbieterPlatzhalter}
            autoComplete="off"
            list="anbieter-vorschlaege"
            value={anbieter}
            onChange={(e) => aendern(setAnbieter, 'anbieter')(e.target.value)}
            aria-invalid={Boolean(fehler.anbieter)}
          />
          <datalist id="anbieter-vorschlaege">
            {anbieterVorschlaege.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          {fehler.anbieter && <p className="mt-1.5 px-1 text-[14px] text-danger">{fehler.anbieter}</p>}
        </div>

        <fieldset>
          <legend className="mb-2 px-1 text-[14px] font-medium text-ink-2">{t.kategorie}</legend>
          <div className="flex flex-wrap gap-2">
            {passendeKategorien.map((k) => {
              const aktiv = k.id === kategorieId
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => aendern(setKategorieId, 'kategorie')(k.id)}
                  aria-pressed={aktiv}
                  className={`flex min-h-11 items-center gap-2 rounded-full border py-1 pr-3.5 pl-1.5 text-[15px] ${
                    aktiv ? 'border-accent bg-accent-soft font-semibold text-ink' : 'border-line bg-surface text-ink'
                  }`}
                >
                  <KategorieSymbol kategorie={k} groesse={30} />
                  {k.name}
                </button>
              )
            })}
          </div>
          {fehler.kategorie && <p className="mt-1.5 px-1 text-[14px] text-danger">{fehler.kategorie}</p>}
        </fieldset>

        <div>
          <label htmlFor="notiz" className="mb-1.5 block px-1 text-[14px] font-medium text-ink-2">
            Notiz
          </label>
          <textarea
            id="notiz"
            className="feld min-h-20 resize-none"
            rows={2}
            placeholder="Optional"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
          />
        </div>
      </form>

      {ansicht && <BelegAnsicht beleg={ansicht.beleg} blob={ansicht.blob} onSchliessen={() => setAnsicht(null)} />}
    </Blatt>
  )
}

/** Auswahl nach Tipp auf den Plus-Knopf */
export function ArtAuswahl({ onWahl, onSchliessen }) {
  return (
    <Blatt titel="Was möchtest du erfassen?" onSchliessen={onSchliessen}>
      <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
        <button
          type="button"
          onClick={() => onWahl('ausgabe')}
          className="flex h-32 flex-col items-start justify-between rounded-2xl bg-expense-soft p-4 text-left active:scale-[0.98]"
        >
          <span className="font-display text-[28px] leading-none font-semibold text-expense">−</span>
          <span>
            <span className="block text-[18px] font-semibold">Ausgabe</span>
            <span className="text-[14px] text-ink-2">Kosten mit Beleg</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onWahl('einnahme')}
          className="flex h-32 flex-col items-start justify-between rounded-2xl bg-income-soft p-4 text-left active:scale-[0.98]"
        >
          <span className="font-display text-[28px] leading-none font-semibold text-income">+</span>
          <span>
            <span className="block text-[18px] font-semibold">Einnahme</span>
            <span className="text-[14px] text-ink-2">Werbung, Abo, Sonstiges</span>
          </span>
        </button>
      </div>
    </Blatt>
  )
}
