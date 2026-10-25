"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../theme/ThemeToggle";
export function Header() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  async function signOut() {
    setBusy(true);
    setNotice("");
    try {
      await auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setNotice(
        "Đã thoát phiên trên máy này; chưa xác minh thu hồi refresh token trên Backend.",
      );
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="header">
        <div className="container nav">
          <Link href="/" className="brand">
            <span className="brand-mark">P</span>
            <span>
              PTIT <b>CareerHub</b>
            </span>
          </Link>

          <nav
            id="main-navigation"
            aria-label="Điều hướng chính"
            className={open ? "nav-links open" : "nav-links"}
          >
            <Link href="/jobs" onClick={() => setOpen(false)}>
              Tìm việc
            </Link>
            {auth.status === "authenticated" ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)}>
                  {auth.user?.first_name || "Tài khoản"}
                </Link>
                <button
                  className="button button-outline small"
                  disabled={busy}
                  onClick={signOut}
                >
                  {busy ? "Đang thoát..." : "Đăng xuất"}
                </button>
              </>
            ) : auth.status === "loading" ? (
              <span role="status">Đang xác minh phiên...</span>
            ) : (
              <>
                <Link href="/login" className="login-link">
                  Đăng nhập
                </Link>
                <Link href="/register" className="button button-primary small">
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            <button
              className="menu-button"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              aria-controls="main-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {notice && (
        <div className="container">
          <p role="alert" className="demo-notice">
            {notice}
          </p>
        </div>
      )}
    </>
  );
}
