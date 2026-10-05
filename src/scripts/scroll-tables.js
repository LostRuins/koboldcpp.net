/*
 * Docs tables scroll sideways when they are wider than the page (Starlight sets them to `overflow: auto`).
 * A scrolling table must be reachable by keyboard, so it gets tabindex="0" while it overflows, like
 * Expressive Code does for code blocks. Non-scrolling tables stay out of the tab order.
 */
function markScrollTables() {
	for (const table of document.querySelectorAll('.sl-markdown-content table')) {
		if (table.scrollWidth > table.clientWidth) table.tabIndex = 0;
		else table.removeAttribute('tabindex');
	}
}
markScrollTables();
addEventListener('resize', markScrollTables);
