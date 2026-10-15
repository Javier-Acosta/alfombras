import sanitize from "sanitize-html";
export function sanitizeRichText(value: unknown) {
  const raw = String(value || "");
  const html = /<\/?[a-z]/i.test(raw)
    ? raw
    : raw
        .split(/\n\s*\n/)
        .map(
          (p) =>
            `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`,
        )
        .join("");
  return sanitize(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
    ],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["https", "mailto"],
    allowProtocolRelative: false,
  });
}
