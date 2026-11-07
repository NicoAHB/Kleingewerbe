// Reine Rechenfunktionen ohne Speicherzugriff – leicht zu testen.

export function summe(buchungen) {
  return buchungen.reduce((s, b) => s + b.betrag_cent, 0)
}

export function jahrVon(b) {
  return Number(b.datum.slice(0, 4))
}

export function monatVon(b) {
  return Number(b.datum.slice(5, 7))
}

/** Neueste zuerst: nach Datum, bei gleichem Datum nach Erfassungszeit */
export function sortiereNeuesteZuerst(buchungen) {
  return [...buchungen].sort(
    (a, b) => b.datum.localeCompare(a.datum) || (b.erstellt_am || '').localeCompare(a.erstellt_am || ''),
  )
}

/**
 * filter: { art, jahr, monat, kategorieId, suche }
 * jahr/monat/kategorieId: leer = alle
 */
export function filterBuchungen(buchungen, filter, kategorienById = {}) {
  const suche = (filter.suche || '').trim().toLocaleLowerCase('de')
  return buchungen.filter((b) => {
    if (filter.art && b.art !== filter.art) return false
    if (filter.jahr && jahrVon(b) !== Number(filter.jahr)) return false
    if (filter.monat && monatVon(b) !== Number(filter.monat)) return false
    if (filter.kategorieId && b.kategorie_id !== filter.kategorieId) return false
    if (suche) {
      const text = [b.anbieter_quelle, b.notiz, kategorienById[b.kategorie_id]?.name]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('de')
      if (!text.includes(suche)) return false
    }
    return true
  })
}

export function monatsBilanz(buchungen, jahr, monat) {
  const imMonat = buchungen.filter((b) => jahrVon(b) === jahr && monatVon(b) === monat)
  const einnahmen = summe(imMonat.filter((b) => b.art === 'einnahme'))
  const ausgaben = summe(imMonat.filter((b) => b.art === 'ausgabe'))
  return { einnahmen, ausgaben, ergebnis: einnahmen - ausgaben }
}

/** Summen je Kategorie, größte zuerst: [{ kategorie_id, summe }] */
export function summenNachKategorie(buchungen) {
  const map = new Map()
  for (const b of buchungen) {
    map.set(b.kategorie_id, (map.get(b.kategorie_id) || 0) + b.betrag_cent)
  }
  return [...map.entries()]
    .map(([kategorie_id, s]) => ({ kategorie_id, summe: s }))
    .sort((a, b) => b.summe - a.summe)
}

/** Gruppiert (bereits sortierte) Buchungen nach Monat: [{ schluessel: 'JJJJ-MM', jahr, monat, buchungen, summe }] */
export function nachMonatGruppieren(buchungen) {
  const gruppen = []
  let aktuell = null
  for (const b of buchungen) {
    const schluessel = b.datum.slice(0, 7)
    if (!aktuell || aktuell.schluessel !== schluessel) {
      aktuell = { schluessel, jahr: jahrVon(b), monat: monatVon(b), buchungen: [], summe: 0 }
      gruppen.push(aktuell)
    }
    aktuell.buchungen.push(b)
    aktuell.summe += b.betrag_cent
  }
  return gruppen
}

/** Alle Jahre, in denen es Buchungen gibt, plus das aktuelle Jahr – neueste zuerst */
export function verfuegbareJahre(buchungen, aktuellesJahr) {
  const jahre = new Set([aktuellesJahr, ...buchungen.map(jahrVon)])
  return [...jahre].sort((a, b) => b - a)
}
