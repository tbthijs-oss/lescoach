import React from "react";

interface NoorAvatarProps {
  size?: number;
  className?: string;
}

/**
 * LesCoach mascotte — een wijze uil met baret.
 * Blauw + oranje, rond formaat, werkt op elke grootte.
 *
 * NoorAvatar is de primaire export. JeroenAvatar blijft als legacy alias.
 */
export function NoorAvatar({ size = 40, className = "" }: NoorAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Noor — LesCoach"
      role="img"
    >
      <defs>
        <radialGradient id="noorBg" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="70%" stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </radialGradient>
        <linearGradient id="noorBody" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="noorWing" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="noorOrange" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="noorCap" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="99" fill="url(#noorBg)" />

      <ellipse cx="100" cy="122" rx="58" ry="56" fill="url(#noorBody)" />
      <ellipse cx="100" cy="132" rx="36" ry="38" fill="#93C5FD" opacity="0.55" />

      <path d="M52 105 C38 115 36 150 50 168 C60 172 70 166 72 155 C74 138 68 115 58 104 Z" fill="url(#noorWing)" />
      <path d="M148 105 C162 115 164 150 150 168 C140 172 130 166 128 155 C126 138 132 115 142 104 Z" fill="url(#noorWing)" />

      <path d="M58 110 C50 118 48 140 58 158 C63 160 68 156 68 150 C68 138 65 122 60 112 Z" fill="url(#noorOrange)" opacity="0.9" />
      <path d="M142 110 C150 118 152 140 142 158 C137 160 132 156 132 150 C132 138 135 122 140 112 Z" fill="url(#noorOrange)" opacity="0.9" />

      <ellipse cx="86" cy="180" rx="7" ry="5" fill="url(#noorOrange)" />
      <ellipse cx="114" cy="180" rx="7" ry="5" fill="url(#noorOrange)" />

      <path d="M60 82 C58 100 72 122 100 122 C128 122 142 100 140 82 C138 70 125 58 100 58 C75 58 62 70 60 82 Z" fill="url(#noorOrange)" />

      <circle cx="78" cy="88" r="15" fill="#FEF3C7" />
      <circle cx="122" cy="88" r="15" fill="#FEF3C7" />

      <circle cx="78" cy="90" r="9" fill="#1E3A8A" />
      <circle cx="122" cy="90" r="9" fill="#1E3A8A" />
      <circle cx="80" cy="92" r="3.5" fill="#0F172A" />
      <circle cx="124" cy="92" r="3.5" fill="#0F172A" />
      <circle cx="76" cy="86" r="2.5" fill="#FFFFFF" />
      <circle cx="120" cy="86" r="2.5" fill="#FFFFFF" />

      <path d="M58 68 C62 62 72 58 80 62 C76 66 68 72 62 72 Z" fill="url(#noorOrange)" />
      <path d="M142 68 C138 62 128 58 120 62 C124 66 132 72 138 72 Z" fill="url(#noorOrange)" />

      <path d="M100 98 L94 108 C96 112 104 112 106 108 Z" fill="url(#noorOrange)" />
      <path d="M96 108 C98 110 102 110 104 108 L100 114 Z" fill="#F59E0B" />

      <ellipse cx="100" cy="42" rx="52" ry="8" fill="url(#noorCap)" />
      <rect x="82" y="30" width="36" height="14" rx="2" fill="url(#noorCap)" />
      <rect x="48" y="38" width="104" height="8" rx="1" fill="#1E3A8A" />
      <circle cx="142" cy="42" r="2" fill="#FBBF24" />
      <path d="M142 43 L146 55 C146 57 142 58 141 56 L140 44 Z" fill="url(#noorOrange)" />
      <circle cx="143" cy="58" r="3.5" fill="#FBBF24" />

      <ellipse cx="78" cy="108" rx="8" ry="14" fill="#FFFFFF" opacity="0.2" />
    </svg>
  );
}

export const JeroenAvatar = NoorAvatar;
export default NoorAvatar;
