import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { createGzip } from "node:zlib";
import { handler } from "../dist/server/entry.mjs";

const clientRoot = resolve(import.meta.dirname, "../dist/client");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const mimeTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);
const compressible = new Set([".css", ".html", ".js", ".json", ".map", ".svg", ".txt", ".xml"]);
const hashedAsset = /^\/assets\/[a-f0-9]{10,}-/i;

async function serveStatic(request, response, pathname) {
  if (!pathname.includes(".")) return false;
  const filePath = resolve(clientRoot, `.${pathname}`);
  if (filePath !== clientRoot && !filePath.startsWith(`${clientRoot}/`)) return false;
  let file;
  try {
    file = await stat(filePath);
  } catch {
    return false;
  }
  if (!file.isFile()) return false;

  const extension = extname(filePath).toLowerCase();
  const etag = `W/"${file.size.toString(16)}-${Math.trunc(file.mtimeMs).toString(16)}"`;
  const immutable = pathname.startsWith("/_astro/") || hashedAsset.test(pathname);
  response.setHeader("Cache-Control", immutable
    ? "public, max-age=31536000, immutable"
    : "public, max-age=86400, stale-while-revalidate=604800");
  response.setHeader("Content-Type", mimeTypes.get(extension) || "application/octet-stream");
  response.setHeader("ETag", etag);
  response.setHeader("Last-Modified", file.mtime.toUTCString());
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.headers["if-none-match"] === etag) {
    response.writeHead(304);
    response.end();
    return true;
  }
  if (request.method === "HEAD") {
    response.setHeader("Content-Length", file.size);
    response.writeHead(200);
    response.end();
    return true;
  }
  const gzip = request.headers["accept-encoding"]?.includes("gzip") && compressible.has(extension);
  if (gzip) {
    response.setHeader("Content-Encoding", "gzip");
    response.setHeader("Vary", "Accept-Encoding");
  } else {
    response.setHeader("Content-Length", file.size);
  }
  response.writeHead(200);
  const stream = createReadStream(filePath);
  stream.on("error", () => response.destroy());
  if (gzip) stream.pipe(createGzip()).pipe(response);
  else stream.pipe(response);
  return true;
}

const server = createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (await serveStatic(request, response, pathname)) return;
  handler(request, response, () => {
    if (!response.headersSent) response.writeHead(404);
    response.end();
  });
});

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
