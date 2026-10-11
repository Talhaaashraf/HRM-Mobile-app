import { ApplicationStatus, JobType, UserRole } from '../types';
import { Colors } from '../constants/tokens';

export function roleLabel(role: UserRole) {
  return role === 'recruiter' ? 'Recruiter' : 'Job Finder';
}

/** Accent colour for each login panel. */
export function roleColors(role: UserRole) {
  return role === 'recruiter'
    ? { main: Colors.primary, light: Colors.primaryLight }
    : { main: Colors.success, light: Colors.successLight };
}

export function jobTypeLabel(type: JobType) {
  return type === 'technical' ? 'Technical' : 'Non-technical';
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'applied',
  'under_review',
  'interview',
  'hired',
  'rejected',
];

export function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case 'applied':
      return 'Applied';
    case 'under_review':
      return 'Under review';
    case 'interview':
      return 'Interview';
    case 'hired':
      return 'Hired';
    case 'rejected':
      return 'Rejected';
  }
}

export function statusColors(status: ApplicationStatus) {
  switch (status) {
    case 'applied':
      return { fg: Colors.textSecondary, bg: Colors.surfaceAlt };
    case 'under_review':
      return { fg: Colors.info, bg: Colors.infoLight };
    case 'interview':
      return { fg: Colors.warning, bg: Colors.warningLight };
    case 'hired':
      return { fg: Colors.success, bg: Colors.successLight };
    case 'rejected':
      return { fg: Colors.error, bg: Colors.errorLight };
  }
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function initial(name: string | null | undefined) {
  return (name?.trim().charAt(0) || '?').toUpperCase();
}
