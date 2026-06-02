import type { UserRole } from '../types/auth'

export const appRoutes = {
  login: '/login',
  signup: '/signup',
  publicCompanyJobs: '/jobs/:companySlug',
  publicJobDetail: '/jobs/:companySlug/j/:jobId',
  adminDashboard: '/admin/dashboard',
  adminHrJobs: '/admin/hr',
  adminHrJobDetail: '/admin/hr/:jobId',
  adminHrJobEdit: '/admin/hr/:jobId/edit',
  adminHrScoring: '/admin/hr/scoring',
  adminHrJobScoring: '/admin/hr/:jobId/scoring',
  adminHrApplicantDetail: '/admin/hr/scoring/applications/:applicationId',
  adminAnalytics: '/admin/analytics',
  adminProfile: '/admin/profile',
  adminJobsNew: '/admin/jobs/new',
  userDashboard: '/user/dashboard',
  userProfile: '/user/profile',
  candidateJobs: '/user/jobs',
  candidateCompanyJobs: '/user/jobs/:companySlug',
  candidateJobDetail: '/user/jobs/:companySlug/:jobId',
  candidateJobApply: '/user/jobs/:companySlug/:jobId/apply',
} as const

export const dashboardPathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminDashboard,
  candidate: appRoutes.userDashboard,
}

export const profilePathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminProfile,
  candidate: appRoutes.userProfile,
}
