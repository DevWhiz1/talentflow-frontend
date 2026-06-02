import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Plus, Send, Trash2 } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input, Select } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getAdminHrJobs, getAdminJobApplicants } from '../../services/jobService'
import type { AdminJobApplicant } from '../../types/jobApplication'
import {
  assignAssessment,
  createAssessment,
  getAssessmentAssignments,
  getAssessments,
  reviewProjectSubmission,
  updateAssessment,
  uploadAssessmentFile,
  type Assessment,
  type AssessmentPayload,
  type AssessmentQuestion,
  type AssignmentListItem,
} from '../../services/assessmentService'
import { getErrorMessage } from '../../utils/errors'

const emptyQuestion = (): AssessmentQuestion => ({
  question_text: '',
  question_type: 'mcq',
  options: ['', '', '', ''],
  correct_answer: '',
  marks: 1,
})

const initialForm: AssessmentPayload = {
  job_id: 0,
  title: '',
  description: '',
  assessment_type: 'mcq',
  status: 'draft',
  passing_percentage: 60,
  time_limit_seconds: 1800,
  instructions: '',
  questions: [emptyQuestion()],
  show_result_to_candidate: false,
  project_requirements: '',
  project_deliverables: '',
  project_deadline_hours: 72,
  project_submission_instructions: '',
  reference_files: [],
  allow_late_submission: false,
}

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function formatPercent(value?: number | null): string {
  return value == null ? '-' : `${Math.round(value)}%`
}

function statusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (['accepted', 'shortlist', 'published'].includes(status)) return 'success'
  if (['submitted', 'reviewed', 'in_progress'].includes(status)) return 'info'
  if (['rejected', 'expired'].includes(status)) return 'danger'
  if (['needs_review', 'draft'].includes(status)) return 'warning'
  return 'neutral'
}

function FieldTextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string
  value?: string
  onChange: (value: string) => void
  rows?: number
}): JSX.Element {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      />
    </label>
  )
}

export function AdminAssessmentsPage(): JSX.Element {
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [applicants, setApplicants] = useState<AdminJobApplicant[]>([])
  const [form, setForm] = useState<AssessmentPayload>(initialForm)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAssessment = useMemo(
    () => assessments.find((assessment) => assessment.id === selectedAssessmentId) || null,
    [assessments, selectedAssessmentId],
  )

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const [jobList, assessmentList, assignmentList] = await Promise.all([
        getAdminHrJobs(),
        getAssessments(),
        getAssessmentAssignments(),
      ])
      setJobs(jobList)
      setAssessments(assessmentList)
      setAssignments(assignmentList)
      if (!form.job_id && jobList[0]) {
        setForm((current) => ({ ...current, job_id: jobList[0].id }))
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Unable to load assessments'))
    } finally {
      setIsLoading(false)
    }
  }, [form.job_id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const loadApplicants = async (): Promise<void> => {
      const assessment = selectedAssessment
      if (!assessment) {
        setApplicants([])
        return
      }
      try {
        setApplicants(await getAdminJobApplicants(assessment.job_id))
      } catch {
        setApplicants([])
      }
    }
    void loadApplicants()
  }, [selectedAssessment])

  const updateQuestion = (index: number, patch: Partial<AssessmentQuestion>): void => {
    setForm((current) => ({
      ...current,
      questions: (current.questions || []).map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string): void => {
    const question = form.questions?.[questionIndex]
    if (!question) return
    const options = [...question.options]
    options[optionIndex] = value
    updateQuestion(questionIndex, { options, correct_answer: question.correct_answer === question.options[optionIndex] ? value : question.correct_answer })
  }

  const handleSave = async (status: 'draft' | 'published'): Promise<void> => {
    if (!form.job_id || !form.title.trim()) {
      showToast({ title: 'Missing details', description: 'Select a job and add an assessment title.', variant: 'error' })
      return
    }

    try {
      setIsSaving(true)
      await createAssessment({
        ...form,
        status,
        questions: form.assessment_type === 'mcq' ? form.questions : [],
        time_limit_seconds: form.assessment_type === 'mcq' ? form.time_limit_seconds : null,
        project_deadline_hours: form.assessment_type === 'project' ? form.project_deadline_hours : null,
      })
      showToast({ title: status === 'published' ? 'Assessment published' : 'Draft saved', variant: 'success' })
      setForm({ ...initialForm, job_id: form.job_id })
      await loadData()
    } catch (saveError) {
      showToast({ title: 'Could not save assessment', description: getErrorMessage(saveError), variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async (assessment: Assessment): Promise<void> => {
    try {
      await updateAssessment(assessment.id, { status: 'published' })
      showToast({ title: 'Assessment published', variant: 'success' })
      await loadData()
    } catch (publishError) {
      showToast({ title: 'Could not publish', description: getErrorMessage(publishError), variant: 'error' })
    }
  }

  const toggleCandidate = (candidateId: number): void => {
    setSelectedCandidateIds((current) =>
      current.includes(candidateId) ? current.filter((id) => id !== candidateId) : [...current, candidateId],
    )
  }

  const handleAssign = async (assignAll = false): Promise<void> => {
    if (!selectedAssessment) return
    try {
      await assignAssessment(selectedAssessment.id, {
        assign_all: assignAll,
        candidate_ids: assignAll ? undefined : selectedCandidateIds,
      })
      showToast({ title: 'Invitations sent', description: 'Selected candidates were assigned successfully.', variant: 'success' })
      setSelectedCandidateIds([])
      setAssignments(await getAssessmentAssignments())
    } catch (assignError) {
      showToast({ title: 'Could not assign assessment', description: getErrorMessage(assignError), variant: 'error' })
    }
  }

  const handleReferenceUpload = async (file?: File): Promise<void> => {
    if (!file) return
    try {
      const fileUrl = await uploadAssessmentFile(file)
      setForm((current) => ({
        ...current,
        reference_files: [...(current.reference_files || []), { name: file.name, url: fileUrl }],
      }))
      showToast({ title: 'Reference file uploaded', variant: 'success' })
    } catch (uploadError) {
      showToast({ title: 'Could not upload file', description: getErrorMessage(uploadError), variant: 'error' })
    }
  }

  const handleReview = async (assignmentId: number, score: number, feedback: string, recommendation: string): Promise<void> => {
    try {
      await reviewProjectSubmission(assignmentId, { score, feedback, recommendation, status: recommendation === 'reject' ? 'rejected' : 'reviewed' })
      showToast({ title: 'Project reviewed', variant: 'success' })
      setAssignments(await getAssessmentAssignments())
    } catch (reviewError) {
      showToast({ title: 'Could not save review', description: getErrorMessage(reviewError), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Assessments" description="Create tests, assign them to job applicants, and review scorecards.">
      {isLoading ? (
        <Card className="p-6 text-sm text-slate-600">Loading assessments...</Card>
      ) : error ? (
        <Card className="p-6">
          <p className="font-semibold text-slate-900">Unable to load assessments</p>
          <p className="mt-2 text-sm text-rose-600">{error}</p>
          <Button className="mt-4" onClick={() => void loadData()}>Retry</Button>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Create Assessment</h2>
                  <p className="text-sm text-slate-600">Build an MCQ test or a project task connected to a job.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Select label="Related Job" value={form.job_id} onChange={(event) => setForm({ ...form, job_id: Number(event.target.value) })}>
                  <option value={0}>Select job</option>
                  {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                </Select>
                <Select label="Assessment Type" value={form.assessment_type} onChange={(event) => setForm({ ...form, assessment_type: event.target.value as 'mcq' | 'project' })}>
                  <option value="mcq">MCQ-Based Assessment</option>
                  <option value="project">Project-Based Assessment</option>
                </Select>
                <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                {form.assessment_type === 'mcq' ? (
                  <Input label="Duration (minutes)" type="number" min={1} value={Math.round((form.time_limit_seconds || 0) / 60)} onChange={(event) => setForm({ ...form, time_limit_seconds: Number(event.target.value) * 60 })} />
                ) : (
                  <Input label="Deadline (hours)" type="number" min={1} value={form.project_deadline_hours || 0} onChange={(event) => setForm({ ...form, project_deadline_hours: Number(event.target.value) })} />
                )}
                <Input label="Passing Percentage" type="number" min={0} max={100} value={form.passing_percentage || 0} onChange={(event) => setForm({ ...form, passing_percentage: Number(event.target.value) })} />
                <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={form.show_result_to_candidate} onChange={(event) => setForm({ ...form, show_result_to_candidate: event.target.checked })} />
                  Show result to candidate
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <FieldTextArea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <FieldTextArea label="Instructions" value={form.instructions} onChange={(value) => setForm({ ...form, instructions: value })} />
              </div>

              {form.assessment_type === 'mcq' ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">MCQ Questions</h3>
                    <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, questions: [...(form.questions || []), emptyQuestion()] })}>
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                  {(form.questions || []).map((question, questionIndex) => (
                    <div key={questionIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex gap-3">
                        <Input label={`Question ${questionIndex + 1}`} value={question.question_text} onChange={(event) => updateQuestion(questionIndex, { question_text: event.target.value })} />
                        <Input className="w-24" label="Marks" type="number" min={1} value={question.marks} onChange={(event) => updateQuestion(questionIndex, { marks: Number(event.target.value) })} />
                        <button type="button" className="mt-7 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-white" onClick={() => setForm({ ...form, questions: (form.questions || []).filter((_, index) => index !== questionIndex) })}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <input type="radio" checked={question.correct_answer === option && option !== ''} onChange={() => updateQuestion(questionIndex, { correct_answer: option })} />
                            <input value={option} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} placeholder={`Option ${optionIndex + 1}`} className="min-w-0 flex-1 text-sm outline-none" />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  <FieldTextArea label="Project Requirements" value={form.project_requirements} onChange={(value) => setForm({ ...form, project_requirements: value })} />
                  <FieldTextArea label="Expected Deliverables" value={form.project_deliverables} onChange={(value) => setForm({ ...form, project_deliverables: value })} />
                  <FieldTextArea label="Submission Instructions" value={form.project_submission_instructions} onChange={(value) => setForm({ ...form, project_submission_instructions: value })} />
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Reference Files</span>
                    <input
                      type="file"
                      onChange={(event) => void handleReferenceUpload(event.target.files?.[0])}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                    {form.reference_files?.length ? (
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        {form.reference_files.map((file) => <p key={file.url}>{file.name}</p>)}
                      </div>
                    ) : null}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={form.allow_late_submission} onChange={(event) => setForm({ ...form, allow_late_submission: event.target.checked })} />
                    Allow late submission
                  </label>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button disabled={isSaving} variant="secondary" onClick={() => void handleSave('draft')}>Save Draft</Button>
                <Button disabled={isSaving} onClick={() => void handleSave('published')}><CheckCircle2 className="mr-2 h-4 w-4" /> Publish</Button>
              </div>
            </Card>
          </section>

          <section className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Assessment Library</h2>
              <div className="mt-4 space-y-3">
                {assessments.length === 0 ? <p className="text-sm text-slate-600">No assessments created yet.</p> : null}
                {assessments.map((assessment) => (
                  <button key={assessment.id} type="button" onClick={() => setSelectedAssessmentId(assessment.id)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{assessment.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{assessment.assessment_type.toUpperCase()} · {assessment.total_questions || 'Project'} items</p>
                      </div>
                      <Badge tone={statusTone(assessment.status)}>{assessment.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {assessment.status === 'draft' ? <Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); void handlePublish(assessment) }}>Publish</Button> : null}
                      <Button size="sm" onClick={(event) => { event.stopPropagation(); setSelectedAssessmentId(assessment.id) }}><Send className="mr-2 h-4 w-4" /> Assign</Button>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {selectedAssessment ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">Assign to Candidates</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedAssessment.title}</p>
                <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                  {applicants.map((applicant) => (
                    <label key={applicant.candidate_id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <span>
                        <span className="block font-medium text-slate-900">{applicant.first_name} {applicant.last_name}</span>
                        <span className="text-slate-500">{applicant.email}</span>
                      </span>
                      <input type="checkbox" checked={selectedCandidateIds.includes(applicant.candidate_id)} onChange={() => toggleCandidate(applicant.candidate_id)} />
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="secondary" onClick={() => void handleAssign(true)}>Assign All</Button>
                  <Button disabled={selectedCandidateIds.length === 0} onClick={() => void handleAssign(false)}>Assign Selected</Button>
                </div>
              </Card>
            ) : null}

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Scorecards & Project Review</h2>
              <div className="mt-4 space-y-3">
                {assignments.map((assignment) => (
                  <ReviewRow key={assignment.id} assignment={assignment} onReview={handleReview} />
                ))}
              </div>
            </Card>
          </section>
        </div>
      )}
    </AppShell>
  )
}

function ReviewRow({
  assignment,
  onReview,
}: {
  assignment: AssignmentListItem
  onReview: (assignmentId: number, score: number, feedback: string, recommendation: string) => Promise<void>
}): JSX.Element {
  const [score, setScore] = useState(assignment.hr_score || 0)
  const [feedback, setFeedback] = useState(assignment.hr_feedback || '')
  const [recommendation, setRecommendation] = useState(assignment.recommendation || 'needs_review')

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{assignment.candidate_name}</p>
          <p className="mt-1 text-sm text-slate-500">{assignment.assessment_title} · {assignment.job_title}</p>
          <p className="mt-1 text-xs text-slate-500">Assigned {formatDate(assignment.assigned_at)} · Due {formatDate(assignment.due_at)}</p>
        </div>
        <Badge tone={statusTone(assignment.status)}>{assignment.status}</Badge>
      </div>
      {assignment.assessment_type === 'mcq' ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <span className="rounded-lg bg-white p-2">Score: {assignment.obtained_marks ?? '-'}</span>
          <span className="rounded-lg bg-white p-2">Percent: {formatPercent(assignment.percentage)}</span>
          <span className="rounded-lg bg-white p-2">Result: {assignment.passed == null ? '-' : assignment.passed ? 'Pass' : 'Fail'}</span>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[110px,1fr,140px]">
            <Input label="Score" type="number" min={0} value={score} onChange={(event) => setScore(Number(event.target.value))} />
            <Input label="Feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
            <Select label="Decision" value={recommendation} onChange={(event) => setRecommendation(event.target.value)}>
              <option value="needs_review">Needs Review</option>
              <option value="shortlist">Shortlist</option>
              <option value="maybe">Maybe</option>
              <option value="reject">Reject</option>
            </Select>
          </div>
          <Button size="sm" disabled={!assignment.submitted_at} onClick={() => void onReview(assignment.id, score, feedback, recommendation)}>Save Review</Button>
        </div>
      )}
    </div>
  )
}
