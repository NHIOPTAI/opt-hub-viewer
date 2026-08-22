# OPT.AI Viewer Design Guide

Practical developer reference, not a marketing CI document. **Read this
before building a new page in this repository.** Everything below is
derived from the two pages that already exist and ship live — nothing
here is invented ahead of need.

## 1. References

- **Leading reference: `docs/downloads.html`.** This is the primary
  visual style for OPT.AI Viewer/Tool pages. When in doubt, match
  `downloads.html`.
- **Supplementary reference: `docs/rules-demo.html`.** Adds a few good
  patterns `downloads.html` doesn't need (active nav state, technical
  status/details components, pills/badges, forms). These are additive,
  not a competing style — `downloads.html` stays the senior reference.

## 2. Ground rule

**Reuse existing components first.** Only invent a new variant when an
existing one genuinely doesn't fit the fachliche need — and when you
do, keep it inside the existing token system (colors, spacing, border
treatment) rather than starting a new visual language. Every component
in this guide already exists in one of the two reference pages; this
document just names and collects them.

## 3. Design character

Professional, calm, modern, international-trade/B2B, technically
clear. No playful consumer-UI patterns, no heavy marketing layout, no
glassmorphism, no drop shadows, no animation beyond the existing
`0.2s ease` hover transitions on buttons/tiles.

## 4. Color tokens

Defined as CSS custom properties on `:root` in every page (copy this
block verbatim into new pages, and add page-specific tokens the same
way `rules-demo.html` added `--ex-*` for its EX/warning use case):

```css
:root {
  --bg: #f5f3ef;
  --surface: #efebe5;
  --card: #f3efe9;
  --text: #111111;
  --muted: #555555;
  --border: #ddd6ce;
  --button-dark: #1f1f24;
  --button-dark-hover: #111111;
  --button-light: #f5f3ef;
  --button-light-border: #222222;
}
```

`rules-demo.html` additionally defines (a page can add its own such
tokens the same way — these three are reusable wherever a warm accent,
an error color, or a success color is needed elsewhere too):

```css
--ex-bg: #fbeed6;     /* warm amber notice background */
--ex-border: #c98a2c; /* warm amber notice border */
--ex-text: #7a4a05;   /* warm amber notice/accent text — also used
                          for the Rules Demo hero eyebrow label */
--err: #b91c1c;        /* error red */
--ok: #0f766e;          /* success teal-green */
```

`downloads.html` uses the equivalent error/success colors as inline
hex (`#b91c1c`, `#0f766e`) rather than variables — a pre-existing minor
inconsistency, not something this guide asks you to go fix
retroactively, but a new page should use the `--err`/`--ok` variable
form.

**Warm brown/copper/beige accents** come from `--ex-*` (reused on both
pages as the hero eyebrow color, `--ex-text: #7a4a05`) and from the
`docs/assets/opt-container.png` photo itself, used in the Standard Hero
component (§9). There is no separate "brand copper" hex constant beyond
`--ex-*` — reuse it rather than picking a new value.

## 5. Typography

- **Font**: `Arial, Helvetica, sans-serif` everywhere. No web fonts, no
  `@font-face`, no Google Fonts. Do not introduce one.
- **Body**: `line-height: 1.5`, base color `var(--text)` on
  `var(--bg)`.
- **H1** (page hero title): `font-size` 40–58px depending on how much
  else sits in the hero (`downloads.html` 58px on a two-column hero
  with room to breathe; `rules-demo.html` 40–44px in a denser,
  single-column hero), `line-height: 1.08–1.1`, `font-weight: 500`
  (not 700 — headings are medium-weight, not bold, in this system),
  `max-width` around 720–780px so long titles don't stretch full
  container width.
- **Section H2**: 26–34px, `font-weight: 500`.
- **H3** (card/subsection titles): 18–19px, `font-weight: 700`.
- **Body/intro paragraphs**: 16–18px, `color: var(--muted)`,
  constrained `max-width` (650–900px) so text columns stay readable.
- **Small meta/label text** (pills, hints, IDs): 12–15px, often
  `color: var(--muted)`.
- **Brand mark** (`.brand`, top-left "opt"): 20px, `font-weight: 700`,
  `letter-spacing: 0.02em`.

## 6. Layout / spacing

- **Container**: `max-width: 1180px; margin: 0 auto; padding: 0 28px;`
  — every page wraps its content in this. Don't invent a different max
  width for a new page.
- **Topbar**: `padding: 24px 0`, flex row, brand left / nav right
  (`justify-content: space-between`).
- **Hero section**: `padding: 40px 0 30px` to `40px 0 70px` depending
  on content density.
- **Content section** (`.section`): `padding: 70px 0` (or 40px on a
  denser page like `rules-demo.html`), `background: #faf8f5` (a
  slightly warmer off-white than `--bg`, used to visually separate
  hero from content), `border-top: 1px solid var(--border)`.
- **Border radius: 0, everywhere**, on cards, buttons, panels,
  images — this is a deliberate, consistent trait of the whole system,
  not an oversight. The only exception is the inline `<code>` tag
  (`border-radius: 4px`) and, as of this AUFTRAG, the same
  zero-radius rule extended to the new hero image/panel. Do not add
  rounded corners to a new component.
- **Grids**: `display: grid; grid-template-columns: repeat(N, minmax(0,1fr)); gap: 14–48px;`
  — used for hero two-column splits, card rows (2 or 3 columns), and
  tile pickers. Collapse to `1fr` (or `1fr 1fr` as an intermediate
  step) at the breakpoints below.

## 7. Responsive breakpoints

Both pages use the same two breakpoints — reuse them, don't add a
third unless truly necessary:

- **`@media (max-width: 960px)`**: collapse multi-column grids to
  fewer columns, shrink the H1, shrink hero imagery/padding.
- **`@media (max-width: 620px)`**: collapse remaining grids to a
  single column (forms, cards).

## 8. Navigation

Structure (identical markup on every page, in `<header class="topbar">`):

```html
<header class="topbar">
  <div class="container topbar-inner">
    <div class="brand">opt</div>
    <nav class="nav">
      <a href="https://opt-hub.ai">Home</a>
      <a href="/downloads.html">Downloads</a>
      <a href="/rules-demo.html">Rules Demo</a>
    </nav>
  </div>
</header>
```

CSS:

```css
.nav { display: flex; gap: 28px; font-size: 15px; }
.nav a { color: var(--text); text-decoration: none; }
.nav a.current { font-weight: 700; border-bottom: 2px solid var(--text); }
```

**Active state**: add `class="current"` to the `<a>` matching the page
you're on (and only that one). This is the one navigation pattern
`rules-demo.html` introduced first and `downloads.html` has since
adopted — both pages now use it identically. A new page must add
itself to this same nav list on **both** existing pages (and any
further new page), and mark itself `current` on its own page only.

## 9. Components

### Buttons

```css
.btn { display:inline-block; padding:13px 22px; border-radius:0; text-decoration:none; font-size:15px; font-weight:600; transition:0.2s ease; cursor:pointer; }
.btn-primary { background:var(--button-dark); color:white; border:1px solid var(--button-dark); }
.btn-primary:hover { background:var(--button-dark-hover); }
.btn-secondary { background:transparent; color:var(--text); border:1px solid var(--button-light-border); }
.btn-secondary:hover { background:#ebe7e1; }
```

`rules-demo.html` adds a `.btn-small` modifier (`padding:8px 12px; font-size:13px;`)
for compact/secondary actions (e.g. dev-tool buttons) — reuse it
instead of inventing another button size.

### Cards / panels

Three near-identical white/near-white bordered boxes, `border-radius:0`,
`border:1px solid var(--border)`, differing only in background and
purpose — reuse the one that matches your content, don't invent a
fourth:

- **`.status-card`**: `background:white; padding:22–24px;` — the
  general-purpose panel (status messages, forms sit inside a
  `.form-card` variant of this, result summaries, etc.).
- **`.info-card`**: `background:var(--surface); padding:24px; min-height:220px;`
  — used in a 3-column `.cards` grid for short explanatory blurbs.
- **`.agreement-card`** / **`.ruleset-card`**: `background:white;` flex
  column, used for one structured "item" (an agreement, a RuleSet) in
  a grid or stacked list. `.ruleset-card` adds a 4px left accent
  border (`border-left: 4px solid var(--button-dark)`, switched to
  `var(--ex-border)` for an EX case) — a good pattern to reuse for any
  future "this item has a special flag" case.

### Pills / badges

```css
.pill { display:inline-block; padding:6px 10px; border:1px solid var(--border); background:var(--surface); font-size:13px; }
```
Variants (`rules-demo.html`): `.pill-ex` (amber, `--ex-bg`/`--ex-border`/`--ex-text`,
bold — flags something that needs attention), `.pill-logic` (muted
grey `#e7e2d8`, bold — a neutral structural tag like AND/OR). Reuse
`.pill` plus a new modifier class in this same spirit rather than a
new badge system.

### Status / notice boxes

- **`.status-card` + `.status-title` + `.status-ok`/error color inline**
  — the standard "here's what's happening" box (`downloads.html`'s
  Zugriffsstatus, Content-Auswahl, etc.).
- **`.error-card`** (`rules-demo.html`): same shape, `border:1px solid var(--err)`,
  title colored `--err` — the standard error-state panel.
- **`.scope-note`**: `background:var(--ex-bg); border:1px solid var(--ex-border); color:var(--ex-text); padding:8px 14px;`
  — a compact inline notice/disclaimer banner. Reuse this exact
  pattern for any "important caveat, not an error" message (e.g. "this
  is a demo, not X").

### Technical/expandable details

`rules-demo.html`'s `<details class="tech-details">`/`<details class="raw-json">`
+ `.tech-table` (label/value table) + `pre.raw-json-pre` (monospace,
scrollable, wrapped) is the standard pattern for "collapsed technical
detail a power user can open" — reuse it verbatim for any future raw
data or technical field dump, rather than building a new
expand/collapse component.

### Forms

`.form-card` (a `.status-card`-shaped wrapper) + `.form-grid` (grid of
`.field` blocks) + `.field label`/`.field input,select`/`.field-hint`
is the standard input-form shape (`rules-demo.html`'s country/HS/date/
language form). Reuse it for any future input form rather than
building bespoke form markup.

### Standard Hero / Split Hero

The shared hero pattern on both `downloads.html` and `rules-demo.html`:
one bordered `.hero-panel` (`border: 1px solid var(--border); background: white;`)
containing a `.hero-grid` (`grid-template-columns: 1.85fr 1fr;` — roughly
65/35), text on the left, an optional visual on the right:

```css
.hero-panel { border: 1px solid var(--border); background: white; }
.hero-grid { display: grid; grid-template-columns: 1.85fr 1fr; align-items: stretch; }
.hero-text { padding: 40px; display: flex; flex-direction: column; justify-content: center; }
.hero-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ex-text); margin-bottom: 10px; }
.hero-text h1 { font-size: 40–44px; line-height: 1.1; font-weight: 500; margin: 0 0 10px; }
.hero-claim { font-size: 14px; color: var(--muted); margin: 0 0 16px; }
.hero-text p { font-size: 17px; color: var(--muted); margin: 0; }
.hero-visual { border-left: 1px solid var(--border); height: 320px; overflow: hidden; }
.hero-image { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center center; }
```

Content order inside `.hero-text` is always **Eyebrow → H1 → Claim →
Beschreibung** — reuse that order for any future page's hero rather
than inventing a new one. `--ex-text` is reused here purely as a warm
accent color for the eyebrow (see §4) — it carries no "warning/EX"
meaning outside `rules-demo.html`'s own RuleSet context.

Responsive: keep the two-column split down to the 960px breakpoint
(shrink `.hero-text` padding and `.hero-visual` height instead of
stacking), then collapse `.hero-grid` to one column at 620px, with
`.hero-visual`'s separating border switching from `border-left` to
`border-top` since it now sits below the text rather than beside it.

## 10. Image usage

- **Images are real static assets**, referenced by `<img src="/assets/...">`
  or CSS `background-image: url(...)` pointing at a file under
  `docs/assets/`. **Never Base64-embed an image** into the HTML/CSS —
  keeps the page source readable and lets the browser cache the asset
  independently.
- Keep asset filenames lowercase-kebab-case (`opt-container.png`),
  consistent with every other file in `docs/` (`downloads.html`,
  `rules-demo.html`, `attachments.html`) — avoid spaces in filenames
  used in `src`/`href`, since they need URL-encoding otherwise.
- **Give images a clear, dedicated frame** — a bordered `.hero-visual`
  panel with `object-fit: cover` and a deliberately chosen
  `object-position`, sized so the crop stays mild (a near-square source
  image cropped to a near-square frame keeps the whole motif legible;
  avoid stretching a compact visual into a wide full-bleed banner,
  which forces a much harsher crop) — see the Standard Hero component
  above.
- **Never place text directly on top of a complex/photographic image.**
  Keep image and text in clearly separate regions of the same framed
  panel — side by side (`.hero-grid`, the current standard) or stacked,
  never overlaid.

## 11. Brand claim: "Origin. People. Trade."

May be used as a recurring, understated brand element (small muted
line, not a headline treatment) when it genuinely fits a page's hero
— see `rules-demo.html`'s `.hero-claim`. **Do not** force it onto every
component or repeat it multiple times on one page; it's a occasional
accent, not a persistent watermark.

## 12. Don't invent

No new brand colors, no new fonts, no new border-radius values, no new
shadow/glass effects, no new nav pattern, no new card shape — if
something in section 9 already covers the need, use it. This guide
exists so the next page (built by a person or by Claude/Codex) starts
from the same components instead of re-deriving the design from
scratch or drifting into a new style per page.
