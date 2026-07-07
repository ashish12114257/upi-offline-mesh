import { useState, useEffect, useRef } from 'react';

export function useAnimatedCounter(end: number, duration: number = 1500): number {
  const [count, setCount] = useState(0);
  const initialDone = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialDone.current && end > 0) {
      initialDone.current = true;

      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(eased * end);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);

      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    } else if (initialDone.current) {
      setCount(end);
    }
  }, [end, duration]);

  return count;
}
