import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowUpRight, Briefcase, Search, Sparkles, UserCheck } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getAdminHrJobs, getAdminJobApplicants, updateJobApplicationStatus } from '../../services/jobService'
import type { AdminJobApplicant } from '../../types/jobApplication'
import { getErrorMessage } from '../../utils/errors'

function formatLabel(value?: string | null): string {
  if (!value) {
    return '-'
  }

  return value
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatScore(value?: number | null): string {
  if (value == null) {
    return 'Pending'
  }

  return `${Math.round(value)}%`
}

function scoreTone(score?: number | null): 'neutral' | 'info' | 'success' | 'warning' {
  if (score == null) {
    return 'neutral'
  }

  if (score >= 75) {
    return 'success'
  }

  if (score >= 50) {
    return 'info'
  }

  return 'warning'
}

export function AdminHrScoringPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { jobId } = useParams<{ jobId?: string }>()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [applicants, setApplicants] = useState<AdminJobApplicant[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isJobsLoading, setIsJobsLoading] = useState(true)
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false)
  const [shortlistingId, setShortlistingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJobs = async (): Promise<void> => {
      try {
        setIsJobsLoading(true)
        setError(null)
        const data = await getAdminHrJobs()
        setJobs(data)

        const routeJobId = jobId ? Number.parseInt(jobId, 10) : null
        const nextJobId = routeJobId && !Number.isNaN(routeJobId) ? routeJobId : data[0]?.id ?? null
        setSelectedJobId(nextJobId)
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load HR jobs.'))
      } finally {
        setIsJobsLoading(false)
      }
    }

    void loadJobs()
  }, [jobId])

  useEffect(() => {
    const loadApplicants = async (): Promise<void> => {
      if (!selectedJobId) {
        setApplicants([])
        return
      }

      try {
        setIsApplicantsLoading(true)
        const data = await getAdminJobApplicants(selectedJobId)
        setApplicants(data)
      } catch (err) {
        showToast({
          title: 'Unable to load scoring',
          description: getErrorMessage(err, 'Please try again.'),
          variant: 'error',
        })
      } finally {
        setIsApplicantsLoading(false)
      }
    }

    void loadApplicants()
  }, [selectedJobId, showToast])

  const selectedJob = jobs.find((job) => job.id === selectedJobId)
  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return jobs
    }

    return jobs.filter((job) => (
      job.title.toLowerCase().includes(query)
      || (job.company_name?.toLowerCase() ?? '').includes(query)
      || (job.department?.toLowerCase() ?? '').includes(query)
    ))
  }, [jobs, searchTerm])

  const handleSelectJob = (nextJobId: number): void => {
    setSelectedJobId(nextJobId)
    navigate(appRoutes.adminHrJobScoring.replace(':jobId', String(nextJobId)))
  }

  const handleSelectApplicant = (applicationId: number): void => {
    navigate(appRoutes.adminHrApplicantDetail.replace(':applicationId', String(applicationId)))
  }

  const handleShortlistApplicant = async (applicationId: number): Promise<void> => {
    try {
      setShortlistingId(applicationId)
      const updated = await updateJobApplicationStatus(applicationId, {
        status: 'shortlisted',
        screening_notes: 'Shortlisted by HR from scoring.',
      })
      setApplicants((current) =>
        current.map((applicant) =>
          applicant.id === applicationId
            ? { ...applicant, status: updated.status, application_rating: updated.application_rating ?? applicant.application_rating }
            : applicant,
        ),
      )
      showToast({
        title: 'Candidate shortlisted',
        description: 'Candidate is now ready for interview scheduling.',
        variant: 'success',
      })
    } catch (err) {
      showToast({
        title: 'Unable to shortlist candidate',
        description: getErrorMessage(err, 'Please try again.'),
        variant: 'error',
      })
    } finally {
      setShortlistingId(null)
    }
  }

  return (
    <AppShell
      role="admin"
      title="HR Scoring"
      description="Review resume match scores and candidate details across your active job posts."
    >
      <div className="grid gap-6 xl:grid-cols-[340px,1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Jobs</p>
              <p className="mt-1 text-xs text-slate-500">{filteredJobs.length} available</p>
            </div>

            {isJobsLoading ? <div className="p-4 text-sm text-slate-600">Loading jobs...</div> : null}
            {!isJobsLoading && error ? <div className="p-4 text-sm text-rose-600">{error}</div> : null}
            {!isJobsLoading && !error && filteredJobs.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No jobs found.</div>
            ) : null}

            <div className="max-h-[66vh] overflow-y-auto">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => handleSelectJob(job.id)}
                  className={[
                    'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50',
                    selectedJobId === job.id ? 'bg-teal-50' : 'bg-white',
                  ].join(' ')}
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{job.title}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {job.company_name || 'Company'} - {job.total_applications ?? 0} applicants
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedJob?.title || 'Select a job'}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedJob ? `${selectedJob.company_name || 'Company'} - applicants sorted by resume match score` : 'Choose a job to view scoring.'}
                </p>
              </div>
              {selectedJob ? (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/hr/${selectedJob.id}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-100"
                >
                  Open Job
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </Card>

          <Card className="overflow-hidden">
              <div className="grid grid-cols-[1fr,110px,120px,150px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Candidate</span>
                <span>Score</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {isApplicantsLoading ? <div className="p-5 text-sm text-slate-600">Loading applicants...</div> : null}
              {!isApplicantsLoading && applicants.length === 0 ? (
                <div className="p-5 text-sm text-slate-600">No applicants for this job yet.</div>
              ) : null}

              {!isApplicantsLoading && applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="grid w-full grid-cols-[1fr,110px,120px,150px] gap-3 border-b border-slate-100 bg-white px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50"
                >
                  <button type="button" onClick={() => handleSelectApplicant(applicant.id)} className="min-w-0 text-left">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {applicant.first_name} {applicant.last_name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {applicant.current_job_title || applicant.email}
                    </span>
                  </button>
                  <span>
                    <Badge tone={scoreTone(applicant.match_score)}>{formatScore(applicant.match_score)}</Badge>
                  </span>
                  <span className="text-sm font-medium text-slate-700">{formatLabel(applicant.status)}</span>
                  <span>
                    {['shortlisted', 'interview'].includes(applicant.status) ? (
                      <Badge tone="success">Ready</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={shortlistingId === applicant.id}
                        onClick={() => void handleShortlistApplicant(applicant.id)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        {shortlistingId === applicant.id ? 'Saving' : 'Shortlist'}
                      </Button>
                    )}
                  </span>
                </div>
              ))}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
