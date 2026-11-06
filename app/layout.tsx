import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "TesterHero – Produkte kostenlos testen und behalten",
    template: "%s · TesterHero",
  },
  description:
    "Sichere dir neue Produkte kostenlos, teste sie zu Hause und sag uns, wie du sie findest. Das Produkt darfst du behalten.",
  applicationName: "TesterHero",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "TesterHero",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
