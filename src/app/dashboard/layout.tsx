import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, FileText, Code, Settings } from "lucide-react";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/dashboard/forms", label: "フォーム設定", icon: FileText },
  { href: "/dashboard/widgets", label: "ウィジェット", icon: Code },
  { href: "/dashboard/settings", label: "設定", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id);
  const workspace = workspaces?.[0] ?? null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-foreground/10 flex flex-col">
        <div className="px-5 py-4 border-b border-foreground/10">
          <h1 className="text-lg font-bold text-foreground">VoiceHub</h1>
          {workspace && (
            <p className="text-xs text-foreground/50 mt-0.5 truncate">
              {workspace.name}
            </p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-foreground/10 px-6 py-3">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-xs text-foreground/50">{user.email}</span>
            <LogoutButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
