import { LoginPanel } from "./LoginPanel";

export default function LoginPage({ searchParams }: { searchParams?: { message?: string } }) {
  return (
    <main className="login-page">
      <LoginPanel message={searchParams?.message} />
    </main>
  );
}
