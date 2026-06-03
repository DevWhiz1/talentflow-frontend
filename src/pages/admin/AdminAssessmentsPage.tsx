import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, Search, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import { getAssessmentAssignments, getAssessments, updateAssessment, type Assessment, type AssignmentListItem } from '../../services/assessmentService'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getAdminHrJobs } from '../../services/jobService'
import { getErrorMessage } from '../../utils/errors'

function statusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (['accepted', 'shortlist', 'published'].includes(status)) return 'success'
  if (['submitted', 'reviewed', 'in_progress'].includes(status)) return 'info'
  if (['rejected', 'expired'].includes(status)) return 'danger'
  if (['needs_review', 'draft', 'assigned'].includes(status)) return 'warning'
  return 'neutral'
}

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

function formatPercent(value?: number | null): string {
  return value == null ? '-' : `${Math.round(value)}%`
}

export function AdminAssessmentsPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [jobFilter, setJobFilter] = useState<number>(0)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const [jobList, assessmentList, assignmentList] = await Promise.all([
        getAdminHrJobs(),
        getAssessments(),
        getAssessmentAssignments(),
      ])
      setJobs(jobList)
      setAssessments(assessmentList)
      setAssignments(assignmentList)
    } catch (error) {
      showToast({ title: 'Unable to load assessments', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const assignmentCounts = useMemo(() => {
    const counts = new Map<number, { total: number; completed: number }>()
    assignments.forEach((assignment) => {
      const current = counts.get(assignment.assessment_id) || { total: 0, completed: 0 }
      current.total += 1
      if (['submitted', 'reviewed', 'accepted', 'rejected'].includes(assignment.status)) current.completed += 1
      counts.set(assignment.assessment_id, current)
    })
    return counts
  }, [assignments])

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return assessments.filter((assessment) => {
      const job = jobs.find((item) => item.id === assessment.job_id)
      const matchesJob = !jobFilter || assessment.job_id === jobFilter
      const matchesQuery = !query || `${assessment.title} ${job?.title || ''} ${assessment.status}`.toLowerCase().includes(query)
      return matchesJob && matchesQuery
    })
  }, [assessments, jobFilter, jobs, search])

  const filteredAssignments = useMemo(
    () => assignments.filter((assignment) => !jobFilter || assignment.job_id === jobFilter),
    [assignments, jobFilter],
  )

  const publishAssessment = async (assessment: Assessment): Promise<void> => {
    try {
      await updateAssessment(assessment.id, { status: 'published' })
      showToast({ title: 'Assessment published', variant: 'success' })
      await loadData()
    } catch (error) {
      showToast({ title: 'Could not publish assessment', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Assessments" description="View assessments first, filter by job, then create or assign from focused pages.">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Assessment Library</h2>
              <p className="mt-1 text-sm text-slate-600">{filteredAssessments.length} assessments</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[220px,1fr,auto] lg:w-[720px]">
              <Select label="Filter by job" value={jobFilter} onChange={(event) => setJobFilter(Number(event.target.value))}>
                <option value={0}>All jobs</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search assessments..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                />
              </div>
              <Button onClick={() => navigate(appRoutes.adminAssessmentsNew)}>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3">Assessment</th>
                  <th className="px-3 py-3">Job</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Sent</th>
                  <th className="px-3 py-3">Completed</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((assessment) => {
                  const job = jobs.find((item) => item.id === assessment.job_id)
                  const counts = assignmentCounts.get(assessment.id) || { total: 0, completed: 0 }
                  return (
                    <tr key={assessment.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">{assessment.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(assessment.created_at)} · {assessment.total_questions || 'Project'} items · Due {formatDate(assessment.due_at)}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{job?.title || `Job #${assessment.job_id}`}</td>
                      <td className="px-3 py-3 text-slate-700 uppercase">{assessment.assessment_type}</td>
                      <td className="px-3 py-3 text-slate-700">{counts.total}</td>
                      <td className="px-3 py-3 text-slate-700">{counts.completed}</td>
                      <td className="px-3 py-3"><Badge tone={statusTone(assessment.status)}>{assessment.status}</Badge></td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {assessment.status === 'draft' ? <Button size="sm" variant="secondary" onClick={() => void publishAssessment(assessment)}>Publish</Button> : null}
                          <Button size="sm" variant="secondary" onClick={() => navigate(appRoutes.adminAssessmentEdit.replace(':assessmentId', String(assessment.id)))}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
                          <Button size="sm" onClick={() => navigate(appRoutes.adminAssessmentAssign.replace(':assessmentId', String(assessment.id)))}><Send className="mr-2 h-4 w-4" />Assign</Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!filteredAssessments.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      {isLoading ? 'Loading assessments...' : 'No assessments found.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Assignment Status</h2>
            <p className="mt-1 text-sm text-slate-600">Who already received a test and current score/submission status.</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3">Candidate</th>
                  <th className="px-3 py-3">Assessment</th>
                  <th className="px-3 py-3">Job</th>
                  <th className="px-3 py-3">Sent</th>
                  <th className="px-3 py-3">Due</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{assignment.candidate_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{assignment.candidate_email}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{assignment.assessment_title}</td>
                    <td className="px-3 py-3 text-slate-700">{assignment.job_title}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(assignment.assigned_at)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(assignment.due_at)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatPercent(assignment.percentage)}</td>
                    <td className="px-3 py-3"><Badge tone={statusTone(assignment.status)}>{assignment.status}</Badge></td>
                  </tr>
                ))}
                {!filteredAssignments.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">No assignment records for this filter.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
