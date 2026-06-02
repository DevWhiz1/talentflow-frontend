import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Link as LinkIcon, RefreshCw, Search } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import { getAdminHrJobs } from '../../services/jobService'
import type { AdminHrJobListItem } from '../../services/jobService'
import { createInterviewMeeting, getInterviews, getInterviewsByJob } from '../../services/interviewService'
import type { Interview } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errors'

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function statusTone(status?: string | null): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (!status) return 'neutral'
  if (['Completed', 'Confirmed', 'Hired', 'Selected for Next Round'].includes(status)) return 'success'
  if (['Cancelled', 'Rejected', 'No Show'].includes(status)) return 'danger'
  if (['Rescheduled', 'On Hold'].includes(status)) return 'warning'
  return 'info'
}

function uniqueInterviews(interviews: Interview[]): Interview[] {
  const seen = new Set<string>()
  return interviews.filter((interview) => {
    const key = [
      interview.application_id,
      interview.job_id,
      interview.candidate_id,
      interview.interview_round,
      interview.interview_date,
    ].join('|')
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function AdminScheduledInterviewsPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async (jobId?: string): Promise<void> => {
    try {
      setIsLoading(true)
      const [jobList, interviewList] = await Promise.all([
        getAdminHrJobs(),
        jobId ? getInterviewsByJob(Number.parseInt(jobId, 10)) : getInterviews(),
      ])
      setJobs(jobList)
      setInterviews(uniqueInterviews(interviewList))
    } catch (error) {
      showToast({
        title: 'Unable to load interviews',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return interviews
    return interviews.filter((interview) =>
      (interview.interview_round || '').toLowerCase().includes(query)
      || (interview.interviewer_name || '').toLowerCase().includes(query)
      || (interview.interviewer_email || '').toLowerCase().includes(query)
      || (interview.status || '').toLowerCase().includes(query),
    )
  }, [interviews, search])

  const handleJobChange = async (jobId: string): Promise<void> => {
    setSelectedJobId(jobId)
    await loadData(jobId || undefined)
  }

  const handleCreateMeeting = async (interviewId: number): Promise<void> => {
    try {
      const meeting = await createInterviewMeeting(interviewId)
      setInterviews((current) =>
        current.map((interview) =>
          interview.id === interviewId
            ? { ...interview, meeting_link: meeting.meeting_link, google_event_id: meeting.google_event_id }
            : interview,
        ),
      )
      showToast({ title: 'Google Meet created', description: meeting.meeting_link, variant: 'success' })
    } catch (error) {
      showToast({
        title: 'Unable to create Meet',
        description: getErrorMessage(error, 'Check Google OAuth environment variables.'),
        variant: 'error',
      })
    }
  }

  return (
    <AppShell role="admin" title="Scheduled Interviews" description="Track all interview rounds and open evaluation details.">
      <Card className="p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Interview Calendar</h2>
            <p className="mt-1 text-sm text-slate-600">{filtered.length} interviews shown</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search interviews..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
            <Select label="Job" value={selectedJobId} onChange={(event) => void handleJobChange(event.target.value)}>
              <option value="">All jobs</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </Select>
            <Button size="sm" variant="secondary" onClick={() => void loadData(selectedJobId || undefined)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-3 py-3">Round</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Interviewer</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((interview) => (
                <tr key={interview.id}>
                  <td className="px-3 py-3 font-semibold text-slate-900">{interview.interview_round || '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{formatDate(interview.interview_date)}</td>
                  <td className="px-3 py-3 text-slate-700">{interview.interviewer_name || interview.interviewer_email || '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{interview.interview_type || interview.interview_mode || '-'}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(interview.status)}>{interview.status || 'Scheduled'}</Badge></td>
                  <td className="px-3 py-3 text-slate-700">{interview.overall_score ?? '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void handleCreateMeeting(interview.id)}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Meet
                      </Button>
                      <Button size="sm" onClick={() => navigate(appRoutes.adminInterviewDetail.replace(':interviewId', String(interview.id)))}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    {isLoading ? 'Loading interviews...' : 'No interviews found.'}
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
