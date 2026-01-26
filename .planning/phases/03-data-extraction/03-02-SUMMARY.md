---
phase: 03-data-extraction
plan: 02
subsystem: extraction
tags: [drizzle, api, fallback-chain, orchestration]

dependency-graph:
  requires: [03-01-scraper, 03-01-enrichment, 03-01-company-validation]
  provides: [companies-table, extraction-orchestrator, extraction-api]
  affects: [03-03-extraction-api, 03-04-manual-form]

tech-stack:
  added: []
  patterns: [fallback-chain, graceful-degradation, api-route-handlers]

key-files:
  created:
    - src/lib/extraction/fallback-chain.ts
    - src/app/api/extract/route.ts
  modified:
    - src/lib/db/schema.ts
    - next.config.ts

decisions:
  - id: fallback-never-throws
    choice: Fallback chain catches all errors and returns partial data
    rationale: Users should never see blank failure; always provide actionable result
  - id: enrichment-fills-gaps
    choice: Enrichment only fills missing fields, never overwrites scraped data
    rationale: Scraped data is fresher and more reliable than API data
  - id: error-returns-200
    choice: API returns 200 with fallback data on extraction errors
    rationale: Caller receives actionable response, can show manual input form
  - id: cheerio-external-package
    choice: Add cheerio to serverExternalPackages in next.config.ts
    rationale: Prevents bundling issues with native modules in server components

metrics:
  duration: ~8 minutes
  completed: 2026-01-27
---

# Phase 03 Plan 02: Fallback Chain Summary

**One-liner:** Companies database table, extraction orchestrator with scrape->enrich fallback, and POST /api/extract endpoint that never returns empty.

## What Was Built

### 1. Companies Database Table (`src/lib/db/schema.ts`)

Extended existing schema with companies table:

- **Identifiers**: `id`, `userId`, `domain`, `url`
- **Core data**: `name`, `description`, `industry`, `employeeCount`, `location`, `foundedYear`
- **JSONB arrays**: `techStack`, `emails`, `phones`, `extractionSources`
- **Social/meta**: `linkedIn`, `twitter`, `logoUrl`
- **Extraction metadata**: `extractionConfidence` (high/medium/low)
- **Type exports**: `Company`, `NewCompany`

### 2. Fallback Chain Orchestrator (`src/lib/extraction/fallback-chain.ts`)

Core extraction logic implementing the fallback pattern:

```typescript
export interface ExtractionResult {
  data: PartialCompanyData
  sources: ('scrape' | 'enrichment' | 'manual')[]
  confidence: 'high' | 'medium' | 'low'
  needsManualInput: boolean
  missingFields: string[]
}
```

**Extraction Flow:**
1. Parse domain from URL
2. Tier 1: Scrape with Cheerio (fast, reliable)
3. Tier 2: Enrich with Hunter.io for missing fields only
4. Calculate confidence based on data completeness
5. Return result with missing fields list

**Confidence Calculation:**
- High: 5+ fields AND scraped data
- Medium: 3+ fields
- Low: <3 fields

### 3. Extraction API Endpoint (`src/app/api/extract/route.ts`)

POST endpoint with:

- **Authentication**: Requires logged-in user (401 if not)
- **Validation**: URL format must be valid http/https
- **60s timeout**: Configured via `maxDuration` for Vercel
- **Graceful error handling**: Returns fallback data on any error

**Response always actionable:**
```typescript
{
  data: { ... },
  sources: ['scrape'],
  confidence: 'high',
  needsManualInput: false,
  missingFields: []
}
```

### 4. Next.js Config Update (`next.config.ts`)

Added `serverExternalPackages: ['cheerio']` to prevent bundling issues.

## Key Implementation Details

### Never-Throw Pattern

All extraction errors are caught and handled gracefully:

```typescript
try {
  const html = await fetchHtml(url)
  // ... process
} catch (error) {
  console.error('Scraping failed:', error)
  // Continue to fallback - don't rethrow
}
```

### Enrichment Fills Gaps Only

Scraped data takes priority; enrichment only fills missing fields:

```typescript
for (const field of missingAfterScrape) {
  if (enriched[key] !== undefined) {
    data[key] = enriched[key]
  }
}
```

### API Error Returns 200

Even on catastrophic failure, return actionable data:

```typescript
return NextResponse.json({
  data: {},
  sources: [],
  confidence: 'low',
  needsManualInput: true,
  missingFields: ['name', 'industry', 'description'],
  error: 'Extraction failed. Please enter company details manually.',
}, { status: 200 })
```

## Commits

| Hash    | Message                                       |
| ------- | --------------------------------------------- |
| 1663bbd | feat(03-02): add companies database table schema |
| 42d9a04 | feat(03-02): add extraction fallback chain orchestrator |
| c22e164 | feat(03-02): add extraction API endpoint |

## Verification Results

- TypeScript compiles without errors
- Companies table defined with all required fields
- Fallback chain exports `extractCompanyData` and `ExtractionResult`
- API route exports `POST` handler
- Build passes with no errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 03-03 (Extraction API):**
- Extraction endpoint available at POST /api/extract
- Returns structured ExtractionResult
- Authentication enforced

**Ready for 03-04 (Manual Input Form):**
- `needsManualInput` flag indicates when form needed
- `missingFields` array shows which fields to request
- Companies table ready to store user-entered data
