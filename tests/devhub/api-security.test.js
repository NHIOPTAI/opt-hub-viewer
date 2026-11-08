// The live calls (docs/assets/devhub/api.js, registry.js) and static security checks of the page and its modules.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { callApi, createLiveGate, fetchOptionsOf, RETRY_DELAYS_MS, utf8Length } from "../../docs/assets/devhub/api.js";
import { ENDPOINTS, isAllowedCall } from "../../docs/assets/devhub/registry.js";
import { DEVHUB_DIR, repoFile } from "./helpers.js";

const RULES = ENDPOINTS.rules;
const AGREEMENTS = ENDPOINTS.agreements;

function fakeFetch(answers) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const next = answers[Math.min(calls.length - 1, answers.length - 1)];
    if (next instanceof Error) throw next;
    return { status: next.status, text: async () => next.text };
  };
  return { fetchImpl, calls };
}

describe("registry: exactly two read-only live calls", () => {
  test("GET /v1/agreements and POST /v1/rules on rules.opt-hub.ai, nothing else", () => {
    assert.deepStrictEqual(Object.values(ENDPOINTS).map((e) => `${e.method} ${e.url}`), [
      "GET https://rules.opt-hub.ai/v1/agreements",
      "POST https://rules.opt-hub.ai/v1/rules",
    ]);
    assert.equal(isAllowedCall("GET", "https://rules.opt-hub.ai/v1/agreements"), true);
    assert.equal(isAllowedCall("POST", "https://rules.opt-hub.ai/v1/rules"), true);
    assert.equal(isAllowedCall("GET", "https://rules.opt-hub.ai/v1/rules"), false);
    assert.equal(isAllowedCall("POST", "https://rules.opt-hub.ai/v1/agreements"), false);
    assert.equal(isAllowedCall("POST", "https://rules.opt-hub.ai/v1/rules?x=1"), false);
    assert.equal(isAllowedCall("GET", "https://example.invalid/v1/agreements"), false);
  });
});

describe("HTTP client", () => {
  test("credentials: include, CORS, no cache, JSON headers -- and no token or cookie header", () => {
    const options = fetchOptionsOf("POST", { a: 1 });
    assert.deepStrictEqual(options, {
      method: "POST", mode: "cors", cache: "no-store", credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" }, body: "{\"a\":1}",
    });
    assert.equal("body" in fetchOptionsOf("GET", { a: 1 }), false);
  });

  test("a call outside the registry is refused before any fetch", async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 200, text: "{}" }]);
    await assert.rejects(callApi({ method: "GET", url: "https://example.invalid/x", fetchImpl }), /Nicht erlaubter Aufruf/);
    await assert.rejects(callApi({ method: "DELETE", url: RULES.url, fetchImpl }), /Nicht erlaubter Aufruf/);
    assert.equal(calls.length, 0);
  });

  test("success: status, parsed body, UTF-8 size, duration, one attempt", async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 200, text: "{\"ä\":1}" }]);
    let t = 100;
    const result = await callApi({ method: RULES.method, url: RULES.url, body: { hs_code: "9908" }, fetchImpl, now: () => (t += 25) });
    assert.deepStrictEqual(result, { kind: "response", status: 200, body: { "ä": 1 }, text: "{\"ä\":1}", notJson: false, sizeBytes: 8, durationMs: 25, attempts: 1 });
    assert.equal(calls[0].options.credentials, "include");
    assert.equal(calls[0].options.body, "{\"hs_code\":\"9908\"}");
    assert.equal(utf8Length("ä"), 2);
  });

  test("retry ONLY on 5xx: 503 then 200 = two attempts with the documented delay", async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 503, text: "{}" }, { status: 200, text: "{\"ok\":true}" }]);
    const slept = [];
    const result = await callApi({ method: AGREEMENTS.method, url: AGREEMENTS.url, fetchImpl, sleep: async (ms) => slept.push(ms) });
    assert.equal(result.status, 200);
    assert.equal(result.attempts, 2);
    assert.equal(calls.length, 2);
    assert.deepStrictEqual(slept, [RETRY_DELAYS_MS[0]]);
  });

  test("a persistent 5xx: three attempts at most, the last answer is returned", async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 500, text: "{\"error\":{\"code\":\"OPT-SYS-001\"}}" }]);
    const slept = [];
    const result = await callApi({ method: RULES.method, url: RULES.url, body: {}, fetchImpl, sleep: async (ms) => slept.push(ms) });
    assert.equal(calls.length, 3);
    assert.deepStrictEqual(slept, [1200, 2000]);
    assert.deepStrictEqual([result.status, result.attempts, result.body.error.code], [500, 3, "OPT-SYS-001"]);
  });

  test("no retry on 4xx and none on a network failure", async () => {
    for (const status of [400, 403, 404]) {
      const { fetchImpl, calls } = fakeFetch([{ status, text: "{}" }, { status: 200, text: "{}" }]);
      const result = await callApi({ method: RULES.method, url: RULES.url, body: {}, fetchImpl, sleep: async () => assert.fail("no pause") });
      assert.deepStrictEqual([result.status, result.attempts, calls.length], [status, 1, 1]);
    }
    const { fetchImpl, calls } = fakeFetch([new TypeError("Failed to fetch"), { status: 200, text: "{}" }]);
    const result = await callApi({ method: RULES.method, url: RULES.url, body: {}, fetchImpl, sleep: async () => assert.fail("no pause") });
    assert.deepStrictEqual([result.kind, result.message, result.attempts, calls.length], ["network", "Failed to fetch", 1, 1]);
  });

  test("a body that is no JSON is reported as such", async () => {
    const { fetchImpl } = fakeFetch([{ status: 200, text: "<html>login</html>" }]);
    const result = await callApi({ method: AGREEMENTS.method, url: AGREEMENTS.url, fetchImpl });
    assert.deepStrictEqual([result.kind, result.notJson, result.body, result.text], ["response", true, null, "<html>login</html>"]);
  });

  test("live gate: at least 600 ms between two live requests", async () => {
    let clock = 0;
    const waits = [];
    const gate = createLiveGate({ now: () => clock, sleep: async (ms) => { waits.push(ms); clock += ms; } });
    assert.equal(await gate.before(), 0);
    clock = 1000;
    gate.after();
    clock = 1250;
    assert.equal(await gate.before(), 350);
    gate.after();
    clock += 700;
    assert.equal(await gate.before(), 0);
    assert.deepStrictEqual(waits, [350]);
  });
});

describe("static security checks of the page and its modules", () => {
  const moduleFiles = readdirSync(DEVHUB_DIR, { recursive: true }).map(String).filter((f) => f.endsWith(".js"));
  const sources = Object.fromEntries(moduleFiles.map((file) => [file.replace(/\\/g, "/"), repoFile("docs", "assets", "devhub", file)]));
  const page = repoFile("docs", "rules-demo.html");

  test("the Access session bootstrap stays first in <head>, unchanged", () => {
    const head = page.slice(0, page.indexOf("</head>"));
    const firstScript = head.indexOf("<script>");
    assert.ok(firstScript > 0 && firstScript < head.indexOf("<link"), "bootstrap before the stylesheet and the module");
    assert.ok(head.includes('if (params.get("rules_session") !== "ready") {\n        window.location.replace("https://rules.opt-hub.ai/session-bootstrap");'));
    assert.match(head, /<script type="module" src="assets\/devhub\/app\.js"><\/script>/);
  });

  test("no external script, stylesheet, font, CDN or analytics", () => {
    for (const match of page.matchAll(/<(script|link|img|iframe)\b[^>]*\b(src|href)="([^"]*)"/g)) {
      assert.doesNotMatch(match[3], /^(https?:)?\/\//, `${match[1]} ${match[3]}`);
    }
    const css = repoFile("docs", "assets", "devhub", "devhub.css");
    assert.doesNotMatch(css, /@import|@font-face|url\(/i, "devhub.css loads nothing");
    assert.doesNotMatch(page + Object.values(sources).join("\n"), /googletagmanager|google-analytics|gtag\(|plausible|matomo|segment\.com|fonts\.googleapis|cdn\.|unpkg|jsdelivr|@import/i);
  });

  test("the only URLs the modules know are the Rules API's own", () => {
    for (const [file, text] of Object.entries(sources)) {
      for (const match of text.matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) {
        assert.match(match[0], /^https:\/\/rules\.opt-hub\.ai(\/v1\/agreements|\/v1\/rules|\/session-bootstrap)?$/, `${file}: ${match[0]}`);
      }
    }
    for (const match of page.matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) {
      assert.match(match[0], /^https:\/\/(rules\.opt-hub\.ai(\/v1\/agreements|\/v1\/rules|\/session-bootstrap)?|opt-hub\.ai)$/, match[0]);
    }
  });

  test("fetch happens in api.js only, with credentials: include; no storage, cookie access, eval or inline handlers", () => {
    for (const [file, text] of Object.entries(sources)) {
      const code = text.replace(/^\s*\/\/.*$/gm, "");
      if (file !== "api.js") assert.doesNotMatch(code, /\bfetch\s*\(/, file);
      assert.doesNotMatch(code, /localStorage|sessionStorage|indexedDB|document\.cookie|\beval\s*\(|new Function|XMLHttpRequest|sendBeacon|WebSocket/, file);
      assert.doesNotMatch(code, /\son[a-z]+=["'`]/, `${file}: inline event handler`);
    }
    assert.match(sources["api.js"], /credentials: "include"/);
    assert.doesNotMatch(page, /\son[a-z]+="/, "rules-demo.html: inline event handler");
  });

  test("no credential in the frontend: no token, secret, API key or Authorization header", () => {
    for (const [file, text] of Object.entries(sources)) {
      assert.doesNotMatch(text, /Authorization:|Bearer\s|cf-access-client-(id|secret)|CF_Authorization=|api[_-]?key\s*[:=]/i, file);
    }
  });
});
