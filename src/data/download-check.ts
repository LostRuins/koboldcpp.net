/**
 * Build-time check: every `releases/latest/download/<name>` link in the docs content must exist in
 * the latest release's assets.
 * Live GitHub data -> a missing file fails the build. Cached data -> warning only (the cache
 * may simply be older than the docs).
 * Imported for its side effect by src/pages/index.astro, so it runs once per build.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { release } from './release';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');
const LINK = /releases\/latest\/download\/([A-Za-z0-9._-]+)/g;

function referencedNames(): Map<string, Set<string>> {
	const refs = new Map<string, Set<string>>();
	const add = (name: string, where: string) => refs.set(name, (refs.get(name) ?? new Set()).add(where));
	for (const rel of readdirSync(CONTENT_DIR, { recursive: true, encoding: 'utf8' })) {
		if (!/\.(md|mdx|mdoc)$/.test(rel)) continue;
		const text = readFileSync(join(CONTENT_DIR, rel), 'utf8');
		for (const m of text.matchAll(LINK)) if (m[1]) add(m[1], `src/content/${rel}`);
	}
	return refs;
}

function checkDownloadLinks(): void {
	const assets = new Set(release.assets.map((a) => a.name));
	const missing = [...referencedNames()].filter(([name]) => !assets.has(name));
	if (missing.length === 0) {
		console.info(`[download-check] all referenced files exist in ${release.tag}`);
		return;
	}
	const list = missing.map(([name, where]) => `  ${name}  (in ${[...where].join(', ')})`).join('\n');
	const msg = `[download-check] files not in ${release.tag} (${release.source} data):\n${list}`;
	if (release.source === 'github') throw new Error(msg);
	console.warn(msg);
}

checkDownloadLinks();
