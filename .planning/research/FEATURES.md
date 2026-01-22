# Feature Landscape: AI Sales Qualification Platform

**Domain:** AI-powered lead scoring and sales intelligence SaaS
**Researched:** 2026-01-22
**Confidence:** MEDIUM (based on training data; WebSearch unavailable for verification)

## Context

This analysis maps the feature landscape for AI sales qualification platforms, categorizing features as table stakes (must-have), differentiators (competitive advantage), and anti-features (deliberately avoid). The analysis considers the competitive landscape including tools like Clearbit, Apollo.io, ZoomInfo, 6sense, Leadfeeder, and emerging AI-native solutions.

---

## Table Stakes

Features users expect from any lead scoring/qualification tool. Missing these = users leave.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Lead scoring (numeric)** | Core value prop of category; users need prioritization signal | Medium | 1-100 scale is industry standard. Must explain score, not just show number. |
| **Company data enrichment** | Users expect basic firmographics without manual research | Medium | Industry, size, location, website. Minimum viable intelligence. |
| **Dashboard/lead list** | Users need central view of all analyzed leads | Medium | Sort, filter, search. Standard SaaS pattern. |
| **Score filtering** | Sales teams work hot-to-cold; filtering by score is essential | Low | Score ranges, quick filters (hot/warm/cold). |
| **Export functionality** | Data must leave the system for CRM, spreadsheets, outreach tools | Low | CSV minimum. Copy-to-clipboard for quick use. |
| **User authentication** | SaaS baseline; protects user data and enables personalization | Low | Email/password, OAuth (Google). Nothing special needed. |
| **Subscription/billing** | Monetization foundation; users expect clear tiers | Medium | Free trial or freemium is expected in this space. |
| **Company URL/domain input** | Primary way users identify prospects | Low | Single URL input, validation, duplicate detection. |
| **Basic company insights** | Beyond score, users want to see the "why" | Medium | Size, industry, tech stack basics. Not just the number. |
| **Analysis history** | Users return to review past analyses | Low | List of analyzed companies, ability to revisit. |
| **Score breakdown/explanation** | Users need to understand and trust the score | Medium | Factor-by-factor breakdown. "Why 72?" must be answerable. |

**Confidence:** HIGH for these being table stakes. Every competitor in this space has these features.

---

## Differentiators

Features that set the product apart. Not universally expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **ICP-personalized scoring** | Same company scores differently for different users based on their ideal customer profile | High | THIS IS THE CORE DIFFERENTIATOR. Generic lead scoring is commodity; personalized is not. |
| **Personalized pitch angle generation** | AI writes first-draft outreach based on company + user's value props | High | Saves SDRs 10-15 min per lead. Directly actionable output. |
| **Objection prediction** | AI anticipates pushback based on company profile vs user's common objections | High | Helps reps prepare, increases close rates. Unique in market. |
| **ICP match percentage** | Explicit % showing how well company matches ideal profile | Medium | More granular than just score; explains fit specifically. |
| **Graceful degradation on scraping** | Always shows something useful, even with partial data | Medium | Competitors often show blank failures. "Always actionable" is differentiating. |
| **Confidence indicators** | Shows data freshness/reliability alongside insights | Low | Builds trust. "This data is 2 months old" vs silent staleness. |
| **Multiple ICP profiles** | Users can score same company against different ideal profiles | Medium | Agencies with multiple clients, sales teams with multiple products. |
| **Weighted criteria customization** | Users tune which factors matter most for their scoring | Medium | "Tech stack matters more than company size for us." |
| **Bulk analysis** | Analyze multiple URLs at once (CSV upload) | Medium | Efficiency for users with large prospect lists. |
| **Re-analysis capability** | Update analysis as company changes or user's ICP evolves | Low | Data gets stale; re-scraping adds value. |
| **Industry-specific scoring models** | Different scoring logic for SaaS vs manufacturing vs services | High | One-size-fits-all scoring misses nuance. Defer to v2+. |

**Confidence:** MEDIUM-HIGH. Based on competitive analysis from training data and understanding of sales team workflows.

### MVP Differentiator Priority

1. **ICP-personalized scoring** - Core differentiator, must be in MVP
2. **Personalized pitch angle generation** - High value, immediate actionability
3. **Objection prediction** - Unique, high value for sales prep
4. **ICP match percentage** - Reinforces personalization story
5. **Graceful degradation** - UX differentiator, reduces churn from failed analyses

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time LinkedIn scraping** | LinkedIn actively blocks, causes legal/ToS issues, unreliable | Use website scraping + enrichment APIs. Consider official LinkedIn API in v2 (requires partnership). |
| **Automated outreach sending** | Deliverability nightmare, spam concerns, not core competency | Generate copy, let users paste into their outreach tool. "Qualify, don't spam." |
| **Contact database/list purchase** | Commoditized, data quality issues, privacy concerns, not differentiated | Focus on analyzing user-provided URLs, not being another ZoomInfo. |
| **CRM replacement features** | CRM is established workflow; competing with Salesforce/HubSpot is losing battle | Export TO CRMs, don't try to replace pipeline management. |
| **Team collaboration features (v1)** | Adds complexity, requires permissions, shared state, conflict resolution | Single-user first. Team features in v2 after validating core value. |
| **Real-time alerts/notifications** | Requires background monitoring, infrastructure complexity, unclear value | Users analyze on-demand. Alerts can come later if validated. |
| **Custom AI model training** | Expensive, complex, requires data pipeline, unclear if better than GPT-4 | Use GPT-4o with good prompting. Custom models are v3+ optimization. |
| **Mobile app (v1)** | Development overhead, users do qualification at desk | Web-first, mobile-responsive. Native app only if validated need. |
| **Social media analysis** | Data access restrictions, privacy concerns, questionable signal value | Focus on company website + business data sources. |
| **Predictive "next best action"** | Over-promising, hard to validate accuracy, complex ML | Stick to scoring + recommendations. Don't predict the future. |
| **Intent data integration** | Expensive third-party data, complex integration, unclear ROI for SMB | Defer until validated demand from paying users. |
| **Unlimited free tier** | Unsustainable, attracts low-quality users, AI costs are real | Generous free tier (10/month) with clear upgrade path. |

**Confidence:** HIGH. These are learned lessons from the sales tech space.

---

## Feature Dependencies

```
Authentication
    |
    v
ICP Setup Wizard -----> Multiple ICP Profiles (v2 for free, v1 for pro)
    |
    v
Company URL Input
    |
    v
Web Scraping Engine --> Graceful Degradation
    |
    v
AI Analysis Pipeline
    |
    +---> Lead Score (1-100)
    +---> Score Breakdown
    +---> ICP Match %
    +---> Company Insights
    +---> Pitch Angle Generation
    +---> Objection Prediction
    |
    v
Dashboard
    |
    +---> Lead List (requires: analysis history storage)
    +---> Filtering (requires: lead list)
    +---> Export (requires: lead list)
    +---> Bulk Actions (requires: lead list)
    |
    v
Subscription/Billing --> Feature Gating --> Usage Tracking
```

### Critical Path Dependencies

1. **ICP must exist before analysis** - Analysis is personalized to ICP
2. **Scraping must complete before AI analysis** - AI needs data to analyze
3. **Analysis must store before dashboard** - Dashboard reads from storage
4. **Billing must exist before feature gating** - Gates require tier knowledge

---

## MVP Recommendation

Based on the planned features in PROJECT.md and this analysis:

### Must Have for MVP (Table Stakes + Core Differentiator)

1. User authentication
2. ICP setup wizard
3. Company URL input + web scraping with graceful degradation
4. AI-powered lead scoring with breakdown
5. ICP match percentage
6. Company insights extraction
7. **Personalized pitch angle generation** (core differentiator)
8. **Objection prediction** (core differentiator)
9. Dashboard with lead list, filtering, basic actions
10. Export (CSV, copy-to-clipboard)
11. Stripe subscription with free/pro tiers
12. Usage tracking + feature gating

### Should Have for MVP (Strong Differentiators)

1. Confidence indicators on data
2. Re-analysis capability
3. Dashboard quick stats

### Defer to Post-MVP

| Feature | Reason to Defer |
|---------|-----------------|
| Multiple ICP profiles (free tier) | Pro-tier only in v1, expand later |
| Bulk URL analysis (CSV upload) | Nice-to-have, not core value |
| Weighted criteria customization | Complexity; default weights work for most users |
| Industry-specific scoring models | Requires user validation of what matters |
| Team workspaces | Significant complexity increase |
| Direct CRM integrations | API work, partnerships, testing matrix |
| LinkedIn/Sales Navigator integration | Legal/ToS concerns, requires partnership |

---

## Competitive Positioning

### Where LeadQual Fits

| Competitor | Focus | LeadQual Differentiation |
|------------|-------|-------------------------|
| Clearbit | Data enrichment | LeadQual adds personalized scoring + actionable recommendations |
| Apollo.io | Database + outreach | LeadQual focuses on qualification depth, not contact database |
| ZoomInfo | Enterprise data | LeadQual is SMB-friendly, ICP-personalized, lower price |
| 6sense | Intent data | LeadQual uses company analysis, not behavioral intent |
| Leadfeeder | Website visitors | LeadQual qualifies any URL, not just visitors |
| Generic lead scoring | Firmographic scoring | LeadQual personalizes to YOUR ideal customer |

### Positioning Statement

"Generic lead scoring gives everyone the same score. LeadQual scores companies based on YOUR ideal customer profile, then tells you exactly how to pitch them and what objections to expect."

---

## Feature Complexity Estimates

| Feature Category | Complexity | Notes |
|------------------|------------|-------|
| Authentication + User Management | Low | Supabase handles heavy lifting |
| ICP Setup Wizard | Medium | Form logic, storage, validation |
| Web Scraping | High | Error handling, rate limiting, fallbacks, parsing variability |
| AI Analysis Pipeline | High | Prompt engineering, structured output, cost management |
| Lead Scoring Algorithm | Medium | Weighted calculation, score normalization |
| Pitch Generation | Medium | Prompt engineering, quality tuning |
| Objection Prediction | Medium | Prompt engineering, mapping to user's objection library |
| Dashboard | Medium | Standard CRUD, filtering, sorting |
| Export | Low | CSV generation, clipboard API |
| Stripe Integration | Medium | Subscriptions, webhooks, usage tracking |
| Feature Gating | Low-Medium | Middleware/conditional rendering based on tier |

---

## Sources and Confidence

| Finding | Source | Confidence |
|---------|--------|------------|
| Table stakes features | Training data: competitive analysis of Clearbit, Apollo, ZoomInfo, 6sense, Leadfeeder | MEDIUM |
| ICP personalization as differentiator | Training data: market gap analysis | MEDIUM |
| Anti-features list | Training data: sales tech industry patterns, LinkedIn ToS issues | MEDIUM-HIGH |
| Feature dependencies | Logical inference from product requirements | HIGH |
| Complexity estimates | Training data: typical SaaS development patterns | MEDIUM |

**Note:** WebSearch was unavailable for this research. Findings are based on training data which may be 6-18 months stale. Recommend validating specific competitor feature sets with current research before final decisions.

---

## Open Questions for Validation

1. **Pitch generation quality:** How much prompt engineering is needed to generate genuinely useful pitch angles? Requires prototyping.
2. **Objection prediction accuracy:** Can AI reliably predict objections from company profile? Needs user feedback.
3. **Scoring algorithm calibration:** What weights work best by default? Needs user validation post-launch.
4. **Free tier limits:** Is 10/month the right number? Competitor analysis and user feedback needed.
5. **Scraping reliability:** What % of company websites can be successfully scraped? Requires testing at scale.

---

*Generated for LeadQual AI Sales Qualification Platform*
*Research type: Features dimension*
*Last updated: 2026-01-22*
