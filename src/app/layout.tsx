import React from "react";
import { AuthInitializer } from "../components/AuthInitializer";
import { AppShell } from "../components/AppShell";
import { GoogleAuthProvider } from "../components/GoogleAuthProvider";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bamakopodcast.studio"),
  title: "Bamako Podcast",
  description: "Plateforme sonore de référence : podcasts d'actualité, de culture, d'entrepreneuriat et contes traditionnels de Bamako.",
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/app-icon.png",
  },
  openGraph: {
    title: "Bamako Podcast",
    description: "Écoutez les podcasts phares de Bamako.",
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
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0B0B0B] text-white h-screen overflow-hidden flex flex-col font-sans selection:bg-[#FFBF00] selection:text-[#0B0B0B]">
        <AuthInitializer />
        <GoogleAuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
