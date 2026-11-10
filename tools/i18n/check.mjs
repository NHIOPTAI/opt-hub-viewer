import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { CATALOGS } from '../../docs/assets/i18n/catalogs.js';
import { CATALOG_MANIFEST } from '../../docs/assets/i18n/manifest.js';
import { BOOT } from '../../docs/assets/i18n/bootstrap.js';
import { DRAFT_NOTICES } from '../../docs/assets/i18n/notices.js';
const root=path.resolve(import.meta.dirname,'../..'),base=path.join(root,'docs/assets/i18n'),languages=['de','en','ro','fr','es','it','pl','nl'],errors=[];
const gzip=file=>zlib.gzipSync(fs.readFileSync(file)).length;
const vars=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort().join('|');
const scopeTail='. Die Seite zeigt, was die API liefert – sie wählt keinen Regelsatz aus und bewertet keine Regel.';
if(!CATALOGS[scopeTail])errors.push('Missing UI scope-note continuation');
const exampleLabels={de:'BEISPIEL',en:'EXAMPLE',ro:'EXEMPLU',fr:'EXEMPLE',es:'EJEMPLO',it:'ESEMPIO',pl:'PRZYKŁAD',nl:'VOORBEELD'};
if(!CATALOGS.BEISPIEL)errors.push('Missing example UI badge');
for(const label of ['SYNTHETISCHE ANTWORT','SYNTHETISCH'])if(!CATALOGS[label])errors.push('Missing synthetic UI badge: '+label);
const sizes={runtimeJsGzip:['ui.js','catalogLoader.js','manifest.js','bootstrap.js','notices.js'].reduce((n,file)=>n+gzip(path.join(base,file)),0),languages:{},oldEagerCatalogGzip:gzip(path.join(base,'catalogs.js'))};
for(const language of languages){
  const file=path.join(base,CATALOG_MANIFEST.assets[language]),text=fs.readFileSync(file,'utf8'),bundle=JSON.parse(text);
  sizes.languages[language]={raw:Buffer.byteLength(text),gzip:gzip(file)};
  if(bundle.language!==language||bundle.version!==CATALOG_MANIFEST.version)errors.push('Catalog version: '+language);
  if(Object.keys(bundle.texts).length!==Object.keys(CATALOGS).length)errors.push('Key count: '+language);
  for(const [source,values]of Object.entries(CATALOGS)){
    const target=bundle.texts[source];
    if(!target?.trim()||target!==values[language]||vars(target)!==vars(source))errors.push('Missing/stale/variables: '+language+':'+source);
    if(target!==target.normalize('NFC')||/[�⁇]|<unk>|▁/u.test(target))errors.push('Encoding: '+language+':'+source);
    if(language==='ro'&&/[şţŞŢ]/u.test(target))errors.push('Romanian comma-below: '+source);
    for(const hostname of source.match(/\b(?:[a-z0-9-]+\.)*opt-hub\.ai\b/gi)??[])if(!target.includes(hostname))errors.push('Technical hostname changed: '+language+':'+source);
    for(const product of ['Rules API','Tariff API','Savings API','Origin Evidence API'])if(source.includes(product)&&!target.includes(product))errors.push('API product name changed: '+language+':'+source);
  }
  for(const value of [...Object.values(BOOT[language]),DRAFT_NOTICES[language]])if(!value?.trim()||value!==value.normalize('NFC')||/[�⁇]/u.test(value))errors.push('Recovery/notice encoding: '+language);
  if(language!=='de'&&bundle.texts[scopeTail]===scopeTail)errors.push('German UI scope fallback: '+language);
  if(bundle.texts.BEISPIEL!==exampleLabels[language])errors.push('Example UI badge untranslated: '+language);
  if(sizes.languages[language].raw>100000||sizes.languages[language].gzip>30000)errors.push('Active language size: '+language);
}
sizes.initialGzip=sizes.runtimeJsGzip+Math.max(...Object.values(sizes.languages).map(v=>v.gzip));
if(sizes.runtimeJsGzip>30000||sizes.initialGzip>60000)errors.push('Initial i18n size budget');
for(const file of ['ui.js','catalogLoader.js','manifest.js','bootstrap.js','notices.js'])if(/from\s*['"][^'"]*catalogs\.js['"]/.test(fs.readFileSync(path.join(base,file),'utf8')))errors.push('Eager all-language runtime import: '+file);
const result={technical:errors.length?'FAIL':'PASS',linguistic:'PENDING',release:'BLOCKED',languages,keys:Object.keys(CATALOGS).length,sizes,errors};
console.log(JSON.stringify(result,null,2));
if(errors.length||process.argv.includes('--release'))process.exitCode=1;
