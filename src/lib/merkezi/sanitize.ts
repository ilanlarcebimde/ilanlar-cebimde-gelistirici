import sanitizeHtml from "sanitize-html";

/**
 * Admin editörden gelen HTML içeriği public için güvenli hale getirir.
 * H1 yasak; img/figure/figcaption desteklenir. allowedSchemes: http, https, mailto, tel.
 * img src sadece http/https (transform); javascript:/data: elenir. img'de loading="lazy" varsayılan.
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
      "figure",
      "figcaption",
      "small",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: attribs.rel ?? "noopener noreferrer",
          target: attribs.target ?? "_blank",
        },
      }),
      img: (tagName, attribs) => {
        const src = attribs.src ?? "";
        const safeSrc =
          src.startsWith("https://") || src.startsWith("http://") ? src : "";
        const out: Record<string, string> = {
          src: safeSrc,
          alt: attribs.alt ?? "",
        };
        if (attribs.title) out.title = attribs.title;
        if (attribs.width) out.width = attribs.width;
        if (attribs.height) out.height = attribs.height;
        out.loading = attribs.loading === "eager" ? "eager" : "lazy";
        return { tagName, attribs: out };
      },
    },
  });
}

