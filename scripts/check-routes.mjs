import fs from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://localhost:4321";
const indexable = process.env.EXPECT_INDEXABLE === "true";
const routes = JSON.parse(await fs.readFile("src/content/routes.json", "utf8"));
const redirects = JSON.parse(
  await fs.readFile("src/content/redirects.json", "utf8"),
);
const paths = new Set(routes.map((r) => r.path));
let failures = [];
let assets = new Set();
let links = new Set();
const results = [];
const baseOrigin = new URL(base).origin;
function collectAsset(value, context = base + "/", required = false) {
  if (!value || /^(?:data:|blob:|#)/.test(value)) return;
  const url = new URL(value.replaceAll("&amp;", "&"), context);
  if (/wpengine|wp-content|wp-includes|typekit|kit\.fontawesome/.test(url.href))
    failures.push(`Obsolete runtime asset: ${url.href}`);
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_astro/")
  )
    assets.add(url.pathname + url.search);
  else if (required && url.origin === baseOrigin)
    assets.add(url.pathname + url.search);
}
function collectCss(css, context) {
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))
    collectAsset(match[1].trim(), context, true);
}
function collectSchema(value, key = "") {
  if (
    typeof value === "string" &&
    ["image", "logo", "contentUrl", "thumbnailUrl"].includes(key)
  )
    collectAsset(value, base + "/", true);
  else if (Array.isArray(value))
    value.forEach((item) => collectSchema(item, key));
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([name, item]) => collectSchema(item, name));
}
for (const { path } of routes) {
  if (redirects[path]) continue;
  const response = await fetch(base + path);
  const html = await response.text();
  const checks = {
    status: response.status,
    html: html.includes("<main") && /<h1\b/.test(html),
    title: !!html.match(/<title>[^<]+<\/title>/),
    canonical: html.includes('rel="canonical"'),
    noWordPressRuntime:
      !/(?:src|href)=["'][^"']*(?:wp-content|wp-includes|wp-json|typekit|kit.fontawesome)/.test(
        html,
      ),
  };
  for (const [k, v] of Object.entries(checks))
    if (k === "status" ? v !== 200 : !v) failures.push(`${path}: ${k}=${v}`);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const value = match[1];
    if (value.startsWith("/assets/") || value.startsWith("/_astro/"))
      assets.add(value);
    else if (
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.startsWith("/@")
    )
      links.add(value.split("#")[0]);
  }
  for (const match of html.matchAll(/srcset=["']([^"']+)["']/g))
    for (const candidate of match[1].split(","))
      collectAsset(candidate.trim().split(/\s+/)[0], base + path, true);
  collectCss(html, base + path);
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      collectSchema(JSON.parse(match[1]));
    } catch {
      failures.push(`${path}: invalid JSON-LD`);
    }
  }
  results.push({ path, ...checks });
}
for (const path of assets) {
  const stylesheet = new URL(path, base).pathname.endsWith(".css");
  const r = await fetch(base + path, { method: stylesheet ? "GET" : "HEAD" });
  if (!r.ok) failures.push(`Asset ${path}: ${r.status}`);
  if (stylesheet && r.ok) collectCss(await r.text(), base + path);
}
for (const path of links) {
  if (!path || path === "/api/contact/") continue;
  const r = await fetch(base + path);
  if (!r.ok) failures.push(`Link ${path}: ${r.status}`);
}
for (const [path, destination] of Object.entries(redirects)) {
  const r = await fetch(base + path, { redirect: "manual" });
  if (r.status !== 301 || r.headers.get("location") !== destination)
    failures.push(`Redirect ${path}: ${r.status}`);
}
for (const path of paths) {
  if (redirects[path]) continue;
  if (path !== "/") {
    const r = await fetch(base + path.slice(0, -1), { redirect: "manual" });
    if (r.status !== 301) failures.push(`Trailing slash ${path}: ${r.status}`);
  }
}
if ((await fetch(base + "/does-not-exist-verity-check/")).status !== 404)
  failures.push("Unknown route does not return404");
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
for (const path of Object.keys(redirects))
  if (sitemap.includes(new URL(path, base).href + "</loc>"))
    failures.push("Redirected route remains in sitemap " + path);
const robots = await (await fetch(base + "/robots.txt")).text();
if (!robots.includes(indexable ? "Allow: /" : "Disallow: /"))
  failures.push(
    indexable
      ? "Production robots does not allow crawling"
      : "Staging robots is indexable",
  );
const health = await fetch(base + "/health.json");
if (!health.ok) failures.push("Health check failed");
const report = {
  base,
  routeCount: routes.length,
  assetCount: assets.size,
  linkCount: links.size,
  results,
  failures,
};
await fs.mkdir(".local/validation", { recursive: true });
await fs.writeFile(
  ".local/validation/routes.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      routeCount: routes.length,
      assetCount: assets.size,
      linkCount: links.size,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
