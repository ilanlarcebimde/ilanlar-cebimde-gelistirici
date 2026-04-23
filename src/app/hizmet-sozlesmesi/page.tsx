import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { HizmetSozlesmesiClient } from "./HizmetSozlesmesiClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Hizmet Sözleşmesi | İlanlar Cebimde",
  description:
    "İlanlar Cebimde hizmet sözleşmesi; hizmet kapsamı, kullanım şartları ve tarafların hak ve yükümlülükleri hakkında bilgilendirme sunar.",
  path: "/hizmet-sozlesmesi",
});

export default function HizmetSozlesmesiPage() {
  return <HizmetSozlesmesiClient />;
}
