import assert from "node:assert/strict";
import { seoByPath } from "../src/lib/seo.ts";
const base = process.env.TEST_BASE_URL || "http://localhost:4321";
const origin = process.env.EXPECT_SITE_URL || new URL(base).origin;
const indexable = process.env.EXPECT_INDEXABLE === "true";
const slugs = [
  "custom-home-builder-in-charlotte-nc",
  "lake-norman-custom-home-builder",
  "north-mecklenburg-iredell-builder",
];
const decode = (s) =>
  s.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
const attr = (tag, key) =>
  decode(tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1] || "");
const titles = new Set();
const descriptions = new Set();
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
for (const slug of slugs) {
  const expected = seoByPath[`/${slug}/`];
  const response = await fetch(`${base}/${slug}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] || "");
  assert.equal(title, expected.title);
  assert(!titles.has(title));
  titles.add(title);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const tags = html.match(/<meta\b[^>]*>/g) || [];
  for (const tag of tags.filter((t) => attr(t, "name") || attr(t, "property")))
    assert.equal(
      (tag.match(/\bcontent=/g) || []).length,
      1,
      "Each meta tag must have a single content attribute",
    );
  const meta = (key) =>
    tags
      .filter((t) => attr(t, "name") === key || attr(t, "property") === key)
      .map((t) => attr(t, "content"));
  const description = expected.description;
  assert.deepEqual(meta("description"), [description]);
  assert(!descriptions.has(description));
  descriptions.add(description);
  for (const key of ["og:description", "twitter:description"])
    assert.deepEqual(meta(key), [description]);
  for (const key of ["og:title", "twitter:title"])
    assert.deepEqual(meta(key), [title]);
  const url = `${origin}/${slug}/`;
  assert.deepEqual(meta("og:url"), [url]);
  const canonicals = (html.match(/<link\b[^>]*>/g) || []).filter(
    (t) => attr(t, "rel") === "canonical",
  );
  assert.equal(canonicals.length, 1);
  assert.equal(attr(canonicals[0], "href"), url);
  assert.deepEqual(meta("robots"), [
    indexable ? "index, follow" : "noindex, nofollow",
  ]);
  if (!indexable)
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  assert(sitemap.includes(`<loc>${url}</loc>`));
  for (const key of ["og:image", "twitter:image"]) {
    const image = new URL(meta(key)[0]);
    assert.equal(image.origin, origin);
    assert(image.pathname.startsWith("/assets/"));
    assert.equal((await fetch(base + image.pathname)).status, 200);
  }
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));
  const graph = scripts.flatMap((s) => s["@graph"] || [s]);
  for (const type of ["WebPage", "Service", "BreadcrumbList"])
    assert.equal(graph.filter((n) => n["@type"] === type).length, 1);
  const crumbs = graph.find(
    (n) => n["@type"] === "BreadcrumbList",
  ).itemListElement;
  assert.deepEqual(
    crumbs.map((c) => c.position),
    [1, 2, 3],
  );
  assert.equal(crumbs[2].item, url);
  assert.equal(graph.find((n) => n["@type"] === "WebPage").url, url);
  const service = graph.find((n) => n["@type"] === "Service");
  assert(service.areaServed.length);
  assert.equal(service.url, url);
  assert(!JSON.stringify(graph).includes("wpengine"));
  assert(!/commercial/i.test(html));
  for (const other of slugs.filter((s) => s !== slug))
    assert(html.includes(`href="/${other}/"`));
  console.log(
    `PASS ${slug}: HTML, metadata, schema, canonical, social images, sitemap, indexing mode`,
  );
}
const robots = await (await fetch(`${base}/robots.txt`)).text();
assert(robots.includes(indexable ? "Allow: /" : "Disallow: /"));
console.log(
  `Area SEO checks passed (${indexable ? "production-mode simulation" : "staging"}).`,
);
