import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LesCoach voor SSOE: partnerschapsvoorstel",
  description: "Vertrouwelijk partnerschapsvoorstel voor SSOE.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "https://lescoach.nl/ssoe" },
};

export default function SsoeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
