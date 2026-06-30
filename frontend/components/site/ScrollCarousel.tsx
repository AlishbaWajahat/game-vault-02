"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollCarouselProps {
  children: ReactNode;
  className?: string;
}

export function ScrollCarousel({ children, className }: ScrollCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  function scroll(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <div className="relative group">
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-[#555555] border border-[#666666] text-white hover:text-[#4fb38c] hover:border-[#4fb38c]/60 hover:bg-[#666666] shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <div ref={ref} className={`carousel-scroll ${className || ""}`}>
        {children}
      </div>
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-[#555555] border border-[#666666] text-white hover:text-[#4fb38c] hover:border-[#4fb38c]/60 hover:bg-[#666666] shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
