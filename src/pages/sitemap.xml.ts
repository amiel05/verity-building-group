import routes from "../content/routes.json";
import { noIndexPaths } from "../lib/seo";
import type { APIRoute } from "astro";
export const GET: APIRoute = ({ url }) => {
  const base = process.env.SITE_URL || url.origin;
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      routes
        .filter((route) => !noIndexPaths.has(route.path))
        .map((r) => `<url><loc>${new URL(r.path, base).href}</loc></url>`)
        .join("") +
      "</urlset>",
    { headers: { "Content-Type": "application/xml" } },
  );
};
