export const GET = ({ url }: { url: URL }) =>
  new Response(
    process.env.INDEXABLE === "true"
      ? `User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap.xml", process.env.SITE_URL || url.origin).href}\n`
      : "User-agent: *\nDisallow: /\n",
    { headers: { "Content-Type": "text/plain" } },
  );
