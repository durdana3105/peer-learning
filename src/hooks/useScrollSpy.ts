import { useEffect, useState } from "react";

interface UseScrollSpyOptions {
  sectionIds: string[];
  offset?: number;
}

export function useScrollSpy({ sectionIds, offset = 80 }: UseScrollSpyOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const updateActiveSection = () => {
      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      if (sections.length === 0) return;

      const scrollPos = window.scrollY + offset + 1;

      let current: string | null = null;

      for (const section of sections) {
        if (section.offsetTop <= scrollPos) {
          current = section.id;
        }
      }

      // Above first section = Home
      if (window.scrollY < offset) {
        setActiveId(null);
      } else {
        setActiveId(current);
      }
    };

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sectionIds, offset]);

  return activeId;
}
