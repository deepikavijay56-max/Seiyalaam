interface FeasibilityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  labelSize?: number;
}

export default function FeasibilityRing({
  score,
  size = 56,
  strokeWidth = 5,
  showLabel = true,
  labelSize = 13,
}: FeasibilityRingProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--feasibility-high)';
    if (s >= 50) return 'var(--feasibility-medium)';
    return 'var(--feasibility-low)';
  };

  const ringColor = getColor(normalizedScore);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={`Feasibility Score: ${normalizedScore}%`}
      aria-label={`Feasibility ${normalizedScore}%`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      {showLabel && (
        <span
          className="tabular-nums"
          style={{
            position: 'absolute',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: labelSize,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}
        >
          {normalizedScore}%
        </span>
      )}
    </div>
  );
}
