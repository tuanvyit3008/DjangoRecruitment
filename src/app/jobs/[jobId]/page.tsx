import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "../../../api/jobs";
import { ApiError } from "../../../api/errors";
import { ApiFeedback } from "../../../components/feedback/ApiFeedback";
import { JobDetailView } from "../../../features/jobs/JobDetailView";
export const dynamic = "force-dynamic";
export const metadata = { title: "Chi tiết việc làm" };
export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  let job;
  let error = "";
  try {
    job = await getJob(jobId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    error =
      err instanceof Error ? err.message : "Không thể tải chi tiết việc làm.";
  }
  return (
    <main className="page detail-page">
      <div className="container">
        <Link href="/jobs" className="back-link">
          ← Quay lại danh sách việc làm
        </Link>
        {error ? (
          <ApiFeedback message={error} />
        ) : (
          job && <JobDetailView job={job} />
        )}
      </div>
    </main>
  );
}
