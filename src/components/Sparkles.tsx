/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';

const Sparkles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const timeouts = new Set<NodeJS.Timeout>();
    const container = containerRef.current;

    if (!container) return;

    const createSparkles = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";
        
        const left = x + Math.random() * 10 - 5;
        const top = y + Math.random() * 10 - 5;
        
        sparkle.style.left = `${left}px`;
        sparkle.style.top = `${top}px`;
        sparkle.style.position = "absolute";
        sparkle.style.pointerEvents = "none";
        
        container.appendChild(sparkle);

        const timeout = setTimeout(() => {
          if (container.contains(sparkle)) {
            container.removeChild(sparkle);
          }
          // MEMORY LEAK FIX: Remove timer from Set once executed
          timeouts.delete(timeout);
        }, 800);
        
        timeouts.add(timeout);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          createSparkles(e.clientX, e.clientY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      if (container) {
        container.replaceChildren();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      id="sparkle-container" 
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999, width: '100vw', height: '100vh', overflow: 'hidden' }} 
    />
  );
};

export default React.memo(Sparkles);



