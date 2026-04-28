"use client";

import { X } from "lucide-react";

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
  rounded = "rounded-xl",
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div
        className={`bg-white ${rounded} shadow-sm w-full ${maxWidth} sm:mx-4 p-4 sm:p-6 rounded-t-xl sm:rounded-b-xl ${className}`}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-foreground/40 hover:text-foreground/60 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
