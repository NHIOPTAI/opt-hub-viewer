// Public UI copy only. No API data, credentials, model weights or private test packs.
import { UI_RELEASE_LANGUAGES } from './releasePolicy.js';
import { createUiCatalogStore } from './catalogLoader.js';
import { BOOT } from './bootstrap.js';
import { DRAFT_NOTICES } from './notices.js';

export const UI_LANGUAGES = UI_RELEASE_LANGUAGES;
export const UI_NAMES = { de: 'Deutsch', en: 'English', ro: 'Română', fr: 'Français', es: 'Español', it: 'Italiano', pl: 'Polski', nl: 'Nederlands' };
const LABELS = { de: 'Oberflächensprache', en: 'Interface language', ro: 'Limba interfeței', fr: 'Langue de l’interface', es: 'Idioma de la interfaz', it: 'Lingua dell’interfaccia', pl: 'Język interfejsu', nl: 'Interfacetaal' };
const ORIGINAL = { de: 'Abkommensnamen: Originaldaten der Discovery (Standardsprache DE).', en: 'Agreement names: original discovery data (default language DE).', ro: 'Denumirile acordurilor: date originale din Discovery (limba implicită DE).', fr: 'Noms des accords : données originales de Discovery (langue par défaut DE).', es: 'Nombres de los acuerdos: datos originales de Discovery (idioma predeterminado DE).', it: 'Nomi degli accordi: dati originali di Discovery (lingua predefinita DE).', pl: 'Nazwy umów: oryginalne dane Discovery (język domyślny DE).', nl: 'Namen van overeenkomsten: oorspronkelijke Discovery-gegevens (standaardtaal DE).' };
const LOCALES = { de: 'de-DE', en: 'en-GB', ro: 'ro-RO', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', pl: 'pl-PL', nl: 'nl-NL' };
const STORAGE_KEY = 'optai.platform.language';
const normalize = value => value.replace(/\s+/g, ' ').trim();
const valid = value => UI_LANGUAGES.includes(value);
let language = 'de';
if (typeof window !== 'undefined') {
  try {
    const query = new URLSearchParams(window.location.search).get('ui_lang');
    const stored = window.localStorage.getItem(STORAGE_KEY);
    language = valid(query) ? query : valid(stored) ? stored : 'de';
  } catch { /* blocked storage: retain the default */ }
}
export const getLanguage = () => language;
export const getLocale = () => LOCALES[language];
const ATTACHMENTS = {
  de: { one: 'Anhang', other: 'Anhänge' }, en: { one: 'attachment', other: 'attachments' },
  ro: { one: 'atașament', few: 'atașamente', other: 'de atașamente' }, fr: { one: 'pièce jointe', other: 'pièces jointes' },
  es: { one: 'adjunto', other: 'adjuntos' }, it: { one: 'allegato', other: 'allegati' },
  pl: { one: 'załącznik', few: 'załączniki', many: 'załączników', other: 'załącznika' }, nl: { one: 'bijlage', other: 'bijlagen' },
};

export function attachmentCount(subject, n, target = language) {
  const category = target === 'fr' ? n === 1 ? 'one' : 'other' : new Intl.PluralRules(LOCALES[target]).select(n);
  const noun = ATTACHMENTS[target][category] ?? ATTACHMENTS[target].other;
  return `${subject} • ${new Intl.NumberFormat(LOCALES[target]).format(n)} ${noun}`;
}

export function attachmentTitle(subject, n, target = language) {
  return attachmentCount(subject || translateUi('(ohne Betreff)', target), n, target);
}

export function formatAttachmentDate(value, target = language) {
  if (value === null || value === undefined || value === '') return '–';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(LOCALES[target] ?? LOCALES.de);
}

export function formatFileSize(value, target = language) {
  let n = Number(value) || 0;
  const locale = LOCALES[target] ?? LOCALES.de;
  if (n < 1024) return new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(n) + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let index = -1;
  do { n /= 1024; index++; } while (n >= 1024 && index < units.length - 1);
  const digits = n < 10 ? 2 : n < 100 ? 1 : 0;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n) + ' ' + units[index];
}

export function optionLabel(value, label) {
  if (/^[A-Z]{2}$/.test(value) && !/^X[A-D]$/.test(value)) {
    const name = new Intl.DisplayNames([getLocale()], { type: 'region', fallback: 'none' }).of(value);
    if (name) return `${value} — ${name}`;
  }
  const synthetic = /^([A-Z]{2} [—–] )(.+)$/.exec(label);
  return synthetic ? synthetic[1] + translateUi(synthetic[2]) : translateUi(label);
}

export function originalSourceNote(select, enabled) {
  const parent = select.parentElement;
  let note = parent.querySelector('[data-ui-original-note]');
  if (!enabled) { note?.remove(); return; }
  if (!note) { note = document.createElement('small'); note.dataset.uiOriginalNote = ''; note.className = 'muted'; parent.append(note); }
  note.textContent = ORIGINAL[language];
}

const literal = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
let patterns = [];
function compilePatterns(bundle) { return Object.entries(bundle.texts).flatMap(([source, text]) => {
  const matches = [...source.matchAll(/\{(slot\d+)\}/g)];
  if (!matches.length) return [];
  let pos = 0;
  const parts = matches.map(match => {
    const part = literal(source.slice(pos, match.index)) + '([\\s\\S]*?)';
    pos = match.index + match[0].length;
    return part;
  });
  return [{ pattern: new RegExp('^' + parts.join('') + literal(source.slice(pos)) + '$'), names: matches.map(m => m[1]), text, specificity: source.replace(/\{slot\d+\}/g, '').length }];
}).sort((a, b) => b.specificity - a.specificity); }

/** Match registered UI literals/templates; substitution values remain unchanged. */
export function translateUi(value, target = language) {
  if (!valid(target)) target = 'de';
  const source = normalize(String(value));
  const attachment = /^(.*) • (\d+) Anhang(?:e|änge)?$/.exec(String(value).trim());
  if (attachment) return attachmentCount(attachment[1], Number(attachment[2]), target);
  const bundle = catalogs.get(target);
  if (!bundle && catalogs.keys.includes(source)) throw new Error('Load the requested UI language before rendering it');
  let text = bundle && Object.hasOwn(bundle.texts, source) ? bundle.texts[source] : undefined;
  if (text === undefined) {
    for (const entry of target === language ? patterns : bundle ? compilePatterns(bundle) : []) {
      const match = entry.pattern.exec(String(value).trim());
      if (!match) continue;
      const params = Object.fromEntries(entry.names.map((name, index) => [name, match[index + 1]]));
      text = entry.text.replace(/\{(slot\d+)\}/g, (original, name) => params[name] ?? original);
      break;
    }
  }
  if (text === undefined) return value;
  const leading = String(value).match(/^\s*/)[0], trailing = String(value).match(/\s*$/)[0];
  return leading + text + trailing;
}

const catalogs = createUiCatalogStore();
export const uiCatalogDiagnostics = () => catalogs.diagnostics();
function showLoadError(failed) {
  document.querySelector('[data-ui-load-error]')?.remove();
  const box = document.createElement('div'), message = document.createElement('p'), retry = document.createElement('button');
  box.dataset.uiLoadError = ''; box.dataset.i18nOriginal = ''; box.setAttribute('role', 'alert'); box.lang = language;
  message.textContent = BOOT[language].error + ' ' + UI_NAMES[failed];
  retry.textContent = BOOT[language].retry; retry.addEventListener('click', () => void setLanguage(failed));
  box.append(message,retry); document.body.prepend(box);
  const picker=document.querySelector('[data-ui-language]'); if(picker)picker.value=language;
}
async function initialize() {
  let choice=language;
  const states=typeof document==='undefined'?[]:[...document.body.children].map(node=>({node,hidden:node.hidden}));
  states.forEach(({node})=>{node.hidden=true;});
  while(true) {
    try {const bundle=await catalogs.load(choice);catalogs.activate(choice,bundle);language=choice;patterns=compilePatterns(bundle);states.forEach(({node,hidden})=>{node.hidden=hidden;});return;}
    catch(error) {
      if(typeof document==='undefined')throw error;
      choice=await new Promise(resolve=>{
        const box=document.createElement('div'),message=document.createElement('p'),retry=document.createElement('button');
        box.dataset.i18nOriginal='';box.setAttribute('role','alert');box.lang=choice;
        message.textContent=BOOT[choice].error;retry.textContent=BOOT[choice].retry;
        retry.onclick=()=>{box.remove();resolve(choice);};box.append(message,retry);
        if(choice!=='de'){const fallback=document.createElement('button');fallback.textContent=BOOT[choice].fallback;fallback.onclick=()=>{box.remove();resolve('de');};box.append(fallback);}
        document.body.prepend(box);
      });
    }
  }
}
await initialize();

const originals = new WeakMap();
const attributes = new WeakMap();
const EXCLUDE = 'script,style,code,pre,textarea,[data-i18n-original],.text-body';
function textNode(node) {
  if (!node.parentElement || node.parentElement.closest(EXCLUDE) || !node.data.trim()) return;
  const prior = originals.get(node);
  const source = prior && node.data === prior.last ? prior.source : node.data;
  const result = translateUi(source);
  originals.set(node, { source, last: result });
  if (node.data !== result) node.data = result;
}
function element(node) {
  if (node.closest(EXCLUDE)) return;
  const prior = attributes.get(node) ?? {};
  for (const name of ['title', 'aria-label', 'placeholder', 'alt']) {
    if (!node.hasAttribute(name)) continue;
    const current = node.getAttribute(name), stored = prior[name];
    const source = stored && current === stored.last ? stored.source : current;
    const result = translateUi(source);
    prior[name] = { source, last: result };
    if (current !== result) node.setAttribute(name, result);
  }
  attributes.set(node, prior);
}
export function translateTree(root) {
  if (root.nodeType === 3) return textNode(root);
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  if (root.nodeType === 1) element(root);
  const walker = document.createTreeWalker(root, 1 | 4);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === 3) textNode(node); else element(node);
  }
}

let requestId = 0;
export async function setLanguage(next) {
  if (!valid(next)) return false;
  const id = ++requestId;
  try {
    const bundle = await catalogs.load(next);
    if (id !== requestId) return false;
    catalogs.activate(next, bundle);
    language = next;
    patterns = compilePatterns(bundle);
    if(typeof document !== 'undefined') document.querySelector('[data-ui-load-error]')?.remove();
  } catch {
    if (id === requestId && typeof document !== 'undefined') showLoadError(next);
    return false;
  }
  if (typeof window === 'undefined') return true;
  try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* session choice still works */ }
  const url = new URL(window.location.href);
  url.searchParams.set('ui_lang', language);
  window.history.replaceState(null, '', url);
  document.documentElement.lang = language;
  const notice = document.querySelector('[data-ui-translation-notice]');
  if (notice) { notice.textContent = DRAFT_NOTICES[language]; notice.hidden = language === 'de' || language === 'en'; }
  const picker = document.querySelector('[data-ui-language]');
  if (picker) {
    picker.value = language;
    picker.setAttribute('aria-label', LABELS[language]);
    picker.closest('label').querySelector('span').textContent = LABELS[language];
  }
  translateTree(document.body);
  window.dispatchEvent(new CustomEvent('optai:languagechange', { detail: { language } }));
  return true;
}

export function startUiLocalization() {
  if (document.querySelector('[data-ui-language]')) return;
  const bar = document.createElement('div');
  bar.className = 'ui-language-bar';
  bar.dataset.i18nOriginal = '';
  const label = document.createElement('label'), caption = document.createElement('span'), select = document.createElement('select');
  caption.textContent = LABELS[language];
  select.dataset.uiLanguage = '';
  select.setAttribute('aria-label', LABELS[language]);
  for (const value of UI_LANGUAGES) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = UI_NAMES[value];
    select.append(option);
  }
  select.value = language;
  select.addEventListener('change', () => setLanguage(select.value));
  label.append(caption, select);
  bar.append(label);
  document.body.prepend(bar);
  const notice = document.createElement('p');
  notice.dataset.uiTranslationNotice = '';
  notice.dataset.i18nOriginal = '';
  notice.className = 'ui-translation-notice';
  notice.textContent = DRAFT_NOTICES[language];
  notice.hidden = language === 'de' || language === 'en';
  bar.after(notice);
  try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* session choice still works */ }
  document.documentElement.lang = language;
  translateTree(document.body);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData' || record.type === 'attributes') translateTree(record.target);
      else for (const node of record.addedNodes) translateTree(node);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder', 'alt'] });
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin && /(?:\.html|\/)\/?$/.test(url.pathname)) {
      url.searchParams.set('ui_lang', language);
      anchor.href = url.href;
    }
  });
  return () => observer.disconnect();
}
