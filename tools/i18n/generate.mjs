import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CATALOGS } from '../../docs/assets/i18n/catalogs.js';
const root = path.resolve(import.meta.dirname,'../..'), directory=path.join(root,'docs/assets/i18n');
const languages=['de','en','ro','fr','es','it','pl','nl'],checking=process.argv.includes('--check'),stale=[];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const version=crypto.createHash('sha256').update(JSON.stringify(CATALOGS)).digest('base64url'),manifest={version,sourceKeys:Object.keys(CATALOGS),assets:{}};
function emit(file,text){
  if(checking){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==text)stale.push(path.relative(root,file));return;}
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);
}
for(const language of languages){
  const text=JSON.stringify({schemaVersion:1,version,language,texts:Object.fromEntries(Object.entries(CATALOGS).map(([key,values])=>[key,values[language]]))})+'\n';
  const name='locales/'+language+'-'+hash(text).slice(0,16)+'.json';
  manifest.assets[language]='./'+name;emit(path.join(directory,name),text);
}
emit(path.join(directory,'manifest.js'),'// Generated public UI asset manifest.\nexport const CATALOG_MANIFEST = '+JSON.stringify(manifest)+';\n');
console.log(JSON.stringify({mode:checking?'check':'generate',languages,keys:manifest.sourceKeys.length,version,stale}));
if(stale.length)process.exitCode=1;
