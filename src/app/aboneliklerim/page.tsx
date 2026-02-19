import type { Metadata } from "next";
import { ChannelsLayout } from "@/components/kanallar/ChannelsLayout";

export const metadata: Metadata = {
  title: "Kanal Paneli | İlanlar Cebimde",
  description: "Abone olduğunuz yurtdışı iş ilanı kanalları ve keşfet.",
};

export default function AboneliklerimPage() {
  return <ChannelsLayout />;
}
