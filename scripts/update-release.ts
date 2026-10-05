/** Refreshes src/data/release.cache.json from the GitHub API. Usage: bun run update-release */
import { writeFile } from 'node:fs/promises';
import { fetchRelease } from '../src/data/fetch-release';

const data = await fetchRelease();
const path = new URL('../src/data/release.cache.json', import.meta.url);
await writeFile(path, JSON.stringify(data, null, '\t') + '\n');
console.log(`release.cache.json -> ${data.tag} (${data.assets.length} assets)`);
