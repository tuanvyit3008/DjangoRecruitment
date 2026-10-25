"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthProvider";
import type { UserRole } from "../../api/auth";
export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (auth.status === "anonymous")
      router.replace(
        `/login?next=${encodeURIComponent(pathname ?? "/account")}`,
      );
  }, [auth.status, pathname, router]);
  if (auth.status === "loading")
    return (
      <div className="empty" role="status">
        Đang xác minh phiên...
      </div>
    );
  if (auth.status === "error")
    return (
      <div className="error-notice" role="alert">
        <p>{auth.error}</p>
        <button
          className="button button-outline"
          onClick={() => void auth.restore()}
        >
          Thử xác minh lại
        </button>
      </div>
    );
  if (auth.status !== "authenticated")
    return (
      <div className="empty" role="status">
        Đang chuyển tới đăng nhập...
      </div>
    );
  if (roles && (!auth.user || !roles.includes(auth.user.role)))
    return (
      <div className="error-notice" role="alert">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  return children;
}
