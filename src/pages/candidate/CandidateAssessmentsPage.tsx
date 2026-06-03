import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, ExternalLink, FileCheck2, Play, Send } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import {
  getCandidateAssessmentDetail,
  getMyAssessments,
  startMCQAssessment,
  submitMCQAssessment,
  submitProjectAssessment,
  uploadAssessmentFile,
  type AssignmentListItem,
  type CandidateAssessmentDetail,
  type MCQStartResponse,
  type Scorecard,
} from '../../services/assessmentService'
import { getErrorMessage } from '../../utils/errors'

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  const date = new Date(hasTimezone ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value?: string | null): string {
  const date = parseApiDate(value)
  return date ? date.toLocaleString() : '-'
}

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(seconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function tone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (['submitted', 'reviewed', 'accepted'].includes(status)) return 'success'
  if (['in_progress'].includes(status)) return 'info'
  if (['rejected', 'expired'].includes(status)) return 'danger'
  if (['needs_review'].includes(status)) return 'warning'
  return 'neutral'
}

export function CandidateAssessmentsPage(): JSX.Element {
  const { inviteToken } = useParams<{ inviteToken?: string }>()
  return inviteToken ? <CandidateAssessmentDetailView inviteToken={inviteToken} /> : <CandidateAssessmentList />
}

function CandidateAssessmentList(): JSX.Element {
  const [items, setItems] = useState<AssignmentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)
        setItems(await getMyAssessments())
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Unable to load assessments'))
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <AppShell role="candidate" title="Assessments" description="Complete assigned tests and project tasks from hiring teams.">
      {isLoading ? (
        <Card className="p-6 text-sm text-slate-600">Loading assessments...</Card>
      ) : error ? (
        <Card className="p-6 text-sm text-rose-600">{error}</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.length === 0 ? (
            <Card className="p-6">
              <p className="font-semibold text-slate-900">No assessments assigned</p>
              <p className="mt-2 text-sm text-slate-600">When HR assigns a test or project, it will appear here.</p>
            </Card>
          ) : null}
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.assessment_title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.job_title}</p>
                </div>
                <Badge tone={tone(item.status)}>{item.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <span className="rounded-lg bg-slate-50 p-2">Type: {item.assessment_type.toUpperCase()}</span>
                <span className="rounded-lg bg-slate-50 p-2">Due: {formatDate(item.due_at)}</span>
              </div>
              <Link to={`/user/assessments/${item.invite_token}`} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-slate-800">
                Open Assessment <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}

function CandidateAssessmentDetailView({ inviteToken }: { inviteToken: string }): JSX.Element {
  const { showToast } = useToast()
  const [detail, setDetail] = useState<CandidateAssessmentDetail | null>(null)
  const [started, setStarted] = useState<MCQStartResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [scorecard, setScorecard] = useState<Scorecard | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [projectForm, setProjectForm] = useState({ github_url: '', live_demo_url: '', document_url: '', file_url: '', notes: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      setDetail(await getCandidateAssessmentDetail(inviteToken))
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Unable to load assessment'))
    } finally {
      setIsLoading(false)
    }
  }, [inviteToken])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const assessment = detail?.assessment
  const isMCQ = assessment?.assessment_type === 'mcq'
  const currentQuestion = started?.questions[activeIndex]

  const endsAt = useMemo(() => parseApiDate(started?.ends_at)?.getTime() ?? null, [started?.ends_at])

  const submitMCQ = useCallback(async (): Promise<void> => {
    if (!isMCQ || scorecard || isSubmitting) return
    try {
      setIsSubmitting(true)
      const result = await submitMCQAssessment(inviteToken, answers)
      setScorecard(result)
      await loadDetail()
      showToast({ title: 'Assessment submitted', variant: 'success' })
    } catch (submitError) {
      showToast({ title: 'Could not submit assessment', description: getErrorMessage(submitError), variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, inviteToken, isMCQ, isSubmitting, loadDetail, scorecard, showToast])

  useEffect(() => {
    if (!endsAt || scorecard) return
    const timer = window.setInterval(() => {
      const nextRemaining = Math.ceil((endsAt - Date.now()) / 1000)
      setRemainingSeconds(Math.max(nextRemaining, 0))
      if (nextRemaining <= 0) {
        window.clearInterval(timer)
        void submitMCQ()
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [endsAt, scorecard, submitMCQ])

  const handleStart = async (): Promise<void> => {
    try {
      const response = await startMCQAssessment(inviteToken)
      setStarted(response)
      const responseEndsAt = parseApiDate(response.ends_at)?.getTime()
      if (responseEndsAt) setRemainingSeconds(Math.max(Math.ceil((responseEndsAt - Date.now()) / 1000), 0))
    } catch (startError) {
      showToast({ title: 'Could not start assessment', description: getErrorMessage(startError), variant: 'error' })
    }
  }

  const handleProjectSubmit = async (): Promise<void> => {
    try {
      setIsSubmitting(true)
      const result = await submitProjectAssessment(inviteToken, projectForm)
      setScorecard(result)
      await loadDetail()
      showToast({ title: 'Project submitted', variant: 'success' })
    } catch (submitError) {
      showToast({ title: 'Could not submit project', description: getErrorMessage(submitError), variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProjectFileUpload = async (file?: File): Promise<void> => {
    if (!file) return
    try {
      const fileUrl = await uploadAssessmentFile(file)
      setProjectForm((current) => ({ ...current, file_url: fileUrl }))
      showToast({ title: 'File uploaded', variant: 'success' })
    } catch (uploadError) {
      showToast({ title: 'Could not upload file', description: getErrorMessage(uploadError), variant: 'error' })
    }
  }

  return (
    <AppShell role="candidate" title="Assessment" description="Review instructions and submit your work before the deadline.">
      {isLoading ? (
        <Card className="p-6 text-sm text-slate-600">Loading assessment...</Card>
      ) : error || !detail || !assessment ? (
        <Card className="p-6 text-sm text-rose-600">{error || 'Assessment not found'}</Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{detail.job_title}</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">{assessment.title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">{assessment.description || assessment.instructions || 'Please complete this assessment carefully.'}</p>
              </div>
              <Badge tone={tone(detail.assignment.status)}>{detail.assignment.status}</Badge>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <span className="rounded-lg bg-slate-50 p-3">Type: {assessment.assessment_type.toUpperCase()}</span>
              <span className="rounded-lg bg-slate-50 p-3">Due: {formatDate(detail.assignment.due_at)}</span>
            </div>
          </Card>

          {scorecard && detail.result_visible ? <ScorecardView scorecard={scorecard} /> : null}

          {detail.already_submitted ? (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <FileCheck2 className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">Submission received</p>
                  <p className="mt-1 text-sm text-slate-600">This assessment cannot be submitted again.</p>
                </div>
              </div>
            </Card>
          ) : isMCQ ? (
            <Card className="p-6">
              {!started ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Ready to start</h2>
                    <p className="mt-1 text-sm text-slate-600">The timer starts after you click start. You can navigate between questions before submitting.</p>
                  </div>
                  <Button disabled={!detail.can_submit} onClick={() => void handleStart()}><Play className="mr-2 h-4 w-4" /> Start Test</Button>
                </div>
              ) : currentQuestion ? (
                <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Clock className="h-4 w-4" /> {remainingSeconds == null ? '-' : formatSeconds(remainingSeconds)}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
                      {started.questions.map((question, index) => {
                        const key = String(question.question_id || index + 1)
                        return (
                          <button key={key} type="button" onClick={() => setActiveIndex(index)} className={`h-10 rounded-lg text-sm font-semibold ${activeIndex === index ? 'bg-black text-white' : answers[key] ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-700'}`}>
                            {index + 1}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Question {activeIndex + 1}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{currentQuestion.question_text}</h2>
                    <div className="mt-5 space-y-3">
                      {currentQuestion.options.map((option) => {
                        const key = String(currentQuestion.question_id || activeIndex + 1)
                        return (
                          <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm hover:bg-slate-50">
                            <input type="radio" checked={answers[key] === option} onChange={() => setAnswers({ ...answers, [key]: option })} />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button variant="secondary" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}>Previous</Button>
                      <Button variant="secondary" disabled={activeIndex === started.questions.length - 1} onClick={() => setActiveIndex((index) => Math.min(index + 1, started.questions.length - 1))}>Next</Button>
                      <Button disabled={isSubmitting} onClick={() => void submitMCQ()}><Send className="mr-2 h-4 w-4" /> Submit</Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Project Details</h2>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-700">
                <div className="rounded-xl bg-slate-50 p-4"><span className="font-semibold">Requirements:</span><br />{assessment.project_requirements || '-'}</div>
                <div className="rounded-xl bg-slate-50 p-4"><span className="font-semibold">Deliverables:</span><br />{assessment.project_deliverables || '-'}</div>
                <div className="rounded-xl bg-slate-50 p-4"><span className="font-semibold">Submission instructions:</span><br />{assessment.project_submission_instructions || '-'}</div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input label="GitHub Link" value={projectForm.github_url} onChange={(event) => setProjectForm({ ...projectForm, github_url: event.target.value })} />
                <Input label="Live Demo Link" value={projectForm.live_demo_url} onChange={(event) => setProjectForm({ ...projectForm, live_demo_url: event.target.value })} />
                <Input label="Document Link" value={projectForm.document_url} onChange={(event) => setProjectForm({ ...projectForm, document_url: event.target.value })} />
                <Input label="File URL" value={projectForm.file_url} onChange={(event) => setProjectForm({ ...projectForm, file_url: event.target.value })} />
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Upload File</span>
                <input
                  type="file"
                  onChange={(event) => void handleProjectFileUpload(event.target.files?.[0])}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
                <textarea value={projectForm.notes} onChange={(event) => setProjectForm({ ...projectForm, notes: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" />
              </label>
              <Button className="mt-5" disabled={!detail.can_submit || isSubmitting} onClick={() => void handleProjectSubmit()}>Submit Project</Button>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  )
}

function ScorecardView({ scorecard }: { scorecard: Scorecard }): JSX.Element {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Final Scorecard</h2>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <span className="rounded-lg bg-slate-50 p-3">Score: {scorecard.obtained_marks ?? scorecard.hr_score ?? '-'}</span>
        <span className="rounded-lg bg-slate-50 p-3">Percentage: {scorecard.percentage == null ? '-' : `${Math.round(scorecard.percentage)}%`}</span>
        <span className="rounded-lg bg-slate-50 p-3">Recommendation: {scorecard.recommendation || '-'}</span>
      </div>
    </Card>
  )
}
