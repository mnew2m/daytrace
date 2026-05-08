"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function AuthConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Google 로그인 세션을 확인하는 중입니다.");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login?message=인증 코드가 없습니다");
      return;
    }

    const supabase = createClient();

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setMessage(error.message);
        router.replace(`/login?message=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace("/timeline");
      router.refresh();
    });
  }, [router, searchParams]);

  return <p className="login-message">{message}</p>;
}
