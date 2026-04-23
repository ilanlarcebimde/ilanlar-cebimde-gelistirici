import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/og";
import { SEO_SITE_NAME } from "@/lib/seo/defaultMetadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_SITE_NAME,
    short_name: SEO_SITE_NAME,
    description:
      "Yurtdışı iş ilanları, CV ve başvuru araçları. Kariyer fırsatları cebinizde.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F6F1E8",
    theme_color: "#0f1a2c",
    lang: "tr",
    orientation: "portrait-primary",
    icons: [
      {
        src: `${SITE_ORIGIN}/logo.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
