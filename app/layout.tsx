import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LesCoach – Ondersteuning voor het speciaal onderwijs",
  description: "Snel de juiste kennis en expert vinden voor leerlingen met een speciale onderwijsbehoefte.",
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
