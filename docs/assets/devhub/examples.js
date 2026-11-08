// OPT.AI Developer Hub -- "Fachliche Beispiele": prepared inputs with a short business description (pure data).
// An example only FILLS the form -- it sends nothing and states no expected verdict.
// V1.1: this repository is public, so the examples use SYNTHETIC ZZ inputs (countries XA..XD, agreements ZZ_TEST01..03, HS chapter
// 99). Each one matches a synthetic answer of the offline mode; live, the Rules API has no rule for them (real queries: choose
// countries, agreement and HS position yourself, or load the private test pack under "Technische Regressionstests").

const LANGUAGES = Object.freeze(["DE", "EN", "FR"]);

export const BUSINESS_EXAMPLES = Object.freeze([
  {
    id: "auto-content",
    title: "Abkommen automatisch ermitteln",
    description:
      "Ohne gewähltes Abkommen bestimmt die Rules API das passende Abkommen selbst. Im Trace zeigt " +
      "content_selection, welches Abkommen gewählt wurde und warum.",
    form: { country_from: "XA", country_to: "XB", content_id: "", hs_code: "9908", as_of_date: "2026-11-08", languages: LANGUAGES },
  },
  {
    id: "several-rule-sets",
    title: "Mehrere gleichrangige Regelsätze",
    description:
      "Für manche Positionen liefert die API mehrere Regelsätze. Keiner ist automatisch „der richtige“ – " +
      "welcher fachlich passt, hängt von der Ware ab und wird hier nicht entschieden.",
    form: { country_from: "XA", country_to: "XB", content_id: "ZZ_TEST01", hs_code: "9904", as_of_date: "2026-11-08", languages: LANGUAGES },
  },
  {
    id: "ex-rule-sets",
    title: "Regelsätze mit EX-Kennzeichen",
    description:
      "Ein EX-Regelsatz gilt nur für einen Teil der Waren einer Position. Ob er zutrifft, ist eine fachliche " +
      "Prüfung; die Markierung „EX bestätigt“ auf dieser Seite ist nur eine Anzeigehilfe.",
    form: { country_from: "XA", country_to: "XB", content_id: "ZZ_TEST01", hs_code: "9905", as_of_date: "2026-11-08", languages: LANGUAGES },
  },
  {
    id: "alternatives-in-group",
    title: "Alternativen innerhalb einer Regelgruppe",
    description:
      "ODER-verknüpfte Regeln in einer Regelgruppe ergeben mehrere vollständige Alternativen. Die HS-Position " +
      "kann dabei auf eine gröbere Stelle zurückfallen (Trace: hs_resolution).",
    form: { country_from: "XA", country_to: "XB", content_id: "ZZ_TEST01", hs_code: "9901", as_of_date: "2026-11-08", languages: LANGUAGES },
  },
  {
    id: "nested-logic",
    title: "Verschachtelte Logik",
    description:
      "Regelgruppen mit Klammer (SubGroupNo), Regeln mit UND: Der logische Ausdruck und die Liste der vollständigen " +
      "Alternativen zeigen die gesamte Struktur jedes Regelsatzes.",
    form: { country_from: "XA", country_to: "XB", content_id: "ZZ_TEST01", hs_code: "9907", as_of_date: "2026-11-08", languages: LANGUAGES },
  },
  {
    id: "key-date-state",
    title: "Stichtag und Regelstand",
    description:
      "Der Stichtag bestimmt den Regelstand. Vergleichen Sie die Antwort für den 01.01.2027 mit derselben " +
      "Abfrage für den 31.12.2026 – Regelsätze und Fingerprints unterscheiden sich.",
    form: { country_from: "XA", country_to: "XC", content_id: "ZZ_TEST02", hs_code: "990310", as_of_date: "2027-01-01", languages: LANGUAGES },
  },
  {
    id: "temporal-fallback",
    title: "Zeitlicher Rückfall",
    description:
      "Gilt die spezifische Regel am Stichtag noch nicht, antwortet die API mit dem Regelsatz einer übergeordneten " +
      "Position (temporal_fallback). Dieser ist dann nur ein möglicher Kandidat.",
    form: { country_from: "XA", country_to: "XB", content_id: "ZZ_TEST01", hs_code: "9902", as_of_date: "2024-12-31", languages: LANGUAGES },
  },
]);
