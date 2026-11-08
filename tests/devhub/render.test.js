// The views (docs/assets/devhub/render.js): escaping of everything the API returns, planned APIs, structure, tests.
// V1.1: every answer used here is SYNTHETIC (ZZ test data of data/recordings.js and fixtures.js).
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import RECORDINGS from "../../docs/assets/devhub/data/recordings.js";
import TESTCASES from "../../docs/assets/devhub/data/testcases.js";
import { BUSINESS_EXAMPLES } from "../../docs/assets/devhub/examples.js";
import { FIXTURES } from "../../docs/assets/devhub/fixtures.js";
import { APIS, apiById, PLANNED_LABEL } from "../../docs/assets/devhub/registry.js";
import {
  languagesToShow, renderApiSelector, renderBusinessExamples, renderEndpointSelector, renderRegression, renderRequestPanel,
  renderResponsePanel, renderStructure, renderTexts, ruleSetFocusOptions, temporalNotice, validityText,
} from "../../docs/assets/devhub/render.js";
import { describeRequest } from "../../docs/assets/devhub/request.js";
import { evaluateCase, resultFromRecording } from "../../docs/assets/devhub/testcases.js";
import { fixture, textLayer, withDefaults } from "./helpers.js";

const recording = (id) => RECORDINGS.recordings[id];
const bodyOf = (id) => recording(id).body;
const EVIL = "<img src=x onerror=alert(1)>\"'<script>alert(2)</script>";
const noMarkupFromData = (out) => {
  assert.doesNotMatch(out, /<img/i);
  assert.doesNotMatch(out, /<script/i);
  // attribute values are always double-quoted and escaped: without them, no tag may carry an on* attribute
  assert.doesNotMatch(out.replace(/="[^"]*"/g, '=""'), /<[^>]*\son[a-z]+=/i);
};

describe("API and endpoint selection", () => {
  test("Rules API active; Tariff, Savings and Origin Evidence API only as planned entries without any endpoint", () => {
    assert.deepStrictEqual(APIS.map((a) => [a.name, a.status]), [["Rules API", "active"], ["Tariff API", "planned"], ["Savings API", "planned"], ["Origin Evidence API", "planned"]]);
    const out = renderApiSelector(APIS, "rules").toString();
    const tiles = out.split("<button").slice(1);
    for (const tile of tiles.slice(1)) {
      assert.match(tile, /disabled aria-disabled="true"/);
      assert.ok(tile.includes(PLANNED_LABEL), "planned label");
      assert.equal(PLANNED_LABEL, "in Vorbereitung – noch keine Endpunkte");
      assert.doesNotMatch(tile, /https?:|\/v\d|GET|POST|data-action/);
    }
    for (const api of APIS.filter((a) => a.status === "planned")) {
      assert.deepStrictEqual(api.endpoints, []);
      assert.equal("origin" in api, false);
    }
  });

  test("the Rules API offers exactly GET /v1/agreements and POST /v1/rules", () => {
    const out = renderEndpointSelector(apiById("rules"), "rules").toString();
    assert.equal((out.match(/data-action="select-endpoint"/g) || []).length, 2);
    assert.match(out, /GET<\/span> \/v1\/agreements/);
    assert.match(out, /POST<\/span> \/v1\/rules/);
    assert.match(out, /data-endpoint="rules" aria-pressed="true"/);
  });
});

describe("request panel", () => {
  test("method, URL, body and the copy actions; the curl source holds no credential", () => {
    const out = renderRequestPanel(describeRequest("rules", { country_from: "XA", country_to: "XB", hs_code: "9908", language: "DE", as_of_date: "2026-11-08" })).toString();
    assert.match(out, /POST<\/span> <code class="url">https:\/\/rules\.opt-hub\.ai\/v1\/rules<\/code>/);
    assert.match(out, /data-copy="request-json">Request kopieren/);
    assert.match(out, /data-copy="request-curl">als curl kopieren/);
    assert.match(out, /&quot;hs_code&quot;: &quot;9908&quot;/);
    const curl = out.slice(out.indexOf('data-copy-source="request-curl"'));
    assert.doesNotMatch(curl.slice(0, curl.indexOf("</pre>")).split("\n").filter((l) => !l.includes("#")).join("\n"), /cookie|token|cf-access/i);
  });

  test("validation errors are listed (escaped)", () => {
    const out = renderRequestPanel(describeRequest("rules", {}), { errors: [{ field: "x", message: EVIL }] }).toString();
    noMarkupFromData(out);
    assert.match(out, /role="alert"/);
  });
});

describe("response panel", () => {
  test("success: status, duration, size, Meta, DecisionSummary, Trace incl. temporal fallback fields", () => {
    const result = { ...resultFromRecording(recording("ZZ_TEMPORAL")), durationMs: 812, attempts: 1 };
    const out = renderResponsePanel({ endpointId: "rules", request: describeRequest("rules", TESTCASES.cases[1].request), result, source: "live" }).toString();
    assert.match(out, /HTTP-Status<\/dt><dd class="ok">200/);
    assert.match(out, /812 ms/);
    assert.match(out, new RegExp(`${result.sizeBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} Bytes`));
    for (const field of ["api_version", "response_version", "generated_at", "rule_set_count", "rule_group_count", "rule_count",
      "selected_content_id", "requested_content_id", "selection_reason", "matched_hs", "hs_match_level", "fallback_used",
      "temporal_fallback", "specific_rule_sets_outside_date", "rules_available_from", "text_resolution.requested_languages"]) {
      assert.ok(out.includes(field), field);
    }
    assert.match(out, /Zeitlicher Rückfall/);
    assert.match(out, /JSON-Baum/);
    assert.match(out, /data-copy="response-json"/);
    assert.doesNotMatch(out, /SYNTHETISCHE ANTWORT/);
  });

  test("a synthetic answer is labelled as such, with its date", () => {
    const out = renderResponsePanel({ endpointId: "rules", request: null, result: resultFromRecording(recording("ZZ_EX_OR")), source: "recording", recordedAt: "2026-11-08" }).toString();
    assert.match(out, /<strong>SYNTHETISCHE ANTWORT<\/strong> – keine Live-Anfrage · ZZ-Testdaten im Format\s+der Rules API v1, erzeugt am 08\.11\.2026/);
    assert.match(out, /<dt>Quelle<\/dt><dd>Synthetisch<\/dd>/);
  });

  test("error answer: friendly text, code, message, details -- all escaped", () => {
    const body = { error: { code: "OPT-RULE-001", message: EVIL, details: { reason: "CONTENT_NOT_APPLICABLE", content_candidates: [EVIL] } } };
    const out = renderResponsePanel({ endpointId: "rules", request: null, result: { kind: "response", status: 404, body, sizeBytes: 10, durationMs: 5, attempts: 1 }, source: "live" }).toString();
    noMarkupFromData(out);
    assert.match(out, /keine passende Regel gefunden/);
    assert.match(out, /gilt zum Stichtag nicht für dieses Länderpaar/);
    assert.match(out, /details\.content_candidates/);
    assert.match(out, /OPT-RULE-001/);
  });

  test("OPT-DATA-001, a 403 without code, a network error and a non-JSON answer have their own texts", () => {
    const panel = (result) => renderResponsePanel({ endpointId: "rules", request: null, result, source: "live" }).toString();
    assert.match(panel({ kind: "response", status: 500, body: { error: { code: "OPT-DATA-001", message: "m", details: {} } } }), /nicht eindeutig lesbaren Wert/);
    assert.match(panel({ kind: "response", status: 403, body: {} }), /Keine gültige Anmeldung/);
    assert.match(panel({ kind: "network", message: "Failed to fetch", attempts: 1 }), /Verbindung fehlgeschlagen/);
    const notJson = panel({ kind: "response", status: 200, notJson: true, text: EVIL, body: null });
    assert.match(notJson, /kein JSON/);
    noMarkupFromData(notJson);
  });

  test("discovery answer (GET /v1/agreements): the agreements table", () => {
    const out = renderResponsePanel({ endpointId: "agreements", request: describeRequest("agreements", null), result: resultFromRecording(recording("__agreements__")), source: "recording" }).toString();
    assert.match(out, /3 Abkommen/);
    assert.match(out, /<code>ZZ_TEST01<\/code>/);
  });

  test("the five example answers render through the same panels, labelled BEISPIEL", () => {
    assert.deepStrictEqual(Object.keys(FIXTURES), ["single_ruleset", "multi_rulesets", "multi_ex", "error_400", "error_404"]);
    for (const [key, item] of Object.entries(FIXTURES)) {
      const out = renderResponsePanel({ endpointId: "rules", request: null, result: { kind: "response", status: item.kind === "result" ? 200 : item.statusCode, body: item.data }, source: "fixture", sourceLabel: item.label }).toString();
      assert.match(out, /<strong>BEISPIEL<\/strong>/, key);
      assert.match(item.label, /^ZZ-Beispiel/, key);
    }
  });
});

describe("technical structure", () => {
  test("every rule set with key, EX, validity, fingerprint, groups, rules with shape, expression and numbered alternatives", () => {
    const out = renderStructure(bodyOf("ZZ_NESTED"), { languages: ["DE", "EN", "FR"] }).toString();
    assert.equal((out.match(/<article class="ruleset-card/g) || []).length, 1);
    assert.match(out, /Regelsatz 1 von 1 <span class="muted">·<\/span> <code>9907\/1<\/code>/);
    assert.match(out, /zz-set-9907-1/);
    assert.match(out, /<code>\(G1\.R1 ∨ \(G2\.R1 ∧ G2\.R2\)\) ∧ G3\.R1<\/code>/);
    assert.match(out, /<code class="alt-key">G1\.R1\+G3\.R1<\/code>/);
    assert.match(out, /<code class="alt-key">G2\.R1\+G2\.R2\+G3\.R1<\/code>/);
    assert.match(out, /alt-or">ODER</);
    assert.match(out, /alt-and">UND</);
    for (const field of ["RuleNo", "RLogic", "RDefinition", "HsRange", "Roperator", "Rpercent", "Rtarget", "Rproof", "ProofAlt", "WeightR", "Rorcrit", "RuleFingerprint", "Form (shape)"]) {
      assert.ok(out.includes(`>${field}</th>`), field);
    }
    assert.match(out, /VALUE_LIMIT/);
    assert.match(out, /01\.01\.2020 – 31\.12\.9999 \(unbefristet\)/);
  });

  test("64 alternatives of a truncated structure are all listed, numbered, with the truncation note", () => {
    const synthetic = fixture("structure_synthetic.json").cases.find((c) => c.id === "S75_TRUNCATED");
    const out = renderStructure({ Agreement: { RuleSets: [withDefaults(synthetic.input)] } }, { languages: ["DE"] }).toString();
    assert.equal((out.match(/<li class="alt">/g) || []).length, 64);
    assert.equal((out.match(/alt-or">ODER</g) || []).length, 63);
    assert.match(out, /<span class="alt-no">64<\/span>/);
    assert.match(out, /Mehr als 64 vollständige Alternativen/);
  });

  test("texts in every requested language side by side; a missing language is marked, never filled", () => {
    const out = renderTexts([{ language: "DE", DescRg: "ZZ-TEST Text DE" }, { language: "FR", DescRg: "" }], "DescRg", ["DE", "EN", "FR"]).toString();
    assert.match(out, /text-grid cols-3/);
    assert.match(out, /lang="de"/);
    assert.equal((out.match(/is-missing/g) || []).length, 2);
    assert.match(out, /Kein Text in EN – fehlt in den Regeldaten/);
    assert.deepStrictEqual(languagesToShow(bodyOf("ZZ_EX_OR")), ["DE", "EN", "FR"]);
    assert.match(renderStructure(bodyOf("ZZ_EX_CANDIDATES"), { languages: ["DE", "EN", "FR"] }).toString(), /Kein Text in FR – fehlt in den Regeldaten/);
  });

  test("hostile values in rule texts and rule fields stay text", () => {
    const raw = withDefaults({ Hspos: EVIL, RuleSetDescr: [{ language: "DE", DescRset: EVIL }], RuleGroups: [{ RGroup: EVIL, RGroupLog: EVIL, SubGroupNo: "",
      RuleGroupDescr: [{ language: EVIL, DescRg: EVIL }], Rules: [{ RuleNo: EVIL, RLogic: "AND", RDefinition: EVIL, HsRange: EVIL, Roperator: EVIL, Rpercent: EVIL,
        Rtarget: EVIL, Rproof: EVIL, ProofAlt: EVIL, WeightR: EVIL, Rorcrit: EVIL, RuleFingerprint: EVIL }] }] });
    const out = renderStructure({ Agreement: { RuleSets: [raw] } }, { languages: ["DE"] }).toString();
    noMarkupFromData(out);
    assert.doesNotMatch(textLayer(out), /["'<>]/);
  });

  test("EX: badge, the confirmation toggle (display only) and its hidden marker", () => {
    const body = bodyOf("ZZ_EX_CANDIDATES");
    const off = renderStructure(body, { languages: ["DE"] }).toString();
    assert.equal((off.match(/data-action="ex-confirm"/g) || []).length, 2);
    assert.match(off, /EX bestätigt \(fachliche Anwendbarkeit vom Nutzer bestätigt\)/);
    assert.match(off, /<span class="pill pill-ok" data-ex-marker="0" hidden>EX bestätigt<\/span>/);
    const on = renderStructure(body, { languages: ["DE"], exConfirmed: new Set([0]) }).toString();
    assert.match(on, /<span class="pill pill-ok" data-ex-marker="0">EX bestätigt<\/span>/);
    assert.match(on, /data-index="0" checked/);
    assert.doesNotMatch(renderStructure(bodyOf("ZZ_MULTI"), { languages: ["DE"] }).toString(), /ex-confirm/);
  });

  test("temporal fallback: the EX note says the confirmation does not replace the validity", () => {
    const body = bodyOf("ZZ_TEMPORAL");
    assert.match(temporalNotice(body).toString(), /mögliche Kandidaten/);
    assert.match(renderStructure(body, { languages: ["DE"], exConfirmed: new Set([0]) }).toString(), /ersetzt die fehlende zeitliche Gültigkeit \(temporal_fallback\) nicht/);
    assert.equal(temporalNotice(bodyOf("ZZ_EX_OR")), null);
  });

  test("rule-set focus: one set in full, the others offered on an equal footing", () => {
    const body = bodyOf("ZZ_MULTI");
    assert.deepStrictEqual(ruleSetFocusOptions(body).map((o) => o.key), ["9904/1", "9904/2"]);
    const out = renderStructure(body, { languages: ["DE"], focusKey: "9904/2" }).toString();
    assert.equal((out.match(/<article class="ruleset-card/g) || []).length, 1);
    assert.match(out, /data-action="focus-ruleset" data-key="9904\/1"/);
    assert.match(out, /Regelsatz 2 von 2/);
  });

  test("a structure the reference cannot determine is said as such; rules keep their key and shape", () => {
    const edge = fixture("structure_edge_reference.json").cases.find((c) => c.id === "BRACKET_SINGLE_MEMBER_INNER_OR_FAILS");
    const out = renderStructure({ Agreement: { RuleSets: [withDefaults(edge.input)] } }, { languages: ["DE"] }).toString();
    assert.match(out, /Struktur nicht bestimmbar:<\/strong> Klammer OR-1/);
    assert.match(out, /<code>G1\.R2<\/code><\/th>/);
    assert.match(out, /VALUE_LIMIT/);
    assert.doesNotMatch(out, /Alternativen \(vollständig\)/);
  });

  test("validity text", () => {
    assert.equal(validityText("01.01.2021", "31.12.9999"), "01.01.2021 – 31.12.9999 (unbefristet)");
    assert.equal(validityText("01.01.2021", "31.12.2026"), "01.01.2021 – 31.12.2026");
    assert.equal(validityText("", ""), "keine Angabe");
  });
});

describe("test cases view", () => {
  test("business examples only fill the form, state no verdict and say they are synthetic", () => {
    const out = renderBusinessExamples(BUSINESS_EXAMPLES, "2026-11-08").toString();
    assert.equal((out.match(/data-action="apply-example"/g) || []).length, BUSINESS_EXAMPLES.length);
    assert.doesNotMatch(out, /PASS|FAIL|data-action="run/);
    assert.match(out, /synthetische ZZ-Testdaten/);
    assert.match(out, /href="\?rules_session=ready&amp;mode=offline&amp;tab=business">Offline-Modus<\/a>/);
    assert.match(out, /XA → XB · HS 9908 · Abkommen automatisch · Stichtag 08\.11\.2026/);
    assert.doesNotMatch(renderBusinessExamples(BUSINESS_EXAMPLES, "2026-11-08", { offline: true }).toString(), /<a href/);
  });

  test("level A (synthetic): the two levels, filter with counts, expected vs actual of a failed case", () => {
    const cases = TESTCASES.cases;
    const failing = evaluateCase(cases[0], { kind: "network", message: EVIL });
    const outcomes = new Map([[cases[0].id, { verdict: failing.verdict, evaluation: failing, result: { kind: "network", message: EVIL }, source: "recording" }]]);
    const out = renderRegression({ cases, outcomes, mode: "recording", filter: "all", running: false, offline: false, recordedAt: "2026-11-08", open: new Set([cases[0].id]), visible: cases }).toString();
    assert.match(out, /Zwei Testebenen/);
    assert.match(out, /ohne Testpaket gibt es kein Live-Urteil/);
    assert.match(out, /<code>npm test<\/code>/);
    assert.match(out, /<strong>SYNTHETISCH<\/strong> – keine Live-Anfrage · ZZ-Testdaten, erzeugt am 08\.11\.2026/);
    assert.match(out, /value="recording" data-action="test-mode" checked/);
    assert.match(out, />Alle \(14\)</);
    assert.match(out, />FAIL \(1\)</);
    assert.match(out, />nicht ausgeführt \(13\)</);
    assert.match(out, /verdict-fail">FAIL/);
    assert.match(out, /<details class="case-details" data-case="ZZ_EX_OR" open>/);
    assert.equal((out.match(/data-action="run-case"/g) || []).length, 14);
    noMarkupFromData(out);
    const offline = renderRegression({ cases, outcomes: new Map(), mode: "recording", filter: "all", running: false, offline: true, recordedAt: "2026-11-08", open: new Set(), visible: cases }).toString();
    assert.match(offline, /value="live" data-action="test-mode" disabled/);
    assert.match(offline, /Offline-Modus: nur Ebene A/);
  });

  test("level B without the private test pack: only the loader -- no case, no verdict", () => {
    const out = renderRegression({ cases: [], outcomes: new Map(), mode: "live", filter: "all", running: false, offline: false, recordedAt: "2026-11-08", open: new Set(), visible: [] }).toString();
    assert.match(out, /id="live-pack-file" accept="\.json,application\/json"/);
    assert.match(out, /nicht hochgeladen, nicht gespeichert/);
    assert.match(out, /data-action="run-all" disabled/);
    assert.equal((out.match(/data-action="run-case"/g) || []).length, 0);
    assert.doesNotMatch(out, /PASS|verdict-pass|filter-bar/);
    const error = renderRegression({ cases: [], outcomes: new Map(), mode: "live", filter: "all", running: false, offline: false, recordedAt: "2026-11-08", open: new Set(), visible: [], packError: EVIL }).toString();
    assert.match(error, /role="alert"/);
    noMarkupFromData(error);
  });

  test("level B with a loaded pack: its cases, the pack status (escaped), the remove action", () => {
    const cases = [{ id: "ZZ_PACK_1", title: EVIL, request: { country_from: "XA", country_to: "XB", hs_code: "9901", language: "DE", as_of_date: "2026-11-08" }, expected: { status: 200 } }];
    const out = renderRegression({ cases, outcomes: new Map(), mode: "live", filter: "all", running: false, offline: false, recordedAt: "2026-11-08", open: new Set(), visible: cases,
      pack: { name: EVIL, asOf: "2026-11-08", count: 1 } }).toString();
    assert.match(out, /Privates Testpaket geladen/);
    assert.match(out, /1 Fall · Stand 08\.11\.2026/);
    assert.match(out, /data-action="clear-pack"/);
    assert.equal((out.match(/data-action="run-case"/g) || []).length, 1);
    noMarkupFromData(out);
  });
});
