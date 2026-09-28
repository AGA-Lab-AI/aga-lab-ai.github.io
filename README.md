# UNIST AGA Lab website

Source of <https://aga-lab-ai.github.io>, built with [Astro](https://astro.build) and deployed to
GitHub Pages by GitHub Actions on every push to `main`.

Content lives in three plain-text files, so adding news, papers, or members never requires touching code:

| What | File |
|---|---|
| News | `src/data/news.yaml` |
| Publications | `swyoon-admin/publications/pub.bib` (master, synced into `src/data/publications.bib`) + `src/data/publication-filter.yaml` (what the site shows) |
| People | `src/data/people.yaml` (+ photos in `public/images/people/`) |
| Research statement | `src/pages/research-statement.md` |
| Recruiting | `src/pages/recruiting.md` |

---

## 1. Environment setup (one time)

You need **Node.js 22.12 or newer** and **git**. We recommend installing Node through
[nvm](https://github.com/nvm-sh/nvm) so it doesn't conflict with other projects.

### Linux / macOS / WSL

```bash
# 1) Install nvm (skip if `nvm --version` already works), then restart your shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# 2) Clone the repository
git clone https://github.com/AGA-Lab-AI/aga-lab-ai.github.io.git
cd aga-lab-ai.github.io

# 3) Install and select the Node version pinned in .nvmrc (22)
nvm install
nvm use

# 4) Install dependencies
npm install
```

### Windows (without WSL)

Install Node.js 22 LTS from <https://nodejs.org> (or use [nvm-windows](https://github.com/coreybutler/nvm-windows)),
then run `git clone ...`, `cd aga-lab-ai.github.io` and `npm install` in PowerShell.

> Each time you open a new terminal, run `nvm use` in the project folder if your default Node version is older than 22.
> Check with `node --version`.

---

## 2. Running the local dev server

```bash
npm run dev
```

Open <http://localhost:4321>. The page reloads automatically whenever you save a file,
**including** `news.yaml`, `people.yaml`, and `publications.bib`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with live reload at http://localhost:4321 |
| `npm run dev:host` | Same, but reachable from other devices on the network (useful under WSL if `localhost` doesn't work from Windows) |
| `npm run build` | Production build into `dist/`, exactly what CI runs; **also validates all data files** |
| `npm run preview` | Serve the built `dist/` folder locally |
| `npm run check` | TypeScript / Astro type check |

**Always run `npm run build` before pushing.** If a data file has an error (typo in a field, broken BibTeX,
invalid URL…), the build stops and prints which entry and field is wrong, for example:

```
people → jian-jeong data does not match collection schema.
  role: Invalid option: expected one of "pi"|"postdoc"|"grad"|"intern"|"undergrad"|"staff"
```

---

## 3. Adding content

### 3.1 News → `src/data/news.yaml`

Add a new item at the **top** of the list:

```yaml
- date: 2026-09            # YYYY-MM or YYYY-MM-DD
  text: "Our paper [Paper Title](https://arxiv.org/abs/xxxx.xxxxx) is accepted at **NeurIPS 2026**!"
```

- `text` supports Markdown (links, `**bold**`, `*italic*`).
- Wrap `text` in double quotes if it contains `:` or starts with `[` or `*`.
- The home page shows the 10 most recent items; `/news` shows everything grouped by year.

### 3.2 Publications → `src/data/publications.bib` + `src/data/publication-filter.yaml`

> **Do not edit `src/data/publications.bib` in this repo.** It is a verbatim copy of the master file
> `swyoon-admin/publications/pub.bib` (which also feeds the CV, hence the `cv*` fields), refreshed
> occasionally with `npm run sync:pubs`.

The master file is the **complete** publication list. The website shows only a subset,
selected by `publication-filter.yaml` (which *is* edited in this repo).

**Syncing from the master file** (manual, occasional)

```bash
npm run sync:pubs              # copy ../swyoon-admin/publications/pub.bib -> src/data/publications.bib
git add src/data/publications.bib && git commit -m "Sync publications" && git push
```

- Default source is `../swyoon-admin/publications/pub.bib` (`swyoon-admin` cloned next to this repo);
  set `PUB_BIB_SOURCE=/path/to/pub.bib` to use another location.
- Syncing is **not** automatic: `npm run dev`, `npm run build`, and deployment all use the copy committed in
  this repo. The website only changes after you sync **and commit**.

**Adding a paper**

1. In `swyoon-admin/publications/pub.bib`, paste the BibTeX entry (preferably the official one, e.g. from
   OpenReview or the proceedings; otherwise Google Scholar / arXiv / DBLP).
2. Add `cvcategory` and `cvstatus` (required by the CV generator; see `swyoon-admin/publications/README.md`)
   and other CV fields as needed:

```bibtex
@inproceedings{kim2026example,
  title     = {An Example Paper Title with {LLM} Acronyms Protected},
  author    = {Davin Kim and Sangwoong Yoon},
  booktitle = {Advances in Neural Information Processing Systems},
  year      = {2026},
  eprint    = {2609.01234},
  archiveprefix = {arXiv},
  url       = {https://openreview.net/forum?id=...},
  code      = {https://github.com/AGA-Lab-AI/example},
  cvcategory = {conference},
  cvstatus   = {published},
  cvequalcontributors = {Davin Kim and Sangwoong Yoon},
  cvhonor    = {Spotlight}
}
```

3. In this repo, run `npm run sync:pubs`, then `npm run dev` and check the Publications page.
   If the paper doesn't appear, check the filter (below). Commit `src/data/publications.bib` to publish it.

Required fields: `title`, `author`, `year`. Everything else is optional.

| Field | Effect on the website |
|---|---|
| `cvcategory` | `conference` \| `journal` \| `preprint` \| `workshop`; used by the filter and for ordering. If missing, guessed from the entry type |
| `cvequalcontributors` | Those authors get a <sup>*</sup> (co-first authors) |
| `cvcorrespondingauthors` | Those authors get a <sup>†</sup> (co-corresponding authors) |
| `cvhonor` or `note` | Highlighted badge (e.g. `Oral`, `Spotlight`, `Best Paper`) |
| `url` / `doi` | Title links to the paper, plus a **Paper** button |
| `eprint` with an arXiv id (or `arxiv`) | **arXiv** button |
| `venue` | Override the venue label. By default well-known venues are abbreviated automatically (`ICLR 2026`, `NeurIPS 2024`, …), others show the full `booktitle`/`journal` + year |
| `pdf`, `code`, `project`, `slides`, `poster`, `video` | Link buttons |

- The `cv*` fields, website-only fields, `abstract`, and `keywords` are removed from the **BibTeX** box visitors copy.
- Papers are grouped by `year`, and within each year into Preprints / Journal Articles / Conference Papers / Workshop Papers (empty groups are hidden). Within each group, newest first: by the `month` field, or for well-known conferences their usual month (ICLR Apr, AISTATS May, ICML Jul, NeurIPS Dec, …; see `VENUE_ABBREVIATIONS` in `src/lib/bibtex.ts`); entries with unknown month come last, in file order.
- Author names matching someone in `people.yaml` (including alumni) are shown in **bold** automatically
  (`Sangwoong Yoon` and `Yoon, Sangwoong` both match).
- New venue abbreviations can be added to `VENUE_ABBREVIATIONS` in `src/lib/bibtex.ts`.

**Choosing what the website shows** → `src/data/publication-filter.yaml`

```yaml
categories: [conference, preprint]   # which cvcategory values are shown
min_year: 2019                       # hide older entries
include: [9600832]                   # BibTeX keys to always show
exclude: []                          # BibTeX keys to always hide
```

The build log (and dev server log) reports how many entries are shown, e.g.
`Loaded 25 publications from src/data/publications.bib (15 shown on the website)`.
A misspelled key in `include`/`exclude` makes the build fail.

### 3.3 People → `src/data/people.yaml`

1. Put a **square** photo (about 480×480 px, JPG) in `public/images/people/`, named like `gildong-hong.jpg`.
2. Add an entry under the right section of `people.yaml`:

```yaml
- name: Gildong Hong           # required
  name_ko: 홍길동                # optional
  role: grad                   # required: pi | postdoc | grad | intern | undergrad | staff
  program: Ph.D.               # optional, e.g. "M.S.", "Ph.D.", "M.S.-Ph.D."
  since: 2026                  # optional
  photo: gildong-hong.jpg      # optional (initials are shown if missing)
  links:                       # all optional
    homepage: https://gildong-hong.github.io/
    scholar: https://scholar.google.com/citations?user=...
    github: https://github.com/...
    x: https://x.com/...
    linkedin: https://www.linkedin.com/in/...
    email: gildong@unist.ac.kr
```

- `role` decides the section on the People page; order within a section follows the file.
- When someone leaves the lab, **don't delete the entry**. Add `alumni: true` (and optionally
  `now: "Ph.D. student at ..."`). They move to the Alumni section and stay bold in publications.

### 3.4 Research statement / Recruiting

Edit `src/pages/research-statement.md` or `src/pages/recruiting.md` as normal Markdown.
Images go in `public/images/site/` and are referenced as `![alt text](/images/site/file.jpg)`.

---

## 4. Publishing changes

```bash
npm run build                  # make sure it passes
git add -A
git commit -m "Add news: NeurIPS 2026 acceptance"
git push                       # or open a pull request
```

- A push to `main` builds and deploys automatically (takes ~1–2 minutes). Progress is shown in the **Actions** tab.
- Pull requests are built (validated) but not deployed, so data errors are caught before merging.
- One-time repository setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## 5. Project layout

```
src/
├── data/                 # ← content: news.yaml, people.yaml, publications.bib, publication-filter.yaml
├── pages/                # routes: index, people, publications, news (.astro); research-statement, recruiting (.md)
├── components/           # NewsList, PersonCard, PIProfile, PubItem, Links
├── layouts/              # Base (header/nav/footer), Page (for Markdown pages)
├── lib/                  # bibtex.ts (BibTeX → data), data.ts (queries), format.ts
├── styles/global.css
└── content.config.ts     # data schemas (validation) + BibTeX loader
public/images/            # people/ photos, site/ figures
.github/workflows/deploy.yml
```

## Troubleshooting

- **`astro` complains about the Node version** → run `nvm use` (needs Node ≥ 22.12).
- **Page doesn't open from the Windows browser under WSL** → use `npm run dev:host` and open the printed Network URL.
- **Build error about `publications.bib`** → the message gives the entry key and line; usually a missing `}` or `,`.
- **Dev server shows errors (500) although `npm run build` passes** → the dev server kept a stale state
  (e.g. after the schema in `content.config.ts` changed). Restart it: `npx astro dev stop`, then `npm run dev`.
  `npx astro dev status` / `npx astro dev logs` show its state and logs.
- **Build error about YAML** → check indentation (spaces, not tabs) and quote strings that contain `:`.
