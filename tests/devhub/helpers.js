// Shared helpers of the Developer Hub tests (no test file itself).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(TESTS_DIR, "..", "..");
export const DEVHUB_DIR = join(REPO_ROOT, "docs", "assets", "devhub");

export function fixture(name) {
  return JSON.parse(readFileSync(join(TESTS_DIR, "fixtures", name), "utf8"));
}

/** A repository file as text, line endings normalized (the repository is checked out with core.autocrlf on Windows). */
export function repoFile(...parts) {
  return readFileSync(join(REPO_ROOT, ...parts), "utf8").replace(/\r\n/g, "\n");
}

/** The synthetic defaults of the vector files (where an input lacks the rule-set fields). */
export function withDefaults(input) {
  return { Hspos: "9999", Hsposindx: "1", ExFlag: "0", RuleSetFingerprint: "zz-synthetic", ...input };
}

/** Markup without its tags: what a reader (and the browser's text layer) sees. */
export function textLayer(markup) {
  return String(markup).replace(/<[^>]*>/g, "");
}
