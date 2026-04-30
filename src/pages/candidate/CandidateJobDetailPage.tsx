import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { getJobOpeningById } from '../../services/jobService'
import type { CandidateJobOpening } from '../../types/jobApplication'
import { getErrorMessage } from '../../utils/errors'
import { slugify } from '../../utils/slug'

const buildApplyPath = (companySlug: string, jobId: number): string => `/user/jobs/${companySlug}/${jobId}/apply`
const buildCompanyPath = (companySlug: string): string => `/user/jobs/${companySlug}`

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Not specified'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Not specified'
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function DetailItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

function MarkdownSection({ title, content }: { title: string; content?: string | null }): JSX.Element {
  return (
    <Card className="space-y-3 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <div className="prose prose-sm max-w-none text-slate-700">
        <Markdown
          components={{
            p: ({ node, ...props }) => <p className="mb-3 leading-6" {...props} />,
            ul: ({ node, ...props }) => <ul className="mb-3 ml-4 list-disc space-y-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="mb-3 ml-4 list-decimal space-y-2" {...props} />,
            li: ({ node, ...props }) => <li className="text-sm" {...props} />,
            h1: ({ node, ...props }) => <h1 className="mb-2 text-lg font-bold" {...props} />,
            h2: ({ node, ...props }) => <h2 className="mb-2 mt-4 text-base font-bold" {...props} />,
            h3: ({ node, ...props }) => <h3 className="mb-2 mt-3 text-sm font-bold" {...props} />,
            code: ({ node, ...props }) => (
              <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-slate-300 bg-slate-50 py-2 pl-4" {...props} />
            ),
            a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-700 hover:underline" {...props} />,
          }}
        >
          {content || 'Not provided.'}
        </Markdown>
      </div>
    </Card>
  )
}

export function CandidateJobDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { companySlug = '', jobId = '' } = useParams<{ companySlug?: string; jobId?: string }>()
  const [job, setJob] = useState<CandidateJobOpening | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJob = async (): Promise<void> => {
      if (!jobId) {
        setError('Invalid job URL')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await getJobOpeningById(Number(jobId))
        setJob(response)
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Failed to load job details.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadJob()
  }, [jobId])

  const resolvedCompanySlug = useMemo(() => slugify(job?.company_name || companySlug || 'company'), [companySlug, job])
  const companyPath = buildCompanyPath(resolvedCompanySlug)
  const applyPath = job ? buildApplyPath(resolvedCompanySlug, job.id) : '#'

  return (
    <AppShell
      role="candidate"
      title="Job details"
      description="Review role information and requirements before applying."
    >
      {isLoading ? (
        <Card className="h-72 animate-pulse bg-slate-100" />
      ) : error || !job ? (
        <Card className="mx-auto max-w-2xl p-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Unable to load job</p>
          <p className="mt-2 text-sm text-slate-600">{error ?? 'The selected role could not be found.'}</p>
          <Button className="mt-5" onClick={() => navigate(companyPath)}>
            Back to openings
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link to={companyPath} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                  Back to openings
                </Link>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{job.company_name || 'Company'}</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">{job.title}</h1>
              </div>
              <Button onClick={() => navigate(applyPath)}>Apply now</Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="neutral">{job.location || 'Remote'}</Badge>
              <Badge tone="neutral">{job.work_mode || 'Flexible'}</Badge>
              <Badge tone="neutral">{job.employment_type || 'Not specified'}</Badge>
              <Badge tone="neutral">Deadline: {formatDate(job.application_deadline)}</Badge>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
            <div className="space-y-6">
              <MarkdownSection title="Job Description" content={job.description} />
              <MarkdownSection title="Requirements" content={job.requirements} />
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-sm font-semibold text-slate-900">Job info</p>
                <div className="mt-3 space-y-3">
                  <DetailItem label="Department" value={job.department || 'General'} />
                  <DetailItem label="Experience" value={job.experience_level || 'Not specified'} />
                  <DetailItem
                    label="Salary"
                    value={job.is_salary_visible === false ? 'Not disclosed' : job.salary_range || 'Not disclosed'}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
