import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, Input, Select, SectionHeader } from '../../components/ui'
import { AppShell } from '../../components/layout'
import { appRoutes } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { getCompanyJobs } from '../../services/jobService'
import type { CandidateJobOpening } from '../../types/jobApplication'
import { getErrorMessage } from '../../utils/errors'
import { slugify } from '../../utils/slug'

const buildJobDetailPath = (companySlug: string, jobId: number): string =>
  `/user/jobs/${companySlug}/${jobId}`

function formatPostedDate(value?: string | null): string {
  if (!value) {
    return 'Recently posted'
  }

  const postedDate = new Date(value)
  if (Number.isNaN(postedDate.getTime())) {
    return 'Recently posted'
  }

  return postedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CandidateCompanyJobsPage(): JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { companySlug } = useParams<{ companySlug?: string }>()
  const [jobs, setJobs] = useState<CandidateJobOpening[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [workModeFilter, setWorkModeFilter] = useState('all')

  useEffect(() => {
    const loadJobs = async (): Promise<void> => {
      let slug = companySlug
      
      if (!slug && user?.companyName) {
        // Use company name from user profile instead of local storage
        slug = slugify(user.companyName)
        navigate(appRoutes.candidateCompanyJobs.replace(':companySlug', slug), { replace: true })
        return
      }

      if (!slug) {
        setJobs([])
        setError('No company has been assigned to this account yet.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await getCompanyJobs(slug)
        setJobs(response)
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Failed to load job openings.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobs()
  }, [companySlug, navigate, user?.companyName])

  const companyName = useMemo(() => jobs[0]?.company_name ?? 'All companies', [jobs])
  const companyDisplayName = useMemo(() => {
    if (companySlug && jobs.length > 0) {
      return jobs[0]?.company_name ?? companySlug.replace(/-/g, ' ')
    }

    return companySlug ? companySlug.replace(/-/g, ' ') : 'Company openings'
  }, [companySlug, jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchMatches =
        searchTerm.trim().length === 0 ||
        [job.title, job.company_name, job.department, job.location, job.work_mode, job.employment_type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase())

      const locationMatches = locationFilter === 'all' || (job.location ?? '').toLowerCase() === locationFilter
      const departmentMatches = departmentFilter === 'all' || (job.department ?? '').toLowerCase() === departmentFilter
      const workModeMatches = workModeFilter === 'all' || (job.work_mode ?? '').toLowerCase() === workModeFilter

      return searchMatches && locationMatches && departmentMatches && workModeMatches
    })
  }, [departmentFilter, jobs, locationFilter, searchTerm, workModeFilter])

  const locationOptions = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.location).filter(Boolean))) as string[]
  }, [jobs])

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.department).filter(Boolean))) as string[]
  }, [jobs])

  const workModeOptions = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.work_mode).filter(Boolean))) as string[]
  }, [jobs])

  return (
    <AppShell
      role="candidate"
      title="Job openings"
      description="Browse open roles by company, review the role details, and apply directly from the candidate workspace."
    >
      <div className="space-y-6">
        <Card className="overflow-hidden bg-gradient-to-br from-teal-50 via-white to-slate-50 p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Candidate openings</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{companyDisplayName}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                See all current openings from this company, compare the roles, and apply from one focused view.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/70 bg-white/80 p-4 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Open roles</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{jobs.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Showing</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{filteredJobs.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader
            eyebrow="Search"
            title="Find the right role"
            description="Search by title, company, department, or location, then open the role to see the details and apply."
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <Input
              label="Search jobs"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select label="Location" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              <option value="all">All locations</option>
              {locationOptions.map((location) => (
                <option key={location} value={location.toLowerCase()}>
                  {location}
                </option>
              ))}
            </Select>
            <Select
              label="Department"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="all">All departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department.toLowerCase()}>
                  {department}
                </option>
              ))}
            </Select>
            <Select label="Work mode" value={workModeFilter} onChange={(event) => setWorkModeFilter(event.target.value)}>
              <option value="all">All work modes</option>
              {workModeOptions.map((mode) => (
                <option key={mode} value={mode.toLowerCase()}>
                  {mode}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{companyName}</Badge>
              {jobs.length > 0 ? <Badge tone="neutral">{jobs[0]?.employment_type ?? 'Open roles'}</Badge> : null}
            </div>
            <button
              type="button"
              className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
              onClick={() => {
                setSearchTerm('')
                setLocationFilter('all')
                setDepartmentFilter('all')
                setWorkModeFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-28 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <Card className="mx-auto max-w-2xl p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Unable to load openings</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">No matching jobs found</p>
            <p className="mt-2 text-sm text-slate-600">
              Try clearing the filters or browse another company to see more openings.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const jobCompanySlug = slugify(job.company_name ?? companyDisplayName)
              return (
                <Link key={job.id} to={buildJobDetailPath(jobCompanySlug, job.id)} className="block">
                  <Card className="group border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                    <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr,0.6fr,0.6fr,0.4fr] lg:items-center">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                          {job.department || 'Open role'}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-teal-700">
                          {job.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {job.job_summary || job.description.slice(0, 140)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Work mode</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{job.work_mode || 'Flexible'}</p>
                        <p className="mt-1 text-xs text-slate-500">{job.employment_type || 'Employment type not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{job.location || 'Remote'}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatPostedDate(job.published_at ?? job.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hiring team</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{job.company_name || 'Company'}</p>
                        <p className="mt-1 text-xs text-slate-500">{job.openings_count || 1} opening(s)</p>
                      </div>
                      <div className="flex justify-start lg:justify-end">
                        <Badge tone="info">View</Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
