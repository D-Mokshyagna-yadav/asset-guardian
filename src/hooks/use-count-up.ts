import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to the target value over a given duration.
 * Uses requestAnimationFrame for smooth 60fps animation with easeOutQuart easing.
 */
export function useCountUp(target: number, duration = 800, enabled = true): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setCurrent(target);
      return;
    }

    const from = prevTarget.current;
    const to = target;
    prevTarget.current = target;

    if (from === to) {
      setCurrent(to);
      return;
    }

    const startTime = performance.now();

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const value = Math.round(from + (to - from) * easedProgress);

      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return current;
}
