// Entry point of `node --test tests/` (package.json "test").
//
// Node 21+ resolves a directory argument of --test as a module path -- i.e. this file -- instead of searching the
// directory (verified with Node v24.21.0), so this file imports every *.test.js below tests/ in a stable order.
// Node 20 searches the directory itself; there this file is no test file (its name matches no test pattern) and the
// *.test.js files run directly. Either way every test runs exactly once.

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(root, { recursive: true })
  .map((file) => String(file))
  .filter((file) => file.endsWith(".test.js"))
  .sort();

for (const file of files) await import(pathToFileURL(join(root, file)).href);
