"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";
import { YURTDISI_BASVURU_CANONICAL_PATH } from "@/lib/yurtdisiIsBasvuruDestegi/paths";

export default function YurtdisiIsBasvuruDanismanligiLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUrl = pathname || YURTDISI_BASVURU_CANONICAL_PATH;

  return (
    <>
      <Header
        onLoginClick={() => router.push("/giris?next=" + encodeURIComponent(currentUrl))}
      />
      {children}
      <Footer />
    </>
  );
}
