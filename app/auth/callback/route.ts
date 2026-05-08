import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const response = NextResponse.redirect(new URL("/timeline", url.origin));

  if (!code) {
    return NextResponse.redirect(new URL("/login?message=인증 코드가 없습니다", url.origin));
  }

  const supabase = createRouteClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(error.message)}`, url.origin));
  }

  return response;
}
