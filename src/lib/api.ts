// All database access lives here. Row Level Security in supabase/schema.sql
// decides what each user can see, so queries don't need extra ownership filters.
import { supabase } from './supabase';
import { Application, ApplicationStatus, Job, JobType, Message, Profile } from '../types';

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

const APPLICATION_SELECT = '*, job:jobs(*), candidate:profiles(*)';

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobWithCount = Job & { applications: { count: number }[] };

export async function listOpenJobs() {
  return unwrap<Job[]>(
    await supabase.from('jobs').select('*').eq('is_active', true).order('created_at', { ascending: false }),
  );
}

export async function listMyJobs(recruiterId: string) {
  return unwrap<JobWithCount[]>(
    await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false }),
  );
}

export async function getJob(id: string) {
  return unwrap<Job>(await supabase.from('jobs').select('*').eq('id', id).single());
}

export interface JobInput {
  title: string;
  company_name: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  salary_range: string | null;
  is_active: boolean;
}

export async function createJob(recruiterId: string, input: JobInput) {
  return unwrap<Job>(
    await supabase.from('jobs').insert({ ...input, recruiter_id: recruiterId }).select().single(),
  );
}

export async function updateJob(id: string, input: Partial<JobInput>) {
  return unwrap<Job>(await supabase.from('jobs').update(input).eq('id', id).select().single());
}

export async function deleteJob(id: string) {
  unwrap(await supabase.from('jobs').delete().eq('id', id));
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function listApplicationsForJob(jobId: string) {
  return unwrap<Application[]>(
    await supabase
      .from('applications')
      .select(APPLICATION_SELECT)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false }),
  );
}

/** Recruiter: applications to their jobs. Candidate: their own applications. */
export async function listMyApplications(limit?: number) {
  let q = supabase.from('applications').select(APPLICATION_SELECT).order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  return unwrap<Application[]>(await q);
}

export async function getApplication(id: string) {
  return unwrap<Application>(
    await supabase.from('applications').select(APPLICATION_SELECT).eq('id', id).single(),
  );
}

export async function getMyApplicationForJob(jobId: string, candidateId: string) {
  return unwrap<Application | null>(
    await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .maybeSingle(),
  );
}

export async function applyToJob(params: {
  jobId: string;
  candidateId: string;
  coverNote: string | null;
  resumePath: string | null;
}) {
  const res = await supabase.from('applications').insert({
    job_id: params.jobId,
    candidate_id: params.candidateId,
    cover_note: params.coverNote,
    resume_url: params.resumePath,
  });
  if (res.error?.code === '23505') throw new Error('You have already applied to this job.');
  unwrap(res);
}

export async function setApplicationStatus(id: string, status: ApplicationStatus) {
  unwrap(await supabase.from('applications').update({ status }).eq('id', id));
}

// ─── Resumes (Supabase Storage, private bucket) ──────────────────────────────

export async function uploadResume(
  candidateId: string,
  file: { uri: string; name: string; mimeType?: string | null },
) {
  const body = await (await fetch(file.uri)).arrayBuffer();
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${candidateId}/${Date.now()}-${safeName}`;
  unwrap(
    await supabase.storage
      .from('resumes')
      .upload(path, body, { contentType: file.mimeType ?? 'application/pdf' }),
  );
  return path;
}

export async function getResumeUrl(path: string) {
  const { signedUrl } = unwrap<{ signedUrl: string }>(
    await supabase.storage.from('resumes').createSignedUrl(path, 60 * 10),
  );
  return signedUrl;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function listMessages(applicationId: string) {
  return unwrap<Message[]>(
    await supabase
      .from('messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true }),
  );
}

export async function sendMessage(applicationId: string, senderId: string, content: string) {
  return unwrap<Message>(
    await supabase
      .from('messages')
      .insert({ application_id: applicationId, sender_id: senderId, content })
      .select()
      .single(),
  );
}

export interface Conversation {
  application: Application;
  lastMessage: Message;
}

/** Applications that have at least one message, newest activity first. */
export async function listConversations() {
  const messages = unwrap<Message[]>(
    await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(500),
  );
  const latest = new Map<string, Message>();
  for (const m of messages) if (!latest.has(m.application_id)) latest.set(m.application_id, m);
  if (latest.size === 0) return [];

  const apps = unwrap<Application[]>(
    await supabase.from('applications').select(APPLICATION_SELECT).in('id', [...latest.keys()]),
  );
  return apps
    .map((application) => ({ application, lastMessage: latest.get(application.id)! }))
    .sort((a, b) => b.lastMessage.created_at.localeCompare(a.lastMessage.created_at));
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function updateProfile(
  id: string,
  input: Partial<Pick<Profile, 'full_name' | 'company_name' | 'job_title' | 'phone'>>,
) {
  unwrap(await supabase.from('profiles').update(input).eq('id', id));
}

export async function changePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}
