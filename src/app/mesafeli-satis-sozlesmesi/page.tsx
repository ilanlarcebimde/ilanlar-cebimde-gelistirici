import type { Metadata } from "next";
import { MesafeliSatisSozlesmesiClient } from "./MesafeliSatisSozlesmesiClient";

const SITE_URL = "https://www.ilanlarcebimde.com";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | İlanlar Cebimde",
  description:
    "İlanlar Cebimde mesafeli satış sözleşmesi; sipariş, ödeme, teslimat, cayma ve iade süreçleri ile tarafların hak ve yükümlülüklerini açıklar.",
  alternates: {
    canonical: `${SITE_URL}/mesafeli-satis-sozlesmesi`,
  },
  openGraph: {
    title: "Mesafeli Satış Sözleşmesi | İlanlar Cebimde",
    description:
      "İlanlar Cebimde mesafeli satış sözleşmesi; sipariş, ödeme, teslimat, cayma ve iade süreçleri ile tarafların hak ve yükümlülüklerini açıklar.",
    type: "website",
    url: `${SITE_URL}/mesafeli-satis-sozlesmesi`,
  },
};

export default function MesafeliSatisSozlesmesiPage() {
  return <MesafeliSatisSozlesmesiClient />;
}
