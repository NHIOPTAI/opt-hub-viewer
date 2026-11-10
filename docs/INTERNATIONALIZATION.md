# Public UI localization

The interface supports DE, EN, RO, FR, ES, IT, PL and NL. The six additional languages remain drafts and show a native notice. Technical coverage does not constitute linguistic or customs-specialist approval.

`docs/assets/i18n/catalogs.js` is the offline authoring source. It is not imported by the runtime. Generate the eight content-addressed JSON assets and their small manifest with `npm run generate:i18n`. Only the selected language is fetched. The application retains the current and previous dictionaries; switching through all languages does not retain eight dictionaries in the JavaScript module cache.

The URL parameter `ui_lang` takes precedence over the stored browser choice (`optai.platform.language`), with German as the default. Same-origin HTML navigation carries the choice. On a failed switch the previous interface and form values remain; retry is explicit. Initial failure shows native recovery controls, including an explicit German fallback. There is no automatic partial-dictionary fallback.

Migration for callers of the UI helper: `setLanguage(code)` now returns `Promise<boolean>`. Await it before reading the new language or translating registered UI strings into that language. The built-in picker and tests use the asynchronous transition. `getLanguage()` and translation of the active, loaded catalog remain synchronous; original unknown strings remain unchanged. This does not change any Rules API request or response contract.

API examples, identifiers, substitutions, customer inputs and the original DE/EN/FR rule texts are not translated. UI localization does not choose a rule set or calculate preferential origin. Public recordings must remain synthetic ZZ data.

Run `npm run verify` before release review. It includes asset freshness, exact key/placeholder coverage, encoding and size budgets, the complete tests and the unchanged public-safe guard. `node tools/i18n/check.mjs --release` deliberately fails while linguistic approval is pending. Unit tests read generated local JSON through a test-only fixture loader; the browser runtime has no filesystem dependency.

Publish HTML, JavaScript, the manifest and all referenced language assets together. Retain already published hashed assets while old tabs may request another language. Do not remove such assets merely because they are absent from the latest manifest. A version mismatch fails with recovery controls. A controlled rollback restores the previous complete public artifact. No API, data migration or service configuration is needed for this UI change.

## Staged release candidate

Normal remote hosting offers DE/EN. Existing localhost, loopback and file-based Owner previews retain all eight authored languages. The preview policy follows the module origin, independent of query parameters. It is a local review facility. Remote Owner-only access would need its own approved access control.

Prepare a separate stable candidate with `node tools/i18n/prepare-stable.mjs --out <new-directory-outside-this-repository>`. The candidate freezes the picker and loader to DE/EN even on localhost, removes draft JSON payloads and the full offline authoring catalog, and passes the existing public-safe guard before and after preparation. Source files and already published assets stay preserved in this checkout. Publish only a separately approved complete candidate. A saved draft-language preference resolves to German in this profile. New EN copy still requires specialist and Owner acceptance.
