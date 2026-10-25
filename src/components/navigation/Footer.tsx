import Link from "next/link";
export function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand footer-brand">
            <span className="brand-mark">P</span>
            <span>
              PTIT <b>CareerHub</b>
            </span>
          </Link>
          <p>Kết nối ứng viên PTIT với cơ hội nghề nghiệp.</p>
        </div>
        <div>
          <h4>Dành cho ứng viên</h4>
          <Link href="/jobs">Tìm việc làm</Link>
          <Link href="/register">Tạo tài khoản</Link>
        </div>
        <div>
          <h4>Dành cho nhà tuyển dụng</h4>
          <Link href="/register?role=EMPLOYER">Đăng ký nhà tuyển dụng</Link>
          <Link href="/login">Đăng nhập</Link>
        </div>
        <div>
          <h4>Thông tin</h4>
          <Link href="/account">Tài khoản của bạn</Link>
        </div>
      </div>
      <div className="container copyright">
        © {new Date().getFullYear()} PTIT CareerHub
      </div>
    </footer>
  );
}
