import type { Metadata } from "next";
import { AuthProvider } from "../auth/AuthProvider";
import { Header } from "../components/navigation/Header";
import { Footer } from "../components/navigation/Footer";
import { ThemeProvider } from "../theme/ThemeProvider";
import { THEME_BOOTSTRAP } from "../theme/theme";
import "../styles/global.css";
export const metadata: Metadata = {
  title: { default: "PTIT CareerHub", template: "%s | PTIT CareerHub" },
  description: "Kết nối ứng viên PTIT với cơ hội nghề nghiệp.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Only the root theme attribute differs: the head script sets it before hydration.
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          id="theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <a className="skip-link" href="#main-content">
              Đi đến nội dung
            </a>
            <Header />
            <div id="main-content">{children}</div>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
