import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthHashHandler } from "@/components/AuthHashHandler";

const GA_ID = "G-NVM52S3EHT";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ilanlarcebimde.com"),
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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="antialiased font-sans bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
