import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthHashHandler } from "@/components/AuthHashHandler";

const GA_ID = "G-NVM52S3EHT";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ilanlarcebimde.com"),
  title:
    "Yurtdışı İş İlanları ve Başvuru Merkezi | CV Hazırla, Başvuru Mektubu Oluştur, Hemen Başvur",
  verification: {
    google: "X2phO_avup8oTuO-zNe9REuy7ZVfOXktMsaPJ2mOitA",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  description:
    "Yurtdışı iş ilanları, firma iletişim bilgileri, iş başvuru mektubu oluşturma, İngilizce CV hazırlama ve başvuru rehberi tek platformda. İlanlar Cebimde ile uluslararası kariyer fırsatlarına hızlı ve güvenilir erişim sağlayın.",
  keywords:
    "yurtdışı iş ilanları, yurtdışı iş başvurusu, İngilizce CV hazırlama, başvuru mektubu oluşturma, yurtdışı kariyer, usta başvuru, ilan analizi, Almanya, Hollanda, inşaat, elektrik, seramik",
  openGraph: {
    title:
      "Yurtdışı İş İlanları ve Başvuru Merkezi | CV Hazırla, Başvuru Mektubu Oluştur, Hemen Başvur",
    description:
      "Yurtdışı iş ilanları, firma iletişim bilgileri, iş başvuru mektubu oluşturma, İngilizce CV hazırlama ve başvuru rehberi tek platformda. İlanlar Cebimde ile uluslararası kariyer fırsatlarına hızlı ve güvenilir erişim sağlayın.",
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
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3494435772981222"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />
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
