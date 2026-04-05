"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

type Option = { value: string; label: string };

export default function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  placeholder = "選択...",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2 text-sm border border-foreground/10 rounded-lg bg-white cursor-pointer hover:bg-foreground/5 transition-colors"
      >
        <span className={current ? "text-foreground" : "text-foreground/40"}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className="text-foreground/40 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg py-1 shadow-lg bg-white border border-foreground/10 max-h-60 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-foreground/5 ${
                value === o.value ? "text-indigo-600 font-medium" : "text-foreground/70"
              }`}
            >
              {o.label}
              {value === o.value && <Check size={14} className="ml-auto text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
