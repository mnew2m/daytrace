"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";

type AccountUser = {
  email: string;
  name: string;
};

export function AccountSettings() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AccountUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setUser(null);
        return;
      }

      const metadata = data.user.user_metadata ?? {};
      const email = data.user.email ?? "";
      setUser({
        email,
        name: String(metadata.full_name ?? metadata.name ?? email.split("@")[0] ?? "사용자")
      });
    });
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Card className="settings-card">
      <div className="setting-row">
        <div>
          <strong>로그인 상태</strong>
          <span>{user ? "Google 계정으로 로그인되어 있습니다." : "로그인이 필요합니다."}</span>
        </div>
        <div className={`status ${user ? "" : "muted"}`}>
          <i className="dot" />
          {user ? "연결됨" : "미연결"}
        </div>
      </div>

      <div className="setting-row">
        <div>
          <strong>프로필</strong>
          <span>{user ? `${user.name} · ${user.email}` : "로그인 후 프로필 정보를 확인할 수 있습니다."}</span>
        </div>
        <Button disabled>수정</Button>
      </div>

      <div className="setting-row">
        <div>
          <strong>데이터 내보내기</strong>
          <span>내 기록을 CSV 또는 JSON 파일로 저장합니다.</span>
        </div>
        <Button appearance="primary" icon="Download">내보내기</Button>
      </div>

      <div className="setting-row">
        <div>
          <strong>로그아웃</strong>
          <span>이 브라우저에서 Daytrace 세션을 종료합니다.</span>
        </div>
        <Button appearance="danger" icon="LogOut" onClick={signOut}>로그아웃</Button>
      </div>
    </Card>
  );
}
