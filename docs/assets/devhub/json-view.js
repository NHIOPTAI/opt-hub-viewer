// OPT.AI Developer Hub -- a collapsible JSON tree as escaped HTML (pure, no DOM access).
//
// Keys and string values are shown in JSON notation (JSON.stringify) and then HTML-escaped: a value such as
// `<script>` or a quote can never become markup. Objects and arrays are native <details> elements (no script needed).

import { html } from "./html.js";

export const MAX_CHILDREN = 2000;

function primitiveHtml(value) {
  if (value === null) return html`<span class="jt-null">null</span>`;
  if (typeof value === "string") return html`<span class="jt-str">${JSON.stringify(value)}</span>`;
  if (typeof value === "number") return html`<span class="jt-num">${Number.isFinite(value) ? JSON.stringify(value) : "null"}</span>`;
  if (typeof value === "boolean") return html`<span class="jt-bool">${value ? "true" : "false"}</span>`;
  return html`<span class="jt-null">${JSON.stringify(value) === undefined ? "undefined" : JSON.stringify(value)}</span>`;
}

function keyHtml(key) {
  if (key === null) return null;
  return typeof key === "number" ? html`<span class="jt-index">${key}</span>: ` : html`<span class="jt-key">${JSON.stringify(key)}</span>: `;
}

function countLabel(value) {
  if (Array.isArray(value)) return value.length === 1 ? "1 Eintrag" : `${value.length} Einträge`;
  const n = Object.keys(value).length;
  return n === 1 ? "1 Feld" : `${n} Felder`;
}

function nodeHtml(key, value, depth, openDepth) {
  const isArray = Array.isArray(value);
  if (value === null || typeof value !== "object") {
    return html`<div class="jt-row">${keyHtml(key)}${primitiveHtml(value)}</div>`;
  }
  const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
  if (entries.length === 0) return html`<div class="jt-row">${keyHtml(key)}<span class="jt-brace">${open}${close}</span></div>`;
  const shown = entries.slice(0, MAX_CHILDREN);
  const children = shown.map(([childKey, child]) => nodeHtml(childKey, child, depth + 1, openDepth));
  const rest = entries.length - shown.length;
  return html`<details class="jt-node"${depth < openDepth ? html` open` : null}>
    <summary>${keyHtml(key)}<span class="jt-brace">${open}</span> <span class="jt-count">${countLabel(value)}</span></summary>
    <div class="jt-children">${children}${rest > 0 ? html`<div class="jt-row jt-more">… ${rest} weitere (siehe Rohdaten)</div>` : null}</div>
    <span class="jt-brace">${close}</span>
  </details>`;
}

/** The JSON tree of a value; levels below `openDepth` start expanded. */
export function jsonTreeHtml(value, { openDepth = 1 } = {}) {
  return html`<div class="jt">${nodeHtml(null, value, 0, openDepth)}</div>`;
}
