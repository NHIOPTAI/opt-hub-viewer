import { getLocale, translateUi, optionLabel, originalSourceNote } from '../i18n/ui.js';
// OPT.AI Developer Hub -- the page: state, DOM wiring and the two live calls (GET /v1/agreements, POST /v1/rules).
//
// Live is the default. `?rules_session=ready&mode=offline` renders the whole page from the recordings (no network
// request at all: the recordings are an ES module, the API client is never called). Optional, UI state only:
// `endpoint=agreements|rules`, `tab=business|regression`; offline additionally `case=<test case id>` (the recording shown).
// Requests are sent only on a click -- the regression cases one after another, at least 600 ms apart when live.
//
// V1.1 (this repository is public): every repository datum is SYNTHETIC (ZZ). The regression tests have two levels:
//   A  the synthetic cases (data/testcases.js) against the synthetic answers (data/recordings.js) -- no network;
//   B  live, with the user's own Access session, against the PRIVATE test pack of OPT-AI, which the user loads from a local file
//      (kept in memory only: never fetched, uploaded or stored). Without that pack there is no live verdict at all.

import { callApi, createLiveGate } from "./api.js";
import TESTCASES from "./data/testcases.js";
import { agreementsForPair, buildCountryRelations, sortCountryEntries, validAt } from "./discovery.js";
import { BUSINESS_EXAMPLES } from "./examples.js";
import { FIXTURES } from "./fixtures.js";
import { html } from "./html.js";
import { APIS, apiById, ENDPOINTS } from "./registry.js";
import {
  renderApiSelector, renderBusinessExamples, renderEndpointSelector, renderFixtureButtons, renderRegression, renderRequestPanel,
  renderResponsePanel, renderStructure, languagesToShow, ruleSetFocusOptions,
} from "./render.js";
import { AUTO_CONTENT, buildRulesBody, describeRequest, LANGUAGES, todayIso, validateRulesInput } from "./request.js";
import { caseForRequest, filterCases, parseTestPack, resultFromRecording, runSequentially } from "./testcases.js";

const params = new URLSearchParams(window.location.search);
const OFFLINE = params.get("mode") === "offline";
const CASES = TESTCASES.cases;
let recordedAt = TESTCASES._meta.expected_as_of; // replaced by the recordings' own recorded_at once they are loaded

const state = {
  apiId: "rules",
  endpointId: params.get("endpoint") === "agreements" ? "agreements" : "rules",
  discovery: { status: "loading", agreements: [], relations: null },
  exchanges: { agreements: null, rules: null },
  showErrors: false,
  busy: false,
  focusKey: "",
  exConfirmed: new Set(),
  tests: {
    tab: params.get("tab") === "regression" ? "regression" : "business",
    mode: "recording", // "recording" = level A (synthetic, offline); "live" = level B (private test pack, own session)
    filter: "all",
    outcomes: new Map(),
    open: new Set(),
    running: false,
    cancel: false,
    pack: null, // { name, asOf, cases } -- the private test pack, in memory only
    packError: "",
  },
};

/** The cases of the active level: the synthetic ones, or the cases of the loaded private test pack (none without a pack). */
function activeCases() {
  if (state.tests.mode !== "live") return CASES;
  return state.tests.pack ? state.tests.pack.cases : [];
}

function resetOutcomes() {
  state.tests.outcomes = new Map();
  state.tests.open = new Set();
  state.tests.filter = "all";
}

const gate = createLiveGate();
let recordingsPromise = null;

/** The recordings (recordings.json as an ES module), loaded on first use only. */
function loadRecordings() {
  if (!recordingsPromise) {
    recordingsPromise = import("./data/recordings.js").then((module) => {
      if (module.default._meta && module.default._meta.recorded_at) recordedAt = module.default._meta.recorded_at;
      return module.default;
    });
  }
  return recordingsPromise;
}

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const timeNow = () => new Date().toLocaleTimeString(getLocale());

/** The ONLY place a live request is made (never in the offline mode). */
async function liveCall(endpointId, body) {
  if (OFFLINE) throw new Error("Offline-Modus: keine Live-Anfrage");
  const endpoint = ENDPOINTS[endpointId];
  await gate.before();
  try {
    return await callApi({ method: endpoint.method, url: endpoint.url, body });
  } finally {
    gate.after();
  }
}

// ---- session status -------------------------------------------------------------------------------------------------

function setSessionStatus(kind, text) {
  const cls = kind === "ok" ? "status-ok" : kind === "err" ? "status-err" : "status-info";
  $("session-status").innerHTML = html`<div class="status-title">Sitzungsstatus</div><div class="${cls}">${text}</div>`.toString();
}

function sessionFromResult(result) {
  if (result.kind !== "response") setSessionStatus("err", "Verbindung zu rules.opt-hub.ai fehlgeschlagen.");
  else if (result.status === 403) setSessionStatus("err", "Nicht authentifiziert (403) – bitte über Cloudflare Access anmelden und die Seite neu laden.");
  else setSessionStatus("ok", "Verbindung zu rules.opt-hub.ai erfolgreich.");
}

// ---- form -----------------------------------------------------------------------------------------------------------

function optionsHtml(options) {
  return options.map((o) => html`<option value="${o.value}"${o.disabled ? html` disabled` : null}${o.selected ? html` selected` : null}${o.original ? html` data-i18n-original` : null}>${optionLabel(o.value, o.label)}</option>`);
}

function setOptions(select, options) {
  select.innerHTML = html`${optionsHtml(options)}`.toString();
  originalSourceNote(select, options.some(o => o.original));
}

function readForm() {
  return {
    country_from: $("country_from").value,
    country_to: $("country_to").value,
    content_id: $("content_id").value,
    hs_code: $("hs_code").value,
    as_of_date: $("as_of_date").value,
    languages: LANGUAGES.filter((language) => document.querySelector(`input[name="languages"][value="${language}"]`).checked),
  };
}

function populateFrom() {
  const select = $("country_from");
  const relations = state.discovery.relations;
  const previous = select.value;
  if (!relations || relations.fromNames.size === 0) {
    setOptions(select, [{ value: "", label: "nicht verfügbar", disabled: true, selected: true }]);
    select.disabled = true;
    return;
  }
  const entries = sortCountryEntries(relations.fromNames);
  setOptions(select, [{ value: "", label: "bitte wählen …", disabled: true, selected: !previous },
    ...entries.map((e) => ({ value: e.iso2, label: e.name ? `${e.iso2} — ${e.name}` : e.iso2, selected: e.iso2 === previous }))]);
  select.disabled = false;
}

function populateTo() {
  const select = $("country_to");
  const from = $("country_from").value;
  const relations = state.discovery.relations;
  const previous = select.value;
  if (!relations || !from || !relations.relations.has(from)) {
    setOptions(select, [{ value: "", label: relations ? "zuerst Abgangsland wählen" : "nicht verfügbar", disabled: true, selected: true }]);
    select.disabled = true;
    return;
  }
  const entries = sortCountryEntries(relations.relations.get(from));
  const keep = entries.some((e) => e.iso2 === previous);
  setOptions(select, [{ value: "", label: entries.length ? "bitte wählen …" : "keine Relation verfügbar", disabled: true, selected: !keep },
    ...entries.map((e) => ({ value: e.iso2, label: e.name ? `${e.iso2} — ${e.name}` : e.iso2, selected: keep && e.iso2 === previous }))]);
  select.disabled = entries.length === 0;
}

function populateAgreements() {
  const select = $("content_id");
  const previous = select.value;
  const date = $("as_of_date").value;
  const pair = agreementsForPair(state.discovery.agreements, $("country_from").value, $("country_to").value);
  const keep = pair.some((a) => a.content_id === previous);
  setOptions(select, [
    { value: AUTO_CONTENT, label: "automatisch (die API wählt das Abkommen)", selected: !keep },
    ...pair.map((a) => ({
      value: a.content_id, original: true,
      label: `${a.content_id}${a.description ? ` – ${a.description}` : ""} (${a.valid_from || "…"} – ${a.valid_to || translateUi("offen")})${validAt(a, date) === false ? translateUi(" · am Stichtag nicht gültig") : ""}`,
      selected: keep && a.content_id === previous,
    })),
  ]);
  select.disabled = pair.length === 0;
}

function onFormChanged() {
  renderRequest();
}

// ---- rendering ------------------------------------------------------------------------------------------------------

function renderSelectors() {
  $("api-select").innerHTML = renderApiSelector(APIS, state.apiId).toString();
  $("endpoint-select").innerHTML = renderEndpointSelector(apiById(state.apiId), state.endpointId).toString();
  const rules = state.endpointId === "rules";
  $("rules-form").hidden = !rules;
  $("agreements-inputs").hidden = rules;
}

function renderRequest() {
  if (state.endpointId === "agreements") {
    $("request-panel").innerHTML = renderRequestPanel(describeRequest("agreements", null)).toString();
    return;
  }
  const values = readForm();
  const validation = validateRulesInput(values);
  $("request-panel").innerHTML = renderRequestPanel(describeRequest("rules", buildRulesBody(values)), {
    errors: state.showErrors ? validation.errors : [],
    note: OFFLINE ? "Offline-Modus: „Request senden“ zeigt die Aufzeichnung zu genau dieser Eingabe (falls vorhanden) – keine Netzwerkanfrage." : null,
  }).toString();
}

function renderResponse() {
  $("response-panel").innerHTML = renderResponsePanel(state.exchanges[state.endpointId]).toString();
}

function rulesBody() {
  const exchange = state.exchanges.rules;
  if (!exchange || exchange.result.kind !== "response") return null;
  const body = exchange.result.body;
  return body && typeof body === "object" && body.Agreement && Array.isArray(body.Agreement.RuleSets) ? body : null;
}

function renderStructureView() {
  const toolbar = $("structure-toolbar");
  const view = $("structure-view");
  if (state.endpointId === "agreements") {
    toolbar.hidden = true;
    view.innerHTML = html`<p class="muted">Die technische Darstellung gilt für <code>POST /v1/rules</code>.</p>`.toString();
    return;
  }
  const body = rulesBody();
  if (!body) {
    toolbar.hidden = true;
    const exchange = state.exchanges.rules;
    view.innerHTML = html`<p class="muted">${exchange ? "Die aktuelle Antwort enthält keine Regelsätze." : "Noch keine Antwort mit Regelsätzen."}</p>`.toString();
    return;
  }
  const options = ruleSetFocusOptions(body);
  toolbar.hidden = options.length < 2;
  setOptions($("focus-select"), [{ value: "", label: "Alle Regelsätze (gleichrangig)", selected: state.focusKey === "" },
    ...options.map((o) => ({ value: o.key, label: o.label, selected: o.key === state.focusKey }))]);
  view.innerHTML = renderStructure(body, {
    languages: languagesToShow(body, readForm().languages),
    focusKey: state.focusKey,
    exConfirmed: state.exConfirmed,
  }).toString();
}

function renderTests() {
  const t = state.tests;
  for (const tab of ["business", "regression"]) {
    const button = $(`tab-${tab}`);
    button.setAttribute("aria-selected", t.tab === tab ? "true" : "false");
    button.classList.toggle("active", t.tab === tab);
    $(`panel-${tab}`).hidden = t.tab !== tab;
  }
  if (t.tab === "business") {
    $("panel-business").innerHTML = renderBusinessExamples(BUSINESS_EXAMPLES, todayIso(), { offline: OFFLINE }).toString();
  } else {
    const cases = activeCases();
    $("panel-regression").innerHTML = renderRegression({
      cases, outcomes: t.outcomes, mode: t.mode, filter: t.filter, running: t.running, offline: OFFLINE,
      recordedAt, open: t.open, visible: filterCases(cases, t.outcomes, t.filter),
      pack: t.pack ? { name: t.pack.name, asOf: t.pack.asOf, count: t.pack.cases.length } : null, packError: t.packError,
    }).toString();
  }
}

function setExchange(exchange, { scroll = false } = {}) {
  state.exchanges[exchange.endpointId] = exchange;
  if (exchange.endpointId === "rules") {
    state.focusKey = "";
    state.exConfirmed = new Set();
  }
  if (state.endpointId !== exchange.endpointId) {
    state.endpointId = exchange.endpointId;
    renderSelectors();
    renderRequest();
  }
  renderResponse();
  renderStructureView();
  if (scroll) $("step-response").scrollIntoView({ block: "start" });
}

// ---- discovery ------------------------------------------------------------------------------------------------------

async function loadDiscovery() {
  const status = $("country-load-status");
  status.textContent = "Länderdaten werden geladen …";
  status.classList.remove("country-load-err");
  let result;
  let source = "live";
  let discoveryRecordedAt = null;
  try {
    if (OFFLINE) {
      const recording = (await loadRecordings()).recordings.__agreements__;
      result = resultFromRecording(recording);
      source = "recording";
      discoveryRecordedAt = recording.recorded_at;
    } else {
      result = await liveCall("agreements", null);
    }
  } catch (error) {
    result = { kind: "network", message: error && error.message ? error.message : String(error), durationMs: null, attempts: 0 };
  }
  const body = result.kind === "response" ? result.body : null;
  const ok = result.kind === "response" && result.status === 200 && body && Array.isArray(body.agreements);
  state.discovery = ok
    ? { status: "ready", agreements: body.agreements, relations: buildCountryRelations(body.agreements) }
    : { status: "error", agreements: [], relations: null };
  populateFrom();
  populateTo();
  populateAgreements();
  if (ok && state.discovery.relations.fromNames.size > 0) {
    status.textContent = "";
  } else {
    status.textContent = ok ? "Die Discovery enthält keine verfügbaren Länder." : "Verfügbare Länder konnten nicht geladen werden.";
    status.classList.add("country-load-err");
  }
  if (OFFLINE) setSessionStatus("info", "Offline-Modus: keine Verbindung zu rules.opt-hub.ai – alle Antworten stammen aus der Aufzeichnung.");
  else sessionFromResult(result);
  state.exchanges.agreements = { endpointId: "agreements", request: describeRequest("agreements", null), result, source,
    sourceLabel: "Discovery beim Laden der Seite", recordedAt: discoveryRecordedAt, sentAt: source === "live" ? timeNow() : null };
  if (state.endpointId === "agreements") renderResponse();
  renderRequest();
}

// ---- sending --------------------------------------------------------------------------------------------------------

function setBusy(busy, buttonId, label) {
  state.busy = busy;
  const button = $(buttonId);
  button.disabled = busy;
  button.textContent = busy ? "Sende …" : label;
}

async function sendRules() {
  const values = readForm();
  const validation = validateRulesInput(values);
  $("form-error").textContent = "";
  if (!validation.ok) {
    state.showErrors = true;
    renderRequest();
    $("form-error").textContent = validation.errors[0].message;
    return;
  }
  state.showErrors = false;
  const body = buildRulesBody(values);
  const request = describeRequest("rules", body);
  renderRequest();
  if (OFFLINE) {
    const testCase = caseForRequest(CASES, body);
    if (!testCase) {
      $("form-error").textContent = "Offline-Modus: Für genau diese Eingabe gibt es keine synthetische Antwort – siehe „Fachliche Beispiele“ und „Technische Regressionstests“.";
      return;
    }
    const recording = (await loadRecordings()).recordings[testCase.id];
    setExchange({ endpointId: "rules", request, result: resultFromRecording(recording), source: "recording",
      sourceLabel: `Testfall ${testCase.id}`, recordedAt: recording.recorded_at }, { scroll: true });
    return;
  }
  setBusy(true, "send-rules", "Request senden");
  try {
    const result = await liveCall("rules", body);
    sessionFromResult(result);
    setExchange({ endpointId: "rules", request, result, source: "live", sentAt: timeNow() }, { scroll: true });
  } finally {
    setBusy(false, "send-rules", "Request senden");
  }
}

async function sendAgreements() {
  if (OFFLINE) {
    const recording = (await loadRecordings()).recordings.__agreements__;
    setExchange({ endpointId: "agreements", request: describeRequest("agreements", null), result: resultFromRecording(recording),
      source: "recording", sourceLabel: "Discovery", recordedAt: recording.recorded_at }, { scroll: true });
    return;
  }
  setBusy(true, "send-agreements", "Request senden");
  try {
    const result = await liveCall("agreements", null);
    sessionFromResult(result);
    const body = result.kind === "response" ? result.body : null;
    if (result.kind === "response" && result.status === 200 && body && Array.isArray(body.agreements)) {
      state.discovery = { status: "ready", agreements: body.agreements, relations: buildCountryRelations(body.agreements) };
      populateFrom();
      populateTo();
      populateAgreements();
    }
    setExchange({ endpointId: "agreements", request: describeRequest("agreements", null), result, source: "live", sentAt: timeNow() }, { scroll: true });
  } finally {
    setBusy(false, "send-agreements", "Request senden");
  }
}

// ---- filling the form (examples, cases) -----------------------------------------------------------------------------

function selectIfPresent(select, value) {
  if ([...select.options].some((o) => o.value === value && !o.disabled)) {
    select.value = value;
    return true;
  }
  return false;
}

/** Fills the form; returns the problems (a value the discovery does not offer is not set). */
function fillForm(form) {
  const problems = [];
  if (state.endpointId !== "rules") {
    state.endpointId = "rules";
    renderSelectors();
  }
  if (form.country_from && !selectIfPresent($("country_from"), form.country_from)) problems.push(`Abgangsland ${form.country_from} ist in der Discovery nicht verfügbar.`);
  populateTo();
  if (form.country_to && !selectIfPresent($("country_to"), form.country_to)) problems.push(`Zielland ${form.country_to} ist für dieses Abgangsland nicht verfügbar.`);
  if (form.as_of_date !== undefined) $("as_of_date").value = form.as_of_date || todayIso();
  populateAgreements();
  if (form.content_id && !selectIfPresent($("content_id"), form.content_id)) problems.push(`Abkommen ${form.content_id} ist für dieses Länderpaar nicht verfügbar – „automatisch“ bleibt gewählt.`);
  $("hs_code").value = form.hs_code || "";
  const languages = new Set(form.languages || []);
  for (const language of LANGUAGES) document.querySelector(`input[name="languages"][value="${language}"]`).checked = languages.has(language);
  state.showErrors = false;
  $("form-error").textContent = problems.join(" ");
  renderRequest();
  return problems;
}

function formOfRequest(request) {
  return {
    country_from: request.country_from || "",
    country_to: request.country_to || "",
    content_id: request.content_id || "",
    hs_code: request.hs_code || "",
    as_of_date: request.as_of_date || "",
    languages: String(request.language || "DE").split(",").map((l) => l.trim().toUpperCase()),
  };
}

// ---- regression runs ------------------------------------------------------------------------------------------------

async function executeCase(testCase) {
  if (state.tests.mode !== "live" || OFFLINE) {
    const recording = (await loadRecordings()).recordings[testCase.id];
    return recording ? resultFromRecording(recording) : { kind: "network", message: "keine synthetische Antwort vorhanden", durationMs: null, attempts: 0 };
  }
  return liveCall("rules", testCase.request);
}

/** Reads the private test pack the user chose (a local file): in memory only. */
async function loadPack(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  const parsed = parseTestPack(await file.text());
  resetOutcomes();
  if (parsed.ok) {
    state.tests.pack = { name: file.name, ...parsed.pack };
    state.tests.packError = "";
  } else {
    state.tests.pack = null;
    state.tests.packError = parsed.error;
  }
  renderTests();
}

async function runCases(cases) {
  const t = state.tests;
  if (t.running) return;
  t.running = true;
  t.cancel = false;
  const source = t.mode !== "live" || OFFLINE ? "recording" : "live";
  renderTests();
  try {
    await runSequentially(cases, {
      execute: executeCase,
      live: source === "live",
      sleep,
      onStart: (testCase) => {
        t.outcomes.set(testCase.id, { running: true });
        renderTests();
      },
      onResult: (testCase, result, evaluation) => {
        t.outcomes.set(testCase.id, { verdict: evaluation.verdict, evaluation, result, source });
        if (evaluation.verdict === "FAIL") t.open.add(testCase.id);
        renderTests();
      },
      isCancelled: () => t.cancel,
    });
  } finally {
    for (const [id, outcome] of t.outcomes) if (outcome.running) t.outcomes.delete(id);
    t.running = false;
    renderTests();
  }
}

function showCase(id) {
  const testCase = activeCases().find((c) => c.id === id);
  const outcome = state.tests.outcomes.get(id);
  if (!testCase || !outcome || !outcome.result) return;
  setExchange({ endpointId: "rules", request: describeRequest("rules", testCase.request), result: outcome.result, source: outcome.source,
    sourceLabel: `Testfall ${id}`, recordedAt: outcome.result.recordedAt || recordedAt, sentAt: null }, { scroll: true });
}

function showFixture(key) {
  const fixture = FIXTURES[key];
  if (!fixture) return;
  const text = JSON.stringify(fixture.data);
  setExchange({
    endpointId: "rules",
    request: null,
    result: { kind: "response", status: fixture.kind === "result" ? 200 : fixture.statusCode, body: fixture.data, text, notJson: false,
      sizeBytes: new TextEncoder().encode(text).length, durationMs: null, attempts: 0 },
    source: "fixture",
    sourceLabel: fixture.label,
  }, { scroll: true });
}

// ---- copy -----------------------------------------------------------------------------------------------------------

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the selection fallback
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.className = "visually-hidden";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

async function onCopy(button) {
  const target = button.getAttribute("data-copy");
  const source = document.querySelector(`[data-copy-source="${CSS.escape(target)}"]`);
  if (!source) return;
  const ok = await copyText(source.textContent);
  const label = button.textContent;
  button.textContent = ok ? "Kopiert" : "Kopieren nicht möglich";
  setTimeout(() => { button.textContent = label; }, 1500);
}

// ---- events ---------------------------------------------------------------------------------------------------------

function onClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  const action = target.getAttribute("data-action");
  if (action === "copy") onCopy(target);
  else if (action === "select-api") {
    state.apiId = target.getAttribute("data-api");
    renderSelectors();
  } else if (action === "select-endpoint") {
    state.endpointId = target.getAttribute("data-endpoint") === "agreements" ? "agreements" : "rules";
    renderSelectors();
    renderRequest();
    renderResponse();
    renderStructureView();
  } else if (action === "send-agreements") sendAgreements();
  else if (action === "tab") {
    state.tests.tab = target.getAttribute("data-tab") === "regression" ? "regression" : "business";
    renderTests();
  } else if (action === "apply-example") {
    const example = BUSINESS_EXAMPLES.find((e) => e.id === target.getAttribute("data-example"));
    if (example) {
      fillForm(example.form);
      $("step-inputs").scrollIntoView({ block: "start" });
    }
  } else if (action === "run-all") {
    if (activeCases().length) runCases(activeCases());
  } else if (action === "run-case") {
    const testCase = activeCases().find((c) => c.id === target.getAttribute("data-case"));
    if (testCase) runCases([testCase]);
  } else if (action === "clear-pack") {
    if (!state.tests.running) {
      state.tests.pack = null;
      state.tests.packError = "";
      resetOutcomes();
      renderTests();
    }
  } else if (action === "cancel-run") {
    state.tests.cancel = true;
  } else if (action === "test-filter") {
    state.tests.filter = target.getAttribute("data-filter") || "all";
    renderTests();
  } else if (action === "show-case") showCase(target.getAttribute("data-case"));
  else if (action === "show-fixture") showFixture(target.getAttribute("data-fixture"));
  else if (action === "focus-ruleset") {
    state.focusKey = target.getAttribute("data-key") || "";
    renderStructureView();
  }
}

function onChange(event) {
  const target = event.target;
  const action = target.getAttribute("data-action");
  if (action === "test-mode") {
    if (!OFFLINE && !state.tests.running) {
      const mode = target.value === "live" ? "live" : "recording";
      if (mode !== state.tests.mode) resetOutcomes();
      state.tests.mode = mode;
    }
    renderTests();
    if (state.tests.mode === "recording") loadRecordings().then(() => renderTests());
    return;
  }
  if (target.id === "live-pack-file") {
    if (!OFFLINE && !state.tests.running) loadPack(target);
    return;
  }
  if (action === "ex-confirm") {
    const index = Number(target.getAttribute("data-index"));
    if (target.checked) state.exConfirmed.add(index);
    else state.exConfirmed.delete(index);
    for (const marker of document.querySelectorAll(`[data-ex-marker="${index}"]`)) marker.hidden = !target.checked;
    return;
  }
  if (target.id === "focus-select") {
    state.focusKey = target.value;
    renderStructureView();
    return;
  }
  if (target.id === "country_from") {
    populateTo();
    populateAgreements();
  } else if (target.id === "country_to" || target.id === "as_of_date") {
    populateAgreements();
  }
  if (target.closest("#rules-form")) onFormChanged();
}

function onInput(event) {
  const target = event.target;
  if (target.id === "hs_code") {
    const digits = target.value.replace(/[^0-9]/g, "");
    if (digits !== target.value) target.value = digits;
  }
  if (target.closest("#rules-form")) onFormChanged();
}

function onToggle(event) {
  const details = event.target;
  if (!(details instanceof HTMLDetailsElement) || !details.classList.contains("case-details")) return;
  const id = details.getAttribute("data-case");
  if (details.open) state.tests.open.add(id);
  else state.tests.open.delete(id);
}

// ---- start ----------------------------------------------------------------------------------------------------------

async function start() {
  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("toggle", onToggle, true);
  $("rules-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.busy) sendRules();
  });
  $("as_of_date").value = todayIso();
  if (OFFLINE) {
    const banner = $("offline-banner");
    banner.hidden = false;
    banner.innerHTML = html`<div class="container"><div class="banner banner-recording"><strong>OFFLINE-MODUS · SYNTHETISCHE DATEN</strong> –
      alle Antworten sind synthetische ZZ-Testdaten im Format der Rules API v1; es wird keine Anfrage an rules.opt-hub.ai gesendet.
      Für Live-Anfragen die Seite ohne <code>mode=offline</code> öffnen.</div></div>`.toString();
  }
  $("fixture-buttons").innerHTML = renderFixtureButtons(FIXTURES).toString();
  renderSelectors();
  renderRequest();
  renderResponse();
  renderStructureView();
  renderTests();
  await loadDiscovery();
  if (OFFLINE) {
    const wanted = CASES.find((c) => c.id === params.get("case")) || CASES[0];
    fillForm(formOfRequest(wanted.request));
    if (params.get("endpoint") === "agreements") {
      state.endpointId = "agreements";
      renderSelectors();
      renderRequest();
    }
    const recording = (await loadRecordings()).recordings[wanted.id];
    state.exchanges.rules = { endpointId: "rules", request: describeRequest("rules", wanted.request), result: resultFromRecording(recording),
      source: "recording", sourceLabel: `Testfall ${wanted.id}`, recordedAt: recording.recorded_at };
    renderResponse();
    renderStructureView();
  }
}

// the inline bootstrap in <head> redirects to https://rules.opt-hub.ai/session-bootstrap unless rules_session=ready:
// nothing starts (and no request is made) while that redirect is underway
if (params.get("rules_session") === "ready") start();

window.addEventListener("optai:languagechange", () => {
  populateFrom(); populateTo(); populateAgreements();
  renderSelectors(); renderRequest(); renderResponse(); renderStructureView(); renderTests();
});
