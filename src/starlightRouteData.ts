import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { DOCS_FONT_PRELOADS } from './data/font-preloads';
import { BEGINNER_GUIDE } from './data/routes';

export const onRequest = defineRouteMiddleware(({ locals }) => {
	const route = locals.starlightRoute;
	route.head.push(...DOCS_FONT_PRELOADS.map((attrs) => ({ tag: 'link' as const, attrs })));

	// The beginner guide's pages show only the guide's steps; every other page shows the wiki without them.
	const guide = route.sidebar.find((entry) => entry.type === 'group' && entry.label === BEGINNER_GUIDE);
	if (guide?.type !== 'group') return;
	const inGuide = guide.entries.some((entry) => entry.type === 'link' && entry.isCurrent);
	route.sidebar = inGuide ? guide.entries : route.sidebar.filter((entry) => entry !== guide);
});
