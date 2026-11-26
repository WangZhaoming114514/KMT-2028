import { useId } from 'react';

interface ChinaTheaterFlagProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  liberated: boolean;
  taiwanFallen?: boolean;
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

export function ChinaTheaterFlag({
  x,
  y,
  width = 96,
  height = 64,
  liberated,
  taiwanFallen = false,
}: ChinaTheaterFlagProps) {
  const uid = useId().replace(/:/g, '');
  const glowId = `roc-flag-glow-${uid}`;
  const prcShadowId = `prc-flag-shadow-${uid}`;

  // Top-left corner centered at (x, y)
  const left = x - width / 2;
  const top = y - height / 2;

  if (liberated && !taiwanFallen) {
    // Republic of China Flag (青天白日滿地紅旗) with luminous multi-layer glow
    const cantonW = width / 2;
    const cantonH = height / 2;
    const sunCx = cantonW / 2;
    const sunCy = cantonH / 2;
    const raysOuter = height * 0.1875; // standard 3/16 of hoist
    const raysInner = height * 0.1;
    const ringR = height * 0.106;
    const discR = height * 0.09375;

    const sunRays = createStarPoints(sunCx, sunCy, raysOuter, raysInner, 12, -90);

    return (
      <g transform={`translate(${left}, ${top})`} pointerEvents="none">
        <defs>
          <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="5.5" result="blurOuter" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blurInner" />
            <feMerge>
              <feMergeNode in="blurOuter" />
              <feMergeNode in="blurInner" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer radiant halo */}
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={3}
          fill="#60A5FA"
          fillOpacity={0.28}
          filter={`url(#${glowId})`}
        />
        <rect
          x={-1.5}
          y={-1.5}
          width={width + 3}
          height={height + 3}
          rx={2}
          fill="none"
          stroke="#FACC15"
          strokeWidth={1.8}
          strokeOpacity={0.95}
          filter={`url(#${glowId})`}
        />

        {/* Flag body */}
        <g filter={`url(#${glowId})`}>
          {/* Wholly Red Earth */}
          <rect x={0} y={0} width={width} height={height} fill="#DE1B1B" />
          {/* Blue Sky Canton */}
          <rect x={0} y={0} width={cantonW} height={cantonH} fill="#001D8E" />
          {/* 12-Ray White Sun */}
          <polygon points={sunRays} fill="#FFFFFF" />
          <circle cx={sunCx} cy={sunCy} r={ringR} fill="#001D8E" />
          <circle cx={sunCx} cy={sunCy} r={discR} fill="#FFFFFF" />
        </g>

        {/* Caption ribbon */}
        <rect
          x={width / 2 - 44}
          y={height + 5}
          width={88}
          height={15}
          fill="#0F2557"
          fillOpacity={0.92}
          stroke="#FACC15"
          strokeWidth={0.9}
        />
        <text
          x={width / 2}
          y={height + 15.5}
          textAnchor="middle"
          fill="#FEF08A"
          fontSize="8.5"
          fontWeight="800"
        >
          青天白日重光大陸
        </text>
      </g>
    );
  }

  // PRC Five-Star Red Flag (中華人民共和國五星紅旗) on Mainland China in normal/fallen state
  // Standard 30x20 grid mapped cleanly to (width x height)
  const ux = width / 30;
  const uy = height / 20;
  const u = Math.min(ux, uy);

  const bigStar = createStarPoints(5 * ux, 5 * uy, 3 * u, 1.15 * u, 5, -90);
  const smallStarSpecs: Array<{ cx: number; cy: number }> = [
    { cx: 10, cy: 2 },
    { cx: 12, cy: 4 },
    { cx: 12, cy: 7 },
    { cx: 10, cy: 9 },
  ];

  return (
    <g transform={`translate(${left}, ${top})`} opacity={0.92} pointerEvents="none">
      <defs>
        <filter id={prcShadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.65" />
        </filter>
      </defs>

      <g filter={`url(#${prcShadowId})`}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#C81E1E"
          stroke="#FCA5A5"
          strokeWidth={1.1}
          strokeOpacity={0.75}
        />
        <polygon points={bigStar} fill="#FACC15" />
        {smallStarSpecs.map((s, idx) => {
          // Point one vertex directly toward big star center (5, 5)
          const angleDeg = (Math.atan2(5 - s.cy, 5 - s.cx) * 180) / Math.PI;
          return (
            <polygon
              key={idx}
              points={createStarPoints(s.cx * ux, s.cy * uy, 1 * u, 0.38 * u, 5, angleDeg)}
              fill="#FACC15"
            />
          );
        })}
      </g>

      <rect
        x={width / 2 - 36}
        y={height + 5}
        width={72}
        height={14}
        fill="#1F0B10"
        fillOpacity={0.9}
        stroke="#7F1D1D"
        strokeWidth={0.8}
      />
      <text
        x={width / 2}
        y={height + 14.5}
        textAnchor="middle"
        fill="#FCA5A5"
        fontSize="8"
        fontWeight="700"
      >
        中共控制區
      </text>
    </g>
  );
}
