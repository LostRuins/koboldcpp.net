import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';
import starlightMarkdoc from '@astrojs/starlight-markdoc';
import Markdoc from '@markdoc/markdoc';

/** @param {import('@markdoc/markdoc').RenderableTreeNode} n */
const textOf = (n) => (typeof n === 'string' ? n : Markdoc.Tag.isTag(n) ? n.children.map(textOf).join('') : '');
/** @param {import('@markdoc/markdoc').RenderableTreeNode} n @param {string} name */
const childTags = (n, name) => (Markdoc.Tag.isTag(n) ? n.children.filter((c) => Markdoc.Tag.isTag(c) && c.name === name) : []);
/**
 * Longest piece that can't wrap: a word, or an inline code token up to 30 characters (longer ones may break).
 * @param {import('@markdoc/markdoc').RenderableTreeNode} n @returns {number}
 */
const unbreakable = (n) => {
	if (typeof n === 'string') return Math.max(0, ...n.split(/\s+/).map((w) => w.length));
	if (!Markdoc.Tag.isTag(n)) return 0;
	if (n.name === 'code') return Math.max(0, ...textOf(n).split(/\s+/).filter((t) => t.length <= 30).map((t) => t.length));
	return Math.max(0, ...n.children.map(unbreakable));
};

export default defineMarkdocConfig({
	extends: [starlightMarkdoc()],
	nodes: {
		image: {
			attributes: nodes.image.attributes,
			render: component('./src/components/markdoc/DocImage.astro'),
		},
		// Inline code with spaces or over 30 characters (commands, messages, URLs) may wrap; short tokens such as flags stay whole.
		// With spaces, each token up to 30 characters gets its own span, so lines break only at the spaces: browsers also
		// break after hyphens, which would split flags like --contextsize.
		code: {
			attributes: nodes.code.attributes,
			transform(node) {
				const { content } = node.attributes;
				if (!content.includes(' ')) return new Markdoc.Tag('code', content.length > 30 ? { class: 'wrap' } : {}, [content]);
				const parts = content.split(/( +)/).map((part) => (part.trim() && part.length <= 30 ? new Markdoc.Tag('span', {}, [part]) : part));
				return new Markdoc.Tag('code', { class: 'wrap' }, parts);
			},
		},
		// Tables get class "stack" when they don't fit a 360 px phone without breaking words (about 40 characters, with
		// 5 per column for cell padding), or would squeeze prose: 3 columns and a cell over 22 characters, or a
		// first-column cell over 22 characters. On phones each row then becomes a block and every cell shows its column
		// name from data-label (src/styles/starlight.css). Narrow tables of short values stay tables.
		table: {
			transform(node, config) {
				const table = new Markdoc.Tag('table', node.transformAttributes(config), node.transformChildren(config));
				const [thead] = childTags(table, 'thead');
				const labels = childTags(childTags(thead, 'tr')[0], 'th').map((th) => textOf(th).trim());
				const rows = childTags(table, 'tbody').flatMap((tbody) => childTags(tbody, 'tr'));
				const cells = rows.flatMap((tr) => childTags(tr, 'td'));
				const firstCells = rows.map((tr) => childTags(tr, 'td')[0]).filter(Boolean);
				const long = (td) => textOf(td).length > 22;
				const allRows = [...childTags(thead, 'tr'), ...rows];
				const widest = (i) => Math.max(...allRows.map((tr) => unbreakable(tr.children.filter(Markdoc.Tag.isTag)[i])));
				const minWidth = labels.reduce((sum, _, i) => sum + 5 + widest(i), 0);
				if (minWidth <= 40 && !(labels.length === 3 && cells.some(long)) && !firstCells.some(long)) return table;
				for (const tr of rows) childTags(tr, 'td').forEach((td, i) => labels[i] && (td.attributes['data-label'] = labels[i]));
				table.attributes.class = 'stack';
				return table;
			},
		},
	},
});
