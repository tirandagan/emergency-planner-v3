"use client";

import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  /** Value from 0-100 */
  value: number;
  /** Size in pixels (default: 120) */
  size?: number;
  /** Stroke width in pixels (default: 8) */
  strokeWidth?: number;
  /** Show percentage label in center (default: true) */
  showLabel?: boolean;
  /** Custom color for progress stroke */
  color?: string;
  /** Background stroke color */
  bgColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Label suffix (default: none, can be "%" or custom) */
  labelSuffix?: string;
}

export function CircularGauge({
  value,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  color = "hsl(var(--primary))",
  bgColor = "hsl(var(--muted))",
  className,
  labelSuffix = "",
}: CircularGaugeProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Calculate SVG parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedValue / 100) * circumference;

  // Determine color based on value if not explicitly set
  const getScoreColor = () => {
    if (color !== "hsl(var(--primary))") return color;
    if (clampedValue >= 70) return "hsl(var(--success, 142 76% 36%))";
    if (clampedValue >= 40) return "hsl(var(--warning, 38 92% 50%))";
    return "hsl(var(--destructive))";
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              size >= 100 ? "text-2xl" : size >= 60 ? "text-lg" : "text-sm"
            )}
          >
            {clampedValue}
            {labelSuffix && (
              <span className="text-muted-foreground text-[0.6em]">{labelSuffix}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
