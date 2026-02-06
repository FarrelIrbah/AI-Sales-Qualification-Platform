---
phase: "04"
plan: "02"
subsystem: "ai-analysis"
tags: [gemini, ai, prompts, server-actions, api, drizzle]
dependency-graph:
  requires: ["04-01-schemas"]
  provides: ["lead-analyzer-ai", "analysis-actions", "analyze-api"]
  affects: ["04-03-ui", "05-dashboard"]
tech-stack:
  added: []
  patterns: ["ai-prompt-with-zod-validation", "server-actions-with-auth", "api-endpoint-with-db-save"]
key-files:
  created:
    - "src/lib/ai/prompts/lead-analyzer.ts"
    - "src/lib/analysis/actions.ts"
    - "src/app/api/analyze/route.ts"
  modified: []
decisions:
  - id: "04-02-01"
    title: "AI prompt formatting helpers"
    choice: "Created formatCompanyData and formatIcpProfile helpers for readable AI context"
    rationale: "Structured text format is more reliable for Gemini than raw JSON objects"
  - id: "04-02-02"
    title: "maxOutputTokens: 2048"
    choice: "Limited AI output to 2048 tokens"
    rationale: "Prevents cost explosion on verbose responses while allowing full analysis"
  - id: "04-02-03"
    title: "Auto-save company on analyze"
    choice: "API endpoint creates company record if companyId not provided"
    rationale: "Seamless flow from extraction to analysis without separate save step"
metrics:
  duration: "~12 minutes"
  completed: "2026-02-07"
---

# Phase 4 Plan 2: AI Analysis Core Summary

**Gemini-powered lead analyzer with server actions for CRUD and API endpoint orchestrating extraction-to-analysis flow**

## Performance

- **Duration:** ~12 minutes
- **Started:** 2026-02-07
- **Completed:** 2026-02-07
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- AI prompt module that generates comprehensive lead analysis (scores, insights, pitches, objections)
- Server actions for saving/retrieving analyses with authentication
- API endpoint that orchestrates full flow: auth -> ICP lookup -> company save -> AI analysis -> save result

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Lead Analyzer AI Prompt** - `18f5e33` (feat)
2. **Task 2: Create Analysis Server Actions** - `47962b4` (feat)
3. **Task 3: Create Analysis API Endpoint** - `1dffe31` (feat)

## Files Created

| File | Description |
|------|-------------|
| `src/lib/ai/prompts/lead-analyzer.ts` | AI prompt module with `analyzeLeadWithAI` function |
| `src/lib/analysis/actions.ts` | Server actions: createAnalysis, getAnalysis, getAnalysesForCompany |
| `src/app/api/analyze/route.ts` | POST /api/analyze endpoint |

## Technical Details

### Lead Analyzer AI Prompt (`lead-analyzer.ts`)

- System prompt instructs Gemini to act as B2B sales analyst
- Generates 6 component scores: Industry Fit, Size Fit, Tech Fit, Need Signals, Location Fit, Growth Signals
- Includes company insights, 2-3 pitch angles, and 1-4 predicted objections
- Uses `extractJson` helper to parse markdown-wrapped JSON responses
- Validates output against `analysisResultSchema` from 04-01
- Returns `null` on failure (caller handles fallback)

### Server Actions (`actions.ts`)

| Action | Description |
|--------|-------------|
| `createAnalysis(companyId, icpProfileId, result)` | Saves analysis to DB, returns analysisId |
| `getAnalysis(analysisId)` | Retrieves analysis by ID with ownership check |
| `getAnalysesForCompany(companyId)` | Gets all analyses for a company, ordered by date |
| `getUserIcpProfile()` | Helper to get current user's ICP profile |

All actions verify authentication and ownership via Drizzle queries.

### API Endpoint (`route.ts`)

Request flow:
1. Authenticate user (401 if not)
2. Get user's ICP profile (400 if not found)
3. Create company record if no companyId provided
4. Call `analyzeLeadWithAI(companyData, icpProfile)`
5. Save via `createAnalysis()`
6. Return `{ analysisId, companyId, analysis }`

Error handling:
- 401: Not authenticated
- 400: No ICP profile / missing required fields
- 500: AI analysis failed / save failed

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Structured text format for AI context | More reliable parsing than raw JSON for Gemini |
| maxOutputTokens: 2048 | Cost control while allowing full analysis |
| Auto-save company on analyze | Seamless user flow without separate save step |
| Ownership verification in all actions | Security: users can only access their own data |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## Verification Results

- [x] `npx tsc --noEmit` passes
- [x] AI prompt follows icp-parser.ts pattern
- [x] Server actions have 'use server' directive
- [x] API endpoint follows extract/route.ts pattern
- [x] Key links verified:
  - `analyzeLeadWithAI` called in API route
  - `db.insert(analyses)` in createAnalysis action

## Next Phase Readiness

**Ready for 04-03:** Analysis UI components can now:

- Call `/api/analyze` to run analysis on extracted company data
- Use `getAnalysis` to fetch results by ID
- Display all fields: leadScore, icpMatchPercentage, componentScores, insights, pitchAngles, objections

**Integration point:** The analyze page from Phase 3 should call this endpoint after extraction completes.

---

*Phase: 04-ai-analysis*
*Plan: 02*
*Completed: 2026-02-07*
