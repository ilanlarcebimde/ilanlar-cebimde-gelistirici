import type { Metadata } from "next";
import { IlanlarPageClient } from "@/app/ilanlar/IlanlarPageClient";

export const metadata: Metadata = {
  title: "Yurtdışı İş İlanları | İlanlar Cebimde",
  description:
    "Biz sizin için araştırıyor, doğruluyor ve tek merkezde sunuyoruz. Güncel iş ilanları, resmi duyurular ve güvenli başvuru bağlantıları.",
  openGraph: {
    title: "Yurtdışı İş İlanları | İlanlar Cebimde",
    description:
      "Ülke bazlı kanallara abone olun. Güncel yurtdışı iş ilanları tek merkezde.",
  },
};

export default function YurtdisiIsIlanlariPage() {
  return <IlanlarPageClient />;
}
