// Copies the master publication list into this repo.
//
// The single source of truth is swyoon-admin/publications/pub.bib (it also feeds the CV).
// src/data/publications.bib is a verbatim copy and must not be edited by hand.
// Run this occasionally (`npm run sync:pubs`) and commit the result; dev/build do NOT sync automatically.
//
// Source path: $PUB_BIB_SOURCE, or ../swyoon-admin/publications/pub.bib next to this repo.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, process.env.PUB_BIB_SOURCE ?? '../swyoon-admin/publications/pub.bib');
const target = resolve(root, 'src/data/publications.bib');

if (!existsSync(source)) {
  console.error(`[sync-publications] ${source} not found (set PUB_BIB_SOURCE to its location)`);
  process.exit(1);
}

const next = readFileSync(source);
const prev = existsSync(target) ? readFileSync(target) : null;
if (prev && prev.equals(next)) {
  console.log('[sync-publications] src/data/publications.bib is up to date');
} else {
  writeFileSync(target, next);
  console.log(`[sync-publications] copied ${source} -> src/data/publications.bib`);
}
