# Verity Building Group

Standalone reconstruction of the published Verity Building Group staging website. Astro renders meaningful HTML for every page; a Node server handles routes, redirects, search, metadata and inquiries. The deployed app uses no WordPress, PHP, MySQL, WP Engine, theme engine or plugins.

## Local setup

Use Node 24 LTS and pnpm 11.19.0:

```sh
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

The development URL is http://localhost:4321. Production:

```sh
pnpm build
HOST=0.0.0.0 PORT=3000 pnpm start
```

Set runtime environment variables through your shell or Railway. Never commit actual values. `.env.example` contains names only.

| Variable                | Purpose                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `SITE_URL`              | Canonical origin. Production must use `https://veritybuildinggroup.com`; previews use their Railway URL. |
| `INDEXABLE`             | Only `true` enables indexing. Omit on staging to preserve source noindex/nofollow and robots disallow.   |
| `HOST`                  | `0.0.0.0` for production; already set in Dockerfile.                                                     |
| `PORT`                  | Supplied by Railway; local production defaults to adapter default if omitted.                            |
| `CONTACT_FORM_SECRET`   | Random secret at least 32 characters; used to sign expiring form tokens. Configure privately in Railway. |
| `CONTACT_WEBHOOK_URL`   | Your HTTPS inquiry-delivery endpoint accepting multipart fields and attachments.                         |
| `CONTACT_WEBHOOK_TOKEN` | Optional bearer token for that endpoint.                                                                 |

## Architecture and editing

Astro 7 with the official Node adapter was selected because the site is primarily editorial and needs server-rendered HTML, straightforward file editing, reusable chrome, small native interaction scripts, and a server-side inquiry endpoint. React hydration and a database are unnecessary.

- `src/content/pages/*.json`: one document per public route. `sections` are sanitized, browser-normalized HTML fragments, retaining formatting and image associations. A split between sections inserts the shared inquiry form. Edit text, links and headings directly, without WordPress shortcodes or block comments.
- Area-page overrides (`custom-home-builder-in-charlotte-nc`, `lake-norman-custom-home-builder`, `north-mecklenburg-iredell-builder`) have editable `.html` files in `src/content/overrides/`. Shared titles, descriptions, social metadata, and structured data are owned by `src/lib/seo.ts`; the historical `.seo.json` snapshots no longer override that shared source of truth. Reapply the override script after editing page content. Run `pnpm test:seo` against the running site; see `docs/AREA_SEO.md` for launch and validation details.
- `src/content/overrides/about.html`: editable About page, including fully linked area cards; page styling is in `src/styles/about.css`.
- `src/content/overrides/custom-home-builder-charlotte-nc.html`: editable Custom Homes page; shares the service detail layout and styles.
- `src/content/overrides/land-development-charlotte-nc.html`: editable Land Development page; shares the Legacy Projects layout and styles.
- `src/content/overrides/legacy-projects.html`: editable Legacy Projects redesign; uses shared editorial styles plus `src/styles/legacy.css`. Synchronize with the same content override script below.
- `src/content/overrides/services.html`: editable Services page layout and copy; its scoped design lives in `src/styles/services.css`. Run `.local/audit-tools/bin/python scripts/apply-content-overrides.py` after editing to synchronize the page JSON. Future migrations also preserve this override.
- `src/content/routes.json`: public route inventory and source file association. Add a document and its route here when adding pages/posts.
- `src/content/chrome.json`: shared navigation and footer content.
- `src/components/`: reusable header, footer, inquiry form and project dialog.
- `src/styles/source.css`: source-derived design rules, with self-contained local asset references and renamed CMS style namespaces. No original theme is loaded at runtime.
- `src/styles/site.css`: shared design tokens, standalone interactions, form controls, focus and reduced-motion rules.
- `src/scripts/site.ts`: menu, reveals, filters, carousel controls, dialog focus management and progressive form.
- `public/assets/`: only assets referenced by published website output. Existing responsive variants are retained only where referenced.
- `src/content/asset-repairs.json`: owner-approved mapping for twelve broken source gallery image URLs to visually verified published photos.

Add an image to `public/assets`, use its `/assets/...` path, and preserve its aspect ratio. Public content should never contain credentials, drafts, submissions or customer records. Avoid active inline HTML/event handlers. Run validation after edits.

## Repeatable public migration

The migration does not read the database export. The read-only crawler requests public REST content identifiers, public sitemaps and linked pages only; it excludes WordPress user endpoints and author archives. Its snapshots stay under ignored `.local/`.

```sh
python3 -m venv .local/audit-tools
.local/audit-tools/bin/pip install -r scripts/requirements.txt
.local/audit-tools/bin/python scripts/audit-public.py
.local/audit-tools/bin/python scripts/migrate-public.py
```

Review generated changes before committing. Re-running replaces generated page content and design CSS, so preserve intentional subsequent edits. Referenced source assets are resolved from the ignored local import, or downloaded read-only from their public URL. Unused upload duplicates and private data are not copied.

## Inquiries

The form progressively reveals the original fields, validates server-side, requires usable email or phone, uses signed two-hour tokens, a honeypot, origin validation and a bounded process-local rate limiter. Missing delivery configuration returns 503; provider rejection returns 502. A success message appears only after the HTTPS delivery endpoint returns 2xx. No inquiry data is logged or stored by this app.

The endpoint receives `firstName`, `lastName`, `email`, `phone`, `location`, `projectType`, `intendedUse`, `stage`, `timing`, `message`, `preferredContact`, `bestTime`, and zero to eight `files`. It must return 2xx only after accepting the inquiry for real delivery. It must quarantine/scan attachments before opening or distributing them. Format/signature validation is not malware scanning.

The source allowed eight 50 MiB attachments. This implementation retains the per-file limit but bounds the full multipart request to 52 MiB, with UI combined limit 50 MiB, to avoid unbounded process memory. Single-replica Railway deployment is intentional; add a shared rate limiter before scaling replicas. No test sends real submissions.

## Validation

```sh
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm test:routes
# Against a running production or Railway server:
TEST_BASE_URL=https://your-staging.up.railway.app pnpm test:routes
```

Route validation checks the 34-route inventory for successful meaningful HTML, titles, canonical metadata, absence of WordPress runtime references, referenced assets, internal links, redirects, trailing slashes, sitemap exclusions, the selected indexing mode, and proper 404 status. Contact unit tests cover anti-spam, bounds, validation and provider success/failure using mocks.

## Railway staging

Use the Digital Alchemy organization and its existing Pro plan. Create a project/service from `Go-Digital-Alchemy-Repos/verity-building-group`, name the environment `staging`, and deploy `main`. The service uses the Dockerfile builder, `/health.json` health check, one replica, and three on-failure retries. These were configured in Railway directly because its dashboard reports that new services cannot opt into legacy Config as Code; `railway.json` remains a documented legacy equivalent. Docker copies only standalone source, public assets and the public content/asset manifests; the raw WordPress tree, backups and local artifacts never enter the image.

Generate a Railway domain, set `SITE_URL` to that HTTPS origin, leave `INDEXABLE` unset, and configure the inquiry variables privately. The server uses Railway's supplied `PORT` and binds `0.0.0.0`. Preview and staging environments remain blocked from indexing.

## Redirects and SEO

Manage permanent redirects in `src/content/redirects.json`. Middleware normalizes known content to trailing slashes. The obsolete commercial-services route preserves the source redirect to `/`; WordPress sitemap URLs redirect to `/sitemap.xml`. `/feed/` redirects to a standalone RSS feed. Author archive URLs redirect to `/insights/` without migrating user accounts. Unknown paths return 404.

Titles, descriptions, Open Graph/Twitter fields and relevant JSON-LD are centralized in `src/lib/seo.ts`. Canonical/social origins use `SITE_URL`; public image metadata resolves source upload URLs to local assets. Staging stays excluded from indexing. In production, set `SITE_URL=https://veritybuildinggroup.com` and enable `INDEXABLE=true` only after the apex and `www` domains pass DNS and certificate validation. Requests arriving on alternate production hosts then redirect to the canonical apex domain.

## Source and licenses

Read `docs/AUDIT.md`, `docs/public-inventory.json`, `docs/assets.json`, and `docs/licenses/`. Fonts are independently packaged SIL Open Font License versions of Lato, Open Sans and Cormorant Garamond; Adobe font binaries and Font Awesome Pro binaries are not copied. The source theme's GPL license is retained for derived design code. Website imagery is owner-authorized source material; no additional stock-image rights have been inferred.

Legacy WordPress files from the earlier backup import remain local and ignored. They are neither deployed nor committed. Do not run their imported configuration.

## Deployed staging

- Website: https://verity-building-group-staging-staging.up.railway.app/
- Workspace: Digital Alchemy (existing Pro plan).
- Project: Verity Building Group; environment: staging; service: verity-building-group-staging.
- Repository: https://github.com/Go-Digital-Alchemy-Repos/verity-building-group
- Configured: `SITE_URL` and `PORT=3000`; Docker supplies `HOST=0.0.0.0`.
- Inquiry delivery remains unavailable for the confirmed destination `info@veritybuildinggroup.com` until the owner privately configures `CONTACT_FORM_SECRET`, `CONTACT_WEBHOOK_URL`, and optionally `CONTACT_WEBHOOK_TOKEN`.

Astro's trusted-host list in `astro.config.mjs` includes the staging hostname, the approved apex and `www` production hosts, and localhost. Origin validation remains enabled.

No production cutover has been performed. See `docs/VALIDATION.md` for evidence and limitations.

### Field Guide listing

`/insights/` and `/category/field-guide/` render `src/components/BlogIndex.astro`, styled by `src/styles/blog.css`. Their historical HTML records are not used for the listing body. `src/content/blog.json` stores the public article summaries, publication dates, topics, locations and local image references. Keep this index in sync when adding or editing a post; rebuild it from migrated single-post records with `.local/audit-tools/bin/python scripts/build-blog-index.py` (Python with BeautifulSoup required). The migration script rebuilds it automatically. Only include published articles. Sorting is newest first; topic and location choices derive from the index. Search and combined filters use GET parameters and server-rendered results, so they also work without JavaScript.

### Portfolio gallery

`src/content/portfolio.json` is the curated, shuffled photo list for `src/components/Portfolio.astro`; it supersedes the historical portfolio HTML body. Each item includes a local asset, descriptive alt text, original dimensions, and either `Interior` or `Exterior`. Preserve this reviewed list during reimports. Four labeled AI concepts, thirteen digitally staged images, and two additional versions of the same waterfront photo were excluded. Original files remain available to other pages. The masonry gallery preserves full image proportions; selecting an active filter again shows both categories. The native modal viewer follows the current filtered order and offers previous/next, arrow keys, Escape, and an optional five-second play/pause slideshow. Closing or hiding the browser tab stops playback. No automatic playback or transition motion is used.
