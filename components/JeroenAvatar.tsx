import React from "react";

interface NoorAvatarProps {
  size?: number;
  className?: string;
  /**
   * Optionele alt-tekst. Default: "Noor — LesCoach". Decoratief gebruik
   * (bv. naast tekst die de naam al noemt) → geef alt="" mee.
   */
  alt?: string;
  /**
   * Bij true wordt het ophalen direct gestart (handig voor hero-positie).
   * Anders lazy-loading via de browser.
   */
  priority?: boolean;
}

/**
 * LesCoach mascotte — portret-avatar van Noor.
 *
 * De afbeelding ligt op /public/avatar-noor.png (512×512). We gebruiken een
 * gewone <img> in plaats van next/image om het component overal inzetbaar
 * te houden (server- en client-componenten, error/loading/not-found pages),
 * en we tonen 'm circulair via rounded-full.
 *
 * `NoorAvatar` is de primaire export; `JeroenAvatar` blijft als alias
 * voor oudere imports.
 */
export function NoorAvatar({
  size = 40,
  className = "",
  alt = "Noor — LesCoach",
  priority = false,
}: NoorAvatarProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/avatar-noor.png"
      width={size}
      height={size}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`rounded-full object-cover bg-blue-100 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export const JeroenAvatar = NoorAvatar;
export default NoorAvatar;
