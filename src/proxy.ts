import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/auth/callback|api/auth/confirm|api/stripe/webhook|widget|api/widgets|api/forms|form/|preview/|terms|privacy|try|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2|woff|ttf|map|html)$).*)",
  ],
};
