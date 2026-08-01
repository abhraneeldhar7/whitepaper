"use client";

import { cn } from "@/lib/utils";

type PaperVariant = "front" | "middle" | "back";

const PAPER = {
  back: {
    viewW: 130,
    viewH: 180,
    x: 140,
    y: 100,
    fill: "#E8E8EB",
    lines: [
      { x: 15, y: 20, w: 50, h: 8, rx: 4, fill: "#CFCFD4" },
      { x: 15, y: 40, w: 90, h: 6, rx: 3, fill: "#E0E0E5" },
      { x: 15, y: 55, w: 100, h: 6, rx: 3, fill: "#E0E0E5" },
    ],
  },
  middle: {
    viewW: 140,
    viewH: 190,
    x: 150,
    y: 80,
    fill: "#F4F4F6",
    lines: [
      { x: 15, y: 20, w: 70, h: 8, rx: 4, fill: "#D8D8DE" },
      { x: 15, y: 40, w: 100, h: 6, rx: 3, fill: "#E8E8EC" },
      { x: 15, y: 55, w: 90, h: 6, rx: 3, fill: "#E8E8EC" },
      { x: 15, y: 70, w: 110, h: 6, rx: 3, fill: "#E8E8EC" },
    ],
  },
  front: {
    viewW: 150,
    viewH: 200,
    x: 150,
    y: 90,
    fill: "#FFFFFF",
    lines: [
      { x: 15, y: 20, w: 60, h: 8, rx: 4, fill: "#E2E2E8" },
      { x: 15, y: 40, w: 115, h: 6, rx: 3, fill: "#F0F0F4" },
      { x: 15, y: 55, w: 105, h: 6, rx: 3, fill: "#F0F0F4" },
      { x: 15, y: 70, w: 120, h: 6, rx: 3, fill: "#F0F0F4" },
      { x: 15, y: 85, w: 80, h: 6, rx: 3, fill: "#F0F0F4" },
      { x: 15, y: 100, w: 110, h: 6, rx: 3, fill: "#F0F0F4" },
    ],
  },
};

interface PaperVisualProps {
  variant?: PaperVariant;
  className?: string;
  shadowFilterId?: string;
  /** Renders as <g> for embedding in a parent SVG. Omits the svg wrapper. */
  inline?: boolean;
}

export default function PaperVisual({ variant = "front", className, shadowFilterId, inline }: PaperVisualProps) {
  const cfg = PAPER[variant];
  const shadow = shadowFilterId ? `url(#${shadowFilterId})` : undefined;

  if (inline) {
    return (
      <g className={cn("transition-transform duration-300 ease-out", className)}>
        <rect x={cfg.x} y={cfg.y} width={cfg.viewW} height={cfg.viewH} rx="12" fill={cfg.fill} filter={shadow} />
        {cfg.lines.map((l, i) => (
          <rect key={i} x={cfg.x + l.x} y={cfg.y + l.y} width={l.w} height={l.h} rx={l.rx} fill={l.fill} />
        ))}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${cfg.viewW} ${cfg.viewH}`}
      className={cn(
        "drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duraiton-default ease-out",
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width={cfg.viewW} height={cfg.viewH} rx="12" fill={cfg.fill} filter={shadow} />
      {cfg.lines.map((l, i) => (
        <rect key={i} x={l.x} y={l.y} width={l.w} height={l.h} rx={l.rx} fill={l.fill} />
      ))}
    </svg>
  );
}
