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
        db.createObjectStore('beleg_dateien') // Schlüssel = Beleg-ID, Wert = Blob
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
  await db.put('buchungen', buchung)

  for (const id of entfernteBelegIds) {
    await db.delete('belege', id)
    await db.delete('beleg_dateien', id)
  }

  const neueBelege = []
  for (const datei of neueDateien) {
    const beleg = {
      id: neueId(),
      buchung_id: buchung.id,
      dateiname: datei.name || 'beleg',
      dateityp: datei.type || 'application/octet-stream',
      groesse: datei.size,
      erstellt_am: jetzt,
    }
    await db.put('beleg_dateien', datei, beleg.id)
    await db.put('belege', beleg)
    neueBelege.push(beleg)
  }
  return { buchung, neueBelege }
}

export async function buchungLoeschen(id, belegIds) {
  const db = await speicher()
  for (const belegId of belegIds) {
    await db.delete('belege', belegId)
    await db.delete('beleg_dateien', belegId)
  }
  await db.delete('buchungen', id)
}

export async function belegDatei(belegId) {
  const db = await speicher()
  return db.get('beleg_dateien', belegId)
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
