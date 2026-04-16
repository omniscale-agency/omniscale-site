export default function Logo({ size = 40, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // 3 chevrons en halftone pointant vers le haut-droite, façon logo Omniscale
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Omniscale"
    >
      <defs>
        <pattern id="omni-dots" x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="3" fill={color} />
        </pattern>
        <mask id="omni-mask">
          <rect width="200" height="200" fill="black" />
          {/* Chevron du haut (le plus en avant / haut-droite) */}
          <path
            d="M95 25 L175 25 L175 105 L155 105 L155 55 L105 55 L105 75 L85 75 Z"
            fill="white"
            transform="rotate(-12, 130, 65)"
          />
          {/* Chevron du milieu */}
          <path
            d="M70 70 L150 70 L150 150 L130 150 L130 100 L80 100 L80 120 L60 120 Z"
            fill="white"
            transform="rotate(-12, 105, 110)"
          />
          {/* Chevron du bas (le plus en arrière / bas-gauche) */}
          <path
            d="M45 115 L125 115 L125 195 L105 195 L105 145 L55 145 L55 165 L35 165 Z"
            fill="white"
            transform="rotate(-12, 80, 155)"
          />
        </mask>
      </defs>
      <rect width="200" height="200" fill="url(#omni-dots)" mask="url(#omni-mask)" />
    </svg>
  );
}
