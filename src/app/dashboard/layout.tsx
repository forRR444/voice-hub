import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { LogoutButton } from "./logout-button";
import { MobileSidebar } from "./mobile-sidebar";
import { PostHogIdentify } from "./posthog-identify";
import { SidebarContent } from "./sidebar-content";

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

  if (workspace && !workspace.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar (desktop: always visible, mobile: hamburger overlay) */}
      <MobileSidebar>
        <SidebarContent workspaceName={workspace?.name} />
      </MobileSidebar>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-foreground/10 px-4 md:px-6 py-3">
          {/* Spacer for mobile hamburger button */}
          <div className="w-10 md:hidden" />
          <div />
          <div className="flex items-center gap-4">
            <span className="text-xs text-foreground/50 hidden sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </header>

        {/* PostHog user identification */}
        <PostHogIdentify
          userId={user.id}
          email={user.email}
          workspaceName={workspace?.name}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
