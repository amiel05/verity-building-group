const key = (process.env.INDEXNOW_KEY || "").trim();
const siteUrl = (process.env.SITE_URL || "").trim();

if (!/^[a-z0-9-]{8,128}$/i.test(key)) {
  throw new Error("INDEXNOW_KEY must be 8–128 letters, numbers, or dashes.");
}
if (!siteUrl.startsWith("https://")) {
  throw new Error("SITE_URL must be the public HTTPS origin.");
}

const origin = new URL(siteUrl).origin;
const sitemapResponse = await fetch(new URL("/sitemap.xml", origin));
if (!sitemapResponse.ok) {
  throw new Error(`Could not read sitemap: ${sitemapResponse.status}`);
}
const sitemap = await sitemapResponse.text();
const urlList = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) =>
  url.replaceAll("&amp;", "&"),
);
if (!urlList.length) throw new Error("The sitemap did not contain any URLs.");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(origin).host,
    key,
    keyLocation: new URL(`/${key}.txt`, origin).href,
    urlList,
  }),
});

if (!response.ok && response.status !== 202) {
  throw new Error(`IndexNow rejected the submission: ${response.status}`);
}
console.log(`Submitted ${urlList.length} URLs to IndexNow (${response.status}).`);
