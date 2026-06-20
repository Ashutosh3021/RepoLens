/**
 * ProfileRadarChart
 * Radar/spider chart for the 10 category scores using pure SVG
 * (no external chart lib needed — keeps bundle small)
 */

"use client";

import { motion } from "framer-motion";

interface RadarPoint {
  category: string;
  score: number;
  fullMark: number;
}

interface Props {
  data: RadarPoint[];
  size?: number;
}

export function ProfileRadarChart({ data, size = 300 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = 5;
  const total = data.length;

  // Angle for each axis (starting top, clockwise)
  const angle = (i: number) => (Math.PI * 2 * i) / total - Math.PI / 2;

  // Polar → cartesian
  const polar = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Concentric background rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (radius / levels) * (i + 1);
    const points = Array.from({ length: total }, (__, j) => {
      const p = polar(r, j);
      return `${p.x},${p.y}`;
    }).join(" ");
    return points;
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.score / d.fullMark) * radius;
    return polar(r, i);
  });
  const polyPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Background rings */}
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {data.map((_, i) => {
        const outer = polar(radius, i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data area */}
      <motion.path
        d={polyPath}
        fill="rgba(0,229,255,0.15)"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Data point dots */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x} cy={p.y} r={4}
          fill="#00e5ff"
          stroke="#0a0a0f"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
        />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const labelR = radius + 28;
        const p = polar(labelR, i);
        const textAnchor = p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle";
        // Shorten label for small sizes
        const label = d.category.length > 14 ? d.category.split(" ")[0] : d.category;
        return (
          <text
            key={i}
            x={p.x} y={p.y + 4}
            textAnchor={textAnchor}
            fontSize={size < 250 ? 9 : 10}
            fill="rgba(148,163,184,0.9)"
            fontFamily="var(--font-syne, sans-serif)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
