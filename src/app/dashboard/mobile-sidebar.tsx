"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger - rendered in header via portal-like pattern */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-foreground/60 hover:text-foreground cursor-pointer"
          aria-label="メニューを開く"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop sidebar - always visible */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-foreground/10 bg-white flex-col">
        {children}
      </aside>

      {/* Mobile sidebar - overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-60 bg-white flex flex-col z-50 shadow-xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-foreground/60 hover:text-foreground cursor-pointer"
                aria-label="メニューを閉じる"
              >
                <X size={18} />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>{children}</div>
          </aside>
        </div>
      )}
    </>
  );
}
