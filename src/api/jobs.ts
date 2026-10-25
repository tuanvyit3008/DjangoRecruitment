import { ApiError, isRecord } from "./errors";
import { send } from "./transport";
import { serverBaseUrl } from "./config";
import type { Job } from "../types";
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
export type JobFilters = {
  search?: string;
  location?: string;
  category?: string;
  employment_type?: string;
  salary_min?: string;
  salary_max?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};

// Provisional mapping retained from the Vite frontend. Mandatory fields are
// validated; optional fields are omitted rather than fabricated.
function optionalText(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  if (input[field] === undefined || input[field] === null) return undefined;
  if (typeof input[field] !== "string")
    throw new ApiError(`Job.${field} không khớp contract dự kiến.`, "contract");
  return input[field];
}
export function mapJob(input: unknown): Job {
  if (
    !isRecord(input) ||
    !["string", "number"].includes(typeof input.id) ||
    typeof input.title !== "string" ||
    !input.title.trim()
  )
    throw new ApiError(
      "Job thiếu id/title hợp lệ theo contract dự kiến.",
      "contract",
    );
  let company = optionalText(input, "company_name");
  if (!company && typeof input.company === "string") company = input.company;
  if (!company && isRecord(input.company))
    company = optionalText(input.company, "name");
  if (
    input.tags !== undefined &&
    (!Array.isArray(input.tags) ||
      !input.tags.every((t) => typeof t === "string"))
  )
    throw new ApiError("Job.tags không khớp contract dự kiến.", "contract");
  return {
    id: input.id as string | number,
    title: input.title,
    company: company ?? "",
    location: optionalText(input, "location") ?? "",
    employmentType: optionalText(input, "employment_type") ?? "",
    experience: optionalText(input, "experience_level") ?? "",
    description: optionalText(input, "description") ?? "",
    salary: optionalText(input, "salary"),
    tags: Array.isArray(input.tags) ? input.tags : [],
    postedAt: optionalText(input, "created_at") ?? "",
    requirements: optionalText(input, "requirements"),
    benefits: optionalText(input, "benefits"),
  };
}
export function parseJobsPage(data: unknown): Paginated<Job> {
  if (
    !isRecord(data) ||
    typeof data.count !== "number" ||
    !Number.isInteger(data.count) ||
    data.count < 0 ||
    !Array.isArray(data.results) ||
    !(data.next === null || typeof data.next === "string") ||
    !(data.previous === null || typeof data.previous === "string")
  )
    throw new ApiError(
      "API jobs không khớp pagination dự kiến {count, next, previous, results}. Cần đối chiếu OpenAPI.",
      "contract",
    );
  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results: data.results.map(mapJob),
  };
}
export function jobsQuery(filters: JobFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.toString();
}
export async function getJobs(
  filters: JobFilters = {},
): Promise<Paginated<Job>> {
  return parseJobsPage(
    await send(serverBaseUrl(), `/jobs/?${jobsQuery(filters)}`),
  );
}
export async function getJob(id: string): Promise<Job> {
  return mapJob(
    await send(serverBaseUrl(), `/jobs/${encodeURIComponent(id)}/`),
  );
}
