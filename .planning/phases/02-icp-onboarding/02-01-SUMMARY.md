---
phase: "02-icp-onboarding"
plan: "01"
subsystem: "icp-data-layer"
tags: ["ai-sdk", "openai", "zod", "drizzle", "jsonb", "structured-output"]

dependency-graph:
  requires: ["01-foundation"]
  provides: ["icp-schema", "icp-validation", "ai-parsing"]
  affects: ["02-02", "02-03", "02-04"]

tech-stack:
  added:
    - ai@6.0.0
    - "@ai-sdk/openai@3.0.0"
  patterns:
    - "AI SDK 6 Output.object() for structured output"
    - "JSONB columns with TypeScript interfaces"
    - "Zod schemas with .describe() for AI parsing"

key-files:
  created:
    - src/lib/ai/index.ts
    - src/lib/ai/prompts/icp-parser.ts
    - src/lib/validations/icp.ts
    - scripts/test-icp-schemas.ts
    - scripts/test-icp-parser.ts
    - scripts/verify-exports.ts
  modified:
    - src/lib/db/schema.ts
    - src/lib/auth/actions.ts
    - package.json
    - package-lock.json

decisions:
  - id: "icp-jsonb-structure"
    decision: "Use JSONB for targetCriteria, valuePropositions, commonObjections"
    rationale: "Flexible schema evolution, complex nested data, PostgreSQL query support"
  - id: "flat-company-info"
    decision: "Company info fields (product, industry, size, market) as flat columns"
    rationale: "Common query patterns benefit from indexed flat columns"
  - id: "zod-descriptions"
    decision: "Add .describe() to all schema fields for AI parsing"
    rationale: "Descriptions guide AI SDK structured output extraction"

metrics:
  duration: "17 minutes"
  completed: "2026-01-25"
---

# Phase 02 Plan 01: ICP Schema & AI Infrastructure Summary

**One-liner:** ICP database schema with JSONB columns, Zod validation schemas with AI descriptions, and AI SDK 6 parsing functions using GPT-4o structured output.

## What Was Built

### 1. ICP Database Schema (src/lib/db/schema.ts)
- Added `icpProfiles` table with foreign key to `profiles`
- Flat columns for company info: productDescription, industry, companySize, targetMarket
- JSONB columns with TypeScript interfaces:
  - `targetCriteria`: idealCompanySizes[], targetIndustries[], targetLocations[], techRequirements[], budgetRange?
  - `valuePropositions`: array of {headline, description, differentiators[]}
  - `commonObjections`: array of {objection, suggestedResponse?}
- Exported `IcpProfile` and `NewIcpProfile` types

### 2. Zod Validation Schemas (src/lib/validations/icp.ts)
- `companyInfoSchema`: Step 1 - product, industry, size enum, market enum
- `targetCriteriaSchema`: Step 2 - arrays with defaults, optional budget range
- `valuePropsSchema`: Step 3 - array of value proposition objects
- `objectionsSchema`: Step 4 - array of objection objects with defaults
- `fullIcpSchema`: Merged schema for complete ICP validation
- All fields have `.describe()` for AI parsing guidance

### 3. AI SDK Configuration (src/lib/ai/index.ts)
- OpenAI provider setup with `createOpenAI()`
- Exported `gpt4o` for structured output (100% reliability)
- Exported `gpt4oMini` for simpler/cheaper extractions

### 4. ICP Parsing Functions (src/lib/ai/prompts/icp-parser.ts)
- `parseCompanyInfo()`: Extracts company info from natural language
- `parseTargetCriteria()`: Extracts ideal customer criteria
- `parseValueProps()`: Extracts value propositions
- `parseObjections()`: Extracts common objections
- All use AI SDK 6 `generateText` with `Output.object()` pattern
- Specialized system prompts for each section
- Graceful error handling (returns null on failure)

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 182fae6 | feat | Add AI SDK and ICP database schema |
| 31ea789 | feat | Add Zod validation schemas for ICP wizard |
| cb00a69 | feat | Add AI SDK setup and ICP parsing functions |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Zod 4 API change in auth actions**
- **Found during:** Task 1 - TypeScript compilation
- **Issue:** Zod 4 renamed `errors` to `issues` on ZodError
- **Fix:** Changed `parsed.error.errors[0].message` to `parsed.error.issues[0].message`
- **Files modified:** src/lib/auth/actions.ts
- **Commit:** 182fae6

**2. [Rule 3 - Blocking] Fixed Zod 4 enum syntax in ICP schemas**
- **Found during:** Task 3 - TypeScript compilation
- **Issue:** Zod 4 changed enum error handling from `errorMap` to `message`
- **Fix:** Changed `{ errorMap: () => ({ message: '...' }) }` to `{ message: '...' }`
- **Files modified:** src/lib/validations/icp.ts
- **Commit:** cb00a69

**3. [Rule 3 - Blocking] Fixed npm silent install issue**
- **Found during:** Task 1 - Package installation
- **Issue:** npm install commands were succeeding silently but not creating node_modules
- **Fix:** Used Node.js child_process.execSync to capture actual output
- **Files modified:** package.json (manual edit), package-lock.json (regenerated)
- **Commit:** 182fae6

## Verification Results

All verification criteria passed:
- [x] `npm run build` passes without TypeScript errors
- [x] Schema file exports both profiles and icpProfiles tables
- [x] Validation schemas all export correctly (verified via script)
- [x] AI parsing functions use correct AI SDK 6 pattern (Output.object())
- [x] JSONB columns have proper TypeScript types via $type<T>()

## API Key Requirement

The AI parsing functions require `OPENAI_API_KEY` environment variable to be set:
- Source: OpenAI Platform -> API keys -> Create new secret key
- Add to `.env.local`: `OPENAI_API_KEY=sk-...`

Test scripts gracefully skip live API tests when key is not set.

## Next Phase Readiness

Ready for 02-02 (ICP Wizard UI):
- Database schema ready for ICP storage
- Validation schemas ready for form validation
- AI parsing functions ready for natural language input
- Type exports available for form components

## Files Changed

```
src/lib/db/schema.ts              # Added icpProfiles table + interfaces
src/lib/validations/icp.ts        # New - 5 Zod schemas with types
src/lib/ai/index.ts               # New - OpenAI provider setup
src/lib/ai/prompts/icp-parser.ts  # New - 4 parsing functions
src/lib/auth/actions.ts           # Fixed Zod 4 API
package.json                      # Added ai, @ai-sdk/openai
scripts/test-icp-schemas.ts       # New - schema tests
scripts/test-icp-parser.ts        # New - parser tests
scripts/verify-exports.ts         # New - export verification
```
