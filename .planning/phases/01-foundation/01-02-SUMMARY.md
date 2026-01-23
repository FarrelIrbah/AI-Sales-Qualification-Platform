---
phase: 01-foundation
plan: 02
subsystem: database
tags: [drizzle, postgresql, supabase, rls, triggers]

dependency-graph:
  requires: []
  provides:
    - profiles-schema
    - drizzle-client
    - rls-policies
    - auto-profile-trigger
  affects:
    - 01-03 (auth server actions will query profiles)
    - 01-05 (protected routes will check profile)

tech-stack:
  added:
    - drizzle-orm
    - drizzle-kit
    - postgres (pg driver)
  patterns:
    - connection-pooler-config
    - security-definer-triggers
    - row-level-security

key-files:
  created:
    - src/lib/db/schema.ts
    - src/lib/db/index.ts
    - drizzle.config.ts
    - supabase/migrations/0001_create_profiles.sql
  modified:
    - package.json

decisions:
  - id: wave-1-parallel-execution
    choice: Created files independently without waiting for 01-01
    rationale: Wave 1 plans designed for parallel execution; files can be created independently

metrics:
  duration: 5m 18s
  completed: 2026-01-23
---

# Phase 01 Plan 02: Database Schema Summary

Drizzle ORM schema for profiles with RLS policies and auto-creation trigger on auth.users insert.

## One-liner

Profiles table with UUID primary key, RLS owner-only access, and SECURITY DEFINER trigger for automatic profile creation on signup.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| cb337c8 | feat | Create Drizzle schema and database client |
| cf1f9ec | feat | Create profiles table migration with RLS and triggers |

## Tasks Completed

### Task 1: Create Drizzle schema and database client

**Files created:**
- `src/lib/db/schema.ts` - Profiles table schema with typed columns
- `src/lib/db/index.ts` - Database client with connection pooler config
- `drizzle.config.ts` - Drizzle Kit configuration

**Key exports:**
- `profiles` - Table definition
- `Profile` - Select type (inferred from schema)
- `NewProfile` - Insert type (inferred from schema)
- `db` - Drizzle client instance

**npm scripts added:**
- `db:generate` - Generate migrations from schema changes
- `db:push` - Push schema to database
- `db:studio` - Open Drizzle Studio for database browsing

### Task 2: Create profiles table migration with RLS and trigger

**File created:**
- `supabase/migrations/0001_create_profiles.sql`

**SQL components:**
1. **profiles table** - UUID primary key references auth.users with CASCADE delete
2. **RLS policies** - Two policies for authenticated users:
   - "Users can view own profile" (SELECT where id = auth.uid())
   - "Users can update own profile" (UPDATE where id = auth.uid())
3. **handle_new_user trigger** - SECURITY DEFINER function that auto-creates profile row on auth.users INSERT
4. **update_updated_at trigger** - Automatically updates updated_at column on profile changes
5. **profiles_email_idx** - Index for email lookups

## Verification Notes

**Task 1 verification:**
- `npm run db:generate` cannot be verified until Plan 01-01 installs drizzle-kit dependency
- Files created correctly and will work once dependencies are installed

**Task 2 verification:**
- SQL must be executed manually in Supabase Dashboard > SQL Editor
- After execution, verify:
  - Table visible in Table Editor
  - RLS lock icon visible
  - Triggers visible in Database > Triggers

## Deviations from Plan

None - plan executed exactly as written.

## Notes for Integration

**For Plan 01-01:**
- drizzle-orm and postgres packages must be installed
- drizzle-kit must be installed as dev dependency
- These are already specified in 01-01 plan

**For User:**
- Execute `supabase/migrations/0001_create_profiles.sql` in Supabase SQL Editor before testing auth flows
- The trigger is critical - without it, signups succeed in auth.users but profiles won't exist

## Next Phase Readiness

Ready for Plan 01-03 (Auth Server Actions) which will:
- Query profiles table after authentication
- Use Profile type for type safety
- Rely on RLS policies for security
