import type { JSX } from 'react'
import { Route, Routes } from 'react-router-dom'
import { appRoutes } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import { ProtectedRoute, PublicRoute, HomeRedirect } from '../components/routing'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage'
import { AdminProfilePage } from '../pages/admin/AdminProfilePage'
import { AdminJobCreatePage } from '../pages/admin/AdminJobCreatePage'
import { AdminHrJobsPage } from '../pages/admin/AdminHrJobsPage'
import { AdminHrJobDetailPage } from '../pages/admin/AdminHrJobDetailPage'
import { AdminHrJobEditPage } from '../pages/admin/AdminHrJobEditPage'
import { CandidateDashboardPage } from '../pages/candidate/CandidateDashboardPage'
import { CandidateProfilePage } from '../pages/candidate/CandidateProfilePage'
import { CandidateCompanyJobsPage } from '../pages/candidate/CandidateCompanyJobsPage'
import { CandidateJobDetailPage } from '../pages/candidate/CandidateJobDetailPage'
import { CandidateJobApplyPage } from '../pages/candidate/CandidateJobApplyPage'
import { PublicCompanyJobsPage } from '../pages/public/PublicCompanyJobsPage'
import { PublicJobDetailPage } from '../pages/public/PublicJobDetailPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { SignupPage } from '../pages/auth/SignupPage'
import { NotFoundPage } from '../pages/NotFoundPage'

function RootRedirect(): JSX.Element {
  return <HomeRedirect />
}

export function AppRoutes(): JSX.Element {
  const { isHydrated } = useAuth()

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 shadow-sm">
          Loading workspace...
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path={appRoutes.publicCompanyJobs} element={<PublicCompanyJobsPage />} />
      <Route path={appRoutes.publicJobDetail} element={<PublicJobDetailPage />} />

      <Route element={<PublicRoute />}>
        <Route path={appRoutes.login} element={<LoginPage />} />
        <Route path={appRoutes.signup} element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path={appRoutes.adminDashboard} element={<AdminDashboardPage />} />
        <Route path={appRoutes.adminHrJobs} element={<AdminHrJobsPage />} />
        <Route path={appRoutes.adminHrJobDetail} element={<AdminHrJobDetailPage />} />
        <Route path={appRoutes.adminHrJobEdit} element={<AdminHrJobEditPage />} />
        <Route path={appRoutes.adminAnalytics} element={<AdminAnalyticsPage />} />
        <Route path={appRoutes.adminProfile} element={<AdminProfilePage />} />
        <Route path={appRoutes.adminJobsNew} element={<AdminJobCreatePage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
        <Route path={appRoutes.userDashboard} element={<CandidateDashboardPage />} />
        <Route path={appRoutes.userProfile} element={<CandidateProfilePage />} />
        <Route path={appRoutes.candidateJobs} element={<CandidateCompanyJobsPage />} />
        <Route path={appRoutes.candidateCompanyJobs} element={<CandidateCompanyJobsPage />} />
        <Route path={appRoutes.candidateJobDetail} element={<CandidateJobDetailPage />} />
        <Route path={appRoutes.candidateJobApply} element={<CandidateJobApplyPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
