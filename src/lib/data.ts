import { getCollection, type CollectionEntry } from 'astro:content';

export type Person = CollectionEntry<'people'>['data'] & { id: string };

export const ROLE_GROUPS: { role: Person['role']; label: string }[] = [
  { role: 'pi', label: 'Principal Investigator' },
  { role: 'postdoc', label: 'Postdoctoral Researchers' },
  { role: 'grad', label: 'Graduate Students' },
  { role: 'staff', label: 'Staff' },
  { role: 'intern', label: 'Research Interns' },
  { role: 'undergrad', label: 'Undergraduate Interns' },
];

export async function getPeople(): Promise<Person[]> {
  return (await getCollection('people')).map((e) => ({ id: e.id, ...e.data })).sort((a, b) => a.order - b.order);
}

export async function getPI(): Promise<Person> {
  const pi = (await getPeople()).find((p) => p.role === 'pi' && !p.alumni);
  if (!pi) throw new Error('people.yaml: no current member with role "pi"');
  return pi;
}

/** News, newest first (stable for items in the same month: file order). */
export async function getNews() {
  const items = (await getCollection('news')).map((e) => e.data);
  return items
    .map((n, i) => ({ ...n, i }))
    .sort((a, b) => (a.date === b.date ? a.i - b.i : a.date < b.date ? 1 : -1));
}

const CATEGORY_RANK = { preprint: 0, journal: 1, conference: 2, workshop: 3 } as const;

/**
 * Publications shown on the website (see src/data/publication-filter.yaml), grouped by year (desc).
 * Within a year: preprint, journal, conference, workshop; within each, newest first by month
 * (`month` field or the venue's usual month; unknown months last), then file order.
 */
export async function getPublicationsByYear() {
  const pubs = (await getCollection('publications', (e) => e.data.visible)).map((e) => ({ id: e.id, ...e.data }));
  pubs.sort(
    (a, b) =>
      b.year - a.year ||
      CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category] ||
      b.month - a.month ||
      a.order - b.order,
  );
  const groups = new Map<number, typeof pubs>();
  for (const p of pubs) groups.set(p.year, [...(groups.get(p.year) ?? []), p]);
  return [...groups.entries()];
}
