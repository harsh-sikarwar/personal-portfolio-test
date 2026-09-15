# Harshvardhan Sikarwar — Portfolio

A single-page personal portfolio for a full-stack developer. Static HTML, CSS and
vanilla JavaScript — no build step, no dependencies, no framework.

Implemented from the Claude Design project
**Developer Portfolio UI Mockups** (`Portfolio.dc.html`), with content details
taken from the resume.

## Build notes

- [`docs/PROJECT-DATA.md`](docs/PROJECT-DATA.md) — the design files, resume and
  context this was built from, and how each was read
- [`docs/DESIGN-DECISIONS.md`](docs/DESIGN-DECISIONS.md) — every judgement call
  made porting the design, and why
- [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) — what is unresolved and
  needs your input (start with #1, a LinkedIn URL conflict)

## Run it

Open `index.html` directly, or serve the folder:

```bash
npx http-server . -p 8080     # then visit http://localhost:8080
```

## Layout

```
index.html              markup and copy
assets/css/styles.css   design tokens, layout, hover and responsive rules
assets/js/main.js       canvas visuals and interactions
design/
  Portfolio.dc.html     the design source this was built from
  support.js            Claude Design component runtime (used by the .dc.html)
docs/                   build notes (see above)
```

`design/` is reference material — the site does not load anything from it.

## Sections

`#top` hero · `#about` · `#work` · `#oss` open source · `#stack` · `#exp`
experience · `#services` · `#contact`

## What runs on the page

All visuals are drawn at runtime — the site ships no images.

| Feature | Where |
| --- | --- |
| Fog plane + cursor-warped dot grid | hero, contact (`field()`) |
| Wireframe torus | open source (`knot()`) |
| Shaded icosahedron | about (`solid()`) |
| Per-letter 3D tilt on the name | hero (`letters()`) |
| Rolling social "balls" with collisions | hero (`balls()`) |
| Custom cursor (fine pointers only) | global (`cursor()`) |
| Reveal-on-scroll + count-up stats | about, work, open source |
| Card tilt | work cards |
| Scroll progress bar + nav backdrop | global (`progress()`) |
| Services accordion | services (`accordion()`) |
| Stack marquees | stack (CSS + `marquees()`) |

## Theming

Colors live as custom properties on `:root` in `assets/css/styles.css`:

```css
--paper: #dbe3dc;   /* page tone */
--accent: #c2502e;  /* accent */
--ink: #1d211f;
```

`--paper` is the design's default "Celadon mist". The other tones from the
design source are listed in a comment beside it. If you change `--paper`, also
change `TONE` in `assets/js/main.js` — the canvases fill their own background
and need the same value.

Motion parameters that were editor tweaks in the design (`gridSpacing`,
`fogIntensity`, `influence`) are the `CFG` object at the top of `main.js`.

## Accessibility and responsiveness

- Skip link, landmarks, labelled sections, and `aria-expanded` / `aria-controls`
  on the accordion.
- `prefers-reduced-motion: reduce` stops the marquees, the letter tilt, the
  count-up and the canvas drift, and freezes the rolling balls.
- The custom cursor and the pointer-driven canvas warps are suppressed on
  coarse pointers.
- The stack marquee is `aria-hidden`; the same list is available to screen
  readers as visually-hidden text.
- No horizontal overflow at 390px or 1440px.

### Known gap

Below 900px the nav's section links are hidden — the design has no mobile menu,
and four links plus the status pill and CTA do not fit. Navigation is by
scrolling. A disclosure menu would close this if you want one.
