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
  adminAssessments: '/admin/assessments',
  adminAssessmentsNew: '/admin/assessments/new',
  adminAssessmentEdit: '/admin/assessments/:assessmentId/edit',
  adminAssessmentAssign: '/admin/assessments/:assessmentId/assign',
  adminOfferLetters: '/admin/offer-letters',
  adminOfferLettersNew: '/admin/offer-letters/new',
  adminOfferLetterDetail: '/admin/offer-letters/:offerId',
  adminOfferLetterEdit: '/admin/offer-letters/:offerId/edit',
  adminOnboarding: '/admin/onboarding',
  adminOnboardingDetail: '/admin/onboarding/:onboardingId',
  adminInterviews: '/admin/interviews',
  adminInterviewShortlist: '/admin/interviews/shortlist',
  adminInterviewSchedule: '/admin/interviews/schedule',
  adminInterviewScheduled: '/admin/interviews/scheduled',
  adminInterviewDetail: '/admin/interviews/:interviewId',
  adminAnalytics: '/admin/analytics',
  adminProfile: '/admin/profile',
  adminJobsNew: '/admin/jobs/new',
  userDashboard: '/user/dashboard',
  userProfile: '/user/profile',
  candidateJobs: '/user/jobs',
  candidateCompanyJobs: '/user/jobs/:companySlug',
  candidateJobDetail: '/user/jobs/:companySlug/:jobId',
  candidateJobApply: '/user/jobs/:companySlug/:jobId/apply',
  candidateAssessments: '/user/assessments',
  candidateAssessmentDetail: '/user/assessments/:inviteToken',
  candidateOfferLetters: '/user/offer-letters',
  candidateOnboarding: '/user/onboarding',
} as const

export const dashboardPathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminJobsNew,
  candidate: appRoutes.candidateJobs,
}

export const profilePathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminProfile,
  candidate: appRoutes.userProfile,
}
