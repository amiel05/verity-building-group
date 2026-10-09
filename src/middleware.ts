import { defineMiddleware } from "astro:middleware";
import redirects from "./content/redirects.json";
import routes from "./content/routes.json";
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, searchParams } = context.url;
  const canonicalOrigin = process.env.SITE_URL;
  if (
    process.env.INDEXABLE === "true" &&
    canonicalOrigin &&
    pathname !== "/health.json" &&
    context.url.origin !== new URL(canonicalOrigin).origin
  ) {
    return context.redirect(
      new URL(pathname + context.url.search, canonicalOrigin).href,
      301,
    );
  }
  const target = (redirects as Record<string, string>)[pathname];
  if (target) return context.redirect(target, 301);
  if (pathname === "/" && searchParams.has("s"))
    return context.redirect(
      "/search/?q=" + encodeURIComponent(searchParams.get("s") || ""),
      301,
    );
  if (pathname.startsWith("/author/"))
    return context.redirect("/insights/", 301);
  if (!pathname.endsWith("/") && routes.some((r) => r.path === pathname + "/"))
    return context.redirect(pathname + "/" + context.url.search, 301);
  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  if (process.env.INDEXABLE !== "true")
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
});
