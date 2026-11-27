import { useId } from 'react';

interface FullContinentChinaFlagProps {
  clipPathId: string;
  svgWidth: number;
  svgHeight: number;
  cantonRight: number;
  cantonBottom: number;
  liberated: boolean;
  taiwanFallen?: boolean;
  opacity?: number;
}

function createStarPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  angleOffsetDeg = -90
): string {
  const coords: string[] = [];
  const step = Math.PI / points;
  const offset = (angleOffsetDeg * Math.PI) / 180;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = offset + i * step;
    coords.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return coords.join(' ');
}

/**
 * Renders either the PRC Five-Star Red Flag or the glowing ROC Blue Sky, White Sun,
 * and a Wholly Red Earth Flag directly clipped across the ENTIRE Mainland China landmass.
 */
export function FullContinentChinaFlag({
  clipPathId,
  svgWidth,
  svgHeight,
  cantonRight,
  cantonBottom,
  liberated,
  taiwanFallen = false,
  opacity = 0.94,
}: FullContinentChinaFlagProps) {
  const uid = useId().replace(/:/g, '');
  const rocGlowId = `roc-continent-glow-${uid}`;
  const prcGlowId = `prc-continent-glow-${uid}`;
  const rocRedGradId = `roc-red-grad-${uid}`;
  const rocBlueGradId = `roc-blue-grad-${uid}`;
  const prcRedGradId = `prc-red-grad-${uid}`;

  if (liberated && !taiwanFallen) {
    // Full-continent glowing ROC Flag (青天白日滿地紅旗)
    const sunCx = cantonRight * 0.52;
    const sunCy = cantonBottom * 0.52;
    const raysOuter = Math.min(cantonRight, cantonBottom) * 0.29;
    const raysInner = raysOuter * 0.53;
    const ringR = raysOuter * 0.57;
    const discR = raysOuter * 0.5;
    const sunRays = createStarPoints(sunCx, sunCy, raysOuter, raysInner, 12, -90);

    return (
      <g clipPath={`url(#${clipPathId})`} opacity={opacity} pointerEvents="none">
        <defs>
          <linearGradient id={rocRedGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="55%" stopColor="#B91C1C" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <radialGradient id={rocBlueGradId} cx="52%" cy="52%" r="65%">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="70%" stopColor="#002395" />
            <stop offset="100%" stopColor="#001666" />
          </radialGradient>
          <filter id={rocGlowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="6.5" result="outerGlow" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="innerGlow" />
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="innerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Wholly Red Earth across all of China */}
        <rect x={-320} y={-340} width={svgWidth + 640} height={svgHeight + 680} fill={`url(#${rocRedGradId})`} />

        {/* Luminous Blue Sky Canton */}
        <rect
          x={-320}
          y={-340}
          width={cantonRight + 320}
          height={cantonBottom + 340}
          fill={`url(#${rocBlueGradId})`}
        />

        {/* Radiant Canton Glow Halo */}
        <circle
          cx={sunCx}
          cy={sunCy}
          r={raysOuter * 1.45}
          fill="#60A5FA"
          fillOpacity={0.22}
          filter={`url(#${rocGlowId})`}
        />

        {/* 12-Ray Glowing White Sun */}
        <g filter={`url(#${rocGlowId})`}>
          <polygon points={sunRays} fill="#FFFFFF" />
          <circle cx={sunCx} cy={sunCy} r={ringR} fill="#001F8E" />
          <circle cx={sunCx} cy={sunCy} r={discR} fill="#FFFFFF" />
        </g>

        {/* Subtle luminous golden rim between Blue Sky and Red Earth */}
        <path
          d={`M ${cantonRight},-340 L ${cantonRight},${cantonBottom} L -320,${cantonBottom}`}
          fill="none"
          stroke="#93C5FD"
          strokeWidth={1.6}
          strokeOpacity={0.45}
        />
      </g>
    );
  }

  // Normal / Taiwan-fallen state: Full-continent glowing PRC Five-Star Red Flag (五星紅旗)
  const bigX = cantonRight * 0.34;
  const bigY = cantonBottom * 0.48;
  const bigR = Math.min(cantonRight, cantonBottom) * 0.16;
  const smallR = bigR * 0.34;
  const smallStars = [
    { cx: bigX + bigR * 2.1, cy: bigY - bigR * 1.35 },
    { cx: bigX + bigR * 2.75, cy: bigY - bigR * 0.5 },
    { cx: bigX + bigR * 2.75, cy: bigY + bigR * 0.65 },
    { cx: bigX + bigR * 2.1, cy: bigY + bigR * 1.45 },
  ];

  return (
    <g clipPath={`url(#${clipPathId})`} opacity={opacity} pointerEvents="none">
      <defs>
        <linearGradient id={prcRedGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="55%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#4C0E14" />
        </linearGradient>
        <filter id={prcGlowId} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="4" result="starGlow" />
          <feMerge>
            <feMergeNode in="starGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Crimson field covering entire China landmass */}
      <rect x={-320} y={-340} width={svgWidth + 640} height={svgHeight + 680} fill={`url(#${prcRedGradId})`} />

      {/* Subtle crimson ambient glow under stars */}
      <circle cx={bigX + bigR * 0.8} cy={bigY} r={bigR * 3.1} fill="#EF4444" fillOpacity={0.14} />

      {/* 5 Glowing Golden Stars */}
      <g filter={`url(#${prcGlowId})`}>
        <polygon
          points={createStarPoints(bigX, bigY, bigR, bigR * 0.382, 5, -90)}
          fill="#FACC15"
          fillOpacity={0.92}
        />
        {smallStars.map((s, idx) => {
          const angleDeg = (Math.atan2(bigY - s.cy, bigX - s.cx) * 180) / Math.PI;
          return (
            <polygon
              key={idx}
              points={createStarPoints(s.cx, s.cy, smallR, smallR * 0.382, 5, angleDeg)}
              fill="#FACC15"
              fillOpacity={0.9}
            />
          );
        })}
      </g>
    </g>
  );
}
