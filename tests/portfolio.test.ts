import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

type PortfolioPhoto = {
  src: string;
  alt: string;
  category: "Interior" | "Exterior";
  width: number;
  height: number;
};

test("portfolio preserves the verified 68-photo source order and metadata", async () => {
  const photos = JSON.parse(
    await readFile("src/content/portfolio.json", "utf8"),
  ) as PortfolioPhoto[];
  const metadataHash = createHash("sha256")
    .update(JSON.stringify(photos))
    .digest("hex");

  assert.equal(photos.length, 68);
  assert.equal(
    metadataHash,
    "cd050033e3972c8545da668c648b17dbc1d9d1ecdfe3a8ba650afe022adeb162",
  );
  assert.equal(new Set(photos.map((photo) => photo.src)).size, photos.length);
  assert.ok(
    photos.every(
      (photo) =>
        photo.alt &&
        ["Interior", "Exterior"].includes(photo.category) &&
        photo.width > 0 &&
        photo.height > 0,
    ),
  );
});

test("portfolio assets exist locally and have distinct file contents", async () => {
  const photos = JSON.parse(
    await readFile("src/content/portfolio.json", "utf8"),
  ) as PortfolioPhoto[];
  const hashes = await Promise.all(
    photos.map(async ({ src }) => {
      const contents = await readFile(`public${src}`);
      return createHash("sha256").update(contents).digest("hex");
    }),
  );

  assert.equal(new Set(hashes).size, 68);
});
