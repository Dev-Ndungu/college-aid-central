
import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // animation duration in ms
  className?: string;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1200,
  className = "",
  prefix = "",
  suffix = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let start: number | null = null;
    const from = 0;
    const to = value;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = Math.floor(from + (to - from) * progress);
      setDisplayValue(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(to);
      }
    };

    raf.current = requestAnimationFrame(step);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
