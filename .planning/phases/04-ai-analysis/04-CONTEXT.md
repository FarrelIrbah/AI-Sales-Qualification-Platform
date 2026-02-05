# Phase 4: AI Analysis - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

System generates personalized lead scores, pitch recommendations, and objection predictions based on user's ICP. After company data is extracted (Phase 3), AI analyzes it against the user's ICP to produce actionable sales intelligence. Results are saved and displayed on a single analysis page.

</domain>

<decisions>
## Implementation Decisions

### Score presentation
- Large bold number (1-100) with green/yellow/red color coding — no gauge, no letter grade
- 5-6 component scores in the breakdown: Industry fit, Size fit, Tech fit, Need signals, Location fit, Growth signals
- Component scores displayed as horizontal bars with percentage labels
- Each component bar is expandable — click to reveal AI-written reasoning for that score
- ICP match percentage shown as headline alongside lead score AND as a component in breakdown (both approaches)

### Analysis results layout
- Single scrollable page — all sections stacked vertically, no tabs
- Section ordering: Lead score + breakdown at top → Company insights → Pitch angles → Objections
- Company insights section shows extracted data (industry, size, tech stack) PLUS AI-written interpretive commentary (e.g., "Fast-growing fintech with modern stack, strong fit for your API product")

### Pitch & objection tone
- Professional & direct tone — like advice from a sales coach, not casual brainstorming
- 2-3 pitch angles per analysis, each distinct
- Each pitch angle structured as: bold headline hook + 2-3 sentence explanation of the angle and why it works
- Predicted objections shown with recommended responses together (paired cards), not expandable — both visible immediately
- Objections based on company profile vs user's common objections from ICP

### Analysis flow & timing
- Progress steps shown during analysis (consistent with extraction flow): Analyzing company data → Scoring against ICP → Generating pitches → Predicting objections
- Analysis auto-starts after extraction completes — seamless flow from extraction → analysis
- Results auto-saved to database — no manual save step needed
- After analysis completes, two equal actions: "Analyze Another" and "View Dashboard"

### Claude's Discretion
- Exact AI prompt engineering and token optimization
- How to handle edge cases (very little company data, no ICP match)
- Loading animation specifics
- Exact color thresholds for score ranges (what score = green vs yellow vs red)
- Which 5-6 components to use if some ICP data is sparse

</decisions>

<specifics>
## Specific Ideas

- Score presentation should feel trustworthy and data-backed, not gimmicky — large number + colored horizontal bars is the right level of visual weight
- The expandable component details give power users the "why" without cluttering the view for quick scanners
- Auto-start analysis after extraction means the user flow is: paste URL → watch extraction → watch analysis → see results. Minimal clicks.
- The "Analyze Another" button enables a batch qualification workflow where sales reps qualify multiple leads in a session

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ai-analysis*
*Context gathered: 2026-02-06*
