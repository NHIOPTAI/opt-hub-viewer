import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { CATALOGS } from '../docs/assets/i18n/catalogs.js'
import fs from 'node:fs'

const languages = ['de', 'en', 'ro', 'fr', 'es', 'it', 'pl', 'nl']
const vars = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()
test('public UI catalogs cover every captured key in eight languages and preserve variables', () => {
  assert.ok(Object.keys(CATALOGS).length > 300)
  for (const [source, texts] of Object.entries(CATALOGS)) {
    assert.deepEqual(Object.keys(texts).sort(), [...languages].sort(), source)
    for (const language of languages) {
      assert.ok(texts[language].trim(), `${language}: ${source}`)
      assert.deepEqual(vars(texts[language]), vars(source), `${language}: ${source}`)
      assert.doesNotMatch(texts[language], /▁|9876\d{3}/)
    }
  }
})

test('switches all languages without losing inputs or changing original texts, JSON, identifiers and substitutions', async () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <h1>Stichtag</h1><button title="Request kopieren">Ausführen</button>
    <input id="entry" placeholder="z. B. 850760" value="ZZ-UNSAVED" />
    <textarea>Ursprüngliche Kundeneingabe</textarea>
    <div class="text-body" lang="de">Stichtag</div><pre>Stichtag {"ContentId":"ZZ_TEST"}</pre>
    <p id="dynamic">Testfall ZZ-&lt;unsafe&gt;</p><div id="target"></div>
  </body></html>`, { url: 'https://viewer.example.invalid/rules-demo.html?mode=offline&rules_session=ready' })
  for (const key of ['window', 'document', 'MutationObserver', 'CustomEvent']) globalThis[key] = key === 'window' ? dom.window : dom.window[key]
  try {
    const ui = await import('../docs/assets/i18n/ui.js?dom-contract')
    const stop = ui.startUiLocalization()
    const input = document.getElementById('entry'), original = document.querySelector('.text-body').textContent
    for (const language of [...languages, 'de', 'fr', 'ro', 'en']) {
      assert.equal(ui.setLanguage(language), true)
      await new Promise(resolve => setTimeout(resolve, 0))
      assert.equal(document.documentElement.lang, language)
      assert.equal(document.querySelector('h1').textContent, CATALOGS.Stichtag[language])
      assert.equal(input.value, 'ZZ-UNSAVED')
      assert.equal(document.querySelector('textarea').value, 'Ursprüngliche Kundeneingabe')
      assert.equal(document.querySelector('.text-body').textContent, original)
      assert.equal(document.querySelector('pre').textContent, 'Stichtag {"ContentId":"ZZ_TEST"}')
      assert.equal(document.getElementById('dynamic').textContent.includes('ZZ-<unsafe>'), true)
      assert.equal(document.getElementById('dynamic').children.length, 0)
      assert.equal(window.localStorage.getItem('optai.platform.language'), language)
      assert.equal(new URL(window.location.href).searchParams.get('mode'), 'offline')
      assert.equal(new URL(window.location.href).searchParams.get('ui_lang'), language)
    }
    document.getElementById('target').textContent = 'Keine Einträge.'
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(document.getElementById('target').textContent, CATALOGS['Keine Einträge.'].en)
    assert.equal(ui.setLanguage('xx'), false)
    stop()
  } finally {
    dom.window.close()
    for (const key of ['window', 'document', 'MutationObserver', 'CustomEvent']) delete globalThis[key]
  }
})

test('restores a stored language on reload and rejects an unknown query preference', async () => {
  const dom = new JSDOM('<!DOCTYPE html><body><h1>Stichtag</h1></body>', { url: 'https://viewer.example.invalid/downloads.html?ui_lang=xx' })
  dom.window.localStorage.setItem('optai.platform.language', 'ro')
  for (const key of ['window', 'document', 'MutationObserver', 'CustomEvent']) globalThis[key] = key === 'window' ? dom.window : dom.window[key]
  try {
    const ui = await import('../docs/assets/i18n/ui.js?reload-contract')
    const stop = ui.startUiLocalization()
    assert.equal(ui.getLanguage(), 'ro')
    assert.equal(document.querySelector('h1').textContent, CATALOGS.Stichtag.ro)
    stop()
  } finally {
    dom.window.close()
    for (const key of ['window', 'document', 'MutationObserver', 'CustomEvent']) delete globalThis[key]
  }
})

test('attachment counts use the locale plural rules and preserve the original subject', async () => {
  const ui = await import('../docs/assets/i18n/ui.js?counts')
  assert.equal(ui.attachmentCount('ZZ  Customer', 2, 'pl'), 'ZZ  Customer • 2 załączniki')
  assert.equal(ui.attachmentCount('ZZ  Customer', 5, 'pl'), 'ZZ  Customer • 5 załączników')
  assert.equal(ui.attachmentCount('ZZ', 20, 'ro'), 'ZZ • 20 de atașamente')
  assert.equal(ui.attachmentCount('ZZ', 1, 'fr'), 'ZZ • 1 pièce jointe')
  assert.equal(ui.attachmentCount('ZZ', 0, 'fr'), 'ZZ • 0 pièces jointes')
  assert.equal(ui.translateUi('ZZ  Customer • 2 Anhange', 'en'), 'ZZ  Customer • 2 attachments')
  for (const original of ['constructor', 'toString', '__proto__']) for (const language of languages) assert.equal(ui.translateUi(original, language), original)
})

test('the real response renderer formats amounts and dates in all eight locales', async () => {
  const ui = await import('../docs/assets/i18n/ui.js')
  const render = await import('../docs/assets/devhub/render.js')
  try {
    for (const language of languages) {
      ui.setLanguage(language)
      const locale = ui.getLocale()
      assert.equal(render.formatInt(12345.6), new Intl.NumberFormat(locale).format(12346))
      assert.equal(render.germanDate('2026-11-09'), new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date('2026-11-09T00:00:00Z')))
      assert.equal(render.germanDate('2026-13-99'), '2026-13-99')
      assert.ok(render.validityText('01.01.2024', '9999-12-31').includes(render.germanDate('2024-01-01')))
      assert.ok(render.validityText('01.01.2024', '9999-12-31').includes(CATALOGS['(unbefristet)'][language]))
    }
  } finally { ui.setLanguage('de') }
})

test('the attachment page switches metadata formats without refetching or translating original names', async () => {
  const html = fs.readFileSync(new URL('../docs/attachments.html', import.meta.url), 'utf8')
  const dom = new JSDOM(html, { url: 'https://viewer.example.invalid/attachments.html?ui_lang=ro', runScripts: 'outside-only' })
  dom.window.localStorage.setItem('attachmentsUi', JSON.stringify({ api: 'https://api.example.invalid' }))
  const data = { items: [
    { subject: 'Stichtag', from: 'Stichtag', to: 'Quelle', date: '2026-11-09T12:34:00Z', meta_key: 'ZZ-META', attachments: [{ key: 'ZZ/Stichtag', type: 'Stichtag', size: 1536, url: 'https://files.example.invalid/ZZ' }] },
    { subject: null, from: '-', to: '-', date: '-', meta_key: 'ZZ-EMPTY', attachments: [] },
  ] }
  const before = structuredClone(data)
  let requests = 0
  for (const key of ['window', 'document', 'MutationObserver', 'CustomEvent']) globalThis[key] = key === 'window' ? dom.window : dom.window[key]
  let stop
  try {
    const ui = await import('../docs/assets/i18n/ui.js?attachment-page-contract')
    const application = [...document.querySelectorAll('script[type="module"]')].find(script => script.textContent.includes('formatAttachmentDate'))
    assert.ok(application, 'the real attachment application imports the locale formatters')
    const body = application.textContent.replace(/^\s*import\s*\{[^}]+\}\s*from\s*[^;]+;\s*/, '')
    const run = new Function('window', 'document', 'localStorage', 'fetch', 'formatAttachmentDate', 'formatFileSize', 'attachmentTitle', body)
    run(window, document, window.localStorage, async () => { requests++; return { ok: true, json: async () => data } }, ui.formatAttachmentDate, ui.formatFileSize, ui.attachmentTitle)
    stop = ui.startUiLocalization()
    for (let i = 0; i < 20 && !document.querySelector('[data-ui-date]'); i++) await new Promise(resolve => setTimeout(resolve, 5))
    assert.ok(document.querySelector('[data-ui-date]'))
    const input = document.getElementById('q')
    input.value = 'ZZ-UNSAVED'
    const locales = ['de-DE', 'en-GB', 'ro-RO', 'fr-FR', 'es-ES', 'it-IT', 'pl-PL', 'nl-NL']
    for (const [index, language] of languages.entries()) {
      ui.setLanguage(language)
      await new Promise(resolve => setTimeout(resolve, 0))
      const title = document.querySelector('[data-ui-subject]')
      assert.equal(title.textContent, ui.attachmentTitle('Stichtag', 1, language))
      assert.equal(document.querySelectorAll('[data-ui-subject]')[1].textContent, ui.attachmentTitle('', 0, language))
      assert.equal(document.querySelector('[data-ui-date]').textContent, new Date(data.items[0].date).toLocaleString(locales[index]))
      assert.equal(document.querySelector('[data-ui-size]').textContent, new Intl.NumberFormat(locales[index], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1.5) + ' KB')
      assert.ok([...document.querySelectorAll('[data-i18n-original]')].some(node => node.textContent === 'Quelle'))
      assert.equal(input.value, 'ZZ-UNSAVED')
      assert.equal(requests, 1)
    }
    assert.deepEqual(data, before)
    assert.equal(ui.formatAttachmentDate('ZZ-invalid-date', 'fr'), 'ZZ-invalid-date')
  } finally {
    stop?.()
    dom.window.close()
    for (const key of ['window', 'document', 'MutationObserver', 'CustomEvent']) delete globalThis[key]
  }
})
