import type { Metadata } from "next";
import "./globals.css";
import { AuthHashHandler } from "@/components/AuthHashHandler";

export const metadata: Metadata = {
  title: "İlanlar Cebimde — Usta Başvuru Paketi | 549 TL",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  description:
    "Yurtiçi ve yurtdışı iş başvuruları için profesyonel CV, kişisel başvuru mektubu ve ilan analizi tek pakette. Ustalar için.",
  keywords:
    "yurtdışı iş, usta başvuru, CV hazırlama, ilan analizi, Almanya, Hollanda, inşaat, elektrik, seramik",
  openGraph: {
    title: "İlanlar Cebimde — Usta Başvuru Paketi",
    description:
      "Yurtdışında iş arayan ustalar için CV, başvuru mektubu ve ilan bülteni. Başvuruyu kolaylaştırır, süreci hızlandırır.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased font-sans bg-[var(--background)] text-[var(--foreground)]">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
