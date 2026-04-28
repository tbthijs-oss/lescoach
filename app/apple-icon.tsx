import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple-touch-icon — Noor's portret in een ronde lijst, met dezelfde
 * blauwe achtergrond als de overige iconografie.
 */
export default function AppleIcon() {
  const avatarUrl = `${process.env.APP_URL || "https://lescoach.nl"}/avatar-noor.png`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, #1e40af 0%, #0b1e54 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          width={156}
          height={156}
          alt=""
          style={{ borderRadius: "50%", border: "4px solid rgba(255,255,255,0.25)" }}
        />
      </div>
    ),
    { ...size }
  );
}
