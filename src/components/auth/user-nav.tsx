'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'

interface UserNavProps {
  user: {
    email: string
    name: string | null
    avatarUrl: string | null
  }
}

export function UserNav({ user }: UserNavProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {user.name || user.email}
      </span>
      <form action={signOut}>
        <Button variant="outline" size="sm" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  )
}
