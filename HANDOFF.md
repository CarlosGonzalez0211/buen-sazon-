# HANDOFF.md — buen-sazon-

## 1. Purpose

A marketing/informational website for "El Buen Sazón," a fictional-brand-style Mexican
restaurant chain (Ciudad Juárez, Chihuahua, MX locations). It's a single-page-app style
React site with routed pages for Home, Menu, Locations, About, Gallery, and Contact.
All content (menu items, branch data, dish illustrations) is hard-coded in local data
files — there is no backend, CMS, or database. Dish "photos" are hand-drawn inline SVG
illustrations rather than real photography (see `src/components/DishIllustration.jsx`).

## 2. Status

- **Active development, but in an unusual state: only 1 commit exists in git, and it
  contains only `README.md`.** Every other file in the working tree — `package.json`,
  all of `src/`, `vite.config.js`, `eslint.config.js`, `index.html`, `.gitignore`,
  `public/`, `.claude/` — is **untracked** (verified via `git status --short` and
  `git ls-files --error-unmatch`). In other words, the actual application has never
  been committed to git.
- Last commit: `10a29469` on 2026-03-03 22:35:56 -0700, message "Initial commit".
- Current branch: `main`. Remote: `origin` → `https://github.com/CarlosGonzalez0211/buen-sazon-.git` (fetch/push).
- Working-tree state as of this writing: `README.md` modified from its committed
  version (still the generic Vite+React template text); everything else untracked.
- Given the amount of built-out, working page content (6 routed pages, custom data,
  custom SVG illustration system), this reads as a real in-progress build — just one
  where nothing has been staged/committed yet.

## 3. Stack

Read directly from `package.json` (name is still the Vite scaffold default, `"myapp"`):

- **React** `^19.2.0`, **react-dom** `^19.2.0`
- **react-router-dom** `^7.13.1`
- **Vite** `^7.3.1` (build tool), **@vitejs/plugin-react** `^5.1.1`
- **ESLint** `^9.39.1` with `@eslint/js` `^9.39.1`, `eslint-plugin-react-hooks` `^7.0.1`,
  `eslint-plugin-react-refresh` `^0.4.24`, `globals` `^16.5.0`
- **@types/react** `^19.2.7`, **@types/react-dom** `^19.2.3` (types only — the project
  itself is plain JS/JSX, not TypeScript; no `tsconfig.json` present)
- Module type: `"type": "module"` (ESM)
- No `engines` field and no `.nvmrc` — Node version is not pinned by the repo. The
  dev machine used here runs Node v22.12.0, but treat that as environment info, not
  a repo requirement.

## 4. Setup & Commands

From `package.json` `scripts` (these are the only scripts defined — nothing else exists):

```
npm install       # install dependencies
npm run dev       # vite — start dev server (configured for port 5173 in .claude/launch.json)
npm run build     # vite build — production build to dist/
npm run preview   # vite preview — preview the production build locally
npm run lint      # eslint .
```

No test script is defined — **No test script defined.** There is no test framework,
test files, or `test` entry in `package.json`.

## 5. Architecture Map

```
index.html                     Vite entry HTML, mounts #root
src/
  main.jsx                     React root bootstrap (StrictMode + <App/>)
  App.jsx                      Router setup (BrowserRouter), route table, loading-screen
                                overlay, scroll-to-top-on-navigation behavior
  index.css / App.css          Global styles
  assets/
    images/                    Static PNGs (hero bg, logo, dish photos) — used sparingly;
                                most dish art is SVG, not these images
    textures.js                Exported texture constants (brick/paper/wood) for CSS/bg use
  components/
    DishIllustration.jsx       God node (6 edges per graphify). Hand-drawn flat-SVG dish
                                art generator + dishTypeFor() name→illustration-type mapper.
                                No external image assets — everything is inline SVG paths.
    layout/
      Navbar.jsx / Navbar.css  Site navigation
      Footer.jsx / Footer.css  Site footer (social links, etc.)
  data/
    locations.js                Branch/location data god node (5 edges): addresses, phone,
                                 hours, features, embedded Google Maps iframe URLs
    menus.js                    Per-location menu data (317 lines): shared item catalog +
                                 per-branch menu assembly
  pages/
    Home.jsx / Home.css         Landing page: hero, featured dishes, gallery teaser, marquee
    Menu.jsx / Menu.css         Full menu listing, uses MenuItemCard → dishTypeFor()
    Locations.jsx / .css        Branch listing
    About.jsx / .css            About/story page (milestones content)
    Gallery.jsx / .css          Photo/illustration gallery
    Contact.jsx / .css          Contact form (client-side only, see Known Issues) + branch
                                 info panel + embedded Google Maps iframe
public/
  vite.svg                      Vite favicon default (unchanged from scaffold)
vite.config.js                  Vite config — just the React plugin, no aliases/proxy
eslint.config.js                Flat ESLint config: JS recommended + react-hooks +
                                 react-refresh rules
.claude/launch.json             Dev-server launch config for AI coding harness preview
                                 tooling (npm run dev on port 5173)
graphify-out/                   Pre-built knowledge graph (see section 10)
dist/                            Build output directory (gitignored, present locally)
```

## 6. Entry Points — Read These First

1. `src/App.jsx` — the router and page list; shows every route the site has and the
   app-level chrome (Navbar/Footer/loading screen).
2. `src/main.jsx` — trivial, but confirms how the app boots.
3. `src/data/menus.js` and `src/data/locations.js` — the entire content model of the
   site lives here as plain JS objects/arrays; understanding these two files explains
   most of what the pages render.
4. `src/components/DishIllustration.jsx` — the most-connected file in the codebase
   (graphify's top god node) and the site's one distinctive piece of engineering: a
   hand-rolled SVG illustration system keyed off dish name/type instead of photos.
5. `src/pages/Menu.jsx` — best example of how data + illustration component compose
   into a page.
6. `src/pages/Contact.jsx` — has the one known incomplete feature (see section 9).

## 7. Conventions & Gotchas

- **The repo's git history does not reflect the working tree.** Anyone picking this up
  needs to `git add`/commit the current files before relying on git for diffs, blame,
  or CI — right now `git diff`/`git log -p` against most files will show nothing
  useful because they were never committed.
- Site copy is in **Spanish** throughout (this is a Mexican-restaurant site) — page
  text, labels, and comments like "Sucursal" (branch) are intentional content, not
  placeholders.
- `package.json`'s `"name"` is still `"myapp"`, the Vite scaffold default — it was
  never renamed to match the project.
- `README.md` (the one committed file) is still the generic Vite+React template
  README — it does not describe this project at all. It should be replaced or at
  minimum supplemented; this HANDOFF.md is intended to be the accurate onboarding doc.
- Dish images: most menu items are illustrated via `dishTypeFor()` name-matching
  (substring checks on the Spanish item name/id) rather than an explicit `type` field
  on every menu entry — when adding a new dish, either set an explicit `type` or make
  sure the name contains a matching keyword (e.g. "taco", "burrito", "horchata") or it
  will silently fall back to the generic `taco` illustration.
- Google Maps embed URLs in `src/data/locations.js` and `src/pages/Contact.jsx` use
  placeholder-looking coordinate/place IDs (e.g. `!1d3394.123456!2d-106.4245...`,
  `4v1234567890`) — these render a working embed but the precise pin location should
  be verified/regenerated from real Google Maps embed codes before treating them as
  accurate.

## 8. External Dependencies & Environment

- **No backend, API, or database.** All content is static/local JS data.
- **No environment variables found** — no `.env*` files present, and no
  `import.meta.env` or `process.env` usage anywhere in `src/`.
- **Third-party services referenced (client-side, no auth/keys needed):**
  - Google Maps Embed iframes (public embed URLs, no API key visible/required for
    the basic embed format used).
  - Social links (Facebook/Instagram/TikTok) in `src/pages/Contact.jsx` — currently
    point to generic platform root URLs (`https://facebook.com`, etc.), not
    account-specific pages, despite showing handles like `@ElBuenSazon`.
- Deployment target: **UNKNOWN — no CI/CD config, Vercel/Netlify config, or
  Dockerfile found in the repo.**

## 9. Known Issues & TODOs

- **Contact form does not submit anywhere.** In `src/pages/Contact.jsx`,
  `handleSubmit` has a genuine developer comment `// TODO: integrate real form
  submission` directly above code that just sets local `submitted` state and clears
  the form — no network request is made. Confirmed by reading the surrounding code;
  this is a real incomplete feature, not Spanish "todo" (all) UI copy.
- **Nothing is committed to git except README.md.** See sections 2 and 7 — this is
  the single most important thing for a new agent to fix or at least be aware of
  before doing further work, to avoid losing changes or being confused by git output.
- **Social media links are placeholders** (link to platform homepages, not the
  actual business accounts) — see section 8.
- **Map embed coordinates look like scaffolded/placeholder values** across all
  locations (identical `3394.123456` distance parameter, sequential-looking `4v...`
  timestamps) — worth verifying against real Google Maps "Share > Embed a map" output.
- **`README.md` is the unmodified Vite template**, not project documentation.
- No automated tests exist for any page or component.

## 10. Fast Orientation for a New Agent

1. Run `graphify query "<question>"` and `graphify god-nodes --top 15` (after
   `export PATH="$HOME/.local/bin:$PATH"`) to orient before reading files — a graph is
   already built at `graphify-out/` (96 nodes, 119 edges, 10 communities, built from
   commit `10a29469`, 100% extracted with no inference/ambiguity).
2. Read `graphify-out/GRAPH_REPORT.md` for the community breakdown and god-node list
   (`DishIllustration()`, `scripts`, `locations`, `dishTypeFor()` are the top hubs).
3. **Best first question to ask the graph for this repo:**
   `graphify query "How do menu items get mapped to their dish illustration, and what happens if a new item doesn't match dishTypeFor()'s keywords?"`
   — this traces the site's one non-trivial piece of logic (`Menu.jsx` →
   `DishIllustration.jsx` → `dishTypeFor()`) and directly surfaces the gotcha noted
   in section 7.
4. Before making any changes, run `git status` and decide with the user whether to
   commit the existing untracked working tree first — otherwise new work will be
   indistinguishable from the unfinished initial build in git history.
5. `npm install && npm run dev` to get a live preview (port 5173, per
   `.claude/launch.json`); `npm run lint` before committing anything, since ESLint is
   configured and would otherwise be the only guardrail in this test-less project.
