import { parse, type Creator } from '@retorquere/bibtex-parser';

/**
 * Fields removed from the BibTeX box shown to visitors: website-only fields,
 * CV-generator fields (cv*), and bulky metadata.
 */
const HIDDEN_FIELDS = [
  'venue', 'note', 'pdf', 'code', 'project', 'slides', 'poster', 'video', 'arxiv',
  'cv\\w*', 'abstract', 'abstractnote', 'keywords',
];

const LINK_FIELDS = ['pdf', 'code', 'project', 'slides', 'poster', 'video'] as const;

export const CATEGORIES = ['conference', 'journal', 'preprint', 'workshop'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Short names for well-known venues, matched against booktitle/journal. */
const VENUE_ABBREVIATIONS: [RegExp, string][] = [
  [/Learning Representations/i, 'ICLR'],
  [/International Conference on Machine Learning/i, 'ICML'],
  [/Neural Information Processing Systems/i, 'NeurIPS'],
  [/Artificial Intelligence and Statistics/i, 'AISTATS'],
  [/AAAI Conference/i, 'AAAI'],
  [/Winter Conference on Applications of Computer Vision/i, 'WACV'],
  [/Computer Vision and Pattern Recognition/i, 'CVPR'],
  [/International Conference on Computer Vision/i, 'ICCV'],
  [/Conference on Robot Learning/i, 'CoRL'],
];

export interface Publication {
  id: string;
  type: string;
  category: Category;
  title: string;
  authors: string[];
  /** Authors marked as co-first authors via `cvequalcontributors` (subset of `authors`). */
  equal: string[];
  /** Authors marked as (co-)corresponding authors (subset of `authors`). */
  corresponding: string[];
  year: number;
  venue: string;
  note?: string;
  links: Record<string, string>;
  bibtex: string;
  order: number;
}

export const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

function creatorName(c: Creator): string {
  if (c.name) return c.name;
  return [c.firstName, c.prefix, c.lastName, c.suffix].filter(Boolean).join(' ');
}

/** Remove `field = {...}` / `field = "..."` / `field = 123` assignments whose name matches a pattern. */
function stripFields(entry: string, patterns: string[]): string {
  const re = new RegExp(`^[ \\t]*(${patterns.join('|')})[ \\t]*=`, 'im');
  let out = entry;
  for (let m = re.exec(out); m; m = re.exec(out)) {
    let i = m.index + m[0].length;
    while (/\s/.test(out[i])) i++;
    if (out[i] === '{') {
      let depth = 0;
      for (; i < out.length; i++) {
        if (out[i] === '{') depth++;
        else if (out[i] === '}' && --depth === 0) {
          i++;
          break;
        }
      }
    } else if (out[i] === '"') {
      for (i++; i < out.length && !(out[i] === '"' && out[i - 1] !== '\\'); i++);
      i++;
    } else {
      while (i < out.length && !/[,\n}]/.test(out[i])) i++;
    }
    // swallow trailing comma and the rest of the line
    while (out[i] === ' ' || out[i] === '\t') i++;
    if (out[i] === ',') i++;
    while (out[i] === ' ' || out[i] === '\t') i++;
    if (out[i] === '\n') i++;
    out = out.slice(0, m.index) + out.slice(i);
  }
  // drop a dangling comma before the closing brace
  return out.replace(/,(\s*)}\s*$/, '$1}').trim();
}

function categorize(type: string, f: Record<string, any>): Category {
  const cv = String(f.cvcategory ?? '').toLowerCase();
  if ((CATEGORIES as readonly string[]).includes(cv)) return cv as Category;
  if (/workshop/i.test(f.booktitle ?? '')) return 'workshop';
  if (type === 'misc' || type === 'unpublished' || /arxiv/i.test(f.journal ?? '')) return 'preprint';
  if (type === 'article') return 'journal';
  return 'conference';
}

function pickVenue(f: Record<string, any>, category: Category, year: number): string {
  if (typeof f.venue === 'string') return f.venue;
  const base: string | undefined = f.booktitle ?? f.journal ?? f.school ?? f.institution;
  if (category === 'preprint' && (!base || /arxiv/i.test(base))) return `arXiv preprint, ${year}`;
  if (!base) return String(year);
  if (category !== 'workshop') {
    for (const [re, short] of VENUE_ABBREVIATIONS) if (re.test(base)) return `${short} ${year}`;
  }
  return base.includes(String(year)) ? base : `${base}, ${year}`;
}

const ARXIV_ID = /^(\d{4}\.\d{4,5}|[a-z-]+(\.[A-Z]{2})?\/\d{7})(v\d+)?$/i;

export function parseBibtex(source: string): Publication[] {
  const lib = parse(source, { sentenceCase: false });
  if (lib.errors.length) {
    const msgs = lib.errors.map((e) => `  - ${JSON.stringify(e)}`).join('\n');
    throw new Error(`publications.bib has parse errors:\n${msgs}`);
  }

  return lib.entries.map((entry, order) => {
    const f = entry.fields as Record<string, any>;
    if (!f.title) throw new Error(`publications.bib: entry "${entry.key}" is missing "title"`);
    if (!f.author) throw new Error(`publications.bib: entry "${entry.key}" is missing "author"`);
    const year = Number.parseInt(f.year ?? f.date ?? '', 10);
    if (!Number.isFinite(year)) throw new Error(`publications.bib: entry "${entry.key}" is missing a valid "year"`);

    const category = categorize(entry.type, f);
    const authors = (f.author as Creator[]).map(creatorName);
    const namesIn = (field: unknown) => String(field ?? '').split(/\s+and\s+/).map(normName).filter(Boolean);
    const equalNames = namesIn(f.cvequalcontributors);
    const correspondingNames = namesIn(f.cvcorrespondingauthors);

    const links: Record<string, string> = {};
    const eprint = f.arxiv ?? f.eprint;
    const arxivId = typeof eprint === 'string' && ARXIV_ID.test(eprint.trim()) ? eprint.trim() : undefined;
    if (f.url) links.paper = f.url;
    else if (f.doi) links.paper = /^https?:/.test(f.doi) ? f.doi : `https://doi.org/${f.doi}`;
    if (arxivId) links.arXiv = `https://arxiv.org/abs/${arxivId}`;
    if (links.paper === links.arXiv) delete links.paper;
    for (const k of LINK_FIELDS) if (f[k]) links[k] = f[k];

    return {
      id: entry.key,
      type: entry.type,
      category,
      title: f.title,
      authors,
      equal: authors.filter((a) => equalNames.includes(normName(a))),
      corresponding: authors.filter((a) => correspondingNames.includes(normName(a))),
      year,
      venue: pickVenue(f, category, year),
      note: f.note ?? f.cvhonor,
      links,
      bibtex: stripFields(entry.input.trim(), HIDDEN_FIELDS),
      order,
    };
  });
}

export interface PublicationFilter {
  categories: Category[];
  min_year?: number;
  include: string[];
  exclude: string[];
}

export function isVisible(pub: Publication, filter: PublicationFilter): boolean {
  if (filter.exclude.includes(pub.id)) return false;
  if (filter.include.includes(pub.id)) return true;
  return filter.categories.includes(pub.category) && pub.year >= (filter.min_year ?? -Infinity);
}
