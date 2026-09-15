# Design decisions

Every judgement call made while implementing `design/Portfolio.dc.html` as a
deployable site, and why.

The governing rule throughout: **the design is the source of truth for
appearance.** Colors, type ramp, spacing, radii, shadows and every animation
constant were lifted unchanged. Decisions below are about *form* — how to
express the design in deployable code — plus a small set of additions the design
did not cover.

---

## 1. Ported the design rather than shipping the `.dc.html`

**Decision.** Build `index.html` + `assets/css/styles.css` + `assets/js/main.js`
as a dependency-free static site, and keep the `.dc.html` in `design/` as
reference.

**Why.** `Portfolio.dc.html` is a Design Component, not a web page. It cannot be
deployed as-is:

- it has no rendered markup — the body is a `<x-dc>` template
- it needs `window.React`, `window.ReactDOM` and `support.js` before anything
  renders
- `<sc-for>` / `<sc-if>` / `{{holes}}` are resolved by that runtime
- `style-hover="..."` is a runtime-only attribute; browsers ignore it
- its logic is `class Component extends DCLogic`, which only exists inside the
  runtime

Shipping it would mean shipping a design tool to visitors. A portfolio should be
fast and dependency-free.

**Translation applied:**

| Design construct | Implementation |
| --- | --- |
| `React.createRef()` + `ref="{{ x }}"` | element `id` + `querySelector` |
| `data-props` editor tweaks | `CFG` object + CSS custom properties |
| `style-hover="..."` | real CSS `:hover` rules |
| `<sc-for list="{{ services }}">` | static markup + `accordion()` |
| `<sc-if value="{{ s.isOpen }}">` | `hidden` + `aria-expanded` |
| `state` / `setState` | DOM state read from `aria-expanded` |
| `componentDidMount` | `DOMContentLoaded` |
| `this.on()` / `this.loop()` cleanup | module-scope `on()` / `loop()` |

---

## 2. Page tone is `#dbe3dc`, not the `#e9e5da` in the stylesheet

**Decision.** `--paper: #dbe3dc` ("Celadon mist").

**Why.** The design's `<helmet>` sets `body { background: #e9e5da }`, but that is
not what renders. `pageTone` defaults to `'Celadon mist'`, and `componentDidMount`
calls `paint()`, which runs `document.body.style.background = this.tone` and sets
`--paper`. The inline `#e9e5da` is overwritten before first paint. `#dbe3dc` is
what the design actually looks like.

The other five tones are listed in a comment beside the token.

**Consequence worth knowing.** `TONE` in `main.js` duplicates this value because
the canvases fill their own background. Changing `--paper` alone leaves the hero
and contact canvases painting the old color. Both are flagged in the README.

---

## 3. Theme tweaks baked in as tokens, not a live switcher

**Decision.** Ship the defaults as `:root` custom properties; no UI control.

**Why.** `pageTone`, `accentColor`, `gridSpacing`, `fogIntensity` and `influence`
are *authoring* affordances — chips above the artboard in the design editor. A
visitor to a portfolio has no reason to recolor it, and a theme picker would be a
feature the design never asked for. Keeping them as tokens preserves the full
range for the author at zero cost to the visitor.

Open to reversing — see `OPEN-QUESTIONS.md` #2.

---

## 4. Marquee animates the container at `-50%`

**Decision.** Animate `.marquee` by `-50%` with an even number of identical
tracks, and clone tracks in pairs via JS on wide viewports.

**Why.** First attempt animated each `.marquee__track` by `-100%`, which is
wrong: both tracks translate by their own width simultaneously, leaving a gap
after the last one. The design's approach is correct — the strip holds two
identical halves and moves by exactly half its width, so the seam is invisible.

**Why the JS was still needed.** `-50%` is only seamless if one half is at least
viewport-wide. The secondary row measures ~2040px; at 2560px a gap would appear
at the seam. `marquees()` measures a track and clones in **pairs** — keeping the
count even, so the halves stay equal and the `-50%` math holds. Verified at
2560px: 4 tracks, half-width 3971px and 3650px, both exceeding the viewport.

---

## 5. Section links hidden below 900px

**Decision.** `.nav__links { display: none }` under 900px. No hamburger.

**Why.** The design has no mobile navigation. At 390px the four links plus the
status pill and the CTA cannot fit on one line; letting them wrap produces a
three-row floating bar covering the hero. Hiding them keeps the nav to its two
most useful elements — availability status and "Let's Talk" — on a single-page
site where scrolling reaches everything.

This is the decision most likely to want revisiting. See `OPEN-QUESTIONS.md` #3.

Related: `.nav__pill-text` is also hidden under 620px, leaving the pulsing green
status dot alone.

---

## 6. Accordion rewritten as a real disclosure widget

**Decision.** Native `<button>`s with `aria-expanded` / `aria-controls`, panels
toggled with the `hidden` property, exclusive open, click-again to close.

**Why.** The design's `<sc-if>` simply removed the panel from the tree with no
accessibility semantics. Exclusive-open and the `+` / `–` sign flip reproduce
`this.state.open` exactly, including `-1` for "all closed". Using `hidden`
rather than `display` keeps the toggle in one property and matches the base
reset.

Item 01 ships open, matching the design's `state = { open: 0 }`.

---

## 7. Project links added to the work cards

**Decision.** "Repo" and "Live demo" links on the two project cards, and the
Appwrite PR badge made a real link.

**Why.** The design's cards were unlinked — a portfolio whose projects cannot be
opened is doing half its job, and the resume carried the real URLs as embedded
hyperlinks. Nothing was invented; see `PROJECT-DATA.md` for the extracted set.
Styled as `.link-arrow` (underline + `↗`) to stay subordinate to the existing
chips rather than competing with the section's one primary action.

---

## 8. Two empty `<span>`s removed

**Decision.** Dropped `<span style="font-size:12px"></span>` from the nav CTA and
`<span><br></span>` from the contact CTA.

**Why.** Both are empty elements sitting where an icon or emoji was removed
during design editing. They render nothing and only add a stray flex `gap`.
Rather than guess at a missing icon, they were removed — the design's own icon
language elsewhere is inline SVG, and the buttons read cleanly without them.

---

## 9. Cursor elements moved to the top level

**Decision.** `#cursorRing` / `#cursorDot` are siblings of `<nav>`, not children
of the nav pill.

**Why.** In the design they are nested inside `[data-nav-pill]`, which is a
design-tool placement artifact — both are `position: fixed` with their own
`z-index`, so nesting changes nothing visually but makes them inherit the nav's
stacking and opacity animation. Hoisting them removes that coupling with no
visual change.

---

## 10. Additions the design did not cover

Made deliberately, because the design was a visual artboard and a shipped site
carries obligations an artboard does not.

- **Skip link, `<main>`, `aria-labelledby` on every section** — none existed.
- **`:focus-visible`** — the design styled hover only; keyboard users had no
  visible focus at all.
- **`prefers-reduced-motion`** — the design exposed `reduceMotion` as a manual
  toggle. Bound to the OS setting instead, since nobody finds a toggle that
  isn't there. Stops marquees, letter tilt, count-up, canvas drift and ball
  physics.
- **Coarse-pointer guard** — custom cursor and pointer-driven canvas warps
  suppressed on touch, where they are meaningless.
- **Screen-reader skills list** — the marquee is `aria-hidden` (duplicated,
  scrolling text), so the full skill set is repeated as visually-hidden text.
  Otherwise the stack section is invisible to assistive tech.
- **`scroll-margin-top: 92px`** — anchors landed flush at `top: 0`, putting each
  section heading under the fixed nav. Verified: `#oss` now lands at 92px.
- **`<title>`, description, Open Graph tags, SVG favicon** — a deployable page
  needs them; an artboard does not.
- **`resize` listener on `progress()`** — the scroll fraction depends on
  `innerHeight`, which the design only sampled on scroll.

---

## 11. Mobile refinements beyond the design's breakpoints

The design relied entirely on `clamp()` and `auto-fit` grids, which mostly hold
up. Three places needed help at 390px:

- `.name__row` — `justify-content: space-between` pushed the two name words to
  opposite edges once wrapped; switched to flex-start so the name reads as a
  block.
- `.stats` — forced to one column; two columns of `clamp(30px, 3.6vw, 46px)`
  numerals plus labels were unreadably tight.
- `.arena` — full width and 150px tall so the rolling social balls keep room to
  move.

---

## 12. Structure and naming

**Decision.** BEM-ish classes in an external stylesheet, rather than the
design's inline styles.

**Why.** The design uses inline `style="..."` throughout because that is what its
properties panel edits. In shipped code that prevents `:hover`, `:focus-visible`
and media queries from working at all, and repeats identical declarations dozens
of times. Classes also make the file readable — `.chip`, `.term`, `.card` each
defined once.

Kept flat: no preprocessor, no build step, no framework. The whole site is three
files plus a README.
