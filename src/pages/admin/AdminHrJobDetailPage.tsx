import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import { ArrowLeft, Share2 } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import type { AdminHrJobDetail } from '../../services/jobService'
import { getAdminHrJobById } from '../../services/jobService'
import { getErrorMessage } from '../../utils/errors'
import { slugify } from '../../utils/slug'

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

function buildPublicJobPath(companyName: string | null | undefined, jobId: number): string {
  const companySlug = slugify(companyName || 'company')
  return appRoutes.publicJobDetail.replace(':companySlug', companySlug).replace(':jobId', String(jobId))
}

async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  if (typeof document === 'undefined') {
    return false
  }

  const temp = document.createElement('textarea')
  temp.value = value
  temp.style.position = 'fixed'
  temp.style.left = '-9999px'
  document.body.appendChild(temp)
  temp.focus()
  temp.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(temp)
  return ok
}

function DetailItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value || '-'}</p>
    </div>
  )
}

function MarkdownSection({ title, content }: { title: string; content?: string }): JSX.Element {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{title}</p>
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
          {content || '-'}
        </Markdown>
      </div>
    </div>
  )
}

export function AdminHrJobDetailPage(): JSX.Element {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [job, setJob] = useState<AdminHrJobDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJobDetail = async (): Promise<void> => {
      if (!jobId) {
        setError('Invalid job ID')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const jobIdNum = Number.parseInt(jobId, 10)
        if (Number.isNaN(jobIdNum)) {
          setError('Invalid job ID format')
          return
        }

        const details = await getAdminHrJobById(jobIdNum)
        setJob(details)
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load job details'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobDetail()
  }, [jobId])

  const handleSharePublicLink = async (): Promise<void> => {
    if (!job) {
      return
    }

    try {
      const path = buildPublicJobPath(job.company_name, job.id)
      const publicUrl = `${window.location.origin}${path}`
      const copied = await copyToClipboard(publicUrl)

      if (!copied) {
        throw new Error('Copy not supported')
      }

      showToast({
        title: 'Public job link copied',
        description: publicUrl,
        variant: 'success',
      })
    } catch {
      showToast({
        title: 'Could not copy link',
        description: 'Please copy the URL from the browser address bar instead.',
        variant: 'error',
      })
    }
  }

  if (isLoading) {
    return (
      <AppShell role="admin" title="Job Details" description="Loading...">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-slate-600">Loading job details...</p>
        </div>
      </AppShell>
    )
  }

  if (error || !job) {
    return (
      <AppShell role="admin" title="Job Details" description="Error">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Error Loading Job</h2>
              <p className="mt-2 text-sm text-rose-600">{error || 'Job not found'}</p>
            </div>
            <button
              onClick={() => navigate('/admin/hr')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Jobs
            </button>
          </div>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="admin"
      title="Job Details"
      description={`${job.title} at ${job.company_name || 'Company'}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/hr')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              title="Go back to jobs list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
            </div>
            <button
              onClick={() => {
                void handleSharePublicLink()
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-100"
            >
              <Share2 className="h-4 w-4" />
              Share Public Link
            </button>
            <button
              onClick={() => navigate(`/admin/hr/${job.id}/edit`)}
              className="rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Edit Job
            </button>
            <Badge tone={job.status?.toLowerCase() === 'open' ? 'success' : 'neutral'}>
              {formatLabel(job.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{job.company_name || 'N/A'}</span>
            <span className="text-slate-400">•</span>
            <span>{job.location || 'N/A'}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-xs text-slate-500">ID: {job.id}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {job.description && (
              <MarkdownSection title="Job Description" content={job.description} />
            )}

            {/* Requirements */}
            {job.requirements && (
              <MarkdownSection title="Requirements" content={job.requirements} />
            )}

            {/* Skills */}
            {job.skills && (
              <MarkdownSection title="Required Skills" content={job.skills} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Info */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">Quick Info</h2>
              <div className="mt-4 space-y-3">
                <DetailItem label="Employment Type" value={formatLabel(job.employment_type)} />
                <DetailItem label="Work Mode" value={formatLabel(job.work_mode)} />
                <DetailItem label="Experience Required" value={job.min_experience_years != null ? `${job.min_experience_years} years` : '-'} />
                <DetailItem label="Openings" value={String(job.openings_count ?? '-')} />
              </div>
            </Card>

            {/* Salary & Deadline */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">Compensation & Deadline</h2>
              <div className="mt-4 space-y-3">
                <DetailItem label="Salary Range" value={job.salary_range || '-'} />
                <DetailItem label="Application Deadline" value={formatDate(job.application_deadline)} />
              </div>
            </Card>

            {/* Statistics */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">Application Stats</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Total Applications
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {job.total_applications ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Shortlisted
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {job.shortlisted_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    In Interviews
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {job.interview_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Hired
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {job.hired_count ?? 0}
                  </p>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">Metadata</h2>
              <div className="mt-4 space-y-3">
                <DetailItem label="Created By" value={job.creator_name || job.creator_email || '-'} />
                <DetailItem label="Created At" value={formatDate(job.created_at)} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
