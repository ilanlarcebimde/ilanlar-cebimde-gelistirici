import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { IadeVeGeriOdemeClient } from "./IadeVeGeriOdemeClient";

export const metadata: Metadata = buildPageMetadata({
  title: "İade ve Geri Ödeme | İlanlar Cebimde",
  description:
    "İlanlar Cebimde iade ve geri ödeme politikası; iptal, iade şartları ve geri ödeme süreçleri hakkında bilgilendirme sunar.",
  path: "/iade-ve-geri-odeme",
});

export default function IadeVeGeriOdemePage() {
  return <IadeVeGeriOdemeClient />;
}
