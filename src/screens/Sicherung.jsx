import { useEffect, useRef, useState } from 'react'
import { useApp, IST_VORSCHAU } from '../lib/store.jsx'
import { datum as fmtDatum, dateiGroesse, heuteISO } from '../lib/format.js'
import { sicherungAuslesen, sicherungErstellen, SicherungsFehler } from '../lib/sicherung.js'
import { Abschnitt, Rueckfrage, Unterseite } from '../components/ui.jsx'
import { useBlobUrl } from '../components/BelegAnzeige.jsx'
import { IconExport, IconSchild, IconWiederholen } from '../components/Icons.jsx'

const TAG = 24 * 60 * 60 * 1000

export function wannText(iso, jetzt = new Date()) {
  if (!iso) return null
  const tage = Math.floor((new Date(heuteISO(jetzt)) - new Date(heuteISO(new Date(iso)))) / TAG)
  const wann = tage <= 0 ? 'heute' : tage === 1 ? 'gestern' : `vor ${tage} Tagen`
  return `${fmtDatum(heuteISO(new Date(iso)))} · ${wann}`
}

function mehrzahl(n, eins, viele) {
  return `${n} ${n === 1 ? eins : viele}`
}

export function SicherungSeite({ onZurueck }) {
  const {
    buchungen,
    belege,
    einstellungen,
    einstellungenSpeichern,
    sicherungLesen,
    sicherungWiederherstellen,
    speicherStand,
    zeigeMeldung,
  } = useApp()
  const [stand, setStand] = useState(null)
  const [erstellt, setErstellt] = useState(null) // { datei, zeit, anzahlBuchungen, anzahlBelege }
  const [arbeitet, setArbeitet] = useState(null) // 'erstellen' | 'lesen' | 'wiederherstellen'
  const [fehler, setFehler] = useState('')
  const [wiederherstellen, setWiederherstellen] = useState(null) // geprüfte Sicherung
  const dateiRef = useRef(null)
  const downloadUrl = useBlobUrl(erstellt?.datei)
  const kannTeilen = Boolean(erstellt && navigator.canShare?.({ files: [erstellt.datei] }))

  useEffect(() => {
    speicherStand().then(setStand)
  }, [speicherStand, buchungen, belege])

  async function erstellen() {
    setFehler('')
    setArbeitet('erstellen')
    try {
      const zeit = new Date()
      const ergebnis = await sicherungErstellen(await sicherungLesen(), zeit)
      setErstellt({ ...ergebnis, zeit: zeit.toISOString() })
    } catch {
      setFehler('Die Sicherung konnte nicht erstellt werden. Bitte noch einmal versuchen.')
    } finally {
      setArbeitet(null)
    }
  }

  async function vermerken() {
    await einstellungenSpeichern({ letzteSicherung: erstellt.zeit })
  }

  // Teilen-Menü direkt nach dem Tipp öffnen (iOS verlangt das), dort „In Dateien sichern“ wählen
  async function teilen() {
    setFehler('')
    try {
      await navigator.share({ files: [erstellt.datei], title: erstellt.datei.name })
      await vermerken()
      zeigeMeldung('Sicherung gespeichert')
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setFehler('Das Teilen-Menü ließ sich nicht öffnen. Bitte stattdessen „Herunterladen“ verwenden.')
      }
    }
  }

  async function dateiGewaehlt(e) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return
    setFehler('')
    setArbeitet('lesen')
    try {
      setWiederherstellen(await sicherungAuslesen(datei))
    } catch (err) {
      setFehler(err instanceof SicherungsFehler ? err.message : 'Die Datei konnte nicht gelesen werden.')
    } finally {
      setArbeitet(null)
    }
  }

  async function wiederherstellenBestaetigt() {
    const sicherung = wiederherstellen
    setWiederherstellen(null)
    setArbeitet('wiederherstellen')
    try {
      await sicherungWiederherstellen(sicherung)
      setErstellt(null)
      zeigeMeldung('Sicherung wiederhergestellt')
    } catch {
      setFehler('Wiederherstellen hat nicht geklappt. Deine bisherigen Daten sind unverändert.')
    } finally {
      setArbeitet(null)
    }
  }

  const letzte = wannText(einstellungen.letzteSicherung)

  return (
    <Unterseite titel="Sicherung" onZurueck={onZurueck}>
      <section className="flex gap-3.5 rounded-[20px] bg-surface p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <IconSchild size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] text-ink-2">Letzte Sicherung</p>
          <p className="zahl text-[17px] font-semibold">{letzte ?? 'Noch keine Sicherung'}</p>
          <p className="mt-1 text-[13px] text-ink-2">
            Auf diesem Gerät: {mehrzahl(buchungen.length, 'Buchung', 'Buchungen')} · {mehrzahl(belege.length, 'Beleg', 'Belege')}
            {stand?.belegt != null && ` · ${dateiGroesse(stand.belegt)} belegt`}
          </p>
        </div>
      </section>

      <p className="px-1 text-[14px] text-ink-2">
        Alle Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig, zum Beispiel in der Dateien-App auf dem iPad
        oder in iCloud Drive. Die Sicherung ist eine ZIP-Datei mit allen Buchungen und Belegen.
      </p>

      {fehler && <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger" role="alert">{fehler}</p>}

      <Abschnitt titel="Sichern">
        <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
          {!erstellt ? (
            <button
              type="button"
              onClick={erstellen}
              disabled={Boolean(arbeitet) || buchungen.length === 0}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-on-accent disabled:opacity-50"
            >
              <IconExport size={20} />
              {arbeitet === 'erstellen' ? 'Sicherung wird erstellt …' : 'Sicherung erstellen'}
            </button>
          ) : (
            <>
              <div className="rounded-xl bg-surface-2 px-3.5 py-3">
                <p className="truncate text-[15px] font-medium">{erstellt.datei.name}</p>
                <p className="text-[13px] text-ink-2">
                  {mehrzahl(erstellt.anzahlBuchungen, 'Buchung', 'Buchungen')} ·{' '}
                  {mehrzahl(erstellt.anzahlBelege, 'Beleg', 'Belege')} · {dateiGroesse(erstellt.datei.size)}
                </p>
              </div>
              {kannTeilen && (
                <button
                  type="button"
                  onClick={teilen}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-on-accent"
                >
                  <IconExport size={20} /> In Dateien sichern
                </button>
              )}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={erstellt.datei.name}
                  onClick={vermerken}
                  className={`flex h-12 items-center justify-center rounded-xl font-semibold ${
                    kannTeilen ? 'text-accent' : 'bg-accent text-on-accent'
                  }`}
                >
                  Herunterladen
                </a>
              )}
              <p className="text-[13px] text-ink-3">
                {kannTeilen
                  ? 'Im Teilen-Menü „In Dateien sichern“ wählen und einen Ordner auf dem iPad oder in iCloud Drive aussuchen. Per AirDrop geht es auch.'
                  : 'Die Datei landet im Download-Ordner. Von dort kannst du sie in einen sicheren Ordner verschieben.'}
              </p>
            </>
          )}
          {buchungen.length === 0 && !erstellt && (
            <p className="text-[13px] text-ink-3">Sobald es Einträge gibt, kannst du sie hier sichern.</p>
          )}
          {IST_VORSCHAU && (
            <p className="text-[13px] text-ink-3">In der Vorschau lässt sich die Datei nicht speichern – in der installierten App schon.</p>
          )}
        </div>
      </Abschnitt>

      <Abschnitt titel="Wiederherstellen">
        <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
          <p className="text-[14px] text-ink-2">
            Spielt eine Sicherung ein, zum Beispiel auf einem neuen Gerät oder nach dem Umzug der App. Alle Daten auf
            diesem Gerät werden dabei ersetzt.
          </p>
          <button
            type="button"
            onClick={() => dateiRef.current?.click()}
            disabled={Boolean(arbeitet)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-soft font-semibold text-accent disabled:opacity-50"
          >
            <IconWiederholen size={20} />
            {arbeitet === 'lesen'
              ? 'Sicherung wird geprüft …'
              : arbeitet === 'wiederherstellen'
                ? 'Wird wiederhergestellt …'
                : 'Sicherung wiederherstellen'}
          </button>
          <input ref={dateiRef} type="file" accept=".zip,application/zip" hidden onChange={dateiGewaehlt} />
        </div>
      </Abschnitt>

      {wiederherstellen && (
        <Rueckfrage
          titel={
            wiederherstellen.erstellt_am
              ? `Sicherung vom ${fmtDatum(heuteISO(new Date(wiederherstellen.erstellt_am)))} wiederherstellen?`
              : 'Sicherung wiederherstellen?'
          }
          text={[
            `Sie enthält ${mehrzahl(wiederherstellen.buchungen.length, 'Buchung', 'Buchungen')} und ${mehrzahl(
              wiederherstellen.belege.length,
              'Beleg',
              'Belege',
            )}.`,
            wiederherstellen.fehlendeBelege > 0 &&
              `${mehrzahl(wiederherstellen.fehlendeBelege, 'Beleg fehlt', 'Belege fehlen')} in der Datei.`,
            buchungen.length > 0 &&
              `Die ${mehrzahl(buchungen.length, 'Buchung', 'Buchungen')} auf diesem Gerät werden ersetzt. Tipp: Vorher den aktuellen Stand sichern.`,
          ]
            .filter(Boolean)
            .join(' ')}
          bestaetigen="Wiederherstellen"
          onBestaetigen={wiederherstellenBestaetigt}
          onAbbrechen={() => setWiederherstellen(null)}
        />
      )}
    </Unterseite>
  )
}
