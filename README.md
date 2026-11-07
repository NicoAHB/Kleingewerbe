# NvF Finanzen

Einnahmen-/Ausgaben-App für das Kleingewerbe **NvF Digital** (Start mit der App SattPlan).
Umsetzung nach dem Konzept „NvF Finanzen – Einnahmen-/Ausgaben-App für NvF Digital“ vom 6. November 2026.

Web-App (PWA) mit React, Vite und Tailwind – auf iPhone und iPad über „Zum Home-Bildschirm“ wie eine echte App nutzbar.
Alle Daten bleiben auf dem Gerät, es gibt keinen Server und kein Konto. Gegen Verlust schützt die **Sicherung**
(ZIP-Datei, z. B. in der Dateien-App auf dem iPad).

## Stand: Entwurf Phase 1

| Konzept-Schritt | Stand |
|---|---|
| 1. Projekt, Design, Logo, Navigation | ✅ 5 Tabs, großer +-Knopf, Platzhalter-Logo |
| 2. Speicher | ✅ bewusst nur auf dem Gerät (IndexedDB), kein Supabase; Sicherung und Wiederherstellen als ZIP |
| 3. Ausgaben erfassen, Liste, Beleg-Upload | ✅ Kamera, Bild oder PDF, mehrere Belege pro Buchung |
| 4. Einnahmen erfassen, Liste | ✅ Quelle Werbung / Abo / Sonstiges |
| 5. Startseite mit Bilanz und Diagramm | ✅ Monatsbilanz, Kreisdiagramm der Kosten, letzte Einträge |
| 6. Phase 2 (Tracker, wiederkehrende Kosten, Auswertung, Export) | ⏳ als „Phase 2“ markiert |
| 7. Phase 3 (KI-Belegvorschlag, Duplikate, Kennzahlen, Meilensteine) | ⏳ |

Außerdem: Suche und Filter (Jahr, Monat, Kategorie) mit Summen, Beleg ansehen, Bearbeiten,
Löschen immer mit Rückfrage, Kategorien verwalten, Firmenname und Logo in den Einstellungen,
Hinweise „keine Steuerberatung“ und Aufbewahrungsfristen. Dunkelmodus folgt der iPhone-Einstellung.

### Version 0.2 – Optimierungen

- Beleg-Fotos werden beim Speichern auf höchstens 2400 px (lange Kante) verkleinert – gut lesbar, aber meist nur ein Bruchteil der Dateigröße. PDFs bleiben unverändert.
- Belege werden als reine Daten und zusammen mit der Buchung in einem Schritt gespeichert (alles oder nichts). Ältere Einträge bleiben lesbar.
- Bei einem bekannten Anbieter wird die zuletzt benutzte Kategorie vorgeschlagen; eine selbst gewählte Kategorie bleibt unangetastet.
- Rückfrage, bevor ein gespeicherter Beleg entfernt oder ein Formular mit ungespeicherten Eingaben geschlossen wird.
- Kein automatisches Hineinzoomen mehr beim Tippen auf die Filter (iPhone).

### Version 0.3

- Plus-Knopf: Auf den Tabs „Ausgaben“ und „Einnahmen“ öffnet er direkt das passende Formular (ohne Zwischenfrage).
- Sicherung unter Mehr → Sicherung: ZIP-Datei mit `daten.json` und allen Belegen (benannt `JJJJ-MM-TT_Anbieter_Betrag`).
  Auf iPhone/iPad über „In Dateien sichern“ speichern, später über „Sicherung wiederherstellen“ wieder einspielen.
  Die Datei wird vor dem Einspielen vollständig geprüft; schlägt etwas fehl, bleiben die bisherigen Daten unverändert.
- Erinnerung auf der Startseite, wenn noch nie oder seit 7 Tagen nicht mehr gesichert wurde und es Neues gibt.
- Unabhängig von GitHub: relative Pfade, der Inhalt von `dist/` läuft auf jedem Webspeicher. Nach der Installation
  funktioniert die App auch ohne Internet.

**Wichtig:** Die Daten liegen nur auf dem Gerät. Wird die App vom Homescreen gelöscht oder die Website-Daten in
Safari entfernt, sind sie weg – deshalb regelmäßig sichern.

## Entwickeln

```bash
npm install
npm run dev        # lokale Entwicklung
npm test           # Rechen-, Format- und Bildtests
npm run build      # PWA nach dist/
npm run build:vorschau   # eine einzelne HTML-Datei mit Beispieldaten nach dist-vorschau/
```

## Veröffentlichen

**GitHub Pages:** Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App bei jedem Push auf `main`
(`https://nicoahb.github.io/Kleingewerbe/`).

**Ohne GitHub:** `npm run build` ausführen und den Inhalt des Ordners `dist/` auf einen beliebigen Webspeicher mit
HTTPS hochladen. Wichtig: Die Daten gehören immer zu einer Adresse. Beim Umzug auf eine neue Adresse vorher eine
Sicherung erstellen und sie in der App unter der neuen Adresse wiederherstellen.

## Aufbau

```
src/
  App.jsx                 Kopfbereich, Tabs, +-Knopf
  screens/                Start, Ausgaben/Einnahmen-Liste, Auswertung, Mehr
  components/             Erfassungsformular, Detailansicht, Belege, Kreisdiagramm
  lib/db.js               Speicher auf dem Gerät (IndexedDB)
  lib/sicherung.js        Sicherung als ZIP erstellen, prüfen und wiederherstellen (getestet)
  lib/bild.js             Beleg-Fotos verkleinern
  lib/auswertung.js       Summen, Filter, Bilanz (getestet)
  lib/format.js           1.234,56 €, TT.MM.JJJJ, Betragseingabe (getestet)
  lib/kategorien.js       Kategorie-Vorschläge aus dem Konzept
```

## Noch offen (aus Abschnitt 11 des Konzepts)

- Logo-Datei (PNG oder SVG, möglichst transparent) – ersetzt `src/assets/logo.svg` und die App-Symbole in `public/icons/`
- Gründungsdatum bzw. Beginn der Buchführung, ggf. Umsatz des Vorjahres
- Gewünschte Akzentfarbe (aktuell ein ruhiges Blau als Platzhalter)
