// OPT.AI Developer Hub -- the technical regression checks: summary of an answer, expected vs actual, sequential runs
// (pure, no DOM access; the call and the pause are injected).
//
// The checks compare an answer of the Rules API with documented expectations: the synthetic cases of this repository (offline)
// or the private test pack loaded by the user (live). A live FAIL can also mean that the rule data changed. They do not replace
// the automated unit tests of this repository.

import { MIN_LIVE_GAP_MS, utf8Length } from "./api.js";
import { languageList, languagesOf } from "./request.js";
import { summarizeRuleSet } from "./rules-structure.js";

const isMapping = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const get = (value, key) => (isMapping(value) && key in value ? value[key] : undefined);
const orNull = (value) => (value === undefined ? null : value);

/** JSON equality, the key order of objects does not matter. */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (isMapping(a) && isMapping(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
  }
  return Number.isNaN(a) && Number.isNaN(b);
}

function setDifference(expected, actual) {
  const missing = expected.filter((item) => !actual.includes(item));
  const extra = actual.filter((item) => !expected.includes(item));
  return { missing, extra };
}

/** A run result from a recording (no network): the same shape as a live response. */
export function resultFromRecording(recording) {
  const text = JSON.stringify(recording.body);
  return {
    kind: "response",
    status: recording.status,
    body: recording.body,
    text,
    notJson: false,
    sizeBytes: utf8Length(text),
    durationMs: null,
    attempts: 0,
    recordedAt: recording.recorded_at || null,
  };
}

/** The fields of an answer the documented expectations speak about (rule-set structure via the guide's port). */
export function actualOf(result) {
  if (!result || result.kind !== "response") {
    return { status: null, network: result ? result.message || "keine Antwort" : "keine Antwort" };
  }
  const body = result.body;
  const error = get(body, "error");
  const agreement = get(body, "Agreement");
  const trace = get(body, "Trace");
  const resolution = get(trace, "hs_resolution");
  const ruleSets = get(agreement, "RuleSets");
  return {
    status: result.status,
    error_code: orNull(get(error, "code")),
    error_reason: orNull(get(get(error, "details"), "reason")),
    content_id: orNull(get(agreement, "ContentId")),
    hs_resolution: {
      matched_hs: orNull(get(resolution, "matched_hs")),
      hs_match_level: orNull(get(resolution, "hs_match_level")),
      fallback_used: orNull(get(resolution, "fallback_used")),
      temporal_fallback: orNull(get(resolution, "temporal_fallback")),
    },
    rule_set_count: Array.isArray(ruleSets) ? ruleSets.length : null,
    rule_sets: Array.isArray(ruleSets) ? ruleSets.map((raw, index) => {
      try {
        return summarizeRuleSet(raw);
      } catch (error_) {
        const key = isMapping(raw) ? `${String(raw.Hspos ?? "")}/${String(raw.Hsposindx || "1")}` : `#${index + 1}`;
        return { key, error: error_ && error_.message ? error_.message : String(error_) };
      }
    }) : [],
    response_version: orNull(get(get(body, "Meta"), "response_version")),
  };
}

const RULE_SET_FIELDS = ["ex", "fingerprint", "groups", "rules", "expression_text", "alternative_count", "truncated", "notes"];

/**
 * Expected vs actual for one documented case.
 * -> { verdict: "PASS" | "FAIL", checks: [{field, expected, actual, ok, detail?}], diffs: the failed checks, actual }
 */
export function evaluateCase(testCase, result) {
  const expected = testCase.expected || {};
  const actual = actualOf(result);
  const checks = [];
  const check = (field, exp, act, ok = deepEqual(exp, act), detail = null) => {
    checks.push(detail ? { field, expected: exp, actual: act, ok, detail } : { field, expected: exp, actual: act, ok });
  };

  if (actual.network !== undefined) {
    check("status", orNull(expected.status), null, false, `keine Antwort (Netzwerk): ${actual.network}`);
    return finish(checks, actual);
  }
  check("status", orNull(expected.status), actual.status);
  if (expected.status !== undefined && expected.status !== actual.status) {
    // a different status makes every further comparison meaningless -- the API's error code says why
    if (actual.error_code !== null) check("error.code", orNull(expected.error_code), actual.error_code);
    return finish(checks, actual);
  }
  if ("error_code" in expected) check("error.code", expected.error_code, actual.error_code);
  if ("error_reason" in expected) check("error.details.reason", expected.error_reason, actual.error_reason);
  if ("content_id" in expected) check("Agreement.ContentId", expected.content_id, actual.content_id);
  if (isMapping(expected.hs_resolution)) {
    for (const key of Object.keys(expected.hs_resolution)) {
      check(`Trace.hs_resolution.${key}`, expected.hs_resolution[key], orNull(actual.hs_resolution[key]));
    }
  }
  if ("rule_set_count" in expected) check("Agreement.RuleSets (Anzahl)", expected.rule_set_count, actual.rule_set_count);
  if (Array.isArray(expected.rule_sets)) {
    const expectedKeys = expected.rule_sets.map((set) => set.key);
    const actualKeys = actual.rule_sets.map((set) => set.key);
    const keyDiff = setDifference(expectedKeys, actualKeys);
    check("Regelsätze (Schlüssel)", [...expectedKeys].sort(), [...actualKeys].sort(), undefined, keyDiff.missing.length || keyDiff.extra.length
      ? `fehlt: ${keyDiff.missing.join(", ") || "–"} · zusätzlich: ${keyDiff.extra.join(", ") || "–"}` : null);
    for (const exp of expected.rule_sets) {
      const act = actual.rule_sets.find((set) => set.key === exp.key);
      if (!act) continue;
      const prefix = `Regelsatz ${exp.key}`;
      if (act.error) {
        check(`${prefix} · Struktur`, "bestimmbar", "nicht bestimmbar", false, act.error);
        continue;
      }
      for (const field of RULE_SET_FIELDS) if (field in exp) check(`${prefix} · ${field}`, exp[field], act[field]);
      if (Array.isArray(exp.alternatives)) {
        const diff = setDifference(exp.alternatives, act.alternatives);
        const ok = diff.missing.length === 0 && diff.extra.length === 0 && exp.alternatives.length === act.alternatives.length;
        check(`${prefix} · alternatives (als Menge)`, exp.alternatives, act.alternatives, ok,
          ok ? null : `fehlt: ${diff.missing.join(", ") || "–"} · zusätzlich: ${diff.extra.join(", ") || "–"}`);
      }
      if (isMapping(exp.shapes)) {
        const keys = [...new Set([...Object.keys(exp.shapes), ...Object.keys(act.shapes)])];
        for (const key of keys) check(`${prefix} · shape ${key}`, orNull(exp.shapes[key]), orNull(act.shapes[key]));
      }
    }
  }
  if ("response_version" in expected) check("Meta.response_version", expected.response_version, actual.response_version);
  return finish(checks, actual);
}

function finish(checks, actual) {
  const diffs = checks.filter((entry) => !entry.ok);
  return { verdict: diffs.length === 0 ? "PASS" : "FAIL", checks, diffs, actual };
}

export const FILTERS = Object.freeze({ all: "Alle", PASS: "PASS", FAIL: "FAIL", notrun: "nicht ausgeführt" });

/** The cases a filter shows; `outcomes` maps case id -> { verdict } (absent = not run). */
export function filterCases(cases, outcomes, filter) {
  return cases.filter((testCase) => {
    const outcome = outcomes.get(testCase.id);
    const verdict = outcome && outcome.verdict ? outcome.verdict : null;
    if (filter === "PASS" || filter === "FAIL") return verdict === filter;
    if (filter === "notrun") return verdict === null;
    return true;
  });
}

export function countOutcomes(cases, outcomes) {
  const counts = { total: cases.length, PASS: 0, FAIL: 0, notrun: 0 };
  for (const testCase of cases) {
    const outcome = outcomes.get(testCase.id);
    if (outcome && outcome.verdict === "PASS") counts.PASS += 1;
    else if (outcome && outcome.verdict === "FAIL") counts.FAIL += 1;
    else counts.notrun += 1;
  }
  return counts;
}

/**
 * Runs the cases ONE AFTER ANOTHER (never in parallel). Live: at least `pauseMs` (>= 600 ms) between two requests.
 * `execute(case)` performs one request (or reads one recording) and resolves to a run result.
 */
export async function runSequentially(cases, { execute, live, sleep, pauseMs = MIN_LIVE_GAP_MS, onStart, onResult, isCancelled } = {}) {
  const pause = Math.max(MIN_LIVE_GAP_MS, Number(pauseMs) || 0);
  let ran = 0;
  for (let index = 0; index < cases.length; index += 1) {
    if (isCancelled && isCancelled()) break;
    if (live && index > 0) await sleep(pause);
    if (isCancelled && isCancelled()) break;
    const testCase = cases[index];
    if (onStart) onStart(testCase);
    const result = await execute(testCase);
    ran += 1;
    if (onResult) onResult(testCase, result, evaluateCase(testCase, result));
  }
  return ran;
}

function normalizedRequest(body) {
  if (!isMapping(body)) return null;
  const out = {};
  for (const key of Object.keys(body).sort()) {
    const value = body[key];
    if (value === undefined || value === null || value === "") continue;
    out[key] = key === "language" ? languageList(languagesOf(String(value))) : value;
  }
  return JSON.stringify(out);
}

/** Offline mode: the documented case whose request equals the given body (language order ignored), or null. */
export function caseForRequest(cases, body) {
  const wanted = normalizedRequest(body);
  if (wanted === null) return null;
  return cases.find((testCase) => normalizedRequest(testCase.request) === wanted) || null;
}

// ---- V1.1: the private test pack (real cases and expectations; OPT-AI scripts/demo_hub/devhub_private/testcases_live.json) --------
// This repository is public, so the real expectations never live here: the user loads the pack from a local file into the page.
// It stays in the browser's memory -- never fetched, never uploaded, never stored -- and is used only for the live runs.

export const MAX_PACK_CHARS = 2_000_000;
export const MAX_PACK_CASES = 200;
const PACK_REQUEST_KEYS = new Set(["country_from", "country_to", "hs_code", "language", "as_of_date", "content_id"]);

/** Reads a test pack: { ok: true, pack: { asOf, cases } } or { ok: false, error } (a German message for the page). */
export function parseTestPack(text) {
  if (typeof text !== "string" || text.trim() === "") return { ok: false, error: "Die Datei ist leer." };
  if (text.length > MAX_PACK_CHARS) return { ok: false, error: "Die Datei ist zu groß für ein Testpaket." };
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei ist kein gültiges JSON." };
  }
  if (!isMapping(data) || !Array.isArray(data.cases)) return { ok: false, error: "Kein Testpaket: die Liste „cases“ fehlt." };
  const meta = isMapping(data._meta) ? data._meta : {};
  if (meta.synthetic === true) {
    return { ok: false, error: "Das ist das synthetische Testpaket dieser Seite – für echte Live-Tests das private Testpaket aus OPT-AI laden." };
  }
  if (data.cases.length === 0 || data.cases.length > MAX_PACK_CASES) return { ok: false, error: `Ein Testpaket hat 1 bis ${MAX_PACK_CASES} Fälle.` };
  const ids = new Set();
  const cases = [];
  for (const entry of data.cases) {
    if (!isMapping(entry) || typeof entry.id !== "string" || !/^[A-Za-z0-9_.:-]{1,80}$/.test(entry.id) || ids.has(entry.id)) {
      return { ok: false, error: "Ein Fall hat keine gültige, eindeutige id." };
    }
    if (typeof entry.title !== "string" || !isMapping(entry.request) || !isMapping(entry.expected) || typeof entry.expected.status !== "number") {
      return { ok: false, error: `Fall ${entry.id}: title, request oder expected fehlt.` };
    }
    for (const [key, value] of Object.entries(entry.request)) {
      if (!PACK_REQUEST_KEYS.has(key) || typeof value !== "string" || value.length > 200) {
        return { ok: false, error: `Fall ${entry.id}: Das Request-Feld „${key}“ ist nicht erlaubt.` };
      }
    }
    ids.add(entry.id);
    cases.push({ id: entry.id, title: entry.title.slice(0, 200), request: entry.request, expected: entry.expected });
  }
  return { ok: true, pack: { asOf: typeof meta.expected_as_of === "string" ? meta.expected_as_of : null, cases } };
}
