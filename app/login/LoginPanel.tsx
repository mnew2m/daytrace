"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";

export function LoginPanel({ message }: { message?: string }) {
  const router = useRouter();
  const [error, setError] = useState(message ?? "");
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      router.refresh();
    }
  }

  return (
    <Card className="login-card">
      <div className="brand login-brand">
        <span className="brand-mark">D</span>
        <span>Daytrace</span>
      </div>
      <h1>로그인</h1>
      <p>Google 계정으로 Daytrace에 로그인합니다.</p>
      <Button appearance="primary" type="button" onClick={signInWithGoogle} disabled={isLoading}>
        {isLoading ? "Google로 이동 중" : "Google로 계속하기"}
      </Button>
      {error ? <p className="login-message">{error}</p> : null}
    </Card>
  );
}
