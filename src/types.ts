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
  featured?: boolean;
};
export type UserRole = 'candidate' | 'recruiter' | 'admin';
