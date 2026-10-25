import Link from "next/link";
import { getJobs, type JobFilters } from "../../api/jobs";
import { JobSearchForm } from "../../features/jobs/JobSearchForm";
import { JobList } from "../../features/jobs/JobList";
import { JobPagination } from "../../features/jobs/JobPagination";
import { ApiFeedback } from "../../components/feedback/ApiFeedback";
export const dynamic = "force-dynamic";
export const metadata = { title: "Tìm việc làm" };
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const text = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;
  const rawPage = Number(text("page") ?? 1);
  const filters: JobFilters = {
    search: text("search") ?? text("q"),
    location: text("location"),
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    page_size: 10,
  };
  let page;
  let error = "";
  try {
    page = await getJobs(filters);
  } catch (err) {
    error = err instanceof Error ? err.message : "Không thể tải việc làm.";
  }
  return (
    <main className="page">
      <div className="container">
        <div className="page-intro">
          <div className="eyebrow muted">Khám phá cơ hội</div>
          <h1>Việc làm phù hợp với bạn</h1>
          {page && <p>{page.count} vị trí đang tuyển dụng</p>}
        </div>
        <JobSearchForm
          search={filters.search}
          location={filters.location}
          compact
        />
        <div className="listing-layout">
          <aside className="filters">
            <h3>Bộ lọc tìm kiếm</h3>
            <p className="filter-help">
              Tìm theo từ khóa và địa điểm bằng thanh tìm kiếm.
            </p>
            <Link href="/jobs" className="clear-filter">
              Xóa bộ lọc
            </Link>
          </aside>
          <div className="results">
            {error ? (
              <ApiFeedback message={error} />
            ) : (
              page && (
                <>
                  <JobList jobs={page.results} />
                  <JobPagination
                    filters={filters}
                    next={page.next}
                    previous={page.previous}
                    count={page.count}
                  />
                </>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
