import text from '../assets/fonts/atkinson-hyperlegible-next.woff2?url';
import display from '../assets/fonts/young-serif.woff2?url';
import mono from '../assets/fonts/atkinson-hyperlegible-mono.woff2?url';

const preload = (href: string) => ({ rel: 'preload', href, as: 'font', type: 'font/woff2', crossorigin: '' });

/**
 * The text and heading fonts, preloaded on every page so they are usually ready at the first paint.
 * Otherwise the text reflows when they swap in (Lighthouse measured a layout shift of 0.2 on phones).
 */
export const FONT_PRELOADS = [text, display].map(preload);

/** Docs pages also show inline code near the top, which reflows the same way when the mono font swaps in. */
export const DOCS_FONT_PRELOADS = [...FONT_PRELOADS, preload(mono)];
