import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ExternalLink, Save } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input, Select } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import {
  addInterviewEvaluation,
  completeInterview,
  getInterview,
  getInterviewTimeline,
  updateInterviewFinalDecision,
} from '../../services/interviewService'
import type { Interview, InterviewTimeline } from '../../services/interviewService'
import { getErrorMessage } from '../../utils/errors'

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

function statusTone(status?: string | null): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (!status) return 'neutral'
  if (['Completed', 'Confirmed', 'Hired', 'Selected for Next Round'].includes(status)) return 'success'
  if (['Cancelled', 'Rejected', 'No Show'].includes(status)) return 'danger'
  if (['Rescheduled', 'On Hold'].includes(status)) return 'warning'
  return 'info'
}

function uniqueTimeline(timelineData: InterviewTimeline): InterviewTimeline {
  const seen = new Set<string>()
  return {
    ...timelineData,
    timeline: timelineData.timeline.filter((item) => {
      const key = [
        item.interview_round,
        item.interview_date,
        item.interviewer_name,
        item.interviewer_email,
      ].join('|')
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    }),
  }
}

export function AdminInterviewDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { interviewId } = useParams<{ interviewId: string }>()
  const { showToast } = useToast()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [timeline, setTimeline] = useState<InterviewTimeline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [evaluation, setEvaluation] = useState({
    communication_score: '',
    technical_score: '',
    problem_solving_score: '',
    culture_fit_score: '',
    confidence_score: '',
    overall_score: '',
    strengths: '',
    weaknesses: '',
    detailed_remarks: '',
    recommendation: 'Shortlist for next round',
  })
  const [finalDecision, setFinalDecision] = useState('On Hold')
  const [finalDecisionNotes, setFinalDecisionNotes] = useState('')

  const loadDetail = async (): Promise<void> => {
    const parsedId = Number.parseInt(interviewId || '', 10)
    if (Number.isNaN(parsedId)) {
      return
    }

    try {
      setIsLoading(true)
      const detail = await getInterview(parsedId)
      setInterview(detail)
      setEvaluation({
        communication_score: detail.communication_score?.toString() ?? '',
        technical_score: detail.technical_score?.toString() ?? '',
        problem_solving_score: detail.problem_solving_score?.toString() ?? '',
        culture_fit_score: detail.culture_fit_score?.toString() ?? '',
        confidence_score: detail.confidence_score?.toString() ?? '',
        overall_score: detail.overall_score?.toString() ?? '',
        strengths: detail.strengths ?? '',
        weaknesses: detail.weaknesses ?? '',
        detailed_remarks: detail.detailed_remarks ?? detail.interviewer_notes ?? '',
        recommendation: detail.recommendation ?? 'Shortlist for next round',
      })
      setFinalDecision(detail.final_decision ?? 'On Hold')
      setFinalDecisionNotes(detail.final_decision_notes ?? '')
      setTimeline(uniqueTimeline(await getInterviewTimeline(detail.candidate_id, detail.job_id)))
    } catch (error) {
      showToast({
        title: 'Unable to load interview',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDetail()
  }, [interviewId])

  const numberValue = (value: string): number | undefined => {
    if (!value) return undefined
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const saveEvaluation = async (): Promise<void> => {
    if (!interview) return
    try {
      const updated = await addInterviewEvaluation(interview.id, {
        communication_score: numberValue(evaluation.communication_score),
        technical_score: numberValue(evaluation.technical_score),
        problem_solving_score: numberValue(evaluation.problem_solving_score),
        culture_fit_score: numberValue(evaluation.culture_fit_score),
        confidence_score: numberValue(evaluation.confidence_score),
        overall_score: numberValue(evaluation.overall_score),
        strengths: evaluation.strengths || undefined,
        weaknesses: evaluation.weaknesses || undefined,
        detailed_remarks: evaluation.detailed_remarks || undefined,
        recommendation: evaluation.recommendation,
      })
      setInterview(updated)
      setTimeline(uniqueTimeline(await getInterviewTimeline(updated.candidate_id, updated.job_id)))
      showToast({ title: 'Evaluation saved', description: 'Remarks and ratings were updated.', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Unable to save evaluation', description: getErrorMessage(error, 'Please try again.'), variant: 'error' })
    }
  }

  const markCompleted = async (): Promise<void> => {
    if (!interview) return
    try {
      const updated = await completeInterview(interview.id)
      setInterview(updated)
      setTimeline(uniqueTimeline(await getInterviewTimeline(updated.candidate_id, updated.job_id)))
      showToast({ title: 'Interview completed', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Unable to complete interview', description: getErrorMessage(error, 'Please try again.'), variant: 'error' })
    }
  }

  const saveFinalDecision = async (): Promise<void> => {
    if (!interview) return
    try {
      const updatedTimeline = await updateInterviewFinalDecision(interview.candidate_id, interview.job_id, {
        final_decision: finalDecision,
        final_decision_notes: finalDecisionNotes || undefined,
      })
      setTimeline(uniqueTimeline(updatedTimeline))
      setInterview({ ...interview, final_decision: finalDecision, final_decision_notes: finalDecisionNotes })
      showToast({ title: 'Final decision saved', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Unable to save decision', description: getErrorMessage(error, 'Please try again.'), variant: 'error' })
    }
  }

  const updateEvaluation = (field: keyof typeof evaluation, value: string): void => {
    setEvaluation((current) => ({ ...current, [field]: value }))
  }

  return (
    <AppShell role="admin" title="Interview Details" description="Round evaluation, remarks, timeline, and final decision.">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(appRoutes.adminInterviewScheduled)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scheduled interviews
        </button>

        {isLoading || !interview ? (
          <Card className="p-6 text-sm text-slate-600">Loading interview details...</Card>
        ) : (
          <>
            <Card className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{interview.interview_round || 'Interview Round'}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Candidate #{interview.candidate_id} for Job #{interview.job_id}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={statusTone(interview.status)}>{interview.status || 'Scheduled'}</Badge>
                    <Badge tone="neutral">{interview.interview_type || interview.interview_mode || 'Interview'}</Badge>
                    <Badge tone="info">{formatDate(interview.interview_date)}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interview.meeting_link ? (
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-black bg-white px-3 text-sm font-medium text-black hover:bg-slate-100"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Meeting
                    </a>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={() => void markCompleted()}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Completed
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="p-5">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-semibold text-slate-900">Evaluation Form</h2>
                  <p className="mt-1 text-sm text-slate-600">Add interviewer/HR remarks and round recommendation.</p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Input label="Communication" type="number" min={0} max={10} value={evaluation.communication_score} onChange={(event) => updateEvaluation('communication_score', event.target.value)} />
                  <Input label="Technical Skill" type="number" min={0} max={10} value={evaluation.technical_score} onChange={(event) => updateEvaluation('technical_score', event.target.value)} />
                  <Input label="Problem Solving" type="number" min={0} max={10} value={evaluation.problem_solving_score} onChange={(event) => updateEvaluation('problem_solving_score', event.target.value)} />
                  <Input label="Culture Fit" type="number" min={0} max={10} value={evaluation.culture_fit_score} onChange={(event) => updateEvaluation('culture_fit_score', event.target.value)} />
                  <Input label="Confidence" type="number" min={0} max={10} value={evaluation.confidence_score} onChange={(event) => updateEvaluation('confidence_score', event.target.value)} />
                  <Input label="Overall Score" type="number" min={0} max={10} value={evaluation.overall_score} onChange={(event) => updateEvaluation('overall_score', event.target.value)} />
                  <Input label="Strengths" value={evaluation.strengths} onChange={(event) => updateEvaluation('strengths', event.target.value)} className="md:col-span-3" />
                  <Input label="Weaknesses" value={evaluation.weaknesses} onChange={(event) => updateEvaluation('weaknesses', event.target.value)} className="md:col-span-3" />
                  <Select label="Recommendation" value={evaluation.recommendation} onChange={(event) => updateEvaluation('recommendation', event.target.value)}>
                    <option>Shortlist for next round</option>
                    <option>Reject</option>
                    <option>Hold</option>
                    <option>Hire</option>
                  </Select>
                  <label className="md:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Detailed Remarks</span>
                    <textarea
                      value={evaluation.detailed_remarks}
                      onChange={(event) => updateEvaluation('detailed_remarks', event.target.value)}
                      className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    />
                  </label>
                  <div className="flex justify-end md:col-span-3">
                    <Button onClick={() => void saveEvaluation()}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Evaluation
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="p-5">
                  <h2 className="text-base font-semibold text-slate-900">Final Decision</h2>
                  <div className="mt-4 space-y-4">
                    <Select label="Decision" value={finalDecision} onChange={(event) => setFinalDecision(event.target.value)}>
                      <option>Hired</option>
                      <option>Rejected</option>
                      <option>On Hold</option>
                      <option>Offer Pending</option>
                      <option>Offer Accepted</option>
                      <option>Offer Declined</option>
                    </Select>
                    <label>
                      <span className="mb-2 block text-sm font-medium text-slate-700">Decision Notes</span>
                      <textarea
                        value={finalDecisionNotes}
                        onChange={(event) => setFinalDecisionNotes(event.target.value)}
                        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                    </label>
                    <Button className="w-full" onClick={() => void saveFinalDecision()}>Save Decision</Button>
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-base font-semibold text-slate-900">Round Details</h2>
                  <div className="mt-4 space-y-3 text-sm">
                    <p><span className="font-semibold text-slate-700">Interviewer:</span> {interview.interviewer_name || interview.interviewer_email || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Duration:</span> {interview.duration_minutes || 60} minutes</p>
                    <p><span className="font-semibold text-slate-700">Location:</span> {interview.location || interview.meeting_link || '-'}</p>
                    <p><span className="font-semibold text-slate-700">Instructions:</span> {interview.instructions || '-'}</p>
                  </div>
                </Card>
              </div>
            </div>

            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Timeline {timeline ? `- ${timeline.candidate_name} / ${timeline.job_title}` : ''}
              </h2>
              <div className="mt-4 space-y-3">
                {timeline?.timeline.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{index + 1}. {item.interview_round || 'Interview'}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.interview_date)} - {item.interviewer_name || 'Interviewer pending'}</p>
                      </div>
                      <Badge tone={statusTone(item.status)}>{item.status || 'Scheduled'}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">Score: {item.score ?? 'Pending'}</p>
                    <p className="mt-1 text-sm text-slate-700">Remarks: {item.remarks || 'Pending'}</p>
                    <p className="mt-1 text-sm text-slate-700">Recommendation: {item.recommendation || 'Pending'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
