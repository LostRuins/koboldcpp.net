/** External sites, official or run by the KoboldAI community. Downloads only ever go to the GitHub releases. */
export const EXT = {
	repo: 'https://github.com/LostRuins/koboldcpp',
	wiki: 'https://github.com/LostRuins/koboldcpp/wiki',
	issues: 'https://github.com/LostRuins/koboldcpp/issues',
	discussions: 'https://github.com/LostRuins/koboldcpp/discussions',
	hf: 'https://huggingface.co/koboldcpp',
	discord: 'https://koboldai.org/discord',
} as const;

/** Internal links used by components. Docs pages link by path directly. */
export const ROUTES = {
	home: '/',
	download: '/download/',
	gettingStarted: '/getting-started/',
	docs: '/docs/',
	links: '/links/',
} as const;

/**
 * The one navigation bar (SiteNav, on the home page and every docs page).
 * `tier` = the smallest width at which the link shows in the bar: 1 = 50rem, 2 = 64rem, 3 = 72rem.
 * Below 50rem every link lives in the menu (MENU_LINKS) instead.
 */
export const NAV_LINKS = [
	{ href: ROUTES.home, label: 'Home', tier: 3 },
	{ href: ROUTES.download, label: 'Download', tier: 1 },
	{ href: ROUTES.gettingStarted, label: 'Getting started', tier: 1 },
	{ href: ROUTES.docs, label: 'Wiki', tier: 1 },
	{ href: ROUTES.links, label: 'Links', tier: 2 },
] as const;

/** The menu on phones (home menu and the docs sidebar footer): every nav link plus GitHub. */
export const MENU_LINKS = [
	...NAV_LINKS.map(({ href, label }) => ({ href, label })),
	{ href: EXT.repo, label: 'KoboldCpp GitHub' },
] as const;

/** Label of the beginner guide's sidebar group (astro.config.mjs); src/starlightRouteData.ts looks it up. */
export const BEGINNER_GUIDE = 'Getting started';
