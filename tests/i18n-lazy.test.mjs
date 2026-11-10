import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUiCatalogStore } from '../docs/assets/i18n/catalogLoader.js';
import { CATALOG_MANIFEST } from '../docs/assets/i18n/manifest.js';
const languages=['de','en','ro','fr','es','it','pl','nl'];
const bundle=language=>fetch(new URL('../docs/assets/i18n/'+CATALOG_MANIFEST.assets[language],import.meta.url)).then(r=>r.text());
test('lazy public catalogs request the selected language once and retain at most two active dictionaries',async()=>{
  const calls=[],store=createUiCatalogStore(async url=>{calls.push(url.href);return fetch(url);});
  const [first,second]=await Promise.all([store.load('de'),store.load('de')]);assert.equal(first,second);assert.equal(calls.length,1);
  for(const language of [...languages,'de']){const value=await store.load(language);store.activate(language,value);assert.equal(store.get(language),value);assert.ok(store.diagnostics().cachedLanguages.length<=2);assert.ok(Object.isFrozen(value.texts));}
  assert.equal(store.diagnostics().active,'de');assert.ok(!store.get('ro'));
});
test('failed and corrupt public catalogs never activate or trigger an implicit fallback',async()=>{
  const good=await bundle('ro');
  for(const mutate of [()=>null,value=>({...value,language:'en'}),value=>({...value,version:'stale'}),value=>({...value,texts:{}}),value=>({...value,texts:{...value.texts,Stichtag:''}}),value=>({...value,texts:{...value.texts,Stichtag:'{missing}'}})]){
    let fail=true,calls=0;const store=createUiCatalogStore(async()=>{calls++;const value=mutate(JSON.parse(good));return fail?{ok:!!value,status:503,text:async()=>JSON.stringify(value)}:{ok:true,text:async()=>good};});
    await assert.rejects(store.load('ro'));assert.equal(calls,1);assert.equal(store.diagnostics().active,undefined);assert.deepEqual(store.diagnostics().pendingLanguages,[]);
    fail=false;const ready=await store.load('ro');store.activate('ro',ready);assert.equal(calls,2);assert.equal(store.diagnostics().active,'ro');
  }
});
