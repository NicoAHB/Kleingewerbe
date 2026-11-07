// Beleg-Fotos vor dem Speichern verkleinern.
// Ein iPhone-Foto hat oft 3–8 MB. Auf 2400 px an der langen Kante und JPEG-Qualität 0,85
// bleibt ein Kassenbon gut lesbar, braucht aber meist nur 0,4–1 MB. PDFs bleiben unverändert.

export const MAX_KANTE = 2400
const QUALITAET = 0.85
const AB_GROESSE = 700 * 1024 // kleinere Bilder werden nicht angefasst

/** Zielgröße für ein Bild, Seitenverhältnis bleibt erhalten */
export function zielMasse(breite, hoehe, maxKante = MAX_KANTE) {
  const faktor = Math.min(1, maxKante / Math.max(breite, hoehe))
  return { breite: Math.round(breite * faktor), hoehe: Math.round(hoehe * faktor) }
}

export function sollVerkleinertWerden(datei) {
  const typ = datei?.type || ''
  if (!typ.startsWith('image/')) return false
  if (typ === 'image/svg+xml' || typ === 'image/gif') return false
  return datei.size > AB_GROESSE
}

async function bildDekodieren(datei) {
  if (globalThis.createImageBitmap) {
    try {
      return await createImageBitmap(datei, { imageOrientation: 'from-image' })
    } catch {
      // ältere Browser: weiter mit <img>
    }
  }
  const url = URL.createObjectURL(datei)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Gibt eine verkleinerte Kopie zurück – oder das Original, wenn das nichts bringt oder nicht klappt. */
export async function belegVorbereiten(datei) {
  if (!sollVerkleinertWerden(datei)) return datei
  try {
    const bild = await bildDekodieren(datei)
    const { breite, hoehe } = zielMasse(bild.width, bild.height)
    const canvas = document.createElement('canvas')
    canvas.width = breite
    canvas.height = hoehe
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // durchsichtige Flächen werden weiß statt schwarz
    ctx.fillRect(0, 0, breite, hoehe)
    ctx.drawImage(bild, 0, 0, breite, hoehe)
    bild.close?.()
    const blob = await new Promise((fertig) => canvas.toBlob(fertig, 'image/jpeg', QUALITAET))
    canvas.width = canvas.height = 0 // Speicher auf dem iPhone sofort freigeben
    if (!blob || blob.size >= datei.size) return datei
    const name = `${(datei.name || 'beleg').replace(/\.[^.]+$/, '')}.jpg`
    return new File([blob], name, { type: 'image/jpeg', lastModified: datei.lastModified })
  } catch {
    return datei
  }
}
