# NvF Finanzen

Einnahmen-/Ausgaben-App für das Kleingewerbe **NvF Digital** (Start mit der App SattPlan).
Umsetzung nach dem Konzept „NvF Finanzen – Einnahmen-/Ausgaben-App für NvF Digital“ vom 6. November 2026.

Web-App (PWA) mit React, Vite und Tailwind – auf dem iPhone über „Zum Home-Bildschirm“ wie eine echte App nutzbar.

## Stand: Entwurf Phase 1

| Konzept-Schritt | Stand |
|---|---|
| 1. Projekt, Design, Logo, Navigation | ✅ 5 Tabs, großer +-Knopf, Platzhalter-Logo |
| 2. Supabase: Tabellen, Zugriffsregeln, Beleg-Bucket, Login, PIN | ⏳ SQL vorbereitet (`supabase/schema.sql`), noch nicht verbunden |
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

**Wichtig:** Bis Schritt 2 (Supabase) liegen alle Daten nur lokal im Browser des Geräts (IndexedDB).
Für die echte Buchführung erst nach Schritt 2 verwenden.

## Entwickeln

```bash
npm install
npm run dev        # lokale Entwicklung
npm test           # Rechen-, Format- und Bildtests
npm run build      # PWA nach dist/
npm run build:vorschau   # eine einzelne HTML-Datei mit Beispieldaten nach dist-vorschau/
```

## Veröffentlichen auf GitHub Pages

Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App bei jedem Push auf `main`.
Einmalig nötig: im Repository unter **Settings → Pages → Build and deployment → Source** „GitHub Actions“ wählen.
Danach ist die App unter `https://<github-name>.github.io/Kleingewerbe/` erreichbar.

## Aufbau

```
src/
  App.jsx                 Kopfbereich, Tabs, +-Knopf
  screens/                Start, Ausgaben/Einnahmen-Liste, Auswertung, Mehr
  components/             Erfassungsformular, Detailansicht, Belege, Kreisdiagramm
  lib/db.js               Speicher (lokal) – wird in Schritt 2 gegen Supabase getauscht
  lib/auswertung.js       Summen, Filter, Bilanz (getestet)
  lib/format.js           1.234,56 €, TT.MM.JJJJ, Betragseingabe (getestet)
  lib/kategorien.js       Kategorie-Vorschläge aus dem Konzept
supabase/schema.sql       Tabellen, Row Level Security, privater Bucket „belege“
```

## Noch offen (aus Abschnitt 11 des Konzepts)

- Logo-Datei (PNG oder SVG, möglichst transparent) – ersetzt `src/assets/logo.svg` und die App-Symbole in `public/icons/`
- Eigenes Supabase-Projekt für NvF Digital
- Gründungsdatum bzw. Beginn der Buchführung, ggf. Umsatz des Vorjahres
- Weitere Nutzer mit Zugriff?
- Gewünschte Akzentfarbe (aktuell ein ruhiges Blau als Platzhalter)
