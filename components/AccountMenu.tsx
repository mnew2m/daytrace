"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type AccountUser = {
  email?: string;
  name: string;
  initial: string;
};

export function AccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(toAccountUser(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAccountUser(session?.user ?? null));
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/login");
    router.refresh();
  }

  if (!user) {
    return (
      <Link className="button button-primary account-login" href="/login">
        로그인
      </Link>
    );
  }

  return (
    <div className="account-menu-wrap">
      <button className="avatar-button" type="button" aria-label="사용자 메뉴" onClick={() => setIsOpen((value) => !value)}>
        <span className="avatar">{user.initial}</span>
      </button>

      {isOpen ? (
        <section className="user-menu">
          <div className="menu-profile">
            <span className="avatar">{user.initial}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <Link className="menu-item" href="/settings" onClick={() => setIsOpen(false)}>
            <span>환경설정</span>
            <span>›</span>
          </Link>
          <button className="menu-item" type="button">
            <span>데이터 내보내기</span>
            <span>CSV</span>
          </button>
          <button className="menu-item danger" type="button" onClick={signOut}>
            <span>로그아웃</span>
            <LogOut size={15} />
          </button>
        </section>
      ) : null}
    </div>
  );
}

function toAccountUser(user: Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>>["data"]["user"] | null): AccountUser | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const email = user.email ?? "";
  const name = String(metadata.full_name ?? metadata.name ?? email.split("@")[0] ?? "사용자");
  const initial = name.trim().charAt(0).toUpperCase() || "D";

  return { email, name, initial };
}
