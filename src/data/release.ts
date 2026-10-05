/**
 * The latest KoboldCpp release (version, date, files), resolved once at build time from the GitHub API.
 * Used by the download-link check and the home page's structured data.
 * On failure the build falls back to the committed `release.cache.json` (refresh it with
 * `bun run update-release`), unless strict mode is on:
 *   RELEASE_STRICT=1, or CI set together with GITHUB_TOKEN  ->  a GitHub failure fails the build.
 */
import cache from './release.cache.json';
import { fetchRelease, parseCachedRelease, type ReleaseData } from './fetch-release';

export type { ReleaseAsset, ReleaseData, ReleaseSummary } from './fetch-release';

const env = process.env;
export const RELEASE_STRICT = env.RELEASE_STRICT === '1' || (Boolean(env.CI) && Boolean(env.GITHUB_TOKEN));

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

interface LoadedRelease extends ReleaseData {
	source: 'github' | 'cache';
}

async function loadRelease(): Promise<LoadedRelease> {
	try {
		const latest = await fetchRelease();
		console.info(`[release] GitHub API: ${latest.tag} (${latest.assets.length} assets)`);
		return { ...latest, source: 'github' };
	} catch (err) {
		if (RELEASE_STRICT) throw new Error(`[release] strict mode: fetching the latest release failed: ${message(err)}`);
		const cached = parseCachedRelease(cache);
		console.warn(`[release] GitHub API failed (${message(err)}); using cache ${cached.tag} fetched ${cached.fetchedAt}`);
		return { ...cached, source: 'cache' };
	}
}

export const release = await loadRelease();

/** Official "always latest" release link. Links to downloads use this, never a mirror. */
export const LATEST_URL = 'https://github.com/LostRuins/koboldcpp/releases/latest';

/** YYYY-MM-DD for JSON-LD. */
export const isoDate = (iso: string) => iso.slice(0, 10);
