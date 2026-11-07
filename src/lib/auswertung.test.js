import { describe, expect, it } from 'vitest'
import {
  filterBuchungen,
  monatsBilanz,
  nachMonatGruppieren,
  sortiereNeuesteZuerst,
  summe,
  summenNachKategorie,
  verfuegbareJahre,
} from './auswertung.js'

const b = (id, art, datum, betrag_cent, kategorie_id, anbieter_quelle = '', notiz = '') => ({
  id, art, datum, betrag_cent, kategorie_id, anbieter_quelle, notiz, erstellt_am: `${datum}T10:00:00Z`,
})

const buchungen = [
  b('1', 'ausgabe', '2026-09-02', 9900, 'k-apple', 'Apple'),
  b('2', 'ausgabe', '2026-11-01', 1800, 'k-ki', 'Anthropic'),
  b('3', 'ausgabe', '2026-11-03', 1500, 'k-software', 'Figma', 'Abo Design'),
  b('4', 'einnahme', '2026-11-02', 1240, 'k-werbung-ein', 'Google AdMob'),
  b('5', 'ausgabe', '2025-12-30', 1000, 'k-ki', 'Anthropic'),
  b('6', 'ausgabe', '2026-11-03', 10, 'k-ki', 'Anthropic'),
]
const kategorienById = { 'k-software': { name: 'Software' }, 'k-ki': { name: 'KI-Abos' } }

describe('Summen', () => {
  it('Jahressumme entspricht den Einzelbuchungen', () => {
    const jahr2026 = filterBuchungen(buchungen, { art: 'ausgabe', jahr: '2026' })
    expect(summe(jahr2026)).toBe(9900 + 1800 + 1500 + 10)
  })

  it('Monatsbilanz trennt Einnahmen und Ausgaben', () => {
    expect(monatsBilanz(buchungen, 2026, 11)).toEqual({ einnahmen: 1240, ausgaben: 3310, ergebnis: -2070 })
  })

  it('summiert nach Kategorie, größte zuerst', () => {
    const nov = filterBuchungen(buchungen, { art: 'ausgabe', jahr: 2026, monat: 11 })
    expect(summenNachKategorie(nov)).toEqual([
      { kategorie_id: 'k-ki', summe: 1810 },
      { kategorie_id: 'k-software', summe: 1500 },
    ])
  })
})

describe('Filter', () => {
  it('sucht in Anbieter, Notiz und Kategoriename', () => {
    expect(filterBuchungen(buchungen, { suche: 'figma' }).map((x) => x.id)).toEqual(['3'])
    expect(filterBuchungen(buchungen, { suche: 'design' }).map((x) => x.id)).toEqual(['3'])
    expect(filterBuchungen(buchungen, { suche: 'ki-abos' }, kategorienById).map((x) => x.id)).toEqual(['2', '5', '6'])
  })

  it('filtert nach Kategorie und Jahr', () => {
    expect(filterBuchungen(buchungen, { kategorieId: 'k-ki', jahr: '2025' }).map((x) => x.id)).toEqual(['5'])
  })
})

describe('Sortierung und Gruppen', () => {
  it('gruppiert nach Monat mit Zwischensumme', () => {
    const gruppen = nachMonatGruppieren(sortiereNeuesteZuerst(buchungen.filter((x) => x.art === 'ausgabe')))
    expect(gruppen.map((g) => [g.schluessel, g.summe])).toEqual([
      ['2026-11', 3310],
      ['2026-09', 9900],
      ['2025-12', 1000],
    ])
  })

  it('listet Jahre absteigend inklusive aktuellem Jahr', () => {
    expect(verfuegbareJahre(buchungen, 2027)).toEqual([2027, 2026, 2025])
  })
})
