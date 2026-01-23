import Link from 'next/link'
import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>

      <GoogleSignInButton />

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Forgot your password?
        </Link>
      </div>
    </AuthCard>
  )
}
