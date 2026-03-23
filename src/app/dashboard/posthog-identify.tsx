"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogIdentify({
  userId,
  email,
  workspaceName,
}: {
  userId: string;
  email?: string;
  workspaceName?: string;
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.identify(userId, {
      email,
      workspace_name: workspaceName,
    });
  }, [userId, email, workspaceName]);

  return null;
}
