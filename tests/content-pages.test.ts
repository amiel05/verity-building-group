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
