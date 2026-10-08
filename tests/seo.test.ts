import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import portfolioImages from "../src/content/portfolio.json";
import routes from "../src/content/routes.json";
import { buildSeo, noIndexPaths, seoByPath } from "../src/lib/seo";

type SourcePage = {
  title: string;
  meta: Record<string, string>[];
  sections: string[];
};

const site = "https://veritybuildinggroup.com";

const pageFor = async (file: string) =>
  JSON.parse(
    await readFile(`src/content/pages/${file}`, "utf8"),
  ) as SourcePage;

const graphTypes = (schema: unknown[]) => {
  const graph = (schema[0] as { "@graph": Array<{ "@type": unknown }> })[
    "@graph"
  ];
  return graph.flatMap((entry) =>
    Array.isArray(entry["@type"]) ? entry["@type"] : [entry["@type"]],
  );
};

test("every content route has concise, unique shared metadata", async () => {
  const indexable = routes.filter((route) => !noIndexPaths.has(route.path));
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const route of routes) {
    const definition = seoByPath[route.path];
    assert.ok(definition, `missing SEO definition for ${route.path}`);
    assert.ok(definition.title.length <= 70, `long title for ${route.path}`);
    assert.ok(
      definition.description.length >= 70 && definition.description.length <= 160,
      `description length for ${route.path}`,
    );
  }

  for (const route of indexable) {
    const definition = seoByPath[route.path];
    assert.ok(!titles.has(definition.title), `duplicate title ${definition.title}`);
    assert.ok(
      !descriptions.has(definition.description),
      `duplicate description ${definition.description}`,
    );
    titles.add(definition.title);
    descriptions.add(definition.description);
  }
});

test("Open Graph and Twitter metadata stay synchronized with page SEO", async () => {
  for (const route of routes) {
    const page = await pageFor(route.file);
    const seo = buildSeo({
      path: route.path,
      site,
      page,
      portfolioImages,
    });
    const metaValue = (key: string, value: string) =>
      seo.meta.find((entry) => entry[key] === value)?.content;

    assert.equal(metaValue("name", "description"), seo.description);
    assert.equal(metaValue("property", "og:title"), seo.title);
    assert.equal(metaValue("property", "og:description"), seo.description);
    assert.equal(metaValue("name", "twitter:title"), seo.title);
    assert.equal(metaValue("name", "twitter:description"), seo.description);
    assert.equal(metaValue("property", "og:url"), seo.canonical);
  }
});

test("service, article, breadcrumb, and gallery schemas cover their routes", async () => {
  const servicePaths = [
    "/services/",
    "/custom-home-builder-charlotte-nc/",
    "/land-development-charlotte-nc/",
    "/legacy-projects/",
    "/custom-home-builder-in-charlotte-nc/",
    "/lake-norman-custom-home-builder/",
    "/north-mecklenburg-iredell-builder/",
  ];
  const articlePaths = [
    "/custom-home-budget-planning-where-to-start-in-cornelius/",
    "/what-thoughtful-homebuilding-means-for-charlotte-families/",
    "/before-you-buy-a-lake-norman-homesite-a-builder-s-due-diligence-checklist/",
  ];
  const galleryPaths = [
    "/portfolio/",
    "/case-studies/zwilling-custom-home/",
    "/case-studies/brancer-custom-home/",
    "/case-studies/hallway-improvement/",
  ];

  for (const route of routes) {
    const page = await pageFor(route.file);
    const seo = buildSeo({
      path: route.path,
      site,
      page,
      portfolioImages,
    });
    const types = graphTypes(seo.schema);

    if (route.path !== "/" && route.path !== "/home-2/") {
      assert.ok(types.includes("BreadcrumbList"), route.path);
    }
    if (servicePaths.includes(route.path)) {
      assert.ok(types.includes("Service"), route.path);
    }
    if (articlePaths.includes(route.path)) {
      assert.ok(types.includes("Article"), route.path);
    }
    if (galleryPaths.includes(route.path)) {
      assert.ok(types.includes("ImageGallery"), route.path);
    }
  }
});

test("duplicate and thin archives are noindex and excluded from the sitemap", async () => {
  assert.ok(noIndexPaths.has("/home-2/"));
  assert.ok(noIndexPaths.has("/category/uncategorized/"));
  assert.ok(noIndexPaths.has("/category/legacy-projects/"));
  const sitemap = await readFile("src/pages/sitemap.xml.ts", "utf8");
  const layout = await readFile("src/layouts/Site.astro", "utf8");
  const search = await readFile("src/pages/search.astro", "utf8");
  assert.match(sitemap, /filter\(\(route\) => !noIndexPaths\.has\(route\.path\)\)/);
  assert.match(layout, /content=\{staging \? "noindex, nofollow" : robots\}/);
  assert.match(search, /robots="noindex, follow"/);
});
