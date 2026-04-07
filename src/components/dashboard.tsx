import type { ComponentProps, JSX } from 'react'
import type {
  AppliedJob,
  ChartDatum,
  DashboardStat,
  RecentCandidate,
  RecommendedJob,
} from '../types/dashboard'
import { Badge, Card, SectionHeader } from './ui'

interface StatsGridProps {
  stats: DashboardStat[]
}

function StatCard({ stat }: { stat: DashboardStat }): JSX.Element {
  return (
    <Card className="p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
      <p className="mt-2 text-sm text-slate-600">{stat.hint}</p>
      <p className="mt-4 text-xs font-medium text-teal-700">{stat.trend}</p>
    </Card>
  )
}

export function StatsGrid({ stats }: StatsGridProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  )
}

interface ChartPlaceholderProps {
  title: string
  description: string
  points: ChartDatum[]
}

export function ChartPlaceholder({ title, description, points }: ChartPlaceholderProps): JSX.Element {
  const highestValue = Math.max(...points.map((point) => point.value))

  return (
    <Card className="p-6">
      <SectionHeader eyebrow="Charts" title={title} description={description} />

      <div className="mt-6 grid grid-cols-7 items-end gap-3">
        {points.map((point) => {
          const height = `${Math.max(18, (point.value / highestValue) * 100)}%`

          return (
            <div key={point.label} className="flex flex-col items-center gap-3">
              <div className="flex h-44 w-full items-end rounded-2xl bg-slate-50 p-2">
                <div className="w-full rounded-xl bg-teal-600 transition-all" style={{ height }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900">{point.value}</p>
                <p className="text-xs text-slate-500">{point.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

interface RecentCandidatesTableProps {
  candidates: RecentCandidate[]
}

export function RecentCandidatesTable({ candidates }: RecentCandidatesTableProps): JSX.Element {
  const statusTone: Record<RecentCandidate['status'], NonNullable<ComponentProps<typeof Badge>['tone']>> = {
    Screening: 'info',
    Shortlisted: 'success',
    Interviewed: 'warning',
    'Offer Sent': 'neutral',
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-5">
        <SectionHeader
          eyebrow="Talent pipeline"
          title="Recent candidates"
          description="Track the latest applicants entering the hiring funnel."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Candidate', 'Role', 'Source', 'Status', 'Applied'].map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{candidate.name}</p>
                  <p className="text-sm text-slate-500">{candidate.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{candidate.appliedRole}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{candidate.source}</td>
                <td className="px-6 py-4">
                  <Badge tone={statusTone[candidate.status]}>{candidate.status}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{candidate.appliedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

interface JobsListProps {
  title: string
  description: string
  emptyMessage: string
  jobs: Array<AppliedJob | RecommendedJob>
}

export function JobsList({ title, description, emptyMessage, jobs }: JobsListProps): JSX.Element {
  return (
    <Card className="p-6">
      <SectionHeader eyebrow="Jobs" title={title} description={description} />

      <div className="mt-5 space-y-4">
        {jobs.length ? (
          jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-teal-200 hover:bg-teal-50/50"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {job.company} • {job.location} • {job.type}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {'status' in job ? <Badge tone="warning">{job.status}</Badge> : null}
                  <Badge tone="info">{job.matchScore}% match</Badge>
                </div>
              </div>

              {'summary' in job ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">{job.summary}</p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">Applied {job.appliedAt}</p>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  )
}

interface ProfileCompletionCardProps {
  percent: number
  completed: string[]
  pending: string[]
}

export function ProfileCompletionCard({ percent, completed, pending }: ProfileCompletionCardProps): JSX.Element {
  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow="Profile"
        title="Completion status"
        description="Keep the candidate profile ready for faster matching and interviews."
        action={<Badge tone={percent >= 75 ? 'success' : 'warning'}>{percent}% complete</Badge>}
      />

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Completed</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {completed.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Pending</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {pending.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export function DashboardCallout({ message }: { message: string }): JSX.Element {
  return (
    <Card className="border-teal-100 bg-teal-50/60 p-5 shadow-none">
      <p className="text-sm font-semibold text-teal-900">AI insight</p>
      <p className="mt-2 text-sm leading-6 text-teal-950/80">{message}</p>
    </Card>
  )
}
