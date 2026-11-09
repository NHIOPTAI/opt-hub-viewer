import { getLocale, translateUi } from '../i18n/ui.js';
// OPT.AI Developer Hub -- the views as escaped markup (pure, no DOM access: every function returns SafeHtml).
// Every value from the API (rule texts, error messages, JSON) is interpolated through `html` and thereby escaped.

import { html, joinHtml } from "./html.js";
import { jsonTreeHtml } from "./json-view.js";
import { ENDPOINTS, PLANNED_LABEL } from "./registry.js";
import { curlOf, languageList, prettyJson } from "./request.js";
import {
  isException, MAX_ALTERNATIVES, parseRuleSet, RuleShape, ruleSetKeyOf, shapeOf, structureOf,
} from "./rules-structure.js";
import { countOutcomes, FILTERS } from "./testcases.js";

// ---- texts ----------------------------------------------------------------------------------------------------------

export const ERROR_MESSAGES = Object.freeze({
  "OPT-REQ-001": "Die Eingabe ist unvollständig oder ungültig.",
  "OPT-AUTH-001": "Keine gültige Anmeldung erkannt. Bitte über Cloudflare Access anmelden und erneut versuchen.",
  "OPT-RULE-001": "Für diese Kombination aus Ländern, Warennummer und Stichtag wurde keine passende Regel gefunden.",
  "OPT-DATA-001": "Die gespeicherten Regeldaten enthalten einen nicht eindeutig lesbaren Wert (z. B. ein Datum); die Abfrage wurde deshalb abgelehnt.",
  "OPT-SYS-001": "Im Rules-Service ist ein interner Fehler aufgetreten.",
});

export const REASON_MESSAGES = Object.freeze({
  CONTENT_NOT_AVAILABLE: "Das gewählte Abkommen ist unbekannt oder für Ihre Anmeldung nicht freigegeben.",
  CONTENT_NOT_APPLICABLE: "Das gewählte Abkommen gilt zum Stichtag nicht für dieses Länderpaar.",
});

export const SHAPE_LABELS = Object.freeze({
  [RuleShape.NO_RESTRICTION]: "keine Einschränkung",
  [RuleShape.CHANGE_OF_CHAPTER]: "Kapitelwechsel",
  [RuleShape.CHANGE_OF_HEADING]: "Positionswechsel",
  [RuleShape.CHANGE_OF_SUBHEADING]: "Unterpositionswechsel",
  [RuleShape.HS_EXCLUSION]: "HS-Ausschluss",
  [RuleShape.ONLY_FROM_HS]: "nur aus HS-Bereich",
  [RuleShape.VALUE_LIMIT]: "Wertgrenze",
  [RuleShape.VALUE_SHARE]: "Wertanteil",
  [RuleShape.VALUE_MINIMUM]: "Mindestanteil",
  [RuleShape.ABSOLUTE_VALUE]: "absoluter Wert",
  [RuleShape.WEIGHT_RULE]: "Gewichtsregel",
  [RuleShape.FIFTY_FIFTY]: "50/50-Regel",
  [RuleShape.DESCRIPTION]: "Textregel",
  [RuleShape.UNSUPPORTED]: "nicht unterstützt",
});

export const NOTE_TEXTS = Object.freeze({
  NO_GROUPS: "Der Regelsatz enthält keine Regelgruppen.",
  SUBGROUPS_UNDER_OR_IGNORED: "Die Gruppen sind ODER-verknüpft; Klammern (SubGroupNo) werden dabei nicht ausgewertet.",
});

const RULE_FIELDS = ["RuleNo", "RLogic", "RDefinition", "HsRange", "Roperator", "Rpercent", "Rtarget", "Rproof", "ProofAlt", "WeightR", "Rorcrit"];

// ---- small helpers --------------------------------------------------------------------------------------------------

const isMapping = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const list = (value) => (Array.isArray(value) ? value : []);
const str = (value) => (value === null || value === undefined ? "" : String(value));

export function formatInt(n) {
  return Number.isFinite(n) ? new Intl.NumberFormat(getLocale()).format(Math.round(n) || 0) : "–";
}

export function formatDuration(ms) {
  return Number.isFinite(ms) ? `${formatInt(ms)} ms` : "–";
}

export function formatBytes(bytes) {
  return Number.isFinite(bytes) ? `${formatInt(bytes)} Bytes` : "–";
}

/** "01.01.2024 – 31.12.9999 (unbefristet)" -- validities as the Rules data state them (never interpreted). */
function validityDate(value) {
  const legacy = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  return germanDate(legacy ? legacy[3] + '-' + legacy[2] + '-' + legacy[1] : value);
}

export function validityText(from, to) {
  const start = str(from).trim();
  const end = str(to).trim();
  if (!start && !end) return translateUi("keine Angabe");
  const open = !end || end === "31.12.9999" || end === "9999-12-31";
  return `${validityDate(start) || "…"} – ${validityDate(end) || translateUi("offen")}${open ? " " + translateUi("(unbefristet)") : ""}`;
}

/** "26.11.2026" from "2026-11-26" (other values verbatim). */
export function germanDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(iso));
  if (!match) return str(iso);
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date) : str(iso);
}

const empty = (value) => value === null || value === undefined || value === "";
const valueCell = (value) => (empty(value) ? html`<span class="muted">—</span>` : html`${typeof value === "string" ? value : JSON.stringify(value)}`);
const yesNo = (value) => (value === true ? "ja" : value === false ? "nein" : empty(value) ? "—" : String(value));

function shortFingerprint(value) {
  const text = str(value);
  return text.length > 22 ? `${text.slice(0, 18)}…${text.slice(-4)}` : text;
}

function copyButton(label, target) {
  return html`<button type="button" class="btn btn-secondary btn-small" data-action="copy" data-copy="${target}">${label}</button>`;
}

function kvTable(rows) {
  return html`<table class="kv-table"><tbody>${rows.map(([label, value]) => html`<tr><th scope="row">${label}</th><td>${value}</td></tr>`)}</tbody></table>`;
}

function codeOf(value) {
  return empty(value) ? html`<span class="muted">—</span>` : html`<code>${value}</code>`;
}

// ---- 1 API and 2 endpoint selection ----------------------------------------------------------------------------------

export function renderApiSelector(apis, selectedId) {
  return html`<div class="tile-grid tile-grid-4">${apis.map((api) => (api.status === "active"
    ? html`<button type="button" class="tile${api.id === selectedId ? " active" : ""}" data-action="select-api" data-api="${api.id}"
          aria-pressed="${api.id === selectedId ? "true" : "false"}">
        <span class="tile-title">${api.name}</span>
        <span class="tile-meta">${api.version} · verfügbar</span>
        <span class="tile-text">${api.summary}</span>
      </button>`
    : html`<button type="button" class="tile is-disabled" disabled aria-disabled="true">
        <span class="tile-title">${api.name}</span>
        <span class="tile-meta">${PLANNED_LABEL}</span>
      </button>`))}</div>`;
}

export function renderEndpointSelector(api, selectedId) {
  const endpoints = list(api && api.endpoints).map((id) => ENDPOINTS[id]).filter(Boolean);
  return html`<div class="tile-grid tile-grid-2">${endpoints.map((endpoint) => html`
    <button type="button" class="tile tile-endpoint${endpoint.id === selectedId ? " active" : ""}" data-action="select-endpoint"
            data-endpoint="${endpoint.id}" aria-pressed="${endpoint.id === selectedId ? "true" : "false"}">
      <span class="tile-title"><span class="method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span> ${endpoint.path}</span>
      <span class="tile-meta">${endpoint.title} · lesend · Response ${endpoint.responseVersion}</span>
      <span class="tile-text">${endpoint.summary}</span>
    </button>`)}</div>`;
}

// ---- 4 request ------------------------------------------------------------------------------------------------------

export function renderRequestPanel(request, { errors = [], note = null } = {}) {
  const headers = Object.entries(request.headers || {});
  return html`
    <div class="request-line"><span class="method method-${request.method.toLowerCase()}">${request.method}</span> <code class="url">${request.url}</code></div>
    ${kvTable([
      ...headers.map(([name, value]) => [name, html`<code>${value}</code>`]),
      ["Anmeldung", "Cloudflare-Access-Sitzung des Browsers (credentials: include) – kein Token, kein Secret im Frontend"],
    ])}
    <div class="block-title">Body</div>
    ${request.method === "POST"
    ? html`<pre class="code-block" data-copy-source="request-json">${prettyJson(request.body)}</pre>`
    : html`<p class="muted small">Kein Body – GET ohne Parameter (der optionale Query-Parameter <code>language</code> wird hier nicht verwendet; Standard DE).</p>`}
    <pre class="visually-hidden" data-copy-source="request-curl">${curlOf(request)}</pre>
    ${errors.length ? html`<ul class="form-errors" role="alert">${errors.map((e) => html`<li>${e.message}</li>`)}</ul>` : null}
    ${note ? html`<p class="muted small">${note}</p>` : null}
    <div class="actions">
      ${copyButton("Request kopieren", "request-json")}
      ${copyButton("als curl kopieren", "request-curl")}
    </div>
    <p class="muted small">Der curl-Befehl enthält bewusst keine Zugangsdaten; für einen Aufruf außerhalb des Browsers ist eine
      Access-Sitzung (Cookie) oder ein Service-Token erforderlich.</p>`;
}

// ---- 5 response -----------------------------------------------------------------------------------------------------

function sourceBanner(exchange) {
  if (exchange.source === "recording") {
    return html`<div class="banner banner-recording"><strong>SYNTHETISCHE ANTWORT</strong> – keine Live-Anfrage · ZZ-Testdaten im Format
      der Rules API v1, erzeugt am ${germanDate(exchange.recordedAt) || "unbekannt"}${exchange.sourceLabel ? html` · ${exchange.sourceLabel}` : null}</div>`;
  }
  if (exchange.source === "fixture") {
    return html`<div class="banner banner-recording"><strong>BEISPIEL</strong> (keine Live-Anfrage) – ${exchange.sourceLabel || ""}. Synthetische
      Antwort (ZZ-Testdaten) im Format der Rules API v1.</div>`;
  }
  return null;
}

function statTiles(exchange) {
  const result = exchange.result;
  const status = result.kind === "response" ? result.status : null;
  const ok = status !== null && status >= 200 && status < 300;
  const source = exchange.source === "live" ? "Live" : exchange.source === "fixture" ? "Beispiel (synthetisch)" : "Synthetisch";
  return html`<dl class="stat-grid">
    <div class="stat"><dt>HTTP-Status</dt><dd class="${ok ? "ok" : "err"}">${status === null ? "keine Antwort" : status}</dd></div>
    <div class="stat"><dt>Dauer</dt><dd>${formatDuration(result.durationMs)}</dd></div>
    <div class="stat"><dt>Größe (Body)</dt><dd>${formatBytes(result.sizeBytes)}</dd></div>
    <div class="stat"><dt>Versuche</dt><dd>${result.attempts ? result.attempts : "–"}</dd></div>
    <div class="stat"><dt>Quelle</dt><dd>${source}</dd></div>
  </dl>`;
}

function sentRequest(exchange) {
  const request = exchange.request;
  if (!request) return null;
  return html`<details class="panel-details">
    <summary>Gesendeter Request: ${request.method} ${request.url}${exchange.sentAt ? html` · ${exchange.sentAt}` : null}</summary>
    ${request.method === "POST" ? html`<pre class="code-block">${prettyJson(request.body)}</pre>` : html`<p class="muted small">Kein Body.</p>`}
  </details>`;
}

export function friendlyErrorText(status, body) {
  const error = isMapping(body) && isMapping(body.error) ? body.error : {};
  const code = str(error.code) || (status === 403 ? "OPT-AUTH-001" : "");
  return ERROR_MESSAGES[code] || "Die Anfrage konnte nicht verarbeitet werden.";
}

function errorPanel(status, body) {
  const error = isMapping(body) && isMapping(body.error) ? body.error : {};
  const details = isMapping(error.details) ? error.details : null;
  const reason = details ? str(details.reason) : "";
  return html`<div class="error-card" role="alert">
    <div class="status-title">Fehlerantwort der Rules API</div>
    <p>${friendlyErrorText(status, body)}</p>
    ${reason && REASON_MESSAGES[reason] ? html`<p>${REASON_MESSAGES[reason]}</p>` : null}
    ${kvTable([
      ["error.code", codeOf(error.code || `HTTP-${status}`)],
      ["HTTP-Status", String(status)],
      ["error.message", empty(error.message) ? html`<span class="muted">—</span>` : str(error.message)],
      ...(details ? Object.entries(details).map(([key, value]) => [`details.${key}`, valueCell(value)]) : [["error.details", html`<span class="muted">—</span>`]]),
    ])}
  </div>`;
}

function metaBlock(body) {
  const meta = isMapping(body.Meta) ? body.Meta : {};
  const summary = isMapping(body.DecisionSummary) ? body.DecisionSummary : {};
  return html`<div class="facts-grid">
    <section class="fact-card"><h4>Meta</h4>${kvTable([
      ["api_version", codeOf(meta.api_version)], ["response_version", codeOf(meta.response_version)], ["generated_at", codeOf(meta.generated_at)],
    ])}</section>
    <section class="fact-card"><h4>DecisionSummary</h4>${kvTable([
      ["rule_set_count", valueCell(summary.rule_set_count)], ["rule_group_count", valueCell(summary.rule_group_count)], ["rule_count", valueCell(summary.rule_count)],
    ])}</section>
    <section class="fact-card"><h4>Request (Echo der API)</h4>${kvTable(isMapping(body.Request)
    ? Object.entries(body.Request).map(([key, value]) => [key, valueCell(value)]) : [["–", "kein Request-Echo"]])}</section>
  </div>`;
}

function agreementBlock(agreement) {
  const descriptions = list(agreement.ContentDescr).filter(isMapping);
  const tolerances = list(agreement.Tolerances).filter(isMapping);
  return html`<section class="fact-card fact-card-wide"><h4>Agreement</h4>
    ${kvTable([
      ["ContentId", codeOf(agreement.ContentId)],
      ["StartCid – EndCid", validityText(agreement.StartCid, agreement.EndCid)],
      ["ContentDescr", descriptions.length ? html`${descriptions.map((d) => html`<div data-i18n-original><span class="lang-tag">${d.language}</span> ${str(d.DescAg)}</div>`)}` : html`<span class="muted">—</span>`],
      ["CountryFrom / CountryTo", `${list(agreement.CountryFrom).length} / ${list(agreement.CountryTo).length} Länder`],
    ])}
    <div class="block-title">Tolerances (${tolerances.length})</div>
    ${tolerances.length ? html`<div class="table-scroll"><table class="data-table"><thead><tr>
        ${["Tolfrom", "Tolto", "Tolval", "Tolieflag", "Tolwflag", "Orcrittol"].map((f) => html`<th scope="col">${f}</th>`)}</tr></thead>
      <tbody>${tolerances.map((t) => html`<tr>${["Tolfrom", "Tolto", "Tolval", "Tolieflag", "Tolwflag", "Orcrittol"].map((f) => html`<td data-label="${f}">${valueCell(t[f])}</td>`)}</tr>`)}</tbody>
      </table></div>` : html`<p class="muted small">Keine Toleranzzeilen.</p>`}
  </section>`;
}

function traceBlock(trace) {
  const selection = isMapping(trace.content_selection) ? trace.content_selection : {};
  const resolution = isMapping(trace.hs_resolution) ? trace.hs_resolution : {};
  const outside = list(resolution.specific_rule_sets_outside_date).filter(isMapping);
  const ruleSetResolution = isMapping(trace.rule_set_resolution) ? trace.rule_set_resolution : {};
  const groupResolution = isMapping(trace.rule_group_resolution) ? trace.rule_group_resolution : {};
  const ruleResolution = isMapping(trace.rule_resolution) ? trace.rule_resolution : {};
  const textResolution = isMapping(trace.text_resolution) ? trace.text_resolution : {};
  const allowed = list(trace.allowed_contents);
  const outsideFields = ["rule_set_id", "hs_number", "rule_subset_no", "ex_flag", "valid_from", "valid_to", "has_rules", "rules_available_from", "rules_available_until"];
  return html`<section class="fact-card fact-card-wide"><h4>Trace</h4>
    <div class="facts-grid facts-grid-inner">
      <div><div class="block-title">Abkommensauswahl (content_selection)</div>${kvTable([
        ["selected_content_id", codeOf(selection.selected_content_id)],
        ["requested_content_id", codeOf(selection.requested_content_id)],
        ["selection_reason", valueCell(selection.selection_reason)],
        ["content_candidates", list(trace.content_candidates).length ? joinHtml(list(trace.content_candidates).map((c) => html`<code>${c}</code>`), " ") : html`<span class="muted">—</span>`],
        ["allowed_contents", html`${allowed.length} freigegeben <details class="inline-details"><summary>anzeigen</summary>${joinHtml(allowed.map((c) => html`<code>${c}</code>`), " ")}</details>`],
      ])}</div>
      <div><div class="block-title">HS-Auflösung (hs_resolution)</div>${kvTable([
        ["hs_attempts", list(trace.hs_attempts).length ? joinHtml(list(trace.hs_attempts).map((c) => html`<code>${c}</code>`), " → ") : html`<span class="muted">—</span>`],
        ["matched_hs", codeOf(resolution.matched_hs)],
        ["hs_match_level", valueCell(resolution.hs_match_level)],
        ["fallback_used", yesNo(resolution.fallback_used)],
        ["temporal_fallback", resolution.temporal_fallback === true ? html`<span class="pill pill-ex">ja</span>` : yesNo(resolution.temporal_fallback)],
        ["specific_rule_sets_outside_date", `${outside.length} Einträge`],
      ])}</div>
      <div><div class="block-title">Zählungen und Texte</div>${kvTable([
        ["rule_set_resolution.matched_rule_set_count", valueCell(ruleSetResolution.matched_rule_set_count)],
        ["matched_rule_set_ids", list(ruleSetResolution.matched_rule_set_ids).length ? joinHtml(list(ruleSetResolution.matched_rule_set_ids).map((c) => html`<code>${c}</code>`), " ") : html`<span class="muted">—</span>`],
        ["rule_group_resolution.matched_rule_group_count", valueCell(groupResolution.matched_rule_group_count)],
        ["rule_resolution.matched_rule_count", valueCell(ruleResolution.matched_rule_count)],
        ["text_resolution.requested_languages", list(textResolution.requested_languages).length ? joinHtml(list(textResolution.requested_languages).map((c) => html`<code>${c}</code>`), " ") : html`<span class="muted">—</span>`],
      ])}</div>
    </div>
    ${outside.length ? html`<div class="block-title">specific_rule_sets_outside_date – spezifische Regelsätze außerhalb des Stichtags</div>
      <div class="table-scroll"><table class="data-table"><thead><tr>${outsideFields.map((f) => html`<th scope="col">${f}</th>`)}</tr></thead>
      <tbody>${outside.map((row) => html`<tr>${outsideFields.map((f) => html`<td data-label="${f}">${f === "has_rules" ? yesNo(row[f]) : valueCell(row[f])}</td>`)}</tr>`)}</tbody></table></div>` : null}
  </section>`;
}

/** The warning of a temporal fallback (RULES_API_TEMPORAL_FALLBACK_V1): the rule set shown is a possible candidate only. */
export function temporalNotice(body) {
  const resolution = isMapping(body) && isMapping(body.Trace) && isMapping(body.Trace.hs_resolution) ? body.Trace.hs_resolution : null;
  if (!resolution) return null;
  const outside = list(resolution.specific_rule_sets_outside_date).filter(isMapping);
  if (resolution.temporal_fallback !== true && outside.length === 0) return null;
  return html`<div class="notice notice-warn" role="note"><strong>Zeitlicher Rückfall (temporal_fallback):</strong> Die spezifische Regel ist
    zum Stichtag nicht verfügbar; die angezeigten Regelsätze gehören zur übergeordneten Position ${codeOf(resolution.matched_hs)} und sind
    nur mögliche Kandidaten.${outside.length ? html` Spezifisch: ${joinHtml(outside.map((s) => html`<code>${str(s.hs_number)}/${str(s.rule_subset_no) || "1"}</code>
    ${s.rules_available_from ? html`Regeln ab ${str(s.rules_available_from)}` : s.rules_available_until ? html`Regeln bis ${str(s.rules_available_until)}` : html`ohne Regelzeitraum`}`), " · ")}.` : null}
    Eine EX-Bestätigung ersetzt die fehlende zeitliche Gültigkeit nicht.</div>`;
}

function agreementsBlock(body) {
  const agreements = list(body.agreements).filter(isMapping);
  return html`<div class="facts-grid">
      <section class="fact-card"><h4>Antwort</h4>${kvTable([
        ["api_version", codeOf(body.api_version)], ["response_version", codeOf(body.response_version)], ["language", codeOf(body.language)],
        ["agreements", `${agreements.length} Abkommen`],
      ])}</section>
    </div>
    <div class="table-scroll"><table class="data-table"><thead><tr>
      <th scope="col">content_id</th><th scope="col">description</th><th scope="col">valid_from – valid_to</th>
      <th scope="col">country_from</th><th scope="col">country_to</th><th scope="col">Präferenzräume</th></tr></thead>
      <tbody>${agreements.map((a) => html`<tr>
        <td data-label="content_id"><code>${str(a.content_id)}</code></td>
        <td data-label="description">${valueCell(a.description)}</td>
        <td data-label="Gültigkeit">${str(a.valid_from) || "…"} – ${str(a.valid_to) || "offen"}</td>
        <td data-label="country_from">${list(a.country_from).length} Länder</td>
        <td data-label="country_to">${joinHtml(list(a.country_to).filter(isMapping).map((c) => html`<code title="${str(c.name)}">${str(c.iso2)}</code>`), " ")}</td>
        <td data-label="Präferenzräume">${str(a.source_preference_space_id) || "—"} → ${str(a.target_preference_space_id) || "—"}</td>
      </tr>`)}</tbody></table></div>`;
}

function jsonBlocks(body) {
  return html`<details class="panel-details">
      <summary>JSON-Baum</summary>
      ${jsonTreeHtml(body, { openDepth: 1 })}
    </details>
    <details class="panel-details">
      <summary>Rohdaten (JSON)</summary>
      <div class="actions">${copyButton("JSON kopieren", "response-json")}</div>
      <pre class="code-block code-block-tall" data-copy-source="response-json">${prettyJson(body)}</pre>
    </details>`;
}

/** The response panel of one exchange: { endpointId, request, result, source, sourceLabel, recordedAt, sentAt }. */
export function renderResponsePanel(exchange) {
  if (!exchange) return html`<p class="muted">Noch keine Antwort. Request senden, einen Testfall ausführen oder eine Aufzeichnung anzeigen.</p>`;
  const result = exchange.result;
  const head = html`${sourceBanner(exchange)}${statTiles(exchange)}${sentRequest(exchange)}`;
  if (result.kind === "network") {
    return html`${head}<div class="error-card" role="alert"><div class="status-title">Verbindung fehlgeschlagen</div>
      <p>Der Rules-Service konnte nicht erreicht werden (Netzwerk-, CORS- oder Access-Problem). Bitte die Seite neu laden, um die
      Access-Sitzung zu erneuern.</p><p class="muted small">${result.message}</p></div>`;
  }
  if (result.notJson) {
    return html`${head}<div class="error-card" role="alert"><div class="status-title">Antwort ist kein JSON</div>
      <p>Die Antwort (HTTP ${result.status}) konnte nicht als JSON gelesen werden – häufig eine abgelaufene Access-Sitzung.</p>
      <pre class="code-block">${str(result.text).slice(0, 2000)}</pre></div>`;
  }
  const body = result.body;
  const success = result.status >= 200 && result.status < 300 && isMapping(body) && !isMapping(body.error);
  let content;
  if (!success) content = errorPanel(result.status, body);
  else if (exchange.endpointId === "agreements") content = agreementsBlock(body);
  else {
    content = html`${temporalNotice(body)}${metaBlock(body)}
      ${isMapping(body.Agreement) ? agreementBlock(body.Agreement) : null}
      ${isMapping(body.Trace) ? traceBlock(body.Trace) : null}`;
  }
  return html`${head}${content}${isMapping(body) || Array.isArray(body) ? jsonBlocks(body) : null}`;
}

// ---- 6 technical structure ------------------------------------------------------------------------------------------

/** The languages to show side by side: the requested ones (Trace.text_resolution, else Request.languages, else the form). */
export function languagesToShow(body, fallback = ["DE"]) {
  const trace = isMapping(body) && isMapping(body.Trace) && isMapping(body.Trace.text_resolution) ? body.Trace.text_resolution : {};
  const fromTrace = list(trace.requested_languages).map((l) => str(l).toUpperCase()).filter(Boolean);
  if (fromTrace.length) return [...new Set(fromTrace)];
  const echo = isMapping(body) && isMapping(body.Request) ? list(body.Request.languages).map((l) => str(l).toUpperCase()).filter(Boolean) : [];
  return echo.length ? [...new Set(echo)] : fallback;
}

/** Texts side by side, one column per language; a language without text is marked (never translated, never filled). */
export function renderTexts(items, textKey, languages) {
  const entries = list(items).filter(isMapping).map((item) => ({ language: str(item.language).toUpperCase(), text: str(item[textKey]) }));
  const extra = [...new Set(entries.map((e) => e.language).filter((l) => l && !languages.includes(l)))];
  const columns = [...languages, ...extra];
  if (!columns.length) return null;
  return html`<div class="text-grid cols-${Math.min(columns.length, 3)}">${columns.map((language) => {
    const texts = entries.filter((e) => e.language === language && e.text.trim() !== "").map((e) => e.text);
    const requested = languages.includes(language);
    return texts.length
      ? html`<div class="text-col" lang="${language.toLowerCase()}"><div class="text-lang">${language}${requested ? null : html` <span class="muted">(nicht angefragt)</span>`}</div>
          <div class="text-body" data-i18n-original>${texts.join("\n\n")}</div></div>`
      : html`<div class="text-col is-missing"><div class="text-lang">${language}</div>
          <div class="text-missing">Kein Text in ${language} – fehlt in den Regeldaten (nicht übersetzt, nicht ergänzt).</div></div>`;
  })}</div>`;
}

function innerLogicLabel(group) {
  if (group.rules.length <= 1) return group.rules.length === 1 ? "eine Regel" : "keine Regeln";
  return group.rules.every((rule) => rule.logic.toUpperCase() === "OR") ? "innen ODER" : "innen UND";
}

function conditionShort(rule) {
  const parts = [rule.definition || "—"];
  if (rule.hsRange) parts.push(rule.hsRange);
  if (rule.operator || rule.percent) parts.push(`${rule.operator}${rule.operator && rule.percent ? " " : ""}${rule.percent}`.trim());
  let text = parts.join(" ");
  if (rule.target || rule.proof) text += ` · ${rule.target}${rule.target && rule.proof ? "/" : ""}${rule.proof}`;
  if (rule.weight === "1") text += " · WeightR 1";
  if (rule.orcrit) text += ` · Rorcrit ${rule.orcrit}`;
  return text;
}

function shapeBadge(shape) {
  return html`<span class="shape shape-${shape === RuleShape.UNSUPPORTED ? "unsupported" : "ok"}" title="${SHAPE_LABELS[shape] || ""}">${shape}</span>`;
}

function rulesTable(rawGroup, groupModel, conditionsByRule) {
  const rawRules = list(rawGroup.Rules).filter(isMapping);
  if (!rawRules.length) return html`<p class="muted small">Diese Regelgruppe enthält keine Regeln.</p>`;
  return html`<div class="table-scroll"><table class="data-table rules-table"><thead><tr>
      <th scope="col">Bedingung</th>${RULE_FIELDS.map((f) => html`<th scope="col">${f}</th>`)}<th scope="col">Form (shape)</th><th scope="col">RuleFingerprint</th>
    </tr></thead><tbody>${rawRules.map((raw, j) => {
    const condition = conditionsByRule[j];
    return html`<tr>
        <th scope="row" data-label="Bedingung"><code>${condition ? condition.key : "—"}</code></th>
        ${RULE_FIELDS.map((f) => html`<td data-label="${f}">${valueCell(raw[f])}</td>`)}
        <td data-label="Form (shape)">${condition ? html`${shapeBadge(condition.shape)} <span class="muted small">${SHAPE_LABELS[condition.shape]}</span>` : "—"}</td>
        <td data-label="RuleFingerprint">${empty(raw.RuleFingerprint) ? html`<span class="muted">—</span>` : html`<code title="${str(raw.RuleFingerprint)}">${shortFingerprint(raw.RuleFingerprint)}</code>`}</td>
      </tr>`;
  })}</tbody></table></div>`;
}

function alternativesBlock(structure) {
  const alternatives = structure.alternatives;
  const count = alternatives.length;
  return html`<div class="alt-block">
    <div class="block-title">Alternativen (vollständig) · ${count === 1 ? "1 Alternative" : `${count} Alternativen`}</div>
    <p class="muted small">Jede Alternative ist eine UND-Verknüpfung ihrer Bedingungen; zwischen den Alternativen gilt ODER.
      Ob eine Alternative erfüllt ist, entscheidet die Kalkulation – nicht diese Seite.</p>
    ${structure.truncated ? html`<div class="notice notice-warn" role="note">Mehr als ${MAX_ALTERNATIVES} vollständige Alternativen: nur die ersten
      ${MAX_ALTERNATIVES} sind aufgeführt (truncated).</div>` : null}
    <ol class="alt-list">${alternatives.map((alternative, index) => html`<li class="alt">
      ${index > 0 ? html`<span class="alt-or">ODER</span>` : null}
      <div class="alt-head"><span class="alt-no">${index + 1}</span><code class="alt-key">${alternative.key}</code>
        <span class="muted small">${alternative.conditions.length === 1 ? "1 Bedingung" : `${alternative.conditions.length} Bedingungen`}</span></div>
      ${alternative.conditions.length ? html`<div class="alt-conds">${joinHtml(alternative.conditions.map((c) => html`<span class="cond-chip"><code>${c.key}</code> ${shapeBadge(c.shape)}</span>`),
    html`<span class="alt-and">UND</span>`)}</div>` : html`<div class="muted small">Keine Bedingung (NONE).</div>`}
      ${alternative.conditions.length ? html`<details class="alt-details"><summary>Bedingungen im Detail</summary>
        <ul class="cond-list">${alternative.conditions.map((c) => html`<li><code>${c.key}</code> ${shapeBadge(c.shape)} <span class="muted small">${SHAPE_LABELS[c.shape]}</span>
          – ${conditionShort(c.rule)}</li>`)}</ul></details>` : null}
    </li>`)}</ol>
  </div>`;
}

/** One rule set card: key, EX, validity, fingerprint, texts, groups with rules, expression and every complete alternative. */
export function renderRuleSetCard(rawSet, index, total, { languages, exConfirmed = false, temporalFallback = false }) {
  let model = null;
  let structure = null;
  let failure = null;
  try {
    model = parseRuleSet(rawSet);
    structure = structureOf(model);
  } catch (error) {
    failure = error && error.message ? error.message : String(error);
  }
  const raw = isMapping(rawSet) ? rawSet : {};
  const key = model ? ruleSetKeyOf(model) : `${str(raw.Hspos)}/${str(raw.Hsposindx) || "1"}`;
  const ex = model ? isException(model) : str(raw.ExFlag).trim() === "1";
  const rawGroups = list(raw.RuleGroups).filter(isMapping);
  // the conditions of a group; where the structure is undetermined, key and shape still follow the guide (_group_expr, shape_of)
  const conditionsOfGroup = (groupIndex) => {
    if (structure) return structure.conditions.filter((c) => c.group === model.groups[groupIndex]);
    if (!model) return [];
    const group = model.groups[groupIndex];
    return group.rules.map((rule, j) => ({ key: `G${group.group || groupIndex + 1}.R${rule.ruleNo || j + 1}`, group, rule, shape: shapeOf(rule) }));
  };
  return html`<article class="ruleset-card${ex ? " is-ex" : ""}" data-ruleset-index="${index}">
    <header class="ruleset-head">
      <h3>Regelsatz ${index + 1} von ${total} <span class="muted">·</span> <code>${key}</code></h3>
      <div class="badges">
        ${ex ? html`<span class="pill pill-ex">EX</span>` : html`<span class="pill">kein EX</span>`}
        ${ex ? html`<span class="pill pill-ok" data-ex-marker="${index}"${exConfirmed ? null : html` hidden`}>EX bestätigt</span>` : null}
      </div>
    </header>
    ${kvTable([
      ["Hspos / Hsposindx", html`<code>${str(raw.Hspos)}</code> / <code>${str(raw.Hsposindx)}</code>`],
      ["ExFlag", codeOf(raw.ExFlag)],
      ["StartRset – EndRset", validityText(raw.StartRset, raw.EndRset)],
      ["RuleSetFingerprint", empty(raw.RuleSetFingerprint) ? html`<span class="muted">— (nicht geliefert)</span>` : html`<code class="fingerprint">${str(raw.RuleSetFingerprint)}</code>`],
    ])}
    ${ex ? html`<label class="ex-toggle"><input type="checkbox" data-action="ex-confirm" data-index="${index}"${exConfirmed ? html` checked` : null} />
      EX bestätigt (fachliche Anwendbarkeit vom Nutzer bestätigt)</label>
      <p class="muted small" data-ex-marker="${index}"${exConfirmed ? null : html` hidden`}>Nur eine Anzeigemarkierung – der Request bleibt unverändert.${temporalFallback
    ? " Die Bestätigung ersetzt die fehlende zeitliche Gültigkeit (temporal_fallback) nicht." : ""}</p>` : null}
    <div class="block-title">Warenbeschreibung (RuleSetDescr)</div>
    ${renderTexts(raw.RuleSetDescr, "DescRset", languages) || html`<p class="muted small">Keine Texte.</p>`}
    <div class="block-title">Regelgruppen (${rawGroups.length})</div>
    ${rawGroups.length ? rawGroups.map((rawGroup, g) => {
    const groupModel = model ? model.groups[g] : null;
    return html`<section class="group-block">
        <div class="group-head">
          <h4>Regelgruppe ${str(rawGroup.RGroup) || g + 1}</h4>
          <span class="pill pill-logic" title="RGroupLog – Logik zwischen den Gruppen (zählt bei der ersten Gruppe)">RGroupLog ${str(rawGroup.RGroupLog) || "—"}</span>
          ${str(rawGroup.SubGroupNo).trim() ? html`<span class="pill pill-bracket" title="SubGroupNo – ODER-Klammer">Klammer ${str(rawGroup.SubGroupNo)}</span>` : null}
          ${groupModel ? html`<span class="pill">${innerLogicLabel(groupModel)}</span>` : null}
          <span class="muted small">gültig ${validityText(rawGroup.StartRgroup, rawGroup.EndRgroup)}</span>
        </div>
        ${renderTexts(rawGroup.RuleGroupDescr, "DescRg", languages) || html`<p class="muted small">Keine Texte.</p>`}
        ${rulesTable(rawGroup, groupModel, conditionsOfGroup(g))}
      </section>`;
  }) : html`<p class="muted small">Keine Regelgruppen.</p>`}
    ${failure ? html`<div class="notice notice-err" role="note"><strong>Struktur nicht bestimmbar:</strong> ${failure}</div>` : html`
      <div class="expr-block">
        <div class="block-title">Logischer Ausdruck</div>
        <div class="expr"><code>${structure.expression.text() || translateUi("(leer)")}</code></div>
        <p class="muted small">Logik zwischen den Gruppen: <code>${structure.groupLogic}</code> (RGroupLog der ersten Gruppe) ·
          ∧ = UND, ∨ = ODER · Bedingung G&lt;Gruppe&gt;.R&lt;Regel&gt;</p>
        ${structure.notes.length ? html`<ul class="note-list">${structure.notes.map((note) => html`<li><code>${note}</code> – ${NOTE_TEXTS[note] || ""}</li>`)}</ul>` : null}
      </div>
      ${alternativesBlock(structure)}`}
  </article>`;
}

/** The structure view of a POST /v1/rules answer: every rule set on an equal footing, or one in focus. */
export function renderStructure(body, { languages, focusKey = "", exConfirmed = new Set() } = {}) {
  const ruleSets = isMapping(body) && isMapping(body.Agreement) ? list(body.Agreement.RuleSets) : [];
  if (!ruleSets.length) return html`<p class="muted">Keine Regelsätze in der aktuellen Antwort.</p>`;
  const shown = languages && languages.length ? languages : languagesToShow(body);
  const temporalFallback = Boolean(body.Trace && body.Trace.hs_resolution && body.Trace.hs_resolution.temporal_fallback === true);
  const keys = ruleSets.map((raw, index) => (isMapping(raw) ? `${str(raw.Hspos).trim()}/${str(raw.Hsposindx).trim() || "1"}` : `#${index + 1}`));
  const focusIndex = focusKey ? keys.indexOf(focusKey) : -1;
  const cards = ruleSets.map((raw, index) => ({ raw, index })).filter(({ index }) => focusIndex < 0 || index === focusIndex);
  const others = focusIndex < 0 ? [] : ruleSets.map((raw, index) => ({ raw, index })).filter(({ index }) => index !== focusIndex);
  return html`${ruleSets.length > 1 ? html`<p class="muted">${ruleSets.length} Regelsätze – keiner ist automatisch „der richtige“; alle sind gleichrangig.</p>` : null}
    ${others.length ? html`<div class="others">Weitere Regelsätze (gleichrangig): ${others.map(({ raw, index }) => html`<button type="button"
      class="btn btn-secondary btn-small" data-action="focus-ruleset" data-key="${keys[index]}">${keys[index]}${isMapping(raw) && str(raw.ExFlag).trim() === "1" ? " · EX" : ""}</button>`)}
      <button type="button" class="btn btn-secondary btn-small" data-action="focus-ruleset" data-key="">alle anzeigen</button></div>` : null}
    ${cards.map(({ raw, index }) => renderRuleSetCard(raw, index, ruleSets.length, { languages: shown, exConfirmed: exConfirmed.has(index), temporalFallback }))}`;
}

/** The options of the display-only rule-set focus. */
export function ruleSetFocusOptions(body) {
  const ruleSets = isMapping(body) && isMapping(body.Agreement) ? list(body.Agreement.RuleSets) : [];
  return ruleSets.map((raw, index) => {
    const key = isMapping(raw) ? `${str(raw.Hspos).trim()}/${str(raw.Hsposindx).trim() || "1"}` : `#${index + 1}`;
    return { key, label: `${key}${isMapping(raw) && str(raw.ExFlag).trim() === "1" ? " (EX)" : ""}` };
  });
}

// ---- 7 test cases ---------------------------------------------------------------------------------------------------

function exampleInputText(form, today) {
  const parts = [`${form.country_from} → ${form.country_to}`, `HS ${form.hs_code}`, form.content_id ? form.content_id : "Abkommen automatisch",
    `Stichtag ${form.as_of_date ? germanDate(form.as_of_date) : `heute (${germanDate(today)})`}`, languageList(form.languages)];
  return parts.join(" · ");
}

export function renderBusinessExamples(examples, today, { offline = false } = {}) {
  return html`<p class="muted">Vorbereitete Eingaben mit kurzer fachlicher Erläuterung. Ein Klick füllt nur das Formular – gesendet wird
    erst mit „Request senden“, und es gibt keine vorab festgelegte Bewertung.</p>
    <div class="scope-note scope-note-block">Die Beispiele verwenden <strong>synthetische ZZ-Testdaten</strong> (Länder XA–XD, Abkommen
      ZZ_TEST…, HS-Kapitel 99); ihre Antworten zeigt der ${offline ? "Offline-Modus" : html`<a href="?rules_session=ready&amp;mode=offline&amp;tab=business">Offline-Modus</a>`}.
      Live hat die Rules API für sie keine Regel – für echte Abfragen Länder, Abkommen und HS-Position selbst wählen.</div>
    <div class="example-grid">${examples.map((example) => html`<article class="example-card">
      <h4>${example.title}</h4>
      <p>${example.description}</p>
      <p class="muted small">${exampleInputText(example.form, today)}</p>
      <button type="button" class="btn btn-secondary btn-small" data-action="apply-example" data-example="${example.id}">In das Formular übernehmen</button>
    </article>`)}</div>`;
}

function requestSummary(request) {
  const r = isMapping(request) ? request : {};
  return [r.country_from, r.country_to].filter(Boolean).join(" → ") + (r.hs_code ? ` · HS ${r.hs_code}` : " · ohne hs_code")
    + (r.content_id ? ` · ${r.content_id}` : " · automatisch") + (r.as_of_date ? ` · ${germanDate(r.as_of_date)}` : " · ohne Stichtag")
    + (r.language ? ` · ${r.language}` : "");
}

function verdictBadge(outcome) {
  if (!outcome) return html`<span class="verdict verdict-none">nicht ausgeführt</span>`;
  if (outcome.running) return html`<span class="verdict verdict-running">läuft …</span>`;
  return html`<span class="verdict verdict-${outcome.verdict === "PASS" ? "pass" : "fail"}">${outcome.verdict}</span>`;
}

function display(value) {
  if (value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function checksTable(evaluation) {
  return html`<div class="table-scroll"><table class="data-table checks-table"><thead><tr>
      <th scope="col">Feld</th><th scope="col">erwartet</th><th scope="col">tatsächlich</th><th scope="col">Ergebnis</th></tr></thead>
    <tbody>${evaluation.checks.map((c) => html`<tr class="${c.ok ? "" : "is-diff"}">
      <th scope="row" data-label="Feld">${c.field}</th>
      <td data-label="erwartet"><code>${display(c.expected)}</code></td>
      <td data-label="tatsächlich"><code>${display(c.actual)}</code>${c.detail ? html`<div class="muted small">${c.detail}</div>` : null}</td>
      <td data-label="Ergebnis">${c.ok ? html`<span class="verdict verdict-pass">gleich</span>` : html`<span class="verdict verdict-fail">abweichend</span>`}</td>
    </tr>`)}</tbody></table></div>`;
}

export function renderRegression(view) {
  const { cases, outcomes, mode, filter, running, offline, recordedAt, open, visible, pack = null, packError = "" } = view;
  const live = mode === "live";
  const counts = countOutcomes(cases, outcomes);
  const head = html`<div class="scope-note scope-note-block"><strong>Zwei Testebenen.</strong> <strong>A – synthetisch:</strong> die
      ZZ-Testfälle dieses Repositorys; ihre Erwartungen hat der OPT.AI-Leitfaden über synthetische Antworten berechnet, sie laufen ohne
      Netzwerk. <strong>B – live:</strong> echte Anfragen mit Ihrer Access-Sitzung gegen das <em>private Testpaket</em> aus OPT-AI, das Sie
      hier als Datei laden – echte Erwartungen liegen nicht in diesem öffentlichen Repository, ohne Testpaket gibt es kein Live-Urteil.
      Beide ersetzen nicht die Unit-Test-Suite dieses Repositorys (<code>npm test</code>).</div>
    <div class="toolbar">
      <fieldset class="segmented"><legend>Testebene</legend>
        <label><input type="radio" name="test-mode" value="recording" data-action="test-mode"${!live ? html` checked` : null}${running ? html` disabled` : null} /> A · Synthetisch (offline)</label>
        <label><input type="radio" name="test-mode" value="live" data-action="test-mode"${live ? html` checked` : null}${offline || running ? html` disabled` : null} /> B · Live (privates Testpaket)</label>
      </fieldset>
      <div class="actions">
        <button type="button" class="btn btn-primary btn-small" data-action="run-all"${running || cases.length === 0 ? html` disabled` : null}>Alle ausführen</button>
        ${running ? html`<button type="button" class="btn btn-secondary btn-small" data-action="cancel-run">Abbrechen</button>` : null}
      </div>
    </div>`;
  const levelNote = live
    ? html`<p class="muted small">Live: echte Anfragen mit Ihrer Sitzung, nacheinander, mindestens 600 ms Pause zwischen zwei Anfragen – nur auf
        Klick. Ein FAIL kann auch bedeuten, dass sich die Regeldaten seit dem Stand des Testpakets geändert haben.</p>
      ${pack ? html`<div class="pack-status" data-testid="pack-status"><span>Privates Testpaket geladen: <code>${pack.name}</code> · ${pack.count === 1 ? "1 Fall" : `${pack.count} Fälle`}${pack.asOf ? ` · Stand ${germanDate(pack.asOf)}` : ""}
          · nur im Arbeitsspeicher dieser Seite</span>
          <button type="button" class="btn btn-secondary btn-small" data-action="clear-pack"${running ? html` disabled` : null}>Testpaket entfernen</button></div>`
        : html`<div class="pack-load" data-testid="pack-load"><label for="live-pack-file">Privates Testpaket laden – <code>testcases_live.json</code> aus
          OPT-AI (<code>scripts/demo_hub/devhub_private/</code>)</label>
          <input type="file" id="live-pack-file" accept=".json,application/json"${running ? html` disabled` : null} />
          <p class="muted small">Die Datei wird nur in diesem Browser gelesen – nicht hochgeladen, nicht gespeichert.</p></div>`}
      ${packError ? html`<p class="form-error" role="alert">${packError}</p>` : null}`
    : html`<p class="muted small">Synthetisch: die ZZ-Testfälle gegen ihre synthetischen Antworten, ohne Netzwerk.${offline ? " Offline-Modus: nur Ebene A." : ""}</p>
      <div class="banner banner-recording"><strong>SYNTHETISCH</strong> – keine Live-Anfrage · ZZ-Testdaten, erzeugt am ${germanDate(recordedAt) || "unbekannt"}</div>`;
  if (live && !pack) return html`${head}${levelNote}`;
  return html`${head}${levelNote}
    <div class="filter-bar" role="group" aria-label="Filter">${Object.entries(FILTERS).map(([id, label]) => html`<button type="button"
      class="btn btn-small ${filter === id ? "btn-primary" : "btn-secondary"}" data-action="test-filter" data-filter="${id}"
      aria-pressed="${filter === id ? "true" : "false"}">${label} (${id === "all" ? counts.total : counts[id]})</button>`)}</div>
    <ul class="case-list">${visible.map((testCase) => {
    const outcome = outcomes.get(testCase.id);
    const evaluation = outcome && outcome.evaluation;
    return html`<li class="case">
      <div class="case-head">
        ${verdictBadge(outcome)}
        <div class="case-title"><code>${testCase.id}</code> <span>${testCase.title}</span>
          <div class="muted small">${requestSummary(testCase.request)} · erwartet HTTP ${display(testCase.expected && testCase.expected.status)}</div></div>
        <div class="actions">
          <button type="button" class="btn btn-secondary btn-small" data-action="run-case" data-case="${testCase.id}"${running ? html` disabled` : null}>Ausführen</button>
          ${copyButton("Request kopieren", `case-json-${testCase.id}`)}
          ${copyButton("curl", `case-curl-${testCase.id}`)}
          ${outcome && outcome.result ? html`<button type="button" class="btn btn-secondary btn-small" data-action="show-case" data-case="${testCase.id}">Im Response-Panel anzeigen</button>` : null}
        </div>
      </div>
      <pre class="visually-hidden" data-copy-source="case-json-${testCase.id}">${prettyJson(testCase.request)}</pre>
      <pre class="visually-hidden" data-copy-source="case-curl-${testCase.id}">${curlOf({ method: "POST", url: ENDPOINTS.rules.url, body: testCase.request })}</pre>
      ${evaluation ? html`<details class="case-details" data-case="${testCase.id}"${open.has(testCase.id) ? html` open` : null}>
        <summary>${evaluation.verdict === "PASS" ? `alle ${evaluation.checks.length} Prüfungen gleich`
    : `${evaluation.diffs.length} von ${evaluation.checks.length} Prüfungen abweichend: ${evaluation.diffs.map((d) => d.field).join(", ")}`}
          · ${outcome.source === "live" ? `live, ${formatDuration(outcome.result.durationMs)}` : "synthetisch"}</summary>
        ${checksTable(evaluation)}
        <div class="block-title">Request</div><pre class="code-block">${prettyJson(testCase.request)}</pre>
      </details>` : null}
    </li>`;
  })}</ul>
    ${visible.length === 0 ? html`<p class="muted">Kein Testfall für diesen Filter.</p>` : null}`;
}

export function renderFixtureButtons(fixtures) {
  return html`${Object.entries(fixtures).map(([key, fixture]) => html`<button type="button" class="btn btn-secondary btn-small"
    data-action="show-fixture" data-fixture="${key}">${fixture.label}</button>`)}`;
}

