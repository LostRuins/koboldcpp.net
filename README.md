# koboldcpp.net

Source files for KoboldCpp.net, the official KoboldCpp community website.

A responsive, light-themed static website with 10 content pages plus a custom 404. All reading, navigation, download links, and FAQ content work without JavaScript. Small progressive enhancements provide mobile navigation, local resource/template filtering, and command copying. There are no runtime packages, remote fonts, analytics, or client-side content fetches.

## Preview

Double-click `index.html` to preview the site directly. Styles, images, page navigation, and resource filters work with `file://` URLs; reading and navigation also work with JavaScript disabled. If the browser does not permit clipboard access for local files, the copy button selects the command for manual copying.

For a preview served over HTTP, run this from the repository root:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Then open http://127.0.0.1:8080. Content pages use document-relative asset paths and explicit `index.html` navigation links. Canonical URLs, structured data, and sitemap entries point to the preferred production URLs at https://koboldcpp.net. The custom `404.html` intentionally keeps root-relative paths because web hosts can serve it at arbitrary missing URLs; preview that error page through HTTP.

On this workstation, Python is available at `D:\MainApplications\PythonPortable\App\python.exe` if `python` is not on PATH.

## Edit and rebuild

- `content.py`: page copy, template descriptions, resource directory, FAQs, and source links.
- `build.py`: shared layout, home page, navigation, metadata, structured data, sitemap generation.
- `assets/site.css`: responsive light theme, layout, focus styles, reduced-motion behavior.
- `assets/site.js`: progressive enhancements; no third-party requests.
- `SOURCES.md`: source references and editorial maintenance notes.

```sh
python build.py
python tools/check_site.py
```

The build uses only the Python standard library. Commit the generated HTML, sitemap, and robots file alongside the sources. Build output is deterministic; rebuilding does not fabricate content modification dates. The included PNG assets need no build step. To recreate the social card and touch icon, `tools/render_assets.py` optionally uses Pillow.

## Deploy

The generated site is ready to serve; no server runtime or JavaScript build is needed.

- **GitHub Pages:** publish the repository root of the chosen branch. Set the custom domain to `koboldcpp.net`, configure domain ownership/DNS through the host, and enable HTTPS. `CNAME` and `.nojekyll` are included. A project URL below a repository subpath is not the intended deployment.
- **Cloudflare Pages:** use no framework and publish the repository root. No build command is required if generated files are committed; alternatively run `python build.py`. Configure the custom domain. `_headers` supplies optional host-supported headers.
- **Other hosts:** upload the generated HTML directories, `assets/`, `robots.txt`, `sitemap.xml`, and `404.html`. Configure the host to serve `index.html` inside directories and return HTTP 404 with `404.html` for missing paths.

For production uploads to a generic host, source Python files and documentation are not needed. They contain no secrets, but can be left out of the public document root. Keep source available as required by the included license.

The website is prepared locally. Deployment, DNS changes, account verification, and search-engine submissions are separate actions; none are performed by the site code.

## Search visibility and launch work

Built in: unique page titles/descriptions, crawlable HTML, internal topic links, one H1 per page, canonical HTTPS URLs, Open Graph/Twitter images, WebSite/WebPage/SoftwareApplication/BreadcrumbList JSON-LD, `robots.txt`, and an XML sitemap. FAQ content is visible in native details elements; no promise is made about search rich results or ranking.

At launch:

1. Verify that all public URLs use HTTPS and resolve to `koboldcpp.net`. Redirect alternate hostnames and preview domains to the canonical host where practical.
2. Test the live site, downloads, custom 404 status, sitemap, and social card. Remove any host-level password or indexing block on the production site.
3. Verify ownership in Google Search Console and Bing Webmaster Tools, then submit `https://koboldcpp.net/sitemap.xml`.
4. Add an official link back to this domain from the project README, wiki, and other project-controlled profiles. This gives visitors a verifiable chain from the established project to the new community website.
5. Keep the guides accurate as releases and templates change. Check Search Console for crawl/indexing problems and useful questions to answer.

SEO improves discoverability; no implementation can guarantee an outranking result. The site emphasizes useful original guidance and source transparency.

## Validation

`tools/check_site.py` checks all pages for metadata, JSON-LD, local URLs and anchors, missing image alt text, duplicate IDs, sitemap coverage, and accidental links to the lookalike domain. `tools/browser_check.py` additionally uses a local matching Chrome/ChromeDriver pair for desktop/mobile, no-JavaScript navigation, filtering, FAQ, command-copy, and console checks. It uses only standard-library Python and does not install browser packages.

See `SOURCES.md` for references and asset provenance. The upstream AGPL-3.0 license is included in `LICENSE.md`.
