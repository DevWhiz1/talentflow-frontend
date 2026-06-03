import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarPlus, Search } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import { getInterviews, getShortlistedCandidates } from '../../services/interviewService'
import type { Interview, ShortlistedCandidate } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errors'

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

export function AdminInterviewShortlistPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCandidates = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const [shortlist, scheduledInterviews] = await Promise.all([
          getShortlistedCandidates(),
          getInterviews(),
        ])
        setCandidates(shortlist)
        setInterviews(scheduledInterviews)
      } catch (error) {
        showToast({
          title: 'Unable to load shortlist',
          description: getErrorMessage(error, 'Please try again.'),
          variant: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadCandidates()
  }, [showToast])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return candidates
    return candidates.filter((candidate) =>
      candidate.candidate_name.toLowerCase().includes(query)
      || candidate.candidate_email.toLowerCase().includes(query)
      || candidate.job_title.toLowerCase().includes(query),
    )
  }, [candidates, search])

  const scheduledApplicationIds = useMemo(
    () => new Set(interviews.map((interview) => interview.application_id).filter(Boolean)),
    [interviews],
  )

  const isScheduled = (candidate: ShortlistedCandidate): boolean => (
    candidate.application_status === 'interview'
    || scheduledApplicationIds.has(candidate.application_id)
  )

  return (
    <AppShell
      role="admin"
      title="Shortlisted Candidates"
      description="Candidates ready for interview scheduling after scoring, assessment, or HR review."
    >
      <Card className="p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Interview Shortlist</h2>
            <p className="mt-1 text-sm text-slate-600">{filtered.length} candidates available</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shortlist..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-3 py-3">Candidate</th>
                <th className="px-3 py-3">Job</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Shortlisted</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((candidate) => (
                <tr key={candidate.application_id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{candidate.candidate_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{candidate.candidate_email}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{candidate.job_title}</td>
                  <td className="px-3 py-3"><Badge tone="success">{candidate.application_status}</Badge></td>
                  <td className="px-3 py-3 text-slate-700">{candidate.match_score ?? 'Pending'}</td>
                  <td className="px-3 py-3 text-slate-700">{formatDate(candidate.shortlist_date)}</td>
                  <td className="px-3 py-3 text-right">
                    {isScheduled(candidate) ? (
                      <Badge tone="info" className="justify-center">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Already Scheduled
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => navigate(`${appRoutes.adminInterviewSchedule}?applicationId=${candidate.application_id}`)}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    {isLoading ? 'Loading shortlist...' : 'No shortlisted candidates found.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
