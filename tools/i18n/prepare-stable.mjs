import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_MANIFEST } from '../../docs/assets/i18n/manifest.js';
import { collectDir, scanEntries } from '../public-safe-guard.mjs';

const root = fs.realpathSync(path.resolve(import.meta.dirname, '../..'));
const index = process.argv.indexOf('--out');
if (index < 0 || !process.argv[index + 1]) throw Error('A new output directory is required');
const requested = path.resolve(process.argv[index + 1]);
const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
const inside = (child, parent) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
};
if (inside(output, root) || inside(root, output) || fs.existsSync(output)) {
  throw Error('Use a new output directory outside the source repository');
}
const source = path.join(root, 'docs');
function rejectLinks(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw Error('Source symbolic links require a separate review');
    if (entry.isDirectory()) rejectLinks(path.join(directory, entry.name));
  }
}
rejectLinks(source);
const checkPublic = directory => {
  const findings = scanEntries(collectDir(directory, 'docs/'));
  if (findings.length) throw Error('Public-safe check failed with ' + findings.length + ' findings');
};
checkPublic(source);
fs.cpSync(source, output, { recursive: true });
const directory = path.join(output, 'assets/i18n');
const localeDirectory = path.join(directory, 'locales');
const languages = ['de', 'en'];
for (const name of fs.readdirSync(localeDirectory)) {
  if (!name.endsWith('.json')) continue;
  const file = path.join(localeDirectory, name);
  const bundle = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!languages.includes(bundle.language)) fs.unlinkSync(file);
}
fs.unlinkSync(path.join(directory, 'catalogs.js'));
fs.writeFileSync(path.join(directory, 'releasePolicy.js'), "export const UI_RELEASE_LANGUAGES = Object.freeze(['de', 'en']);\n");
const manifest = {
  ...CATALOG_MANIFEST,
  assets: Object.fromEntries(languages.map(language => [language, CATALOG_MANIFEST.assets[language]])),
};
fs.writeFileSync(path.join(directory, 'manifest.js'), 'export const CATALOG_MANIFEST = ' + JSON.stringify(manifest) + ';\n');
fs.writeFileSync(path.join(output, 'i18n-release.json'), JSON.stringify({ profile: 'stable', languages, draftsIncluded: false }) + '\n');
for (const language of languages) {
  const asset = manifest.assets[language];
  if (!fs.readFileSync(path.join(directory, asset)).equals(fs.readFileSync(path.join(source, 'assets/i18n', asset)))) {
    throw Error('Stable catalog bytes changed');
  }
}
checkPublic(output);
console.log(JSON.stringify({ profile: 'stable', languages, output, publicSafe: 'PASS' }));
