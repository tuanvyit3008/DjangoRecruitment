import Link from "next/link";
import { Suspense } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { JobSearchForm } from "../features/jobs/JobSearchForm";
import { LatestJobs } from "../features/jobs/LatestJobs";
export const dynamic = "force-dynamic";
export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <div className="eyebrow">
            <Sparkles size={16} />
            Cơ hội mới đang chờ bạn
          </div>
          <h1>
            Tìm công việc
            <br />
            <span>đúng với bạn.</span>
          </h1>
          <p className="hero-subtitle">
            Khám phá việc làm và bắt đầu hành trình sự nghiệp cùng PTIT
            CareerHub.
          </p>
          <JobSearchForm />
        </div>
        <div className="hero-glow" />
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow muted">Cơ hội dành cho bạn</div>
              <h2>Việc làm mới nhất</h2>
            </div>
            <Link href="/jobs" className="text-link">
              Xem tất cả <ArrowRight size={17} />
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="empty" role="status">
                Đang tải việc làm...
              </div>
            }
          >
            <LatestJobs />
          </Suspense>
        </div>
      </section>
      <section className="cta-section">
        <div className="container cta">
          <div>
            <div className="eyebrow">Dành cho nhà tuyển dụng</div>
            <h2>
              Tìm đúng người.
              <br />
              Xây đúng đội ngũ.
            </h2>
            <p>Kết nối với cộng đồng tài năng PTIT.</p>
            <Link
              href="/register?role=EMPLOYER"
              className="button button-light"
            >
              Đăng ký nhà tuyển dụng <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
