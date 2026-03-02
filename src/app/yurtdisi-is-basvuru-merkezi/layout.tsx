"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

export default function YurtdisiIsBasvuruMerkeziLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      {children}
    </>
  );
}
