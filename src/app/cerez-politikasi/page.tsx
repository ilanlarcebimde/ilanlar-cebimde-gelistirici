import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { CerezPolicyClient } from "./CerezPolicyClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Çerez Politikası | İlanlar Cebimde",
  description:
    "İlanlar Cebimde çerez politikası; çerez türleri, kullanım amaçları ve tercihlerin yönetimi hakkında bilgilendirme sunar.",
  path: "/cerez-politikasi",
});

export default function CerezPolitikasiPage() {
  return <CerezPolicyClient />;
}
