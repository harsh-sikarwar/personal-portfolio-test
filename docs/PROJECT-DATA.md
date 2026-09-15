# Project data and context used

What this implementation was built from, and where each piece came from.

## Sources

| Source | Identifier | How it was read |
| --- | --- | --- |
| Claude Design project | `23565905-d643-4fb6-8dd1-5920aa259f57` — "Developer Portfolio UI Mockups" | `claude_design` MCP (`DesignSync`) |
| Design file | `Portfolio.dc.html` (71,950 bytes, 806 lines) | `DesignSync get_file` |
| Runtime file | `support.js` (69,150 bytes) | `DesignSync get_file` |
| Resume | `Harshvardhan_Sikarwar_Full_Stack_Developer_Resume.pdf`, 2 pages | text via `pypdf`; URLs via PDF link annotations |
| Repository | `harsh-sikarwar/personal-portfolio-test` | empty — no commits, no default branch |

Both design files are kept in `design/` for reference. The site loads nothing
from that folder.

### Access note

The design MCP was not reachable at first — `DesignSync` reported that it needed
design-system authorization and that `/design-login` cannot run in a
non-interactive session. Fetching the project URL directly returned HTTP 403.
After `/design-consent` was run, `DesignSync` worked.

`list_projects` does **not** show this project — it filters to design-system
projects, and this one is `PROJECT_TYPE_PROJECT`. It was reached by passing its
`projectId` directly to `get_project` / `list_files` / `get_file`.

## What the design project contained

```
Portfolio.dc.html          the design           <- implemented
support.js                 dc-runtime           <- read, see below
.thumbnail
uploads/                   5 .webp, 3 .png, the resume PDF
```

`support.js` is the generated Design Components runtime (its own header says
"GENERATED from dc-runtime/src/*.ts — do not edit"). It carries no design
information — it is the React-based engine that parses `<x-dc>`, resolves
`{{holes}}`, and renders `<sc-for>` / `<sc-if>`. It informed *how* to port the
design, not *what* the design looks like.

The 8 images in `uploads/` are **not referenced** by `Portfolio.dc.html` — no
`<img>`, no `background-image`, no `url(...)`. Every visual in the design is
drawn at runtime on `<canvas>` or composed in CSS. The implementation ships no
images either.

## What was taken from the design file

- **Fonts** — Archivo (display) + Space Grotesk (body), via Google Fonts.
- **Palette** — `#1d211f` ink, `#141a19` dark, `#f6f3ea` card, `#efebe0`
  services, `#e9e5da` cream, `#7f9b6d` / `#a8c48a` greens, `#c2502e` accent,
  `#dbe3dc` paper.
- **Type ramp, spacing, radii, shadows, `clamp()` scales** — copied unchanged.
- **Section order and ids** — `#top`, `#about`, `#work`, `#oss`, `#stack`,
  `#exp`, `#services`, `#contact`.
- **All copy** — headings, body text, card text, service descriptions, terminal
  blocks, captions and labels are the design's, verbatim.
- **All interaction constants** — every magic number in `assets/js/main.js`
  (easing factors, blob counts, torus `N`/`M`/`R`/`r`, icosahedron vertices and
  faces, light vector, damping, collision impulse, count-up duration) is the
  design's value.

### The design's editor tweaks

`data-props` declared six props. They became the `CFG` object and two CSS
custom properties:

| Prop | Default | Where it lives now |
| --- | --- | --- |
| `pageTone` | `Celadon mist` | `--paper` + `TONE` in `main.js` |
| `accentColor` | `#c2502e` | `--accent` |
| `gridSpacing` | `26` | `CFG.spacing` |
| `fogIntensity` | `1` | `CFG.fog` |
| `influence` | `280` | `CFG.radius` |
| `reduceMotion` | `false` | `CFG.reduce`, bound to `prefers-reduced-motion` |

## What was taken from the resume

The design already contained accurate resume content, so the resume was used to
**fill gaps and verify**, not to rewrite.

### URLs recovered from PDF link annotations

The design's project cards had no links. Rather than invent any, these were
extracted from the resume's embedded hyperlinks:

| Destination | URL |
| --- | --- |
| Where Did My Money Go — repo | `https://github.com/harsh-sikarwar/where-did-my-money-go` |
| Where Did My Money Go — demo | `https://where-did-my-money-go-tawny.vercel.app/` |
| Flipkart Auto Order Bot — repo | `https://github.com/harsh-sikarwar/flipkart-auto-order-bot` |
| Appwrite PR #13148 | `https://github.com/appwrite/appwrite/pull/13148` |
| LinkedIn | `https://www.linkedin.com/in/harshvardhan-sikarwar-12aa86237/` |
| GitHub | `https://github.com/harsh-sikarwar` |
| Email | `hvsikarwar@gmail.com` |

### Discrepancy found

The design links LinkedIn as `linkedin.com/in/harshvardhan-sikarwar`. The
resume's actual hyperlink is
`https://www.linkedin.com/in/harshvardhan-sikarwar-12aa86237/`. The
implementation uses the resume's. See `OPEN-QUESTIONS.md` #1.

### Skills added to the stack marquee

The resume lists tooling the design's marquee omitted. Added: **JavaScript,
PHPUnit, PHPStan, Git, Render**. Still not shown, as short-form duplicates or
too granular for a marquee: TypeScript-adjacent HTML5/CSS3, SQL, Context API,
Router, GitHub, Claude Code (CLI). All of them appear in the
screen-reader-only skills list in `#stack`.

### Resume facts confirmed as already correct in the design

Contact details; the 57K★ / 931 tests / 45× / 15+ statistics; every role, title,
employer, location and date; B.Tech at Jabalpur Engineering College 2023–2027;
the Appwrite PR narrative including the security fix found in review; both
project descriptions and their metrics.

## Verification performed

Chromium via Playwright at **390 / 1440 / 2560 px**:

- no console errors, page errors or failed requests
- no horizontal overflow at any width
- accordion opens exclusively, toggles closed, `aria-expanded` and panel
  `hidden` stay in sync
- anchor navigation lands 92px clear of the fixed nav
- `prefers-reduced-motion: reduce` — marquee animation `none`, transitions
  disabled, counters settle to 57 / 931 / 45 / 15 without animating
- marquee halves exceed viewport width at 2560px with an even track count

Google Fonts could not load inside the sandbox (the proxy CA is not in
Chromium's trust store). Rather than disable TLS verification, the fonts were
fetched with `curl` and screenshots taken against a temporary local-font copy of
the page, so the verification above reflects real Archivo / Space Grotesk
metrics. That temporary file was deleted and is not part of the repository.
