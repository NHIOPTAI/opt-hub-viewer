// OPT.AI Developer Hub -- the HTTP client of the two live Rules API calls (no DOM access; fetch is injectable).
//
// Exactly like the page always called the Rules API: `credentials: "include"` (the browser sends the person's
// Cloudflare Access session cookie for rules.opt-hub.ai), `mode: "cors"`, `cache: "no-store"`, JSON headers. No token,
// no secret, no proxy. A retry happens ONLY on a 5xx answer (transient server error); a 4xx is the API's final answer,
// a network failure is reported at once.

import { isAllowedCall } from "./registry.js";

export const RETRY_DELAYS_MS = Object.freeze([1200, 2000]);
export const MIN_LIVE_GAP_MS = 600;

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const defaultNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function utf8Length(text) {
  return new TextEncoder().encode(String(text)).length;
}

/** The fetch options of a live call (exported for the tests: the credentials mode is part of the contract). */
export function fetchOptionsOf(method, body) {
  const options = {
    method,
    mode: "cors",
    cache: "no-store",
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  };
  if (method === "POST") options.body = JSON.stringify(body);
  return options;
}

/**
 * One live call. Resolves (never rejects for HTTP or network problems) to
 *   { kind: "response", status, body, text, notJson, sizeBytes, durationMs, attempts }   or
 *   { kind: "network", message, durationMs, attempts }.
 */
export async function callApi({ method, url, body = null, fetchImpl, sleep = defaultSleep, now = defaultNow, delays = RETRY_DELAYS_MS }) {
  if (!isAllowedCall(method, url)) throw new Error(`Nicht erlaubter Aufruf: ${method} ${url}`);
  const doFetch = fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  if (!doFetch) throw new Error("fetch ist nicht verfügbar");
  const started = now();
  const maxAttempts = delays.length + 1;
  for (let attempt = 1; ; attempt += 1) {
    let response;
    let text;
    try {
      response = await doFetch(url, fetchOptionsOf(method, body));
      text = await response.text();
    } catch (error) {
      return {
        kind: "network",
        message: error && error.message ? String(error.message) : String(error),
        durationMs: Math.round(now() - started),
        attempts: attempt,
      };
    }
    if (response.status >= 500 && attempt < maxAttempts) {
      await sleep(delays[attempt - 1]);
      continue;
    }
    let parsed = null;
    let notJson = false;
    try {
      parsed = JSON.parse(text);
    } catch {
      notJson = true;
    }
    return {
      kind: "response",
      status: response.status,
      body: parsed,
      text,
      notJson,
      sizeBytes: utf8Length(text),
      durationMs: Math.round(now() - started),
      attempts: attempt,
    };
  }
}

/** At least `minGapMs` between the end of one live request and the start of the next (all live calls of the page). */
export function createLiveGate({ minGapMs = MIN_LIVE_GAP_MS, sleep = defaultSleep, now = defaultNow } = {}) {
  let lastEnd = null;
  return {
    async before() {
      if (lastEnd === null) return 0;
      const wait = Math.max(0, minGapMs - (now() - lastEnd));
      if (wait > 0) await sleep(wait);
      return wait;
    },
    after() {
      lastEnd = now();
    },
  };
}
