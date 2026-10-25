import { AuthForm } from "../../features/auth/AuthForm";
export const metadata = { title: "Đăng nhập" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <AuthForm
        returnTo={typeof params.next === "string" ? params.next : undefined}
      />
    </main>
  );
}
