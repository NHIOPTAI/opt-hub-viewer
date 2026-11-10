// Unit tests read only generated public UI assets. Other fetch behaviour is unchanged.
import fs from 'node:fs/promises';
const originalFetch=globalThis.fetch,base=new URL('../docs/assets/i18n/locales/',import.meta.url);
globalThis.fetch=async(input,...args)=>{
  const url=input instanceof URL?input:new URL(typeof input==='string'?input:input.url);
  if(url.protocol==='file:'&&url.href.startsWith(base.href)&&/^\w{2}-[a-f0-9]{16}\.json$/.test(url.pathname.split('/').at(-1))) {
    try{return new Response(await fs.readFile(url),{headers:{'content-type':'application/json'}});}
    catch{return new Response('',{status:404});}
  }
  return originalFetch(input,...args);
};
