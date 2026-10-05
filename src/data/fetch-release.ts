/**
 * Fetches the latest KoboldCpp release from the GitHub API and parses it into the shape the site uses. Shared by the build (`release.ts`) and the
 * `bun run update-release` script that refreshes the committed cache.
 */

const REPO = 'LostRuins/koboldcpp';
const API = `https://api.github.com/repos/${REPO}`;

export interface ReleaseAsset {
	name: string;
	/** Bytes */
	size: number;
	/** Versioned download URL on github.com (from the API's browser_download_url). */
	url: string;
}

export interface ReleaseSummary {
	tag: string;
	/** Tag without the leading "v", e.g. "1.122.1". */
	version: string;
	/** ISO 8601 timestamp */
	publishedAt: string;
	htmlUrl: string;
}

export interface ReleaseData extends ReleaseSummary {
	assets: ReleaseAsset[];
	/** ISO timestamp of when this data was fetched from GitHub. */
	fetchedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(obj: Record<string, unknown>, key: string): string {
	const v = obj[key];
	if (typeof v !== 'string' || v === '') throw new Error(`release field "${key}" is not a non-empty string`);
	return v;
}

function num(obj: Record<string, unknown>, key: string): number {
	const v = obj[key];
	if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`release field "${key}" is not a number`);
	return v;
}

function assertGithubUrl(url: string): string {
	if (!url.startsWith(`https://github.com/${REPO}/`)) throw new Error(`unexpected URL outside the official repo: ${url}`);
	return url;
}

function parseSummary(raw: unknown): ReleaseSummary {
	if (!isRecord(raw)) throw new Error('release is not an object');
	const tag = str(raw, 'tag_name');
	return {
		tag,
		version: tag.replace(/^v/, ''),
		publishedAt: str(raw, 'published_at'),
		htmlUrl: assertGithubUrl(str(raw, 'html_url')),
	};
}

function parseAssets(raw: unknown): ReleaseAsset[] {
	if (!isRecord(raw) || !Array.isArray(raw.assets)) throw new Error('release has no assets array');
	const assets = raw.assets.map((a: unknown) => {
		if (!isRecord(a)) throw new Error('asset is not an object');
		return { name: str(a, 'name'), size: num(a, 'size'), url: assertGithubUrl(str(a, 'browser_download_url')) };
	});
	if (assets.length === 0) throw new Error('release has no assets');
	return assets;
}

async function getJson(url: string, token: string | undefined): Promise<unknown> {
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'koboldcpp.net-build',
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
	if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
	return res.json();
}

/** The latest release with its assets. Throws on any network or shape problem. */
export async function fetchRelease(token = process.env.GITHUB_TOKEN): Promise<ReleaseData> {
	const raw = await getJson(`${API}/releases/latest`, token);
	return { ...parseSummary(raw), assets: parseAssets(raw), fetchedAt: new Date().toISOString() };
}

/** Validates data read back from the JSON cache (same shape as fetchRelease output). */
export function parseCachedRelease(raw: unknown): ReleaseData {
	if (!isRecord(raw)) throw new Error('cache is not an object');
	const summary = (r: unknown): ReleaseSummary => {
		if (!isRecord(r)) throw new Error('cached release is not an object');
		return { tag: str(r, 'tag'), version: str(r, 'version'), publishedAt: str(r, 'publishedAt'), htmlUrl: assertGithubUrl(str(r, 'htmlUrl')) };
	};
	if (!Array.isArray(raw.assets)) throw new Error('cache is missing assets');
	return {
		...summary(raw),
		assets: raw.assets.map((a: unknown) => {
			if (!isRecord(a)) throw new Error('cached asset is not an object');
			return { name: str(a, 'name'), size: num(a, 'size'), url: assertGithubUrl(str(a, 'url')) };
		}),
		fetchedAt: str(raw, 'fetchedAt'),
	};
}
