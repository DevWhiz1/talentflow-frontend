import type { ChangeEvent, FormEvent, JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import { getAdminHrJobs } from '../../services/jobService'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getShortlistedCandidates, scheduleInterview } from '../../services/interviewService'
import type { ShortlistedCandidate } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errors'

const rounds = ['Screening Interview', 'First Interview', 'Second Interview', 'Technical Interview', 'HR Interview', 'Final Interview']
const types = ['Online', 'On-site', 'Phone Call']

const initialForm = {
  job_id: '',
  application_id: '',
  candidate_id: '',
  interview_round: 'First Interview',
  interview_type: 'Online',
  interview_date: '',
  duration_minutes: '60',
  timezone: 'Asia/Karachi',
  location: '',
  meeting_link: '',
  interviewer_name: '',
  interviewer_email: '',
  instructions: '',
  create_google_meet: false,
}

export function AdminInterviewSchedulePage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [shortlisted, setShortlisted] = useState<ShortlistedCandidate[]>([])
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedJobId = form.job_id ? Number.parseInt(form.job_id, 10) : undefined
  const filteredCandidates = useMemo(
    () => shortlisted.filter((candidate) => !selectedJobId || candidate.job_id === selectedJobId),
    [selectedJobId, shortlisted],
  )
  const selectedCandidate = shortlisted.find((candidate) => String(candidate.application_id) === form.application_id)

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const [jobList, candidates] = await Promise.all([getAdminHrJobs(), getShortlistedCandidates()])
        setJobs(jobList)
        setShortlisted(candidates)

        const applicationId = searchParams.get('applicationId')
        const candidate = candidates.find((item) => String(item.application_id) === applicationId)
        if (candidate) {
          setForm((current) => ({
            ...current,
            application_id: String(candidate.application_id),
            candidate_id: String(candidate.candidate_id),
            job_id: String(candidate.job_id),
          }))
        }
      } catch (error) {
        showToast({
          title: 'Unable to load scheduling data',
          description: getErrorMessage(error, 'Please try again.'),
          variant: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [searchParams, showToast])

  const updateForm = (field: keyof typeof initialForm, value: string | boolean): void => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleJobChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setForm((current) => ({ ...current, job_id: event.target.value, application_id: '', candidate_id: '' }))
  }

  const handleCandidateChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const applicationId = event.target.value
    const candidate = shortlisted.find((item) => String(item.application_id) === applicationId)
    setForm((current) => ({
      ...current,
      application_id: applicationId,
      candidate_id: candidate ? String(candidate.candidate_id) : '',
      job_id: candidate ? String(candidate.job_id) : current.job_id,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!form.job_id || !form.candidate_id || !form.application_id || !form.interview_date) {
      showToast({ title: 'Missing details', description: 'Select candidate, job, and interview time.', variant: 'error' })
      return
    }

    try {
      setIsSubmitting(true)
      const interview = await scheduleInterview({
        job_id: Number.parseInt(form.job_id, 10),
        candidate_id: Number.parseInt(form.candidate_id, 10),
        application_id: Number.parseInt(form.application_id, 10),
        interview_round: form.interview_round,
        interview_type: form.interview_type,
        interview_date: new Date(form.interview_date).toISOString(),
        duration_minutes: Number.parseInt(form.duration_minutes, 10),
        timezone: form.timezone,
        location: form.location || undefined,
        meeting_link: form.meeting_link || undefined,
        interviewer_name: form.interviewer_name || undefined,
        interviewer_email: form.interviewer_email || undefined,
        instructions: form.instructions || undefined,
        create_google_meet: form.create_google_meet,
        send_candidate_email: true,
        send_interviewer_email: true,
      })
      showToast({ title: 'Interview scheduled', description: 'Candidate and interviewer notifications were processed.', variant: 'success' })
      navigate(appRoutes.adminInterviewDetail.replace(':interviewId', String(interview.id)))
    } catch (error) {
      showToast({
        title: 'Unable to schedule interview',
        description: getErrorMessage(error, 'Please check the schedule form.'),
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell role="admin" title="Schedule Interview" description="Create a single interview round from the shortlist.">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Interview Details</h2>
            <p className="mt-1 text-sm text-slate-600">{isLoading ? 'Loading candidates...' : 'Assign interviewer, date, type, location, and invitation details.'}</p>
          </div>

          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <Select label="Related Job" value={form.job_id} onChange={handleJobChange} required>
              <option value="">Select job</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </Select>

            <Select label="Candidate" value={form.application_id} onChange={handleCandidateChange} required>
              <option value="">Select shortlisted candidate</option>
              {filteredCandidates.map((candidate) => (
                <option key={candidate.application_id} value={candidate.application_id}>
                  {candidate.candidate_name} - {candidate.job_title}
                </option>
              ))}
            </Select>

            <Select label="Interview Round" value={form.interview_round} onChange={(event) => updateForm('interview_round', event.target.value)}>
              {rounds.map((round) => <option key={round}>{round}</option>)}
            </Select>

            <Select label="Interview Type" value={form.interview_type} onChange={(event) => updateForm('interview_type', event.target.value)}>
              {types.map((type) => <option key={type}>{type}</option>)}
            </Select>

            <Input label="Date and Time" type="datetime-local" value={form.interview_date} onChange={(event) => updateForm('interview_date', event.target.value)} required />
            <Input label="Duration Minutes" type="number" min={1} value={form.duration_minutes} onChange={(event) => updateForm('duration_minutes', event.target.value)} />
            <Input label="Timezone" value={form.timezone} onChange={(event) => updateForm('timezone', event.target.value)} />
            <Input label="Interviewer Name" value={form.interviewer_name} onChange={(event) => updateForm('interviewer_name', event.target.value)} />
            <Input label="Interviewer Email" type="email" value={form.interviewer_email} onChange={(event) => updateForm('interviewer_email', event.target.value)} />
            <Input label="Location" value={form.location} onChange={(event) => updateForm('location', event.target.value)} />
            <Input label="Meeting Link" value={form.meeting_link} onChange={(event) => updateForm('meeting_link', event.target.value)} helperText="Leave empty when creating Google Meet automatically." className="md:col-span-2" />

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes / Instructions</span>
              <textarea
                value={form.instructions}
                onChange={(event) => updateForm('instructions', event.target.value)}
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
              <input type="checkbox" checked={form.create_google_meet} onChange={(event) => updateForm('create_google_meet', event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">Create Google Meet automatically</span>
            </label>

            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Candidate Snapshot</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedCandidate?.candidate_name || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Job</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedCandidate?.job_title || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</p>
              <div className="mt-1">{selectedCandidate ? <Badge tone="success">{selectedCandidate.application_status}</Badge> : '-'}</div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
