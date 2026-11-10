import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const globals=['window','document','MutationObserver','CustomEvent'];
function setup(query=''){
  const dom=new JSDOM('<!doctype html><html><body><h1>Stichtag</h1><input value="ZZ-UNSAVED"><pre data-i18n-original>ZZ original {"code":"ZZ_TEST"}</pre></body></html>',{url:'https://viewer.example.invalid/rules-demo.html'+query});
  for(const key of globals)globalThis[key]=key==='window'?dom.window:dom.window[key];
  return ()=>{dom.window.close();for(const key of globals)delete globalThis[key];};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
test('failed switch preserves the active page/input; explicit retry succeeds and stale completion never wins',async()=>{
  const close=setup(),originalFetch=globalThis.fetch;let stop;
  try{
    const ui=await import('../docs/assets/i18n/ui.js?errors');stop=ui.startUiLocalization();
    const input=document.querySelector('input');let fail=true;
    globalThis.fetch=(url,...args)=>fail&&/\/fr-/.test(String(url))?Promise.resolve(new Response('',{status:503})):originalFetch(url,...args);
    assert.equal(await ui.setLanguage('fr'),false);assert.equal(document.documentElement.lang,'de');assert.equal(input.value,'ZZ-UNSAVED');assert.equal(document.querySelector('h1').textContent,'Stichtag');assert.equal(window.localStorage.getItem('optai.platform.language'),'de');assert.ok(document.querySelector('[role="alert"]'));
    fail=false;assert.equal(await ui.setLanguage('fr'),true);assert.equal(document.documentElement.lang,'fr');assert.equal(document.querySelector('[role="alert"]'),null);
    let release;globalThis.fetch=(url,...args)=>/\/it-/.test(String(url))?new Promise(resolve=>{release=()=>originalFetch(url,...args).then(resolve);}):originalFetch(url,...args);
    const stale=ui.setLanguage('it');assert.equal(await ui.setLanguage('pl'),true);release();assert.equal(await stale,false);
    assert.equal(document.documentElement.lang,'pl');assert.equal(ui.uiCatalogDiagnostics().active,'pl');assert.ok(ui.uiCatalogDiagnostics().cachedLanguages.length<=2);assert.equal(document.querySelector('input'),input);assert.equal(input.value,'ZZ-UNSAVED');assert.equal(document.querySelector('pre').textContent,'ZZ original {"code":"ZZ_TEST"}');
  }finally{stop?.();globalThis.fetch=originalFetch;close();}
});
test('initial asset failure shows native recovery; German fallback requires an explicit click',async()=>{
  const close=setup('?ui_lang=ro'),originalFetch=globalThis.fetch;let stop;
  try{
    globalThis.fetch=(url,...args)=>/\/ro-/.test(String(url))?Promise.resolve(new Response('',{status:503})):originalFetch(url,...args);
    const pending=import('../docs/assets/i18n/ui.js?initial-error');
    for(let i=0;i<100&&!document.querySelector('[role="alert"]');i++)await tick();
    const alert=document.querySelector('[role="alert"]');assert.ok(alert);assert.equal(alert.lang,'ro');assert.match(alert.textContent,/Încercați/);assert.equal(document.querySelector('h1').hidden,true);assert.equal(window.localStorage.getItem('optai.platform.language'),null);
    const fallback=[...alert.querySelectorAll('button')].find(node=>node.textContent==='Folosiți limba germană');assert.ok(fallback);fallback.click();
    const ui=await pending;stop=ui.startUiLocalization();assert.equal(ui.getLanguage(),'de');assert.equal(document.querySelector('h1').hidden,false);assert.equal(document.querySelector('input').value,'ZZ-UNSAVED');assert.equal(window.localStorage.getItem('optai.platform.language'),'de');
  }finally{stop?.();globalThis.fetch=originalFetch;close();}
});
