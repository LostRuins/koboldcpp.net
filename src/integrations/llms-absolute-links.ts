/**
 * Rewrites site-relative Markdown links (`](/docs/...)`) in the generated llms*.txt files to
 * absolute https://koboldcpp.net/... URLs, so they work when the text is read outside the site.
 * starlight-llms-txt has no option for this, so it runs after the build.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';

export default function llmsAbsoluteLinks(): AstroIntegration {
	let site = '';
	return {
		name: 'llms-absolute-links',
		hooks: {
			'astro:config:done': ({ config }) => {
				if (!config.site) throw new Error('llms-absolute-links needs `site` in astro.config');
				site = config.site.replace(/\/$/, '');
			},
			'astro:build:done': async ({ dir, logger }) => {
				const files = (await readdir(dir)).filter((f) => /^llms.*\.txt$/.test(f));
				for (const name of files) {
					const url = new URL(name, dir);
					const text = await readFile(url, 'utf8');
					let count = 0;
					const out = text.replace(/\]\(\/(?!\/)/g, () => {
						count++;
						return `](${site}/`;
					});
					if (count) await writeFile(url, out);
					logger.info(`${name}: ${count} internal link(s) made absolute`);
				}
			},
		},
	};
}
