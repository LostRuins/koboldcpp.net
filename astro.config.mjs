// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import markdoc from '@astrojs/markdoc';
import starlightLlmsTxt from 'starlight-llms-txt';
import llmsAbsoluteLinks from './src/integrations/llms-absolute-links.ts';
import { OG_IMAGE } from './src/data/og.ts';
import { BEGINNER_GUIDE } from './src/data/routes.ts';
import { readFileSync } from 'node:fs';

/** Site-wide OS preference; inlined in <head> of every page (also src/layouts/HomeLayout.astro). */
const OS_PREF_SCRIPT = readFileSync(new URL('./src/scripts/os-pref.js', import.meta.url), 'utf8');
/** No-JS fallback styles (stacked OS panels, no picker); also in HomeLayout. */
const NOSCRIPT_CSS = readFileSync(new URL('./src/scripts/noscript.css', import.meta.url), 'utf8');
const SCROLL_TABLES_SCRIPT = readFileSync(new URL('./src/scripts/scroll-tables.js', import.meta.url), 'utf8');

export default defineConfig({
	site: 'https://koboldcpp.net',
	trailingSlash: 'ignore',
	vite: {
		build: {
			rolldownOptions: {
				// Astro core marks .mdoc content entries with its own `"use astro:head-inject"` directive
				// and reads it before bundling; Rolldown then warns it "may not be preserved". Known
				// false positive, so drop exactly that warning for those modules and keep all others.
				onwarn(warning, defaultHandler) {
					if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('astroPropagatedAssets')) return;
					defaultHandler(warning);
				},
			},
		},
	},
	integrations: [
		starlight({
			title: 'KoboldCpp',
			description:
				'Documentation for KoboldCpp: free, open-source software for running GGUF AI models on your own computer.',
			logo: { src: './src/assets/kobold-favicon.png', alt: '' },
			favicon: '/favicon.png',
			// Own 404 page (src/pages/404.astro), kept out of the docs collection so it stays out of llms-full.txt.
			disable404Route: true,
			// Adds the font preloads (src/data/font-preloads.ts) to every docs page and picks its sidebar.
			routeMiddleware: './src/starlightRouteData.ts',
			head: [
				// One share image for every page (the home page sets the same in HomeLayout).
				{ tag: 'meta', attrs: { property: 'og:image', content: OG_IMAGE.url } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: OG_IMAGE.width } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: OG_IMAGE.height } },
				{ tag: 'meta', attrs: { property: 'og:image:alt', content: OG_IMAGE.alt } },
				// Before the body parses, so synced OS tabs restore to the right tab without a flash.
				{ tag: 'script', content: OS_PREF_SCRIPT },
				{ tag: 'noscript', content: `<style>${NOSCRIPT_CSS}</style>` },
				// Module scripts run after the body is parsed.
				{ tag: 'script', attrs: { type: 'module' }, content: SCROLL_TABLES_SCRIPT },
			],
			customCss: [
				// tokens.css also declares the self-hosted fonts (scripts/subset-fonts.py).
				'./src/styles/tokens.css',
				'./src/styles/buttons.css',
				'./src/styles/sl-theme.css',
				'./src/styles/starlight.css',
			],
			// Light only: paper and ink like the home page. ThemeProvider/ThemeSelect drop the picker.
			// Header/MobileMenuFooter: the shared site nav (SiteNav) and its phone menu links, as on the home page.
			components: {
				ThemeProvider: './src/components/starlight/ThemeProvider.astro',
				ThemeSelect: './src/components/starlight/ThemeSelect.astro',
				Header: './src/components/starlight/Header.astro',
				MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
			},
			expressiveCode: {
				themes: ['github-light'],
				// Messages and logs wrap, so the whole line is readable on phones. Commands keep scrolling: browsers
				// break lines after hyphens, which would split flags like --contextsize.
				defaultProps: { overridesByLang: { text: { wrap: true } } },
				styleOverrides: {
					codeFontFamily: "'Atkinson Hyperlegible Mono Variable', ui-monospace, monospace",
					uiFontFamily: "'Atkinson Hyperlegible Next Variable', ui-sans-serif, system-ui, sans-serif",
					// mint-home code well (--paper-3), frame chrome (--paper-2) and border (--line), as hex:
					// Expressive Code does its own colour maths on these. Terminal and editor frames have
					// their own background settings; codeBackground alone doesn't reach them.
					codeBackground: '#fdfcf9',
					borderColor: '#dfd8ce',
					borderRadius: '8px',
					frames: {
						editorBackground: '#fdfcf9',
						terminalBackground: '#fdfcf9',
						editorTabBarBackground: '#f3efe6',
						terminalTitlebarBackground: '#f3efe6',
						terminalTitlebarBorderBottomColor: '#dfd8ce',
					},
				},
			},
			// Two sidebars in one: the route middleware shows only the beginner guide on its own pages and
			// hides it everywhere else (the wiki). The guide's pages are listed here, in order.
			sidebar: [
				{
					label: BEGINNER_GUIDE,
					items: [
						'getting-started',
						'download',
						'getting-started/start',
						'getting-started/model',
						'getting-started/chat',
						'getting-started/help',
					],
				},
				{ label: 'Overview', link: '/docs/' },
				{ label: 'Download & install', items: [{ autogenerate: { directory: 'docs/install' } }] },
				{
					label: 'Models & hardware',
					items: [
						{ label: 'Models', items: [{ autogenerate: { directory: 'docs/models' } }] },
						{ label: 'Hardware', items: [{ autogenerate: { directory: 'docs/hardware' } }] },
					],
				},
				{ label: 'Launcher & settings', items: [{ autogenerate: { directory: 'docs/settings' } }] },
				{ label: 'Features', items: [{ autogenerate: { directory: 'docs/features' } }] },
				{ label: 'Connecting apps & API', items: [{ autogenerate: { directory: 'docs/api' } }] },
				{ label: 'Troubleshooting', items: [{ autogenerate: { directory: 'docs/troubleshooting' } }] },
				{ label: 'FAQ', link: '/docs/faq/' },
				{ label: 'Reference', items: [{ autogenerate: { directory: 'docs/reference' } }] },
			],
			plugins: [
				starlightLlmsTxt({
					projectName: 'KoboldCpp',
					description:
						'KoboldCpp is free, open-source (AGPL-3.0) software for running GGUF AI models on your own computer. It is a single file with no install, builds on llama.cpp, and bundles the KoboldAI Lite web UI.',
					details: [
						'- Official downloads come only from the GitHub releases: https://github.com/LostRuins/koboldcpp/releases/latest',
						'- Project home: https://github.com/LostRuins/koboldcpp',
					].join('\n'),
					// Drop the heading "Section titled …" anchor links from every output.
					customSelectors: { all: ['.sl-anchor-link'] },
				}),
			],
		}),
		markdoc(),
		llmsAbsoluteLinks(),
	],
});
