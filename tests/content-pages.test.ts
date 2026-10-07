import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

type Route = { path: string; file: string };
type FieldGuidePost = {
  path: string;
  title: string;
  image: string;
  alt: string;
};

const caseStudyRoutes = [
  "/case-studies/zwilling-custom-home/",
  "/case-studies/brancer-custom-home/",
  "/case-studies/hallway-improvement/",
];

const fieldGuideRoutes = [
  "/custom-home-budget-planning-where-to-start-in-cornelius/",
  "/what-thoughtful-homebuilding-means-for-charlotte-families/",
  "/before-you-buy-a-lake-norman-homesite-a-builder-s-due-diligence-checklist/",
];

test("case-study listing and routes represent all three source entries", async () => {
  const routes = JSON.parse(
    await readFile("src/content/routes.json", "utf8"),
  ) as Route[];
  const listing = await readFile(
    "src/content/overrides/case-studies.html",
    "utf8",
  );

  for (const path of caseStudyRoutes) {
    const route = routes.find((candidate) => candidate.path === path);
    assert.ok(route, `missing route ${path}`);
    await access(`src/content/pages/${route.file}`);
    assert.match(
      listing,
      new RegExp(`href=["']${path.replaceAll("/", "\\/")}`),
    );
  }

  const listedCaseStudies = [
    ...listing.matchAll(/href="(\/case-studies\/[^"#?]+\/)"/g),
  ].map(([, path]) => path);
  assert.deepEqual(listedCaseStudies, caseStudyRoutes);
});

test("case-study detail CTAs reuse the footer-attached image treatment", async () => {
  for (const path of caseStudyRoutes) {
    const slug = path.split("/").filter(Boolean).at(-1);
    const override = await readFile(
      `src/content/overrides/case-studies__${slug}.html`,
      "utf8",
    );

    assert.doesNotMatch(override, /vbg-final-cta/);
    assert.match(
      override,
      /<\/div>\s*<\/article>\s*<\/div>\s*<\/div>\s*<section class="services-closing case-study-detail-closing"/,
    );
    assert.match(override, /class="services-wrap services-closing__grid"/);
    assert.match(override, /class="services-button" href="\/contact\/"/);
    assert.match(
      override,
      /<header class="entry-header case-study-detail-hero">\s*<p class="eyebrow">[^<]+<\/p>\s*<h1 class="entry-title">[^<]+<\/h1>\s*<\/header>/,
    );
    assert.doesNotMatch(
      override,
      /<section class="vbg-case-study">\s*<p class="eyebrow">/,
    );
    assert.match(
      override,
      /class="case-study-back__link" href="\/case-studies\/">\s*<span class="interface-icon" aria-hidden="true">←<\/span>\s*Back to all case studies<\/a>/,
    );
    assert.match(override, /<\/section>\s*<\/main>\s*$/);
  }
});

test("About team and service-area introductions use vertical gold dividers", async () => {
  const [about, styles] = await Promise.all([
    readFile("src/content/overrides/about.html", "utf8"),
    readFile("src/styles/about.css", "utf8"),
  ]);

  assert.match(
    about,
    /class="legacy-focus__intro about-inline-intro"[^]*?class="about-team-description"/,
  );
  assert.match(
    about,
    /class="services-section-heading about-areas__heading about-inline-intro"[^]*?class="about-areas__intro"/,
  );
  assert.match(
    styles,
    /\.about-inline-intro > p:last-child::before\s*\{[^}]*width:\s*3px;[^}]*height:\s*46px;[^}]*background:\s*var\(--color-gold\);/s,
  );
  assert.match(styles, /\.about-areas__heading\.about-inline-intro[^}]*> div > h2/s);
});

test("field-guide listing preserves source order, images, and alternative text", async () => {
  const posts = JSON.parse(
    await readFile("src/content/blog.json", "utf8"),
  ) as FieldGuidePost[];

  assert.equal(posts.length, 3);
  assert.deepEqual(
    posts.map(({ path }) => path),
    fieldGuideRoutes,
  );
  assert.ok(posts.every(({ alt }) => alt.trim().length > 0));

  for (const post of posts) {
    await access(`public${post.image}`);
  }
});

test("Zwilling gallery uses ten distinct local originals", async () => {
  const page = await readFile(
    "src/content/pages/case-studies__zwilling-custom-home.json",
    "utf8",
  );
  const sources = [
    ...page.matchAll(/src=\\?"(\/assets\/zwilling-[^"\\]+\.jpeg)/g),
  ].map(([, source]) => source);
  const uniqueSources = [...new Set(sources)];

  assert.equal(uniqueSources.length, 10);
  assert.doesNotMatch(
    page,
    /verity-building-group-staging-staging\.up\.railway\.app/,
  );

  const hashes = await Promise.all(
    uniqueSources.map(async (source) => {
      const contents = await readFile(`public${source}`);
      return createHash("sha256").update(contents).digest("hex");
    }),
  );
  assert.equal(new Set(hashes).size, 10);
});
