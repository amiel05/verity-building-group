import { defineMiddleware } from "astro:middleware";
import redirects from "./content/redirects.json";
import routes from "./content/routes.json";

const compressibleType =
  /^(?:text\/|application\/(?:javascript|json|ld\+json|manifest\+json|xml|xhtml\+xml)|image\/svg\+xml)/i;
const hashedPublicAsset = /^\/assets\/[a-f0-9]{10,}-/i;

const appendVary = (headers: Headers, value: string) => {
  const current = headers.get("Vary");
  if (!current) return headers.set("Vary", value);
  if (!current.split(",").some((item) => item.trim() === value))
    headers.set("Vary", `${current}, ${value}`);
};

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

  if (
    !response.headers.has("Cache-Control") &&
    (pathname.startsWith("/_astro/") || hashedPublicAsset.test(pathname))
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else if (
    !response.headers.has("Cache-Control") &&
    pathname.startsWith("/assets/")
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800",
    );
  } else if (
    !response.headers.has("Cache-Control") &&
    /\.(?:xml|txt|json)$/.test(pathname)
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400",
    );
  } else if (
    !response.headers.has("Cache-Control") &&
    response.headers.get("Content-Type")?.includes("text/html")
  ) {
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  const contentType = response.headers.get("Content-Type") || "";
  const acceptsGzip = context.request.headers
    .get("Accept-Encoding")
    ?.split(",")
    .some((encoding) => encoding.trim().startsWith("gzip"));
  if (
    acceptsGzip &&
    response.body &&
    !response.headers.has("Content-Encoding") &&
    compressibleType.test(contentType) &&
    context.request.method !== "HEAD" &&
    response.status !== 204 &&
    response.status !== 304
  ) {
    const headers = new Headers(response.headers);
    headers.delete("Content-Length");
    headers.set("Content-Encoding", "gzip");
    appendVary(headers, "Accept-Encoding");
    return new Response(response.body.pipeThrough(new CompressionStream("gzip")), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
});
