# scione.io — resources system (v10)

Every blog/research/assets/tutorial post is still a real, individual static
HTML file — `blog/{slug}.html`, `research/{slug}.html`, `assets/{slug}.html`,
`tutorials/{slug}.html` — generated from `data/resources.csv` +
`content/{slug}.md` by `build.js`. That part is unchanged from v8: no
redirects, no query strings. What you commit is exactly what gets served,
and every one of those files is a genuine `200 OK` with the real title,
body, and SEO metadata already baked into the HTML — true for a fresh
visitor, a crawler, or a browser with JavaScript disabled.

**v9** added a small client-side router (`js/router.js`) that makes
navigation between pages instant — clicking an internal link fetches the
real target file and swaps its content in, instead of doing a full page
reload. This is "progressive enhancement," not a single-page app in the
usual sense: it changes nothing about what gets served. Turn JavaScript
off, or load any page directly, and it looks and works exactly like it
would if this router didn't exist.

**New in v10:** the 5 hub pages (`resources.html`, `blog.html`,
`research.html`, `assets.html`, `tutorials.html`) now come with their
default card grid already baked into the raw HTML at build time, same as
the individual resource pages always have. Previously that grid only
existed once `js/resources.js` fetched the CSV and rendered it client-side
— fine for a real browser, but invisible to anything that doesn't execute
JavaScript. That turns out to be most of the crawlers that matter for AI
visibility specifically: GPTBot, ClaudeBot, and PerplexityBot all fetch raw
HTML only and never run JS, and even Googlebot's JS-rendering pass is a
separate, often-delayed second wave (Google has said it can take anywhere
from seconds to weeks) rather than something that happens on the same
request. See "Why the hub pages changed" below for the full reasoning.

## How the router works, in short

Every page still includes the same header, footer, and `<main>` content it
always did. `js/router.js` listens for clicks on internal links and, for
the ones it's safe to handle client-side, does this instead of letting the
browser navigate:

1. Fetches the real target page (the exact bytes any visitor would get).
2. Swaps `<main>`'s content, and syncs the handful of `<head>` tags that
   vary per page (`<title>`, canonical, meta description, OpenGraph,
   Twitter Card, JSON-LD) to match the new page — adding, updating, or
   removing each one as needed.
3. Calls `history.pushState` so the URL bar updates and the back/forward
   buttons work correctly.
4. Re-runs the JS that the new `<main>` content needs (scroll-reveal
   animations, the filter dropdowns, and — on hub pages — the whole
   search/filter controller), since those elements were just replaced.

It deliberately leaves alone anything that isn't a plain, same-tab,
same-origin link: external links, `mailto:`/`tel:`, `target="_blank"`,
`download` links, and same-page `#hash` links all fall through to normal
browser behavior untouched. If a fetch ever fails, it falls back to a real
`window.location` navigation rather than leaving the page stuck.

**Why header/footer links are root-absolute (`/resources.html`), not
relative:** the header and footer are deliberately *never* touched by the
swap above — that's what keeps the mobile nav, mega-menu, and sticky-header
state intact across navigations. But that means their links have to be
correct no matter what depth the current page happens to be at, since
they're never re-written after the first load. A relative link like
`../index.html` is only correct while sitting on a one-level-deep page; if
that same untouched header is still on screen after navigating to a
root-level page (or vice versa), a relative link resolves to the wrong
place. Root-absolute links (`/index.html`) sidestep this — they resolve to
the same real URL regardless of current depth. This does assume the site
is served from its domain root (true for `scione.io` as a custom domain).
If this ever moves to a GitHub Pages project URL without a custom domain
(`username.github.io/reponame/`), these would need a `/reponame` prefix.

## Why the hub pages changed (v10)

Each hub page's card grid is still rendered by `js/resources.js` at runtime
— that hasn't changed, and it's still what makes the search box and topic
filter work. What changed is that `build.js` now *also* computes the
default (no filter applied) version of that same grid and writes it
directly into the page's HTML, between two comment markers:

```html
<div id="resource-grid"><!-- BUILD:GRID:START -->...<!-- BUILD:GRID:END --></div>
```

`build.js` owns everything between those two markers and fully rewrites it
on every run (same idea as the `blog/`/`research/`/`assets/`/`tutorials/`
folders being build-owned) — don't hand-edit inside them, since the next
build overwrites it. Everything else on the 5 hub pages is still edited by
hand exactly as before.

When the page loads for a real visitor, `js/resources.js` runs exactly as
it always has, fetches the CSV, and re-renders the grid on top — using the
same data and the same `resource-data.js` card-rendering functions `build.js`
used to produce the static version, so the two are never out of sync and a
real visitor never sees a flash of different content. The only thing that
changes is that the content is *already there* the instant the page
arrives, rather than depending on JavaScript to add it a moment later.

That distinction matters more than it might seem. Googlebot does execute
JavaScript, but as a second, separate rendering pass — Google's own
documentation describes it as a queue that can take anywhere from seconds
to weeks depending on load, layered on top of an initial pass that indexes
the raw HTML right away. And several of the crawlers that matter most for
AI-answer-engine visibility — GPTBot, ClaudeBot, and PerplexityBot among
them — don't execute JavaScript at all; they read the initial HTML response
and nothing else. Before this change, all five hub pages looked completely
empty of any actual post listing to any of those. The individual resource
pages were never affected by this (they've been fully static since v8) and
sitemap.xml already listed every one of them directly, so they were always
independently discoverable — this change is specifically about the hub
pages being able to show what they link to, immediately, to anyone or
anything that isn't running JavaScript.

## Editing nav, footer, or shared behavior

- **Nav/footer markup:** still lives in `_template.html` for generated
  pages; the 6 hand-maintained pages (`index.html`, `about.html`,
  `capabilities.html`, `experience.html`, `work.html`, `connect.html`) and
  5 hub pages carry the same header/footer markup directly. Edit once,
  re-run the build for the templated side; hand-maintained pages still need
  the header/footer copied over by hand if you change it (unchanged from
  v8 — the router doesn't change how these files are edited).
- **`js/main.js`** is split into two parts, and it matters which one new
  code goes into:
  - Code inside `document.addEventListener('DOMContentLoaded', ...)` at the
    bottom runs exactly **once**, ever (mobile nav toggle, sticky header,
    mega-menu, footer year). These elements live in the header/footer,
    which the router never touches, so binding them more than once would
    stack up duplicate event listeners.
  - `updateActiveNav()` and `initMainContent()` are exposed on
    `window.SiteBehavior` instead. These run once on the real initial page
    load, and again after every router-driven navigation, because they
    touch things inside `<main>` that get replaced each time
    (scroll-reveal, filter dropdowns). Anything new that depends on
    `<main>`'s content belongs in `initMainContent()`, not the
    `DOMContentLoaded` block.
  - `js/resources.js` follows the same rule: it exposes
    `window.ResourcesController.init()`, which `router.js` calls after every
    navigation. It already no-ops safely on any page that isn't a resource
    hub, so it's always safe to call.

## Adding a new resource

1. Add a row to `data/resources.csv` (slug, title, publish_date,
   featured_image, excerpt, content_type, topic, keywords).
2. Add `content/{slug}.md` — plain markdown, no frontmatter. All metadata
   lives in the CSV row; the `.md` file is just the body.
3. Run the build (see below).
4. Commit and push everything, including the newly generated file(s) under
   `blog/`, `research/`, `assets/`, or `tutorials/`.

## Editing an existing resource

Edit the CSV row and/or the `.md` file, then re-run the build. It
regenerates every page from scratch each time (including cross-links in
"related resources," which can shift when you add or remove rows), so
there's never a stale file left over from a rename — old slugs that no
longer appear in the CSV get cleaned out automatically.

## Running the build

One-time setup:

```
npm install
```

Every time after that:

```
node build.js
```

It prints what it generated. If a CSV row is missing a required field, has
an unknown `content_type`, or points at a `content/*.md` file that doesn't
exist, it stops and tells you exactly which row and why — nothing gets
partially generated.

**If `node build.js` seems to hang instead of finishing in under a
second:** this happened during development when the project folder lived
inside a cloud-synced directory (a folder mirrored to Dropbox/OneDrive/
Google Drive/etc.) — something about that sync layer makes jsdom (used
here to sanitize the rendered HTML) extremely slow to load. If you hit
this, copy the folder to a plain local path, run the build there, then
copy the generated files back — or just move the project out of the
synced folder entirely.

The router (`js/router.js`) is a plain static file, not something the build
generates — it doesn't need a rebuild when you edit it, just a normal
save. Only files under `blog/`, `research/`, `assets/`, `tutorials/`,
`404.html`, and `sitemap.xml` are build-generated.

## Things worth knowing

- **`SITE_URL` in `build.js`** (currently `https://scione.io`) is used for
  the canonical URL, `og:image`, JSON-LD, and `sitemap.xml`. Update that one
  constant if the real domain ends up different.
- **`og:image` falls back to `images/brent-scione.avif`** when a row has no
  `featured_image`. AVIF isn't reliably rendered by every link-preview tool
  (some older unfurlers don't support it) — swapping in a dedicated JPG/PNG
  social-share image at some point would be a safe, worthwhile upgrade.
- **`sitemap.xml`** is regenerated on every build and lists every static
  page plus every generated resource page — worth submitting to Google
  Search Console once this is live.
- **`404.html`** is also generated by `build.js`, from `content/404.md`, so
  its wording is editable the same way a real post is. It's always
  `noindex` and otherwise a completely ordinary page — no special
  client-side logic, since every real URL on the site is now a real file.
  The router doesn't change this: a genuinely missing URL still gets a
  real `404` status with this page's content, from GitHub Pages directly.
- **Local testing on Apache** (XAMPP etc.) still needs `.htaccess`'s
  `ErrorDocument 404 /404.html` line to show this project's 404 page
  instead of Apache's own — unchanged from before, and not needed at all
  on GitHub Pages, which does this automatically.
- **Why there's still a build step at all:** GitHub Pages decides a
  request's HTTP status before any HTML or JavaScript runs, purely based on
  whether a matching file exists. No client-side router can turn a request
  for a URL that doesn't exist into a real `200` — that can only come from
  a real file being there already. The router in this version makes
  navigating *between* those real files feel instant; it doesn't (and
  can't) replace generating them.

## Before deploying: two things only Brent can fill in

Everything else in this build is real, deployable content. Two small
things were deliberately left as placeholders rather than guessed at,
since getting them wrong on a live site is worse than leaving them
visibly blank:

- **Exact employment years** on `experience.html`. The timeline is
  correctly ordered (Market Vantage → Image Lucidity → Build-It-Yourself
  → Pinnacle Electronics) and every bullet under each role is accurate to
  what's documented in the source transcripts, but precise start/end
  years weren't confidently confirmable from that material and are marked
  with the same `placeholder-note` style the original template used for
  unknown fields. Search `experience.html` for `Add start year` and
  `Add end year`.
- **Real LinkedIn URL.** `connect.html` and the footer's social icon row
  both still point LinkedIn at `#`. Search for `href="#"` near
  `aria-label="LinkedIn"` and in the "Connect on LinkedIn" button on the
  connect page, and swap in the real profile URL.
