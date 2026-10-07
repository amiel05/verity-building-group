import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const approvedHex = new Set([
  "#000000",
  "#141c23",
  "#171513",
  "#1f2e3d",
  "#59636a",
  "#b08a44",
  "#b08a4473",
  "#d9d0c3",
  "#f3efe5",
  "#faf8f4",
]);
const sourceExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".svg",
  ".ts",
  ".tsx",
]);

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const location = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(location);
      return sourceExtensions.has(path.extname(entry.name)) ? [location] : [];
    }),
  );
  return nested.flat();
}

test("UI source uses only the approved palette and overlay tokens", async () => {
  const files = [
    ...(await sourceFiles(path.resolve("src"))),
    ...(await sourceFiles(path.resolve("public"))),
  ];
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/#[\da-f]{3,8}\b/gi)) {
      const color = match[0].toLowerCase();
      if (!approvedHex.has(color)) {
        violations.push(`${path.relative(process.cwd(), file)}: ${color}`);
      }
    }
    if (/\b(?:rgb|rgba|hsl|hsla)\s*\(/i.test(source)) {
      violations.push(`${path.relative(process.cwd(), file)}: rgb/hsl color`);
    }
    if (
      path.extname(file) === ".css" &&
      /:\s*(?:white|black|red|blue|gray|grey)(?:\s*!important)?\s*[;}]/i.test(
        source,
      )
    ) {
      violations.push(`${path.relative(process.cwd(), file)}: named color`);
    }
  }

  assert.deepEqual(violations, []);
});
