import { UI_RELEASE_LANGUAGES } from './releasePolicy.js';
import { CATALOG_MANIFEST } from './manifest.js';

const names = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join('|');
/** JSON fetches avoid permanently retaining eight ESM dictionaries after a full language cycle. */
export function createUiCatalogStore(fetcher = (...args) => fetch(...args), languages = UI_RELEASE_LANGUAGES) {
  const cache = new Map(), pending = new Map(), samples = [], validated = new WeakSet();
  let active;
  const keys = CATALOG_MANIFEST.sourceKeys;
  async function load(language) {
    if (!languages.includes(language) || !Object.hasOwn(CATALOG_MANIFEST.assets, language)) throw new Error('Unsupported UI language');
    if (cache.has(language)) return cache.get(language);
    if (pending.has(language)) return pending.get(language);
    const request = (async () => {
      const start = performance.now();
      const response = await fetcher(new URL(CATALOG_MANIFEST.assets[language], import.meta.url));
      if (!response.ok) throw new Error('UI language unavailable: ' + response.status);
      const text = await response.text(), fetched = performance.now(), bundle = JSON.parse(text), parsed = performance.now();
      if (bundle.schemaVersion !== 1 || bundle.version !== CATALOG_MANIFEST.version || bundle.language !== language || !bundle.texts || Object.keys(bundle.texts).length !== keys.length) throw new Error('UI catalog version or key count mismatch');
      for (const source of keys) {
        const target = bundle.texts[source];
        if (!Object.hasOwn(bundle.texts, source) || typeof target !== 'string' || !target.trim() || names(source) !== names(target) || target !== target.normalize('NFC') || /[�⁇]|<unk>|▁/u.test(target)) throw new Error('Invalid UI translation: ' + source);
      }
      Object.freeze(bundle.texts); Object.freeze(bundle);
      validated.add(bundle);
      samples.push({ language, bytes: new TextEncoder().encode(text).length, fetchMs: fetched - start, parseMs: parsed - fetched });
      if (samples.length > 32) samples.shift();
      return bundle;
    })();
    pending.set(language, request);
    try { return await request; } finally { pending.delete(language); }
  }
  function activate(language, bundle) {
    if (!validated.has(bundle) || bundle.language !== language || bundle.version !== CATALOG_MANIFEST.version) throw new Error('UI catalog activation mismatch');
    const previous = active;
    cache.set(language, bundle); active = language;
    for (const value of cache.keys()) if (cache.size > 2 && value !== active && value !== previous) cache.delete(value);
  }
  return { load, activate, get: language => cache.get(language), keys,
    diagnostics: () => ({ active, cachedLanguages: [...cache.keys()], pendingLanguages: [...pending.keys()], samples: samples.map(value => ({ ...value })) }) };
}
