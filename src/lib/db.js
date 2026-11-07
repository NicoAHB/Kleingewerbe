// Speicher auf dem Gerät (IndexedDB). Alle Daten bleiben auf dem iPhone/iPad –
// es gibt keinen Server. Gegen Verlust schützt die Sicherung (siehe sicherung.js).
// Die Struktur folgt dem Datenmodell aus dem Konzept (buchungen, belege, kategorien, einstellungen).

import { openDB } from 'idb'
import { STANDARD_KATEGORIEN } from './kategorien.js'

const DB_NAME = 'nvf-finanzen'
const DB_VERSION = 1

export const STANDARD_EINSTELLUNGEN = {
  firmenname: 'NvF Digital',
  logo: null, // eigenes Logo als Blob (optional)
  letzteSicherung: null, // Zeitpunkt der letzten Sicherung (ISO)
}

const ALLE_STORES = ['einstellungen', 'kategorien', 'buchungen', 'belege', 'beleg_dateien']

// Dateien werden als { typ, daten: ArrayBuffer } gespeichert; ältere Einträge können noch Blobs sein.
function alsBlob(eintrag) {
  if (!eintrag) return null
  if (eintrag instanceof Blob) return eintrag
  return new Blob([eintrag.daten], { type: eintrag.typ })
}

async function alsDaten(blob) {
  if (!blob) return null
  return { typ: blob.type || 'application/octet-stream', daten: await blob.arrayBuffer() }
}

function neueId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Fallback, falls der Browser keinen Speicher erlaubt (z. B. privates Fenster):
// Die App funktioniert dann, vergisst aber alles beim Schließen.
function speicherImArbeitsspeicher() {
  const stores = {}
  const store = (name) => (stores[name] ??= new Map())
  return {
    dauerhaft: false,
    get: async (s, key) => store(s).get(key),
    getAll: async (s) => [...store(s).values()],
    put: async (s, value, key) => void store(s).set(key ?? value.id, value),
    delete: async (s, key) => void store(s).delete(key),
    transaktion: async (_stores, fn) =>
      fn((s) => ({
        put: (value, key) => store(s).set(key ?? value.id, value),
        delete: (key) => store(s).delete(key),
        clear: () => store(s).clear(),
      })),
  }
}

async function oeffnen() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('einstellungen')
        db.createObjectStore('kategorien', { keyPath: 'id' })
        db.createObjectStore('buchungen', { keyPath: 'id' })
        const belege = db.createObjectStore('belege', { keyPath: 'id' })
        belege.createIndex('buchung_id', 'buchung_id')
        db.createObjectStore('beleg_dateien') // Schlüssel = Beleg-ID, Wert = { typ, daten }
      },
    })
    // Browser bitten, die Daten nicht automatisch zu löschen
    navigator.storage?.persist?.().catch(() => {})
    return {
      dauerhaft: true,
      get: (s, key) => db.get(s, key),
      getAll: (s) => db.getAll(s),
      put: (s, value, key) => db.put(s, value, key),
      delete: (s, key) => db.delete(s, key),
      // Mehrere Änderungen in einem Rutsch: entweder alles wird gespeichert oder nichts
      transaktion: async (stores, fn) => {
        const tx = db.transaction(stores, 'readwrite')
        // Einzelfehler zeigen sich gesammelt in tx.done – hier nur nicht unbehandelt lassen
        const store = (s) => {
          const os = tx.objectStore(s)
          return {
            put: (value, key) => void os.put(value, key).catch(() => {}),
            delete: (key) => void os.delete(key).catch(() => {}),
            clear: () => void os.clear().catch(() => {}),
          }
        }
        try {
          fn(store)
        } catch (fehler) {
          tx.abort()
          throw fehler
        }
        await tx.done
      },
    }
  } catch {
    return speicherImArbeitsspeicher()
  }
}

let speicherPromise = null
function speicher() {
  speicherPromise ??= oeffnen()
  return speicherPromise
}

/** Lädt alles, was die Oberfläche braucht (ohne die Beleg-Dateien selbst). */
export async function allesLaden() {
  const db = await speicher()
  let kategorien = await db.getAll('kategorien')
  if (kategorien.length === 0) {
    for (const k of STANDARD_KATEGORIEN) await db.put('kategorien', k)
    kategorien = STANDARD_KATEGORIEN
  }
  const gespeichert = (await db.get('einstellungen', 'app')) || {}
  const einstellungen = { ...STANDARD_EINSTELLUNGEN, ...gespeichert, logo: alsBlob(gespeichert.logo) }
  return {
    dauerhaft: db.dauerhaft,
    kategorien,
    buchungen: await db.getAll('buchungen'),
    belege: await db.getAll('belege'),
    einstellungen,
  }
}

/**
 * Speichert eine neue oder geänderte Buchung.
 * neueDateien: File/Blob-Liste, entfernteBelegIds: IDs von Belegen, die wegfallen.
 * Gibt { buchung, neueBelege } zurück.
 */
export async function buchungSpeichern(daten, { neueDateien = [], entfernteBelegIds = [] } = {}) {
  const db = await speicher()
  const jetzt = new Date().toISOString()
  const buchung = {
    id: daten.id || neueId(),
    art: daten.art,
    datum: daten.datum,
    betrag_cent: daten.betrag_cent,
    anbieter_quelle: (daten.anbieter_quelle || '').trim(),
    kategorie_id: daten.kategorie_id,
    notiz: (daten.notiz || '').trim(),
    wiederkehrend_id: daten.wiederkehrend_id ?? null,
    erstellt_am: daten.erstellt_am || jetzt,
  }
  // Dateien vorher vollständig einlesen: Safari speichert reine Daten zuverlässiger als File-Objekte,
  // und innerhalb einer Transaktion darf nicht auf andere Dinge gewartet werden.
  const neueBelege = []
  const dateiInhalte = []
  for (const datei of neueDateien) {
    const beleg = {
      id: neueId(),
      buchung_id: buchung.id,
      dateiname: datei.name || 'beleg',
      dateityp: datei.type || 'application/octet-stream',
      groesse: datei.size,
      erstellt_am: jetzt,
    }
    neueBelege.push(beleg)
    dateiInhalte.push({ id: beleg.id, typ: beleg.dateityp, daten: await datei.arrayBuffer() })
  }

  await db.transaktion(['buchungen', 'belege', 'beleg_dateien'], (store) => {
    store('buchungen').put(buchung)
    for (const id of entfernteBelegIds) {
      store('belege').delete(id)
      store('beleg_dateien').delete(id)
    }
    for (const beleg of neueBelege) store('belege').put(beleg)
    for (const { id, typ, daten } of dateiInhalte) store('beleg_dateien').put({ typ, daten }, id)
  })
  return { buchung, neueBelege }
}

export async function buchungLoeschen(id, belegIds) {
  const db = await speicher()
  await db.transaktion(['buchungen', 'belege', 'beleg_dateien'], (store) => {
    for (const belegId of belegIds) {
      store('belege').delete(belegId)
      store('beleg_dateien').delete(belegId)
    }
    store('buchungen').delete(id)
  })
}

export async function belegDatei(belegId) {
  const db = await speicher()
  return alsBlob(await db.get('beleg_dateien', belegId))
}

export async function kategorieSpeichern(daten) {
  const db = await speicher()
  const kategorie = {
    id: daten.id || neueId(),
    name: daten.name.trim(),
    art: daten.art,
    farbe: daten.farbe,
    symbol: daten.symbol || '',
    reihenfolge: daten.reihenfolge ?? Date.now(),
  }
  await db.put('kategorien', kategorie)
  return kategorie
}

export async function kategorieLoeschen(id) {
  const db = await speicher()
  await db.delete('kategorien', id)
}

export async function einstellungenSpeichern(einstellungen) {
  const db = await speicher()
  await db.put('einstellungen', { ...einstellungen, logo: await alsDaten(einstellungen.logo) }, 'app')
  return einstellungen
}

/** Alles inklusive Beleg-Dateien – für die Sicherung. dateien: { [belegId]: Blob } */
export async function sicherungLesen() {
  const db = await speicher()
  const daten = await allesLaden()
  const dateien = {}
  for (const beleg of daten.belege) {
    const blob = alsBlob(await db.get('beleg_dateien', beleg.id))
    if (blob) dateien[beleg.id] = blob
  }
  return { ...daten, dateien }
}

/**
 * Ersetzt alle Daten auf dem Gerät durch eine Sicherung – in einem Schritt:
 * Klappt etwas nicht, bleibt der alte Stand vollständig erhalten.
 */
export async function allesErsetzen({ einstellungen, kategorien, buchungen, belege, dateien }) {
  const db = await speicher()
  const inhalte = []
  for (const beleg of belege) {
    if (dateien[beleg.id]) inhalte.push([beleg, await alsDaten(dateien[beleg.id])])
  }
  const logo = await alsDaten(einstellungen.logo)
  await db.transaktion(ALLE_STORES, (store) => {
    for (const name of ALLE_STORES) store(name).clear()
    store('einstellungen').put({ ...einstellungen, logo }, 'app')
    for (const k of kategorien) store('kategorien').put(k)
    for (const b of buchungen) store('buchungen').put(b)
    for (const [beleg, inhalt] of inhalte) {
      store('belege').put(beleg)
      store('beleg_dateien').put(inhalt, beleg.id)
    }
  })
}

/** Belegter Speicher auf dem Gerät (sofern der Browser es verrät) */
export async function speicherStand() {
  try {
    const [schaetzung, dauerhaft] = await Promise.all([
      navigator.storage?.estimate?.(),
      navigator.storage?.persisted?.(),
    ])
    return { belegt: schaetzung?.usage ?? null, dauerhaft: dauerhaft ?? null }
  } catch {
    return { belegt: null, dauerhaft: null }
  }
}
