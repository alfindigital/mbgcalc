import { useState, useEffect, useRef, useCallback } from "react";

export function useAnimatedNumber(target: number, duration = 400): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  const animate = useCallback(
    (from: number, to: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setCurrent(from + (to - from) * eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [duration]
  );

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = target;
    if (prev !== target) {
      animate(prev, target);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, animate]);

  return current;
}
