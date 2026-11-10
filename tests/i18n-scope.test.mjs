import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {CATALOGS} from '../docs/assets/i18n/catalogs.js';

test('the complete developer scope note translates across inline markup while original content is preserved',async()=>{
  const tail='. Die Seite zeigt, was die API liefert – sie wählt keinen Regelsatz aus und bewertet keine Regel.';
  const badgeSources=['BEISPIEL','SYNTHETISCHE ANTWORT','SYNTHETISCH'];
  const badges=badgeSources.map(source=>'<strong class="example-badge">'+source+'</strong>').join('');
  const dom=new JSDOM('<!doctype html><body><div class="scope-note">Technische Entwickleransicht, <strong>keine Präferenzkalkulation</strong>'+tail+'</div>'+badges+'<pre>'+tail+'</pre></body>',{url:'https://viewer.example.invalid/rules-demo.html?mode=offline&rules_session=ready'});
  for(const key of ['window','document','MutationObserver','CustomEvent'])globalThis[key]=key==='window'?dom.window:dom.window[key];
  const normalize=value=>value.replace(/\s+/g,' ').trim();
  let stop;
  try{
    const ui=await import('../docs/assets/i18n/ui.js?scope-contract');
    stop=ui.startUiLocalization();
    for(const language of ['de','en','ro','fr','es','it','pl','nl']){
      assert.equal(await ui.setLanguage(language),true);
      const expected=CATALOGS['Technische Entwickleransicht,'][language]+' '+CATALOGS['keine Präferenzkalkulation'][language]+CATALOGS[tail][language];
      assert.equal(normalize(document.querySelector('.scope-note').textContent),normalize(expected),language);
      assert.deepEqual([...document.querySelectorAll('.example-badge')].map(node=>node.textContent),badgeSources.map(source=>CATALOGS[source][language]),language);
      assert.equal(document.querySelector('pre').textContent,tail,language);
    }
  }finally{
    stop?.();dom.window.close();
    for(const key of ['window','document','MutationObserver','CustomEvent'])delete globalThis[key];
  }
});
