# Open questions and uncertainties

Things I could not resolve from the design, the resume or the repository, and
where I made a call that is worth a second opinion. Ordered roughly by how much
they matter.

Nothing here blocks the site from working — it is built, verified and complete.

---

## 1. Which LinkedIn URL is correct? — RESOLVED

**Confirmed: the resume's URL is correct.** No further action.

<details><summary>Original question</summary>

The two sources disagree:

| Source | URL |
| --- | --- |
| `Portfolio.dc.html` | `https://linkedin.com/in/harshvardhan-sikarwar` |
| Resume hyperlink | `https://www.linkedin.com/in/harshvardhan-sikarwar-12aa86237/` |

**What I did.** Used the resume's. It carries a numeric suffix, which is what
LinkedIn issues when a custom vanity slug isn't set — so the design's shorter
form is likely an assumption rather than a real profile.

**Why it matters.** A dead link in the hero and the contact footer, on the one
page meant to get you contacted. Please confirm. If you *have* since claimed the
vanity URL, the design's version is the better one and I'll switch both.

</details>

---

## 2. Should the theme tweaks be a live control?

The design exposed six editor tweaks. I baked in their defaults as tokens
(`DESIGN-DECISIONS.md` #3).

**Uncertain because** I don't know whether they were exploration scaffolding or
something you actively want to keep switching. If you were still choosing
between Celadon mist and the other five tones, a tone/accent switcher — even a
temporary one — would be more useful than editing CSS each time.

Cheap to add either way. Say which tones you're weighing and I'll wire it.

---

## 3. Mobile navigation — RESOLVED

**A hamburger drawer was added** (`DESIGN-DECISIONS.md` #5). The section links,
plus What I Build, Contact, email and socials, are now reachable on phones.

<details><summary>Original question</summary>

Section links were hidden below 900px with no replacement.

**Uncertain because** the design simply doesn't answer it, and there's a real
trade-off. It's a single-page site, so scrolling reaches everything and the CTA
stays visible — but "Open Source" and "Experience" are the sections a recruiter
looks for first, and on a phone they're several screens down.

**Options.** A disclosure menu behind a button; or a compact scrolling link
strip; or leave as-is. I'd lean toward the disclosure menu. Your call.

</details>

---

## 4. Should `design/` stay in the repository? — RESOLVED

**Removed.** See `DESIGN-DECISIONS.md` #13.

<details><summary>Original question</summary>

`design/Portfolio.dc.html` (72KB) and `design/support.js` (69KB) are committed as
reference — 141KB the site never loads.

**Uncertain because** it depends on how you'll work. Keeping them means the
design source travels with the code and the port stays auditable. Removing them
means the repo is only the site. If Claude Design remains your source of truth,
`support.js` in particular is dead weight — it's a generated runtime you'd never
edit, and it's regenerated upstream anyway.

My mild preference: keep `Portfolio.dc.html`, drop `support.js`.

</details>

---

## 5. Two empty `<span>`s — what was meant to be there?

The design had `<span style="font-size:12px"></span>` in the nav CTA and
`<span><br></span>` in the contact CTA. I removed both rather than guess
(`DESIGN-DECISIONS.md` #8).

**Uncertain because** they look like the residue of a deleted icon or emoji. If
an arrow or envelope belonged there, tell me which and I'll draw it as inline
SVG to match the icon language used elsewhere.

---

## 6. Skills I left out of the marquee

Added JavaScript, PHPUnit, PHPStan, Git and Render. Left out: HTML5, CSS3, SQL,
Context API, Router, GitHub, Claude Code (CLI).

**Uncertain because** the cut is a judgement about signal, not correctness. I
dropped items that are implied by others already shown (HTML5/CSS3 under
frontend work; Context API and Router under React), and **Claude Code (CLI)**,
which I was least sure about — it's on your resume and genuinely differentiating
right now, but it reads differently from the rest of the list. Easy to add.

All of them do appear in the screen-reader-only skills list, so nothing is lost
to assistive tech.

---

## 7. "Experience [3]" against four rows

The nav counts 3; the section renders four rows — three jobs plus the B.Tech
entry. This is the design's own markup, carried over unchanged.

Defensible (education isn't experience) but it may read as an off-by-one. Change
the badge to `[4]`, or leave it. Not something I wanted to silently "fix" in
your design.

---

## 8. Reduced motion is broader than the design's toggle

The design's `reduceMotion` prop, when on, still rendered the canvases — it froze
time (`time = 0`) rather than stopping work. I bound it to
`prefers-reduced-motion` and additionally disable CSS animations and transitions
globally.

**Uncertain because** that's stricter than the design intended. The canvases
still paint a static composition, which I judged right — the fog, torus and
icosahedron are structural, not decorative motion. But someone with that setting
on sees a noticeably plainer page than the design imagines. Worth a look with the
setting enabled if you have an opinion.

---

## 9. Not verified: real-device and cross-browser behaviour

Everything was checked in headless Chromium across 13 widths (320–2560px).
Not checked:

- **Safari / WebKit** — the design leans on `-webkit-text-stroke` (hero name,
  marquee outlines) and `backdrop-filter`, both prefixed and handled, but only
  exercised in Chromium.
- **Firefox** — `-webkit-text-stroke` is supported but renders slightly
  differently at large sizes.
- **A real touch device** — the coarse-pointer guard is right in theory;
  `pointermove` on the arena and card tilt behave differently under real touch.
  The drawer was exercised with synthetic clicks and keyboard, not real touch
  gestures — swipe-to-close is not implemented. The custom cursor's touch path
  was checked with emulated touch (`hasTouch`), which fires a real
  `pointerType: "touch"`, but not on physical hardware.
- **Canvas load on low-end hardware** — four continuous `requestAnimationFrame`
  loops run simultaneously. Fine on a laptop; unmeasured on a budget phone. If
  it matters, the canvases could pause via `IntersectionObserver` when off-screen
  — a clear win I left out as beyond scope.

---

## 10. Vercel deployment — mostly resolved

**Confirmed: this repo deploys to Vercel.** Nothing needed for it to work — the
site is static with relative paths and no build step, which Vercel serves as-is
from the repository root. No `vercel.json` was added, since none is required and
an unnecessary one only adds a thing to maintain.

**One item still needs you:** the repository's default branch is
`claude/peaceful-newton-zn4xfi`, not `main`. Vercel's production deployment
follows the production branch (usually `main`), so check which branch the
project is set to build. Both branches carry identical commits, so either works
— but they will drift if future work lands on only one.

Worth adding later if you want it: long-lived cache headers on `assets/`. It
needs filename hashing first, otherwise a cached `styles.css` goes stale on the
next deploy.

---

## Not in doubt

For contrast — these were verified, not assumed:

- Every visual constant matches the design source.
- All copy is the design's, verbatim.
- Contact details, dates, employers, metrics and the Appwrite PR narrative match
  the resume.
- Project and PR URLs came from the resume's embedded hyperlinks, not invented.
- No console errors, no page errors, no horizontal overflow at any tested width.
- Accordion, anchor navigation and the reduced-motion path behave correctly.
- No content crosses the gutter at any of the 13 tested widths.
- The drawer's focus handling, state attributes and scroll lock behave correctly.
