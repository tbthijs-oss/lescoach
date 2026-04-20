import React from "react";

interface JeroenAvatarProps {
  size?: number;
  className?: string;
}

export function JeroenAvatar({ size = 40, className = "" }: JeroenAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Jeroen"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="40" fill="#2563EB" />

      {/* Neck */}
      <rect x="32" y="52" width="16" height="12" rx="4" fill="#FBBF6A" />

      {/* Shoulders / shirt */}
      <ellipse cx="40" cy="75" rx="26" ry="14" fill="#1E40AF" />

      {/* Head */}
      <ellipse cx="40" cy="36" rx="17" ry="19" fill="#FBBF6A" />

      {/* Ears */}
      <ellipse cx="23" cy="36" rx="4" ry="5" fill="#FBBF6A" />
      <ellipse cx="57" cy="36" rx="4" ry="5" fill="#FBBF6A" />

      {/* Bald highlight (shiny top) */}
      <ellipse cx="37" cy="22" rx="7" ry="4" fill="#FCD9A0" opacity="0.5" />

      {/* Slight stubble / shadow on top — bald */}
      <ellipse cx="40" cy="20" rx="14" ry="8" fill="#F5A84A" opacity="0.15" />

      {/* Eyebrows */}
      <path d="M29 30 Q32 28 35 30" stroke="#7C4A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M45 30 Q48 28 51 30" stroke="#7C4A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Eyes */}
      <ellipse cx="32" cy="33" rx="3" ry="3.2" fill="white" />
      <ellipse cx="48" cy="33" rx="3" ry="3.2" fill="white" />
      <circle cx="33" cy="33.5" r="1.8" fill="#3B1F0A" />
      <circle cx="49" cy="33.5" r="1.8" fill="#3B1F0A" />
      {/* Eye shine */}
      <circle cx="33.8" cy="32.8" r="0.6" fill="white" />
      <circle cx="49.8" cy="32.8" r="0.6" fill="white" />

      {/* Nose */}
      <path d="M39 36 Q38 40 36 41 Q40 43 44 41 Q42 40 41 36" fill="#E8953A" opacity="0.5" />

      {/* Warm smile */}
      <path d="M33 44 Q40 50 47 44" stroke="#C0681A" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Collar of shirt */}
      <path d="M30 66 L36 58 L40 62 L44 58 L50 66" fill="#1E40AF" />
      <path d="M36 58 L40 54 L44 58" fill="white" opacity="0.9" />
    </svg>
  );
}

export default JeroenAvatar;
