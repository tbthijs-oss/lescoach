import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
        <svg
          viewBox="0 0 200 200"
          width={52}
          height={52}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* body */}
          <ellipse cx="100" cy="115" rx="58" ry="62" fill="#2563eb" />
          {/* belly */}
          <ellipse cx="100" cy="125" rx="34" ry="40" fill="#f59e0b" />
          {/* head */}
          <circle cx="100" cy="82" r="48" fill="#1d4ed8" />
          {/* face mask */}
          <ellipse cx="82" cy="86" rx="22" ry="24" fill="#fef3c7" />
          <ellipse cx="118" cy="86" rx="22" ry="24" fill="#fef3c7" />
          {/* eyes */}
          <circle cx="82" cy="86" r="10" fill="#0b1e54" />
          <circle cx="118" cy="86" r="10" fill="#0b1e54" />
          <circle cx="85" cy="83" r="3" fill="#fff" />
          <circle cx="121" cy="83" r="3" fill="#fff" />
          {/* beak */}
          <path d="M 92 100 L 108 100 L 100 112 Z" fill="#f59e0b" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
