// OPT.AI Developer Hub -- request building for POST /v1/rules and GET /v1/agreements (pure, no DOM access).

import { ENDPOINTS } from "./registry.js";

export const LANGUAGES = Object.freeze(["DE", "EN", "FR"]);

// the Rules API's own patterns (services/rules-api/rules_api.py CONTENT_ID_PATTERN; ISO alpha-2 country codes)
export const CONTENT_ID_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,63}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const HS_PATTERN = /^[0-9]{2,10}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "automatisch": no content_id -- the Rules API selects the agreement itself. */
export const AUTO_CONTENT = "";

/** Today as the page prefills it: the UTC date (as before, and as the Rules API's own default). */
export function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** A real calendar date in the form YYYY-MM-DD. */
export function isIsoDate(value) {
  const match = ISO_DATE.exec(String(value));
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** The HS position as typed: spaces and dots removed ("8407.10" -> "840710"); anything else stays and fails validation. */
export function normalizeHs(value) {
  return String(value === null || value === undefined ? "" : value).replace(/[\s.]/g, "");
}

/** The language selection as the comma list of the request, always in the order DE, EN, FR. */
export function languageList(selected) {
  const wanted = new Set((selected || []).map((language) => String(language).toUpperCase()));
  return LANGUAGES.filter((language) => wanted.has(language)).join(",");
}

/** The languages of a comma list (the inverse of languageList, unknown codes dropped). */
export function languagesOf(list) {
  const wanted = new Set(String(list || "").split(",").map((part) => part.trim().toUpperCase()).filter(Boolean));
  return LANGUAGES.filter((language) => wanted.has(language));
}

/** Validation of the form values; every problem with the field it belongs to and a German message. */
export function validateRulesInput(values) {
  const errors = [];
  const v = values || {};
  if (!COUNTRY_PATTERN.test(String(v.country_from || ""))) errors.push({ field: "country_from", message: "Abgangsland: bitte auswählen." });
  if (!COUNTRY_PATTERN.test(String(v.country_to || ""))) errors.push({ field: "country_to", message: "Zielland: bitte auswählen." });
  const contentId = String(v.content_id || "");
  if (contentId !== AUTO_CONTENT && !CONTENT_ID_PATTERN.test(contentId)) {
    errors.push({ field: "content_id", message: "Abkommen: ungültige Kennung (nur Großbuchstaben, Ziffern und _)." });
  }
  if (!HS_PATTERN.test(normalizeHs(v.hs_code))) errors.push({ field: "hs_code", message: "HS-Position: bitte 2 bis 10 Ziffern angeben." });
  if (!isIsoDate(v.as_of_date)) errors.push({ field: "as_of_date", message: "Stichtag: bitte ein gültiges Datum angeben." });
  if (languagesOf(languageList(v.languages)).length === 0) errors.push({ field: "languages", message: "Sprachen: bitte mindestens eine Sprache wählen." });
  return { ok: errors.length === 0, errors };
}

/** The JSON body of POST /v1/rules. `content_id` only when an agreement was chosen explicitly. */
export function buildRulesBody(values) {
  const v = values || {};
  const body = {
    country_from: String(v.country_from || ""),
    country_to: String(v.country_to || ""),
    hs_code: normalizeHs(v.hs_code),
    language: languageList(v.languages),
    as_of_date: String(v.as_of_date || ""),
  };
  const contentId = String(v.content_id || "");
  if (contentId !== AUTO_CONTENT) body.content_id = contentId;
  return body;
}

/** The request as this page sends it: method, URL, headers and (for POST) the body. */
export function describeRequest(endpointId, body) {
  const endpoint = ENDPOINTS[endpointId];
  if (!endpoint) throw new Error(`unknown endpoint ${endpointId}`);
  return {
    method: endpoint.method,
    url: endpoint.url,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: endpoint.method === "POST" ? body : null,
  };
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

function shellQuote(text) {
  return `'${String(text).replace(/'/g, "'\\''")}'`;
}

/** The request as a curl command (POSIX shell) WITHOUT any credential: the Access session cookie or a service token
 *  is required by the Rules API, and this text says so in a comment line -- it never contains one. */
export function curlOf(request) {
  const lines = [
    "# Anmeldung erforderlich: Cloudflare-Access-Sitzung (Browser-Cookie) oder Service-Token –",
    "# beides ist hier bewusst nicht enthalten. Zugangsdaten nie in geteilte Befehle kopieren.",
  ];
  const command = [`curl -X ${request.method} ${shellQuote(request.url)}`, `  -H ${shellQuote("Accept: application/json")}`];
  if (request.method === "POST") {
    command.push(`  -H ${shellQuote("Content-Type: application/json")}`);
    command.push(`  --data-raw ${shellQuote(JSON.stringify(request.body === undefined ? null : request.body))}`);
  }
  return [...lines, command.join(" \\\n")].join("\n");
}
