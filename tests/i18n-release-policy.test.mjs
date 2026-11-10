import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languagesForModuleUrl} from '../docs/assets/i18n/releasePolicy.js';
import {createUiCatalogStore} from '../docs/assets/i18n/catalogLoader.js';

test('remote publication exposes DE/EN only, independent of query parameters',()=>{
  for(const url of ['https://viewer.example.invalid/assets/i18n/releasePolicy.js','https://localhost.example.invalid/policy.js?owner=true','https://viewer.example.invalid/policy.js?ui_lang=ro'])assert.deepEqual(languagesForModuleUrl(url),['de','en']);
});
test('existing loopback and file-based owner previews retain all eight languages',()=>{
  for(const url of ['http://127.0.0.1/policy.js','http://localhost/policy.js','http://[::1]/policy.js','file:///tmp/policy.js'])assert.equal(languagesForModuleUrl(url).length,8);
});
test('stable store rejects every draft before making a request',async()=>{
  let calls=0;
  const store=createUiCatalogStore(()=>{calls++;throw Error('Unexpected request');},['de','en']);
  for(const code of ['ro','fr','es','it','pl','nl','xx'])await assert.rejects(store.load(code),/Unsupported UI language/);
  assert.equal(calls,0);
});
