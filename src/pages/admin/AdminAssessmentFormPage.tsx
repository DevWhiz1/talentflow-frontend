import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Plus, Trash2, Sparkles, Bot, PenTool, Loader2, Sliders } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Button, Card, Input, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import {
  createAssessment,
  generateAIAssessment,
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

function TextArea({ label, value, onChange, rows = 4, placeholder }: { label: string; value?: string; onChange: (value: string) => void; rows?: number; placeholder?: string }): JSX.Element {
  return (
    <label className="block w-full">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-black focus:ring-2 focus:ring-black/10"
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

  // AI Module State
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai')
  const [aiTopic, setAiTopic] = useState('')
  const [aiNumQuestions, setAiNumQuestions] = useState(10)
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
  const [aiInstructions, setAiInstructions] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

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
        setCreationMode('manual')
      } else if (jobList[0]) {
        setForm((current) => ({ ...current, job_id: jobList[0].id }))
        setAiTopic(jobList[0].title)
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

  const handleJobChange = (jobId: number): void => {
    setForm((current) => ({ ...current, job_id: jobId }))
    const selectedJob = jobs.find((j) => j.id === jobId)
    if (selectedJob) {
      setAiTopic(selectedJob.title)
    }
  }

  const handleGenerateAI = async (): Promise<void> => {
    const topicToUse = aiTopic.trim() || jobs.find((j) => j.id === form.job_id)?.title || ''
    if (!topicToUse) {
      showToast({
        title: 'Topic or Role required',
        description: 'Please specify the target topic, role, or select a job for AI generation.',
        variant: 'error',
      })
      return
    }

    try {
      setIsGeneratingAI(true)
      const res = await generateAIAssessment({
        job_id: form.job_id || undefined,
        topic_or_role: topicToUse,
        assessment_type: form.assessment_type,
        num_questions: aiNumQuestions,
        difficulty: aiDifficulty,
        additional_instructions: aiInstructions.trim() || undefined,
      })

      setForm((current) => ({
        ...current,
        title: res.title || current.title || `${topicToUse} Assessment`,
        description: res.description || current.description,
        instructions: res.instructions || current.instructions,
        passing_percentage: res.passing_percentage || current.passing_percentage,
        time_limit_seconds: res.time_limit_seconds || current.time_limit_seconds,
        questions: res.questions?.length ? res.questions : current.questions,
        project_requirements: res.project_requirements || current.project_requirements,
        project_deliverables: res.project_deliverables || current.project_deliverables,
        project_submission_instructions: res.project_submission_instructions || current.project_submission_instructions,
      }))

      showToast({
        title: 'AI Generation Complete!',
        description: `Successfully generated ${res.questions?.length || 0} questions with AI. You can review and customize below.`,
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'AI Generation Failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

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
    <AppShell
      role="admin"
      title={isEditing ? 'Edit Assessment' : 'Create Assessment'}
      description="Create customized candidate assessments using AI generation or custom questions."
    >
      <div className="space-y-6">
        {/* Choice Header Bar: Create with AI vs Build Own */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Generate with AI Card */}
          <button
            type="button"
            onClick={() => setCreationMode('ai')}
            className={`group relative flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
              creationMode === 'ai'
                ? 'border-teal-500 bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-white shadow-md ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/80'
            }`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
              creationMode === 'ai'
                ? 'bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/25'
                : 'bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-700'
            }`}>
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Generate with AI</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  creationMode === 'ai'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  AI Powered
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Automatically generate MCQs, skills assessment, or project specs based on job role & difficulty.
              </p>
            </div>
          </button>

          {/* Build Manually Card */}
          <button
            type="button"
            onClick={() => setCreationMode('manual')}
            className={`group relative flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
              creationMode === 'manual'
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50/90 via-sky-50/40 to-white shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80'
            }`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
              creationMode === 'manual'
                ? 'bg-gradient-to-tr from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
            }`}>
              <PenTool className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Build Manually (With Own)</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  creationMode === 'manual'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  Custom
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Craft your own questions, set marks, upload files, and define instructions from scratch.
              </p>
            </div>
          </button>
        </div>


        {/* AI Module Parameters Section */}
        {creationMode === 'ai' && (
          <Card className="relative overflow-hidden border-teal-200/80 bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/30 p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-teal-100 pb-4">
              <Bot className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">AI Assessment Generator Parameters</h2>
            </div>


            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select label="Related Job" value={form.job_id} onChange={(event) => handleJobChange(Number(event.target.value))}>
                <option value={0}>Select job (optional context)</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
              </Select>

              <Input
                label="Target Role / Topic / Tech Stack"
                placeholder="e.g. React.js Developer, Python FastAPI, Data Analyst"
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
              />

              <Select
                label="Assessment Type"
                value={form.assessment_type}
                onChange={(event) => setForm({ ...form, assessment_type: event.target.value as 'mcq' | 'project' })}
              >
                <option value="mcq">MCQ-Based Assessment</option>
                <option value="project">Project-Based Assessment</option>
              </Select>

              {form.assessment_type === 'mcq' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Number of Questions"
                    value={aiNumQuestions}
                    onChange={(event) => setAiNumQuestions(Number(event.target.value))}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </Select>

                  <Select
                    label="Difficulty Level"
                    value={aiDifficulty}
                    onChange={(event) => setAiDifficulty(event.target.value as 'easy' | 'medium' | 'hard' | 'mixed')}
                  >
                    <option value="mixed">Mixed (Balanced)</option>
                    <option value="easy">Easy (Junior)</option>
                    <option value="medium">Medium (Mid-Level)</option>
                    <option value="hard">Hard (Senior)</option>
                  </Select>
                </div>
              ) : (
                <Select
                  label="Difficulty Level"
                  value={aiDifficulty}
                  onChange={(event) => setAiDifficulty(event.target.value as 'easy' | 'medium' | 'hard' | 'mixed')}
                >
                  <option value="mixed">Mixed / Intermediate</option>
                  <option value="easy">Beginner / Junior Project</option>
                  <option value="medium">Mid-Level Practical Project</option>
                  <option value="hard">Advanced Senior System Design</option>
                </Select>
              )}
            </div>

            <div className="mt-4">
              <TextArea
                label="Custom Instructions / Prompt (Optional)"
                placeholder="Specify specific concepts, topics, frameworks, or guidelines you want AI to focus on (e.g. Focus on state management, hooks, and performance optimization)..."
                value={aiInstructions}
                onChange={(value) => setAiInstructions(value)}
                rows={3}
              />
            </div>

            <div className="mt-5 flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                Clicking generate will craft the complete assessment and populate the form below.
              </p>
              <Button
                disabled={isGeneratingAI}
                onClick={() => void handleGenerateAI()}
                className="bg-black text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Assessment with AI
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Form Details Card */}
        <Card className="p-6">
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading assessment form...</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Assessment Configuration</h3>
                {form.questions?.length && form.assessment_type === 'mcq' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <Sliders className="h-3.5 w-3.5" />
                    {form.questions.length} Questions Loaded
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Related Job" value={form.job_id} onChange={(event) => handleJobChange(Number(event.target.value))}>
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
                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">MCQ Questions</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, questions: [...(form.questions || []), emptyQuestion()] })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                  {(form.questions || []).map((question, questionIndex) => (
                    <div key={questionIndex} className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition-all hover:bg-slate-50 space-y-4">
                      {/* Question Text Area & Controls */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1 w-full min-w-0">
                          <TextArea
                            label={`Question ${questionIndex + 1}`}
                            placeholder="Enter the full question statement..."
                            value={question.question_text}
                            onChange={(value) => updateQuestion(questionIndex, { question_text: value })}
                            rows={2}
                          />
                        </div>
                        <div className="flex items-end gap-3 shrink-0 self-stretch sm:self-auto">
                          <Input
                            containerClassName="w-28"
                            label="Marks"
                            type="number"
                            min={1}
                            value={question.marks}
                            onChange={(event) => updateQuestion(questionIndex, { marks: Number(event.target.value) })}
                          />
                          <button
                            type="button"
                            title="Delete question"
                            className="mb-0.5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-sm shrink-0"
                            onClick={() => setForm({ ...form, questions: (form.questions || []).filter((_, index) => index !== questionIndex) })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid gap-3 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                            question.correct_answer === option && option !== ''
                              ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}>
                            <input
                              type="radio"
                              name={`correct-ans-${questionIndex}`}
                              checked={question.correct_answer === option && option !== ''}
                              onChange={() => updateQuestion(questionIndex, { correct_answer: option })}
                              className="h-4 w-4 text-black focus:ring-black"
                            />
                            <input
                              value={option}
                              onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="min-w-0 flex-1 text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                            />
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

              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <Button variant="secondary" onClick={() => navigate(appRoutes.adminAssessments)}>Cancel</Button>
                <Button disabled={isSaving} variant="secondary" onClick={() => void saveAssessment('draft')}>Save Draft</Button>
                <Button disabled={isSaving} onClick={() => void saveAssessment('published')}><CheckCircle2 className="mr-2 h-4 w-4" />Publish Assessment</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
