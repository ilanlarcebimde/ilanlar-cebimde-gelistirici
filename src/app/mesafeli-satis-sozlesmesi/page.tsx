import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { MesafeliSatisSozlesmesiClient } from "./MesafeliSatisSozlesmesiClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Mesafeli Satış Sözleşmesi | İlanlar Cebimde",
  description:
    "İlanlar Cebimde mesafeli satış sözleşmesi; sipariş, ödeme, teslimat, cayma ve iade süreçleri ile tarafların hak ve yükümlülüklerini açıklar.",
  path: "/mesafeli-satis-sozlesmesi",
});

export default function MesafeliSatisSozlesmesiPage() {
  return <MesafeliSatisSozlesmesiClient />;
}
