import Link from "next/link";
export function ApiFeedback({ message }: { message: string }) {
  return (
    <div className="error-notice" role="alert">
      <p>{message}</p>
      <p>
        Vui lòng thử lại hoặc liên hệ nhóm quản lý Backend nếu lỗi tiếp diễn.
      </p>
      <Link href="/jobs" className="text-link">
        Quay lại tìm việc
      </Link>
    </div>
  );
}
export function EmptyJobs() {
  return (
    <div className="empty">
      <h3>Chưa có việc làm phù hợp</h3>
      <p>Hãy thử từ khóa hoặc địa điểm khác.</p>
    </div>
  );
}
