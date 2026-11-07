// Vorschläge aus dem Konzept. Farbe = Platz in der Kategorie-Palette (siehe index.css).

export const FARBEN = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7', 'cat-8', 'cat-grau']

export function farbVariable(farbe) {
  return `var(--${FARBEN.includes(farbe) ? farbe : 'cat-grau'})`
}

export const STANDARD_KATEGORIEN = [
  { id: 'k-apple', name: 'Apple-Entwicklerkonto', art: 'ausgabe', farbe: 'cat-1', symbol: '🍏' },
  { id: 'k-google-play', name: 'Google Play', art: 'ausgabe', farbe: 'cat-2', symbol: '▶️' },
  { id: 'k-domain', name: 'Domain und Hosting', art: 'ausgabe', farbe: 'cat-3', symbol: '🌐' },
  { id: 'k-ki', name: 'KI-Abos', art: 'ausgabe', farbe: 'cat-4', symbol: '✨' },
  { id: 'k-software', name: 'Software', art: 'ausgabe', farbe: 'cat-5', symbol: '💻' },
  { id: 'k-design', name: 'Design und Logo', art: 'ausgabe', farbe: 'cat-6', symbol: '🎨' },
  { id: 'k-werbung-aus', name: 'Werbung und Marketing', art: 'ausgabe', farbe: 'cat-7', symbol: '📣' },
  { id: 'k-steuer', name: 'Steuerberatung und Gebühren', art: 'ausgabe', farbe: 'cat-8', symbol: '🧾' },
  { id: 'k-sonstiges-aus', name: 'Sonstiges', art: 'ausgabe', farbe: 'cat-grau', symbol: '📦' },
  { id: 'k-werbung-ein', name: 'Werbung', art: 'einnahme', farbe: 'cat-1', symbol: '📺' },
  { id: 'k-abo', name: 'Abo', art: 'einnahme', farbe: 'cat-3', symbol: '🔁' },
  { id: 'k-sonstiges-ein', name: 'Sonstiges', art: 'einnahme', farbe: 'cat-grau', symbol: '💶' },
].map((k, i) => ({ ...k, reihenfolge: i }))
