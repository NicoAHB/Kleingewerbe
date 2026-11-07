// Sicherung als ZIP-Datei: daten.json (alle Buchungen, Kategorien, Einstellungen) plus Ordner „Belege“.
// Die Belege sind lesbar benannt (JJJJ-MM-TT_Anbieter_Betrag), damit die ZIP-Datei auch ohne App
// verständlich ist – z. B. in der Dateien-App auf dem iPad.

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { datum as fmtDatum, heuteISO } from './format.js'

export const SICHERUNG_FORMAT = 'nvf-finanzen-sicherung'
export const SICHERUNG_VERSION = 1
const TAG = 24 * 60 * 60 * 1000

export class SicherungsFehler extends Error {}

export function sicherungsDateiname(jetzt = new Date()) {
  return `NvF-Finanzen-Sicherung-${heuteISO(jetzt)}.zip`
}

const ENDUNGEN = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

function endung(dateiname, typ) {
  const ausName = /\.([a-z0-9]{2,5})$/i.exec(dateiname || '')?.[1]
  return (ausName || ENDUNGEN[typ] || 'bin').toLowerCase()
}

/** Zeichen entfernen, die in Dateinamen Probleme machen */
function sauber(text) {
  return (text || '')
    .normalize('NFC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

/** z. B. "2026-11-02_Apple_99,00.jpg"; bei Doppelungen "_2", "_3" … */
export function belegDateiname(buchung, beleg, vergeben) {
  const anbieter = sauber(buchung.anbieter_quelle) || (buchung.art === 'einnahme' ? 'Einnahme' : 'Ausgabe')
  const betrag = (buchung.betrag_cent / 100).toFixed(2).replace('.', ',')
  const basis = `${buchung.datum}_${anbieter}_${betrag}`
  const ext = endung(beleg.dateiname, beleg.dateityp)
  let name = `${basis}.${ext}`
  for (let i = 2; vergeben.has(name); i += 1) name = `${basis}_${i}.${ext}`
  vergeben.add(name)
  return name
}

async function bytes(blob) {
  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * Erstellt die Sicherungsdatei.
 * daten: { einstellungen, kategorien, buchungen, belege, dateien: { [belegId]: Blob } }
 */
export async function sicherungErstellen(daten, jetzt = new Date()) {
  const { einstellungen, kategorien, buchungen, belege, dateien } = daten
  const buchungById = Object.fromEntries(buchungen.map((b) => [b.id, b]))
  const vergeben = new Set()

  const belegEintraege = []
  for (const beleg of belege) {
    const buchung = buchungById[beleg.buchung_id]
    if (!buchung || !dateien[beleg.id]) continue
    belegEintraege.push({ beleg: { ...beleg, datei: `Belege/${belegDateiname(buchung, beleg, vergeben)}` }, blob: dateien[beleg.id] })
  }

  const { logo, beispieldatenGeladen: _beispiel, ...restEinstellungen } = einstellungen
  const logoPfad = logo ? `logo.${endung(logo.name, logo.type)}` : null

  const inhalt = {
    format: SICHERUNG_FORMAT,
    version: SICHERUNG_VERSION,
    erstellt_am: jetzt.toISOString(),
    einstellungen: { ...restEinstellungen, logo: logoPfad ? { datei: logoPfad, typ: logo.type } : null },
    kategorien,
    buchungen,
    belege: belegEintraege.map((e) => e.beleg),
  }

  const liesMich = [
    `Sicherung von NvF Finanzen vom ${fmtDatum(heuteISO(jetzt))}`,
    `${einstellungen.firmenname || ''}`.trim(),
    '',
    `Enthält ${buchungen.length} Buchungen und ${belegEintraege.length} Belege.`,
    'Die Belege im Ordner „Belege“ sind nach Datum_Anbieter_Betrag benannt.',
    '',
    'Wiederherstellen: In der App unter Mehr → Sicherung → „Sicherung wiederherstellen“ diese ZIP-Datei auswählen.',
    'Die Datei bitte nicht entpacken und neu verpacken – sonst erkennt die App sie nicht mehr.',
    '',
  ].join('\n')

  // Reihenfolge in der ZIP-Datei: zuerst die Übersicht, dann die Dateien
  const eintraege = {
    'daten.json': [strToU8(JSON.stringify(inhalt, null, 1)), { level: 6 }],
    'LIESMICH.txt': [strToU8(liesMich), { level: 6 }],
  }
  if (logoPfad) eintraege[logoPfad] = [await bytes(logo), { level: 0 }]
  // Fotos und PDFs sind schon komprimiert – nur ablegen, das geht schnell
  for (const { beleg, blob } of belegEintraege) eintraege[beleg.datei] = [await bytes(blob), { level: 0 }]

  const zip = zipSync(eintraege, { mtime: jetzt })
  return {
    datei: new File([zip], sicherungsDateiname(jetzt), { type: 'application/zip' }),
    anzahlBuchungen: buchungen.length,
    anzahlBelege: belegEintraege.length,
  }
}

const ARTEN = new Set(['ausgabe', 'einnahme'])

function pruefe(bedingung, text) {
  if (!bedingung) throw new SicherungsFehler(text)
}

/** Liest eine Sicherungsdatei und prüft sie gründlich, bevor irgendetwas überschrieben wird. */
export async function sicherungAuslesen(datei) {
  let eintraege
  try {
    eintraege = unzipSync(await bytes(datei))
  } catch {
    throw new SicherungsFehler('Die Datei ist keine ZIP-Datei. Bitte eine Sicherung von NvF Finanzen auswählen.')
  }
  pruefe(eintraege['daten.json'], 'In der Datei fehlt daten.json. Bitte eine Sicherung von NvF Finanzen auswählen.')

  let inhalt
  try {
    inhalt = JSON.parse(strFromU8(eintraege['daten.json']))
  } catch {
    throw new SicherungsFehler('Die Sicherung ist beschädigt (daten.json nicht lesbar).')
  }
  pruefe(inhalt?.format === SICHERUNG_FORMAT, 'Das ist keine Sicherung von NvF Finanzen.')
  pruefe(
    Number(inhalt.version) <= SICHERUNG_VERSION,
    'Diese Sicherung stammt aus einer neueren Version der App. Bitte die App zuerst aktualisieren.',
  )

  const { kategorien, buchungen, belege, einstellungen } = inhalt
  pruefe(Array.isArray(kategorien) && Array.isArray(buchungen) && Array.isArray(belege), 'Die Sicherung ist unvollständig.')
  for (const k of kategorien) {
    pruefe(typeof k?.id === 'string' && typeof k.name === 'string' && ARTEN.has(k.art), 'Die Sicherung enthält eine ungültige Kategorie.')
  }
  for (const b of buchungen) {
    pruefe(
      typeof b?.id === 'string' &&
        ARTEN.has(b.art) &&
        /^\d{4}-\d{2}-\d{2}$/.test(b.datum) &&
        Number.isInteger(b.betrag_cent) &&
        b.betrag_cent > 0,
      'Die Sicherung enthält eine ungültige Buchung.',
    )
  }

  const dateien = {}
  const belegeOhnePfad = []
  let fehlendeBelege = 0
  for (const { datei: pfad, ...beleg } of belege) {
    const inhaltBytes = pfad && eintraege[pfad]
    if (!inhaltBytes || typeof beleg.id !== 'string') {
      fehlendeBelege += 1
      continue
    }
    dateien[beleg.id] = new Blob([inhaltBytes], { type: beleg.dateityp || 'application/octet-stream' })
    belegeOhnePfad.push(beleg)
  }

  const logoInfo = einstellungen?.logo
  const logo = logoInfo?.datei && eintraege[logoInfo.datei] ? new Blob([eintraege[logoInfo.datei]], { type: logoInfo.typ }) : null

  return {
    erstellt_am: inhalt.erstellt_am,
    einstellungen: { ...(einstellungen || {}), logo },
    kategorien,
    buchungen,
    belege: belegeOhnePfad,
    dateien,
    fehlendeBelege,
  }
}

/**
 * Soll an eine Sicherung erinnert werden?
 * Ja, wenn es Buchungen gibt und noch nie gesichert wurde – oder die letzte Sicherung
 * mindestens 7 Tage alt ist und seitdem etwas Neues erfasst wurde.
 */
export function sicherungFaellig(letzteSicherung, buchungen, jetzt = new Date()) {
  if (buchungen.length === 0) return { faellig: false, tage: null }
  if (!letzteSicherung) return { faellig: true, tage: null }
  const tage = Math.floor((jetzt - new Date(letzteSicherung)) / TAG)
  const neues = buchungen.some((b) => (b.erstellt_am || '') > letzteSicherung)
  return { faellig: tage >= 7 && neues, tage }
}
