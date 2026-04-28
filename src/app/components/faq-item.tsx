"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full bg-[var(--plate)] rounded-lg p-4 sm:p-6 text-left cursor-pointer hover:shadow-[0_2px_4px_rgba(26,31,54,0.04)] transition-shadow"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--slate)] tracking-[-0.011em]">
          {q}
        </h3>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--slate)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {open && (
        <p className="text-xs sm:text-sm text-[var(--slate)] leading-relaxed mt-2 sm:mt-3">{a}</p>
      )}
    </button>
  );
}
