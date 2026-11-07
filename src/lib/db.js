// Lokaler Speicher (IndexedDB) für den Entwurf.
// Die Funktionen entsprechen dem Datenmodell aus dem Konzept (buchungen, belege, kategorien,
// einstellungen). In Schritt 2 wird diese Datei durch eine Supabase-Variante mit denselben
// Funktionen ersetzt – die Bildschirme bleiben unverändert.

import { openDB } from 'idb'
import { STANDARD_KATEGORIEN } from './kategorien.js'

const DB_NAME = 'nvf-finanzen'
const DB_VERSION = 1

export const STANDARD_EINSTELLUNGEN = {
  firmenname: 'NvF Digital',
  logo: null, // eigenes Logo als Blob (optional)
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
  const einstellungen = { ...STANDARD_EINSTELLUNGEN, ...((await db.get('einstellungen', 'app')) || {}) }
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
  const eintrag = await db.get('beleg_dateien', belegId)
  if (!eintrag) return null
  if (eintrag instanceof Blob) return eintrag // vor Version 0.2 als Blob gespeichert
  return new Blob([eintrag.daten], { type: eintrag.typ })
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
  await db.put('einstellungen', einstellungen, 'app')
  return einstellungen
}
