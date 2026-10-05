export type ArrowDirection = "right" | "down" | "left";

const directionForGlyph: Record<string, ArrowDirection> = {
  "→": "right",
  "↓": "down",
  "←": "left",
};

export function arrowIconMarkup(direction: ArrowDirection = "right") {
  return `<svg aria-hidden="true" class="interface-icon action-arrow action-arrow--${direction}" focusable="false" viewBox="0 0 24 24"><path d="M1 12h21m-5-4 5 4-5 4"/></svg>`;
}

export function replaceArrowGlyphs(html: string) {
  return html
    .replaceAll("↗", "→")
    .replace(
      /<span(?=[^>]*\bclass="[^"]*\binterface-icon\b[^"]*")[^>]*>\s*([→↓←])\s*<\/span>/g,
      (_match, glyph: string) => arrowIconMarkup(directionForGlyph[glyph]),
    )
    .replace(
      /(<span(?![^>]*\binterface-icon\b)[^>]*>[^<]*?)\s*([→↓←])\s*(<\/span>)/g,
      (_match, start: string, glyph: string, end: string) =>
        `${start} ${arrowIconMarkup(directionForGlyph[glyph])}${end}`,
    );
}
