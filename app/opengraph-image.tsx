import { ImageResponse } from "next/og";

export const alt = "LesCoach — Ondersteuning voor het speciaal onderwijs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG / social-share image. Brand-strip + headline op de top, daaronder de
 * brede klaslokaal-illustratie van Noor en haar leerlingen.
 *
 * De afbeelding wordt op runtime opgehaald van /avatar-noor-wide.jpg —
 * next/og draait op de Edge runtime en kan geen lokale assets inlinen,
 * dus we gebruiken de live URL.
 */
export default function OgImage() {
  const wideUrl = `${process.env.APP_URL || "https://lescoach.nl"}/avatar-noor-wide.jpg`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #0b1e54 0%, #1e3a8a 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand-strip — top */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "48px 80px 32px",
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
            LesCoach
          </div>
          <div style={{ fontSize: 28, color: "#fbbf24", marginTop: 8 }}>
            Met Noor — specialist speciaal onderwijs
          </div>
        </div>

        {/* Wide illustratie — onder */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "flex-end",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wideUrl}
            width={1200}
            height={400}
            alt=""
            style={{
              width: "100%",
              objectFit: "cover",
              objectPosition: "center 30%",
            }}
          />
        </div>

        {/* Footer — domein */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 56,
            right: 80,
            fontSize: 22,
            color: "#cbd5e1",
            letterSpacing: 1,
          }}
        >
          lescoach.nl
        </div>
      </div>
    ),
    { ...size }
  );
}
