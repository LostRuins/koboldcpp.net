/**
 * Fetches every same-origin href on the built HTML pages from a running server and checks
 * that it returns 200 and that any #fragment exists on the target page.
 * Usage: bun scripts/check-links.ts [baseUrl]   (default http://127.0.0.1:5182)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] ?? 'http://127.0.0.1:5182';
const dist = fileURLToPath(new URL('../dist', import.meta.url));
const SITE = 'https://koboldcpp.net';

const pages = (await readdir(dist, { recursive: true })).filter((f) => f.endsWith('.html') && f !== '404.html');
const links = new Map<string, Set<string>>(); // target -> source pages

for (const file of pages) {
	const pagePath = '/' + relative(dist, join(dist, file)).replace(/index\.html$/, '');
	const html = await readFile(join(dist, file), 'utf8');
	for (const [, raw] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
		if (!raw) continue;
		let href = raw.replaceAll('&amp;', '&');
		if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
		if (/^(https?:|mailto:|\/\/)/.test(href)) continue;
		const target = new URL(href, base + pagePath);
		const key = target.pathname + target.hash;
		links.set(key, (links.get(key) ?? new Set()).add(pagePath));
	}
}

const htmlCache = new Map<string, { status: number; body: string }>();
let bad = 0;
for (const [key, sources] of [...links].sort()) {
	const [path = '/', hash = ''] = key.split('#');
	if (!htmlCache.has(path)) {
		const res = await fetch(base + path);
		htmlCache.set(path, { status: res.status, body: await res.text() });
	}
	const { status, body } = htmlCache.get(path)!;
	const fragmentOk = !hash || body.includes(`id="${decodeURIComponent(hash)}"`);
	const ok = status === 200 && fragmentOk;
	if (!ok) bad++;
	console.log(`${ok ? 'OK  ' : 'FAIL'} ${status}${hash ? (fragmentOk ? ' #ok ' : ' #missing') : '     '} ${key}  <- ${[...sources].join(', ')}`);
}
console.log(`\n${links.size} same-origin links on ${pages.length} pages, ${bad} failing`);
process.exit(bad ? 1 : 0);
