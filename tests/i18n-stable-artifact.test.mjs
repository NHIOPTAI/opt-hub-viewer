import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { CATALOG_MANIFEST } from '../docs/assets/i18n/manifest.js';

const root = path.resolve(import.meta.dirname, '..');
const builder = path.join(root, 'tools/i18n/prepare-stable.mjs');

test('stable artifact retains exact DE/EN and original pages while excluding every draft payload', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'viewer-stable-test-'));
  const output = path.join(temporary, 'candidate');
  try {
    execFileSync(process.execPath, [builder, '--out', output], { cwd: root, stdio: 'pipe' });
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'i18n-release.json'))), {
      profile: 'stable', languages: ['de', 'en'], draftsIncluded: false,
    });
    const base = path.join(output, 'assets/i18n');
    assert.equal(fs.existsSync(path.join(base, 'catalogs.js')), false);
    for (const language of ['de', 'en']) {
      const asset = CATALOG_MANIFEST.assets[language];
      assert.deepEqual(fs.readFileSync(path.join(base, asset)), fs.readFileSync(path.join(root, 'docs/assets/i18n', asset)));
    }
    for (const name of fs.readdirSync(path.join(base, 'locales'))) {
      if (name.endsWith('.json')) assert.ok(['de', 'en'].includes(JSON.parse(fs.readFileSync(path.join(base, 'locales', name))).language));
    }
    for (const name of ['index.html', 'rules-demo.html', 'assets/i18n/ui.js']) {
      assert.deepEqual(fs.readFileSync(path.join(output, name)), fs.readFileSync(path.join(root, 'docs', name)));
    }
    assert.throws(() => execFileSync(process.execPath, [builder, '--out', output], { stdio: 'pipe' }));
    assert.throws(() => execFileSync(process.execPath, [builder, '--out', root], { stdio: 'pipe' }));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
