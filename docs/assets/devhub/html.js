// OPT.AI Developer Hub -- HTML helpers (pure, no DOM access).
//
// Every dynamic value that ends up in the page is rendered through `html`: an interpolated value is escaped
// (& < > " ') unless it is itself the result of `html` (SafeHtml). Rule texts, error messages and JSON come from the
// API, so nothing returned by it is ever inserted unescaped. All attribute values in the templates are double-quoted.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Markup produced by `html` -- the only kind of value that is inserted without escaping. */
export class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

function renderValue(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(renderValue).join("");
  if (value === null || value === undefined || value === false) return "";
  return escapeHtml(value);
}

/** Tagged template: `html\`<b>${text}</b>\`` -- interpolations are escaped, arrays are joined, null/undefined/false vanish. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) out += renderValue(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

/** Joins SafeHtml parts with a separator (itself SafeHtml or escaped text). */
export function joinHtml(parts, separator) {
  const sep = renderValue(separator);
  return new SafeHtml(parts.map(renderValue).join(sep));
}
