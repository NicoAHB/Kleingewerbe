import { describe, expect, it } from 'vitest'
import { sollVerkleinertWerden, zielMasse } from './bild.js'

describe('Beleg-Fotos verkleinern', () => {
  it('begrenzt die lange Kante und behält das Seitenverhältnis', () => {
    expect(zielMasse(3024, 4032)).toEqual({ breite: 1800, hoehe: 2400 })
    expect(zielMasse(4032, 3024)).toEqual({ breite: 2400, hoehe: 1800 })
  })
  it('vergrößert kleine Bilder nie', () => {
    expect(zielMasse(800, 600)).toEqual({ breite: 800, hoehe: 600 })
  })
  it('fasst nur große Fotos an, nie PDFs', () => {
    expect(sollVerkleinertWerden({ type: 'image/jpeg', size: 4_000_000 })).toBe(true)
    expect(sollVerkleinertWerden({ type: 'image/jpeg', size: 200_000 })).toBe(false)
    expect(sollVerkleinertWerden({ type: 'application/pdf', size: 4_000_000 })).toBe(false)
    expect(sollVerkleinertWerden({ type: 'image/svg+xml', size: 4_000_000 })).toBe(false)
  })
})
