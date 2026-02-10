# Phase 5: Dashboard - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

View, filter, and manage all analyzed leads in one place. Users can see their lead pipeline, drill into full analysis details, filter/sort to find specific leads, export data, archive leads, and re-analyze stale ones. Creating new analyses happens on the existing analyze page — this phase is about managing results.

</domain>

<decisions>
## Implementation Decisions

### Lead list layout
- Card grid layout (not table or list)
- Each card shows: score (large color-coded number), ICP match %, company name, industry, company size, and top pitch angle preview
- Score display: large number with green/yellow/red background based on existing thresholds (green >= 70, yellow >= 40, red < 40)
- Default sort: highest score first

### Detail view pattern
- Expanding card — clicking a card expands it in-place, other cards shift down
- Only one card expanded at a time — expanding a new card collapses the previous one
- Expanded state shows a key metrics bar (score, ICP match %, industry, size, date analyzed) at the top
- Below metrics bar: collapsible sections for Score Breakdown, Company Insights, Pitch Angles, Objections — all collapsed by default, user expands what they want

### Filter & sort UX
- Horizontal filter bar above the card grid
- Score range filter: preset buckets (Hot 70-100, Warm 40-69, Cold 0-39) as quick-select toggles AND a custom range option for power users
- Additional filters: ICP match %, industry, analysis date
- Sort dropdown: Score, ICP Match %, Date Analyzed, Company Name
- Filters combine (AND logic)

### Actions & export
- Collapsed cards: three-dot (⋮) menu with quick actions
- Expanded view: full action bar with all actions
- CSV export: button offers "Export filtered (N)" or "Export all (N)" choice
- Archive: user can archive leads to remove from active view
- Re-analyze: user can trigger fresh analysis on stale leads

### Claude's Discretion
- Filter feedback pattern (chips, counts, or both)
- CRM clipboard format (structured text vs markdown — pick most universal)
- Archive UX pattern (toggle/tab vs section vs other)
- Card grid responsive breakpoints
- Empty state design for no leads / no results after filtering
- Exact card spacing, typography, and hover states
- Loading states for the dashboard

</decisions>

<specifics>
## Specific Ideas

- Score thresholds already established: green >= 70, yellow >= 40, red < 40 (matches existing getScoreLabel)
- Expanding card pattern should feel smooth — animation on expand/collapse
- The dashboard is the main landing page after onboarding is complete and leads exist

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-dashboard*
*Context gathered: 2026-02-10*
