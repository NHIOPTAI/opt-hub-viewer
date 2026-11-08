// OPT.AI Developer Hub -- country and agreement discovery from GET /v1/agreements (pure, no DOM access).
//
// The Abgangsland / Zielland / Abkommen choices are built entirely from the one discovery answer: no static country list,
// no per-selection network call. An empty or failed discovery leaves the choices empty -- never backfilled.

/** { fromNames: Map<iso2, name>, relations: Map<iso2, Map<iso2, name>> } from `agreements[]`. */
export function buildCountryRelations(agreements) {
  const fromNames = new Map();
  const relations = new Map();
  for (const agreement of agreements || []) {
    for (const from of agreement.country_from || []) {
      if (!from || !from.iso2) continue;
      if (!fromNames.has(from.iso2) || (!fromNames.get(from.iso2) && from.name)) fromNames.set(from.iso2, from.name || "");
      if (!relations.has(from.iso2)) relations.set(from.iso2, new Map());
      const toMap = relations.get(from.iso2);
      for (const to of agreement.country_to || []) {
        if (!to || !to.iso2) continue;
        if (!toMap.has(to.iso2) || (!toMap.get(to.iso2) && to.name)) toMap.set(to.iso2, to.name || "");
      }
    }
  }
  return { fromNames, relations };
}

/** [{iso2, name}] sorted by name (case-insensitive), iso2 as the tiebreaker and the fallback. */
export function sortCountryEntries(countryMap) {
  return Array.from(countryMap.entries())
    .map(([iso2, name]) => ({ iso2, name }))
    .sort((a, b) => {
      const an = (a.name || a.iso2).toLowerCase();
      const bn = (b.name || b.iso2).toLowerCase();
      if (an !== bn) return an < bn ? -1 : 1;
      return a.iso2 < b.iso2 ? -1 : a.iso2 > b.iso2 ? 1 : 0;
    });
}

/** The agreements of the discovery answer that list both countries -- the explicit choices for `content_id`. */
export function agreementsForPair(agreements, countryFrom, countryTo) {
  if (!countryFrom || !countryTo) return [];
  return (agreements || [])
    .filter((agreement) => (agreement.country_from || []).some((c) => c && c.iso2 === countryFrom)
      && (agreement.country_to || []).some((c) => c && c.iso2 === countryTo))
    .map((agreement) => ({
      content_id: String(agreement.content_id || ""),
      description: agreement.description === null || agreement.description === undefined ? "" : String(agreement.description),
      valid_from: agreement.valid_from || "",
      valid_to: agreement.valid_to || "",
    }))
    .filter((agreement) => agreement.content_id !== "")
    .sort((a, b) => (a.content_id < b.content_id ? -1 : a.content_id > b.content_id ? 1 : 0));
}

/** Whether the agreement's own validity (YYYY-MM-DD, inclusive, empty = open) covers the key date; null when unknown. */
export function validAt(agreement, isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ""))) return null;
  const from = String(agreement.valid_from || "");
  const to = String(agreement.valid_to || "");
  if (from && from > isoDate) return false;
  if (to && to < isoDate) return false;
  return true;
}
