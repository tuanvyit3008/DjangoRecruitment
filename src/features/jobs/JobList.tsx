import { JobCard } from "./JobCard";
import { EmptyJobs } from "../../components/feedback/ApiFeedback";
import type { Job } from "../../types";
export function JobList({
  jobs,
  grid = false,
}: {
  jobs: Job[];
  grid?: boolean;
}) {
  return jobs.length ? (
    <div className={grid ? "jobs-grid" : "results"}>
      {jobs.map((job) => (
        <JobCard job={job} key={job.id} />
      ))}
    </div>
  ) : (
    <EmptyJobs />
  );
}
