import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { AppShell } from '../../components/layout'
import { Button, Card, Input, Select } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { getAdminHrJobById, updateAdminHrJob } from '../../services/jobService'
import { getErrorMessage } from '../../utils/errors'

const editJobSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
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
  status: z.string().min(1, 'Select status'),
})

type EditJobFormValues = z.infer<typeof editJobSchema>

const defaultValues: EditJobFormValues = {
  title: '',
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
  status: 'open',
}

export function AdminHrJobEditPage(): JSX.Element {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isPageLoading, setIsPageLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditJobFormValues>({
    resolver: zodResolver(editJobSchema),
    defaultValues,
  })

  useEffect(() => {
    const loadJob = async (): Promise<void> => {
      if (!jobId) {
        setIsPageLoading(false)
        return
      }

      try {
        setIsPageLoading(true)
        const numericId = Number.parseInt(jobId, 10)
        if (Number.isNaN(numericId)) {
          throw new Error('Invalid job ID')
        }

        const data = await getAdminHrJobById(numericId)
        reset({
          title: data.title ?? '',
          description: data.description ?? '',
          requirements: data.requirements ?? '',
          skills: data.skills ?? '',
          minExperienceYears: data.min_experience_years ?? 0,
          location: data.location ?? '',
          salaryRange: data.salary_range ?? '',
          employmentType: data.employment_type ?? '',
          workMode: data.work_mode ?? '',
          companyName: data.company_name ?? '',
          department: data.department ?? '',
          openingsCount: data.openings_count ?? 1,
          status: data.status ?? 'open',
        })
      } catch (error) {
        showToast({
          title: 'Unable to load job',
          description: getErrorMessage(error),
          variant: 'error',
        })
      } finally {
        setIsPageLoading(false)
      }
    }

    void loadJob()
  }, [jobId, reset, showToast])

  const onSubmit = async (values: EditJobFormValues): Promise<void> => {
    if (!jobId) {
      showToast({
        title: 'Invalid job',
        description: 'Job id is missing from URL.',
        variant: 'error',
      })
      return
    }

    try {
      const numericId = Number.parseInt(jobId, 10)
      if (Number.isNaN(numericId)) {
        throw new Error('Invalid job ID')
      }

      await updateAdminHrJob(numericId, {
        title: values.title,
        description: values.description,
        requirements: values.requirements,
        skills: values.skills,
        min_experience_years: values.minExperienceYears,
        experience_level:
          values.minExperienceYears >= 5
            ? 'senior'
            : values.minExperienceYears >= 2
              ? 'mid'
              : 'junior',
        location: values.location,
        salary_range: values.salaryRange,
        employment_type: values.employmentType,
        work_mode: values.workMode,
        company_name: values.companyName,
        department: values.department,
        openings_count: values.openingsCount,
        status: values.status,
      })

      showToast({
        title: 'Job updated',
        description: 'Job details were updated successfully.',
        variant: 'success',
      })

      navigate(`/admin/hr/${numericId}`)
    } catch (error) {
      showToast({
        title: 'Update failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    }
  }

  if (isPageLoading) {
    return (
      <AppShell role="admin" title="Edit Job" description="Loading job details...">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading job data...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role="admin" title="Edit Job" description="Update job details and save changes.">
      <Card className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Job title" error={errors.title?.message} {...register('title')} />
            <Input label="Department" error={errors.department?.message} {...register('department')} />
            <Input label="Company name" error={errors.companyName?.message} {...register('companyName')} />
            <Input label="Location" error={errors.location?.message} {...register('location')} />
            <Input
              label="Skills (comma separated)"
              className="sm:col-span-2"
              error={errors.skills?.message}
              {...register('skills')}
            />
            <Input
              label="Minimum experience (years)"
              type="number"
              min={0}
              error={errors.minExperienceYears?.message}
              {...register('minExperienceYears')}
            />
            <Input
              label="Salary range"
              placeholder="e.g. PKR 200,000 - PKR 350,000 / month"
              error={errors.salaryRange?.message}
              {...register('salaryRange')}
            />
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
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Requirements</span>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="Write candidate requirements, qualifications, and must-have criteria."
              {...register('requirements')}
            />
            {errors.requirements?.message ? (
              <p className="mt-2 text-sm text-rose-600">{errors.requirements.message}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Job description</span>
            <textarea
              rows={8}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="Update full job description."
              {...register('description')}
            />
            {errors.description?.message ? (
              <p className="mt-2 text-sm text-rose-600">{errors.description.message}</p>
            ) : null}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(jobId ? `/admin/hr/${jobId}` : '/admin/hr')}
            >
              Cancel
            </Button>
            <Button type="submit" className="min-w-36" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  )
}
