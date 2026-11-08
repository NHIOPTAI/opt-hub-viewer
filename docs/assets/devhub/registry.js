// OPT.AI Developer Hub -- the API and endpoint registry (pure, no DOM access).
//
// Exactly two live calls exist, both read-only and both against the Rules API: GET /v1/agreements and POST /v1/rules.
// The future APIs are listed by name only ("in Vorbereitung – noch keine Endpunkte"): no URL, no request and no response
// is ever shown for them. `isAllowedCall` is checked by the HTTP client before every request (defence in depth).

export const RULES_API_ORIGIN = "https://rules.opt-hub.ai";

export const PLANNED_LABEL = "in Vorbereitung – noch keine Endpunkte";

export const ENDPOINTS = Object.freeze({
  agreements: Object.freeze({
    id: "agreements",
    apiId: "rules",
    method: "GET",
    path: "/v1/agreements",
    url: `${RULES_API_ORIGIN}/v1/agreements`,
    title: "Abkommen und Länderrelationen",
    summary:
      "Discovery: alle für Ihre Anmeldung freigegebenen Abkommen mit Gültigkeit, Abgangs- und Zielländern. " +
      "Grundlage der Länder- und Abkommensauswahl dieser Seite.",
    responseVersion: "v1.0",
    readOnly: true,
  }),
  rules: Object.freeze({
    id: "rules",
    apiId: "rules",
    method: "POST",
    path: "/v1/rules",
    url: `${RULES_API_ORIGIN}/v1/rules`,
    title: "Ursprungsregeln abfragen",
    summary:
      "Regelsätze → Regelgruppen → Regeln für Abgangsland, Zielland, HS-Position und Stichtag – mit Trace, " +
      "Fingerprints und Texten in den angefragten Sprachen.",
    responseVersion: "v1.2",
    readOnly: true,
  }),
});

export const APIS = Object.freeze([
  Object.freeze({
    id: "rules",
    name: "Rules API",
    status: "active",
    version: "v1",
    origin: RULES_API_ORIGIN,
    summary: "Ursprungsregeln aus dem OPT.AI-Regelwerk – lesend, über Ihre Cloudflare-Access-Anmeldung.",
    endpoints: Object.freeze(["agreements", "rules"]),
  }),
  Object.freeze({ id: "tariff", name: "Tariff API", status: "planned", endpoints: Object.freeze([]) }),
  Object.freeze({ id: "savings", name: "Savings API", status: "planned", endpoints: Object.freeze([]) }),
  Object.freeze({ id: "origin-evidence", name: "Origin Evidence API", status: "planned", endpoints: Object.freeze([]) }),
]);

export function apiById(id) {
  return APIS.find((api) => api.id === id) || null;
}

export function endpointById(id) {
  return Object.prototype.hasOwnProperty.call(ENDPOINTS, id) ? ENDPOINTS[id] : null;
}

/** The only live calls this page may make: exactly the registered method + URL pairs. */
export function isAllowedCall(method, url) {
  return Object.values(ENDPOINTS).some((endpoint) => endpoint.method === method && endpoint.url === url);
}
