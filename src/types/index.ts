// ─── User & Auth ────────────────────────────────────────────────────────────

// 'candidate' is shown to users as "Job Finder".
export type UserRole = 'recruiter' | 'candidate';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company_name: string | null; // recruiters only
  job_title: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobType = 'technical' | 'non_technical';

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  company_name: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  salary_range: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'interview'
  | 'rejected'
  | 'hired';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  job?: Job | null;
  candidate?: Profile | null;
  cover_note: string | null;
  resume_url: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Welcome: undefined;
  Login: { role: UserRole };
  Signup: { role: UserRole };
  ForgotPassword: undefined;
};

export type RecruiterJobsStackParamList = {
  MyJobs: undefined;
  JobForm: { jobId?: string };
  Applicants: { jobId: string; jobTitle: string };
  ApplicantDetail: { applicationId: string };
  Chat: { applicationId: string; title: string };
};

export type CandidateJobsStackParamList = {
  JobListings: undefined;
  JobDetail: { jobId: string };
  Apply: { jobId: string; jobTitle: string };
};

export type CandidateApplicationsStackParamList = {
  MyApplications: undefined;
  Chat: { applicationId: string; title: string };
};

export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: { applicationId: string; title: string };
};

export type RecruiterTabParamList = {
  Dashboard: undefined;
  RecruiterJobs: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type CandidateTabParamList = {
  FindJobs: undefined;
  Applications: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
