import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("accordions use accessible single-open controls and shared motion states", async () => {
  const [script, servicesCss, siteCss] = await Promise.all([
    readFile("src/scripts/site.ts", "utf8"),
    readFile("src/styles/services.css", "utf8"),
    readFile("src/styles/site.css", "utf8"),
  ]);
  const css = `${servicesCss}\n${siteCss}`;

  assert.match(script, /createElement\("button"\)/);
  assert.match(script, /setAttribute\("aria-controls"/);
  assert.match(script, /setAttribute\("aria-expanded"/);
  assert.match(script, /panel\.inert = !shouldOpen/);
  assert.match(script, /openItem\.classList\.remove\("is-open"\)/);
  assert.match(
    script,
    /const shouldOpen = !item\.classList\.contains\("is-open"\)/,
  );

  assert.match(css, /grid-template-rows: 0fr/);
  assert.match(css, /grid-template-rows: 1fr/);
  assert.match(css, /opacity: 0/);
  assert.match(css, /opacity: 1/);
  assert.match(css, /transition: color 0\.3s ease/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.accordion-item\.is-open \.accordion-trigger/);
});
