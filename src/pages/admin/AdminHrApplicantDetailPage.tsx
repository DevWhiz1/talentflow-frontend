import type { JSX, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, ExternalLink, FileText, UserCheck } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import { getAdminJobApplicantById, updateJobApplicationStatus } from '../../services/jobService'
import type { AdminJobApplicantDetail } from '../../types/jobApplication'
import { getErrorMessage } from '../../utils/errors'

const apiOrigin = (import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')

function formatDate(value?: string | null): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString()
}

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

function buildAssetUrl(value?: string | null): string {
  if (!value) {
    return '#'
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `${apiOrigin}${value.startsWith('/') ? value : `/${value}`}`
}

function InfoTile({ label, value }: { label: string; value?: ReactNode }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-medium text-slate-900">{value || '-'}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

export function AdminHrApplicantDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { applicationId } = useParams<{ applicationId: string }>()
  const [applicant, setApplicant] = useState<AdminJobApplicantDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadApplicant = async (): Promise<void> => {
      if (!applicationId) {
        setError('Invalid application ID')
        setIsLoading(false)
        return
      }

      const parsedApplicationId = Number.parseInt(applicationId, 10)
      if (Number.isNaN(parsedApplicationId)) {
        setError('Invalid application ID format')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const details = await getAdminJobApplicantById(parsedApplicationId)
        setApplicant(details)
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load applicant details.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadApplicant()
  }, [applicationId])

  if (isLoading) {
    return (
      <AppShell role="admin" title="Applicant Details" description="Loading...">
        <Card className="p-6 text-sm text-slate-600">Loading applicant details...</Card>
      </AppShell>
    )
  }

  if (error || !applicant) {
    return (
      <AppShell role="admin" title="Applicant Details" description="Error">
        <Card className="p-6">
          <p className="text-lg font-semibold text-slate-900">Unable to load applicant</p>
          <p className="mt-2 text-sm text-rose-600">{error || 'Applicant not found.'}</p>
          <button
            type="button"
            onClick={() => navigate(appRoutes.adminHrScoring)}
            className="mt-5 rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-100"
          >
            Back to Scoring
          </button>
        </Card>
      </AppShell>
    )
  }

  const skillTags = applicant.matched_skills?.length ? applicant.matched_skills : applicant.resume_skills ?? []
  const scoringBackPath = appRoutes.adminHrJobScoring.replace(':jobId', String(applicant.job_id))
  const isShortlisted = ['shortlisted', 'interview'].includes(applicant.status)

  const handleShortlist = async (): Promise<void> => {
    try {
      setIsUpdatingStatus(true)
      const updated = await updateJobApplicationStatus(applicant.id, {
        status: 'shortlisted',
        screening_notes: applicant.screening_notes || 'Shortlisted by HR for interview scheduling.',
      })
      setApplicant(updated)
      showToast({
        title: 'Candidate shortlisted',
        description: 'Candidate is now available in the interview shortlist.',
        variant: 'success',
      })
    } catch (err) {
      showToast({
        title: 'Unable to shortlist candidate',
        description: getErrorMessage(err, 'Please try again.'),
        variant: 'error',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <AppShell
      role="admin"
      title="Applicant Details"
      description={`${applicant.first_name} ${applicant.last_name} - scoring and application profile`}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(scoringBackPath)}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to scoring
              </button>
              <h1 className="text-3xl font-bold text-slate-900">
                {applicant.first_name} {applicant.last_name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{applicant.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={scoreTone(applicant.match_score)}>{formatScore(applicant.match_score)}</Badge>
              <Badge tone="neutral">{formatLabel(applicant.status)}</Badge>
              {!isShortlisted ? (
                <Button size="sm" variant="secondary" onClick={() => void handleShortlist()} disabled={isUpdatingStatus}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {isUpdatingStatus ? 'Shortlisting...' : 'Shortlist'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`${appRoutes.adminInterviewSchedule}?applicationId=${applicant.id}`)}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              )}
              <a
                href={buildAssetUrl(applicant.resume_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FileText className="h-4 w-4" />
                View Resume
              </a>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
          <div className="space-y-6">
            <Section title="Scoring">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile label="Final Score" value={formatScore(applicant.match_score)} />
                <InfoTile label="Similarity" value={formatScore(applicant.similarity_score)} />
                <InfoTile label="Skill Score" value={formatScore(applicant.skill_score)} />
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Matched Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skillTags.length > 0 ? (
                    skillTags.map((skill) => <Badge key={skill} tone="info">{skill}</Badge>)
                  ) : (
                    <span className="text-sm text-slate-500">No skills returned yet.</span>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Profile Summary">
              <p className="text-sm leading-6 text-slate-700">
                {applicant.profile_summary || applicant.headline || 'No profile summary provided.'}
              </p>
            </Section>

            <Section title="Education">
              {applicant.education?.length ? (
                <div className="space-y-3">
                  {applicant.education.map((education) => (
                    <div key={education.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{education.school}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {[education.degree, education.field_of_study].filter(Boolean).join(' - ') || '-'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(education.start_date)} to {education.is_currently_studying ? 'Present' : formatDate(education.end_date)}
                      </p>
                      {education.description ? <p className="mt-3 text-sm text-slate-700">{education.description}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No education records provided.</p>
              )}
            </Section>

            <Section title="Experience">
              {applicant.experience?.length ? (
                <div className="space-y-3">
                  {applicant.experience.map((experience) => (
                    <div key={experience.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{experience.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{experience.company || '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(experience.start_date)} to {experience.is_currently_working ? 'Present' : formatDate(experience.end_date)}
                      </p>
                      {experience.description ? <p className="mt-3 text-sm text-slate-700">{experience.description}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No experience records provided.</p>
              )}
            </Section>

            <Section title="Application Review">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Application ID" value={applicant.id.toString()} />
                <InfoTile label="Job ID" value={applicant.job_id.toString()} />
                <InfoTile label="Candidate ID" value={applicant.candidate_id.toString()} />
                <InfoTile label="Applied At" value={formatDate(applicant.applied_at)} />
                <InfoTile label="Viewed At" value={formatDate(applicant.viewed_date)} />
                <InfoTile label="Rating" value={applicant.application_rating?.toString()} />
                <InfoTile label="Shortlisted At" value={formatDate(applicant.shortlist_date)} />
                <InfoTile label="Interview Date" value={formatDate(applicant.interview_date)} />
                <InfoTile label="Interview Score" value={applicant.interview_score?.toString()} />
                <InfoTile label="Offer Extended" value={applicant.offer_extended ? 'Yes' : 'No'} />
                <InfoTile label="Offer Accepted" value={applicant.offer_accepted ? 'Yes' : 'No'} />
                <InfoTile label="Rejected At" value={formatDate(applicant.rejection_date)} />
              </div>
              <div className="mt-4 space-y-3">
                <InfoTile label="Screening Notes" value={applicant.screening_notes} />
                <InfoTile label="Interview Feedback" value={applicant.interview_feedback} />
                <InfoTile label="Rejection Reason" value={applicant.rejection_reason} />
                <InfoTile label="Flag Reason" value={applicant.flagged_reason} />
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Contact">
              <div className="space-y-3">
                <InfoTile label="Email" value={applicant.email} />
                <InfoTile label="Phone" value={applicant.phone} />
                <InfoTile label="Address" value={applicant.address} />
                <InfoTile label="City" value={applicant.city} />
                <InfoTile label="Country" value={applicant.country} />
              </div>
            </Section>

            <Section title="Professional Details">
              <div className="space-y-3">
                <InfoTile label="Current Title" value={applicant.current_job_title} />
                <InfoTile label="Current Company" value={applicant.current_company} />
                <InfoTile label="Employment Status" value={formatLabel(applicant.current_employment_status)} />
                <InfoTile label="Notice Period" value={formatLabel(applicant.notice_period)} />
                <InfoTile label="Experience Years" value={applicant.years_of_experience?.toString()} />
              </div>
            </Section>

            <Section title="Compensation">
              <div className="space-y-3">
                <InfoTile label="Expected Min" value={applicant.expected_salary_min?.toString()} />
                <InfoTile label="Expected Max" value={applicant.expected_salary_max?.toString()} />
                <InfoTile label="Currency" value={applicant.salary_currency} />
                <InfoTile label="Available Start" value={formatDate(applicant.available_start_date)} />
              </div>
            </Section>

            <Section title="Links">
              <div className="space-y-3">
                {[applicant.linkedin_url, applicant.github_url, applicant.portfolio_url].filter(Boolean).map((url) => (
                  <a
                    key={url}
                    href={url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="truncate">{url}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
                <a
                  href={buildAssetUrl(applicant.resume_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <span>Resume</span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
                {applicant.cover_letter_url ? (
                  <a
                    href={buildAssetUrl(applicant.cover_letter_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>Cover Letter</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ) : null}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
