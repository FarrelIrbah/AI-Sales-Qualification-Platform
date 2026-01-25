import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IcpWizard } from '@/components/onboarding/icp-wizard'

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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to LeadQual!</h1>
        <p className="text-muted-foreground mt-2">
          Let&apos;s set up your Ideal Customer Profile for personalized lead analysis.
        </p>
      </div>

      <IcpWizard mode="onboarding" />
    </div>
  )
}
