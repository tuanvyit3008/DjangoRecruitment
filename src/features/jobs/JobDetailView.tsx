import Link from "next/link";
import { MapPin, BriefcaseBusiness, Clock3 } from "lucide-react";
import type { Job } from "../../types";
export function JobDetailView({ job }: { job: Job }) {
  return (
    <div className="detail-grid">
      <article className="detail-main">
        <div className="detail-head">
          <div className="job-logo large">{job.company.slice(0, 1) || "P"}</div>
          <div>
            <h1>{job.title}</h1>
            {job.company && <p className="company">{job.company}</p>}
            <div className="meta">
              {job.location && (
                <span>
                  <MapPin size={15} />
                  {job.location}
                </span>
              )}
              {job.employmentType && (
                <span>
                  <BriefcaseBusiness size={15} />
                  {job.employmentType}
                </span>
              )}
              {job.experience && (
                <span>
                  <Clock3 size={15} />
                  {job.experience}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="content-block">
          <h2>Mô tả công việc</h2>
          <p className="pre-line">
            {job.description || "Nhà tuyển dụng chưa cung cấp mô tả."}
          </p>
          {job.requirements && (
            <>
              <h2>Yêu cầu</h2>
              <p className="pre-line">{job.requirements}</p>
            </>
          )}
          {job.benefits && (
            <>
              <h2>Quyền lợi</h2>
              <p className="pre-line">{job.benefits}</p>
            </>
          )}
        </div>
      </article>
      <aside className="apply-card">
        <h3>Thông tin tuyển dụng</h3>
        <div className="job-facts">
          {job.salary && (
            <div>
              <span>Mức lương</span>
              <b>{job.salary}</b>
            </div>
          )}
          {job.location && (
            <div>
              <span>Địa điểm</span>
              <b>{job.location}</b>
            </div>
          )}
        </div>
        <p>Chức năng nộp và lưu hồ sơ hiện chưa khả dụng.</p>
        <Link href="/account" className="button button-primary full">
          Xem tài khoản
        </Link>
      </aside>
    </div>
  );
}
