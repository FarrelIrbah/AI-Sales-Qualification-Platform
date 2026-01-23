'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
import { signUp } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  })

  async function onSubmit(data: SignUpInput) {
    setError(null)
    const result = await signUp(data)

    if (result?.needsEmailConfirmation) {
      // Account created, but email confirmation required
      setEmailSent(true)
      return
    }

    if (result?.error) {
      // Handle Supabase rate limit errors with friendlier message
      if (result.error.toLowerCase().includes('rate limit') ||
          result.error.toLowerCase().includes('email rate limit')) {
        setError(
          'Email rate limit exceeded. Please wait a few minutes and try again, ' +
          'or use Google sign-in to continue immediately.'
        )
      } else {
        setError(result.error)
      }
    }
    // If no error and no needsEmailConfirmation, the action will redirect
  }

  // Show confirmation message after signup when email confirmation is required
  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-primary/10 rounded-md">
          <p className="font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a confirmation link to <strong>{getValues('email')}</strong>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Click the link in your email to activate your account.
          If you don&apos;t see it, check your spam folder.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setEmailSent(false)}
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must be 8+ characters with uppercase, lowercase, and number
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
