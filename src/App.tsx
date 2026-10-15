import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  Menu,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { sampleJobs } from "./data";
import type { Job } from "./types";
import { isApiConfigured, login, register as registerUser } from "./api/client";
import { getJob, getJobs } from "./api/jobs";
import "./styles/global.css";

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="container nav">
        <Link to="/" className="brand">
          <span className="brand-mark">P</span>
          <span>
            PTIT <b>CareerHub</b>
          </span>
        </Link>
        <button
          className="menu-button"
          aria-label="Mở menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "nav-links open" : "nav-links"}>
          <Link to="/jobs" onClick={() => setOpen(false)}>
            Tìm việc
          </Link>
          <a href="#companies">Công ty</a>
          <a href="#about">Về chúng tôi</a>
          <span className="nav-divider" />
          <Link to="/login" className="login-link">
            Đăng nhập
          </Link>
          <Link to="/register" className="button button-primary small">
            Đăng ký miễn phí
          </Link>
        </nav>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">P</span>
            <span>
              PTIT <b>CareerHub</b>
            </span>
          </div>
          <p>
            Nền tảng kết nối tài năng trẻ PTIT với những cơ hội nghề nghiệp tốt
            nhất.
          </p>
        </div>
        <div>
          <h4>Dành cho ứng viên</h4>
          <Link to="/jobs">Tìm việc làm</Link>
          <Link to="/register">Tạo hồ sơ</Link>
          <a href="#tips">Cẩm nang nghề nghiệp</a>
        </div>
        <div>
          <h4>Dành cho nhà tuyển dụng</h4>
          <a href="#post">Đăng tin tuyển dụng</a>
          <a href="#talent">Tìm kiếm ứng viên</a>
          <a href="#pricing">Bảng giá dịch vụ</a>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <p>support@ptitcareerhub.vn</p>
          <p>Hà Nội, Việt Nam</p>
        </div>
      </div>
      <div className="container copyright">
        © 2025 PTIT CareerHub · Được xây dựng bởi sinh viên PTIT
      </div>
    </footer>
  );
}
function SearchBar({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/jobs?q=${encodeURIComponent(q)}`);
      }}
    >
      <Search size={20} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chức danh, kỹ năng hoặc từ khóa..."
        aria-label="Tìm kiếm việc làm"
      />
      <span className="search-divider" />
      <MapPin size={19} />
      <input
        className="location-input"
        placeholder="Địa điểm"
        aria-label="Địa điểm"
      />
      <button className="button button-primary" type="submit">
        Tìm việc
      </button>
    </form>
  );
}
function JobCard({ job }: { job: Job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className="job-logo">{job.company.slice(0, 1)}</div>
      <div className="job-card-body">
        <div className="job-title-row">
          <h3>{job.title}</h3>
          {job.featured && <span className="badge featured">Nổi bật</span>}
        </div>
        <p className="company">{job.company}</p>
        <div className="meta">
          <span>
            <MapPin size={15} />
            {job.location}
          </span>
          <span>
            <BriefcaseBusiness size={15} />
            {job.employmentType}
          </span>
        </div>
        <div className="tags">
          {job.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      <div className="job-time">{job.postedAt}</div>
    </Link>
  );
}
function Home() {
  const [featured, setFeatured] = useState<Job[]>(
    isApiConfigured ? [] : sampleJobs.filter((j) => j.featured),
  );
  const [apiError, setApiError] = useState("");
  useEffect(() => {
    if (!isApiConfigured) return;
    getJobs({ page_size: 4, ordering: "-created_at" })
      .then((page) => setFeatured(page.results.slice(0, 4)))
      .catch((error: Error) => setApiError(error.message));
  }, []);
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-content">
            <div className="eyebrow">
              <Sparkles size={16} /> Cơ hội mới đang chờ bạn
            </div>
            <h1>
              Tìm công việc
              <br />
              <span>đúng với bạn.</span>
            </h1>
            <p className="hero-subtitle">
              Khám phá hàng nghìn cơ hội việc làm chất lượng từ các doanh nghiệp
              hàng đầu. Bắt đầu hành trình sự nghiệp của bạn ngay hôm nay.
            </p>
            <SearchBar />
            <div className="hero-stats">
              <div>
                <strong>2,500+</strong>
                <span>Việc làm đang tuyển</span>
              </div>
              <div>
                <strong>800+</strong>
                <span>Doanh nghiệp uy tín</span>
              </div>
              <div>
                <strong>15,000+</strong>
                <span>Ứng viên đã kết nối</span>
              </div>
            </div>
          </div>
          <div className="hero-glow" />
        </section>
        <section className="section" id="jobs">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="eyebrow muted">Cơ hội dành cho bạn</div>
                <h2>Việc làm nổi bật</h2>
              </div>
              <Link className="text-link" to="/jobs">
                Xem tất cả việc làm <ArrowRight size={17} />
              </Link>
            </div>
            {!isApiConfigured && <div className="demo-notice">Dữ liệu demo — chưa kết nối Backend.</div>}
            {apiError && <div className="error-notice">Không thể tải việc làm từ Backend: {apiError}</div>}
            <div className="jobs-grid">
              {featured.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </section>
        <section className="trust-section" id="companies">
          <div className="container trust">
            <div>
              <div className="eyebrow muted">Được tin dùng bởi</div>
              <h2>Những nơi tài năng PTIT đang tỏa sáng</h2>
            </div>
            <div className="company-logos">
              <span>viettel</span>
              <span>VNG</span>
              <span>
                mo<span className="logo-red">mo</span>
              </span>
              <span>
                FPT <i>Software</i>
              </span>
              <span>Vingroup</span>
            </div>
          </div>
        </section>
        <section className="cta-section" id="about">
          <div className="container cta">
            <div>
              <div className="eyebrow">Dành cho nhà tuyển dụng</div>
              <h2>
                Tìm đúng người.
                <br />
                Xây đúng đội ngũ.
              </h2>
              <p>
                Tiếp cận cộng đồng tài năng trẻ PTIT năng động và sẵn sàng tạo
                ra khác biệt.
              </p>
              <a href="#post" className="button button-light">
                Đăng tin tuyển dụng <ArrowRight size={17} />
              </a>
            </div>
            <div className="cta-art">
              <div className="art-card">
                <Users size={25} />
                <strong>15,000+</strong>
                <span>ứng viên tiềm năng</span>
              </div>
              <div className="art-card offset">
                <CheckCircle2 size={22} />
                <strong>98%</strong>
                <span>hài lòng doanh nghiệp</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
function JobsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const [type, setType] = useState("Tất cả");
  const [apiJobs, setApiJobs] = useState<Job[] | null>(null);
  const [apiError, setApiError] = useState("");
  useEffect(() => {
    if (!isApiConfigured) return;
    getJobs({ search: q || undefined, employment_type: type === "Tất cả" ? undefined : type, page: Number(params.get("page") ?? 1), page_size: 10 })
      .then((page) => setApiJobs(page.results))
      .catch((error: Error) => setApiError(error.message));
  }, [q, type, params]);
  const filtered = useMemo(
    () =>
      (isApiConfigured ? apiJobs ?? [] : sampleJobs).filter(
        (j) =>
          (!q ||
            `${j.title} ${j.company} ${j.tags.join(" ")}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (type === "Tất cả" || j.employmentType === type),
      ),
    [q, type, apiJobs],
  );
  return (
    <>
      <Header />
      <main className="page">
        <div className="container">
          <div className="page-intro">
            <div>
              <div className="eyebrow muted">Khám phá cơ hội</div>
              <h1>Việc làm phù hợp với bạn</h1>
              <p>{filtered.length} vị trí đang tuyển dụng</p>
            </div>
          </div>
          {!isApiConfigured && <div className="demo-notice">Dữ liệu demo — chưa kết nối Backend.</div>}
          {apiError && <div className="error-notice">Không thể tải danh sách từ Backend: {apiError}</div>}
          <form
            className="listing-search"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(search ? { q: search } : {});
            }}
          >
            <Search size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo chức danh, công ty hoặc kỹ năng"
            />
            <button className="button button-primary">Tìm kiếm</button>
          </form>
          <div className="listing-layout">
            <aside className="filters">
              <h3>Bộ lọc tìm kiếm</h3>
              <label>
                Loại hình công việc
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Tất cả</option>
                  <option>Toàn thời gian</option>
                  <option>Thực tập</option>
                </select>
              </label>
              <label>
                Khu vực
                <select>
                  <option>Tất cả địa điểm</option>
                  <option>Hà Nội</option>
                  <option>TP. Hồ Chí Minh</option>
                  <option>Đà Nẵng</option>
                </select>
              </label>
              <button
                className="clear-filter"
                onClick={() => {
                  setType("Tất cả");
                  setSearch("");
                  setParams({});
                }}
              >
                Xóa bộ lọc
              </button>
            </aside>
            <div className="results">
              <div className="results-header">
                <span>
                  Sắp xếp: <b>Mới nhất</b> <ChevronDown size={15} />
                </span>
              </div>
              {filtered.length ? (
                filtered.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                <div className="empty">
                  <Search size={32} />
                  <h3>Không tìm thấy việc làm</h3>
                  <p>Hãy thử từ khóa hoặc bộ lọc khác.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
function JobDetail() {
  const { id } = useParams();
  const localJob = sampleJobs.find((j) => String(j.id) === id) ?? sampleJobs[0];
  const [job, setJob] = useState<Job | null>(isApiConfigured ? null : localJob);
  const [apiError, setApiError] = useState("");
  useEffect(() => {
    if (!isApiConfigured || !id) return;
    getJob(id).then(setJob).catch((error: Error) => setApiError(error.message));
  }, [id]);
  const [applied, setApplied] = useState(false);
  if (!job && !apiError) {
    return <><Header /><main className="page"><div className="container"><div className="empty"><h3>Đang tải việc làm...</h3></div></div></main><Footer /></>;
  }
  return (
    <>
      <Header />
      <main className="page detail-page">
        <div className="container">
          <Link to="/jobs" className="back-link">
            ← Quay lại danh sách việc làm
          </Link>
          {!isApiConfigured && <div className="demo-notice">Dữ liệu demo — chưa kết nối Backend.</div>}
          {apiError && <div className="error-notice">Không thể tải chi tiết việc làm từ Backend: {apiError}</div>}
          <div className="detail-grid">
            <article className="detail-main">
              <div className="detail-head">
                <div className="job-logo large">{job?.company.slice(0, 1)}</div>
                <div>
                  <h1>{job?.title}</h1>
                  <p className="company">
                    {job?.company} · <span>{job?.location}</span>
                  </p>
                  <div className="meta">
                    <span>
                      <BriefcaseBusiness size={15} />
                      {job?.employmentType}
                    </span>
                    <span>
                      <Clock3 size={15} />
                      {job?.experience}
                    </span>
                  </div>
                </div>
              </div>
              <div className="content-block">
                <h2>Mô tả công việc</h2>
                <p>{job?.description}</p>
                <p>
                  Tham gia cùng đội ngũ để giải quyết các bài toán thực tế, viết
                  code chất lượng và liên tục cải thiện trải nghiệm người dùng.
                </p>
                <h2>Yêu cầu</h2>
                <ul>
                  <li>
                    Nắm vững kiến thức nền tảng và tư duy giải quyết vấn đề.
                  </li>
                  <li>Có tinh thần học hỏi, chủ động và làm việc nhóm tốt.</li>
                  <li>
                    Ưu tiên ứng viên có dự án cá nhân hoặc kinh nghiệm liên
                    quan.
                  </li>
                </ul>
                <h2>Quyền lợi</h2>
                <ul>
                  <li>Môi trường trẻ, minh bạch và tôn trọng sự phát triển.</li>
                  <li>Được mentoring bởi các chuyên gia trong ngành.</li>
                  <li>Chế độ đãi ngộ cạnh tranh và linh hoạt.</li>
                </ul>
              </div>
            </article>
            <aside className="apply-card">
              <h3>Sẵn sàng ứng tuyển?</h3>
              <p>Hãy để nhà tuyển dụng biết bạn quan tâm đến vị trí này.</p>
              {applied ? (
                <div className="success-message">
                  <CheckCircle2 size={21} /> Đã ghi nhận quan tâm. Hãy đăng nhập
                  để nộp hồ sơ.
                </div>
              ) : (
                <button
                  className="button button-primary full"
                  onClick={() => setApplied(true)}
                >
                  Ứng tuyển ngay <ArrowRight size={17} />
                </button>
              )}
              <button className="button button-outline full">
                Lưu việc làm
              </button>
              <div className="job-facts">
                <div>
                  <span>Mức lương</span>
                    <b>{job?.salary ?? "Thỏa thuận"}</b>
                </div>
                <div>
                  <span>Đăng tuyển</span>
                    <b>{job?.postedAt}</b>
                </div>
                <div>
                  <span>Địa điểm</span>
                    <b>{job?.location}</b>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
function Auth({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-mark">P</div>
          <h1>{register ? "Tạo tài khoản mới" : "Chào mừng trở lại"}</h1>
          <p>
            {register
              ? "Bắt đầu hành trình sự nghiệp cùng PTIT CareerHub."
              : "Đăng nhập để tiếp tục khám phá cơ hội của bạn."}
          </p>
          <form onSubmit={async (e) => {
            e.preventDefault(); setError(""); setLoading(true);
            try {
              const data = new FormData(e.currentTarget);
              if (register) {
                const result = await registerUser({
                  email: String(data.get("email") ?? ""),
                  password: String(data.get("password") ?? ""),
                  first_name: String(data.get("first_name") ?? ""),
                  last_name: String(data.get("last_name") ?? ""),
                  role: "CANDIDATE",
                });
                if (result.tokens) navigate("/");
                else setError("Đăng ký thành công. Hãy đăng nhập để tiếp tục.");
              } else {
                await login({ email: String(data.get("email")), password: String(data.get("password")) });
                navigate("/");
              }
            } catch (err) { setError((err as Error).message); }
            finally { setLoading(false); }
          }}>
            {register && (
              <>
                <label>
                  Tên
                  <input name="first_name" required placeholder="An" />
                </label>
                <label>
                  Họ
                  <input name="last_name" required placeholder="Nguyễn" />
                </label>
              </>
            )}
            <label>
              Email
              <input name="email" type="email" required placeholder="you@example.com" />
            </label>
            <label>
              Mật khẩu
              <input name="password" type="password" required placeholder="••••••••" />
            </label>
            {error && <div className="error-notice">{error}</div>}
            {!isApiConfigured && <div className="demo-notice">API chưa cấu hình — thao tác xác thực không giả lập.</div>}
            <button disabled={loading || !isApiConfigured} className="button button-primary full">
              {loading ? "Đang xử lý..." : register ? "Tạo tài khoản" : "Đăng nhập"}
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Đăng nhập" : "Đăng ký miễn phí"}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth register />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
