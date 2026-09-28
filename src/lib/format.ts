import { marked } from 'marked';

/** Render a short Markdown string (links, emphasis) without wrapping <p>. */
export const inlineMd = (s: string) => marked.parseInline(s, { async: false }) as string;

/** Render a Markdown paragraph/block. */
export const blockMd = (s: string) => marked.parse(s, { async: false }) as string;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-07" or "2026-07-12" -> "Jul 2026" */
export function formatMonth(date: string): string {
  const [y, m] = date.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}
