import type { APIRoute } from "astro";

const validKey = (value: string) => /^[a-z0-9-]{8,128}$/i.test(value);

export const GET: APIRoute = ({ params }) => {
  const key = (process.env.INDEXNOW_KEY || "").trim();
  if (!validKey(key) || params.indexnowKey !== key) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(`${key}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
