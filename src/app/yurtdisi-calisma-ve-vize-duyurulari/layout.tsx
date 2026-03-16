"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

export default function YurtdisiCalismaVizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUrl = pathname || "/yurtdisi-calisma-ve-vize-duyurulari";

  return (
    <>
      <Header
        onLoginClick={() =>
          router.push("/giris?next=" + encodeURIComponent(currentUrl))
        }
      />
      {children}
      <Footer />
    </>
  );
}
