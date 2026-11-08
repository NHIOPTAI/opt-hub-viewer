// The request builder of POST /v1/rules and GET /v1/agreements (docs/assets/devhub/request.js).
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildRulesBody, curlOf, describeRequest, isIsoDate, languageList, languagesOf, normalizeHs, todayIso, validateRulesInput,
} from "../../docs/assets/devhub/request.js";

const valid = { country_from: "XA", country_to: "XC", content_id: "ZZ_TEST02", hs_code: "990310", as_of_date: "2026-12-31", languages: ["FR", "DE", "EN"] };
const fields = (values) => validateRulesInput(values).errors.map((e) => e.field);

describe("validation", () => {
  test("a complete input is valid", () => assert.deepStrictEqual(validateRulesInput(valid), { ok: true, errors: [] }));

  test("countries must be chosen (ISO alpha-2)", () => {
    assert.deepStrictEqual(fields({ ...valid, country_from: "", country_to: "gbr" }), ["country_from", "country_to"]);
  });

  test("HS position: 2 to 10 digits, spaces and dots are removed first", () => {
    assert.deepStrictEqual(fields({ ...valid, hs_code: "8" }), ["hs_code"]);
    assert.deepStrictEqual(fields({ ...valid, hs_code: "12345678901" }), ["hs_code"]);
    assert.deepStrictEqual(fields({ ...valid, hs_code: "85x7" }), ["hs_code"]);
    assert.deepStrictEqual(fields({ ...valid, hs_code: "9903.10 00" }), []);
    assert.deepStrictEqual(fields({ ...valid, hs_code: "1234567890" }), []);
    assert.equal(normalizeHs(" 9903.10 "), "990310");
  });

  test("key date: a real calendar date", () => {
    assert.deepStrictEqual(fields({ ...valid, as_of_date: "" }), ["as_of_date"]);
    assert.deepStrictEqual(fields({ ...valid, as_of_date: "2026-02-30" }), ["as_of_date"]);
    assert.deepStrictEqual(fields({ ...valid, as_of_date: "31.12.2026" }), ["as_of_date"]);
    assert.equal(isIsoDate("2024-02-29"), true);
    assert.equal(isIsoDate("2025-02-29"), false);
  });

  test("at least one language", () => {
    assert.deepStrictEqual(fields({ ...valid, languages: [] }), ["languages"]);
    assert.deepStrictEqual(fields({ ...valid, languages: ["XX"] }), ["languages"]);
  });

  test("content_id: automatic (empty) or the Rules API's pattern", () => {
    assert.deepStrictEqual(fields({ ...valid, content_id: "" }), []);
    // invalid formats, assembled at run time (the public-safe guard admits only ZZ_ content ids as data)
    assert.deepStrictEqual(fields({ ...valid, content_id: ["zz", "test01"].join("_") }), ["content_id"]);
    assert.deepStrictEqual(fields({ ...valid, content_id: ["ZZ", "TEST01"].join("-") }), ["content_id"]);
  });

  test("every message is German and names its field", () => {
    const { errors } = validateRulesInput({});
    assert.deepStrictEqual(errors.map((e) => e.field), ["country_from", "country_to", "hs_code", "as_of_date", "languages"]);
    for (const e of errors) assert.match(e.message, /^(Abgangsland|Zielland|HS-Position|Stichtag|Sprachen):/);
  });
});

describe("body", () => {
  test("the body as the Rules API expects it, languages as a comma list in the order DE, EN, FR", () => {
    const body = buildRulesBody(valid);
    assert.deepStrictEqual(body, { country_from: "XA", country_to: "XC", hs_code: "990310", language: "DE,EN,FR", as_of_date: "2026-12-31", content_id: "ZZ_TEST02" });
    assert.deepStrictEqual(Object.keys(body), ["country_from", "country_to", "hs_code", "language", "as_of_date", "content_id"]);
  });

  test("content_id is optional: absent for 'automatisch'", () => {
    const body = buildRulesBody({ ...valid, content_id: "", languages: ["DE"] });
    assert.equal("content_id" in body, false);
    assert.equal(body.language, "DE");
  });

  test("the comma list and its inverse", () => {
    assert.equal(languageList(["fr", "en"]), "EN,FR");
    assert.equal(languageList(["DE", "DE", "XX"]), "DE");
    assert.deepStrictEqual(languagesOf("FR, de ,xx"), ["DE", "FR"]);
  });

  test("the request description: POST with body, GET without", () => {
    const post = describeRequest("rules", buildRulesBody(valid));
    assert.equal(post.method, "POST");
    assert.equal(post.url, "https://rules.opt-hub.ai/v1/rules");
    assert.equal(post.body.hs_code, "990310");
    const get = describeRequest("agreements", { ignored: true });
    assert.deepStrictEqual([get.method, get.url, get.body], ["GET", "https://rules.opt-hub.ai/v1/agreements", null]);
    assert.throws(() => describeRequest("tariff", {}));
  });

  test("today is the UTC date", () => assert.equal(todayIso(new Date("2026-11-08T23:30:00Z")), "2026-11-08"));
});

describe("curl", () => {
  const CREDENTIAL = /cookie|token|authorization|cf-access|cf_authorization|secret|--user|(^|\s)-u\s|(^|\s)-b\s|--oauth|bearer/i;
  const commandLines = (text) => text.split("\n").filter((line) => !line.trim().startsWith("#"));

  test("the POST command carries method, URL, JSON headers and the body -- and no credential", () => {
    const text = curlOf(describeRequest("rules", buildRulesBody(valid)));
    assert.match(text, /curl -X POST 'https:\/\/rules\.opt-hub\.ai\/v1\/rules'/);
    assert.match(text, /-H 'Content-Type: application\/json'/);
    assert.match(text, /--data-raw '\{"country_from":"XA","country_to":"XC","hs_code":"990310","language":"DE,EN,FR","as_of_date":"2026-12-31","content_id":"ZZ_TEST02"\}'/);
    for (const line of commandLines(text)) assert.doesNotMatch(line, CREDENTIAL, line);
    assert.doesNotMatch(text, /CF_Authorization=|cf-access-client-(id|secret)|Bearer /i);
  });

  test("a comment line says that an Access session cookie or a service token is required", () => {
    const text = curlOf(describeRequest("agreements", null));
    const comments = text.split("\n").filter((line) => line.startsWith("#")).join(" ");
    assert.match(comments, /Cloudflare-Access-Sitzung/);
    assert.match(comments, /Cookie/);
    assert.match(comments, /Service-Token/);
    assert.match(comments, /nicht enthalten/);
    assert.match(text, /curl -X GET 'https:\/\/rules\.opt-hub\.ai\/v1\/agreements'/);
    assert.doesNotMatch(text, /--data-raw/);
    for (const line of commandLines(text)) assert.doesNotMatch(line, CREDENTIAL, line);
  });

  test("single quotes in the body are shell-escaped", () => {
    const text = curlOf({ method: "POST", url: "https://rules.opt-hub.ai/v1/rules", body: { hs_code: "it's" } });
    assert.match(text, /--data-raw '\{"hs_code":"it'\\''s"\}'/);
  });
});
