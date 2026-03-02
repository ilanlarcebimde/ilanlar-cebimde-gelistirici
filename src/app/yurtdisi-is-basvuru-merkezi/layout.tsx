"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";

export default function YurtdisiIsBasvuruMerkeziLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUrl = pathname || "/yurtdisi-is-basvuru-merkezi";
  return (
    <>
      <Header
        onLoginClick={() =>
          router.push("/giris?next=" + encodeURIComponent(currentUrl))
        }
      />
      {children}
    </>
  );
}
