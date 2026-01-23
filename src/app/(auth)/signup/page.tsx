import Link from 'next/link'
import { AuthCard } from '@/components/auth/auth-card'
import { SignupForm } from '@/components/auth/signup-form'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { Separator } from '@/components/ui/separator'

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Get started with LeadQual"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          or
        </span>
      </div>

      <GoogleSignInButton />
    </AuthCard>
  )
}
