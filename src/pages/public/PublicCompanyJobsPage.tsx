import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { appRoutes } from '../../constants/routes'
import { storageKeys } from '../../constants/storage'
import { Card, Input, Select } from '../../components/ui'
import { getCompanyJobs } from '../../services/jobService'
import type { CandidateJobOpening } from '../../types/jobApplication'
import { getErrorMessage } from '../../utils/errors'
import { writeStoredString } from '../../utils/storage'

function toDisplayCompanyName(companySlug: string): string {
  return companySlug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getCompanyInitials(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function formatPostedDate(value?: string | null): string {
  if (!value) {
    return 'Recently posted'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Recently posted'
  }

  return `Posted ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function buildPublicJobPath(companySlug: string, jobId: number): string {
  return appRoutes.publicJobDetail
    .replace(':companySlug', companySlug)
    .replace(':jobId', String(jobId))
}

export function PublicCompanyJobsPage(): JSX.Element {
  const { companySlug = '' } = useParams<{ companySlug?: string }>()
  const [jobs, setJobs] = useState<CandidateJobOpening[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [workTypeFilter, setWorkTypeFilter] = useState('all')

  useEffect(() => {
    if (companySlug) {
      writeStoredString(storageKeys.candidateCompanySlug, companySlug)
    }
  }, [companySlug])

  useEffect(() => {
    const loadJobs = async (): Promise<void> => {
      if (!companySlug) {
        setError('Company URL is missing.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await getCompanyJobs(companySlug)
        setJobs(response)
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Unable to load company jobs.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadJobs()
  }, [companySlug])

  const companyName = useMemo(() => {
    if (jobs[0]?.company_name) {
      return jobs[0].company_name
    }

    return toDisplayCompanyName(companySlug)
  }, [companySlug, jobs])

  const companyLogo = jobs[0]?.company_logo ?? ''

  const locationOptions = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.location).filter(Boolean))) as string[]
  }, [jobs])

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.department).filter(Boolean))) as string[]
  }, [jobs])

  const workTypeOptions = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.work_mode).filter(Boolean))) as string[]
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return jobs.filter((job) => {
      const searchMatches =
        keyword.length === 0 ||
        [job.title, job.department, job.location, job.work_mode, job.employment_type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword)

      const locationMatches =
        locationFilter === 'all' || (job.location ?? '').toLowerCase() === locationFilter
      const departmentMatches =
        departmentFilter === 'all' || (job.department ?? '').toLowerCase() === departmentFilter
      const workTypeMatches =
        workTypeFilter === 'all' || (job.work_mode ?? '').toLowerCase() === workTypeFilter

      return searchMatches && locationMatches && departmentMatches && workTypeMatches
    })
  }, [departmentFilter, jobs, locationFilter, searchTerm, workTypeFilter])

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {companyLogo ? (
              <img src={companyLogo} alt={`${companyName} logo`} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-2xl font-bold text-slate-900">{getCompanyInitials(companyName || 'Company')}</span>
            )}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{companyName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Explore current openings from {companyName}. Open a role to see details and register before applying.
          </p>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              label="Search jobs"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
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
            <Select label="Work type" value={workTypeFilter} onChange={(event) => setWorkTypeFilter(event.target.value)}>
              <option value="all">All work types</option>
              {workTypeOptions.map((type) => (
                <option key={type} value={type.toLowerCase()}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Job Openings</h2>
          <p className="mt-1 text-sm text-slate-600">{filteredJobs.length} role(s) currently open</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-20 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Unable to load jobs</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">No jobs match your filters</p>
            <p className="mt-2 text-sm text-slate-600">Clear search and filters to view all openings.</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filteredJobs.map((job, index) => (
              <Link
                key={job.id}
                to={buildPublicJobPath(companySlug, job.id)}
                className={`grid gap-3 px-4 py-4 transition hover:bg-slate-50 md:grid-cols-[1.3fr,0.6fr,0.8fr,0.9fr] md:items-center ${
                  index !== filteredJobs.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div>
                  <p className="text-xl font-semibold leading-7 text-slate-900">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatPostedDate(job.published_at ?? job.created_at)}</p>
                </div>
                <p className="text-sm font-medium text-slate-700">{job.work_mode || 'Flexible'}</p>
                <p className="text-sm text-slate-700">{job.location || 'Remote'}</p>
                <p className="text-sm text-slate-700">{job.department || 'General'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
