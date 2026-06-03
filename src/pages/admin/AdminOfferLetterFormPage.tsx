import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Button, Card, Input, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getAdminHrJobs, getAdminJobApplicants } from '../../services/jobService'
import type { AdminJobApplicant } from '../../types/jobApplication'
import {
  createOfferLetter,
  getOfferLetter,
  updateOfferLetter,
  type OfferLetter,
  type OfferLetterPayload,
} from '../../services/offerOnboardingService'
import { getErrorMessage } from '../../utils/errors'

const initialForm: OfferLetterPayload = {
  candidate_id: 0,
  job_id: 0,
  application_id: null,
  template_name: 'standard',
  job_title: '',
  department: '',
  reporting_manager: '',
  work_location: '',
  employment_type: 'Full-time',
  probation_period: '3 months',
  salary: 0,
  salary_currency: 'PKR',
  package_details: '',
  joining_date: '',
  benefits: '',
  terms_and_conditions: '',
  offer_body: '',
  status: 'draft',
  allow_change_request: true,
}

function TextArea({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      />
    </label>
  )
}

function formFromOffer(offer: OfferLetter): OfferLetterPayload {
  return {
    candidate_id: offer.candidate_id,
    job_id: offer.job_id,
    application_id: offer.application_id || null,
    template_name: offer.template_name || 'standard',
    job_title: offer.job_title || '',
    department: offer.department || '',
    reporting_manager: offer.reporting_manager || '',
    work_location: offer.work_location || '',
    employment_type: offer.employment_type || 'Full-time',
    probation_period: offer.probation_period || '',
    salary: offer.salary || 0,
    salary_currency: offer.salary_currency || 'PKR',
    package_details: offer.package_details || '',
    joining_date: offer.joining_date?.slice(0, 10) || '',
    benefits: offer.benefits || '',
    terms_and_conditions: offer.terms_and_conditions || '',
    offer_body: offer.offer_body || '',
    status: 'revised',
    allow_change_request: offer.allow_change_request,
  }
}

export function AdminOfferLetterFormPage(): JSX.Element {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [applicants, setApplicants] = useState<AdminJobApplicant[]>([])
  const [form, setForm] = useState<OfferLetterPayload>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const isEditing = Boolean(offerId)

  const hiredApplicants = useMemo(() => {
    const preferred = applicants.filter((applicant) => ['hired', 'offered', 'accepted'].includes(applicant.status))
    return preferred.length ? preferred : applicants
  }, [applicants])

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const jobList = await getAdminHrJobs()
      setJobs(jobList)
      if (offerId) {
        const offer = await getOfferLetter(Number(offerId))
        setForm(formFromOffer(offer))
      } else if (jobList[0]) {
        setForm((current) => ({ ...current, job_id: jobList[0].id, job_title: jobList[0].title, department: jobList[0].department || '' }))
      }
    } catch (error) {
      showToast({ title: 'Unable to load form', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [offerId, showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!form.job_id) return
    void getAdminJobApplicants(form.job_id).then(setApplicants).catch(() => setApplicants([]))
  }, [form.job_id])

  const handleJobChange = (jobId: number): void => {
    const job = jobs.find((item) => item.id === jobId)
    setForm((current) => ({ ...current, job_id: jobId, candidate_id: 0, application_id: null, job_title: job?.title || '', department: job?.department || '', work_location: job?.location || '', employment_type: job?.employment_type || 'Full-time' }))
  }

  const handleCandidateChange = (candidateId: number): void => {
    const applicant = applicants.find((item) => item.candidate_id === candidateId)
    setForm((current) => ({ ...current, candidate_id: candidateId, application_id: applicant?.id || null }))
  }

  const saveOffer = async (): Promise<void> => {
    if (!form.candidate_id || !form.job_id || !form.job_title || !form.joining_date || !form.salary) {
      showToast({ title: 'Missing offer details', description: 'Select a candidate/job and add salary, title, and joining date.', variant: 'error' })
      return
    }
    try {
      const payload = { ...form, joining_date: new Date(form.joining_date).toISOString() }
      if (offerId) await updateOfferLetter(Number(offerId), payload)
      else await createOfferLetter(payload)
      showToast({ title: isEditing ? 'Offer updated' : 'Offer draft created', variant: 'success' })
      navigate(appRoutes.adminOfferLetters)
    } catch (error) {
      showToast({ title: 'Could not save offer', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title={isEditing ? 'Edit Offer Letter' : 'Create Offer Letter'} description="Prepare the letter on its own page, then return to the list for tracking.">
      <Card className="p-6">
        {isLoading ? <p className="text-sm text-slate-600">Loading offer form...</p> : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Job" value={form.job_id} onChange={(event) => handleJobChange(Number(event.target.value))}><option value={0}>Select job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</Select>
              <Select label="Hired Candidate" value={form.candidate_id} onChange={(event) => handleCandidateChange(Number(event.target.value))}><option value={0}>Select candidate</option>{hiredApplicants.map((applicant) => <option key={applicant.candidate_id} value={applicant.candidate_id}>{applicant.first_name} {applicant.last_name} - {applicant.status}</option>)}</Select>
              <Input label="Job Title" value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} />
              <Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
              <Input label="Reporting Manager" value={form.reporting_manager} onChange={(event) => setForm({ ...form, reporting_manager: event.target.value })} />
              <Input label="Work Location" value={form.work_location} onChange={(event) => setForm({ ...form, work_location: event.target.value })} />
              <Select label="Employment Type" value={form.employment_type} onChange={(event) => setForm({ ...form, employment_type: event.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></Select>
              <Input label="Probation Period" value={form.probation_period} onChange={(event) => setForm({ ...form, probation_period: event.target.value })} />
              <Input label="Salary / Package" type="number" value={form.salary} onChange={(event) => setForm({ ...form, salary: Number(event.target.value) })} />
              <Input label="Currency" value={form.salary_currency} onChange={(event) => setForm({ ...form, salary_currency: event.target.value })} />
              <Input label="Joining Date" type="date" value={form.joining_date} onChange={(event) => setForm({ ...form, joining_date: event.target.value })} />
              <Select label="Template" value={form.template_name} onChange={(event) => setForm({ ...form, template_name: event.target.value })}><option value="standard">Standard Offer Template</option><option value="executive">Executive Offer Template</option><option value="contract">Contract Offer Template</option></Select>
            </div>
            <div className="mt-4 grid gap-4">
              <TextArea label="Package Details" value={form.package_details} onChange={(value) => setForm({ ...form, package_details: value })} />
              <TextArea label="Benefits" value={form.benefits} onChange={(value) => setForm({ ...form, benefits: value })} />
              <TextArea label="Terms and Conditions" value={form.terms_and_conditions} onChange={(value) => setForm({ ...form, terms_and_conditions: value })} />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate(appRoutes.adminOfferLetters)}>Cancel</Button>
              <Button onClick={() => void saveOffer()}>{isEditing ? 'Save Changes' : 'Create Offer'}</Button>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  )
}
