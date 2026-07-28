import { useEffect, useState } from "react";

/**
 * Custom hook to animate a number from 0 to its target value.
 *
 * @param end Target value to count up to.
 * @param duration Animation duration in milliseconds. Defaults to 2000.
 * @param trigger Boolean to start the animation. Defaults to true.
 */
export function useCountUp(
  end: number,
  duration: number = 2000,
  trigger: boolean = true,
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If the animation shouldn't trigger yet, keep count at 0
    if (!trigger) {
      return;
    }

    // Respect prefers-reduced-motion media query
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuad easing function
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      setCount(Math.floor(easedProgress * end));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    const animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, trigger]);

  return count;
}
