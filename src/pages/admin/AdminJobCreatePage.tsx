import type { JSX } from 'react'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Sparkles } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Button, Card, Input, Select } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { createJob, generateJobDescription } from '../../services/jobService'
import { getErrorMessage } from '../../utils/errors'

const createJobSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
  prompt: z.string().min(12, 'Write a brief HR prompt for AI generation'),
  description: z.string().min(40, 'Job description should be at least 40 characters'),
  requirements: z.string().min(10, 'Requirements should be at least 10 characters'),
  skills: z.string().min(3, 'Skills are required'),
  minExperienceYears: z.coerce.number().min(0, 'Must be 0 or more').max(40, 'Invalid experience value'),
  location: z.string().min(2, 'Location is required'),
  salaryRange: z.string().min(2, 'Salary range is required'),
  employmentType: z.string().min(1, 'Select employment type'),
  workMode: z.string().min(1, 'Select work mode'),
  companyName: z.string().min(2, 'Company name is required'),
  department: z.string().min(2, 'Department is required'),
  openingsCount: z.coerce.number().int().min(1, 'At least 1 opening is required').max(200, 'Invalid openings count'),
})

type CreateJobFormValues = z.infer<typeof createJobSchema>

const defaultValues: CreateJobFormValues = {
  title: '',
  prompt: '',
  description: '',
  requirements: '',
  skills: '',
  minExperienceYears: 0,
  location: '',
  salaryRange: '',
  employmentType: '',
  workMode: '',
  companyName: '',
  department: '',
  openingsCount: 1,
}

export function AdminJobCreatePage(): JSX.Element {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues,
  })

  const title = watch('title')
  const skills = watch('skills')
  const minExperienceYears = watch('minExperienceYears')
  const location = watch('location')
  const employmentType = watch('employmentType')
  const salaryRange = watch('salaryRange')
  const prompt = watch('prompt')

  const handleGenerateDescription = async (): Promise<void> => {
    if (!prompt || prompt.trim().length < 12) {
      showToast({
        title: 'Prompt required',
        description: 'Please write a clear HR prompt so AI can generate the job description.',
        variant: 'error',
      })
      return
    }

    try {
      setIsGenerating(true)
      const generatedDescription = await generateJobDescription({
        prompt,
        title,
        skills,
        min_experience_years: minExperienceYears,
        location,
        employment_type: employmentType,
        salary_range: salaryRange,
      })

      setValue('description', generatedDescription, { shouldValidate: true, shouldDirty: true })

      showToast({
        title: 'Description generated',
        description: 'AI drafted a professional job description. Review and edit before publishing.',
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'Generation failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const onSubmit = async (values: CreateJobFormValues): Promise<void> => {
    if (!user?.id) {
      showToast({
        title: 'Session issue',
        description: 'Please sign in again to continue.',
        variant: 'error',
      })
      return
    }

    try {
      await createJob({
        title: values.title,
        description: values.description,
        requirements: values.requirements,
        skills: values.skills,
        min_experience_years: values.minExperienceYears,
        experience_level: values.minExperienceYears >= 5 ? 'senior' : values.minExperienceYears >= 2 ? 'mid' : 'junior',
        location: values.location,
        salary_range: values.salaryRange,
        employment_type: values.employmentType,
        work_mode: values.workMode,
        company_name: values.companyName,
        department: values.department,
        openings_count: values.openingsCount,
        is_salary_visible: true,
        status: 'open',
      })

      showToast({
        title: 'Job posted',
        description: 'Your job details have been saved successfully.',
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'Unable to post job',
        description: getErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <AppShell
      role="admin"
      title="Create a Job Posting"
      description="Fill complete hiring details and use AI to craft a polished professional description in seconds."
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Job title" error={errors.title?.message} {...register('title')} />
              <Input label="Department" error={errors.department?.message} {...register('department')} />
              <Input label="Company name" error={errors.companyName?.message} {...register('companyName')} />
              <Input label="Location" error={errors.location?.message} {...register('location')} />
              <Input label="Skills (comma separated)" className="sm:col-span-2" error={errors.skills?.message} {...register('skills')} />
              <Input label="Minimum experience (years)" type="number" min={0} error={errors.minExperienceYears?.message} {...register('minExperienceYears')} />
              <Input label="Salary range" placeholder="e.g. PKR 200,000 - PKR 350,000 / month" error={errors.salaryRange?.message} {...register('salaryRange')} />
              <Select label="Employment type" error={errors.employmentType?.message} {...register('employmentType')}>
                <option value="">Select type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </Select>
              <Select label="Work mode" error={errors.workMode?.message} {...register('workMode')}>
                <option value="">Select mode</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </Select>
              <Input label="Openings" type="number" min={1} error={errors.openingsCount?.message} {...register('openingsCount')} />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Requirements</span>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                placeholder="Write candidate requirements, qualifications, and must-have criteria."
                {...register('requirements')}
              />
              {errors.requirements?.message ? <p className="mt-2 text-sm text-rose-600">{errors.requirements.message}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Job description</span>
              <textarea
                rows={8}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                placeholder="Use AI or write manually. You can edit generated text before posting."
                {...register('description')}
              />
              {errors.description?.message ? <p className="mt-2 text-sm text-rose-600">{errors.description.message}</p> : null}
            </label>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Posting job...' : 'Publish Job'}
            </Button>
          </form>
        </Card>

        <Card className="space-y-5 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">AI assistant</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Generate professional description</h2>
            <p className="mt-2 text-sm text-slate-600">
              Describe what you need in plain language. AI will convert it into a structured and professional job description.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">HR prompt</span>
            <textarea
              rows={7}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              placeholder="Example: We need a senior React developer for our SaaS platform, strong TypeScript, API integration, and product mindset..."
              {...register('prompt')}
            />
            {errors.prompt?.message ? <p className="mt-2 text-sm text-rose-600">{errors.prompt.message}</p> : null}
          </label>

          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => {
              void handleGenerateDescription()
            }}
            disabled={isGenerating}
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Generating with OpenAI...' : 'Generate with OpenAI'}
          </Button>

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            Tip: Fill title, skills, location, experience, and salary first. AI will use those details to generate a better result.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
