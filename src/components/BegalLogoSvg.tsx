import React from 'react';

export const BegalLogoSvg: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="inline-flex flex-col select-none">
      <svg
        viewBox="0 0 420 94"
        className={compact ? 'h-10 w-auto' : 'h-16 sm:h-20 w-auto'}
        role="img"
        aria-label="BEGAL RUSH"
      >
        <defs>
          <linearGradient id="begalYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        {/* Speed slash bars */}
        <polygon points="8,18 34,18 22,52 -4,52" fill="#EF4444" />
        <polygon points="40,18 54,18 42,52 28,52" fill="#FACC15" />

        {/* BEGAL wordmark */}
        <text
          x="64"
          y="53"
          fill="#F8FAFC"
          fontFamily="'Chakra Petch', sans-serif"
          fontWeight="700"
          fontStyle="italic"
          fontSize="50"
          letterSpacing="3"
        >
          BEGAL
        </text>

        {/* RUSH accent wordmark */}
        <text
          x="236"
          y="53"
          fill="url(#begalYellow)"
          fontFamily="'Chakra Petch', sans-serif"
          fontWeight="700"
          fontStyle="italic"
          fontSize="50"
          letterSpacing="3"
        >
          RUSH
        </text>

        {/* Razor underline & tagline */}
        <polygon points="62,64 404,64 396,68 58,68" fill="#EF4444" />
        <text
          x="64"
          y="86"
          fill="#CBD5E1"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          fontSize="13"
          letterSpacing="5.5"
        >
          RIDE · SURVIVE · WIN
        </text>
      </svg>
    </div>
  );
};
