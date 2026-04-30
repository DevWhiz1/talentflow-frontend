import type { JSX } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthPageShell } from '../../components/auth/AuthPageShell'
import { Button, Input, Select } from '../../components/ui'
import { appRoutes, dashboardPathByRole, profilePathByRole } from '../../constants/routes'
import { storageKeys } from '../../constants/storage'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errors'
import { writeStoredString } from '../../utils/storage'
import type { LoginPayload } from '../../types/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'candidate']),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const { showToast } = useToast()

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
  const signupLink = authQueryString ? `${appRoutes.signup}?${authQueryString}` : appRoutes.signup

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'candidate',
    },
  })

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      const payload: LoginPayload = values
      const response = await login(payload)
      showToast({
        title: 'Signed in successfully',
        description: `Welcome back, ${response.user.name}.`,
        variant: 'success',
      })

      if (response.user.role === 'candidate' && companySlug) {
        writeStoredString(storageKeys.candidateCompanySlug, companySlug)
      }

      if (response.user.role === 'candidate' && redirectPath) {
        navigate(redirectPath, { replace: true })
        return
      }

      const destination = response.user.profileCompleted
        ? dashboardPathByRole[response.user.role]
        : profilePathByRole[response.user.role]
      navigate(destination, { replace: true })
    } catch (error) {
      showToast({
        title: 'Login failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <AuthPageShell
      title="Sign in to TalentFlow"
      subtitle="Access a clean HR workspace with role-based dashboards, reusable workflows, and a production-ready frontend architecture."
      footerText="New to the platform?"
      footerLinkText="Create an account"
      footerLinkTo={signupLink}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
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
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label="Account type" error={errors.role?.message} {...register('role')}>
            <option value="admin">Admin / HR</option>
            <option value="candidate">Candidate</option>
          </Select>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthPageShell>
  )
}
