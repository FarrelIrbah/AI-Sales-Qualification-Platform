# Phase 3: Data Extraction - Research

**Researched:** 2026-01-26
**Domain:** Web scraping (Playwright + Cheerio), enrichment APIs, fallback chain architecture
**Confidence:** HIGH

## Summary

This research covers the data extraction system for LeadQual, focusing on three core challenges: (1) web scraping on Vercel serverless with Playwright, (2) fallback to enrichment APIs when scraping fails, and (3) ensuring users always get actionable data (never a blank failure).

**Key findings:**
1. **Playwright on Vercel requires special handling** - Use `@sparticuz/chromium` with `playwright-core` (not full Playwright). The main Chromium binary exceeds 50MB, so use `chromium-min` with remote binary loading for Vercel.
2. **Vercel Fluid Compute** provides 300s default timeout (vs traditional 10s), enabling scraping without timeouts. Configure `maxDuration` in route config.
3. **Cheerio for static parsing** - Fast HTML parsing without browser overhead. Use for extracting structured data after fetching HTML (works for most "About Us" pages).
4. **Hunter.io** is the recommended enrichment API - 50 free credits/month, 0.2 credits per company lookup, returns industry, size, tech stack, and more.
5. **Fallback chain pattern** - Scrape first -> Enrichment API -> Manual input. Each layer extracts partial data, final step combines all sources.

**Primary recommendation:** Implement a three-tier fallback chain. Use Playwright sparingly (only for JavaScript-heavy sites), prefer `fetch` + Cheerio for static content. Always provide manual input as the ultimate fallback with any partial data pre-filled.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `playwright-core` | 1.50.x | Browser automation (scraping) | Full Playwright without bundled browsers, pairs with @sparticuz/chromium |
| `@sparticuz/chromium` | 131.x | Serverless Chromium binary | Only Chromium that works on Vercel/Lambda, optimized for serverless |
| `cheerio` | 1.0.x | HTML parsing | jQuery-like API, fast, no browser needed, works server-side |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sparticuz/chromium-min` | 131.x | Minimal Chromium loader | When bundle size exceeds 50MB limit, loads binary from URL |
| `zod` | 4.x | Schema validation | Already in project, validates extracted company data |

### External APIs
| Service | Free Tier | Purpose | When to Use |
|---------|-----------|---------|-------------|
| Hunter.io | 50 credits/mo | Company enrichment by domain | Fallback when scraping fails, 0.2 credits per lookup |
| BuiltWith | Limited free API | Tech stack detection | Optional enhancement for tech detection |
| Wappalyzer | 50 lookups/mo | Tech stack detection | Alternative to BuiltWith |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Puppeteer | Both work with @sparticuz/chromium; Playwright has better auto-waiting, Puppeteer has more examples |
| Hunter.io | Clearbit | Clearbit requires $20K/year minimum; Hunter has free tier |
| Self-hosted Chromium | Browserless.io | Browserless removes cold start issues but costs $50/mo+ |
| fetch + Cheerio | Playwright for all | Playwright is 10x slower and has cold start; Cheerio handles most static pages |

**Installation:**
```bash
# Browser automation for serverless
npm install playwright-core @sparticuz/chromium-min

# HTML parsing
npm install cheerio

# Type definitions
npm install -D @types/cheerio

# Keep full Playwright for local development only
npm install -D playwright
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (protected)/
│   │   └── analyze/
│   │       └── page.tsx              # URL input + extraction UI
│   └── api/
│       └── extract/
│           └── route.ts              # Main extraction endpoint
├── components/
│   └── analyze/
│       ├── url-input.tsx             # URL input with validation
│       ├── extraction-progress.tsx   # Progress/status display
│       └── manual-input-form.tsx     # Manual fallback form
├── lib/
│   ├── extraction/
│   │   ├── index.ts                  # Main extraction orchestrator
│   │   ├── scraper.ts                # Playwright/Cheerio scraping
│   │   ├── enrichment.ts             # Hunter.io API calls
│   │   ├── fallback-chain.ts         # Fallback orchestration
│   │   └── parsers/
│   │       ├── company-info.ts       # Extract industry, size, etc.
│   │       └── tech-stack.ts         # Detect technologies
│   └── validations/
│       └── company.ts                # Zod schemas for company data
└── lib/db/
    └── schema.ts                     # Add company/lead tables
```

### Pattern 1: Three-Tier Fallback Chain
**What:** Orchestrated fallback from scraping to API to manual input
**When to use:** Any data extraction where reliability is critical
**Example:**
```typescript
// lib/extraction/fallback-chain.ts
import { scrapeCompany } from './scraper';
import { enrichCompany } from './enrichment';
import { CompanyData, PartialCompanyData } from '@/lib/validations/company';

export interface ExtractionResult {
  data: PartialCompanyData;
  sources: ('scrape' | 'enrichment' | 'manual')[];
  confidence: 'high' | 'medium' | 'low';
  needsManualInput: boolean;
  missingFields: string[];
}

export async function extractCompanyData(url: string): Promise<ExtractionResult> {
  const domain = new URL(url).hostname.replace('www.', '');
  let data: PartialCompanyData = {};
  const sources: ('scrape' | 'enrichment' | 'manual')[] = [];

  // Tier 1: Try scraping first
  try {
    const scraped = await scrapeCompany(url);
    if (scraped) {
      data = { ...data, ...scraped };
      sources.push('scrape');
    }
  } catch (error) {
    console.error('Scraping failed:', error);
    // Continue to fallback
  }

  // Tier 2: Enrich with API if scraping incomplete
  const missingAfterScrape = getMissingFields(data);
  if (missingAfterScrape.length > 0) {
    try {
      const enriched = await enrichCompany(domain);
      if (enriched) {
        // Only fill missing fields, don't overwrite scraped data
        for (const field of missingAfterScrape) {
          if (enriched[field]) {
            data[field] = enriched[field];
          }
        }
        sources.push('enrichment');
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      // Continue with partial data
    }
  }

  // Calculate final state
  const missingFields = getMissingFields(data);
  const needsManualInput = missingFields.length > 0;
  const confidence = calculateConfidence(data, sources);

  return {
    data,
    sources,
    confidence,
    needsManualInput,
    missingFields,
  };
}

function getMissingFields(data: PartialCompanyData): string[] {
  const required = ['name', 'industry', 'description'];
  return required.filter(field => !data[field]);
}

function calculateConfidence(
  data: PartialCompanyData,
  sources: string[]
): 'high' | 'medium' | 'low' {
  const filledFields = Object.keys(data).filter(k => data[k]);
  if (filledFields.length >= 5 && sources.includes('scrape')) return 'high';
  if (filledFields.length >= 3) return 'medium';
  return 'low';
}
```

### Pattern 2: Playwright on Vercel Serverless
**What:** Browser automation with @sparticuz/chromium-min for serverless
**When to use:** JavaScript-heavy sites where fetch + Cheerio fails
**Example:**
```typescript
// lib/extraction/scraper.ts
import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium-min';

// Remote binary URL for chromium-min
const CHROMIUM_BINARY_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';

async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    // Serverless environment - use chromium-min
    return playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_BINARY_URL),
      headless: true,
    });
  } else {
    // Local development - use full Playwright
    const { chromium: localChromium } = await import('playwright');
    return localChromium.launch({ headless: true });
  }
}

export async function scrapeWithBrowser(url: string): Promise<string> {
  const browser = await getBrowser();
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; LeadQualBot/1.0)',
    });
    const page = await context.newPage();

    // Set timeout for navigation
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Get rendered HTML
    const html = await page.content();

    await context.close();
    return html;
  } finally {
    await browser.close();
  }
}
```

### Pattern 3: Smart Scraping Strategy (Cheerio First)
**What:** Try static fetch + Cheerio before Playwright
**When to use:** Optimize performance by avoiding browser when possible
**Example:**
```typescript
// lib/extraction/scraper.ts
import * as cheerio from 'cheerio';
import { scrapeWithBrowser } from './browser';

export async function scrapeCompany(url: string): Promise<PartialCompanyData | null> {
  // Try static fetch first (fast, no cold start)
  let html = await fetchStaticHtml(url);

  // Check if page requires JavaScript
  if (needsJavaScript(html)) {
    // Fall back to Playwright (slow, but handles JS)
    html = await scrapeWithBrowser(url);
  }

  // Parse with Cheerio
  const $ = cheerio.load(html);
  return extractCompanyInfo($, url);
}

async function fetchStaticHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LeadQualBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function needsJavaScript(html: string): boolean {
  // Check for common SPA indicators
  const spaIndicators = [
    'id="__next"', // Next.js
    'id="root"',   // React
    'ng-app',      // Angular
    'data-reactroot',
    '<noscript>',  // Usually indicates JS-required content
  ];

  const $ = cheerio.load(html);
  const bodyText = $('body').text().trim();

  // If body has very little text, likely needs JS to render
  if (bodyText.length < 100) return true;

  // Check for SPA indicators
  return spaIndicators.some(indicator => html.includes(indicator));
}
```

### Pattern 4: Company Data Extraction with Cheerio
**What:** Extract structured company info from HTML
**When to use:** Parsing About/Company pages
**Example:**
```typescript
// lib/extraction/parsers/company-info.ts
import { CheerioAPI } from 'cheerio';

interface ExtractedCompanyInfo {
  name?: string;
  description?: string;
  industry?: string;
  location?: string;
  employeeCount?: string;
  foundedYear?: string;
}

export function extractCompanyInfo($: CheerioAPI, url: string): ExtractedCompanyInfo {
  const info: ExtractedCompanyInfo = {};

  // Company name - try multiple sources
  info.name =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    $('title').text().split('|')[0].split('-')[0].trim() ||
    new URL(url).hostname.replace('www.', '').split('.')[0];

  // Description - structured data or meta
  info.description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('[itemprop="description"]').first().text().trim() ||
    $('p').first().text().trim().slice(0, 500);

  // Try JSON-LD structured data (high quality source)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      if (data['@type'] === 'Organization' || data['@type'] === 'Corporation') {
        info.name = info.name || data.name;
        info.description = info.description || data.description;
        info.industry = data.industry;
        info.foundedYear = data.foundingDate?.split('-')[0];
        if (data.numberOfEmployees) {
          info.employeeCount = data.numberOfEmployees.value || data.numberOfEmployees;
        }
        if (data.address) {
          info.location = typeof data.address === 'string'
            ? data.address
            : `${data.address.addressLocality}, ${data.address.addressCountry}`;
        }
      }
    } catch (e) {
      // Invalid JSON-LD, continue
    }
  });

  return info;
}

// Regex patterns for additional extraction
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const PHONE_REGEX = /[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,}/g;

export function extractContactInfo($: CheerioAPI): { emails: string[]; phones: string[] } {
  const bodyText = $('body').text();
  const emails = [...new Set(bodyText.match(EMAIL_REGEX) || [])];
  const phones = [...new Set(bodyText.match(PHONE_REGEX) || [])];

  return {
    emails: emails.filter(e => !e.includes('example')).slice(0, 5),
    phones: phones.slice(0, 5),
  };
}
```

### Pattern 5: Hunter.io Enrichment API
**What:** Enrich company data using Hunter.io domain lookup
**When to use:** When scraping fails or returns incomplete data
**Example:**
```typescript
// lib/extraction/enrichment.ts
import { z } from 'zod';

const hunterResponseSchema = z.object({
  data: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    industry: z.string().optional(),
    employees_count: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
  }).nullable(),
});

export interface EnrichedCompanyData {
  name?: string;
  description?: string;
  industry?: string;
  employeeCount?: string;
  location?: string;
  techStack?: string[];
  linkedIn?: string;
  twitter?: string;
}

export async function enrichCompany(domain: string): Promise<EnrichedCompanyData | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    console.warn('Hunter API key not configured');
    return null;
  }

  const url = `https://api.hunter.io/v2/companies/find?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 402) {
      console.warn('Hunter API: credits exhausted');
    }
    return null;
  }

  const json = await response.json();
  const parsed = hunterResponseSchema.parse(json);

  if (!parsed.data) return null;

  const { data } = parsed;

  return {
    name: data.name,
    description: data.description,
    industry: data.industry,
    employeeCount: data.employees_count,
    location: data.city && data.country
      ? `${data.city}, ${data.country}`
      : data.country,
    techStack: data.technologies,
    linkedIn: data.linkedin,
    twitter: data.twitter,
  };
}
```

### Pattern 6: Vercel Route Config for Long Timeout
**What:** Configure serverless function for 30+ second execution
**When to use:** Extraction endpoint that may need Playwright
**Example:**
```typescript
// app/api/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { extractCompanyData } from '@/lib/extraction/fallback-chain';

// Vercel Fluid Compute config - 60s timeout, 1GB memory
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    const result = await extractCompanyData(url);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      {
        error: 'Extraction failed',
        needsManualInput: true,
        missingFields: ['name', 'industry', 'description'],
      },
      { status: 500 }
    );
  }
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### Anti-Patterns to Avoid
- **Playwright for everything:** 10x slower than fetch + Cheerio, use browser only when needed
- **No timeout handling:** Network requests can hang forever; always set AbortSignal.timeout()
- **Ignoring partial data:** Even failed scrapes may have some data; merge all sources
- **Blank failure states:** Never show "extraction failed" without offering manual input
- **Synchronous full extraction:** For UX, show progress as each step completes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tech stack detection | Parse HTML for script tags | Hunter.io / Wappalyzer | Edge cases, obfuscation, incomplete detection |
| Company size classification | Regex on "employees" text | Enrichment API | Inconsistent formats, multiple representations |
| Industry classification | Keyword matching | Enrichment API with NAICS/SIC codes | Thousands of industries, need standardization |
| Email extraction | Simple regex | Hunter.io Domain Search | Validation, deliverability, professional emails |
| Browser on serverless | Full Playwright install | @sparticuz/chromium-min | 280MB binary doesn't fit in 50MB limit |
| Headless browser service | Self-managed Chromium | Browserless.io (if budget allows) | Cold start, memory, timeout management |

**Key insight:** Scraping is the unreliable part. The enrichment APIs exist because scraping websites is fundamentally brittle. Use scraping for high-value unique data, APIs for structured firmographics.

## Common Pitfalls

### Pitfall 1: Chromium Bundle Size Exceeds Vercel Limit
**What goes wrong:** Deployment fails or function crashes - Chromium binary is 280MB, Vercel limit is 50MB
**Why it happens:** Installing full Playwright or @sparticuz/chromium (not -min)
**How to avoid:**
- Use `@sparticuz/chromium-min` which loads binary from remote URL
- Add `serverExternalPackages: ['playwright-core', '@sparticuz/chromium-min']` to next.config.ts
- Keep full `playwright` as devDependency only for local testing
**Warning signs:** Build succeeds but function crashes; "ENOMEM" or "ENOENT" errors

### Pitfall 2: Serverless Cold Start Timeouts
**What goes wrong:** First request after idle period times out
**Why it happens:** Chromium takes 5-10s to start on cold function
**How to avoid:**
- Set `maxDuration: 60` in route config (Vercel Fluid Compute)
- Use fetch + Cheerio as first attempt (no cold start)
- Only invoke Playwright when static fetch fails
- Consider connection keep-alive patterns
**Warning signs:** Intermittent 504 Gateway Timeout errors

### Pitfall 3: Scraping Blocked by Bot Protection
**What goes wrong:** Cloudflare, Akamai, or similar blocks requests
**Why it happens:** Default user-agent, missing headers, IP reputation
**How to avoid:**
- Set realistic User-Agent header
- Add Accept, Accept-Language headers
- Fall back to enrichment API gracefully
- Don't retry blocked requests aggressively
**Warning signs:** 403 Forbidden, JavaScript challenge pages, CAPTCHA

### Pitfall 4: Memory Exhaustion with Large Pages
**What goes wrong:** Function OOM (Out of Memory) crashes
**Why it happens:** Some pages are 10MB+; Playwright uses 500MB+ RAM
**How to avoid:**
- Limit response size in fetch (check Content-Length header)
- Block unnecessary resources in Playwright (images, fonts, CSS)
- Set memory to 1GB minimum in Vercel function config
**Warning signs:** "JavaScript heap out of memory" errors, random crashes

### Pitfall 5: Blank Failure States (Critical - from STATE.md)
**What goes wrong:** User sees "extraction failed" with no actionable path
**Why it happens:** Error handling returns early without fallback
**How to avoid:**
- ALWAYS return `needsManualInput: true` with missing fields list
- Pre-fill manual form with ANY partial data from failed steps
- Design extraction result to ALWAYS have next action
- Test complete failure scenario (offline, blocked, API down)
**Warning signs:** QA reporting "dead ends" in extraction flow

### Pitfall 6: Rate Limiting and API Credit Exhaustion
**What goes wrong:** Hunter.io returns 402, extraction degrades
**Why it happens:** No tracking of API usage, no fallback when credits exhausted
**How to avoid:**
- Track API credit usage in database
- Warn when approaching limit (80%)
- Gracefully degrade to manual-only when credits exhausted
- Consider caching enrichment results by domain
**Warning signs:** Sudden spike in manual input usage

## Code Examples

Verified patterns from official sources:

### Next.js Config for Serverless Playwright
```typescript
// next.config.ts
// Source: Next.js serverExternalPackages documentation
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'playwright-core',
    '@sparticuz/chromium-min',
  ],
};

export default nextConfig;
```

### Company Data Zod Schema
```typescript
// lib/validations/company.ts
import { z } from 'zod';

export const companyDataSchema = z.object({
  // Core fields (try to extract all)
  name: z.string().min(1),
  domain: z.string().min(1),
  description: z.string().optional(),

  // Firmographics
  industry: z.string().optional(),
  employeeCount: z.string().optional(), // "1-10", "11-50", etc.
  location: z.string().optional(),
  foundedYear: z.string().optional(),

  // Tech stack
  techStack: z.array(z.string()).default([]),

  // Contact
  emails: z.array(z.string().email()).default([]),
  phones: z.array(z.string()).default([]),

  // Social
  linkedIn: z.string().url().optional(),
  twitter: z.string().optional(),

  // Metadata
  logoUrl: z.string().url().optional(),
});

export type CompanyData = z.infer<typeof companyDataSchema>;
export type PartialCompanyData = Partial<CompanyData>;

// Schema for user manual input (minimal required fields)
export const manualCompanyInputSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().optional(),
  employeeCount: z.string().optional(),
  location: z.string().optional(),
});

export type ManualCompanyInput = z.infer<typeof manualCompanyInputSchema>;
```

### Extraction Progress UI Pattern
```typescript
// components/analyze/extraction-progress.tsx
'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface ExtractionStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  data?: Record<string, unknown>;
}

interface ExtractionProgressProps {
  url: string;
  onComplete: (result: ExtractionResult) => void;
  onNeedManualInput: (partialData: PartialCompanyData, missingFields: string[]) => void;
}

export function ExtractionProgress({ url, onComplete, onNeedManualInput }: ExtractionProgressProps) {
  const [steps, setSteps] = useState<ExtractionStep[]>([
    { name: 'Fetching website', status: 'pending' },
    { name: 'Extracting company info', status: 'pending' },
    { name: 'Enriching with API', status: 'pending' },
    { name: 'Finalizing', status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    async function extract() {
      // Simulated progress - actual implementation would update in real-time
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.needsManualInput) {
        onNeedManualInput(result.data, result.missingFields);
      } else {
        onComplete(result);
      }
    }

    extract();
  }, [url, onComplete, onNeedManualInput]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progress} />
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={
              step.status === 'running' ? 'text-primary animate-pulse' :
              step.status === 'success' ? 'text-green-500' :
              step.status === 'failed' ? 'text-red-500' :
              'text-muted-foreground'
            }>
              {step.status === 'running' ? '...' :
               step.status === 'success' ? 'OK' :
               step.status === 'failed' ? 'X' : 'o'}
            </span>
            <span>{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Database Schema for Extracted Companies
```typescript
// Addition to lib/db/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Identifiers
  domain: text('domain').notNull(),
  url: text('url').notNull(),

  // Core data
  name: text('name').notNull(),
  description: text('description'),
  industry: text('industry'),
  employeeCount: text('employee_count'),
  location: text('location'),
  foundedYear: text('founded_year'),

  // Arrays as JSONB
  techStack: jsonb('tech_stack').$type<string[]>().default([]),
  emails: jsonb('emails').$type<string[]>().default([]),
  phones: jsonb('phones').$type<string[]>().default([]),

  // Social/meta
  linkedIn: text('linkedin'),
  twitter: text('twitter'),
  logoUrl: text('logo_url'),

  // Extraction metadata
  extractionSources: jsonb('extraction_sources').$type<string[]>().default([]),
  extractionConfidence: text('extraction_confidence'), // high/medium/low

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chrome-aws-lambda | @sparticuz/chromium | 2023 | Chrome-aws-lambda deprecated, sparticuz is maintained fork |
| puppeteer-core | playwright-core | Stable | Both work; Playwright has better auto-waiting |
| Chromium binary in bundle | Remote binary loading (chromium-min) | 2024 | Solves 50MB bundle limit on Vercel |
| 10s serverless timeout | Vercel Fluid Compute 300s default | 2025 | Enables scraping without timeouts |
| Clearbit for enrichment | Hunter.io | 2024 | Clearbit acquired by HubSpot, $20K/year min; Hunter has free tier |
| serverComponentsExternalPackages | serverExternalPackages | Next.js 15+ | Renamed from experimental to stable |

**Deprecated/outdated:**
- `chrome-aws-lambda`: Deprecated, use `@sparticuz/chromium`
- `serverComponentsExternalPackages`: Renamed to `serverExternalPackages` in Next.js 15+
- Clearbit free tier: No longer available after HubSpot acquisition
- Traditional 10s Vercel timeout: Fluid Compute provides 300s default

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Cheerio vs Playwright decision threshold**
   - What we know: Check for SPA indicators (empty body, __next div, etc.)
   - What's unclear: Exact heuristics for when Cheerio fails silently vs visibly
   - Recommendation: Start with body text length < 100 chars as Playwright trigger, refine based on real data

2. **Tech stack detection accuracy**
   - What we know: Hunter.io provides some tech data; Wappalyzer is more comprehensive
   - What's unclear: Accuracy of Hunter.io tech detection vs dedicated services
   - Recommendation: Use Hunter.io included tech data for v1; evaluate Wappalyzer integration for v2

3. **Cache strategy for enrichment results**
   - What we know: Same domain = same company data; API credits are limited
   - What's unclear: How long to cache (company data changes infrequently)
   - Recommendation: Cache by domain for 30 days, allow manual refresh

4. **Multiple URLs for same company**
   - What we know: Users may paste blog.company.com vs company.com
   - What's unclear: How to deduplicate/merge company records
   - Recommendation: Normalize to root domain, warn if company already analyzed

## Sources

### Primary (HIGH confidence)
- [Next.js serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) - Configuration for excluding packages from bundling
- [Vercel Functions Duration](https://vercel.com/docs/functions/configuring-functions/duration) - maxDuration and Fluid Compute
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) - 300s default, cold start optimization
- [@sparticuz/chromium GitHub](https://github.com/Sparticuz/chromium) - Serverless Chromium binary setup
- [Hunter.io Company Enrichment API](https://hunter.io/api/company-enrichment) - API documentation and response format
- [Cheerio Documentation](https://cheerio.js.org/docs/intro/) - HTML parsing API
- [Playwright Library Docs](https://playwright.dev/docs/library) - Browser automation (non-test usage)

### Secondary (MEDIUM confidence)
- [ZenRows: Playwright on Vercel](https://www.zenrows.com/blog/playwright-vercel) - Bundle size solutions, chromium-min pattern
- [Stefan Judis: Headless Chrome in Serverless](https://www.stefanjudis.com/blog/how-to-use-headless-chrome-in-serverless-functions/) - 50MB limit workarounds
- [Browserless: State of Web Scraping 2026](https://www.browserless.io/blog/state-of-web-scraping-2026) - Fallback patterns, self-healing scrapers
- [HasData: Building Resilient Scrapers](https://medium.com/@hasdata/how-to-build-an-e-commerce-scraper-that-survives-a-website-redesign-86216e96cbd9) - Signature detection + heuristic fallback

### Tertiary (LOW confidence)
- Community patterns for Cheerio + Playwright hybrid approach - Emerging pattern, limited documentation
- Tech stack detection accuracy comparisons - No authoritative benchmarks found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs for all libraries, npm versions verified
- Architecture: HIGH - Established patterns for serverless scraping, fallback chains
- Pitfalls: HIGH - Well-documented issues with Vercel bundle size, cold starts, timeouts
- Enrichment APIs: MEDIUM - Hunter.io docs verified, free tier confirmed, accuracy unknown

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - web scraping landscape evolves but core patterns stable)
