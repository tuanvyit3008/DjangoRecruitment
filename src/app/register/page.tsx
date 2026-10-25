import { AuthForm } from "../../features/auth/AuthForm";
export const metadata = { title: "Đăng ký" };
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <AuthForm
        register
        initialRole={typeof params.role === "string" ? params.role : undefined}
      />
    </main>
  );
}
