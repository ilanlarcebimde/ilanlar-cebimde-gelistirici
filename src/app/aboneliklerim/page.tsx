import type { Metadata } from "next";
import { Suspense } from "react";
import { ChannelsLayout } from "@/components/kanallar/ChannelsLayout";

export const metadata: Metadata = {
  title: "Kanal Paneli | İlanlar Cebimde",
  description: "Abone olduğunuz yurtdışı iş ilanı kanalları ve keşfet.",
};

export default function AboneliklerimPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Yükleniyor…</div>}>
      <ChannelsLayout />
    </Suspense>
  );
}
