---
phase: 03-data-extraction
plan: 01
subsystem: extraction
tags: [scraping, cheerio, hunter-io, validation, zod]

dependency-graph:
  requires: [02-01-schema, 02-03-api]
  provides: [company-validation, html-scraper, enrichment-client]
  affects: [03-02-fallback-chain, 03-03-extraction-api]

tech-stack:
  added: [cheerio]
  patterns: [graceful-degradation, partial-data-extraction]

key-files:
  created:
    - src/lib/validations/company.ts
    - src/lib/extraction/scraper.ts
    - src/lib/extraction/parsers/company-info.ts
    - src/lib/extraction/enrichment.ts
  modified:
    - .env.local.example

decisions:
  - id: company-schema-structure
    choice: Separate full/partial/manual schemas
    rationale: Extraction returns partial data progressively
  - id: cheerio-first
    choice: Static fetch + Cheerio before Playwright
    rationale: 10x faster, no cold start, handles most pages
  - id: spa-detection
    choice: Check SPA indicators AND minimal content
    rationale: Many SSR apps have SPA markers but render content
  - id: hunter-graceful-degradation
    choice: Return null on any API failure
    rationale: Enrichment is optional enhancement, never blocking

metrics:
  duration: ~10 minutes
  completed: 2026-01-27
---

# Phase 03 Plan 01: Extraction Foundation Summary

**One-liner:** Zod schemas for company data with Cheerio-based HTML scraping and Hunter.io enrichment client, all with graceful degradation.

## What Was Built

### 1. Company Data Schemas (`src/lib/validations/company.ts`)

Three Zod schemas for different use cases:

- **companyDataSchema**: Full company profile (name, domain, description, industry, employeeCount, location, foundedYear, techStack, emails, phones, linkedIn, twitter, logoUrl)
- **partialCompanyDataSchema**: All fields optional except domain (for extraction progress)
- **manualCompanyInputSchema**: Core fields for user manual entry fallback

All schemas include `.describe()` annotations for future AI-assisted extraction.

### 2. Website Scraper (`src/lib/extraction/scraper.ts`)

HTML fetching foundation:

- **fetchHtml()**: Native fetch with 10s timeout, realistic User-Agent, proper Accept headers
- **needsJavaScript()**: SPA detection (checks __next, root div, ng-app AND minimal body content)
- **extractDomain()**: URL to clean domain helper

Note: Playwright integration deferred to next plan (03-02) for JavaScript-heavy sites.

### 3. HTML Parser (`src/lib/extraction/parsers/company-info.ts`)

Cheerio-based company info extraction:

- **extractCompanyInfo()**: Multi-source extraction with priority order:
  1. JSON-LD structured data (Organization/Corporation/LocalBusiness)
  2. Open Graph meta tags
  3. Standard meta tags
  4. Page content heuristics
- **extractContactInfo()**: Email/phone regex extraction with deduplication and filtering

### 4. Hunter.io Client (`src/lib/extraction/enrichment.ts`)

API enrichment with graceful degradation:

- **enrichCompany()**: Domain search API integration
- Returns null on: missing API key, exhausted credits (402), invalid key (401), timeout
- Transforms Hunter.io response to EnrichedCompanyData type
- Zod schema validates API response structure

## Key Implementation Details

### Graceful Degradation Pattern

All extraction components are designed to never throw on failure:

```typescript
// Scraper returns null on HTTP errors
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`) // Caught by caller
}

// Enrichment returns null on any failure
if (!apiKey) {
  console.warn('Hunter.io API key not configured')
  return null
}
```

### SPA Detection Logic

Conservative detection to avoid false positives:

```typescript
// Must have BOTH SPA indicator AND minimal content
return hasSpaIndicator && hasMinimalContent
```

This prevents flagging SSR apps (Next.js, etc.) that have SPA markers but render full content.

### JSON-LD Extraction

Handles multiple entity types and formats:

```typescript
const entities = Array.isArray(json) ? json : [json]
for (const entity of entities) {
  if (
    entity['@type'] === 'Organization' ||
    entity['@type'] === 'Corporation' ||
    entity['@type'] === 'LocalBusiness'
  ) {
    // Extract fields...
  }
}
```

## Commits

| Hash    | Message                                          |
| ------- | ------------------------------------------------ |
| 700686e | feat(03-01): add company data validation schemas |
| 5b697b4 | feat(03-01): add website scraper foundation      |
| 6237f57 | feat(03-01): add Hunter.io enrichment client     |

## Verification Results

- TypeScript compiles without errors (exit code 0)
- All required exports present in each file
- Schemas validate sample data correctly
- Enrichment client handles missing API key gracefully

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 03-02 (Fallback Chain):**

- Company schemas ready for extraction orchestrator
- Scraper provides `needsJavaScript()` for Playwright fallback decision
- Enrichment client ready as second-tier fallback
- All components return partial data compatible with merging

**Dependencies for next plan:**

- Playwright + @sparticuz/chromium-min for JavaScript rendering
- Fallback chain orchestrator to combine all sources
- Manual input form as final fallback
