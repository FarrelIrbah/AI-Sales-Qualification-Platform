---
phase: "02-icp-onboarding"
plan: "03"
subsystem: "icp-wizard-steps"
tags: ["react-hook-form", "useFieldArray", "server-actions", "api-routes", "drizzle"]

dependency-graph:
  requires: ["02-01"]
  provides: ["value-props-step", "objections-step", "icp-api", "parsing-actions"]
  affects: ["02-04"]

tech-stack:
  added: []
  patterns:
    - "useFieldArray for dynamic form arrays"
    - "Server actions with auth protection"
    - "Drizzle ORM for API routes"
    - "Upsert pattern for ICP save"

key-files:
  created:
    - src/components/ui/textarea.tsx
    - src/components/onboarding/steps/value-props-step.tsx
    - src/components/onboarding/steps/objections-step.tsx
    - src/lib/icp/actions.ts
    - src/app/api/icp/route.ts
  modified: []

decisions:
  - id: "comma-separated-differentiators"
    decision: "Use comma-separated input for differentiators array"
    rationale: "Simpler UX than tag input component, adequate for v1"
  - id: "optional-objections"
    decision: "Objections list starts empty with skip guidance"
    rationale: "Per schema objections are optional, empty state guides users"
  - id: "upsert-icp"
    decision: "API checks for existing ICP and updates or inserts"
    rationale: "Users have one ICP in v1, prevents duplicates"

metrics:
  duration: "3 minutes"
  completed: "2026-01-25"
---

# Phase 02 Plan 03: Value Props, Objections & ICP API Summary

**One-liner:** Value propositions and objections wizard steps with useFieldArray, 4 auth-protected server actions for AI parsing, and ICP CRUD API that updates onboarding flag on save.

## What Was Built

### 1. Textarea UI Component (src/components/ui/textarea.tsx)
- Standard shadcn/ui textarea component
- Consistent styling with Input component
- Used across wizard step forms

### 2. Value Props Step (src/components/onboarding/steps/value-props-step.tsx)
- Dynamic value proposition list using useFieldArray
- Each card has: headline (input), description (textarea), differentiators (comma-separated)
- AI input section for natural language parsing
- Add/remove propositions (minimum 1 required per schema)
- Props: `onAiParse`, `isAiParsing` for parent to control AI parsing

### 3. Objections Step (src/components/onboarding/steps/objections-step.tsx)
- Optional objections list (can be empty)
- Each card has: objection (textarea), suggestedResponse (textarea, optional)
- AI input section for natural language parsing
- Empty state with skip guidance
- Props: `onAiParse`, `isAiParsing` for parent to control AI parsing

### 4. Server Actions (src/lib/icp/actions.ts)
All 4 actions follow the same pattern:
1. Auth check (createClient, getUser)
2. If no user, throw Error('Unauthorized')
3. Call corresponding parse function from icp-parser
4. Return parsed result or null on error

Exports:
- `parseCompanyInfoAction(input: string)`
- `parseTargetCriteriaAction(input: string)`
- `parseValuePropsAction(input: string)`
- `parseObjectionsAction(input: string)`

### 5. ICP API Route (src/app/api/icp/route.ts)

**GET /api/icp:**
- Auth check, returns 401 if not authenticated
- Queries icpProfiles where userId = user.id
- Returns `{ data: IcpProfile | null }`

**POST /api/icp:**
- Auth check, returns 401 if not authenticated
- Validates body with fullIcpSchema, returns 400 on validation error
- Checks if ICP exists for user:
  - If exists: UPDATE with new data
  - If not exists: INSERT new row
- Updates profiles.hasCompletedOnboarding = true
- Returns `{ data: IcpProfile }`

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 5bef71d | feat | Add value propositions step component |
| d7ba165 | feat | Add objections step and server actions |
| 5e39f2a | feat | Add ICP API route for CRUD operations |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:
- [x] `npm run build` passes without errors
- [x] Step 3 renders with add/remove value propositions functionality
- [x] Step 4 renders with optional objections list
- [x] All 4 server actions are exported and callable
- [x] GET /api/icp returns ICP data or null
- [x] POST /api/icp saves valid ICP data and updates has_completed_onboarding

## Next Phase Readiness

Ready for 02-04 (Onboarding Integration):
- Steps 3 and 4 ready for wizard integration
- Server actions ready for AI parsing in wizard
- API route ready for form submission
- All TypeScript types align between schema, validation, and components

## Files Changed

```
src/components/ui/textarea.tsx              # New - Textarea UI component
src/components/onboarding/steps/value-props-step.tsx  # New - Step 3
src/components/onboarding/steps/objections-step.tsx   # New - Step 4
src/lib/icp/actions.ts                      # New - 4 server actions
src/app/api/icp/route.ts                    # New - GET/POST API
```
