"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="page">
      <div className="container error-notice" role="alert">
        <h1>Không thể tải trang</h1>
        <p>Vui lòng thử lại sau.</p>
        <button className="button button-primary" onClick={reset}>
          Thử lại
        </button>
      </div>
    </main>
  );
}
