import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '../../components/layout'
import {
  ChartPlaceholder,
  DashboardCallout,
  RecentCandidatesTable,
  StatsGrid,
} from '../../components/dashboard'
import { Button, Card } from '../../components/ui'
import {
  getAdminChartData,
  getAdminStats,
} from '../../services/jobService'
import { getRecentCandidates } from '../../services/userService'
import type { ChartDatum, DashboardStat, RecentCandidate } from '../../types/dashboard'
import { getErrorMessage } from '../../utils/errors'

export function AdminDashboardPage(): JSX.Element {
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [chartData, setChartData] = useState<ChartDatum[]>([])
  const [candidates, setCandidates] = useState<RecentCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsResponse, chartResponse, candidatesResponse] = await Promise.all([
        getAdminStats(),
        getAdminChartData(),
        getRecentCandidates(),
      ])

      setStats(statsResponse)
      setChartData(chartResponse)
      setCandidates(candidatesResponse)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Failed to load the admin dashboard.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return (
    <AppShell
      role="admin"
      title="Admin dashboard"
      description="Monitor hiring activity, candidate quality, and pipeline health from a clean role-based workspace."
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
          <Button className="mt-5" onClick={() => void loadDashboard()}>
            Retry
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <section id="overview" className="space-y-6">
            <StatsGrid stats={stats} />
            <DashboardCallout message="Candidate review velocity is stable. Shortlisted applicants increased, while job publishing activity is strongest on weekdays." />
          </section>

          <section id="candidates" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <RecentCandidatesTable candidates={candidates} />
              <ChartPlaceholder
                title="Weekly hiring trend"
                description="Dummy chart content that can be replaced with a production charting library later."
                points={chartData}
              />
            </div>
          </section>

          <section id="reports" className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Reports</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Operational summary</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The frontend is wired for enterprise workflows with role guards, reusable components,
                Axios services, and graceful mock fallbacks for local development.
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Checklist</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {['Review candidate pipelines', 'Publish approved roles', 'Monitor weekly conversion rate'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      <span>{item}</span>
                    </li>
                  ),
                )}
              </ul>
            </Card>
          </section>
        </div>
      )}
    </AppShell>
  )
}
