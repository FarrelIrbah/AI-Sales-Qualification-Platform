# Phase 5: Dashboard - Research

**Researched:** 2026-02-10
**Domain:** Dashboard with filtering, sorting, card grid layout, and data management
**Confidence:** HIGH

## Summary

This phase builds a dashboard to view, filter, sort, and manage analyzed leads. The user has decided on a card grid layout with expanding cards (only one expanded at a time), horizontal filter bar with preset score buckets plus custom range, and archive functionality to remove leads from active view. Research covers Next.js 16 server component data fetching, URL-based filter state management with nuqs, Tailwind CSS 4 responsive grid patterns, expanding card animations with Radix UI Collapsible, CSV export using Blob API, and Clipboard API for copying analysis data.

The standard approach for Next.js 16 dashboards is server-first architecture: fetch data in Server Components using Drizzle ORM queries, manage filter/sort state in URL params using nuqs library, stream loading states with Suspense boundaries, and handle mutations (archive, re-analyze) via server actions. Client-side features like expanding cards, CSV export, and clipboard copying use existing React patterns with Radix UI primitives and browser APIs.

**Primary recommendation:** Use URL search parameters as the single source of truth for all filter and sort state, managed by nuqs library for type-safe state handling. Fetch filtered data server-side with Drizzle ORM queries built from URL params, enabling shareable/bookmarkable dashboard states and optimal performance.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.x | Server-first dashboard rendering | Built-in streaming, Suspense, Server Components for optimal performance |
| nuqs | Latest (14.2.0+) | Type-safe URL search params state | Industry standard for managing filter/sort state in Next.js App Router, tested with Next.js 16 |
| Drizzle ORM | 0.45.x | Database queries with filters/sorts | Type-safe query builder with excellent support for dynamic filtering and sorting |
| Radix UI Collapsible | 1.1.x | Accessible expanding cards | WAI-ARIA compliant, headless primitives for controlled single-expansion pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Blob API | Native browser | Client-side CSV generation | Standard for creating downloadable files without server roundtrip |
| Clipboard API | Native browser | Copy formatted text | Modern replacement for deprecated document.execCommand() |
| Tailwind CSS Grid | 4.x | Responsive card grid layout | Built-in responsive utilities for mobile-first grid layouts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nuqs | Manual useSearchParams + URLSearchParams | nuqs provides type safety and reduces boilerplate; manual approach requires more error handling |
| Server Components | React Query / TanStack Query | React Query better for real-time updates and optimistic UI; Server Components better for SEO and initial load performance |
| Radix Collapsible | Custom useState + CSS transitions | Radix handles accessibility, keyboard navigation, and aria attributes automatically |

**Installation:**
```bash
npm install nuqs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── (protected)/
│       └── dashboard/
│           ├── page.tsx              # Server Component - fetches filtered data
│           └── _components/          # Dashboard-specific client components
│               ├── lead-card.tsx     # Individual card with expand/collapse
│               ├── filter-bar.tsx    # Filter controls using nuqs
│               └── export-actions.tsx # CSV/clipboard client actions
├── lib/
│   └── dashboard/
│       ├── actions.ts                # Server actions (archive, re-analyze)
│       ├── queries.ts                # Drizzle query builders
│       └── utils.ts                  # CSV formatting, clipboard helpers
```

### Pattern 1: URL-Based Filter State Management
**What:** Store all filter and sort state in URL search parameters, managed by nuqs library
**When to use:** Any dashboard with filters, sorting, or pagination that should be shareable/bookmarkable
**Example:**
```typescript
// Source: https://nuqs.dev
// app/dashboard/page.tsx (Server Component)
import { parseAsInteger, parseAsString, parseAsArrayOf } from 'nuqs/server'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // Parse URL params with type safety
  const scoreMin = parseAsInteger.withDefault(0).parseServerSide(params.scoreMin)
  const scoreMax = parseAsInteger.withDefault(100).parseServerSide(params.scoreMax)
  const industries = parseAsArrayOf(parseAsString).parseServerSide(params.industries) || []
  const sortBy = parseAsString.withDefault('leadScore').parseServerSide(params.sortBy)

  // Fetch filtered data server-side
  const leads = await getFilteredLeads({ scoreMin, scoreMax, industries, sortBy })

  return <DashboardContent leads={leads} />
}

// _components/filter-bar.tsx (Client Component)
'use client'
import { useQueryState, parseAsInteger } from 'nuqs'

export function FilterBar() {
  const [scoreMin, setScoreMin] = useQueryState('scoreMin', parseAsInteger.withDefault(0))
  const [scoreMax, setScoreMax] = useQueryState('scoreMax', parseAsInteger.withDefault(100))

  // Changing state updates URL and triggers server re-render
  return (
    <div>
      <input value={scoreMin} onChange={(e) => setScoreMin(parseInt(e.target.value))} />
      <input value={scoreMax} onChange={(e) => setScoreMax(parseInt(e.target.value))} />
    </div>
  )
}
```

### Pattern 2: Dynamic Drizzle Queries with Filters
**What:** Build SQL WHERE clauses dynamically based on filter parameters using Drizzle's and() function
**When to use:** Implementing server-side filtering with multiple optional filter criteria
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/select
import { db } from '@/lib/db'
import { analyses, companies } from '@/lib/db/schema'
import { and, gte, lte, inArray, desc, asc, eq } from 'drizzle-orm'

interface FilterParams {
  scoreMin?: number
  scoreMax?: number
  industries?: string[]
  sortBy?: 'leadScore' | 'icpMatchPercentage' | 'createdAt' | 'companyName'
  sortOrder?: 'asc' | 'desc'
  isArchived?: boolean
}

export async function getFilteredLeads(userId: string, filters: FilterParams) {
  const conditions = [eq(analyses.userId, userId)]

  // Add score range filters if provided
  if (filters.scoreMin !== undefined) {
    conditions.push(gte(analyses.leadScore, filters.scoreMin))
  }
  if (filters.scoreMax !== undefined) {
    conditions.push(lte(analyses.leadScore, filters.scoreMax))
  }

  // Add industry filter if provided
  if (filters.industries && filters.industries.length > 0) {
    conditions.push(inArray(companies.industry, filters.industries))
  }

  // Build dynamic WHERE clause
  const query = db
    .select({
      analysisId: analyses.id,
      leadScore: analyses.leadScore,
      icpMatchPercentage: analyses.icpMatchPercentage,
      createdAt: analyses.createdAt,
      companyName: companies.name,
      companyIndustry: companies.industry,
      // ... other fields
    })
    .from(analyses)
    .innerJoin(companies, eq(analyses.companyId, companies.id))
    .where(and(...conditions))

  // Add dynamic sorting
  const sortField = filters.sortBy === 'companyName' ? companies.name : analyses[filters.sortBy || 'leadScore']
  const sortFn = filters.sortOrder === 'asc' ? asc : desc

  return await query.orderBy(sortFn(sortField))
}
```

### Pattern 3: Single Expanded Card State
**What:** Manage which card is expanded using controlled state, ensuring only one card expands at a time
**When to use:** Card grids where users drill into one item at a time without navigation
**Example:**
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/collapsible
'use client'
import { useState } from 'react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

interface Lead {
  id: string
  score: number
  companyName: string
  // ... other fields
}

export function LeadCardGrid({ leads }: { leads: Lead[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          isExpanded={expandedId === lead.id}
          onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
        />
      ))}
    </div>
  )
}

function LeadCard({ lead, isExpanded, onToggle }: {
  lead: Lead
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="border rounded-lg p-4">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <div className="text-4xl font-bold">{lead.score}</div>
            <div className="text-sm">{lead.companyName}</div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          {/* Expanded content: metrics bar, collapsible sections */}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
```

### Pattern 4: Client-Side CSV Export
**What:** Generate CSV from JavaScript objects and trigger browser download using Blob API
**When to use:** Exporting dashboard data without server roundtrip
**Example:**
```typescript
// Source: https://www.geeksforgeeks.org/javascript/how-to-create-and-download-csv-file-in-javascript/
function exportToCSV(data: Array<Record<string, any>>, filename: string) {
  if (data.length === 0) return

  // Extract headers
  const headers = Object.keys(data[0])

  // Build CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape values containing commas, quotes, or newlines
        const escaped = String(value).replace(/"/g, '""')
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
      }).join(',')
    )
  ]

  // Create Blob and download
  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
```

### Anti-Patterns to Avoid
- **Client-side filtering of large datasets:** Always filter server-side to avoid downloading unnecessary data and blocking UI thread
- **Uncontrolled expanding cards with multiple open:** Creates confusing UX where multiple sections compete for attention
- **Storing filter state only in React state:** Breaks shareable URLs, browser back button, and forces users to recreate filters after refresh
- **Using deprecated document.execCommand() for clipboard:** Modern Clipboard API is more reliable and secure
- **Sorting/filtering on every render without memoization:** Causes performance issues with large datasets; use useMemo or server-side processing

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL search param state management | Custom URLSearchParams parsing/serialization | nuqs library | Type safety, automatic URL updates, shallow routing support, parsers for arrays/numbers/dates, reduces 50+ lines to 5 |
| CSV generation with escaping | Manual comma/quote escaping logic | Blob API with proper escape regex | CSV edge cases: commas in values, quote escaping, newline handling, UTF-8 BOM for Excel |
| Accordion/collapsible with accessibility | Custom visibility state + CSS | Radix UI Collapsible | Keyboard navigation, ARIA attributes, focus management, controlled/uncontrolled modes |
| Responsive grid breakpoints | Custom media query hooks | Tailwind CSS grid utilities | Mobile-first approach, container queries, auto-fit/auto-fill patterns, consistent design tokens |
| Filter state synchronization | Manual state + URL sync | nuqs with Next.js shallow routing | Race conditions, browser back/forward handling, initial state hydration |

**Key insight:** Dashboard filtering and state management has many edge cases (URL encoding, browser history, accessibility, CSV edge cases). Using battle-tested libraries prevents bugs that emerge in production when users share URLs, use browser back button, or export data with special characters.

## Common Pitfalls

### Pitfall 1: Filtering Performance Degradation with Large Datasets
**What goes wrong:** Dashboard becomes slow/unresponsive when filtering thousands of leads client-side, especially with multiple active filters
**Why it happens:** Heavy computations during render (sorting/filtering) block UI thread; inefficient state management triggers excessive re-renders
**How to avoid:**
- Perform filtering, sorting, and aggregation server-side with Drizzle ORM
- Use URL params to trigger server re-fetches instead of client-side filtering
- If client-side filtering needed, wrap in useMemo with proper dependencies
- For 1000+ items, consider virtualization libraries (react-window, react-virtuoso)
**Warning signs:** Input lag when typing in filters, slow scrolling, browser tab becomes unresponsive

### Pitfall 2: Filter State Loss on Page Reload
**What goes wrong:** User applies filters, reloads page, and loses all filter selections
**Why it happens:** Filter state stored only in React useState/useReducer without URL persistence
**How to avoid:**
- Use nuqs to manage filter state in URL search parameters
- URL becomes single source of truth, automatically persists across reloads
- Enables shareable/bookmarkable filtered views
**Warning signs:** Users complain about re-applying filters after refresh, cannot share filtered dashboard views

### Pitfall 3: Unsorted or Randomly Sorted Dashboard
**What goes wrong:** Dashboard shows leads in seemingly random order, or sort order changes unpredictably
**Why it happens:** No explicit ORDER BY clause, or sorting by non-unique fields without secondary sort
**How to avoid:**
- Always include explicit .orderBy() in Drizzle queries
- Default to sorting by leadScore DESC (highest scores first)
- For secondary sorts, include unique field (id, createdAt) as tiebreaker
- Display visible sort indicator (arrow) in UI
**Warning signs:** Same query returns different order on refresh, users cannot predict which leads appear first

### Pitfall 4: Expanding Card Accessibility Issues
**What goes wrong:** Keyboard users cannot expand cards, screen readers don't announce expanded state
**Why it happens:** Custom expand/collapse built with divs and onClick without proper ARIA attributes
**How to avoid:**
- Use Radix UI Collapsible which handles aria-expanded, aria-controls, role attributes
- Ensure CollapsibleTrigger is keyboard accessible (button or interactive element)
- Test with keyboard only (Tab, Enter, Space) and screen reader
**Warning signs:** Cannot expand cards with keyboard, screen reader doesn't announce state changes

### Pitfall 5: CSV Export with Broken Special Characters
**What goes wrong:** Exported CSV contains unescaped commas breaking columns, quotes causing parse errors, Excel shows garbled Unicode characters
**Why it happens:** Naive CSV generation using .join(',') without escaping, missing UTF-8 BOM for Excel compatibility
**How to avoid:**
- Escape values containing commas, quotes, or newlines before joining
- Wrap escaped values in double quotes
- Use Blob with charset=utf-8 and consider adding UTF-8 BOM (\uFEFF) for Excel
- Test export with data containing: commas, quotes, newlines, Unicode characters
**Warning signs:** Exported CSV has misaligned columns, parse errors in Excel, corrupted non-ASCII characters

### Pitfall 6: Clipboard Copy Failing Silently
**What goes wrong:** Click "Copy to clipboard" button, nothing happens, no feedback to user
**Why it happens:** Clipboard API requires user gesture and HTTPS context; promise rejection not handled
**How to avoid:**
- Check navigator.clipboard availability before using
- Wrap clipboard.writeText() in try/catch to handle rejections
- Show toast/notification on success AND failure
- Provide fallback UI showing text to manually copy if clipboard unavailable
**Warning signs:** Copy works in dev (localhost) but fails in production, no user feedback when copy fails

### Pitfall 7: Filter Consolidation Confusion
**What goes wrong:** Filters scattered across dashboard, users don't know where to look for filter controls
**Why it happens:** Ad-hoc placement of filter inputs without unified design
**How to avoid:**
- Consolidate all filters into single, consistent horizontal bar above content
- Use dropdowns for 5+ options, toggles/chips for 2-4 options
- Show active filter count or chips to indicate filtered state
- Place "Clear all filters" button when any filter active
**Warning signs:** Users ask "how do I filter by X?", miss filter controls, complain dashboard is cluttered

## Code Examples

Verified patterns from official sources:

### Tailwind CSS Responsive Card Grid
```tsx
// Source: https://tailwindcss.com/docs/grid-template-columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {leads.map((lead) => (
    <Card key={lead.id} className="border rounded-lg p-4">
      {/* Card content */}
    </Card>
  ))}
</div>
```

### nuqs Setup for Next.js App Router
```tsx
// Source: https://nuqs.dev
// app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
```

### Drizzle Limit/Offset Pagination
```typescript
// Source: https://orm.drizzle.team/docs/guides/limit-offset-pagination
const PAGE_SIZE = 20

export async function getPaginatedLeads(userId: string, page: number) {
  return await db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.leadScore))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE)
}
```

### Clipboard API Copy with Fallback
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
async function copyToClipboard(text: string) {
  if (!navigator.clipboard) {
    // Fallback for older browsers or non-HTTPS contexts
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('Fallback copy failed:', err)
    }
    document.body.removeChild(textArea)
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    // Show success toast
  } catch (err) {
    console.error('Clipboard write failed:', err)
    // Show error toast with manual copy option
  }
}
```

### Smooth Expand/Collapse Animation
```tsx
// Source: https://www.material-tailwind.com/docs/html/accordion
<CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
  <div className="pt-4 space-y-4">
    {/* Expanded content */}
  </div>
</CollapsibleContent>

// tailwind.config.ts
export default {
  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.3s ease-out'
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.execCommand('copy') | navigator.clipboard.writeText() | 2023-2024 | Clipboard API is async, more reliable, doesn't require hidden textarea hack |
| Client-side filtering with useState | Server-side filtering with URL params | 2024-2026 | Better performance, shareable URLs, SEO-friendly, works with Server Components |
| React Query for dashboard data | Next.js Server Components | 2023-2026 | Server Components reduce client JS bundle, enable streaming, better initial load; React Query still preferred for real-time dashboards |
| Custom accordion with useState + CSS | Radix UI primitives | 2022-2024 | Accessibility built-in, keyboard navigation, ARIA attributes handled automatically |
| next/router (Pages Router) | next/navigation (App Router) | 2023-2025 | useSearchParams hook replaces router.query, enables Server Components |

**Deprecated/outdated:**
- **document.execCommand()**: Deprecated for clipboard operations; use Clipboard API instead
- **Uncontrolled max-height animations**: Causes accessibility issues by hiding content only visually; use Radix Collapsible with proper hidden attribute
- **Pages Router useRouter().query**: In App Router, use searchParams prop in Server Components or useSearchParams() in Client Components
- **Client-side data fetching for dashboards**: With Server Components, prefer server-side data fetching for initial load; use client fetching only for mutations or real-time updates

## Open Questions

Things that couldn't be fully resolved:

1. **Archive implementation approach**
   - What we know: User can archive leads to remove from active view; database schema doesn't currently have archived/isArchived field
   - What's unclear: Whether to add `isArchived` boolean column to `analyses` table, or implement archive as separate `archived_analyses` table
   - Recommendation: Add `isArchived` boolean column to `analyses` table with default false, filtered in queries with WHERE isArchived = false. Simpler than separate table, enables easy "show archived" toggle.

2. **Re-analyze implementation scope**
   - What we know: User can trigger re-analysis on stale leads
   - What's unclear: Whether re-analysis creates new analysis record or updates existing; how to handle "stale" detection (manual vs automatic based on age)
   - Recommendation: Create new analysis record (preserves history), link to same companyId. Let user manually trigger re-analysis; don't auto-detect staleness in Phase 5.

3. **CRM clipboard format preference**
   - What we know: User wants to copy analysis in "CRM-friendly format"; choice between structured text vs markdown
   - What's unclear: Which CRM systems user targets, which format pastes better into common CRMs
   - Recommendation: Use plain text structured format (not markdown), as most CRMs better preserve plain text formatting. Format: "Company: [name]\nScore: [score]\nICP Match: [percent]%\n\nPitch Angles:\n- [angle 1]\n..."

4. **Empty state design specifics**
   - What we know: Need empty states for "no leads yet" and "no results after filtering"
   - What's unclear: Exact visual design, whether to show sample data or just CTA
   - Recommendation: Two distinct empty states: (1) "No leads yet" → CTA to "Analyze First Lead", (2) "No results" → "Clear filters" button + filter summary. Keep visual simple: icon, message, action button.

## Sources

### Primary (HIGH confidence)
- [Next.js Official Docs - Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data) - Server Components data fetching patterns
- [Next.js Official Docs - Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) - URL search params best practices
- [Drizzle ORM - Select](https://orm.drizzle.team/docs/select) - Dynamic filtering and sorting patterns
- [Drizzle ORM - Limit/Offset Pagination](https://orm.drizzle.team/docs/guides/limit-offset-pagination) - Pagination implementation
- [nuqs Official Docs](https://nuqs.dev) - Type-safe search params state management
- [Radix UI Collapsible](https://www.radix-ui.com/primitives/docs/components/collapsible) - Accessible expand/collapse primitives
- [MDN - Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - Modern clipboard operations
- [Tailwind CSS Grid Template Columns](https://tailwindcss.com/docs/grid-template-columns) - Responsive grid patterns

### Secondary (MEDIUM confidence)
- [Managing Advanced Search Param Filtering in Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) - Real-world filter implementation
- [GeeksforGeeks - Create and Download CSV in JavaScript](https://www.geeksforgeeks.org/javascript/how-to-create-and-download-csv-file-in-javascript/) - CSV export patterns
- [Material Tailwind - Accordion](https://www.material-tailwind.com/docs/html/accordion) - Tailwind accordion animation patterns
- [Shadcn Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu) - Three-dot menu component patterns

### Tertiary (LOW confidence)
- WebSearch results on dashboard performance pitfalls - Multiple blog posts from 2025-2026 agreeing on server-side filtering and memoization patterns
- WebSearch results on empty state design - UI pattern sites showing examples, but user-specific design needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Next.js, Drizzle, Radix docs verified; nuqs tested with Next.js 16
- Architecture: HIGH - Patterns from official documentation and established in Next.js App Router ecosystem
- Pitfalls: MEDIUM-HIGH - Performance pitfalls verified across multiple sources; accessibility issues documented in Radix; CSV edge cases from MDN

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - stable ecosystem, Next.js 16 released, Drizzle/Radix mature)
