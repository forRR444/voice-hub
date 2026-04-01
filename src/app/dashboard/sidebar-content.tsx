"use client";

import Link from "next/link";
import { SquaresFour, FileText, Code, ImageSquare, GearSix, ChatTeardrop, ArrowSquareOut } from "@phosphor-icons/react";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: SquaresFour },
  { href: "/dashboard/forms", label: "フォーム設定", icon: FileText },
  { href: "/dashboard/widgets", label: "ウィジェット", icon: Code },
  { href: "/dashboard/sns", label: "SNS画像", icon: ImageSquare },
];

export function SidebarContent({ workspaceName }: { workspaceName?: string }) {
  return (
    <>
      <div className="px-5 py-4 border-b border-foreground/10">
        <Link href="/dashboard" className="text-lg font-bold text-foreground hover:opacity-80 transition-opacity">VoiceHub</Link>
        {workspaceName && (
          <p className="text-xs text-foreground/50 mt-0.5 truncate">
            {workspaceName}
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <a
          href="https://forms.gle/XA7EA9CNGr67WeSk7"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
        >
          <ChatTeardrop className="h-4 w-4" />
          お問い合わせ
          <ArrowSquareOut className="h-3 w-3" />
        </a>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
        >
          <GearSix className="h-4 w-4" />
          設定
        </Link>
      </nav>
    </>
  );
}
