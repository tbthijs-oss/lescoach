import React from "react";

interface NoorAvatarProps {
  size?: number;
  className?: string;
}

export function NoorAvatar({ size = 40, className = "" }: NoorAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Noor"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="40" fill="#2563EB" />

      {/* Shoulders / blazer */}
      <ellipse cx="40" cy="78" rx="28" ry="16" fill="#1E3A8A" />
      {/* Blazer lapels */}
      <path d="M34 66 L38 72 L40 68 L42 72 L46 66 C44 61 36 61 34 66Z" fill="#1D4ED8" />

      {/* Neck */}
      <rect x="33" y="53" width="14" height="11" rx="4" fill="#F5C9A0" />

      {/* Head */}
      <ellipse cx="40" cy="36" rx="16" ry="18" fill="#F5C9A0" />

      {/* Ears */}
      <ellipse cx="24" cy="36" rx="3.5" ry="4.5" fill="#F5C9A0" />
      <ellipse cx="56" cy="36" rx="3.5" ry="4.5" fill="#F5C9A0" />

      {/* Gold stud earrings */}
      <circle cx="24" cy="37" r="2" fill="#F59E0B" />
      <circle cx="24" cy="37" r="1" fill="#FCD34D" />
      <circle cx="56" cy="37" r="2" fill="#F59E0B" />
      <circle cx="56" cy="37" r="1" fill="#FCD34D" />

      {/* Dark brown bob hair — top and sides */}
      {/* Main hair mass */}
      <path
        d="M24 34 C24 18 56 18 56 34 C56 26 52 16 40 16 C28 16 24 26 24 34Z"
        fill="#3D1F0C"
      />
      {/* Side hair panels (bob shape) */}
      <path
        d="M24 34 C22 36 21 40 22 46 C24 50 27 53 28 55 C29 52 29 46 28 42 C27 38 25 36 24 34Z"
        fill="#3D1F0C"
      />
      <path
        d="M56 34 C58 36 59 40 58 46 C56 50 53 53 52 55 C51 52 51 46 52 42 C53 38 55 36 56 34Z"
        fill="#3D1F0C"
      />
      {/* Hair sheen highlight */}
      <path
        d="M32 19 Q40 16 48 19 Q42 18 36 19Z"
        fill="#5C2E10"
        opacity="0.6"
      />

      {/* Eyebrows — dark, defined */}
      <path d="M30 29.5 Q33.5 27.5 37 29" stroke="#2A1206" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M43 29 Q46.5 27.5 50 29.5" stroke="#2A1206" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Eyes — almond shape */}
      <ellipse cx="33.5" cy="33" rx="3.2" ry="2.8" fill="white" />
      <ellipse cx="46.5" cy="33" rx="3.2" ry="2.8" fill="white" />
      <circle cx="33.5" cy="33" r="1.9" fill="#2A1206" />
      <circle cx="46.5" cy="33" r="1.9" fill="#2A1206" />
      {/* Eye shine */}
      <circle cx="34.3" cy="32.3" r="0.7" fill="white" />
      <circle cx="47.3" cy="32.3" r="0.7" fill="white" />

      {/* Upper lash line */}
      <path d="M30.5 31.5 Q33.5 30 36.5 31.5" stroke="#1A0A02" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M43.5 31.5 Q46.5 30 49.5 31.5" stroke="#1A0A02" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Nose — delicate */}
      <path d="M39 36 Q38 39 36.5 40.5 Q40 42 43.5 40.5 Q42 39 41 36" fill="#E8A070" opacity="0.4" />

      {/* Warm, confident smile */}
      <path d="M34.5 45 Q40 50.5 45.5 45" stroke="#C07050" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Subtle lip fullness */}
      <path d="M36 44.5 Q40 46.5 44 44.5" stroke="#D4856A" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

// Legacy alias so any code still importing JeroenAvatar keeps working
export const JeroenAvatar = NoorAvatar;

export default NoorAvatar;
