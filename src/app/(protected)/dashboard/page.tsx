import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! You&apos;re signed in as {user?.email}
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
        <p className="text-muted-foreground">
          Your LeadQual dashboard will show analyzed leads here.
          Start by completing your ICP setup.
        </p>
      </div>
    </div>
  )
}
