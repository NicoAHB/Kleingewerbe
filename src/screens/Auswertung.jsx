import { IconAuswertung } from '../components/Icons.jsx'

// Laut Konzept kommt die Auswertung in Phase 2. Bis dahin ein klarer Hinweis statt leerer Seite.
const GEPLANT = [
  'Kleinunternehmer-Tracker mit Warnstufen',
  'Monatsvergleich und Jahresübersicht',
  'Einnahmen nach Quelle',
  'Break-even: bisherige Kosten minus Einnahmen',
]

export function Auswertung() {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
        <IconAuswertung size={30} />
      </div>
      <p className="font-display text-[18px] font-semibold">Auswertung folgt in Phase 2</p>
      <p className="mt-1.5 max-w-[32ch] text-[15px] text-ink-2">Hier erscheinen später:</p>
      <ul className="mt-4 w-full max-w-sm divide-y divide-line rounded-[20px] bg-surface text-left text-[15px]">
        {GEPLANT.map((p) => (
          <li key={p} className="px-4 py-3">
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
