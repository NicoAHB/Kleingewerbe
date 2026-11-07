import { useEffect, useState } from 'react'
import { useApp, IST_VORSCHAU } from './lib/store.jsx'
import { Meldung, Rueckfrage } from './components/ui.jsx'
import { useBlobUrl } from './components/BelegAnzeige.jsx'
import { ArtAuswahl, Erfassung } from './components/Erfassung.jsx'
import { BuchungDetail } from './components/Buchung.jsx'
import { IconAusgaben, IconAuswertung, IconEinnahmen, IconMehr, IconPlus, IconStart } from './components/Icons.jsx'
import { Start } from './screens/Start.jsx'
import { Buchungsliste, leererFilter } from './screens/Buchungsliste.jsx'
import { Auswertung } from './screens/Auswertung.jsx'
import { Mehr } from './screens/Mehr.jsx'
import standardLogo from './assets/logo.svg'

const TABS = [
  { id: 'start', name: 'Start', titel: 'Übersicht', Icon: IconStart },
  { id: 'ausgaben', name: 'Ausgaben', titel: 'Ausgaben', Icon: IconAusgaben },
  { id: 'einnahmen', name: 'Einnahmen', titel: 'Einnahmen', Icon: IconEinnahmen },
  { id: 'auswertung', name: 'Auswertung', titel: 'Auswertung', Icon: IconAuswertung },
  { id: 'mehr', name: 'Mehr', titel: 'Mehr', Icon: IconMehr },
]

function tabAusHash() {
  const id = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === id) ? id : 'start'
}

function Ladebildschirm() {
  return (
    <div className="grid min-h-[80dvh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <img src={standardLogo} alt="" className="h-20 w-20 rounded-[22px]" />
        <p className="text-[15px] text-ink-2">NvF Finanzen wird geladen …</p>
      </div>
    </div>
  )
}

function VorschauHinweis() {
  const { buchungen, buchungLoeschen, zeigeMeldung } = useApp()
  const [fragen, setFragen] = useState(false)
  async function allesLeeren() {
    for (const b of buchungen) await buchungLoeschen(b.id)
    setFragen(false)
    zeigeMeldung('Beispieldaten gelöscht')
  }
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-dashed border-line px-3.5 py-2.5 text-[13px] text-ink-2">
      <p className="min-w-0 flex-1">
        <strong className="font-semibold text-ink">Vorschau mit Beispieldaten.</strong> Alles bleibt nur in diesem Browser.
      </p>
      {buchungen.length > 0 && (
        <button type="button" onClick={() => setFragen(true)} className="shrink-0 font-semibold text-accent">
          Leeren
        </button>
      )}
      {fragen && (
        <Rueckfrage
          titel="Alle Einträge löschen?"
          text={`${buchungen.length} Einträge mit ihren Belegen werden aus dieser Vorschau entfernt.`}
          bestaetigen="Alle löschen"
          onBestaetigen={allesLeeren}
          onAbbrechen={() => setFragen(false)}
        />
      )}
    </div>
  )
}

export function App() {
  const { laden, dauerhaft, einstellungen, meldung } = useApp()
  const [tab, setTab] = useState(tabAusHash)
  const [auswahlOffen, setAuswahlOffen] = useState(false)
  const [erfassung, setErfassung] = useState(null) // 'ausgabe' | 'einnahme'
  const [detailId, setDetailId] = useState(null)
  const [filterAusgaben, setFilterAusgaben] = useState(leererFilter)
  const [filterEinnahmen, setFilterEinnahmen] = useState(leererFilter)
  const eigenesLogo = useBlobUrl(einstellungen.logo)

  useEffect(() => {
    const beiHashWechsel = () => setTab(tabAusHash())
    window.addEventListener('hashchange', beiHashWechsel)
    return () => window.removeEventListener('hashchange', beiHashWechsel)
  }, [])

  function wechsleTab(id) {
    if (id === tab) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setTab(id)
    try {
      history.replaceState(null, '', id === 'start' ? window.location.pathname + window.location.search : `#${id}`)
    } catch {
      // In manchen Umgebungen nicht erlaubt – der Tab wechselt trotzdem
    }
    window.scrollTo(0, 0)
  }

  const aktuellerTab = TABS.find((t) => t.id === tab)

  if (laden) return <Ladebildschirm />

  return (
    <div className="mx-auto min-h-dvh max-w-xl">
      <header
        className="gutter sticky z-20 bg-bg/90 pt-3 pb-3 backdrop-blur-md"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-3">
          <img src={eigenesLogo || standardLogo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
          <div className="min-w-0">
            <p className="truncate text-[13px] leading-tight font-medium text-ink-2">{einstellungen.firmenname}</p>
            <h1 className="truncate font-display text-[24px] leading-tight font-bold tracking-[-0.01em]">{aktuellerTab.titel}</h1>
          </div>
        </div>
      </header>

      <main className="gutter" style={{ paddingBottom: 'calc(168px + env(safe-area-inset-bottom, 0px))' }}>
        {IST_VORSCHAU && <VorschauHinweis />}
        {!dauerhaft && (
          <p className="mb-4 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
            Dieser Browser erlaubt kein dauerhaftes Speichern. Einträge gehen beim Schließen verloren.
          </p>
        )}
        {tab === 'start' && <Start onOeffnen={setDetailId} />}
        {tab === 'ausgaben' && (
          <Buchungsliste art="ausgabe" filter={filterAusgaben} setFilter={setFilterAusgaben} onOeffnen={setDetailId} />
        )}
        {tab === 'einnahmen' && (
          <Buchungsliste art="einnahme" filter={filterEinnahmen} setFilter={setFilterEinnahmen} onOeffnen={setDetailId} />
        )}
        {tab === 'auswertung' && <Auswertung />}
        {tab === 'mehr' && <Mehr />}
      </main>

      {/* Großer runder Plus-Knopf, mit dem Daumen erreichbar */}
      <button
        type="button"
        onClick={() => setAuswahlOffen(true)}
        className="fixed z-20 grid h-16 w-16 place-items-center rounded-full bg-accent text-on-accent shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--accent)_60%,transparent)] active:scale-95"
        style={{
          right: 'max(20px, calc(env(safe-area-inset-right, 0px) + 16px), calc((100vw - 36rem) / 2 + 20px))',
          bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
        }}
        aria-label="Neuer Eintrag"
      >
        <IconPlus size={30} strokeWidth={2.2} />
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
        aria-label="Hauptnavigation"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map(({ id, name, Icon }) => {
            const aktiv = id === tab
            return (
              <button
                key={id}
                type="button"
                onClick={() => wechsleTab(id)}
                aria-current={aktiv ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  aktiv ? 'text-accent' : 'text-ink-3'
                }`}
              >
                <Icon size={24} strokeWidth={aktiv ? 2.1 : 1.8} />
                {name}
              </button>
            )
          })}
        </div>
      </nav>

      {auswahlOffen && (
        <ArtAuswahl
          onSchliessen={() => setAuswahlOffen(false)}
          onWahl={(art) => {
            setAuswahlOffen(false)
            setErfassung(art)
          }}
        />
      )}
      {erfassung && <Erfassung art={erfassung} onSchliessen={() => setErfassung(null)} />}
      {detailId && <BuchungDetail buchungId={detailId} onSchliessen={() => setDetailId(null)} />}
      <Meldung text={meldung} />
    </div>
  )
}
