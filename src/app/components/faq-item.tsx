"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full bg-white rounded-xl p-6 border border-gray-200 text-left cursor-pointer hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-bold text-gray-900">{q}</h3>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr] mt-3 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      </div>
    </button>
  );
}
