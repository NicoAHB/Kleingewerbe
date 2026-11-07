import { describe, expect, it } from 'vitest'
import { centZuEingabe, datum, euro, heuteISO, parseBetrag } from './format.js'

describe('euro', () => {
  it('formatiert im deutschen Format', () => {
    expect(euro(123456).replace(/ /g, ' ')).toBe('1.234,56 €')
    expect(euro(0).replace(/ /g, ' ')).toBe('0,00 €')
  })
})

describe('parseBetrag', () => {
  it.each([
    ['12,99', 1299],
    ['1.234,56', 123456],
    ['1234.56', 123456],
    ['12', 1200],
    ['12,5 €', 1250],
    ['1.234', 123400],
    [' 99 ', 9900],
    ['0,01', 1],
  ])('%s -> %i Cent', (eingabe, cent) => {
    expect(parseBetrag(eingabe)).toBe(cent)
  })

  it.each(['', 'abc', '0', '0,00', '-5', '12,345', '1,2,3', null])('lehnt %s ab', (eingabe) => {
    expect(parseBetrag(eingabe)).toBeNull()
  })

  it('verliert keine Cent bei typischen Beträgen', () => {
    expect(parseBetrag('0,29')).toBe(29)
    expect(parseBetrag('4,35')).toBe(435)
    expect(parseBetrag('1.005,10')).toBe(100510)
  })
})

describe('Datum und Eingabe', () => {
  it('zeigt TT.MM.JJJJ', () => {
    expect(datum('2026-11-07')).toBe('07.11.2026')
  })
  it('nimmt Ortszeit für heute', () => {
    expect(heuteISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('wandelt Cent für das Eingabefeld', () => {
    expect(centZuEingabe(123456)).toBe('1234,56')
    expect(centZuEingabe(undefined)).toBe('')
  })
})
