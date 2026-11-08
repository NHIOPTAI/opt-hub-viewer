// The technical regression checks (docs/assets/devhub/testcases.js) and their SYNTHETIC data (V1.1: testcases / recordings are
// ZZ test data computed by the OPT.AI guide; the real cases form the private test pack of OPT-AI and never come here).
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import RECORDINGS from "../../docs/assets/devhub/data/recordings.js";
import TESTCASES from "../../docs/assets/devhub/data/testcases.js";
import { summarizeRuleSet } from "../../docs/assets/devhub/rules-structure.js";
import {
  actualOf, caseForRequest, countOutcomes, evaluateCase, filterCases, MAX_PACK_CASES, parseTestPack, resultFromRecording, runSequentially,
} from "../../docs/assets/devhub/testcases.js";

const CASES = TESTCASES.cases;
const clone = (value) => JSON.parse(JSON.stringify(value));
const recordingOf = (id) => RECORDINGS.recordings[id];

describe("the synthetic cases and their answers", () => {
  test("14 cases, each with an answer, plus the discovery answer of the offline mode", () => {
    assert.equal(CASES.length, 14);
    assert.equal(new Set(CASES.map((c) => c.id)).size, 14);
    for (const testCase of CASES) assert.ok(recordingOf(testCase.id), testCase.id);
    assert.equal(recordingOf("__agreements__").status, 200);
    assert.ok(Array.isArray(recordingOf("__agreements__").body.agreements));
  });

  test("everything is synthetic: marked so, ZZ ids, zz- fingerprints, ZZ-TEST texts only", () => {
    assert.equal(TESTCASES._meta.synthetic, true);
    assert.equal(RECORDINGS._meta.synthetic, true);
    for (const testCase of CASES) assert.match(testCase.id, /^ZZ_/);
    let texts = 0;
    const walk = (value, key) => {
      if (Array.isArray(value)) value.forEach((item) => walk(item, key));
      else if (value && typeof value === "object") for (const [k, child] of Object.entries(value)) walk(child, k);
      else if (typeof value === "string") {
        if (["DescRset", "DescRg", "DescAg"].includes(key)) {
          assert.match(value, /^ZZ-TEST /, key);
          texts += 1;
        }
        if (["ContentId", "content_id", "selected_content_id", "requested_content_id"].includes(key)) assert.match(value, /^ZZ_/, key);
        if (/fingerprint/i.test(key)) assert.match(value, /^zz-/, key);
      }
    };
    walk(RECORDINGS);
    walk(TESTCASES);
    assert.ok(texts > 50, `only ${texts} texts found`);
  });

  for (const testCase of CASES) {
    test(`${testCase.id}: the synthetic answer PASSes its expectation`, () => {
      const evaluation = evaluateCase(testCase, resultFromRecording(recordingOf(testCase.id)));
      assert.deepStrictEqual(evaluation.diffs, []);
      assert.equal(evaluation.verdict, "PASS");
      assert.ok(evaluation.checks.length >= 2);
    });
  }

  for (const testCase of CASES.filter((c) => Array.isArray(c.expected.rule_sets))) {
    test(`${testCase.id}: every expected structure (the guide's) equals what rules-structure.js computes from the answer`, () => {
      const ruleSets = recordingOf(testCase.id).body.Agreement.RuleSets;
      assert.equal(ruleSets.length, testCase.expected.rule_sets.length);
      testCase.expected.rule_sets.forEach((expected, index) => {
        const summary = summarizeRuleSet(ruleSets[index]);
        assert.deepStrictEqual({ ...summary, alternatives: [...summary.alternatives].sort() },
          { ...expected, alternatives: [...expected.alternatives].sort() }, expected.key);
      });
    });
  }
});

describe("expected vs actual", () => {
  const multi = CASES.find((c) => c.id === "ZZ_MULTI");
  const multiRecording = recordingOf(multi.id);

  test("a changed fingerprint and a changed shape FAIL with exactly those fields", () => {
    const body = clone(multiRecording.body);
    body.Agreement.RuleSets[1].RuleSetFingerprint = "zz-changed";
    body.Agreement.RuleSets[0].RuleGroups[0].Rules[0].Rpercent = "";
    const evaluation = evaluateCase(multi, { kind: "response", status: 200, body });
    assert.equal(evaluation.verdict, "FAIL");
    assert.deepStrictEqual(evaluation.diffs.map((d) => d.field), [
      "Regelsatz 9904/1 · shape G1.R1",
      "Regelsatz 9904/2 · fingerprint",
    ]);
    const fingerprint = evaluation.diffs.find((d) => d.field.endsWith("fingerprint"));
    assert.equal(fingerprint.actual, "zz-changed");
    assert.equal(fingerprint.expected, multi.expected.rule_sets[1].fingerprint);
  });

  test("alternatives are compared as a set: another order still PASSes, a missing one FAILs with its key", () => {
    const testCase = clone(CASES.find((c) => c.id === "ZZ_EX_OR"));
    testCase.expected.rule_sets[0].alternatives.reverse();
    assert.equal(evaluateCase(testCase, resultFromRecording(recordingOf(testCase.id))).verdict, "PASS");
    const body = clone(recordingOf(testCase.id).body);
    body.Agreement.RuleSets[0].RuleGroups[0].Rules.pop();
    const evaluation = evaluateCase(testCase, { kind: "response", status: 200, body });
    const alternatives = evaluation.diffs.find((d) => d.field.includes("alternatives"));
    assert.match(alternatives.detail, /fehlt: G1\.R2/);
    assert.ok(evaluation.diffs.some((d) => d.field.endsWith("expression_text")));
    assert.ok(evaluation.diffs.some((d) => d.field.endsWith("rules")));
  });

  test("another rule-set key, content, HS resolution and response version are named", () => {
    const testCase = CASES.find((c) => c.id === "ZZ_EX_OR");
    const body = clone(recordingOf(testCase.id).body);
    body.Agreement.ContentId = "ZZ_OTHER01";
    body.Agreement.RuleSets[0].Hsposindx = "2";
    body.Trace.hs_resolution.temporal_fallback = true;
    body.Meta.response_version = "v1.3";
    const fields = evaluateCase(testCase, { kind: "response", status: 200, body }).diffs.map((d) => d.field);
    assert.deepStrictEqual(fields, ["Agreement.ContentId", "Trace.hs_resolution.temporal_fallback", "Regelsätze (Schlüssel)", "Meta.response_version"]);
  });

  test("error cases: the expected status and code PASS, another code FAILs", () => {
    const testCase = CASES.find((c) => c.id === "ZZ_ERR_MISSING_HS");
    const ok = evaluateCase(testCase, resultFromRecording(recordingOf(testCase.id)));
    assert.deepStrictEqual(ok.checks.map((c) => c.field), ["status", "error.code", "error.details.reason"]);
    assert.equal(ok.verdict, "PASS");
    const wrong = evaluateCase(testCase, { kind: "response", status: 400, body: { error: { code: "OPT-SYS-001", message: "x", details: { reason: "OTHER" } } } });
    assert.deepStrictEqual(wrong.diffs.map((d) => d.field), ["error.code", "error.details.reason"]);
  });

  test("a different status FAILs with the status (and the error code the API sent)", () => {
    const testCase = CASES.find((c) => c.id === "ZZ_AUTO");
    const evaluation = evaluateCase(testCase, { kind: "response", status: 404, body: { error: { code: "OPT-RULE-001", message: "No matching rule found" } } });
    assert.equal(evaluation.verdict, "FAIL");
    assert.deepStrictEqual(evaluation.diffs.map((d) => [d.field, d.expected, d.actual]), [["status", 200, 404], ["error.code", null, "OPT-RULE-001"]]);
    const expectedError = CASES.find((c) => c.id === "ZZ_ERR_NO_RELATION");
    const got200 = evaluateCase(expectedError, resultFromRecording(recordingOf("ZZ_AUTO")));
    assert.deepStrictEqual(got200.diffs.map((d) => d.field), ["status"]);
  });

  test("no answer (network) FAILs with the reason", () => {
    const evaluation = evaluateCase(CASES[0], { kind: "network", message: "Failed to fetch" });
    assert.equal(evaluation.verdict, "FAIL");
    assert.match(evaluation.diffs[0].detail, /Failed to fetch/);
    assert.deepStrictEqual(actualOf({ kind: "network", message: "x" }), { status: null, network: "x" });
  });

  test("a structure the reference cannot determine FAILs instead of throwing", () => {
    const body = clone(multiRecording.body);
    const group = body.Agreement.RuleSets[0].RuleGroups[0];
    group.SubGroupNo = "OR-1";
    group.Rules = [{ ...group.Rules[0], RLogic: "OR" }, { ...group.Rules[0], RuleNo: "2", RLogic: "OR" }];
    const evaluation = evaluateCase(multi, { kind: "response", status: 200, body });
    assert.equal(evaluation.verdict, "FAIL");
    assert.ok(evaluation.diffs.some((d) => d.field === "Regelsatz 9904/1 · Struktur"));
  });
});

describe("the private test pack (level B): read from a local file, strictly", () => {
  const packOf = (cases, meta = { expected_as_of: "2026-11-08" }) => JSON.stringify({ _meta: meta, cases });
  const valid = { id: "ZZ_LIVE_1", title: "ZZ-Fall", request: { country_from: "XA", country_to: "XB", hs_code: "9901", language: "DE", as_of_date: "2026-11-08" }, expected: { status: 200 } };

  test("a valid pack: its cases and its date", () => {
    const parsed = parseTestPack(packOf([valid]));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.pack.asOf, "2026-11-08");
    assert.deepStrictEqual(parsed.pack.cases.map((c) => c.id), ["ZZ_LIVE_1"]);
  });

  test("refused: not JSON, no cases, the synthetic set, empty or too many cases, duplicate or bad ids, missing parts", () => {
    assert.match(parseTestPack("").error, /leer/);
    assert.match(parseTestPack("{").error, /kein gültiges JSON/);
    assert.match(parseTestPack("{}").error, /cases/);
    assert.match(parseTestPack(JSON.stringify(TESTCASES)).error, /synthetische Testpaket/);
    assert.match(parseTestPack(packOf([])).error, /1 bis/);
    assert.match(parseTestPack(packOf(Array.from({ length: MAX_PACK_CASES + 1 }, (_, i) => ({ ...valid, id: `ZZ_${i}` })))).error, /1 bis/);
    assert.match(parseTestPack(packOf([valid, valid])).error, /eindeutige id/);
    assert.match(parseTestPack(packOf([{ ...valid, id: "<x>" }])).error, /eindeutige id/);
    assert.match(parseTestPack(packOf([{ ...valid, expected: {} }])).error, /expected fehlt/);
  });

  test("refused: request fields the page would never send", () => {
    assert.match(parseTestPack(packOf([{ ...valid, request: { ...valid.request, url: "https://example.invalid" } }])).error, /„url“ ist nicht erlaubt/);
    assert.match(parseTestPack(packOf([{ ...valid, request: { ...valid.request, hs_code: 9901 } }])).error, /„hs_code“ ist nicht erlaubt/);
  });
});

describe("filter, counts and the sequential runner", () => {
  test("filter: all / PASS / FAIL / not run", () => {
    const outcomes = new Map([[CASES[0].id, { verdict: "PASS" }], [CASES[1].id, { verdict: "FAIL" }], [CASES[2].id, { running: true }]]);
    assert.equal(filterCases(CASES, outcomes, "all").length, 14);
    assert.deepStrictEqual(filterCases(CASES, outcomes, "PASS").map((c) => c.id), [CASES[0].id]);
    assert.deepStrictEqual(filterCases(CASES, outcomes, "FAIL").map((c) => c.id), [CASES[1].id]);
    assert.equal(filterCases(CASES, outcomes, "notrun").length, 12);
    assert.deepStrictEqual(countOutcomes(CASES, outcomes), { total: 14, PASS: 1, FAIL: 1, notrun: 12 });
  });

  test("live: one after another, at least 600 ms between two requests", async () => {
    const events = [];
    let inFlight = 0;
    const execute = async (testCase) => {
      inFlight += 1;
      assert.equal(inFlight, 1, "never two requests at once");
      events.push(`run ${testCase.id}`);
      await new Promise((resolve) => setImmediate(resolve));
      inFlight -= 1;
      return resultFromRecording(recordingOf(testCase.id));
    };
    const sleep = async (ms) => { events.push(`pause ${ms}`); };
    const verdicts = [];
    const ran = await runSequentially(CASES.slice(0, 3), { execute, live: true, sleep, pauseMs: 100, onResult: (c, r, e) => verdicts.push(e.verdict) });
    assert.equal(ran, 3);
    assert.deepStrictEqual(events, [`run ${CASES[0].id}`, "pause 600", `run ${CASES[1].id}`, "pause 600", `run ${CASES[2].id}`]);
    assert.deepStrictEqual(verdicts, ["PASS", "PASS", "PASS"]);
  });

  test("synthetic runs: no pause; a cancel stops before the next case", async () => {
    const pauses = [];
    let cancel = false;
    const ran = await runSequentially(CASES, {
      execute: async (testCase) => { if (testCase.id === CASES[1].id) cancel = true; return resultFromRecording(recordingOf(testCase.id)); },
      live: false, sleep: async (ms) => pauses.push(ms), isCancelled: () => cancel,
    });
    assert.equal(ran, 2);
    assert.deepStrictEqual(pauses, []);
  });

  test("offline: the synthetic case of a request (language order and key order ignored)", () => {
    const testCase = CASES.find((c) => c.id === "ZZ_STATE_2027");
    const body = { language: "FR,EN,DE", content_id: "ZZ_TEST02", hs_code: "990310", country_to: "XC", country_from: "XA", as_of_date: "2027-01-01" };
    assert.equal(caseForRequest(CASES, body).id, testCase.id);
    assert.equal(caseForRequest(CASES, { ...body, as_of_date: "2027-01-02" }), null);
    assert.equal(caseForRequest(CASES, null), null);
  });
});
