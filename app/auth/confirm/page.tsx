import { Suspense } from "react";
import { Card } from "@/components/ui";
import { AuthConfirm } from "./AuthConfirm";

export default function AuthConfirmPage() {
  return (
    <main className="login-page">
      <Card className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark">D</span>
          <span>Daytrace</span>
        </div>
        <h1>로그인 확인</h1>
        <Suspense fallback={<p className="login-message">Google 로그인 세션을 확인하는 중입니다.</p>}>
          <AuthConfirm />
        </Suspense>
      </Card>
    </main>
  );
}
