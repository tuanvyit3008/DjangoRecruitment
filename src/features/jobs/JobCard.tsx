import Link from "next/link";
import { MapPin, BriefcaseBusiness } from "lucide-react";
import type { Job } from "../../types";
export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="job-card">
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
