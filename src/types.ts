// Public Job view model. Field mapping remains provisional until Django schema
// is supplied; missing optional values must not become fabricated business data.
export type Job = {
  id: string | number;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  experience: string;
  salary?: string;
  description: string;
  tags: string[];
  postedAt: string;
  requirements?: string;
  benefits?: string;
  featured?: boolean;
};
export type { UserRole } from "./api/auth";
