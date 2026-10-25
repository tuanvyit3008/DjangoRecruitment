import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page">
      <div className="container empty">
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn hoặc việc làm không tồn tại.</p>
        <Link className="button button-primary" href="/jobs">
          Tìm việc làm
        </Link>
      </div>
    </main>
  );
}
