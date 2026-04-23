import { ImageResponse } from "next/og";

export const alt = "LesCoach — Ondersteuning voor het speciaal onderwijs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b1e54 0%, #1e3a8a 50%, #2563eb 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <svg viewBox="0 0 200 200" width={180} height={180} xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="98" fill="#0b1e54" />
            <ellipse cx="100" cy="115" rx="58" ry="62" fill="#2563eb" />
            <ellipse cx="100" cy="125" rx="34" ry="40" fill="#f59e0b" />
            <circle cx="100" cy="82" r="48" fill="#1d4ed8" />
            <ellipse cx="82" cy="86" rx="22" ry="24" fill="#fef3c7" />
            <ellipse cx="118" cy="86" rx="22" ry="24" fill="#fef3c7" />
            <circle cx="82" cy="86" r="10" fill="#0b1e54" />
            <circle cx="118" cy="86" r="10" fill="#0b1e54" />
            <circle cx="85" cy="83" r="4" fill="#fff" />
            <circle cx="121" cy="83" r="4" fill="#fff" />
            <path d="M 92 100 L 108 100 L 100 112 Z" fill="#f59e0b" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2 }}>LesCoach</div>
            <div style={{ fontSize: 32, color: "#fbbf24", marginTop: 8 }}>
              Met Noor, specialist speciaal onderwijs
            </div>
          </div>
        </div>
        <div style={{ marginTop: 56, fontSize: 40, lineHeight: 1.3, maxWidth: 1040 }}>
          Snel de juiste kennis en expert vinden voor leerlingen met een speciale onderwijsbehoefte.
        </div>
        <div style={{ marginTop: 48, fontSize: 24, color: "#cbd5e1" }}>
          lescoach.nl
        </div>
      </div>
    ),
    { ...size }
  );
}
