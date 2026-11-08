# opt-hub-viewer
Webseite OPT AI Viewer – statische Seiten unter `docs/` (GitHub Pages, `viewer.opt-hub.ai`, hinter Cloudflare Access).

> **Dieses Repository ist öffentlich.** Cloudflare Access schützt die Domain `viewer.opt-hub.ai`, nicht den Inhalt dieses
> Repositorys und nicht die Auslieferung durch GitHub Pages. Hier stehen deshalb nur HTML, CSS, JavaScript, synthetische
> ZZ-Testdaten, synthetische API-Antworten, allgemeine API-Dokumentation und öffentliche technische Feldnamen – **nie** echte
> Regeltexte, echte API-Aufzeichnungen, echte Regelsatzstrukturen, echte Regel-Fingerprints, aus Live-Daten berechnete
> Erwartungen oder Screenshots mit echten Regeln. Der Public-Safe-Guard (unten) prüft das vor jedem Push.

## OPT.AI Developer Hub – Rules API (`docs/rules-demo.html`)

Die technische Entwickleransicht der Rules API (Navigation „Developer Hub“, URL unverändert):
**API wählen → Endpoint wählen → Eingaben → Request → Response → Technische Darstellung → Testfälle.**

- **API:** Rules API (aktiv). Tariff API, Savings API und Origin Evidence API erscheinen nur als deaktivierte Einträge
  „in Vorbereitung – noch keine Endpunkte“ – ohne URL, Request oder Response.
- **Endpoints:** `GET /v1/agreements` (Discovery der Abkommen und Länder) und `POST /v1/rules`.
- **Eingaben:** Abgangsland, Zielland und Abkommen (`content_id`, optional) aus der Discovery, HS-Position (2–10 Ziffern),
  Stichtag (Standard heute), Sprachen DE/EN/FR (Kommaliste).
- **Request:** Methode, URL, JSON-Body; „Request kopieren“ und „als curl kopieren“ (ohne Zugangsdaten).
- **Response:** HTTP-Status, Dauer, Größe, Meta, DecisionSummary, Trace (Abkommensauswahl, `hs_resolution` inkl.
  `temporal_fallback`), JSON-Baum, Rohdaten; Fehlerantworten mit Code, Message, Details und verständlichem Text.
- **Technische Darstellung:** jeder Regelsatz gleichrangig (Schlüssel, EX, Gültigkeit, Fingerprint), Regelgruppen
  (RGroupLog, Klammer SubGroupNo, innere Logik), alle Regeln mit allen Feldern und ihrer Form (shape), Texte je Sprache
  nebeneinander (fehlende Sprache markiert), logischer Ausdruck und **alle vollständigen Alternativen** (1 … 64, ODER
  dazwischen, UND innerhalb). Regelsatz-Fokus und „EX bestätigt“ sind reine Anzeigehilfen und ändern den Request nie.
- **Testfälle:**
  - „Fachliche Beispiele“ füllen nur das Formular – mit **synthetischen** Eingaben (Länder XA–XD, Abkommen ZZ_TEST…,
    HS-Kapitel 99), deren Antworten der Offline-Modus zeigt.
  - „Technische Regressionstests“ haben zwei Ebenen:
    - **A – synthetisch:** 14 ZZ-Testfälle gegen ihre synthetischen Antworten, ohne Netzwerk. Die Erwartungen hat der
      OPT.AI-Leitfaden selbst über die synthetischen Antworten berechnet.
    - **B – live:** echte Anfragen mit der eigenen Access-Sitzung gegen das **private Testpaket** aus OPT-AI
      (`scripts/demo_hub/devhub_private/testcases_live.json`), das man auf der Seite als Datei lädt. Die Datei bleibt im
      Browser: Sie wird nicht hochgeladen und nicht gespeichert. Es gibt kein Live-Urteil ohne Testpaket, die Läufe starten
      nur auf Klick, nacheinander, mit mindestens 600 ms Abstand.
  - Die Browser-Prüfungen ersetzen nicht die Unit-Tests unten.

Code: `docs/assets/devhub/` – ES-Module ohne Build-Schritt; nur `app.js` greift auf das DOM zu, alle anderen Module sind
reine Logik (in Node testbar). Stylesheet `devhub.css` nach `docs/OPT_AI_DESIGN_GUIDE.md`.

| Modul | Inhalt |
|---|---|
| `registry.js` | API-/Endpoint-Register, die einzigen erlaubten Live-Aufrufe |
| `request.js` | Validierung, Body, Kommaliste, curl |
| `api.js` | HTTP-Client (`credentials: "include"`, Wiederholung nur bei 5xx, ≥ 600 ms zwischen Live-Aufrufen) |
| `rules-structure.js` | exakte Portierung der Strukturlogik des OPT.AI-Leitfadens (`OPT-AI services/preference_guidance/rule_structure.py`, `rules_model.py`) |
| `testcases.js` | Auswertung erwartet vs. tatsächlich, Filter, sequenzieller Lauf, Prüfung des privaten Testpakets (`parseTestPack`) |
| `render.js`, `json-view.js`, `html.js` | Ansichten als escapte Markup-Strings |
| `discovery.js`, `examples.js` | Länder/Abkommen aus der Discovery, synthetische fachliche Beispiele |
| `data/testcases.js`, `data/recordings.js` | synthetische Testfälle und Antworten (ZZ) als ES-Module (`export default <JSON>;`) – erzeugt mit `tools/sync-fixtures.mjs` |
| `fixtures.js` | fünf synthetische Beispielantworten (Abschnitt „Beispielantworten“) |

### Tests

Keine Abhängigkeiten, kein `npm install`; getestet mit Node v24.21.0:

```
npm test            # = node --test tests/
npm run guard       # = node tools/public-safe-guard.mjs (auch Teil von npm test)
```

`tests/index.js` ist der Einstieg. Node ≥ 21 löst ein Verzeichnis-Argument von `--test` als Modulpfad auf, statt es zu
durchsuchen; die Datei importiert deshalb alle `tests/**/*.test.js`.

Geprüft werden unter anderem:
- die Portierung gegen 9 synthetische Strukturen (`structure_synthetic.json`) und 115 synthetische Grenzfälle, deren Erwartung
  der Python-Code des Leitfadens selbst berechnet hat (`structure_edge_reference.json`);
- die 14 synthetischen Testfälle gegen ihre Antworten;
- Request-Builder, curl ohne Zugangsdaten, Auswertung, Testpaket-Prüfung, Escaping und statische Sicherheitsprüfungen;
- der Public-Safe-Guard.

Die Gegenprüfung der Portierung an **echten** Regelsätzen läuft privat in OPT-AI
(`node scripts/demo_hub/devhub_port_check.mjs <dieser-checkout>`). Sie prüft auch, dass kein privater Marker hier steht.

### Public-Safe-Guard (vor jedem Push)

`tools/public-safe-guard.mjs` meldet FAIL bei jedem Fund; ein Fund nennt Datei, Zeile und Regel, nie den Wert:

| Regel | Prüfung |
|---|---|
| G1 | echte Regeltexte |
| G2 | echte API-Antworten bzw. Abkommen |
| G3 | echte Regelsatzkorpora und Fingerprints, unmarkierte Daten, private Dateien |
| G4 | Secrets |
| G5 | Access-Audience-Werte |
| G6 | Adressen außerhalb `example.invalid` |
| G7 | nicht geprüfte Bilder/Dokumente (`tools/public-safe-allowlist.json`) |
| G8 | Secret-Dateien |

Einmal je Klon aktivieren:

```
git config core.hooksPath .githooks
```

Danach prüft `.githooks/pre-push` jede Dateiversion in den Commits, die ein Push hinzufügen würde. Bei FAIL wird nicht gepusht.
Manuell geht dasselbe mit `node tools/public-safe-guard.mjs --push <sha>`; einen Ordner, z. B. das Artefakt von GitHub Pages,
prüft man mit `--dir <pfad>`.

### Synthetische Daten erneuern

Die Daten erzeugt **der Code des OPT.AI-Leitfadens** selbst (Repository OPT-AI, `scripts/demo_hub/devhub_fixtures.py`):

```
# OPT-AI (ohne Netzwerk):
.venv/Scripts/python.exe -I scripts/demo_hub/devhub_fixtures.py synthetic <ordner-außerhalb>
# hier:
node tools/sync-fixtures.mjs <ordner-außerhalb>   # schreibt data/*.js, fixtures.js, structure_synthetic.json; verweigert alles Nicht-Synthetische
npm test
```

Echte Antworten, Erwartungen und Strukturen (`probe` / `build`) bleiben ausschließlich in OPT-AI
(`scripts/demo_hub/devhub_private/`).

### Offline-Modus

`rules-demo.html?rules_session=ready&mode=offline` rendert die ganze Seite aus den synthetischen Antworten, ohne jede
Netzwerkanfrage (für lokale Screenshots).
- Optional: `&case=<Testfall-ID>` (angezeigte Antwort), `&endpoint=agreements`, `&tab=regression`.
- Lokal braucht es einen statischen Server, weil ES-Module nicht über `file://` laufen, z. B.
  `python -m http.server 8080 -d docs` und dann `http://localhost:8080/rules-demo.html?rules_session=ready&mode=offline`.
- Standard bleibt der Live-Modus.

### Sicherheitsregeln

- Der Cloudflare-Access-Bootstrap bleibt das erste Script im `<head>`: ohne `?rules_session=ready` Weiterleitung zu
  `https://rules.opt-hub.ai/session-bootstrap`; bis dahin startet die Seite nichts.
- Nur zwei Live-Aufrufe, beide lesend, mit `credentials: "include"`: `GET https://rules.opt-hub.ai/v1/agreements` und
  `POST https://rules.opt-hub.ai/v1/rules`. Kein weiterer Endpoint, kein Proxy, kein Secret, kein Token im Frontend.
- curl-Befehle enthalten keine Zugangsdaten (nur den Hinweis, dass Access-Cookie oder Service-Token nötig sind).
- Keine externen Skripte, Stylesheets, Schriften oder CDNs, kein Analytics, kein Browser-Speicher. Das private Testpaket wird
  nur gelesen und im Arbeitsspeicher der Seite gehalten.
- Jeder Wert aus der API und aus dem Testpaket wird escaped; keine Inline-Event-Handler.
- Keine echten Regeldaten im Repository (Public-Safe-Guard).
- Requests nur auf Klick; Regressionstests nacheinander mit mindestens 600 ms Abstand, nie automatisch.

### Historischer Hinweis

Bis V1.0 enthielt `docs/rules-demo.html` fünf aufgezeichnete Live-Antworten vom 22.08.2026 (seit Commit `5ded4c4`).
V1.1 ersetzt sie in der aktuellen Version durch synthetische Beispiele. Die alten Inhalte bleiben über die Git-Historie
erreichbar; eine vollständige Bereinigung der Historie ist eine eigene Owner-Entscheidung.
