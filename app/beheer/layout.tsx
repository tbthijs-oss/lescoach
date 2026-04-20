import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LesCoach Beheer",
  robots: { index: false, follow: false },
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
