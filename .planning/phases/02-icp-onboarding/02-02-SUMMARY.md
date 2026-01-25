---
phase: "02-icp-onboarding"
plan: "02"
subsystem: "icp-wizard-ui"
tags: ["react-hook-form", "shadcn", "radix-ui", "wizard", "ai-input"]

dependency-graph:
  requires: ["02-01"]
  provides: ["icp-wizard", "company-info-step", "target-criteria-step", "ai-input"]
  affects: ["02-03", "02-04"]

tech-stack:
  added:
    - "@radix-ui/react-select@2.1.14"
    - "@radix-ui/react-checkbox@1.3.2"
  patterns:
    - "FormProvider pattern for multi-step wizard"
    - "Zod input/output type separation for form validation"
    - "TagInput for array field management"
    - "AiInput generic component for AI-assisted form filling"

key-files:
  created:
    - src/components/ui/textarea.tsx
    - src/components/ui/progress.tsx
    - src/components/ui/select.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/checkbox.tsx
    - src/components/onboarding/icp-wizard.tsx
    - src/components/onboarding/ai-input.tsx
    - src/components/onboarding/tag-input.tsx
    - src/components/onboarding/steps/company-info-step.tsx
    - src/components/onboarding/steps/target-criteria-step.tsx
  modified:
    - src/lib/validations/icp.ts
    - scripts/test-icp-parser.ts
    - package.json
    - package-lock.json

decisions:
  - id: "input-output-types"
    decision: "Export both z.input and z.output types from ICP schemas"
    rationale: "Zod default() creates different input vs output types; forms use input, submit handlers use output"
  - id: "generic-ai-input"
    decision: "AiInput is generic component with fieldMappings prop"
    rationale: "Reusable across all wizard steps with different AI parsing functions"
  - id: "tag-input-pattern"
    decision: "TagInput for array fields with add/remove badge UI"
    rationale: "Common UX pattern for managing string arrays like industries, locations"

metrics:
  duration: "22 minutes"
  completed: "2026-01-25"
---

# Phase 02 Plan 02: ICP Wizard UI Summary

**One-liner:** Multi-step ICP wizard with FormProvider pattern, AI-assisted natural language input, and Steps 1-2 (Company Info and Target Criteria) with tag inputs and checkbox groups.

## What Was Built

### 1. UI Components (src/components/ui/)

- **textarea.tsx**: Shadcn-style textarea with focus ring
- **progress.tsx**: Progress bar and StepIndicator with numbered circles
- **select.tsx**: Full Radix UI select with all subcomponents
- **badge.tsx**: Variant-based badges (default, secondary, destructive, outline)
- **checkbox.tsx**: Radix UI checkbox for multi-select

### 2. ICP Wizard Container (src/components/onboarding/icp-wizard.tsx)

- 4-step wizard with FormProvider pattern
- Step state management (currentStep, navigation)
- Per-step field validation before advancing
- StepIndicator showing progress with labels
- Conditional step component rendering
- Submit handler with type casting (FullIcpInput -> FullIcpOutput)

### 3. AI Input Component (src/components/onboarding/ai-input.tsx)

- Generic component with `<T extends FieldValues>` type parameter
- Props: parseAction function, fieldMappings for form integration
- Natural language textarea with "Extract with AI" button
- Loading state with spinner
- Error handling with inline message
- Clears input after successful extraction

### 4. TagInput Component (src/components/onboarding/tag-input.tsx)

- Array field management with badges
- Add via button or Enter key
- Remove via X button on badge
- Duplicate prevention
- Optional maxTags limit

### 5. Step 1: Company Info (src/components/onboarding/steps/company-info-step.tsx)

- AI input with parseCompanyInfoAction
- Fields: productDescription (textarea), industry (input)
- Selects: companySize, targetMarket with enums

### 6. Step 2: Target Criteria (src/components/onboarding/steps/target-criteria-step.tsx)

- AI input with parseTargetCriteriaAction
- Checkbox group: idealCompanySizes
- TagInputs: targetIndustries, targetLocations, techRequirements
- Budget range: min/max number inputs

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| d5da7ad | feat | Add UI components (textarea, progress, select, badge) |
| a5ae45a | feat | Add ICP wizard container and AI input component |
| f6ccf31 | feat | Add Step 1 (Company Info) and Step 2 (Target Criteria) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Input/Output type separation for Zod schemas**
- **Found during:** Task 2 - TypeScript compilation
- **Issue:** FullIcpInput type from `z.infer` created conflict with react-hook-form due to `.default()` fields
- **Fix:** Changed to export both `z.input` and `z.output` types separately
- **Files modified:** src/lib/validations/icp.ts
- **Commit:** a5ae45a

**2. [Rule 3 - Blocking] Fixed test script for optional field types**
- **Found during:** Task 2 - TypeScript compilation
- **Issue:** Type change made targetLocations, techRequirements, commonObjections potentially undefined
- **Fix:** Added nullish coalescing (`?? []`) in test script accessors
- **Files modified:** scripts/test-icp-parser.ts
- **Commit:** a5ae45a

**3. [Rule 2 - Missing Critical] Added Checkbox component for multi-select**
- **Found during:** Task 3 - TargetCriteriaStep needs checkbox
- **Issue:** Checkbox UI component did not exist for idealCompanySizes selection
- **Fix:** Created checkbox.tsx and added @radix-ui/react-checkbox dependency
- **Files modified:** package.json, src/components/ui/checkbox.tsx
- **Commit:** f6ccf31

## Verification Results

All verification criteria passed:
- [x] `npm run build` passes without errors
- [x] ICP wizard renders with 4-step progress indicator (StepIndicator component)
- [x] Step 1 shows company info fields with working validation
- [x] Step 2 shows target criteria fields with array/tag inputs
- [x] AI input component calls server action and populates form fields
- [x] Navigation between steps 1-2 works correctly

## Next Phase Readiness

Ready for 02-03 (ICP Server Actions / Steps 3-4):
- Wizard infrastructure complete
- AiInput reusable for value props and objections
- TagInput reusable for differentiators
- FormProvider pattern established
- Server actions already exist for all 4 step parsers

## Files Changed

```
src/components/ui/textarea.tsx       # New - textarea input
src/components/ui/progress.tsx       # New - Progress, StepIndicator
src/components/ui/select.tsx         # New - Radix select components
src/components/ui/badge.tsx          # New - badge variants
src/components/ui/checkbox.tsx       # New - Radix checkbox
src/components/onboarding/icp-wizard.tsx      # New - wizard container
src/components/onboarding/ai-input.tsx        # New - AI extraction input
src/components/onboarding/tag-input.tsx       # New - array field input
src/components/onboarding/steps/company-info-step.tsx    # New - Step 1
src/components/onboarding/steps/target-criteria-step.tsx # New - Step 2
src/lib/validations/icp.ts           # Added Input/Output type exports
scripts/test-icp-parser.ts           # Fixed optional field access
package.json                         # Added radix dependencies
```
