import "@fontsource-variable/fraunces";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "TesterHero – Produkte kostenlos testen & ehrlich bewerten",
    template: "%s · TesterHero",
  },
  description:
    "Werde Produkttester:in bei TesterHero: Bewirb dich für spannende Produkte, teste sie zu Hause und teile deine ehrliche Meinung.",
  applicationName: "TesterHero",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "TesterHero",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
