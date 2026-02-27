import sanitizeHtml from "sanitize-html";

/**
 * Admin editörden gelen HTML içeriği public için güvenli hale getirir.
 * Temel bloklar, başlıklar, listeler, link ve resme izin verilir.
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: attribs.rel ?? "noopener noreferrer",
            target: attribs.target ?? "_blank",
          },
        };
      },
    },
  });
}

