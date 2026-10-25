"use client";
import { useAuth } from "../../auth/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
export function AccountView() {
  const { user } = useAuth();
  return (
    <ProtectedRoute roles={["CANDIDATE", "EMPLOYER", "ADMIN"]}>
      <article className="detail-main">
        <h1>Tài khoản của bạn</h1>
        <p>Thông tin tài khoản được xác minh từ Backend.</p>
        <dl>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
          <dt>Họ và tên</dt>
          <dd>
            {[user?.last_name, user?.first_name].filter(Boolean).join(" ") ||
              "Chưa cập nhật"}
          </dd>
          <dt>Vai trò</dt>
          <dd>
            {user?.role === "CANDIDATE"
              ? "Ứng viên"
              : user?.role === "EMPLOYER"
                ? "Nhà tuyển dụng"
                : "Quản trị viên"}
          </dd>
        </dl>
      </article>
    </ProtectedRoute>
  );
}
