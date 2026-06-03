import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Button, Card, Input, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import {
  createAssessment,
  getAssessment,
  updateAssessment,
  uploadAssessmentFile,
  type AssessmentPayload,
  type AssessmentQuestion,
} from '../../services/assessmentService'
import type { AdminHrJobListItem } from '../../services/jobService'
import { getAdminHrJobs } from '../../services/jobService'
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
  due_at: null,
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

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value?: string; onChange: (value: string) => void; rows?: number }): JSX.Element {
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

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toApiDateTime(value?: string | null): string | null {
  return value ? new Date(value).toISOString() : null
}

export function AdminAssessmentFormPage(): JSX.Element {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<AdminHrJobListItem[]>([])
  const [form, setForm] = useState<AssessmentPayload>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(assessmentId)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const jobList = await getAdminHrJobs()
      setJobs(jobList)
      if (assessmentId) {
        const assessment = await getAssessment(Number(assessmentId))
        setForm({
          job_id: assessment.job_id,
          title: assessment.title,
          description: assessment.description || '',
          assessment_type: assessment.assessment_type,
          status: assessment.status,
          passing_marks: assessment.passing_marks,
          passing_percentage: assessment.passing_percentage,
          time_limit_seconds: assessment.time_limit_seconds,
          due_at: assessment.due_at,
          instructions: assessment.instructions || '',
          questions: assessment.questions?.length ? assessment.questions : [emptyQuestion()],
          show_result_to_candidate: assessment.show_result_to_candidate,
          project_requirements: assessment.project_requirements || '',
          project_deliverables: assessment.project_deliverables || '',
          project_deadline_hours: assessment.project_deadline_hours,
          project_submission_instructions: assessment.project_submission_instructions || '',
          reference_files: assessment.reference_files || [],
          allow_late_submission: assessment.allow_late_submission,
        })
      } else if (jobList[0]) {
        setForm((current) => ({ ...current, job_id: jobList[0].id }))
      }
    } catch (error) {
      showToast({ title: 'Unable to load assessment form', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [assessmentId, showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

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
    const oldValue = options[optionIndex]
    options[optionIndex] = value
    updateQuestion(questionIndex, {
      options,
      correct_answer: question.correct_answer === oldValue ? value : question.correct_answer,
    })
  }

  const saveAssessment = async (status: 'draft' | 'published'): Promise<void> => {
    if (!form.job_id || !form.title.trim()) {
      showToast({ title: 'Missing details', description: 'Select a job and add an assessment title.', variant: 'error' })
      return
    }

    try {
      setIsSaving(true)
      const payload: AssessmentPayload = {
        ...form,
        status,
        questions: form.assessment_type === 'mcq' ? form.questions : [],
        time_limit_seconds: form.assessment_type === 'mcq' ? form.time_limit_seconds : null,
        due_at: toApiDateTime(form.due_at),
        project_deadline_hours: form.assessment_type === 'project' ? form.project_deadline_hours : null,
      }
      if (assessmentId) await updateAssessment(Number(assessmentId), payload)
      else await createAssessment(payload)
      showToast({ title: status === 'published' ? 'Assessment published' : 'Draft saved', variant: 'success' })
      navigate(appRoutes.adminAssessments)
    } catch (error) {
      showToast({ title: 'Could not save assessment', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const uploadReferenceFile = async (file?: File): Promise<void> => {
    if (!file) return
    try {
      const fileUrl = await uploadAssessmentFile(file)
      setForm((current) => ({
        ...current,
        reference_files: [...(current.reference_files || []), { name: file.name, url: fileUrl }],
      }))
      showToast({ title: 'Reference file uploaded', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Could not upload file', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title={isEditing ? 'Edit Assessment' : 'Create Assessment'} description="Build the assessment separately, then assign it from the library.">
      <Card className="p-6">
        {isLoading ? <p className="text-sm text-slate-600">Loading assessment form...</p> : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
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
              <Input label="Due Date" type="datetime-local" value={toDateTimeLocalValue(form.due_at)} onChange={(event) => setForm({ ...form, due_at: event.target.value || null })} />
              <Input label="Passing Percentage" type="number" min={0} max={100} value={form.passing_percentage || 0} onChange={(event) => setForm({ ...form, passing_percentage: Number(event.target.value) })} />
              <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.show_result_to_candidate} onChange={(event) => setForm({ ...form, show_result_to_candidate: event.target.checked })} />
                Show result to candidate
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <TextArea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
              <TextArea label="Instructions" value={form.instructions} onChange={(value) => setForm({ ...form, instructions: value })} />
            </div>

            {form.assessment_type === 'mcq' ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">MCQ Questions</h3>
                  <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, questions: [...(form.questions || []), emptyQuestion()] })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
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
                <TextArea label="Project Requirements" value={form.project_requirements} onChange={(value) => setForm({ ...form, project_requirements: value })} />
                <TextArea label="Expected Deliverables" value={form.project_deliverables} onChange={(value) => setForm({ ...form, project_deliverables: value })} />
                <TextArea label="Submission Instructions" value={form.project_submission_instructions} onChange={(value) => setForm({ ...form, project_submission_instructions: value })} />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Reference Files</span>
                  <input
                    type="file"
                    onChange={(event) => void uploadReferenceFile(event.target.files?.[0])}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                  />
                  {form.reference_files?.length ? <div className="mt-2 space-y-1 text-sm text-slate-600">{form.reference_files.map((file) => <p key={file.url}>{file.name}</p>)}</div> : null}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={form.allow_late_submission} onChange={(event) => setForm({ ...form, allow_late_submission: event.target.checked })} />
                  Allow late submission
                </label>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate(appRoutes.adminAssessments)}>Cancel</Button>
              <Button disabled={isSaving} variant="secondary" onClick={() => void saveAssessment('draft')}>Save Draft</Button>
              <Button disabled={isSaving} onClick={() => void saveAssessment('published')}><CheckCircle2 className="mr-2 h-4 w-4" />Publish</Button>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  )
}
