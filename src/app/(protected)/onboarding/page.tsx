import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_completed_onboarding')
    .eq('id', user.id)
    .single()

  if (profile?.has_completed_onboarding) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to LeadQual!</h1>
        <p className="text-muted-foreground mt-2">
          Let&apos;s set up your Ideal Customer Profile to get personalized lead analysis.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">ICP Setup (Coming in Phase 2)</h2>
        <p className="text-muted-foreground">
          The ICP wizard will guide you through defining your ideal customer.
          For now, you can skip to the dashboard.
        </p>

        <Button asChild>
          <Link href="/dashboard">Continue to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
