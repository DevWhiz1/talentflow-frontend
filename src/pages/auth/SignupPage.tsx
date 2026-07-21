import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthPageShell } from '../../components/auth/AuthPageShell'
import { Button, Input, Select } from '../../components/ui'
import { appRoutes, dashboardPathByRole, profilePathByRole } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errors'
import { getCompanyJobs } from '../../services/jobService'
import type { SignupPayload } from '../../types/auth'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'candidate']),
})

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signup } = useAuth()
  const { showToast } = useToast()
  const [companyName, setCompanyName] = useState<string | undefined>()
  const [isLoadingCompany, setIsLoadingCompany] = useState(false)

  const redirectPath = searchParams.get('redirect')
  const companySlug = searchParams.get('company')
  const authQuery = new URLSearchParams()
  if (redirectPath) {
    authQuery.set('redirect', redirectPath)
  }
  if (companySlug) {
    authQuery.set('company', companySlug)
  }
  const authQueryString = authQuery.toString()
  const loginLink = authQueryString ? `${appRoutes.login}?${authQueryString}` : appRoutes.login

  // Fetch company name from company slug
  useEffect(() => {
    if (companySlug) {
      setIsLoadingCompany(true)
      getCompanyJobs(companySlug)
        .then((jobs) => {
          if (jobs.length > 0 && jobs[0].company_name) {
            setCompanyName(jobs[0].company_name)
          }
        })
        .catch(() => {
          // Failed to fetch company name, but continue
        })
        .finally(() => {
          setIsLoadingCompany(false)
        })
    }
  }, [companySlug])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema) as never,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'candidate',
    },
  })

  const onSubmit = async (values: SignupFormValues): Promise<void> => {
    try {
      const payload: SignupPayload = {
        ...values,
        company_name: companyName,
      }
      const response = await signup(payload)
      showToast({
        title: 'Account created',
        description: `Welcome, ${response.user.name}.`,
        variant: 'success',
      })

      // No need to save to local storage, company name is now in user profile

      if (response.user.role === 'candidate' && redirectPath) {
        navigate(redirectPath, { replace: true })
        return
      }

      const destination =
        response.user.role === 'candidate' && !response.user.profileCompleted
          ? profilePathByRole.candidate
          : dashboardPathByRole[response.user.role]
      navigate(destination, { replace: true })
    } catch (error) {
      showToast({
        title: 'Signup failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <AuthPageShell
      title="Create your TalentFlow account"
      subtitle="Set up a role-aware workspace for HR teams or candidates with validation, protected routes, and a modular frontend foundation."
      footerText="Already have an account?"
      footerLinkText="Sign in instead"
      footerLinkTo={loginLink}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <Input
            label="Full name"
            placeholder="Enter your name"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Create a secure password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label="Account type" error={errors.role?.message} {...register('role')}>
            <option value="candidate">Candidate</option>
            <option value="admin">Admin / HR</option>
          </Select>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : isLoadingCompany ? 'Preparing company context...' : 'Create account'}
        </Button>
      </form>
    </AuthPageShell>
  )
}
