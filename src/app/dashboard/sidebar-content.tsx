"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Code, ImageIcon, Settings, MessageSquare, ExternalLink } from "lucide-react";

const ink = "#1A1F36";
const slate = "#4F566B";
const muted = "#A3ACB9";
const brand = "#635BFF";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/forms", label: "フォーム", icon: FileText },
  { href: "/dashboard/widgets", label: "ウィジェット", icon: Code },
  { href: "/dashboard/sns", label: "SNS画像", icon: ImageIcon },
];

export function SidebarContent({ workspaceName }: { workspaceName?: string }) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#F7F8F9" }}>
      <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(227,232,238,0.5)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity duration-150 hover:opacity-80">
          <div className="w-7 h-7 rounded-[4px] flex items-center justify-center text-white text-xs font-bold" style={{ background: brand }}>V</div>
          <div>
            <span className="text-sm font-semibold" style={{ color: ink, letterSpacing: "-0.022em" }}>VoiceHub</span>
            {workspaceName && <p className="text-[10px] truncate -mt-0.5" style={{ color: muted }}>{workspaceName}</p>}
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] transition-all duration-150"
              style={{
                color: active ? brand : slate,
                background: active ? "rgba(99,91,255,0.06)" : "transparent",
                fontWeight: active ? 600 : 400,
                letterSpacing: "-0.011em",
              }}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}

        <div className="my-2" style={{ borderTop: "1px solid rgba(227,232,238,0.5)" }} />

        <a
          href="https://forms.gle/XA7EA9CNGr67WeSk7"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] transition-opacity duration-150 hover:opacity-70"
          style={{ color: slate, letterSpacing: "-0.011em" }}
        >
          <MessageSquare size={16} />
          お問い合わせ
          <ExternalLink size={11} style={{ color: muted }} />
        </a>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] transition-all duration-150"
          style={{
            color: isActive("/dashboard/settings") ? brand : slate,
            background: isActive("/dashboard/settings") ? "rgba(99,91,255,0.06)" : "transparent",
            fontWeight: isActive("/dashboard/settings") ? 600 : 400,
            letterSpacing: "-0.011em",
          }}
        >
          <Settings size={16} />
          設定
        </Link>
      </nav>
    </div>
  );
}
