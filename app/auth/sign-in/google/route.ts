import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const response = NextResponse.next();
  const supabase = createRouteClient(request, response);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(error?.message ?? "Google 로그인 URL을 만들지 못했습니다")}`, url.origin));
  }

  const redirectResponse = NextResponse.redirect(data.url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
