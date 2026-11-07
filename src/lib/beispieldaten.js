// Nur für die Vorschau-Version: ein paar Beispielbuchungen, damit man die App ausprobieren kann.
// In der echten App startet alles leer.

function belegBild(titel, anbieter, betrag, datum) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820" viewBox="0 0 600 820">
  <rect width="600" height="820" fill="#ffffff"/>
  <rect x="40" y="40" width="520" height="740" fill="none" stroke="#d6d9e0" stroke-width="2"/>
  <text x="70" y="110" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#15171c">${anbieter}</text>
  <text x="70" y="150" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#555b68">${titel}</text>
  <line x1="70" y1="190" x2="530" y2="190" stroke="#d6d9e0" stroke-width="2"/>
  <text x="70" y="240" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#555b68">Rechnungsdatum</text>
  <text x="530" y="240" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#15171c">${datum}</text>
  <text x="70" y="290" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#555b68">Empfänger</text>
  <text x="530" y="290" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#15171c">NvF Digital</text>
  <line x1="70" y1="620" x2="530" y2="620" stroke="#d6d9e0" stroke-width="2"/>
  <text x="70" y="680" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#15171c">Gesamt</text>
  <text x="530" y="680" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#15171c">${betrag}</text>
  <text x="300" y="750" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#868c99">BEISPIELBELEG</text>
</svg>`
  return new File([svg], `${anbieter.toLowerCase().replace(/\s+/g, '-')}-beleg.svg`, { type: 'image/svg+xml' })
}

export function beispielBuchungen() {
  return [
    { art: 'ausgabe', datum: '2026-09-02', betrag_cent: 9900, anbieter_quelle: 'Apple', kategorie_id: 'k-apple', notiz: 'Apple Developer Program, 1 Jahr',
      dateien: [belegBild('Apple Developer Program', 'Apple', '99,00 €', '02.09.2026')] },
    { art: 'ausgabe', datum: '2026-09-03', betrag_cent: 2348, anbieter_quelle: 'Google', kategorie_id: 'k-google-play', notiz: 'Play Console, einmalig' },
    { art: 'ausgabe', datum: '2026-10-05', betrag_cent: 1200, anbieter_quelle: 'IONOS', kategorie_id: 'k-domain', notiz: 'Domain sattplan.de' },
    { art: 'ausgabe', datum: '2026-10-12', betrag_cent: 1800, anbieter_quelle: 'Anthropic', kategorie_id: 'k-ki', notiz: '' },
    { art: 'ausgabe', datum: '2026-10-20', betrag_cent: 8500, anbieter_quelle: 'Fiverr', kategorie_id: 'k-design', notiz: 'Logo-Entwurf' },
    { art: 'ausgabe', datum: '2026-11-01', betrag_cent: 1800, anbieter_quelle: 'Anthropic', kategorie_id: 'k-ki', notiz: '',
      dateien: [belegBild('Abo November', 'Anthropic', '18,00 €', '01.11.2026')] },
    { art: 'ausgabe', datum: '2026-11-03', betrag_cent: 1500, anbieter_quelle: 'Figma', kategorie_id: 'k-software', notiz: '' },
    { art: 'ausgabe', datum: '2026-11-04', betrag_cent: 3000, anbieter_quelle: 'Meta', kategorie_id: 'k-werbung-aus', notiz: 'Testkampagne SattPlan' },
    { art: 'ausgabe', datum: '2026-11-05', betrag_cent: 2600, anbieter_quelle: 'Gemeinde', kategorie_id: 'k-steuer', notiz: 'Gewerbeanmeldung' },
    { art: 'einnahme', datum: '2026-11-02', betrag_cent: 1240, anbieter_quelle: 'Google AdMob', kategorie_id: 'k-werbung-ein', notiz: 'Erste Werbeeinnahmen' },
    { art: 'einnahme', datum: '2026-11-06', betrag_cent: 799, anbieter_quelle: 'Apple', kategorie_id: 'k-abo', notiz: '' },
  ]
}
