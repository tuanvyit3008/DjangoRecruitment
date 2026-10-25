import Link from "next/link";
import { jobsQuery, type JobFilters } from "../../api/jobs";
export function JobPagination({
  filters,
  next,
  previous,
  count,
}: {
  filters: JobFilters;
  next: string | null;
  previous: string | null;
  count: number;
}) {
  const page = filters.page ?? 1;
  return (
    <nav className="pagination" aria-label="Phân trang việc làm">
      {previous && page > 1 ? (
        <Link
          href={`/jobs?${jobsQuery({ ...filters, page: page - 1 })}`}
          className="button button-outline"
        >
          Trang trước
        </Link>
      ) : (
        <span />
      )}
      <span>
        Trang {page} · {count} việc làm
      </span>
      {next ? (
        <Link
          href={`/jobs?${jobsQuery({ ...filters, page: page + 1 })}`}
          className="button button-outline"
        >
          Trang sau
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
