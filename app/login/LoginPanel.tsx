"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <section className="login-card">
      <div className="brand login-brand">
        <span className="brand-mark">D</span>
        <span>Daytrace</span>
      </div>
      <h1>Daytrace</h1>
      <p>로그인 후 타임라인을 기록하세요.</p>
      <button className="google-login-button" type="button" onClick={signInWithGoogle} disabled={isLoading}>
        <span>G</span>
        {isLoading ? "Google로 이동 중" : "Google로 계속하기"}
      </button>
      {error ? <p className="login-message">{error}</p> : null}
    </section>
  );
}
