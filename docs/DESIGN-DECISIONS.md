# Design decisions

Every judgement call made while implementing `Portfolio.dc.html` (from the
Claude Design project) as a deployable site, and why.

The governing rule throughout: **the design is the source of truth for
appearance.** Colors, type ramp, spacing, radii, shadows and every animation
constant were lifted unchanged. Decisions below are about *form* — how to
express the design in deployable code — plus a small set of additions the design
did not cover.

---

## 1. Ported the design rather than shipping the `.dc.html`

**Decision.** Build `index.html` + `assets/css/styles.css` + `assets/js/main.js`
as a dependency-free static site. The `.dc.html` source is not vendored — see
decision 13.

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

## 5. Drawer navigation below 900px

**Decision.** Below 900px the inline links are replaced by a hamburger that
opens a right-hand drawer.

**Why.** The design has no mobile navigation, and at 390px four links plus the
status pill and the CTA cannot share a line. An earlier pass simply hid the
links, which left phone visitors scrolling to find Open Source and Experience.
The drawer restores them and adds the two sections the bar never had room for
(What I Build, Contact), plus email and social links.

**How.** `aria-expanded` / `aria-controls` on the button, `aria-hidden` and
`inert` on the panel, a scrim, `Escape` to close, a Tab focus trap, focus
returned to the burger on close, `body.is-locked` to stop background scroll,
and close-on-navigate. Crossing back above 900px force-closes it so focus can
never be trapped in a hidden panel.

Related: `.nav__pill-text` is hidden under 620px, leaving the pulsing green
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

---

## 13. The design source is not vendored

**Decision.** `design/` removed; the `.dc.html` and its runtime are not in the
repository.

**Why.** Asked for directly. It also removes 141KB the site never loaded, and
keeps the deployed tree to exactly what Vercel serves. `docs/PROJECT-DATA.md`
remains the record of what was used, and the design itself still lives in the
Claude Design project.

---

## 14. One gutter, enforced, with two deliberate exceptions

**Decision.** Every section carries the same `--pad` gutter on both sides, and
no content crosses it. Verified at 13 widths from 320px to 2560px.

**Why.** Two things were breaking out of it:

- **The hero name.** `clamp(38px, 10.4vw, 168px)` sizes type off the *viewport*,
  but the name sits in a 1180px content box — so at 1440px "HARSHVARDHAN"
  measured 1304px and ran ~124px past the gutter, nearly touching the window
  edge.
- **The open-source torus.** `right: -4%` with `width: min(760px, 68vw)`
  deliberately bled off-screen, overhanging by 58px at 1440 and 77px at 1920,
  and colliding with the facts grid.

**How.** `fitName()` measures the widest word at a reference size and sets
`--name-size` so it lands exactly on the content edge — recomputed on resize
and after `document.fonts.ready`, so a fallback face with different metrics
still fits. The CSS `clamp()` remains as a conservative no-JS fallback. The
torus moved inside `.section__inner` and anchors to `right: 0`, which *is* the
content edge, so it needs no magic numbers.

The nav was also widened from a hardcoded `calc(100% - 28px)` to
`calc(100% - var(--pad) * 2)` so its edges line up with the content rather than
sitting 4px proud, and the skip link now aligns to the gutter too.

**The two exceptions**, both intentional: the marquee (a ticker must run edge to
edge; the section clips it, so it adds no page scroll) and the full-bleed
background canvases in the hero and contact sections, which paint the page
ground rather than content.

---

## 15. LinkedIn ball uses the LinkedIn brand blue

**Decision.** `--linkedin: #0a66c2` instead of the site accent.

**Why.** Asked for. The ball is a recognisable brand mark, and rendering it in
the site's terracotta accent read as a generic button. The GitHub and mail balls
stay in the site palette, which is right — one is monochrome by nature and the
other is not a third-party brand.

---

## 16. The custom cursor now hides the native one everywhere

**Decision.** `cursor: none` is applied through a `.cursor-live` class on
`<html>` that `cursor()` adds, rather than the inline
`documentElement.style.cursor = 'none'` the first port used. The rule is
`.cursor-live, .cursor-live * { cursor: none !important; }`.

**Why.** The port of the design's `cursor()` was faithful — the dot, the ring,
the 0.16 follow, the 1.6/2.1 hover scales are all the design's numbers — but it
only set `cursor: none` on the root element. `cursor` inherits, so that works
for plain text, and it is why the effect looked correct on the background. It
does **not** survive an element that sets its own: the UA stylesheet gives every
`<a>` `cursor: pointer`, and the stylesheet sets it again on `.btn`, `.burger`,
`.acc__btn`, `.ball`, `.link-arrow`, `.oss__pr`, `.contact__cta`,
`.drawer__close` and `.drawer__mail`.

The result was the system hand sitting on top of the custom cursor over all
eleven interactive element types — which is exactly where a cursor gets looked
at. Measured before the fix: 11 leaking selectors. After: 0.

The design has the same hole; it is just less visible in a preview frame where
you hover fewer things. This is a fix to the design, not a port of it.

**Why a class and not an inline style.** Three things fall out of it for free:

- **No JS, no harm.** If the script fails or never runs, the class is never
  added and the native cursor is untouched. Hiding the system cursor with
  nothing to replace it is the worst failure mode this feature has, and
  gating it in CSS makes that unreachable.
- **Touch stays native.** The class goes on only after a `pointermove` whose
  `pointerType` is a mouse or pen, and comes off on a touch `pointerdown` or if
  `(pointer: fine)` stops matching. A hybrid laptop that reports a fine pointer
  but is being used by finger keeps its cursor. The coarse-pointer media query
  re-asserts `pointer` on interactive elements as a second line of defence.
- **The rAF loop is lazy.** It starts on first real mouse movement instead of
  at init, so a phone never runs it at all.

**On `!important`.** Deliberate. This is a mode switch rather than a style —
the whole point is that no other rule may reassert a cursor — and without it
every future `cursor: pointer` silently reopens the bug.

**Reduced motion.** The ring trails the pointer by design; that lag is motion.
Under `prefers-reduced-motion: reduce` the follow and scale easing go to 1, so
the ring tracks the pointer exactly instead of being disabled. Verified: it
lands on the pointer position in a single frame. This extends decision #8's
reasoning — keep the thing, remove the movement.

---

## 17. The About stat tiles are career metrics, not project trivia

**Decision.** Replaced all four numbers in the About grid. The design's set was
carried over verbatim in the first build; it is now:

| Was (design) | Now | Grounded in |
| --- | --- | --- |
| `57K★` Appwrite — PR merged into a 57K-star repo | `3 yrs` In tech — building for the web since 2023 | B.Tech from 2023; asked for |
| `931` Passing tests, 0 missed defects | `20+` Projects shipped end-to-end | Asked for; resume supports more |
| `45×` Order throughput after automation | `30+` Client sites delivered, with on-page SEO | Resume: "delivered 30+ WordPress websites with on-page SEO" |
| `15+` Production modules shipped from Figma | `57K★` Merged a feature into Appwrite — and the security fix it needed | Resume: merged PR #13148, plus the vulnerability found in review |

**Why.** The design's four were all single-project numbers presented as career
statistics — a repo's star count, one hackathon's test total, one automation
script's speed-up, one internship's module count. Three of the four were
somebody else's number or a detail that means nothing without the project
attached, and all four already appear in the Work and Open Source sections
where they have context. As a summary block they said less than the sections
below them.

The replacements are each a different dimension — time, breadth, delivery
volume, depth — so the grid reads as a career at a glance.

**The Appwrite tile was kept but reframed.** "PR merged into a 57K-star repo"
leads with Appwrite's popularity, which is borrowed credit. The number is still
useful as *scale of codebase entered*, so the label now leads with the action —
merging a feature, and finding the security hole during review. That fix is the
strongest single line on the resume and it was not mentioned anywhere in the
stat grid before.

**Numbers not invented.** `30+` and the Appwrite tile are quoted from the
resume. `3 yrs` and `20+` were specified. `20+` is conservative against the
resume, which already lists 30+ WordPress sites, 3 client sites, 15+ modules
and two named projects — the two tiles count different things (substantial
builds vs. WordPress delivery), so they do not contradict.

**Uncertain:** whether `3 yrs` should count from starting the B.Tech in 2023 or
from the first paid role in Dec 2024 (which would be ~2). Went with 2023 as
specified; the label says "since 2023" so the basis is visible rather than
implied.

---

## 18. Vercel Analytics is a script tag, not the npm package

**Decision.** Added `<script src="/_vercel/insights/script.js" defer></script>`
before `</body>`. Did **not** run `npm i @vercel/analytics`, and did not add
`<Analytics/>`.

**Why.** The quickstart that ships with the package is the Next.js path —
`import { Analytics } from "@vercel/analytics/next"` renders a React component.
This site is static HTML with vanilla JavaScript: no React, no bundler, no
build step. A bare module specifier like `@vercel/analytics/next` cannot
resolve in a browser, so the import would fail and the component has no React
to render into.

**The script tag is not a workaround — it is the same thing.** Read from
`@vercel/analytics@2.0.1`, `inject()` builds:

```js
const script = document.createElement('script');
script.src = '/_vercel/insights/script.js';   // dist/index.mjs:114
script.defer = true;                          // dist/index.mjs:183
```

The React component is a `useEffect` wrapper around that call. With no bundler
the package can only ever append this one tag, so adding the tag directly is
the whole integration.

**Why not install it anyway.** Beyond shipping nothing, a `package.json` at the
repo root changes how Vercel treats the project. Right now there is none, so
Vercel serves the repository as static output with no build. Introducing one
invites framework detection and an install/build step on a site that needs
neither — a real risk to a live deployment in exchange for a dependency the
browser would never load.

**Two things to know about the endpoint.** It is served by Vercel's edge, not
from this repository, so it 404s on localhost and on any non-Vercel host. That
is harmless — nothing on the page depends on it. And it only exists once **Web
Analytics is enabled for the project** in the Vercel dashboard; until then it
404s in production too.

**If the site ever moves to Next.js**, delete the tag and use the documented
`<Analytics/>` component instead — at that point the package is the right call.
