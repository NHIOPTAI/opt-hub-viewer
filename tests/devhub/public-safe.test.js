// The public-safe guard (tools/public-safe-guard.mjs). This repository is PUBLIC: the working tree must pass, and every rule must
// catch what it is there for. The violating samples are assembled at run time, so this file itself holds none of them.
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as joinPath } from "node:path";
import { describe, test } from "node:test";

import { collectDir, collectPush, collectWorkingTree, scanEntries, scanText } from "../../tools/public-safe-guard.mjs";
import { REPO_ROOT, repoFile } from "./helpers.js";

const entry = (path, text) => ({ path, content: Buffer.from(text, "utf8") });
const rules = (findings) => [...new Set(findings.map((f) => f.rule))].sort();
const json = (object) => JSON.stringify(object);
const join = (...parts) => parts.join("");

describe("public-safe guard", () => {
  test("the working tree of this public repository passes: no real rule data, no secret", () => {
    const findings = scanEntries(collectWorkingTree());
    assert.deepStrictEqual(findings.map((f) => `${f.rule} ${f.path}:${f.line} ${f.message}`), []);
  });

  test("G1: a rule text that is not synthetic, and rule-text wording outside a ZZ-TEST text", () => {
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("Desc", "Rg")]: "Echt wirkender Text" }))), ["G1"]);
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("Desc", "Ag")]: "Echt wirkender Text" }))), ["G1"]);
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("Desc", "Rg")]: "ZZ-TEST synthetisch" }))), []);
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("Desc", "Rset")]: "[Regeltext in der Aufzeichnung entfernt]" }))), []);
    const wording = ["Herstellen", "aus", "Vormaterialien"].join(" "); // the three words the guard looks for, no more
    assert.deepStrictEqual(rules(scanText("x.md", wording)), ["G1"]);
    assert.deepStrictEqual(rules(scanText("x.md", `ZZ-TEST ${wording}`)), []);
  });

  test("G2: a content id that is not ZZ_, an agreement id of the live data", () => {
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("Content", "Id")]: "AB_CD01" }))), ["G2"]);
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("allowed", "_contents")]: ["ZZ_TEST01", "AB_CD01"] }))), ["G2"]);
    assert.deepStrictEqual(rules(scanText("x.js", `const id = "${["EU", "VN01"].join("_")}";`)), ["G2"]);
    assert.deepStrictEqual(rules(scanText("x.json", json({ content_id: "ZZ_TEST01", content_candidates: ["ZZ_TEST01"] }))), []);
    // code, not data: a property access with a ternary is no content id
    assert.deepStrictEqual(rules(scanText("x.js", `const c = form.${"content_id"} ? form.${"content_id"} : "Abkommen automatisch";`)), []);
  });

  test("G3: a real-format fingerprint, a non-synthetic fingerprint field, unmarked data and the private files", () => {
    assert.ok(rules(scanText("x.js", `"${["v1", "sha256", "0123456789abcdef0123"].join(":")}"`)).includes("G3"));
    assert.deepStrictEqual(rules(scanText("x.json", json({ [join("RuleSet", "Fingerprint")]: "fp-123" }))), ["G3"]);
    assert.deepStrictEqual(rules(scanText("x.json", json({ RuleSetFingerprint: "zz-set-1", RuleFingerprint: ["v1", "sha256", "zz"].join(":") }))), []);
    assert.deepStrictEqual(rules(scanText("docs/assets/devhub/data/new.js", "export default {};")), ["G3"]);
    assert.deepStrictEqual(rules(scanText("tests/devhub/fixtures/structure_new.json", json({ _meta: { source: "probe" } }))), ["G3"]);
    assert.deepStrictEqual(rules(scanEntries([entry(["tests", "structure_crosscheck.json"].join("/"), "{}")])), ["G3"]);
    assert.deepStrictEqual(rules(scanEntries([entry(["x", "testcases_live.json"].join("/"), "{}")])), ["G3"]);
  });

  test("G4: secrets", () => {
    const samples = [
      ["AK", "IA", "ABCDEFGHIJKLMNOP"].join(""),
      ["eyJ", "hbGciOiJIUzI1NiJ9", ".eyJ", "zdWIiOiIxMjM0NTY3ODkwIn0"].join(""),
      ["-----BEGIN", " PRIVATE", " KEY-----"].join(""),
      ["postgres", "://user:pass", "@db.example.invalid/x"].join(""),
      `${["client", "secret"].join("_")} = "${"A1b2C3d4E5f6G7h8I9"}"`,
    ];
    for (const sample of samples) assert.deepStrictEqual(rules(scanText("x.txt", sample)), ["G4"], sample.slice(0, 12));
  });

  test("G5: a 64-character hex value (the form of an Access audience tag)", () => {
    assert.deepStrictEqual(rules(scanText("x.txt", `aud ${"ab".repeat(32)}`)), ["G5"]);
    assert.deepStrictEqual(rules(scanText("x.txt", `short ${"ab".repeat(20)}`)), []);
  });

  test("G6: addresses only under example.invalid", () => {
    assert.deepStrictEqual(rules(scanText("x.txt", ["someone", "example.org"].join("@"))), ["G6"]);
    assert.deepStrictEqual(rules(scanText("x.txt", ["zz.demo", "demo.example.invalid"].join("@"))), []);
  });

  test("G7 / G8: an unreviewed image or document, a secret file", () => {
    assert.deepStrictEqual(rules(scanEntries([{ path: "docs/assets/new.png", content: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }])), ["G7"]);
    assert.deepStrictEqual(rules(scanEntries([entry("docs/report.pdf", "%PDF")])), ["G7"]);
    assert.deepStrictEqual(rules(scanEntries([entry(".env", "X=1")])), ["G8"]);
    assert.deepStrictEqual(rules(scanEntries([entry("tools/.dev.vars", "X=1")])), ["G8"]);
  });

  test("a GitHub Pages artifact (docs/ as its root) with --prefix docs/: the repository paths, so the allowlist and the path rules apply", () => {
    const site = mkdtempSync(joinPath(tmpdir(), "devhub-pages-"));
    try {
      mkdirSync(joinPath(site, "assets", "devhub", "data"), { recursive: true });
      copyFileSync(joinPath(REPO_ROOT, "docs", "assets", "opt-container.png"), joinPath(site, "assets", "opt-container.png"));
      writeFileSync(joinPath(site, "assets", "devhub", "data", "extra.js"), "export default {};\n");
      assert.deepStrictEqual(rules(scanEntries(collectDir(site))), ["G7"]); // without the prefix the reviewed image is unknown
      const mapped = scanEntries(collectDir(site, "docs/"));
      assert.deepStrictEqual(mapped.map((f) => `${f.rule} ${f.path}`), ["G3 docs/assets/devhub/data/extra.js"]); // the data rule applies
    } finally {
      rmSync(site, { recursive: true, force: true });
    }
  });

  test("before every push: the hook runs the guard over the pushed commits; npm can run it", () => {
    const hook = repoFile(".githooks", "pre-push");
    assert.match(hook, /node tools\/public-safe-guard\.mjs --push "\$local_sha"/);
    assert.match(hook, /exit \$status/);
    assert.equal(JSON.parse(repoFile("package.json")).scripts.guard, "node tools/public-safe-guard.mjs");
    assert.ok(Array.isArray(collectPush("HEAD")));
  });
});
