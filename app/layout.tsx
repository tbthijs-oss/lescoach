import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.APP_URL || "https://lescoach.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LesCoach — Ondersteuning voor het speciaal onderwijs",
    template: "%s · LesCoach",
  },
  description:
    "Snel de juiste kennis en expert vinden voor leerlingen met een speciale onderwijsbehoefte. Gratis chat met Noor, specialist speciaal onderwijs.",
  applicationName: "LesCoach",
  keywords: [
    "speciaal onderwijs",
    "leerkracht",
    "kenniskaarten",
    "ondersteuning",
    "autisme",
    "ADHD",
    "dyslexie",
    "gedragsproblemen",
  ],
  authors: [{ name: "LesCoach" }],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: siteUrl,
    siteName: "LesCoach",
    title: "LesCoach — Ondersteuning voor het speciaal onderwijs",
    description:
      "Chat met Noor en vind in minuten de juiste kenniskaart en expert voor je leerling.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LesCoach",
    description: "Ondersteuning voor het speciaal onderwijs, in één chat.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
