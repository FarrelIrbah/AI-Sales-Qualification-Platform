# Phase 3: Data Extraction - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

System reliably retrieves company data from any URL, gracefully handling failures. Users can input a company URL for analysis; system scrapes website for data (industry, size, location, tech stack); falls back to enrichment APIs when scraping fails; offers manual input when all automated extraction fails. System always returns something actionable, never a blank failure.

</domain>

<decisions>
## Implementation Decisions

### URL Input Experience
- Dedicated /analyze page with prominent URL input as the main action
- Stay on page after submission, show extraction progress inline
- Step-by-step stage updates: "Scraping website... Extracting industry... Found: Tech"
- Show stages only, no time estimates

### Fallback Chain Behavior
- Silent fallback — user sees continuous "Extracting..." without explicit failure messages
- System switches from scraping to enrichment API internally without announcing transition
- 30 seconds total timeout before falling back to manual input
- Source attribution optional — clean results by default, expandable detail view to see data origins

### Partial Data Handling
- Try to fill gaps first — attempt enrichment API for missing fields before showing results
- Missing fields shown as "[Add]" prompts for inline user entry
- No confidence indicators — just show the data without low/medium/high badges
- All extracted fields are editable — user can correct any value before proceeding to analysis

### Manual Input Form
- Always available as option — user can choose manual entry from the start
- Core fields only: company name, industry, size, location (essentials for scoring)
- Mix of input types: dropdowns for size/industry, free text for name/location
- Pre-fill with found data + visually highlight gaps that need filling

### Claude's Discretion
- Enrichment API provider selection (single vs chain, specific vendors)
- Exact scraping implementation details
- Stage update wording and timing
- Detail view design for source attribution
- Gap highlighting visual treatment

</decisions>

<specifics>
## Specific Ideas

- Step-by-step progress should feel informative but not overwhelming — user knows something is happening
- "Never blank failure" is the core principle — always give user a path forward
- Manual form should feel like a quick alternative, not a punishment for failed extraction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-data-extraction*
*Context gathered: 2026-01-26*
