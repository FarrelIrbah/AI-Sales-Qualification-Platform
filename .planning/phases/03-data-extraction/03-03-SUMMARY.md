---
phase: 03-data-extraction
plan: 03
subsystem: ui-components
tags: [react, forms, extraction-ui, progress, validation]

dependency-graph:
  requires: [03-02-extraction-api, 03-01-company-validation]
  provides: [url-input, extraction-progress, manual-input-form]
  affects: [03-04-analyze-page, 04-xx-analysis-flow]

tech-stack:
  added: []
  patterns: [controlled-forms, step-progress, graceful-degradation-ui]

key-files:
  created:
    - src/components/analyze/url-input.tsx
    - src/components/analyze/extraction-progress.tsx
    - src/components/analyze/manual-input-form.tsx
    - src/components/ui/alert.tsx
  modified: []

decisions:
  - id: auto-https-normalization
    choice: Auto-add https:// to URLs without protocol
    rationale: Better UX - users often paste domains without protocol
  - id: simulated-progress-stages
    choice: Show fetch/extract/enrich/finalize stages with small delays
    rationale: Provides visual feedback even though API is single call
  - id: yellow-highlight-missing
    choice: Use yellow border/text for missing fields in manual form
    rationale: Clear visual indicator without being error-level severity

metrics:
  duration: ~8 minutes
  completed: 2026-01-27
---

# Phase 03 Plan 03: Extraction UI Components Summary

**One-liner:** URL input with validation, step-by-step extraction progress display, and manual input form that pre-fills partial data and highlights missing fields.

## What Was Built

### 1. URL Input Component (`src/components/analyze/url-input.tsx`)

User interface for entering company website URLs:

- **Zod validation**: Validates URL format, auto-adds https:// if missing
- **Error messages**: Clear feedback for invalid URLs
- **Loading state**: Disabled input and spinner during extraction
- **Manual entry option**: Optional button to skip extraction

```typescript
interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  onManualClick?: () => void;
}
```

### 2. Extraction Progress Component (`src/components/analyze/extraction-progress.tsx`)

Visual progress indicator during extraction:

- **Four stages**: Fetching website, Extracting company info, Enriching data, Finalizing
- **Status icons**: Running (spinner), Success (check), Failed (alert), Skipped (dash)
- **Progress bar**: Visual percentage based on current step
- **Silent fallback**: Shows "skipped" instead of "failed" for graceful degradation
- **Abort handling**: Proper cleanup on unmount or cancel

```typescript
interface ExtractionProgressProps {
  url: string;
  onComplete: (result: ExtractionResult) => void;
  onError: (partialData: PartialCompanyData, missingFields: string[]) => void;
}
```

### 3. Manual Input Form Component (`src/components/analyze/manual-input-form.tsx`)

Fallback form for manual company data entry:

- **Pre-fills partial data**: Uses any data extracted before failure
- **Highlights missing fields**: Yellow border and asterisk on required gaps
- **Warning alert**: Explains why manual input is needed
- **Industry dropdown**: 10 common industries
- **Employee count dropdown**: Standard range options
- **Responsive layout**: Two-column grid for size/location on desktop

```typescript
interface ManualInputFormProps {
  initialData?: PartialCompanyData;
  missingFields?: string[];
  onSubmit: (data: ManualCompanyInput) => void;
  onBack?: () => void;
  submitLabel?: string;
}
```

### 4. Alert UI Component (`src/components/ui/alert.tsx`)

Reusable alert component with variants:

- **default**: Standard background
- **destructive**: Red error styling
- **warning**: Yellow warning styling (used for missing fields)

## Key Implementation Details

### URL Normalization

Accepts URLs with or without protocol:

```typescript
const normalizedUrl = data.url.startsWith('http')
  ? data.url
  : `https://${data.url}`;
```

### Progress Stage Animation

Small delays make progress feel more meaningful:

```typescript
// Step animation shows each stage completing
await new Promise((r) => setTimeout(r, 500));
updateStep(0, 'success');
```

### Missing Field Highlighting

Visual prominence without error severity:

```typescript
<FormLabel className={isMissing('name') ? 'text-yellow-600' : ''}>
  Company Name {isMissing('name') && '*'}
</FormLabel>
<Input className={isMissing('name') ? 'border-yellow-500' : ''} />
```

### Never-Blank Failure

Even on total extraction failure, provide actionable result:

```typescript
catch (err) {
  // Always provide fallback
  onError({}, ['name', 'industry', 'description']);
}
```

## Commits

| Hash    | Message                                          |
| ------- | ------------------------------------------------ |
| 650458b | feat(03-03): add URL input component with validation |
| b90a80e | feat(03-03): add extraction progress component |
| 4f82a43 | feat(03-03): add manual input form and alert components |

## Verification Results

- TypeScript compiles without errors
- Build passes with no warnings
- All components use existing UI primitives (Button, Input, Form, Select, etc.)
- ExtractionProgress correctly imports types from fallback-chain
- ManualInputForm correctly uses manualCompanyInputSchema

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 03-04 (Manual Input Form integration / Analyze Page):**

- UrlInput ready to collect user input
- ExtractionProgress ready to show extraction status
- ManualInputForm ready for fallback entry
- All components export from named files

**Integration pattern:**

```typescript
// In /analyze page
const [stage, setStage] = useState<'input' | 'progress' | 'manual' | 'complete'>('input');

{stage === 'input' && <UrlInput onSubmit={handleUrl} onManualClick={() => setStage('manual')} />}
{stage === 'progress' && <ExtractionProgress url={url} onComplete={handleComplete} onError={handleError} />}
{stage === 'manual' && <ManualInputForm initialData={partialData} missingFields={missing} onSubmit={handleManual} />}
```
