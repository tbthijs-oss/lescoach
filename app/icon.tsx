import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Favicon — toont Noor's portret. Het PNG-bestand zelf wordt op runtime
 * door next/og opgehaald via de live URL en in een rond mask gerenderd.
 */
export default function Icon() {
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
          borderRadius: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          width={56}
          height={56}
          alt=""
          style={{ borderRadius: "50%" }}
        />
      </div>
    ),
    { ...size }
  );
}
