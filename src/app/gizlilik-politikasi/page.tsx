import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { GizlilikPolicyClient } from "./GizlilikPolicyClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Gizlilik Politikası | İlanlar Cebimde",
  description:
    "İlanlar Cebimde gizlilik politikası; kişisel verilerin işlenmesi, saklanması ve kullanıcı hakları hakkında bilgilendirme sunar.",
  path: "/gizlilik-politikasi",
});

export default function GizlilikPolitikasiPage() {
  return <GizlilikPolicyClient />;
}
