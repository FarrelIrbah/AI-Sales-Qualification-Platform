# Phase 1: Foundation - Research

**Researched:** 2026-01-23
**Domain:** Authentication, Next.js 16 App Router, Supabase Auth, shadcn/ui
**Confidence:** HIGH

## Summary

This research covers the foundation phase for LeadQual, focusing on authentication setup with Next.js 16 and Supabase Auth. The stack uses Next.js 16.x (App Router) with Supabase PostgreSQL, Drizzle ORM, Tailwind CSS 4.x, and shadcn/ui.

**Key findings:**
1. Next.js 16 introduced a **breaking change**: `middleware.ts` is renamed to `proxy.ts` with Node.js runtime only
2. Supabase Auth with `@supabase/ssr` package provides cookie-based authentication that integrates with Next.js server-side rendering
3. shadcn/ui provides ready-to-use login/signup blocks that can be installed via CLI
4. User profiles should be stored in a separate `public.profiles` table with a trigger to auto-create on signup
5. Password reset and Google OAuth flows are well-supported through Supabase Auth APIs

**Primary recommendation:** Use Supabase's `@supabase/ssr` package for cookie-based auth with `proxy.ts` for session refresh. Create a profiles table with RLS policies for extended user data.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.x | React framework | Official recommendation, App Router architecture |
| `@supabase/supabase-js` | 2.x | Supabase client | Official Supabase SDK |
| `@supabase/ssr` | latest | Server-side auth | Cookie-based auth for SSR/SSG, replaces deprecated auth-helpers |
| `drizzle-orm` | latest | Type-safe ORM | Lightweight, serverless-ready, excellent TypeScript support |
| `postgres` | latest | PostgreSQL driver | Fastest JS client for PostgreSQL |
| `tailwindcss` | 4.x | CSS framework | CSS-first configuration, optimal for Next.js |
| `@tailwindcss/postcss` | latest | PostCSS plugin | Required for Tailwind CSS 4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | latest | Form state management | All forms with validation |
| `zod` | latest | Schema validation | Type-safe form validation with react-hook-form |
| `drizzle-kit` | latest (dev) | Migration tooling | Database schema migrations |

### shadcn/ui Components Needed
| Component | Purpose |
|-----------|---------|
| `button` | Form submission, actions |
| `input` | Email, password fields |
| `label` | Form field labels |
| `form` | Form wrapper with react-hook-form |
| `card` | Auth page containers |
| `separator` | Visual dividers (e.g., "or continue with") |
| Login block (`login-01` or `login-02`) | Complete login page layout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | NextAuth.js | More complex setup, but more provider options |
| Drizzle ORM | Prisma | Prisma is heavier, but more mature ecosystem |
| shadcn/ui | Radix UI directly | shadcn provides styled components, Radix is unstyled |

**Installation:**
```bash
# Core packages
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm postgres
npm install -D drizzle-kit
npm install react-hook-form zod @hookform/resolvers

# Tailwind CSS 4
npm install tailwindcss @tailwindcss/postcss postcss

# shadcn/ui (run init then add components)
npx shadcn@latest init
npx shadcn@latest add button input label form card separator
npx shadcn@latest add login-01  # or login-02 for split layout
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/                    # Auth route group (no layout nesting)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── update-password/
│   │       └── page.tsx
│   ├── (protected)/               # Protected route group
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx             # Auth check layout
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts           # OAuth callback handler
│   │   └── confirm/
│   │       └── route.ts           # Email confirmation handler
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui components
│   └── auth/                      # Auth-specific components
│       ├── login-form.tsx
│       ├── signup-form.tsx
│       ├── forgot-password-form.tsx
│       └── google-signin-button.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (singleton)
│   │   ├── server.ts              # Server client (per-request)
│   │   └── proxy.ts               # Proxy utilities for session refresh
│   └── db/
│       ├── index.ts               # Drizzle client
│       └── schema.ts              # Drizzle schema definitions
├── proxy.ts                       # Next.js 16 proxy (was middleware.ts)
└── drizzle.config.ts
```

### Pattern 1: Supabase Client Creation (Browser)
**What:** Singleton browser client for client components
**When to use:** Any client component needing Supabase access
**Example:**
```typescript
// Source: Supabase official docs - Setting up Server-Side Auth for Next.js
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Pattern 2: Supabase Client Creation (Server)
**What:** Per-request server client with cookie handling
**When to use:** Server Components, Route Handlers, Server Actions
**Example:**
```typescript
// Source: Supabase official docs - Setting up Server-Side Auth for Next.js
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore error - handled by proxy
          }
        },
      },
    }
  )
}
```

### Pattern 3: Proxy for Session Refresh (Next.js 16)
**What:** Automatic session token refresh on every request
**When to use:** Required for all authenticated apps
**Example:**
```typescript
// Source: Supabase docs + Next.js 16 upgrade guide
// proxy.ts (root of project - replaces middleware.ts in Next.js 16)
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - IMPORTANT: use getClaims() for validation
  await supabase.auth.getClaims()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 4: OAuth Callback Handler
**What:** Exchange OAuth code for session
**When to use:** Google OAuth and other social providers
**Example:**
```typescript
// Source: Supabase docs - Login with Google
// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  if (!next.startsWith('/')) next = '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### Pattern 5: Protected Route Layout
**What:** Server-side auth check for route groups
**When to use:** Any route requiring authentication
**Example:**
```typescript
// Source: Supabase docs - Server-Side Auth
// app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  return <>{children}</>
}
```

### Pattern 6: Drizzle Schema with Supabase Auth
**What:** Profiles table referencing auth.users
**When to use:** Extending user data beyond auth defaults
**Example:**
```typescript
// Source: Drizzle ORM docs + Supabase user management guide
// lib/db/schema.ts
import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { authenticatedRole, authUid } from 'drizzle-orm/supabase'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => sql`auth.users(id)`, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  pgPolicy('Users can view own profile', {
    for: 'select',
    to: authenticatedRole,
    using: sql`${table.id} = ${authUid}`,
  }),
  pgPolicy('Users can update own profile', {
    for: 'update',
    to: authenticatedRole,
    using: sql`${table.id} = ${authUid}`,
  }),
])
```

### Anti-Patterns to Avoid
- **Using getSession() for authorization:** Always use `getClaims()` or `getUser()` on the server - `getSession()` only reads the JWT without validation
- **Storing auth tokens in localStorage:** Use cookie-based auth with `@supabase/ssr` for security
- **Modifying auth.users table directly:** Create a separate profiles table in the public schema
- **Relying only on proxy/middleware for auth:** Verify auth at every data access point (defense-in-depth)
- **Using deprecated @supabase/auth-helpers:** Migrate to `@supabase/ssr` package

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT handling | Supabase Auth + `@supabase/ssr` | Handles refresh tokens, cookie security, PKCE flow |
| Password hashing | bcrypt implementation | Supabase Auth | Built-in secure hashing, rate limiting |
| Email verification | Custom email service | Supabase Auth email templates | Configurable templates, handles token expiry |
| OAuth flow | Manual OAuth implementation | `signInWithOAuth()` | Handles PKCE, state, redirects |
| Form validation | Manual validation | Zod + react-hook-form | Type-safe, declarative, good DX |
| Route protection | Custom auth checks everywhere | Route groups + layouts | Centralized, DRY, server-side |
| RLS policies | Application-level access control | Drizzle RLS + Supabase | Database-level security, can't be bypassed |

**Key insight:** Authentication has countless edge cases (token refresh, session fixation, CSRF, etc.). Supabase Auth handles these battle-tested scenarios while providing a simple API.

## Common Pitfalls

### Pitfall 1: CVE-2025-29927 - Middleware Authorization Bypass
**What goes wrong:** Attackers can bypass middleware auth checks using `x-middleware-subrequest` header
**Why it happens:** Vulnerability in Next.js middleware before 15.2.3
**How to avoid:** Upgrade to Next.js 16.x (or 15.2.3+), implement defense-in-depth (verify auth at data access points, not just proxy/middleware)
**Warning signs:** Relying solely on proxy.ts for authorization

### Pitfall 2: Using getSession() for Server Authorization
**What goes wrong:** Session data can be spoofed - it only reads JWT without validation
**Why it happens:** Misunderstanding session vs user validation
**How to avoid:** Use `getClaims()` (validates JWT signature) or `getUser()` (validates against database)
**Warning signs:** Using `getSession()` in Server Components or Route Handlers for authorization decisions

### Pitfall 3: Forgetting Async Params in Next.js 16
**What goes wrong:** Build errors or runtime crashes
**Why it happens:** Next.js 16 breaking change - params and searchParams are now async
**How to avoid:** Always `await props.params` and `await props.searchParams`
**Warning signs:** TypeScript errors about params not being awaitable

### Pitfall 4: Missing Proxy Configuration
**What goes wrong:** Sessions expire unexpectedly, users get logged out
**Why it happens:** Without proxy.ts, auth tokens aren't refreshed automatically
**How to avoid:** Always configure proxy.ts with session refresh logic
**Warning signs:** Users need to re-login frequently

### Pitfall 5: OAuth Callback URL Mismatch
**What goes wrong:** Google OAuth fails with redirect_uri_mismatch
**Why it happens:** URL in Google Console doesn't match Supabase callback URL
**How to avoid:** Add exact Supabase callback URL to Google Console authorized redirects
**Warning signs:** OAuth errors mentioning redirect URI

### Pitfall 6: Trigger Failures Blocking Signups
**What goes wrong:** User signup fails silently
**Why it happens:** Database trigger for profile creation has errors
**How to avoid:** Test trigger thoroughly, use `security definer` with explicit search_path
**Warning signs:** Users created in auth.users but not in profiles table

### Pitfall 7: Missing RLS on Profiles Table
**What goes wrong:** Any authenticated user can read/modify any profile
**Why it happens:** Forgetting to enable RLS or create policies
**How to avoid:** Always enable RLS and create appropriate policies
**Warning signs:** Users can see other users' data

### Pitfall 8: Using Relative URLs in Password Reset
**What goes wrong:** Password reset links don't work
**Why it happens:** Supabase requires absolute URLs for redirectTo
**How to avoid:** Always use full URLs including domain: `https://example.com/update-password`
**Warning signs:** Password reset emails have broken links

## Code Examples

Verified patterns from official sources:

### Sign Up with Email/Password
```typescript
// Source: Supabase docs - Password-based Auth
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: `${origin}/auth/callback`,
    data: {
      full_name: 'John Doe',
    },
  },
})
```

### Sign In with Email/Password
```typescript
// Source: Supabase docs - Password-based Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})
```

### Sign In with Google
```typescript
// Source: Supabase docs - Login with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

### Password Reset Flow
```typescript
// Source: Supabase docs - Password-based Auth
// Step 1: Request reset email
await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: `${origin}/update-password`,
})

// Step 2: Update password (after user clicks email link)
await supabase.auth.updateUser({ password: 'new-secure-password' })
```

### Sign Out
```typescript
// Source: Supabase docs
await supabase.auth.signOut()
```

### Database Trigger for Profile Creation (SQL)
```sql
-- Source: Supabase docs - Managing User Data
-- Run in Supabase SQL Editor or migration

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Drizzle Connection for Serverless
```typescript
// Source: Drizzle ORM docs - Connect Supabase
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use connection pooler URL with prepare: false for serverless
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle(client, { schema })
```

### Form with Zod Validation
```typescript
// Source: shadcn/ui Forms + react-hook-form + zod
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function useLoginForm() {
  return useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 (2025) | Rename file, export `proxy` function, Node.js only |
| `@supabase/auth-helpers` | `@supabase/ssr` | 2024 | Different client creation API |
| `getSession()` for auth | `getClaims()` for validation | 2024 | More secure JWT validation |
| Sync params/searchParams | Async `await params` | Next.js 16 (2025) | Must await all route params |
| `tailwind.config.js` | CSS-based config | Tailwind CSS 4 (Jan 2025) | Configure in CSS with `@import` |
| `experimental.turbopack` | `turbopack` (default) | Next.js 16 (2025) | Now default bundler |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`, no longer receives updates
- `middleware.ts`: Renamed to `proxy.ts` in Next.js 16 (still works but deprecated)
- `localStorage` for auth tokens: Use cookie-based auth for security
- Edge runtime for proxy: Next.js 16 proxy runs on Node.js only

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase SSR + Next.js 16 proxy.ts exact integration**
   - What we know: Supabase docs still reference `middleware.ts`, Next.js 16 uses `proxy.ts`
   - What's unclear: Whether Supabase has updated docs for Next.js 16 specifically
   - Recommendation: Use the same pattern with renamed file (`proxy.ts` + `proxy` export function)

2. **Email template customization timing**
   - What we know: Supabase provides default templates, custom SMTP recommended for production
   - What's unclear: Whether to customize templates in Phase 1 or defer
   - Recommendation: Use defaults for Phase 1, customize when needed (not auth-blocking)

## Sources

### Primary (HIGH confidence)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Client setup, proxy config, auth patterns
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - Breaking changes, proxy.ts migration
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) - Features, middleware to proxy rename
- [Supabase Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) - OAuth setup
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) - Sign up, sign in, password reset
- [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data) - Profiles table, triggers
- [Drizzle ORM Connect Supabase](https://orm.drizzle.team/docs/connect-supabase) - Connection setup
- [Drizzle ORM RLS](https://orm.drizzle.team/docs/rls) - Row-level security with Supabase

### Secondary (MEDIUM confidence)
- [shadcn/ui Login Blocks](https://ui.shadcn.com/blocks/login) - Login page layouts
- [Tailwind CSS Next.js Installation](https://tailwindcss.com/docs/guides/nextjs) - Tailwind 4 setup
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) - Component setup

### Tertiary (LOW confidence)
- Community discussions on Supabase proxy.ts migration - Patterns still being established

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation for all libraries
- Architecture: HIGH - Based on official Supabase and Next.js patterns
- Pitfalls: HIGH - CVE documented, other pitfalls from official troubleshooting guides
- Next.js 16 + Supabase integration: MEDIUM - proxy.ts is new, patterns adapting

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable technologies, but Next.js 16 is new)
