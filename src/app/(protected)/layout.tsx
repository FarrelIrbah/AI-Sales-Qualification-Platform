import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserNav } from '@/components/auth/user-nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="font-bold text-xl">LeadQual</div>
          <UserNav
            user={{
              email: profile?.email || user.email || '',
              name: profile?.full_name || null,
              avatarUrl: profile?.avatar_url || null,
            }}
          />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
