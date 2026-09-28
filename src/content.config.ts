import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineCollection } from 'astro:content';
import { file, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';
import { CATEGORIES, isVisible, parseBibtex } from './lib/bibtex';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');

/** Parse a YAML list and give each item an id, so data files don't need one. */
const yamlList = (idOf: (item: any, i: number) => string) => (text: string) => {
  const items = parseYaml(text);
  if (!Array.isArray(items)) throw new Error('Expected a YAML list');
  return items.map((item, i) => ({ id: item.id ?? idOf(item, i), order: i, ...item }));
};

// ---------------------------------------------------------------- news
const news = defineCollection({
  loader: file('src/data/news.yaml', {
    parser: yamlList((_, i) => `news-${String(i).padStart(4, '0')}`),
  }),
  schema: z.object({
    date: z
      .union([z.string(), z.date()])
      .transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d))
      .pipe(z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'date must be YYYY-MM or YYYY-MM-DD')),
    text: z.string(),
  }),
});

// ---------------------------------------------------------------- people
const url = z.url();
const people = defineCollection({
  loader: file('src/data/people.yaml', { parser: yamlList((p) => slugify(p.name)) }),
  schema: z.object({
    name: z.string(),
    name_ko: z.string().optional(),
    role: z.enum(['pi', 'postdoc', 'grad', 'intern', 'undergrad', 'staff']),
    program: z.string().optional(),
    title: z
      .union([z.string(), z.array(z.string())])
      .transform((t) => (Array.isArray(t) ? t : [t]))
      .default([]),
    photo: z.string().optional(),
    portrait: z.string().optional(),
    since: z.number().int().optional(),
    bio: z.string().optional(),
    education: z.array(z.string()).default([]),
    links: z
      .object({
        homepage: url.optional(),
        scholar: url.optional(),
        github: url.optional(),
        x: url.optional(),
        linkedin: url.optional(),
        email: z.email().optional(),
      })
      .strict()
      .default({}),
    alumni: z.boolean().default(false),
    now: z.string().optional(),
    order: z.number(),
  }),
});

// ---------------------------------------------------------------- publications (BibTeX)
const filterSchema = z
  .object({
    categories: z.array(z.enum(CATEGORIES)).default([...CATEGORIES]),
    min_year: z.number().int().optional(),
    include: z.array(z.coerce.string()).nullish().transform((v) => v ?? []),
    exclude: z.array(z.coerce.string()).nullish().transform((v) => v ?? []),
  })
  .strict();

/**
 * Loads every entry of the .bib file; `visible` says whether the website shows it
 * according to the filter YAML. Both files are watched in dev mode.
 */
function bibtexLoader(bibPath: string, filterPath: string): Loader {
  const bib = fileURLToPath(new URL(`../${bibPath}`, import.meta.url));
  const flt = fileURLToPath(new URL(`../${filterPath}`, import.meta.url));
  return {
    name: 'bibtex-loader',
    load: async ({ store, parseData, generateDigest, watcher, logger }) => {
      const sync = async () => {
        const pubs = parseBibtex(await readFile(bib, 'utf8'));
        const parsed = filterSchema.safeParse(parseYaml(await readFile(flt, 'utf8')) ?? {});
        if (!parsed.success) throw new Error(`${filterPath}: ${z.prettifyError(parsed.error)}`);
        const filter = parsed.data;
        const keys = new Set(pubs.map((p) => p.id));
        const unknown = [...filter.include, ...filter.exclude].filter((k) => !keys.has(k));
        if (unknown.length) throw new Error(`${filterPath}: unknown BibTeX key(s): ${unknown.join(', ')}`);

        store.clear();
        for (const pub of pubs) {
          const data = await parseData({ id: pub.id, data: { ...pub, visible: isVisible(pub, filter) } });
          store.set({ id: pub.id, data, digest: generateDigest(data) });
        }
        const shown = pubs.filter((p) => isVisible(p, filter)).length;
        logger.info(`Loaded ${pubs.length} publications from ${bibPath} (${shown} shown on the website)`);
      };
      await sync();
      watcher?.add([bib, flt]);
      watcher?.on('change', async (changed) => {
        if (changed !== bib && changed !== flt) return;
        try {
          await sync();
        } catch (e) {
          logger.error(String(e));
        }
      });
    },
  };
}

const publications = defineCollection({
  loader: bibtexLoader('src/data/publications.bib', 'src/data/publication-filter.yaml'),
  schema: z.object({
    type: z.string(),
    category: z.enum(CATEGORIES),
    title: z.string(),
    authors: z.array(z.string()).min(1),
    equal: z.array(z.string()),
    corresponding: z.array(z.string()),
    year: z.number().int(),
    month: z.number().int().min(0).max(12),
    venue: z.string(),
    note: z.string().optional(),
    links: z.record(z.string(), z.string()),
    bibtex: z.string(),
    order: z.number(),
    visible: z.boolean(),
  }),
});

export const collections = { news, people, publications };
