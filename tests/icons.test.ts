import test from "node:test";
import assert from "node:assert/strict";
import { arrowIconMarkup, replaceArrowGlyphs } from "../src/lib/icons.ts";

test("arrow icon markup uses one shared SVG path for every direction", () => {
  for (const direction of ["right", "down", "left"] as const) {
    const icon = arrowIconMarkup(direction);
    assert.match(icon, new RegExp(`action-arrow--${direction}`));
    assert.match(icon, /<path d="M1 12h21m-5-4 5 4-5 4"\/>/);
    assert.doesNotMatch(icon, /[→↗←↓↑]/);
  }
});

test("rendered page HTML replaces directional glyphs without changing other icons", () => {
  const html = replaceArrowGlyphs(
    '<span>Continue →</span><span aria-hidden="true">↓</span><span class="interface-icon">←</span><span class="interface-icon">✉</span><span>Open ↗</span>',
  );
  assert.doesNotMatch(html, /[→↗←↓↑]/);
  assert.match(html, /action-arrow--right/);
  assert.match(html, /action-arrow--down/);
  assert.match(html, /action-arrow--left/);
  assert.match(html, /<span class="interface-icon">✉<\/span>/);
});
