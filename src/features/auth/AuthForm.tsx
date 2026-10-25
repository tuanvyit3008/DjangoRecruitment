"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthProvider";
import { ApiError } from "../../api/errors";

export function safeReturnPath(value?: string) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\u0000-\u0020]/.test(value) &&
    !/^\/(login|register)(?:[/?#]|$)/.test(value)
    ? value
    : "/account";
}
export function AuthForm({
  register = false,
  returnTo,
  initialRole,
}: {
  register?: boolean;
  returnTo?: string;
  initialRole?: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (auth.status === "authenticated")
      router.replace(safeReturnPath(returnTo));
  }, [auth.status, returnTo, router]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setFields({});
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const payload = {
        email: String(data.get("email") ?? "").trim(),
        password: String(data.get("password") ?? ""),
      };
      if (register) {
        const role = data.get("role");
        if (role !== "CANDIDATE" && role !== "EMPLOYER")
          throw new ApiError("Vai trò đăng ký không hợp lệ.", "http", 400);
        await auth.signUp({
          ...payload,
          first_name: String(data.get("first_name") ?? "").trim(),
          last_name: String(data.get("last_name") ?? "").trim(),
          role,
        });
      } else await auth.signIn(payload);
      router.replace(safeReturnPath(returnTo));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xác thực.");
      if (err instanceof ApiError) setFields(err.fields);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const fieldError = (name: string) =>
    (fields[name] || []).length ? (
      <span id={`${name}-error`} className="field-error">
        {fields[name].join(" ")}
      </span>
    ) : null;
  return (
    <div className="auth-card">
      <div className="auth-mark">P</div>
      <h1>{register ? "Tạo tài khoản mới" : "Chào mừng trở lại"}</h1>
      <p>
        {register
          ? "Bắt đầu hành trình sự nghiệp cùng PTIT CareerHub."
          : "Đăng nhập để tiếp tục khám phá cơ hội."}
      </p>
      <form onSubmit={submit}>
        {register && (
          <>
            <label htmlFor="first_name">
              Tên
              <input
                id="first_name"
                name="first_name"
                autoComplete="given-name"
                aria-invalid={Boolean(fields.first_name)}
                aria-describedby={
                  fields.first_name ? "first_name-error" : undefined
                }
              />
              {fieldError("first_name")}
            </label>
            <label htmlFor="last_name">
              Họ
              <input
                id="last_name"
                name="last_name"
                autoComplete="family-name"
                aria-invalid={Boolean(fields.last_name)}
                aria-describedby={
                  fields.last_name ? "last_name-error" : undefined
                }
              />
              {fieldError("last_name")}
            </label>
            <label htmlFor="role">
              Loại tài khoản
              <select
                id="role"
                name="role"
                defaultValue={
                  initialRole === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE"
                }
                aria-invalid={Boolean(fields.role)}
                aria-describedby={fields.role ? "role-error" : undefined}
              >
                <option value="CANDIDATE">Ứng viên</option>
                <option value="EMPLOYER">Nhà tuyển dụng</option>
              </select>
              {fieldError("role")}
            </label>
          </>
        )}
        <label htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(fields.email)}
            aria-describedby={fields.email ? "email-error" : undefined}
          />
          {fieldError("email")}
        </label>
        <label htmlFor="password">
          Mật khẩu
          <input
            id="password"
            aria-label="Mật khẩu"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={register ? "new-password" : "current-password"}
            required
            aria-invalid={Boolean(fields.password)}
            aria-describedby={fields.password ? "password-error" : undefined}
          />
          {fieldError("password")}
        </label>
        <button
          type="button"
          className="clear-filter password-toggle"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        </button>
        {error && (
          <div role="alert" className="error-notice">
            {error}
            {Object.entries(fields)
              .filter(
                ([key]) =>
                  ![
                    "first_name",
                    "last_name",
                    "role",
                    "email",
                    "password",
                  ].includes(key),
              )
              .map(([key, values]) => (
                <p key={key}>{values.join(" ")}</p>
              ))}
          </div>
        )}
        <button
          className="button button-primary full"
          disabled={busy || auth.status === "loading"}
        >
          {busy ? "Đang xử lý..." : register ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
      <p className="auth-switch">
        {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Đăng nhập" : "Đăng ký miễn phí"}
        </Link>
      </p>
    </div>
  );
}
