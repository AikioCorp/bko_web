import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PersistentPlayer } from "../components/player/PersistentPlayer";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bamakopodcast.studio"),
  title: "Bko Podcast — Les voix du Mali et de l'Afrique",
  description: "La plateforme de référence pour découvrir, écouter et regarder les podcasts du Mali et d'Afrique.",
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/app-icon.png",
  },
  openGraph: {
    title: "Bko Podcast — Les voix du Mali et de l'Afrique",
    description: "La plateforme de référence pour découvrir, écouter et regarder les podcasts du Mali et d'Afrique.",
    images: ["/brand/logo.webp"],
    siteName: "Bko Podcast",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0B0F17] text-[#F0F6FC] min-h-screen flex flex-col font-sans selection:bg-[#E6B009] selection:text-[#0B0F17]">
        <Header />
        <main className="flex-1 pb-24">{children}</main>
        <Footer />
        <PersistentPlayer />
      </body>
    </html>
  );
}
