import { JobList } from "./JobList";
import { ApiFeedback } from "../../components/feedback/ApiFeedback";
import { getJobs } from "../../api/jobs";
export async function LatestJobs() {
  let page;
  try {
    page = await getJobs({ page_size: 4 });
  } catch (error) {
    return (
      <ApiFeedback
        message={
          error instanceof Error ? error.message : "Không thể tải việc làm."
        }
      />
    );
  }
  return <JobList jobs={page.results} grid />;
}
