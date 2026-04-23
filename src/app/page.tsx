import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/defaultMetadata";
import { HomeClient } from "./HomeClient";

const TITLE = "Yurtdışı İş İlanları ve Başvuru Merkezi | İlanlar Cebimde";
const DESCRIPTION =
  "Yurtdışı iş ilanları, firma iletişim bilgileri, İngilizce CV hazırlama ve başvuru mektubu tek platformda. Almanya, Hollanda, Belçika, İrlanda ve daha fazlası için kariyer fırsatlarına hemen ulaşın.";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/",
});

export default function Home() {
  return <HomeClient />;
}
