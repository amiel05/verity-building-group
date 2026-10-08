type MetaTag = Record<string, string>;

export type SeoSourcePage = {
  title: string;
  meta: MetaTag[];
  sections: string[];
};

type SeoDefinition = {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: "index, follow" | "noindex, follow";
  imageAlt?: string;
};

type Breadcrumb = { name: string; path: string };
type ServiceDefinition = {
  name: string;
  serviceType: string[];
  areaServed?: Array<{ type: string; name: string }>;
};
type ArticleDefinition = {
  headline: string;
  datePublished: string;
};
type GalleryImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

const stagingOrigin = "https://veritybuildstg.wpenginepowered.com";
const brand = "Verity Building Group";

export const seoByPath: Record<string, SeoDefinition> = {
  "/": {
    title: "Luxury Custom Home Builder | Charlotte & Lake Norman | Verity",
    description:
      "Verity Building Group creates luxury custom homes and guides land development across Charlotte and Lake Norman. Explore our work and start a conversation.",
  },
  "/home-2/": {
    title: "Luxury Custom Home Builder | Charlotte & Lake Norman | Verity",
    description:
      "Verity Building Group creates luxury custom homes and guides land development across Charlotte and Lake Norman. Explore our work and start a conversation.",
    canonicalPath: "/",
    robots: "noindex, follow",
  },
  "/services/": {
    title: "Custom Homes & Land Development Services | Charlotte, NC",
    description:
      "Explore Verity Building Group’s custom home construction, land development, renovation, and community-focused building services.",
  },
  "/custom-home-builder-charlotte-nc/": {
    title: "Custom Home Builder | Charlotte & Lake Norman | Verity",
    description:
      "Plan and build a custom home with Verity Building Group, serving Charlotte, Lake Norman, and nearby communities with clear, coordinated guidance.",
  },
  "/land-development-charlotte-nc/": {
    title: "Land Development | Charlotte & Lake Norman | Verity",
    description:
      "Evaluate land, utilities, permitting, site constraints, and development strategy with Verity Building Group across Charlotte and Lake Norman.",
  },
  "/legacy-projects/": {
    title: "Legacy & Community Construction Projects | Verity",
    description:
      "Explore Verity Building Group’s community construction partnerships supporting stable homeownership, veterans, families, and mission-driven spaces.",
  },
  "/portfolio/": {
    title: "Custom Home Portfolio | Charlotte & Lake Norman | Verity",
    description:
      "Tour custom homes, interiors, and exterior details built by Verity Building Group throughout Charlotte and the Lake Norman area.",
  },
  "/case-studies/": {
    title: "Custom Home & Development Case Studies | Verity",
    description:
      "See how Verity Building Group approaches custom homes, land development, and renovation through detailed Charlotte and Lake Norman case studies.",
  },
  "/case-studies/zwilling-custom-home/": {
    title: "Zwilling Custom Home Case Study | Lake Norman | Verity",
    description:
      "Explore a 4,400-square-foot modern Lake Norman custom home with tailored specialty rooms, expansive glass, outdoor entertaining, and a custom dock.",
  },
  "/case-studies/brancer-custom-home/": {
    title: "Brancer Custom Home Case Study | Verity Building Group",
    description:
      "Tour the Brancer custom home: more than 3,000 square feet with white oak finishes, flexible living space, and a coordinated on-budget delivery.",
  },
  "/case-studies/hallway-improvement/": {
    title: "Hallway Renovation Case Study | Charlotte | Verity",
    description:
      "See how Verity Building Group coordinated a three-floor Charlotte hallway renovation with new carpet, repaired walls, refreshed trim, and durable finishes.",
  },
  "/about/": {
    title: "About Verity Building Group | Charlotte & Lake Norman",
    description:
      "Meet the people and process behind Verity Building Group’s custom homes, land development, and thoughtfully coordinated construction projects.",
  },
  "/contact/": {
    title: "Contact Verity Building Group | Start Your Project",
    description:
      "Tell Verity Building Group about your property, goals, timing, and project stage in Charlotte, Lake Norman, or a nearby community.",
  },
  "/charlotte-lake-norman-builder/": {
    title: "Service Areas | Charlotte, Lake Norman & Iredell | Verity",
    description:
      "Explore where Verity Building Group builds custom homes, renovates residences, and guides land development across the greater Charlotte region.",
  },
  "/custom-home-builder-in-charlotte-nc/": {
    title: "Custom Home Builder in Charlotte, NC | Verity",
    description:
      "Build a custom home or plan a major renovation in Charlotte with Verity Building Group, from homesite review through coordinated construction.",
  },
  "/lake-norman-custom-home-builder/": {
    title: "Lake Norman Custom Home Builder | Verity Building Group",
    description:
      "Plan a Lake Norman custom home with Verity Building Group, including waterfront homesite review, shoreline coordination, renovation, and construction.",
  },
  "/north-mecklenburg-iredell-builder/": {
    title: "North Mecklenburg & Iredell Custom Home Builder | Verity",
    description:
      "Plan custom homes, renovations, and land development in Cornelius, Davidson, Huntersville, Mooresville, and Iredell County with Verity Building Group.",
  },
  "/insights/": {
    title: "Custom Home & Land Development Field Guide | Verity",
    description:
      "Read practical guidance for custom homes, land development, renovation, and property planning across Charlotte and Lake Norman.",
  },
  "/custom-home-budget-planning-where-to-start-in-cornelius/": {
    title: "Custom Home Budget Planning in Cornelius | Verity Field Guide",
    description:
      "Learn how to define priorities, account for whole-project costs, and bring the right team together when planning a custom home budget in Cornelius.",
  },
  "/what-thoughtful-homebuilding-means-for-charlotte-families/": {
    title: "Thoughtful Homebuilding for Charlotte Families | Verity",
    description:
      "Explore how early planning, clear communication, and coordinated construction decisions support lasting custom homes for Charlotte families.",
  },
  "/before-you-buy-a-lake-norman-homesite-a-builder-s-due-diligence-checklist/": {
    title: "Lake Norman Homesite Due-Diligence Checklist | Verity",
    description:
      "Review access, utilities, approvals, shoreline conditions, grading, and other questions to investigate before buying a Lake Norman homesite.",
  },
  "/category/custom-home-construction/": {
    title: "Custom Home Construction Articles | Verity Field Guide",
    description:
      "Read Verity Field Guide articles about custom home planning, budgeting, design coordination, construction, and long-term living.",
  },
  "/category/land-development/": {
    title: "Land Development Articles | Verity Field Guide",
    description:
      "Explore practical articles about homesite evaluation, utilities, permitting, access, grading, approvals, and land development strategy.",
  },
  "/category/field-guide/": {
    title: "The Verity Field Guide | Building & Property Insights",
    description:
      "Browse practical Verity Building Group guidance for custom homes, land development, renovation, and property decisions in the Charlotte region.",
  },
  "/category/legacy-projects/": {
    title: "Legacy Project Articles | Verity Field Guide",
    description:
      "Read about community-centered construction, mission-driven partnerships, and legacy projects from Verity Building Group.",
    robots: "noindex, follow",
  },
  "/category/uncategorized/": {
    title: "More Building Insights | Verity Field Guide",
    description:
      "Browse additional building and property insights from Verity Building Group.",
    robots: "noindex, follow",
  },
  "/tag/charlotte/": {
    title: "Charlotte Building Articles | Verity Field Guide",
    description:
      "Read custom home, renovation, and property-planning guidance for owners building in Charlotte, North Carolina.",
  },
  "/tag/cornelius/": {
    title: "Cornelius Custom Home Articles | Verity Field Guide",
    description:
      "Explore custom home budgeting, planning, and construction guidance for owners building in Cornelius and near Lake Norman.",
  },
  "/tag/lake-norman/": {
    title: "Lake Norman Building Articles | Verity Field Guide",
    description:
      "Read homesite, shoreline, land-development, and custom-home guidance for owners planning projects around Lake Norman.",
  },
  "/tag/davidson/": {
    title: "Davidson Building Articles | Verity Field Guide",
    description:
      "Explore custom home and property-planning guidance for owners considering projects in Davidson, North Carolina.",
    robots: "noindex, follow",
  },
  "/tag/huntersville/": {
    title: "Huntersville Building Articles | Verity Field Guide",
    description:
      "Explore custom home and land-development guidance for owners considering projects in Huntersville, North Carolina.",
    robots: "noindex, follow",
  },
  "/tag/mooresville/": {
    title: "Mooresville Building Articles | Verity Field Guide",
    description:
      "Explore custom home and property-planning guidance for owners considering projects in Mooresville and Iredell County.",
    robots: "noindex, follow",
  },
  "/terms-conditions/": {
    title: "Terms & Conditions | Verity Building Group",
    description:
      "Review the terms and conditions governing use of the Verity Building Group website.",
  },
  "/privacy-policy/": {
    title: "Privacy Policy | Verity Building Group",
    description:
      "Learn how Verity Building Group handles information submitted through this website and related contact forms.",
  },
};

const articleByPath: Record<string, ArticleDefinition> = {
  "/custom-home-budget-planning-where-to-start-in-cornelius/": {
    headline: "Custom Home Budget Planning: Where to Start in Cornelius",
    datePublished: "2026-09-18T15:00:00-04:00",
  },
  "/what-thoughtful-homebuilding-means-for-charlotte-families/": {
    headline: "What Thoughtful Homebuilding Means for Charlotte Families",
    datePublished: "2026-09-11T15:00:00-04:00",
  },
  "/before-you-buy-a-lake-norman-homesite-a-builder-s-due-diligence-checklist/": {
    headline:
      "Before You Buy a Lake Norman Homesite: A Builder’s Due-Diligence Checklist",
    datePublished: "2026-09-04T15:00:00-04:00",
  },
};

const commonArea = [
  { type: "City", name: "Charlotte, North Carolina" },
  { type: "Place", name: "Lake Norman, North Carolina" },
  { type: "City", name: "Cornelius, North Carolina" },
  { type: "City", name: "Davidson, North Carolina" },
  { type: "City", name: "Huntersville, North Carolina" },
  { type: "City", name: "Mooresville, North Carolina" },
];

const serviceByPath: Record<string, ServiceDefinition> = {
  "/services/": {
    name: "Custom home construction and land development services",
    serviceType: [
      "Custom home construction",
      "Land development",
      "Residential renovation",
      "Community-centered construction",
    ],
  },
  "/custom-home-builder-charlotte-nc/": {
    name: "Custom home construction",
    serviceType: ["Custom home construction", "Residential renovation"],
  },
  "/land-development-charlotte-nc/": {
    name: "Land development and homesite planning",
    serviceType: ["Land development", "Homesite planning"],
  },
  "/legacy-projects/": {
    name: "Legacy and community construction projects",
    serviceType: ["Community-centered construction", "Residential renovation"],
  },
  "/custom-home-builder-in-charlotte-nc/": {
    name: "Custom home builder in Charlotte, North Carolina",
    serviceType: ["Custom home construction", "Residential renovation"],
    areaServed: [{ type: "City", name: "Charlotte, North Carolina" }],
  },
  "/lake-norman-custom-home-builder/": {
    name: "Lake Norman custom home builder",
    serviceType: [
      "Custom home construction",
      "Waterfront homesite planning",
      "Residential renovation",
    ],
    areaServed: [{ type: "Place", name: "Lake Norman, North Carolina" }],
  },
  "/north-mecklenburg-iredell-builder/": {
    name: "Custom home builder in North Mecklenburg and Iredell County",
    serviceType: [
      "Custom home construction",
      "Land development",
      "Residential renovation",
    ],
    areaServed: commonArea.slice(2),
  },
};

const labels: Record<string, string> = {
  "/services/": "Services",
  "/custom-home-builder-charlotte-nc/": "Custom Homes",
  "/land-development-charlotte-nc/": "Land Development",
  "/legacy-projects/": "Legacy Projects",
  "/portfolio/": "Portfolio",
  "/case-studies/": "Case Studies",
  "/about/": "About",
  "/contact/": "Contact",
  "/charlotte-lake-norman-builder/": "Service Areas",
  "/custom-home-builder-in-charlotte-nc/": "Charlotte, NC",
  "/lake-norman-custom-home-builder/": "Lake Norman",
  "/north-mecklenburg-iredell-builder/": "North Mecklenburg & Iredell",
  "/insights/": "Field Guide",
  "/terms-conditions/": "Terms & Conditions",
  "/privacy-policy/": "Privacy Policy",
};

export const noIndexPaths = new Set(
  Object.entries(seoByPath)
    .filter(([, definition]) => definition.robots === "noindex, follow")
    .map(([path]) => path),
);

const absoluteUrl = (value: string, site: string) => {
  if (!value) return "";
  if (value.startsWith(stagingOrigin)) {
    return new URL(new URL(value).pathname, site).href;
  }
  return new URL(value, site).href;
};

const sourceMeta = (page: SeoSourcePage, key: string, value: string) =>
  page.meta.find((meta) => meta[key] === value)?.content || "";

const breadcrumbTrail = (path: string, title: string): Breadcrumb[] => {
  if (path === "/" || path === "/home-2/") return [];
  const current = { name: labels[path] || title.split(" | ")[0], path };
  if (path.startsWith("/case-studies/")) {
    return [
      { name: "Home", path: "/" },
      { name: "Case Studies", path: "/case-studies/" },
      current,
    ];
  }
  if (
    articleByPath[path] ||
    path.startsWith("/category/") ||
    path.startsWith("/tag/")
  ) {
    return [
      { name: "Home", path: "/" },
      { name: "Field Guide", path: "/insights/" },
      current,
    ];
  }
  if (
    path === "/custom-home-builder-charlotte-nc/" ||
    path === "/land-development-charlotte-nc/" ||
    path === "/legacy-projects/"
  ) {
    return [
      { name: "Home", path: "/" },
      { name: "Services", path: "/services/" },
      current,
    ];
  }
  if (
    path === "/custom-home-builder-in-charlotte-nc/" ||
    path === "/lake-norman-custom-home-builder/" ||
    path === "/north-mecklenburg-iredell-builder/"
  ) {
    return [
      { name: "Home", path: "/" },
      { name: "Areas We Serve", path: "/about/#areas-we-serve" },
      current,
    ];
  }
  return [{ name: "Home", path: "/" }, current];
};

const extractGalleryImages = (sections: string[]): GalleryImage[] => {
  const images: GalleryImage[] = [];
  for (const html of sections) {
    for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
      const attributes = match[1];
      const src = attributes.match(/\bsrc="([^"]+)"/i)?.[1];
      if (!src) continue;
      images.push({
        src,
        alt: attributes.match(/\balt="([^"]*)"/i)?.[1] || "Verity project image",
      });
    }
  }
  return images;
};

export const buildSeo = ({
  path,
  site,
  page,
  portfolioImages,
}: {
  path: string;
  site: string;
  page: SeoSourcePage;
  portfolioImages: GalleryImage[];
}) => {
  const definition = seoByPath[path] || {
    title: page.title,
    description: sourceMeta(page, "name", "description"),
  };
  const canonicalPath = definition.canonicalPath || path;
  const canonical = absoluteUrl(canonicalPath, site);
  const image = absoluteUrl(sourceMeta(page, "property", "og:image"), site);
  const imageAlt =
    definition.imageAlt ||
    sourceMeta(page, "property", "og:image:alt") ||
    "Verity Building Group custom home and property planning";
  const article = articleByPath[path];
  const type = article ? "article" : "website";
  const meta: MetaTag[] = [
    { name: "description", content: definition.description },
    { property: "og:locale", content: "en_US" },
    { property: "og:type", content: type },
    { property: "og:title", content: definition.title },
    { property: "og:description", content: definition.description },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: brand },
    ...(image ? [{ property: "og:image", content: image }] : []),
    ...(image ? [{ property: "og:image:alt", content: imageAlt }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: definition.title },
    { name: "twitter:description", content: definition.description },
    ...(image ? [{ name: "twitter:image", content: image }] : []),
    ...(image ? [{ name: "twitter:image:alt", content: imageAlt }] : []),
  ];

  const breadcrumbs = breadcrumbTrail(path, definition.title);
  const breadcrumbId = `${canonical}#breadcrumb`;
  const service = serviceByPath[path];
  const isPortfolio = path === "/portfolio/";
  const isCaseStudy = path.startsWith("/case-studies/");
  const sourceImages = isPortfolio
    ? portfolioImages
    : isCaseStudy
      ? extractGalleryImages(page.sections)
      : [];
  const galleryImages = sourceImages.map((galleryImage) => ({
    "@type": "ImageObject",
    contentUrl: absoluteUrl(galleryImage.src, site),
    name: galleryImage.alt,
    caption: galleryImage.alt,
    ...(galleryImage.width ? { width: galleryImage.width } : {}),
    ...(galleryImage.height ? { height: galleryImage.height } : {}),
  }));
  const galleryId = `${canonical}#gallery`;
  const serviceId = `${canonical}#service`;
  const articleId = `${canonical}#article`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: definition.title,
      description: definition.description,
      inLanguage: "en-US",
      ...(breadcrumbs.length ? { breadcrumb: { "@id": breadcrumbId } } : {}),
      ...(service ? { mainEntity: { "@id": serviceId } } : {}),
      ...(article ? { mainEntity: { "@id": articleId } } : {}),
      ...(galleryImages.length ? { primaryImageOfPage: galleryImages[0] } : {}),
    },
  ];

  if (path === "/") {
    graph.push(
      {
        "@type": "WebSite",
        "@id": `${canonical}#website`,
        url: canonical,
        name: brand,
        alternateName: "VBG",
        inLanguage: "en-US",
      },
      {
        "@type": ["HomeAndConstructionBusiness", "GeneralContractor"],
        "@id": `${canonical}#organization`,
        name: brand,
        alternateName: "VBG",
        url: canonical,
        image,
        description: definition.description,
        areaServed: commonArea.map((area) => ({
          "@type": area.type,
          name: area.name,
        })),
        knowsAbout: [
          "Luxury custom homes",
          "Residential renovation",
          "Land development",
          "Homesite planning",
        ],
      },
    );
  }

  if (breadcrumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: breadcrumb.name,
        item: absoluteUrl(breadcrumb.path, site),
      })),
    });
  }

  if (service) {
    graph.push({
      "@type": "Service",
      "@id": serviceId,
      name: service.name,
      url: canonical,
      description: definition.description,
      serviceType: service.serviceType,
      provider: {
        "@type": ["HomeAndConstructionBusiness", "GeneralContractor"],
        "@id": `${absoluteUrl("/", site)}#organization`,
        name: brand,
        url: absoluteUrl("/", site),
      },
      areaServed: (service.areaServed || commonArea).map((area) => ({
        "@type": area.type,
        name: area.name,
      })),
    });
  }

  if (article) {
    graph.push({
      "@type": "Article",
      "@id": articleId,
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
      headline: article.headline,
      description: definition.description,
      image: image ? [image] : [],
      datePublished: article.datePublished,
      dateModified: article.datePublished,
      author: {
        "@type": "Organization",
        name: brand,
        url: absoluteUrl("/about/", site),
      },
      publisher: {
        "@type": "Organization",
        "@id": `${absoluteUrl("/", site)}#organization`,
        name: brand,
        url: absoluteUrl("/", site),
      },
    });
  }

  if (galleryImages.length) {
    graph.push({
      "@type": "ImageGallery",
      "@id": galleryId,
      url: canonical,
      name: `${definition.title.split(" | ")[0]} Gallery`,
      description: definition.description,
      associatedMedia: galleryImages,
    });
  }

  return {
    title: definition.title,
    description: definition.description,
    canonical,
    robots: definition.robots || "index, follow",
    meta,
    schema: [{ "@context": "https://schema.org", "@graph": graph }],
  };
};
