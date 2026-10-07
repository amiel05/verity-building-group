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
  assert.match(
    listing,
    /<section class="services-closing case-study-detail-closing" aria-labelledby="case-study-cta-title">/,
  );
  assert.match(listing, /class="services-wrap services-closing__grid"/);
  assert.match(listing, /<p class="services-eyebrow">Your project, next<\/p>/);
  assert.match(
    listing,
    /Let’s talk about what you have in mind\./,
  );
  assert.match(
    listing,
    /class="services-button" href="\/contact\/">Discuss your project/,
  );
  const styles = await readFile("src/styles/site.css", "utf8");
  assert.match(
    styles,
    /\.case-study-card h2::after\s*\{[^}]*width:\s*80px;[^}]*height:\s*3px;[^}]*margin-top:\s*18px;[^}]*background:\s*var\(--color-gold\);/s,
  );
  assert.match(
    styles,
    /\.case-study-cards\s*\{[^}]*margin:\s*112px 0 0;[^}]*padding-bottom:\s*112px;/s,
  );
});

test("case-study detail CTAs reuse the footer-attached image treatment", async () => {
  const [servicesStyles, siteStyles] = await Promise.all([
    readFile("src/styles/services.css", "utf8"),
    readFile("src/styles/site.css", "utf8"),
  ]);

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
      /Have a project you would<br \/>like to discuss\?/,
    );
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

  assert.match(
    servicesStyles,
    /\.case-study-detail-closing \.services-button\s*\{[^}]*width:\s*fit-content;[^}]*max-width:\s*100%;[^}]*justify-content:\s*flex-start;[^}]*gap:\s*40px;/s,
  );
  assert.match(
    siteStyles,
    /:is\([^}]*\.services-closing \.services-eyebrow[^}]*\)\s*\{[^}]*font-family:\s*var\(--font-body\);[^}]*font-size:\s*var\(--font-size-eyebrow\);[^}]*text-transform:\s*uppercase;[^}]*color:\s*var\(--color-gold\);/s,
  );
});

test("detail galleries, team portraits, and Field Guide lead images are rounded", async () => {
  const [siteStyles, aboutStyles] = await Promise.all([
    readFile("src/styles/site.css", "utf8"),
    readFile("src/styles/about.css", "utf8"),
  ]);

  assert.match(
    siteStyles,
    /\.vbg-case-study \.vbg-gallery-item\s*\{[^}]*border-radius:\s*8px;[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    siteStyles,
    /\.field-guide-detail \.vbg-editorial-image\s*\{[^}]*border-radius:\s*8px;[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    aboutStyles,
    /\.about-team figure\s*\{[^}]*overflow:\s*hidden;[^}]*border-radius:\s*8px;/s,
  );
});

test("main-page heroes share the short gold heading rule", async () => {
  const styles = await readFile("src/styles/site.css", "utf8");

  assert.match(
    styles,
    /:is\(\s*\.case-studies-hero > \.vbg-display-title,\s*\.portfolio-heading > h1,\s*\.blog-heading > h1,\s*body\.contact-page \.entry-content > \.vbg-display-title\s*\)::after\s*\{[^}]*width:\s*80px;[^}]*height:\s*3px;[^}]*margin-top:\s*18px;[^}]*background:\s*var\(--color-gold\);/s,
  );
});

test("contact form heading uses half the inherited editorial top margin", async () => {
  const styles = await readFile("src/styles/site.css", "utf8");

  assert.match(
    styles,
    /body\.page\.contact-page \.vbg-contact-form > h2:first-child\s*\{[^}]*margin-top:\s*0\.825em;/s,
  );
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
    /\.about-inline-intro > p:last-child::before\s*\{[^}]*top:\s*0;[^}]*bottom:\s*0;[^}]*width:\s*3px;[^}]*background:\s*var\(--color-gold\);/s,
  );
  assert.match(styles, /\.about-areas__heading\.about-inline-intro[^}]*> div > h2/s);
});

test("service detail pages feature the matching case study after Our Approach", async () => {
  const [customHomes, landDevelopment, styles] = await Promise.all([
    readFile(
      "src/content/overrides/custom-home-builder-charlotte-nc.html",
      "utf8",
    ),
    readFile(
      "src/content/overrides/land-development-charlotte-nc.html",
      "utf8",
    ),
    readFile("src/styles/services.css", "utf8"),
  ]);

  assert.match(
    customHomes,
    /id="process"[^]*?<\/section>\s*<section\s+class="featured-case-study"/,
  );
  assert.match(customHomes, /A custom home where warm materials elevate daily life\./);
  assert.match(customHomes, /src="\/assets\/407f035ca1-Brancer10\.webp"/);
  assert.match(customHomes, /href="\/case-studies\/brancer-custom-home\/"/);

  assert.match(
    landDevelopment,
    /id="development"[^]*?<\/section>\s*<section\s+class="featured-case-study"/,
  );
  assert.match(
    landDevelopment,
    /Where the home, the land, and the lake became one plan\./,
  );
  assert.match(landDevelopment, /src="\/assets\/zwilling-rear-exterior\.jpeg"/);
  assert.match(landDevelopment, /href="\/case-studies\/zwilling-custom-home\/"/);

  assert.match(
    styles,
    /\.featured-case-study\s*\{[^}]*background:\s*var\(--background-light\);/s,
  );
  assert.match(
    styles,
    /\.featured-case-study__intro\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(0, 0\.85fr\);[^}]*align-items:\s*center;/s,
  );
  assert.match(
    styles,
    /\.featured-case-study__intro > p:last-child::before\s*\{[^}]*inset-block:\s*0;[^}]*background:\s*var\(--color-gold\);/s,
  );
});

test("service detail heroes match staging media without disclaimer captions", async () => {
  const [land, customHomes, legacy, header] = await Promise.all([
    readFile("src/content/overrides/land-development-charlotte-nc.html", "utf8"),
    readFile("src/content/overrides/custom-home-builder-charlotte-nc.html", "utf8"),
    readFile("src/content/overrides/legacy-projects.html", "utf8"),
    readFile("src/components/Header.astro", "utf8"),
  ]);

  assert.match(land, /src="\/assets\/12214cf068-verity-land-development-lake-norman\.webp"/);
  assert.match(customHomes, /src="\/assets\/a399ddb102-verity_hero-e1786715846853\.webp"/);
  assert.match(legacy, /src="\/assets\/f032cd6272-verity-legacy-neighborhood-home-v2\.webp"/);
  for (const page of [land, customHomes, legacy]) {
    assert.doesNotMatch(page, /AI-generated editorial concept/);
    assert.doesNotMatch(page, /<figcaption>/);
  }

  const landPosition = header.indexOf('"/land-development-charlotte-nc/"');
  const customPosition = header.indexOf('"/custom-home-builder-charlotte-nc/"');
  const legacyPosition = header.indexOf('"/legacy-projects/"');
  assert.ok(landPosition >= 0);
  assert.ok(landPosition < customPosition);
  assert.ok(customPosition < legacyPosition);
});

test("Custom Homes location and FAQ sections use their page-specific treatment", async () => {
  const styles = await readFile("src/styles/legacy.css", "utf8");

  assert.match(
    styles,
    /\.custom-homes-page \.custom-areas\s*\{[^}]*background:\s*var\(--background-cream\);[^}]*box-shadow:\s*0 0 0 100vmax var\(--background-cream\);/s,
  );
  assert.match(
    styles,
    /\.custom-homes-page[\s\S]*?\.custom-areas[\s\S]*?> div[\s\S]*?> h2::after\s*\{[^}]*content:\s*none;/s,
  );
  assert.match(
    styles,
    /\.custom-homes-page \.custom-areas \.legacy-focus__intro > p:last-child::before\s*\{[^}]*inset-block:\s*0;[^}]*background:\s*var\(--color-gold\);/s,
  );
  assert.match(
    styles,
    /\.custom-homes-page \.custom-questions\s*\{[^}]*padding-top:\s*112px;/s,
  );
});

test("Services planning introduction uses a body-copy gold divider", async () => {
  const styles = await readFile("src/styles/services.css", "utf8");

  assert.match(
    styles,
    /\.services-page:not\(\.legacy-page\)[\s\S]*?\.services-planning[\s\S]*?\.services-section-heading[\s\S]*?> div[\s\S]*?> h2::after\s*\{[^}]*content:\s*none;/s,
  );
  assert.match(
    styles,
    /\.services-page:not\(\.legacy-page\)[\s\S]*?\.services-planning[\s\S]*?\.services-section-heading[\s\S]*?> p:last-child::before\s*\{[^}]*inset-block:\s*0;[^}]*background:\s*var\(--color-gold\);/s,
  );
});

test("Services offering eyebrows omit sequence numbers", async () => {
  const services = await readFile("src/content/overrides/services.html", "utf8");
  const offeringEyebrows = [
    ...services.matchAll(
      /<div class="services-offering__copy">\s*<p class="services-eyebrow">([\s\S]*?)<\/p>/g,
    ),
  ].map(([, eyebrow]) => eyebrow.trim());

  assert.deepEqual(offeringEyebrows, [
    "Land Development",
    "Custom Homes",
    "Legacy Projects",
  ]);
  assert.match(
    services,
    /<ol class="services-process">[\s\S]*?<span class="services-number" aria-hidden="true">01<\/span>/,
  );
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

test("Field Guide details share the article utility footer and project CTA", async () => {
  const [route, styles] = await Promise.all([
    readFile("src/pages/[...path].astro", "utf8"),
    readFile("src/styles/site.css", "utf8"),
  ]);

  for (const path of fieldGuideRoutes) {
    assert.match(route, new RegExp(path.replaceAll("/", "\\/")));
  }
  assert.match(route, /isFieldGuideDetail && <ProjectCta id="field-guide-detail-cta-title" \/>/);
  assert.match(route, /\$1Explore Field Guide\$2/);
  assert.match(route, /arrowIconMarkup\("left"\)/);
  assert.match(route, /arrowIconMarkup\("right"\)/);
  assert.match(
    styles,
    /\.field-guide-detail \.widget-area\s*\{[^}]*width:\s*min\([^}]*margin:\s*0 auto clamp\(64px, 8vw, 112px\);[^}]*background:\s*var\(--background-dark\);/s,
  );
  assert.match(
    styles,
    /\.field-guide-detail \.post-navigation a\s*\{[^}]*border-bottom:\s*0;/s,
  );
  assert.match(
    styles,
    /body\.single\.field-guide-detail \.entry-content\s*\{[^}]*margin-top:\s*0;[^}]*padding-top:\s*12px;/s,
  );
  assert.match(
    styles,
    /\.field-guide-detail \.entry-content > h1\.page-title::after\s*\{[^}]*width:\s*80px;[^}]*height:\s*3px;[^}]*margin-top:\s*18px;[^}]*background:\s*var\(--color-gold\);/s,
  );
  assert.match(
    styles,
    /\.field-guide-detail \.entry-footer\s*\{[^}]*margin-top:\s*0;[^}]*border-top:\s*1px solid var\(--border-on-light\);[^}]*border-bottom:\s*1px solid var\(--color-gold\);/s,
  );
  assert.match(
    styles,
    /\.field-guide-detail \.post-navigation \.nav-subtitle\s*\{[^}]*border-bottom:\s*1px solid var\(--color-gold\);[^}]*color:\s*inherit;[^}]*font-size:\s*16px;[^}]*text-transform:\s*none;/s,
  );
  assert.match(
    styles,
    /\.field-guide-detail \.widget-area \.content-block-search__button\.vbg-btn\s*\{[^}]*background:\s*var\(--color-gold\);[^}]*color:\s*var\(--text-on-dark\);/s,
  );
  assert.match(
    styles,
    /\.content-block-search__button\.vbg-btn:is\(:hover, :focus-visible\)[\s\S]*?\.action-arrow\s*\{\s*left:\s*5px;/s,
  );
  assert.match(
    styles,
    /\.field-guide-detail > \.site > \.case-study-cta\s*\{[^}]*margin-top:\s*0;/s,
  );
});

test("Portfolio and Field Guide listings end with the shared project CTA", async () => {
  const [portfolio, fieldGuide, cta, blogStyles] = await Promise.all([
    readFile("src/components/Portfolio.astro", "utf8"),
    readFile("src/components/BlogIndex.astro", "utf8"),
    readFile("src/components/ProjectCta.astro", "utf8"),
    readFile("src/styles/blog.css", "utf8"),
  ]);

  assert.match(portfolio, /<ProjectCta id="portfolio-cta-title" \/>/);
  assert.match(fieldGuide, /<ProjectCta id="field-guide-cta-title" \/>/);
  assert.match(cta, /class="case-study-cta"/);
  assert.match(cta, /Let’s talk about what you have in mind\./);
  assert.match(cta, /class="case-study-cta-button" href="\/contact\/"/);
  assert.match(
    blogStyles,
    /\.blog-page \.case-study-cta h2\s*\{[^}]*color:\s*var\(--text-on-dark\);/s,
  );
});

test("homepage sections and About services use the 112px section rhythm", async () => {
  const styles = await readFile("src/styles/site.css", "utf8");

  assert.match(
    styles,
    /\.home :is\(\.home-services, \.team-section, \.home-portfolio-section, \.contact-section\),\s*\.about-page \.about-services\s*\{[^}]*padding-block:\s*112px;/s,
  );
});

test("shared CTA headlines balance their lines to prevent orphan words", async () => {
  const [siteStyles, servicesStyles] = await Promise.all([
    readFile("src/styles/site.css", "utf8"),
    readFile("src/styles/services.css", "utf8"),
  ]);

  assert.match(
    siteStyles,
    /\.case-study-cta h2\s*\{[^}]*text-wrap:\s*balance;/s,
  );
  assert.match(
    servicesStyles,
    /\.services-closing h2\s*\{[^}]*text-wrap:\s*balance;/s,
  );
});

test("clickable images share one accessible five-percent zoom treatment", async () => {
  const [siteStyles, legacyStyles, portfolio, blog, pageTemplate] =
    await Promise.all([
    readFile("src/styles/site.css", "utf8"),
    readFile("src/styles/source.css", "utf8"),
    readFile("src/components/Portfolio.astro", "utf8"),
    readFile("src/components/BlogIndex.astro", "utf8"),
    readFile("src/pages/[...path].astro", "utf8"),
    ]);

  assert.match(
    siteStyles,
    /\.clickable-image__media\s*\{[^}]*overflow:\s*hidden;/s,
  );
  assert.match(
    siteStyles,
    /\.clickable-image\s*>\s*img,[\s\S]*?transition:\s*transform 500ms ease;/,
  );
  assert.match(
    siteStyles,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?transform:\s*scale\(1\.05\);/,
  );
  assert.match(
    siteStyles,
    /\.clickable-image:focus-visible[\s\S]*?transform:\s*scale\(1\.05\);/,
  );
  assert.match(
    siteStyles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transform:\s*scale\(1\);[\s\S]*?transition:\s*none;/,
  );
  assert.doesNotMatch(legacyStyles, /\.vbg-editorial-image:hover img/);
  assert.doesNotMatch(legacyStyles, /\.vbg-gallery-item:hover img/);
  assert.doesNotMatch(
    legacyStyles,
    /\.vbg-service-index article:hover \.vbg-service-index__image img/,
  );
  assert.match(
    portfolio,
    /class="portfolio-photo clickable-image clickable-image__media"/,
  );
  assert.equal(
    [...blog.matchAll(/class="clickable-image clickable-image__media"/g)]
      .length,
    2,
  );
  assert.doesNotMatch(blog, /tabindex="-1"/);
  assert.match(
    pageTemplate,
    /home-portfolio-photo clickable-image clickable-image__media/,
  );
  assert.match(
    pageTemplate,
    /service-card__image-link clickable-image clickable-image__media/,
  );
  assert.match(
    pageTemplate,
    /<span class="clickable-image__media">\$2<\/span>/,
  );
  assert.match(pageTemplate, /case-study-card clickable-image/);
});

test("sitewide entry motion reuses the homepage animation contract", async () => {
  const [script, styles] = await Promise.all([
    readFile("src/scripts/site.ts", "utf8"),
    readFile("src/styles/site.css", "utf8"),
  ]);

  assert.match(script, /const ENTRY_SEQUENCE_MS = 400;/);
  assert.match(script, /\.service-grid/);
  assert.match(script, /:scope > \.service-card/);
  assert.match(script, /index \+ 1/);
  assert.match(script, /\{ threshold: 0\.08 \}/);
  assert.match(script, /observer\?\.unobserve\(element\)/);
  assert.match(script, /observer\?\.disconnect\(\)/);
  assert.match(script, /"IntersectionObserver" in window/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /addEntryItem\(item, "fadeInRightShort", 2\)/);
  assert.match(script, /removeProperty\("transition-delay"\)/);
  assert.doesNotMatch(script, /reveal-item/);
  assert.doesNotMatch(styles, /\.reveal-item/);
  assert.match(
    styles,
    /\.js-motion \.animated\s*\{[^}]*opacity:\s*0;[^}]*translateY\(20px\)[^}]*opacity 1s ease[^}]*transform 1s ease;/s,
  );
  assert.match(
    styles,
    /\.js-motion \.animated\.is-entering\s*\{[^}]*transition-duration:\s*1s, 1s !important;/s,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.animated\s*\{[^}]*opacity:\s*1 !important;[^}]*transform:\s*none !important;/,
  );
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
