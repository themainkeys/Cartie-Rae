import React, { useState, useEffect } from 'react';

export const AnimatedAdminCounter: React.FC<{
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  prefersReducedMotion?: boolean;
}> = ({ value, decimals = 0, prefix = '', suffix = '', duration = 1.0, prefersReducedMotion = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    let startTime: number | null = null;
    const startValue = 0;

    const animateValue = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = startValue + easeProgress * (value - startValue);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(animateValue);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
