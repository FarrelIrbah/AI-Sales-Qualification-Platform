---
phase: "04"
plan: "01"
subsystem: "ai-analysis"
tags: [zod, drizzle, database, schema, jsonb]
dependency-graph:
  requires: ["01-foundation", "02-icp", "03-extraction"]
  provides: ["analysis-schemas", "analyses-table"]
  affects: ["04-02-api", "04-03-ui", "05-dashboard"]
tech-stack:
  added: []
  patterns: ["zod-schema-validation", "jsonb-for-complex-data", "typed-drizzle-columns"]
key-files:
  created:
    - "src/lib/analysis/schemas.ts"
    - "supabase/migrations/0004_create_analyses.sql"
  modified:
    - "src/lib/db/schema.ts"
decisions:
  - id: "04-01-01"
    title: "Integer scores for queryability"
    choice: "Store leadScore and icpMatchPercentage as integers, not JSONB"
    rationale: "Enables filtering/sorting in Phase 5 dashboard (WHERE lead_score > 70)"
  - id: "04-01-02"
    title: "Manual migration creation"
    choice: "Created migration manually instead of using drizzle-kit generate"
    rationale: "drizzle-kit generates full schema migrations; needed incremental migration"
metrics:
  duration: "~10 minutes"
  completed: "2026-02-07"
---

# Phase 4 Plan 1: Analysis Data Schemas Summary

**One-liner:** Zod schemas for AI output validation + Drizzle analyses table with JSONB columns for component scores, insights, pitches, and objections.

## What Was Built

### Analysis Validation Schemas (`src/lib/analysis/schemas.ts`)

Created 5 Zod schemas matching the AI analysis output structure:

1. **componentScoreSchema** - Individual scoring component (name, score 0-100, weight, reasoning)
2. **pitchAngleSchema** - Pitch recommendation (headline, explanation, whyItWorks)
3. **predictedObjectionSchema** - Objection with response (objection, likelihood, recommendedResponse)
4. **companyInsightsSchema** - AI commentary (summary, strengths array, concerns array)
5. **analysisResultSchema** - Complete analysis combining all above

Exported TypeScript types for all schemas plus `getScoreLabel()` helper function.

### Database Schema (`src/lib/db/schema.ts`)

Added `analyses` table with:

- Foreign keys to `profiles`, `companies`, `icp_profiles` (all with cascade delete)
- Integer columns for `leadScore` and `icpMatchPercentage` (queryable)
- JSONB columns for complex data: `componentScores`, `insights`, `pitchAngles`, `objections`
- Standard timestamps (`createdAt`, `updatedAt`)

### Database Migration (`supabase/migrations/0004_create_analyses.sql`)

SQL migration ready for Supabase:

- CREATE TABLE with all columns
- ALTER TABLE for 3 foreign key constraints
- ON DELETE CASCADE behavior

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Flat integers for scores | Enables SQL WHERE/ORDER BY in dashboard queries |
| JSONB for complex data | Arrays and nested objects don't need direct SQL querying |
| Cascade delete on all FKs | Analysis results are meaningless without parent records |
| Manual migration file | drizzle-kit generates full schema, needed incremental |

## Deviations from Plan

### Blocking Issue Fixed

**drizzle-kit push failure** - The `drizzle-kit push` command failed due to a bug in drizzle-kit when pulling Supabase schema with constraints. Created manual migration file instead. Migration SQL is correct and ready for manual application via Supabase SQL Editor.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/analysis/schemas.ts` | Created - 5 Zod schemas, 5 types, helper function |
| `src/lib/db/schema.ts` | Added analyses table + imports |
| `supabase/migrations/0004_create_analyses.sql` | Created - SQL migration |

## Commits

| Hash | Message |
|------|---------|
| ee4b07c | feat(04-01): create analysis Zod schemas |
| 4388830 | feat(04-01): add analyses table to database schema |
| 0856aaa | feat(04-01): add analyses table migration |

## Next Phase Readiness

**Ready for 04-02:** All schemas and database structure in place. The AI analysis API can now:

- Import validation schemas to validate Gemini output
- Import database types to store results
- Run migration to have analyses table ready

**Migration Note:** Run `supabase/migrations/0004_create_analyses.sql` via Supabase SQL Editor before testing database operations.

## Verification Results

- [x] `npx tsc --noEmit` passes with no type errors
- [x] `src/lib/analysis/schemas.ts` exports all required types
- [x] `src/lib/db/schema.ts` includes analyses table
- [x] Migration file exists in supabase/migrations/
- [ ] Database has analyses table (pending manual migration)

---

*Completed: 2026-02-07*
*Duration: ~10 minutes*
