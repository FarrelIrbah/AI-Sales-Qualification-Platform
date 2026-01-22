# Research Summary

**Project:** AI Sales Qualification Platform
**Synthesized:** 2026-01-22
**Overall Confidence:** MEDIUM

---

## Executive Summary

This AI sales qualification platform differentiates itself through **ICP-personalized scoring** rather than generic lead scoring. The recommended architecture is a Next.js 16 modular monolith with Supabase (PostgreSQL + Auth), OpenAI GPT-4o for analysis, and Playwright for web scraping. The critical insight is that generic lead scoring is commoditized; personalization to the user's specific ideal customer profile, combined with actionable outputs (pitch angles, objection predictions), creates defensible value.

The highest-risk areas are **web scraping reliability** (30-50% failure rates without proper fallback architecture) and **AI cost management** (costs can exceed revenue 10x without token tracking and rate limiting). Both must be addressed with robust architectures from day one, not retrofitted. The ICP onboarding wizard is also a churn risk if it asks for structured data instead of natural language input.

A modular monolith on Vercel/Supabase provides fast iteration for portfolio/MVP stage while maintaining a clear upgrade path. The 6-phase build order follows dependencies: Foundation > ICP/Scraping (parallel) > AI Analysis > Dashboard > Billing > Polish.

---

## Recommended Stack

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| Framework | Next.js | 16.x | App Router, Server Components, API routes, Vercel-native |
| Database | Supabase PostgreSQL | latest | Managed PostgreSQL, RLS for multi-tenant, built-in Auth |
| ORM | Drizzle | latest | Lightweight, edge-friendly, type-safe (Prisma too heavy) |
| AI | OpenAI GPT-4o | latest | Best structured output support, proven for analysis |
| AI SDK | Vercel AI SDK | 4.x | Streaming, provider-agnostic, Zod schema validation |
| Scraping | Playwright + Cheerio | latest | Playwright for JS sites, Cheerio for static (graceful degradation) |
| UI | Tailwind CSS + shadcn/ui | 4.x / latest | Rapid dashboard development, accessible components |
| Payments | Stripe | latest | Usage-based billing, webhooks, industry standard |
| State | TanStack Query + Zustand | 5.x / 4.x | Server state caching + lightweight client state |

**Critical version notes:** Next.js 16 and Tailwind 4 are verified current. Drizzle over Prisma for edge runtime compatibility.

---

## Table Stakes Features

Must-have features users expect from any lead qualification tool:

| Feature | Notes |
|---------|-------|
| Lead scoring (1-100) with breakdown | Score + "why" explanation, not just number |
| Company data enrichment | Industry, size, location extracted automatically |
| Dashboard with lead list | Sort, filter, search - standard SaaS pattern |
| Score filtering (hot/warm/cold) | Sales teams work prioritized lists |
| Export (CSV, clipboard) | Data must leave system for CRM/outreach |
| User authentication | OAuth + email/password via Supabase Auth |
| Subscription billing | Free tier + Pro tier with clear value |
| Analysis history | Users revisit past analyses |

---

## Key Differentiators

Features that create competitive advantage over Clearbit, Apollo, ZoomInfo:

| Feature | Value | Priority |
|---------|-------|----------|
| **ICP-personalized scoring** | Same company scores differently for different users based on THEIR ideal customer | MVP CORE |
| **Personalized pitch angle generation** | AI writes first-draft outreach based on company + user's value props | MVP CORE |
| **Objection prediction** | AI anticipates pushback based on company profile vs user's common objections | MVP CORE |
| **ICP match percentage** | Explicit % showing how well company matches ideal profile | MVP |
| **Graceful degradation** | Always shows something useful, even with partial scraping data | MVP |
| Confidence indicators | Data freshness/reliability shown alongside insights | Should-have |

**Positioning:** "Generic lead scoring gives everyone the same score. LeadQual scores companies based on YOUR ideal customer profile, then tells you exactly how to pitch them and what objections to expect."

---

## Architecture Highlights

### Main Components

```
Browser (React) --> Next.js App (API Routes) --> External APIs (OpenAI, Enrichment)
                            |
                            v
                    Supabase (PostgreSQL + Auth + Storage)
```

| Component | Responsibility |
|-----------|---------------|
| UI Layer | React Server/Client Components, shadcn/ui, forms |
| API Routes | Auth validation, orchestration, rate limiting |
| ICP Service | ICP CRUD, validation, matching logic |
| Scraping Service | Playwright/Cheerio with fallback chain |
| Analysis Service | OpenAI orchestration, prompt building, parsing |
| Scoring Service | Weighted scoring algorithm, ICP matching |
| Billing Service | Stripe integration, usage tracking |

### Key Patterns

1. **Graceful Degradation in Scraping:** Website scraping > Enrichment APIs > Manual input. Never return empty.
2. **Tier-Based Response Filtering:** Same AI call for all tiers, filter response based on user tier.
3. **Usage Limit Enforcement:** Check limits before expensive operations, not after.
4. **Structured AI Output:** Use Zod schemas with OpenAI JSON mode for predictable parsing.

### Build Order (Dependency-Based)

1. **Foundation:** Database schema, Supabase setup, Auth, basic UI shell
2. **Core Domain:** ICP Service + wizard, User profiles (depends on Auth)
3. **Analysis Pipeline:** Scraping > Analysis > Scoring (sequential dependencies)
4. **Dashboard:** Lead list, detail view, filtering (depends on stored analyses)
5. **Monetization:** Stripe, usage tracking, feature gating (depends on Dashboard)
6. **Polish:** Demo mode, exports, optimizations

---

## Critical Pitfalls to Avoid

### 1. Score Without Explanation (CRITICAL)

**Risk:** Users see "Lead Score: 73" with no breakdown, don't trust it, ignore it, churn.

**Prevention:** Design score breakdown from day one. Store component scores (industry fit, size fit, tech fit, need signals). Show "why" in UI. Confidence indicators on all data.

**Address in:** Phase 1 (schema design) and Phase 3 (AI prompts)

---

### 2. Scraping Brittleness (CRITICAL)

**Risk:** 30-50% of analyses fail in production. Users hit errors on important leads.

**Prevention:** Implement full fallback chain: Website (Playwright) > Enrichment APIs > Partial results > Manual input fallback. Never return completely empty. Track success rates.

**Address in:** Phase 2 (Scraping Infrastructure)

---

### 3. AI Cost Explosion (CRITICAL)

**Risk:** Free tier abuse, bulk users, inefficient prompts. Costs exceed revenue 10x.

**Prevention:** Token counting before API calls. Extract relevant content only (not full HTML). Hard per-user rate limits. Cost tracking per analysis. Daily spend alerts. Cache repeated analyses.

**Address in:** Phase 3 (AI Integration)

---

### 4. ICP Wizard Abandonment (MODERATE)

**Risk:** 50%+ abandonment if wizard asks for 10+ structured fields.

**Prevention:** Natural language first: "Describe your best customer in a sentence." Use AI to parse into structured ICP. Provide examples/templates. Show immediate value with sample analysis.

**Address in:** Phase 2 (ICP System)

---

### 5. Usage Tracking Drift (MODERATE)

**Risk:** Usage counts drift from reality. Billing disputes, trust destruction.

**Prevention:** Single increment point on successful completion only. Idempotent counting with analysis ID. Separate attempted/completed/billed status. Daily reconciliation job.

**Address in:** Phase 5 (Billing)

---

## Recommendations for Roadmap

### Suggested Phase Structure

| Phase | Focus | Delivers | Pitfalls to Address |
|-------|-------|----------|---------------------|
| 1. Foundation | Auth, DB schema, UI shell | Login, signup, protected routes, base layout | Score breakdown fields in schema |
| 2. ICP & Scraping | ICP wizard + scraping with fallbacks | Natural language ICP creation, reliable data extraction | Wizard UX, graceful degradation |
| 3. AI Analysis | OpenAI integration, scoring algorithm | Lead analysis with pitch/objections, score breakdown | Cost tracking, prompt management, hallucination indicators |
| 4. Dashboard | Lead list, detail view, filtering | Usable product for analyzing and managing leads | Pagination, indexes, performance at scale |
| 5. Billing | Stripe, usage limits, feature gating | Monetization, free/pro tiers working | Webhook reliability, usage drift |
| 6. Polish | Demo mode, exports, edge cases | Portfolio-ready, CRM export, demo for evaluators | Export format testing, demo data |

### Research Flags

| Phase | Research Needed? | Notes |
|-------|-----------------|-------|
| Phase 1 (Foundation) | NO | Well-documented patterns (Next.js, Supabase, shadcn) |
| Phase 2 (ICP & Scraping) | YES | Playwright on serverless has gotchas, test fallback chain |
| Phase 3 (AI Analysis) | YES | Prompt engineering needs iteration, cost optimization |
| Phase 4 (Dashboard) | NO | Standard CRUD patterns |
| Phase 5 (Billing) | MAYBE | Stripe metered billing has nuances |
| Phase 6 (Polish) | NO | Standard SaaS polish work |

### Dependencies to Respect

- ICP must exist before any analysis (analysis is personalized)
- Scraping must complete before AI analysis (AI needs data)
- Analysis results must store before dashboard (dashboard reads stored data)
- Billing must exist before feature gating (gates check tier)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js/Tailwind versions verified, rest well-established |
| Features | MEDIUM | Based on training data competitive analysis, validate with market |
| Architecture | MEDIUM | Established patterns, verify Next.js 16 specifics during implementation |
| Pitfalls | MEDIUM-HIGH | Common patterns, but no real-time verification available |

### Gaps to Address

1. **Playwright on Vercel:** Function timeout limits (30s hobby, 60s pro) may require background workers for complex scrapes
2. **Supabase Edge Functions vs Vercel Edge Runtime:** Unclear which is better for scraping workload
3. **AI cost optimization:** Exact token costs for company analysis need prototyping
4. **Free tier limits:** 10/month is guess; needs user validation
5. **Scraping success rates:** Need testing at scale to know real-world reliability

---

## Sources

**From STACK.md:**
- Next.js 16.1.4, Tailwind 4.1 verified via official docs
- Drizzle/Supabase/Vercel AI SDK based on training data (May 2025)
- Enrichment API recommendations (Clearbit, Apollo) from industry knowledge

**From FEATURES.md:**
- Competitive analysis from training data (Clearbit, Apollo, ZoomInfo, 6sense, Leadfeeder)
- Feature dependencies from logical product inference
- Anti-features from sales tech industry patterns

**From ARCHITECTURE.md:**
- Modular monolith pattern from Next.js SaaS best practices
- RLS patterns from Supabase documentation
- Service layer patterns from established SaaS architecture

**From PITFALLS.md:**
- AI product failure patterns from training data
- Web scraping production challenges documented across industry
- Stripe webhook handling best practices

---

*Synthesis complete. Ready for roadmap creation.*
