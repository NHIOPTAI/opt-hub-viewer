// Escaping: the JSON tree (docs/assets/devhub/json-view.js) and the html helper (docs/assets/devhub/html.js).
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { escapeHtml, html, joinHtml, SafeHtml } from "../../docs/assets/devhub/html.js";
import { jsonTreeHtml } from "../../docs/assets/devhub/json-view.js";
import { textLayer } from "./helpers.js";

const HOSTILE = {
  "<script>alert('k')</script>": "<script>alert(\"v\")</script>",
  quote: "\" onmouseover=\"alert(1)",
  single: "' onfocus='alert(2)",
  amp: "&lt;already&gt; & more",
  img: "<img src=x onerror=alert(3)>",
  nested: [{ "a\"b": ["</details><script>x()</script>", null, true, 12.5] }],
};

describe("JSON tree", () => {
  const out = jsonTreeHtml(HOSTILE, { openDepth: 5 }).toString();

  test("no markup from the data: no <script>, no <img>, no closing tag of the tree from a value", () => {
    assert.doesNotMatch(out, /<script/i);
    assert.doesNotMatch(out, /<img/i);
    assert.equal((out.match(/<\/details>/g) || []).length, (out.match(/<details/g) || []).length);
  });

  test("quotes never unescaped: the text layer holds no raw quote, < or >", () => {
    const text = textLayer(out);
    assert.doesNotMatch(text, /["'<>]/);
    assert.match(text, /&lt;script&gt;alert\(&#39;k&#39;\)&lt;\/script&gt;/);
    assert.match(text, /&quot;\\&quot; onmouseover=\\&quot;alert\(1\)&quot;/);
    assert.match(text, /&amp;lt;already&amp;gt; &amp; more/);
  });

  test("attributes stay ours: every attribute value in the output is one of the tree's own", () => {
    const attributes = [...out.matchAll(/\s([a-z-]+)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
    for (const attribute of attributes) assert.match(attribute, /^class=jt[a-z-]*( jt[a-z-]*)*$/, attribute);
  });

  test("structure: objects and arrays are details, counts are shown, levels below openDepth start open", () => {
    const tree = jsonTreeHtml({ a: { b: [1, 2] }, e: {}, f: [] }, { openDepth: 1 }).toString();
    assert.equal((tree.match(/<details class="jt-node" open>/g) || []).length, 1);
    assert.equal((tree.match(/<details class="jt-node">/g) || []).length, 2);
    assert.match(tree, /3 Felder/);
    assert.match(tree, /2 Einträge/);
    assert.match(tree, /\{\}/);
    assert.match(tree, /\[\]/);
  });

  test("primitives at the top level", () => {
    assert.match(jsonTreeHtml("<b>").toString(), /&quot;&lt;b&gt;&quot;/);
    assert.match(jsonTreeHtml(null).toString(), /jt-null">null/);
  });
});

describe("html helper", () => {
  test("escapeHtml escapes & < > \" '", () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
    assert.equal(escapeHtml(null), "");
  });

  test("interpolations are escaped, SafeHtml and arrays of it are kept, null/false vanish", () => {
    const inner = html`<i>${"<x>"}</i>`;
    const out = html`<p title="${'"q"'}">${inner}${["<a>", inner]}${null}${false}${0}</p>`;
    assert.ok(out instanceof SafeHtml);
    assert.equal(out.toString(), "<p title=\"&quot;q&quot;\"><i>&lt;x&gt;</i>&lt;a&gt;<i>&lt;x&gt;</i>0</p>");
    assert.equal(joinHtml([html`<b>1</b>`, "<2>"], " · ").toString(), "<b>1</b> · &lt;2&gt;");
  });
});
