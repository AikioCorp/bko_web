import React from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { PersistentPlayer } from "../components/player/PersistentPlayer";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bamakopodcast.studio"),
  title: "Bamako Podcast — La voix du Mali et du Mandé",
  description: "Plateforme sonore de référence : podcasts d'actualité, de culture, d'entrepreneuriat et contes traditionnels de Bamako et du Mali.",
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/app-icon.png",
  },
  openGraph: {
    title: "Bamako Podcast — La voix du Mali et du Mandé",
    description: "Écoutez les podcasts phares de Bamako en français et en bamanankan.",
    images: ["/brand/app-icon.png"],
    siteName: "Bamako Podcast",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0B0B0B] text-white h-screen overflow-hidden flex flex-col font-sans selection:bg-[#FFBF00] selection:text-[#0B0B0B]">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="hidden lg:block shrink-0 h-full">
            <Sidebar />
          </div>

          {/* Right Main Column with Sticky Header & Scrollable Content */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0B0B0B]">
            <Header />

            <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent">
              <main className="min-h-full pb-28 md:pb-24">
                {children}
              </main>
            </div>
          </div>
        </div>

        {/* Global Persistent Player */}
        <PersistentPlayer />
      </body>
    </html>
  );
}
