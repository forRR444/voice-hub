import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRow } from "@/types/database";

type AuthSuccess<W> = {
  ok: true;
  supabase: SupabaseClient;
  user: User;
  workspace: W;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

async function authenticate(): Promise<
  { ok: true; supabase: SupabaseClient; user: User } | AuthFailure
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, supabase, user };
}

export async function requireUser(): Promise<
  { ok: true; supabase: SupabaseClient; user: User } | AuthFailure
> {
  return authenticate();
}

function workspaceNotFound(): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ error: "Workspace not found" }, { status: 404 }),
  };
}

export async function requireAuthAndWorkspace(): Promise<
  AuthSuccess<{ id: string }> | AuthFailure
> {
  const auth = await authenticate();
  if (!auth.ok) return auth;
  const { data: workspace } = await auth.supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.user.id)
    .single();
  if (!workspace) return workspaceNotFound();
  return { ok: true, supabase: auth.supabase, user: auth.user, workspace };
}

export async function requireAuthAndWorkspaceWithSubscription(): Promise<
  AuthSuccess<{ id: string; subscription_status: string | null }> | AuthFailure
> {
  const auth = await authenticate();
  if (!auth.ok) return auth;
  const { data: workspace } = await auth.supabase
    .from("workspaces")
    .select("id, subscription_status")
    .eq("user_id", auth.user.id)
    .single();
  if (!workspace) return workspaceNotFound();
  return { ok: true, supabase: auth.supabase, user: auth.user, workspace };
}

export async function requireAuthAndWorkspaceFull(): Promise<
  AuthSuccess<WorkspaceRow> | AuthFailure
> {
  const auth = await authenticate();
  if (!auth.ok) return auth;
  const { data: workspace } = await auth.supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", auth.user.id)
    .single();
  if (!workspace) return workspaceNotFound();
  return { ok: true, supabase: auth.supabase, user: auth.user, workspace };
}

const deleteIdSchema = z.object({ id: z.string().min(1) });

export function createWorkspaceDeleteHandler(
  table: "forms" | "widgets" | "testimonials",
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await requireAuthAndWorkspace();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = deleteIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from(table)
      .delete()
      .eq("id", parsed.data.id)
      .eq("workspace_id", auth.workspace.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  };
}
