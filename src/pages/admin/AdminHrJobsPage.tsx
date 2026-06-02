import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Share2, X } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getAdminHrJobs } from '../../services/jobService'
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

export function AdminHrJobsPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('')
  const [workModeFilter, setWorkModeFilter] = useState<string>('')

  useEffect(() => {
    const loadJobs = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAdminHrJobs()
        setJobs(data)
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load jobs'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobs()
  }, [])

  // Filter and search logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchTerm === '' ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.company_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (job.department?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === '' || job.status === statusFilter
      const matchesEmploymentType =
        employmentTypeFilter === '' || job.employment_type === employmentTypeFilter
      const matchesWorkMode = workModeFilter === '' || job.work_mode === workModeFilter

      return matchesSearch && matchesStatus && matchesEmploymentType && matchesWorkMode
    })
  }, [jobs, searchTerm, statusFilter, employmentTypeFilter, workModeFilter])

  // Extract unique filter values
  const uniqueStatuses = useMemo(
    () => [...new Set(jobs.map((j) => j.status).filter((value): value is string => Boolean(value)))],
    [jobs],
  )
  const uniqueEmploymentTypes = useMemo(
    () => [...new Set(jobs.map((j) => j.employment_type).filter((value): value is string => Boolean(value)))],
    [jobs],
  )
  const uniqueWorkModes = useMemo(
    () => [...new Set(jobs.map((j) => j.work_mode).filter((value): value is string => Boolean(value)))],
    [jobs],
  )

  const handleViewDetails = (jobId: number): void => {
    navigate(`/admin/hr/${jobId}`)
  }

  const handleShareJob = async (job: AdminHrJobListItem): Promise<void> => {
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

  const clearAllFilters = (): void => {
    setSearchTerm('')
    setStatusFilter('')
    setEmploymentTypeFilter('')
    setWorkModeFilter('')
  }

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== '' || employmentTypeFilter !== '' || workModeFilter !== ''

  return (
    <AppShell
      role="admin"
      title="HR Jobs Overview"
      description="Review all created jobs, search, filter, and click any row to view complete details."
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by job title, company, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              />
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>

              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              >
                <option value="">All Employment Types</option>
                {uniqueEmploymentTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>

              <select
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              >
                <option value="">All Work Modes</option>
                {uniqueWorkModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatLabel(mode)}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredJobs.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{jobs.length}</span> jobs
              </p>
            </div>
          </div>
        </Card>

        {/* Jobs Table */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">All Created Jobs</h2>
            <p className="mt-1 text-sm text-slate-600">Click any row to view full job details.</p>
          </div>

          {isLoading ? (
            <div className="px-5 py-10 text-sm text-slate-600">Loading jobs...</div>
          ) : null}

          {!isLoading && error ? (
            <div className="px-5 py-10 text-sm text-rose-600">{error}</div>
          ) : null}

          {!isLoading && !error && jobs.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-600">No jobs found.</div>
          ) : null}

          {!isLoading && !error && jobs.length > 0 && filteredJobs.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-600">No jobs match your filters.</div>
          ) : null}

          {!isLoading && !error && filteredJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Job Title</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Type / Mode</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Applications</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          #{job.id} {job.department ? `• ${job.department}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{job.company_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="text-xs">
                          {formatLabel(job.employment_type)} / {formatLabel(job.work_mode)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={job.status?.toLowerCase() === 'open' ? 'success' : 'neutral'}>
                          {formatLabel(job.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{job.total_applications ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(job.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(job.id)}
                            className="rounded-md border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              void handleShareJob(job)
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-sm transition hover:bg-slate-100"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  )
}

