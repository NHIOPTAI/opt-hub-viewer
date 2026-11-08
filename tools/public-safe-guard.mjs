#!/usr/bin/env node
// OPT.AI Developer Hub -- PUBLIC-SAFE GUARD (owner order "DEVELOPER HUB V1.1 - PUBLIC-SAFE DATA CLEANUP & RELEASE", 2026-11-08).
//
// This repository is PUBLIC on GitHub and served by GitHub Pages. Only HTML, CSS, JavaScript, synthetic ZZ data, general API
// documentation and public technical field names belong here -- never real rule data. The guard runs in `npm test` and before
// every push (.githooks/pre-push; activate once per clone: `git config core.hooksPath .githooks`). Any finding is a FAIL, and a
// FAIL blocks the push. A finding names the file, the line and the rule -- never the value.
//
//   G1 rule texts       DescRset / DescRg / DescAg hold only "ZZ-TEST ..." or the placeholder; no rule-text wording outside a
//                       ZZ-TEST text
//   G2 real answers     every content id (ContentId, content_id, selected_/requested_content_id, allowed_contents,
//                       content_candidates) starts with ZZ_; no agreement id of the live data
//   G3 rule corpora     no real-format fingerprint (v1:sha256:<hex>); fingerprint fields are synthetic (zz...); the data modules
//                       and the structure fixtures are marked synthetic; no private data file of OPT-AI
//   G4 secrets          no AWS key, JWT, private key, service-role token, database URL with a password, secret literal
//   G5 Access audiences no 64-character hex value (the form of a Cloudflare Access audience tag)
//   G6 private addresses only addresses under example.invalid
//   G7 screenshots      no image or PDF except the reviewed ones (tools/public-safe-allowlist.json: path + SRI hash)
//   G8 secret files     no .env, .dev.vars, key, certificate or credentials file
//
// usage: node tools/public-safe-guard.mjs                every tracked and every new, not ignored file of the working tree
//        node tools/public-safe-guard.mjs --push <sha>   every file version in the commits that <sha> adds to origin (pre-push)
//        node tools/public-safe-guard.mjs --dir <path> [--prefix docs/]   every file below a directory; a downloaded GitHub Pages
//                                                        artifact is docs/ -- with --prefix docs/ its paths are the repository paths
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PLACEHOLDER = "[Regeltext in der Aufzeichnung entfernt]";
const SYNTHETIC_TEXT = "ZZ-TEST";

const BINARY = /\.(png|jpe?g|gif|webp|bmp|tiff?|ico|pdf|heic|avif|woff2?|ttf|otf|eot|zip|gz|tar|7z)$/i;
const IMAGE = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg|ico|pdf|heic|avif)$/i;
const SECRET_FILE = /(^|\/)(\.env(\..*)?|\.dev\.vars(\..*)?|[^/]*\.(pem|key|p12|pfx|crt|cer)|id_(rsa|ed25519|ecdsa)(\.pub)?|credentials(\.json)?)$/i;
const PRIVATE_FILE = /(^|\/)(devhub_private\/|[^/]*_live\.json$|structure_crosscheck\.json$)/i;
const DATA_MODULE = /^docs\/assets\/devhub\/data\/[^/]+\.js$/;
const STRUCTURE_FIXTURE = /^tests\/.*fixtures\/structure_[^/]+\.json$/;

// the field rules apply to data (JSON, object literals) -- `form.content_id : "..."` in code (a property access) is no datum
const TEXT_FIELD = /(?<![.\w$])["']?\b(DescRset|DescRg|DescAg)\b["']?\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const ID_FIELD = /(?<![.\w$])["']?\b(ContentId|content_id|selected_content_id|requested_content_id)\b["']?\s*:\s*"([^"]*)"/g;
const ID_LIST = /(?<![.\w$])["']?\b(allowed_contents|content_candidates)\b["']?\s*:\s*\[([^\]]*)\]/g;
const FP_FIELD = /(?<![.\w$])["']?\b(RuleSetFingerprint|RuleFingerprint|rule_set_fingerprint|fingerprint)\b["']?\s*:\s*"([^"]*)"/g;
const LIVE_AGREEMENT = /(?<![A-Za-z0-9_])(?:EU|EFTA|EEA|EWR|CH|UK|GB|NO|IS|LI|TR|PEM)_[A-Z]{2,6}[0-9]{2}(?![A-Za-z0-9_])/;
const REAL_FINGERPRINT = /v1:sha256:[0-9a-f]{16,}/i;
const HEX64 = /(?<![0-9a-fA-F])[0-9a-fA-F]{64}(?![0-9a-fA-F])/;
const ADDRESS = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const ALLOWED_ADDRESS = /@([a-z0-9-]+\.)*example\.invalid$/;
// the formulas of rule texts in DE / EN / FR -- kept as word lists so that this file does not hold them as text
const RULE_WORDING = [
  ["herstellen", "aus", "vormaterialien"], ["manufacture", "from", "materials"], ["fabrication", "à", "partir", "de", "matières"],
  ["vormaterialien", "ohne", "ursprungseigenschaft"], ["non-originating", "materials"], ["matières", "non", "originaires"],
  ["ab-werk-preis", "des", "erzeugnisses"], ["ex-works", "price", "of", "the", "product"], ["prix", "départ", "usine", "du", "produit"],
].map((words) => words.join(" "));
const SECRETS = [
  ["AWS access key", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["database URL with a password", /\b(postgres(ql)?|mysql|mongodb(\+srv)?):\/\/[^\s:@/]+:[^\s@/]+@/i],
  ["service-role token", /service_role["']?\s*[:=]\s*["']?eyJ/i],
  ["Access client secret", /cf-access-client-secret["']?\s*[:=]\s*["']?[A-Za-z0-9]{20,}/i],
  ["secret literal", /\b(client[_-]?secret|api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|secret)\b["']?\s*[:=]\s*["'][A-Za-z0-9+/_=.-]{16,}["']/i],
];

/** The reviewed images and documents: { "images": { path: "sha256-<base64>" } }. */
export function loadAllowlist(root = ROOT) {
  try {
    return JSON.parse(readFileSync(join(root, "tools", "public-safe-allowlist.json"), "utf8"));
  } catch {
    return { images: {} };
  }
}

const sri = (buffer) => `sha256-${createHash("sha256").update(buffer).digest("base64")}`;
const isBinary = (path, buffer) => BINARY.test(path) || buffer.subarray(0, 8000).includes(0);

/** The findings of one text file: [{ path, line, rule, message }]. */
export function scanText(path, text) {
  const findings = [];
  const lineAt = (index) => text.slice(0, index).split("\n").length;
  const add = (rule, line, message) => findings.push({ path, line, rule, message });
  for (const m of text.matchAll(TEXT_FIELD)) {
    const value = m[2];
    if (value && value !== PLACEHOLDER && !value.startsWith(SYNTHETIC_TEXT)) add("G1", lineAt(m.index), `${m[1]} is neither synthetic (${SYNTHETIC_TEXT}) nor the placeholder`);
  }
  for (const m of text.matchAll(ID_FIELD)) {
    if (m[2] && !m[2].startsWith("ZZ_")) add("G2", lineAt(m.index), `${m[1]} is not a synthetic ZZ_ content id`);
  }
  for (const m of text.matchAll(ID_LIST)) {
    for (const item of m[2].matchAll(/"([^"]*)"/g)) {
      if (!item[1].startsWith("ZZ_")) add("G2", lineAt(m.index), `${m[1]} holds a content id that is not ZZ_`);
    }
  }
  for (const m of text.matchAll(FP_FIELD)) {
    const value = m[2].trim();
    if (value && !/^zz/i.test(value) && !/^v1:sha256:zz$/i.test(value)) add("G3", lineAt(m.index), `${m[1]} is not synthetic (zz...)`);
  }
  for (const m of text.matchAll(ADDRESS)) {
    if (!ALLOWED_ADDRESS.test(m[0].toLowerCase())) add("G6", lineAt(m.index), "address outside example.invalid");
  }
  text.split("\n").forEach((line, i) => {
    const lower = line.toLowerCase();
    if (!lower.includes("zz-test") && RULE_WORDING.some((w) => lower.includes(w))) add("G1", i + 1, "rule-text wording outside a ZZ-TEST text");
    if (LIVE_AGREEMENT.test(line)) add("G2", i + 1, "agreement id of the live data");
    if (REAL_FINGERPRINT.test(line)) add("G3", i + 1, "real-format fingerprint (v1:sha256:<hex>)");
    for (const [name, pattern] of SECRETS) if (pattern.test(line)) add("G4", i + 1, name);
    if (HEX64.test(line)) add("G5", i + 1, "64-character hex value (the form of an Access audience tag)");
  });
  if (DATA_MODULE.test(path) && !/"synthetic"\s*:\s*true/.test(text)) add("G3", 1, "data module not marked synthetic");
  if (STRUCTURE_FIXTURE.test(path) && !/"source"\s*:\s*"[^"]*synthetic/i.test(text)) add("G3", 1, "structure fixture not marked synthetic");
  return findings;
}

/** The findings of a set of files: entries = [{ path (repository-relative, "/"), content (Buffer) }]. */
export function scanEntries(entries, allowlist = loadAllowlist()) {
  const findings = [];
  for (const { path, content } of entries) {
    if (SECRET_FILE.test(path)) findings.push({ path, line: 0, rule: "G8", message: "secret or credentials file" });
    if (PRIVATE_FILE.test(path)) findings.push({ path, line: 0, rule: "G3", message: "private data file of OPT-AI" });
    if (IMAGE.test(path)) {
      const reviewed = (allowlist.images || {})[path];
      if (!reviewed || reviewed !== sri(content)) findings.push({ path, line: 0, rule: "G7", message: "image or document not reviewed (allowlist)" });
      continue;
    }
    if (isBinary(path, content)) continue;
    findings.push(...scanText(path, content.toString("utf8")));
  }
  return findings;
}

const git = (args, root, encoding = "utf8") => execFileSync("git", ["-C", root, ...args], { encoding, maxBuffer: 256 * 1024 * 1024 });

/** Every tracked and every new, not ignored file of the working tree. */
export function collectWorkingTree(root = ROOT) {
  return git(["ls-files", "-co", "--exclude-standard"], root).split("\n").filter(Boolean).flatMap((path) => {
    try {
      return [{ path, content: readFileSync(join(root, path)) }];
    } catch {
      return []; // deleted in the working tree
    }
  });
}

/** Every file version (blob) in the commits that <sha> adds to the remote-tracking state of origin. */
export function collectPush(sha, root = ROOT) {
  const lines = git(["rev-list", "--objects", sha, "--not", "--remotes=origin"], root).split("\n").filter(Boolean);
  const paths = new Map();
  for (const line of lines) {
    const space = line.indexOf(" ");
    if (space > 0) paths.set(line.slice(0, space), line.slice(space + 1));
  }
  const entries = [];
  for (const [object, path] of paths) {
    if (git(["cat-file", "-t", object], root).trim() !== "blob") continue;
    entries.push({ path, content: git(["cat-file", "blob", object], root, "buffer") });
  }
  return entries;
}

/** Every file below a directory; paths relative to it, with an optional prefix (a GitHub Pages artifact is docs/: --prefix docs/,
 *  so that the allowlist and the path rules see the repository paths). */
export function collectDir(dir, prefix = "") {
  const out = [];
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push({ path: prefix + relative(dir, full).replaceAll("\\", "/"), content: readFileSync(full) });
    }
  };
  walk(dir);
  return out;
}

function main(argv) {
  let entries;
  let scope;
  if (argv[0] === "--push" && argv[1]) {
    entries = collectPush(argv[1]);
    scope = `the commits that ${argv[1].slice(0, 12)} adds to origin`;
  } else if (argv[0] === "--dir" && argv[1]) {
    const prefix = argv[2] === "--prefix" && argv[3] ? argv[3] : "";
    entries = collectDir(argv[1], prefix);
    scope = `${argv[1]}${prefix ? ` (as ${prefix})` : ""}`;
  } else if (argv.length === 0) {
    entries = collectWorkingTree();
    scope = "the working tree";
  } else {
    console.error("usage: node tools/public-safe-guard.mjs [--push <sha> | --dir <path> [--prefix docs/]]");
    return 2;
  }
  const findings = scanEntries(entries);
  const byRule = findings.reduce((acc, f) => ({ ...acc, [f.rule]: (acc[f.rule] || 0) + 1 }), {});
  for (const f of findings.slice(0, 50)) console.log(`  ${f.rule}  ${f.path}${f.line ? `:${f.line}` : ""}  ${f.message}`);
  if (findings.length > 50) console.log(`  ... and ${findings.length - 50} more`);
  console.log(`PUBLIC-SAFE GUARD: ${findings.length === 0 ? "PASS" : `FAIL (${findings.length} findings ${JSON.stringify(byRule)})`}`
    + ` -- ${entries.length} files checked in ${scope}`);
  return findings.length === 0 ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) process.exit(main(process.argv.slice(2)));
