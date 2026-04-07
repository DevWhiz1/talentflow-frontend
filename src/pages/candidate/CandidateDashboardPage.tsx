import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '../../components/layout'
import { DashboardCallout, JobsList, ProfileCompletionCard, StatsGrid } from '../../components/dashboard'
import { Card } from '../../components/ui'
import {
  getAppliedJobs,
  getCandidateStats,
  getRecommendedJobs,
} from '../../services/jobService'
import { getProfileChecklist } from '../../services/userService'
import type { AppliedJob, DashboardStat, ProfileChecklist, RecommendedJob } from '../../types/dashboard'
import { getErrorMessage } from '../../utils/errors'

export function CandidateDashboardPage(): JSX.Element {
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([])
  const [profileChecklist, setProfileChecklist] = useState<ProfileChecklist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsResponse, appliedJobsResponse, recommendedJobsResponse, profileChecklistResponse] =
        await Promise.all([
          getCandidateStats(),
          getAppliedJobs(),
          getRecommendedJobs(),
          getProfileChecklist(),
        ])

      setStats(statsResponse)
      setAppliedJobs(appliedJobsResponse)
      setRecommendedJobs(recommendedJobsResponse)
      setProfileChecklist(profileChecklistResponse)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load the candidate dashboard.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return (
    <AppShell
      role="candidate"
      title="Candidate dashboard"
      description="Track your job applications, discover recommended roles, and keep your profile ready for hiring teams."
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-32 animate-pulse bg-slate-100" />
            ))}
          </div>
          <Card className="h-64 animate-pulse bg-slate-100" />
        </div>
      ) : error ? (
        <Card className="mx-auto max-w-2xl p-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Unable to load dashboard</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-medium text-white"
          >
            Retry
          </button>
        </Card>
      ) : (
        <div className="space-y-6">
          <section id="overview" className="space-y-6">
            <StatsGrid stats={stats} />
            <DashboardCallout message="Your profile strength is high enough to support targeted recommendations. Upload references and the skills assessment to improve match quality." />
          </section>

          <section id="jobs" className="grid gap-6 xl:grid-cols-2">
            <JobsList
              title="Applied jobs"
              description="Monitor the current status of roles you have already submitted."
              emptyMessage="No applications yet. Start by applying to recommended roles."
              jobs={appliedJobs}
            />
            <JobsList
              title="Recommended jobs"
              description="AI-friendly matches based on your profile, experience, and skills."
              emptyMessage="No recommendations are available right now."
              jobs={recommendedJobs}
            />
          </section>

          <section id="profile" className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            {profileChecklist ? (
              <ProfileCompletionCard
                percent={profileChecklist.percent}
                completed={profileChecklist.completed}
                pending={profileChecklist.pending}
              />
            ) : null}
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Next step</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Optimize your profile for better matches</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Keep your resume, portfolio, and role preferences current so the platform can surface
                more relevant openings and faster shortlist decisions.
              </p>
            </Card>
          </section>
        </div>
      )}
    </AppShell>
  )
}
