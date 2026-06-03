import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Send, Search } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import {
  assignAssessment,
  getAssessment,
  getAssessmentAssignments,
  type Assessment,
  type AssignmentListItem,
} from '../../services/assessmentService'
import { getAdminJobApplicants } from '../../services/jobService'
import type { AdminJobApplicant } from '../../types/jobApplication'
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
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

export function AdminAssessmentAssignPage(): JSX.Element {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const { showToast } = useToast()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [applicants, setApplicants] = useState<AdminJobApplicant[]>([])
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    if (!assessmentId) return
    try {
      setIsLoading(true)
      const assessmentData = await getAssessment(Number(assessmentId))
      const [applicantList, assignmentList] = await Promise.all([
        getAdminJobApplicants(assessmentData.job_id),
        getAssessmentAssignments({ assessment_id: assessmentData.id }),
      ])
      setAssessment(assessmentData)
      setApplicants(applicantList)
      setAssignments(assignmentList)
    } catch (error) {
      showToast({ title: 'Unable to load assignment page', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [assessmentId, showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const assignmentByApplicationId = useMemo(() => {
    const map = new Map<number, AssignmentListItem>()
    assignments.forEach((assignment) => map.set(assignment.application_id, assignment))
    return map
  }, [assignments])

  const filteredApplicants = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return applicants
    return applicants.filter((applicant) =>
      `${applicant.first_name} ${applicant.last_name} ${applicant.email} ${applicant.status}`
        .toLowerCase()
        .includes(query),
    )
  }, [applicants, search])

  const availableApplicants = filteredApplicants.filter((applicant) => !assignmentByApplicationId.has(applicant.id))

  const toggleApplication = (applicationId: number): void => {
    setSelectedApplicationIds((current) =>
      current.includes(applicationId) ? current.filter((id) => id !== applicationId) : [...current, applicationId],
    )
  }

  const assignSelected = async (): Promise<void> => {
    if (!assessment || selectedApplicationIds.length === 0) return
    try {
      await assignAssessment(assessment.id, { application_ids: selectedApplicationIds })
      showToast({ title: 'Assessment sent', description: 'Selected candidates received the assessment invitation.', variant: 'success' })
      setSelectedApplicationIds([])
      await loadData()
    } catch (error) {
      showToast({ title: 'Could not assign assessment', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const assignAllAvailable = async (): Promise<void> => {
    if (!assessment || availableApplicants.length === 0) return
    try {
      await assignAssessment(assessment.id, { application_ids: availableApplicants.map((applicant) => applicant.id) })
      showToast({ title: 'Assessment sent', description: 'All available candidates received the assessment invitation.', variant: 'success' })
      setSelectedApplicationIds([])
      await loadData()
    } catch (error) {
      showToast({ title: 'Could not assign assessment', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Assign Assessment" description="Send this test to candidates from its related job and see who already received it.">
      <Card className="p-5">
        {isLoading || !assessment ? <p className="text-sm text-slate-600">Loading candidates...</p> : (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{assessment.title}</h2>
                <p className="mt-1 text-sm text-slate-600">Job #{assessment.job_id} · {assessment.assessment_type.toUpperCase()} · {assignments.length} already sent</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search job candidates..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
                <Button variant="secondary" disabled={assessment.status !== 'published' || availableApplicants.length === 0} onClick={() => void assignAllAvailable()}>
                  Assign Available
                </Button>
                <Button disabled={assessment.status !== 'published' || selectedApplicationIds.length === 0} onClick={() => void assignSelected()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Selected
                </Button>
              </div>
            </div>

            {assessment.status !== 'published' ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Publish this assessment before assigning it to candidates.
              </div>
            ) : null}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-3 py-3">Select</th>
                    <th className="px-3 py-3">Candidate</th>
                    <th className="px-3 py-3">Application</th>
                    <th className="px-3 py-3">Assessment Status</th>
                    <th className="px-3 py-3">Sent</th>
                    <th className="px-3 py-3">Submitted</th>
                    <th className="px-3 py-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplicants.map((applicant) => {
                    const existing = assignmentByApplicationId.get(applicant.id)
                    const selectable = !existing && assessment.status === 'published'
                    return (
                      <tr key={applicant.id} className={existing ? 'bg-slate-50' : undefined}>
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            disabled={!selectable}
                            checked={selectedApplicationIds.includes(applicant.id)}
                            onChange={() => toggleApplication(applicant.id)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-slate-900">{applicant.first_name} {applicant.last_name}</p>
                          <p className="mt-1 text-xs text-slate-500">{applicant.email}</p>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={statusTone(applicant.status)}>{applicant.status}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          {existing ? <Badge tone={statusTone(existing.status)}>{existing.status}</Badge> : <Badge tone="neutral">not sent</Badge>}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{existing ? formatDate(existing.assigned_at) : '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{existing ? formatDate(existing.submitted_at) : '-'}</td>
                        <td className="px-3 py-3 text-slate-700">{existing?.percentage == null ? '-' : `${Math.round(existing.percentage)}%`}</td>
                      </tr>
                    )
                  })}
                  {!filteredApplicants.length ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">No candidates found for this job.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  )
}
