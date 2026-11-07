// Deutsche Formate: 1.234,56 € und TT.MM.JJJJ.
// Beträge werden intern immer als ganze Cent gespeichert (keine Rundungsfehler bei Summen).

const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export function euro(cent) {
  return euroFormat.format((cent || 0) / 100)
}

/** Betrag für ein Eingabefeld, z. B. 123456 -> "1234,56" */
export function centZuEingabe(cent) {
  if (cent == null) return ''
  return (cent / 100).toFixed(2).replace('.', ',')
}

/**
 * Liest eine Betragseingabe und gibt ganze Cent zurück (oder null, wenn ungültig).
 * Akzeptiert "12,99", "1.234,56", "1234.56", "12", "12,5 €".
 */
export function parseBetrag(eingabe) {
  if (eingabe == null) return null
  let s = String(eingabe).replace(/[€\s ]/g, '')
  if (!s) return null
  if (s.includes(',')) {
    // Komma = Dezimaltrennzeichen, Punkte sind Tausendertrennzeichen
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.234" oder "12.345.678" -> Tausenderpunkte
    s = s.replace(/\./g, '')
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const cent = Math.round(Number(s) * 100)
  return cent > 0 ? cent : null
}

/** ISO-Datum (JJJJ-MM-TT) -> TT.MM.JJJJ */
export function datum(iso) {
  if (!iso) return ''
  const [j, m, t] = iso.slice(0, 10).split('-')
  return `${t}.${m}.${j}`
}

/** Heutiges Datum als JJJJ-MM-TT in Ortszeit */
export function heuteISO(jetzt = new Date()) {
  const j = jetzt.getFullYear()
  const m = String(jetzt.getMonth() + 1).padStart(2, '0')
  const t = String(jetzt.getDate()).padStart(2, '0')
  return `${j}-${m}-${t}`
}

export const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** monat: 1–12 */
export function monatsName(monat) {
  return MONATE[monat - 1] ?? ''
}

export function dateiGroesse(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
