import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as db from './db.js'
import { beispielBuchungen } from './beispieldaten.js'

export const IST_VORSCHAU = import.meta.env.MODE === 'vorschau'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [zustand, setZustand] = useState({
    laden: true,
    dauerhaft: true,
    kategorien: [],
    buchungen: [],
    belege: [],
    einstellungen: db.STANDARD_EINSTELLUNGEN,
  })
  // Aktueller Stand für Aktionen, die ihn lesen müssen
  const zustandRef = useRef(zustand)
  zustandRef.current = zustand
  const [meldung, setMeldung] = useState(null)
  const meldungTimer = useRef(null)

  const zeigeMeldung = useCallback((text) => {
    clearTimeout(meldungTimer.current)
    setMeldung(text)
    meldungTimer.current = setTimeout(() => setMeldung(null), 2400)
  }, [])

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      let daten = await db.allesLaden()
      if (IST_VORSCHAU && !daten.einstellungen.beispieldatenGeladen && daten.buchungen.length === 0) {
        for (const { dateien, ...b } of beispielBuchungen()) {
          await db.buchungSpeichern(
            { ...b, erstellt_am: `${b.datum}T12:00:00.000Z` },
            { neueDateien: dateien || [] },
          )
        }
        await db.einstellungenSpeichern({ ...daten.einstellungen, beispieldatenGeladen: true })
        daten = await db.allesLaden()
      }
      if (aktiv) setZustand({ ...daten, laden: false })
    })()
    return () => {
      aktiv = false
    }
  }, [])

  const buchungSpeichern = useCallback(async (daten, optionen) => {
    const { buchung, neueBelege } = await db.buchungSpeichern(daten, optionen)
    const entfernt = new Set(optionen?.entfernteBelegIds || [])
    setZustand((z) => ({
      ...z,
      buchungen: [...z.buchungen.filter((b) => b.id !== buchung.id), buchung],
      belege: [...z.belege.filter((x) => !entfernt.has(x.id)), ...neueBelege],
    }))
    return buchung
  }, [])

  const buchungLoeschen = useCallback(async (id) => {
    const belegIds = zustandRef.current.belege.filter((x) => x.buchung_id === id).map((x) => x.id)
    await db.buchungLoeschen(id, belegIds)
    setZustand((z) => ({
      ...z,
      buchungen: z.buchungen.filter((b) => b.id !== id),
      belege: z.belege.filter((x) => x.buchung_id !== id),
    }))
  }, [])

  const kategorieSpeichern = useCallback(async (daten) => {
    const kategorie = await db.kategorieSpeichern(daten)
    setZustand((z) => ({
      ...z,
      kategorien: [...z.kategorien.filter((k) => k.id !== kategorie.id), kategorie],
    }))
    return kategorie
  }, [])

  const kategorieLoeschen = useCallback(async (id) => {
    await db.kategorieLoeschen(id)
    setZustand((z) => ({ ...z, kategorien: z.kategorien.filter((k) => k.id !== id) }))
  }, [])

  const einstellungenSpeichern = useCallback(async (aenderungen) => {
    const neu = { ...zustandRef.current.einstellungen, ...aenderungen }
    await db.einstellungenSpeichern(neu)
    setZustand((z) => ({ ...z, einstellungen: neu }))
  }, [])

  const kategorienById = useMemo(
    () => Object.fromEntries(zustand.kategorien.map((k) => [k.id, k])),
    [zustand.kategorien],
  )

  const belegeNachBuchung = useMemo(() => {
    const map = {}
    for (const beleg of zustand.belege) (map[beleg.buchung_id] ??= []).push(beleg)
    return map
  }, [zustand.belege])

  const wert = {
    ...zustand,
    kategorienById,
    belegeNachBuchung,
    meldung,
    zeigeMeldung,
    buchungSpeichern,
    buchungLoeschen,
    kategorieSpeichern,
    kategorieLoeschen,
    einstellungenSpeichern,
    belegDatei: db.belegDatei,
  }

  return <AppContext.Provider value={wert}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}

/** Kategorien einer Art in fester Reihenfolge */
export function kategorienDerArt(kategorien, art) {
  return kategorien
    .filter((k) => k.art === art)
    .sort((a, b) => (a.reihenfolge ?? 0) - (b.reihenfolge ?? 0))
}
