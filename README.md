# koboldcpp.net

The website and documentation for [KoboldCpp](https://github.com/LostRuins/koboldcpp). Astro + Starlight (Markdoc
pages), built as a static site with Bun.

## Commands

| Command | What it does |
| --- | --- |
| `bun install --frozen-lockfile` | Install the exact dependency versions from `bun.lock` |
| `bun run dev` | Dev server on http://localhost:4321 |
| `bun run build` | Static build into `dist/` |
| `bun run check` | Type check |
| `bun scripts/check-links.ts http://127.0.0.1:<port>` | Check every internal link and `#anchor` of the build, served at that address |
| `bun run update-release` | Refresh `src/data/release.cache.json` (used when GitHub can't be reached at build time) |

The build fetches the latest KoboldCpp release from the GitHub API to check every download link in the docs against its
files (and for the home page's structured data). `RELEASE_STRICT=1` makes a failed fetch fail the build instead of
using the cache. No page shows a version number, so a new release needs no edit.

## Where things are

- `src/pages/index.astro`, `src/components/home/`, `src/layouts/HomeLayout.astro`: the home page. Kept short on
  purpose: hero with two KoboldAI Lite screenshots, three steps, four features. Details go into the beginner guide or the wiki.
- `src/content/docs/getting-started/*.mdoc` and `src/content/docs/download.mdoc`: the beginner guide, a few short
  pages with screenshots. Their order is the "Getting started" group in `astro.config.mjs`.
- `src/content/docs/docs/**.mdoc`: the wiki (all details). Its sidebar is generated per folder (`astro.config.mjs`);
  order comes from `sidebar.order` in each page.
- `src/starlightRouteData.ts`: shows only the beginner guide's sidebar on its pages and hides it in the wiki.
- `src/content/docs/links.mdoc`: every external link (community, mirrors, related projects), so the footer doesn't list them.
- `src/data/routes.ts`: the nav bar and the internal links that components use.
- `src/assets/docs/`: screenshots. A `<name>.mobile.png` next to `<name>.png` is shown on phones instead.
  `getting-started/windows-*.png` are placeholders: replace them with real Windows screenshots of the same name.

## Writing docs pages

- **`title`** is the page heading and the search result title (`<title> | KoboldCpp`). Name what people search for and
  stay under ~48 characters. Put the short name for the sidebar in `sidebar.label`.
- **`description`** is the search result snippet: one factual sentence, under ~155 characters.
- On phones, a table is shown as stacked rows (`markdoc.config.mjs`) when its words and code don't fit 360 px side by
  side, when it has 3 columns and a cell longer than 22 characters, or when a first-column cell is longer than 22
  characters. Keep the first column the row's name.
- `text` code blocks (messages, logs) wrap long lines; `sh` blocks scroll, so flags never split. Inline code breaks
  only at spaces; a single token over 30 characters (paths, URLs) may break anywhere.
- Facts need a source: the KoboldCpp code or README, or a test with the real release. Speeds name the model and the
  hardware.
- Beginner guide pages: one task per page, plain words, a screenshot for each click. Leave options and background to
  the wiki and link there.
- Point people only to official sources. Download links go to the GitHub releases; don't name or link unofficial
  download sites.

## Generated files

- **Flag reference** (`reference/flags.mdoc`, `reference/deprecated-flags.mdoc`), per KoboldCpp release:
  `python3 scripts/extract-flags.py <koboldcpp.py> > src/data/flags.json`, then `python3 scripts/gen-flag-docs.py`.
  Explanations live in `src/data/flag-notes.json`; the generator lists flags without notes.
- **Fonts** (`src/assets/fonts/`): trimmed copies of the `@fontsource` files (fewer characters and weights, about half
  the size). After updating a font package or when text needs characters outside Latin-1, run
  `python3 scripts/subset-fonts.py` (needs `pip install fonttools brotli`).
- **Share image** (`public/og.jpg`, 1200x630): the brand, one line and the main home screenshot, without a version number.
  Used by every page (`src/data/og.ts`).

## Hosting

The site is plain static files, so any static host works. `.github/workflows/deploy.yml` builds it on every push and
pull request. Pushes to `main`, a daily run and manual runs also commit the built site to the root of the `deploy`
branch, only when a file changed (the build is reproducible). The host serves that branch as it is, without a build
step, the same way KoboldAI Lite is hosted. The daily run picks up a new KoboldCpp release by itself; if a docs download
link names a file the new release doesn't have, the build fails and the live site stays as it was. No secrets are
needed.

Host setup, once (the `deploy` branch exists after the first run on `main`):

- **Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → this repository. Production branch
  `deploy`, framework preset None, no build command, output directory `/`. Then Settings → Build → Branch control:
  preview branch **None**. Otherwise every push to another branch publishes its raw source on a public
  `*.pages.dev` address. Add the custom domain `koboldcpp.net` under Custom domains.
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `deploy`, `/ (root)`. Needs a paid GitHub plan while
  the repository is private.

Other files:

- `public/_headers` (Cloudflare only): `noindex` for the `llms*.txt` files and long caching for the content-hashed
  `/_astro/` files.
- `public/CNAME` and `public/.nojekyll` (GitHub Pages only): keep the custom domain across deploy commits, and stop
  Jekyll from dropping the `_astro/` folder.
- `public/robots.txt` points to the sitemap that Starlight generates (`/sitemap-index.xml`).
- Versions are pinned: dependencies in `bun.lock` (`bun install --frozen-lockfile`), Bun in the workflow, the GitHub
  Actions by commit.
