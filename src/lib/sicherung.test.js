import { describe, expect, it } from 'vitest'
import { strToU8, unzipSync, zipSync } from 'fflate'
import {
  belegDateiname,
  sicherungAuslesen,
  sicherungErstellen,
  sicherungFaellig,
  sicherungsDateiname,
  SicherungsFehler,
} from './sicherung.js'

const jetzt = new Date('2026-11-07T10:00:00Z')
const kategorien = [{ id: 'k-apple', name: 'Apple-Entwicklerkonto', art: 'ausgabe', farbe: 'cat-1', symbol: '🍏' }]
const buchungen = [
  { id: 'b1', art: 'ausgabe', datum: '2026-11-02', betrag_cent: 9900, anbieter_quelle: 'Apple', kategorie_id: 'k-apple', notiz: 'Jahr', erstellt_am: '2026-11-02T08:00:00Z' },
  { id: 'b2', art: 'ausgabe', datum: '2026-11-02', betrag_cent: 9900, anbieter_quelle: 'Apple', kategorie_id: 'k-apple', notiz: '', erstellt_am: '2026-11-02T09:00:00Z' },
]
const belege = [
  { id: 'x1', buchung_id: 'b1', dateiname: 'IMG_0001.JPG', dateityp: 'image/jpeg', groesse: 3, erstellt_am: '2026-11-02T08:00:00Z' },
  { id: 'x2', buchung_id: 'b2', dateiname: 'rechnung.pdf', dateityp: 'application/pdf', groesse: 4, erstellt_am: '2026-11-02T09:00:00Z' },
  { id: 'x3', buchung_id: 'b2', dateiname: 'foto.jpg', dateityp: 'image/jpeg', groesse: 2, erstellt_am: '2026-11-02T09:00:00Z' },
]
const dateien = {
  x1: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
  x2: new Blob(['%PDF'], { type: 'application/pdf' }),
  x3: new Blob([new Uint8Array([9, 9])], { type: 'image/jpeg' }),
}
const einstellungen = { firmenname: 'NvF Digital', logo: null, letzteSicherung: null, beispieldatenGeladen: true }

describe('Sicherung erstellen', () => {
  it('benennt die Datei mit Datum', () => {
    expect(sicherungsDateiname(new Date(2026, 10, 7))).toBe('NvF-Finanzen-Sicherung-2026-11-07.zip')
  })

  it('benennt Belege nach Datum_Anbieter_Betrag, ohne Doppelungen und ohne Sonderzeichen', () => {
    const vergeben = new Set()
    expect(belegDateiname(buchungen[0], belege[0], vergeben)).toBe('2026-11-02_Apple_99,00.jpg')
    expect(belegDateiname(buchungen[1], belege[2], vergeben)).toBe('2026-11-02_Apple_99,00_2.jpg')
    expect(belegDateiname({ ...buchungen[0], anbieter_quelle: 'A/B: "Test"' }, belege[1], vergeben)).toBe('2026-11-02_AB Test_99,00.pdf')
    expect(belegDateiname({ ...buchungen[0], art: 'einnahme', anbieter_quelle: '' }, belege[1], vergeben)).toBe('2026-11-02_Einnahme_99,00.pdf')
  })

  it('enthält daten.json, LIESMICH und alle Belege', async () => {
    const { datei, anzahlBuchungen, anzahlBelege } = await sicherungErstellen(
      { einstellungen, kategorien, buchungen, belege, dateien },
      jetzt,
    )
    expect(datei.name).toBe('NvF-Finanzen-Sicherung-2026-11-07.zip')
    expect([anzahlBuchungen, anzahlBelege]).toEqual([2, 3])
    const inhalt = unzipSync(new Uint8Array(await datei.arrayBuffer()))
    expect(Object.keys(inhalt)).toEqual([
      'daten.json',
      'LIESMICH.txt',
      'Belege/2026-11-02_Apple_99,00.jpg',
      'Belege/2026-11-02_Apple_99,00.pdf',
      'Belege/2026-11-02_Apple_99,00_2.jpg',
    ])
    expect([...inhalt['Belege/2026-11-02_Apple_99,00.jpg']]).toEqual([1, 2, 3])
  })
})

describe('Sicherung wiederherstellen', () => {
  it('liest alles unverändert zurück', async () => {
    const logo = new Blob(['<svg/>'], { type: 'image/svg+xml' })
    const { datei } = await sicherungErstellen(
      { einstellungen: { ...einstellungen, logo }, kategorien, buchungen, belege, dateien },
      jetzt,
    )
    const zurueck = await sicherungAuslesen(datei)
    expect(zurueck.buchungen).toEqual(buchungen)
    expect(zurueck.kategorien).toEqual(kategorien)
    expect(zurueck.belege).toEqual(belege)
    expect(zurueck.fehlendeBelege).toBe(0)
    expect(zurueck.erstellt_am).toBe(jetzt.toISOString())
    expect([...new Uint8Array(await zurueck.dateien.x1.arrayBuffer())]).toEqual([1, 2, 3])
    expect(zurueck.dateien.x2.type).toBe('application/pdf')
    expect(await zurueck.einstellungen.logo.text()).toBe('<svg/>')
    expect(zurueck.einstellungen.firmenname).toBe('NvF Digital')
    expect(zurueck.einstellungen.beispieldatenGeladen).toBeUndefined()
  })

  const zipMit = (daten) => new Blob([zipSync({ 'daten.json': strToU8(JSON.stringify(daten)) })])
  const gueltig = { format: 'nvf-finanzen-sicherung', version: 1, kategorien, buchungen, belege: [], einstellungen }

  it.each([
    ['keine ZIP-Datei', new Blob(['hallo']), /keine ZIP-Datei/],
    ['ZIP ohne daten.json', new Blob([zipSync({ 'a.txt': strToU8('x') })]), /fehlt daten.json/],
    ['fremdes Format', zipMit({ ...gueltig, format: 'anders' }), /keine Sicherung/],
    ['neuere Version', zipMit({ ...gueltig, version: 2 }), /neueren Version/],
    ['ungültiger Betrag', zipMit({ ...gueltig, buchungen: [{ ...buchungen[0], betrag_cent: -5 }] }), /ungültige Buchung/],
    ['ungültiges Datum', zipMit({ ...gueltig, buchungen: [{ ...buchungen[0], datum: '02.11.2026' }] }), /ungültige Buchung/],
  ])('lehnt ab: %s', async (_name, datei, meldung) => {
    await expect(sicherungAuslesen(datei)).rejects.toThrow(SicherungsFehler)
    await expect(sicherungAuslesen(datei)).rejects.toThrow(meldung)
  })

  it('zählt Belege, deren Datei fehlt', async () => {
    const datei = zipMit({ ...gueltig, belege: [{ ...belege[0], datei: 'Belege/fehlt.jpg' }] })
    const zurueck = await sicherungAuslesen(datei)
    expect(zurueck.fehlendeBelege).toBe(1)
    expect(zurueck.belege).toEqual([])
  })
})

describe('Erinnerung an die Sicherung', () => {
  it('erinnert, wenn noch nie gesichert wurde', () => {
    expect(sicherungFaellig(null, buchungen, jetzt)).toEqual({ faellig: true, tage: null })
  })
  it('erinnert nicht ohne Buchungen', () => {
    expect(sicherungFaellig(null, [], jetzt).faellig).toBe(false)
  })
  it('erinnert nach 7 Tagen, wenn seitdem etwas Neues erfasst wurde', () => {
    const neu = [...buchungen, { ...buchungen[0], id: 'b3', erstellt_am: '2026-11-05T10:00:00Z' }]
    expect(sicherungFaellig('2026-10-31T10:00:00Z', neu, jetzt)).toEqual({ faellig: true, tage: 7 })
    expect(sicherungFaellig('2026-11-01T10:00:00Z', neu, jetzt)).toEqual({ faellig: false, tage: 6 })
    // Lange her, aber seitdem nichts Neues: keine Erinnerung
    expect(sicherungFaellig('2026-11-03T10:00:00Z', buchungen, new Date('2026-11-20T10:00:00Z'))).toEqual({ faellig: false, tage: 17 })
  })
})
