# LeadQual - AI Sales Qualification Platform

## What This Is

A SaaS platform that helps sales teams automatically qualify leads by analyzing company data. Users input a company URL, and AI scrapes, analyzes, and scores the company against the user's defined Ideal Customer Profile (ICP) — generating personalized lead scores, pitch recommendations, and objection handling strategies. Built as a portfolio project showcasing full-stack + AI skills, but designed to be production-ready and monetizable.

## Core Value

Two different users analyzing the same company get completely different, actionable recommendations based on their unique ICP — this personalization is what makes generic lead scoring actually useful for closing deals.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication with Supabase Auth
- [ ] ICP setup wizard during onboarding (company info, target criteria, value props, common objections)
- [ ] ICP management in settings (edit, create multiple profiles)
- [ ] Company URL input for analysis
- [ ] Web scraping with graceful degradation (website first, enrichment API fallback, manual input fallback)
- [ ] AI-powered company analysis using OpenAI GPT-4o
- [ ] Lead scoring (1-100) with breakdown
- [ ] ICP match percentage calculation with weighted criteria
- [ ] Company insights extraction (size, industry, tech stack, funding)
- [ ] Personalized pitch angle generation based on user's value props + target context
- [ ] Objection prediction based on company profile vs user's common objections
- [ ] Dashboard with lead list sorted by score
- [ ] Dashboard filtering (score range, ICP match %, industry, date)
- [ ] Lead actions (view analysis, export to CRM format, archive, re-analyze)
- [ ] Bulk actions (CSV export, multi-archive)
- [ ] Dashboard quick stats (leads analyzed, average score, top industries)
- [ ] Stripe subscription integration (free + pro tiers)
- [ ] Usage tracking (analyses count per billing period)
- [ ] Feature gating (free tier: basic analysis only; pro tier: full analysis)
- [ ] Soft limits with warning at 80%, block at 100% with upgrade CTA

### Out of Scope

- LinkedIn scraping — high risk of blocks, defer to Sales Navigator API integration in v2
- Team workspaces — v2 feature, requires shared lead pools and permissions
- Direct CRM integrations (Salesforce/HubSpot APIs) — v1 uses copy-to-clipboard export format
- Real-time chat/support — not needed for MVP
- Mobile app — web-first approach
- Custom AI model training — GPT-4o via API is sufficient for v1

## Context

**Target Users:** Sales teams, SDRs (Sales Development Reps), BDRs (Business Development Reps), sales agencies who need to quickly qualify and prioritize leads.

**User Workflow:** Sign up → Complete ICP wizard → Paste company URL → Get instant analysis with score, insights, pitch angles → Dashboard accumulates analyzed leads → Filter to find hottest leads → Grab pitch recommendations → Go sell.

**Scraping Strategy:** Primary source is company website (most accessible). Enrichment APIs (Clearbit, Apollo, Hunter.io) as fallback for missing data. Partial results always shown with confidence indicators. Manual input form as last resort. Key principle: Never show blank failure — always something actionable.

**Pricing Model:**
- Free tier: 10 analyses/month, basic analysis, single ICP, 7-day history, watermark on exports
- Pro tier ($29-49/month): 100 analyses/month, full analysis with pitch angles + objections, unlimited ICPs, unlimited history, CSV export, no watermark, priority enrichment

**Portfolio Context:** This is a portfolio piece demonstrating full-stack + AI integration skills, but should be production-quality code that could genuinely be monetized.

## Constraints

- **Tech Stack**: Next.js 15 + Tailwind CSS + shadcn/ui + Supabase + OpenAI GPT-4o — chosen for modern stack demonstration and rapid development
- **Scraping**: Must handle failures gracefully; no direct LinkedIn scraping in v1
- **AI Costs**: OpenAI API costs scale with usage; pricing tiers must account for this
- **Data Privacy**: Company data scraped must be handled appropriately; user ICP data is sensitive business info

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Usage-based pricing with feature gating | Simple architecture: same AI call, filtered response for free tier | — Pending |
| Supabase for auth + database | Integrated auth + PostgreSQL, fast to implement, good DX | — Pending |
| Graceful scraping degradation | Better UX than hard failures; always provide actionable output | — Pending |
| Single ICP on free tier, unlimited on pro | Creates natural upgrade path without crippling free experience | — Pending |
| Website scraping over LinkedIn | LinkedIn actively blocks; company websites more reliable for v1 | — Pending |

---
*Last updated: 2025-01-22 after initialization*
