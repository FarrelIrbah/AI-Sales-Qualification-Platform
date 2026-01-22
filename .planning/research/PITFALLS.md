# Domain Pitfalls

**Domain:** AI Sales Qualification Platform (Lead Scoring, Web Scraping, OpenAI Integration)
**Researched:** 2026-01-22
**Confidence:** MEDIUM (based on training data patterns; WebSearch unavailable for verification)

---

## Critical Pitfalls

Mistakes that cause rewrites, cost overruns, or product failure.

---

### Pitfall 1: The "AI Magic" Scoring Problem

**What goes wrong:** Teams build lead scoring that outputs numbers (1-100) without explainability. Users see "Lead Score: 73" but have no idea WHY. This destroys trust instantly. Sales reps ignore scores they don't understand, rendering the entire product useless.

**Why it happens:** Developers focus on the algorithm producing a number, not on making that number defensible. GPT-4o can easily output a score, but prompting it to also provide the reasoning breakdown requires deliberate architecture.

**Consequences:**
- Users don't trust the scores and ignore them
- Support tickets spike asking "why did X get scored Y?"
- No ability to improve scoring because you can't see what's wrong
- Product gets abandoned after trial period

**Prevention:**
- Design score breakdown from day one: every score must have component parts (e.g., "Company Size: +15, Industry Match: +20, Tech Stack: -5")
- Store the reasoning, not just the final number
- Show confidence indicators ("HIGH confidence" vs "LIMITED data available")
- Allow users to see and eventually weight the scoring factors

**Detection (warning signs):**
- You're storing just `score: 73` in the database
- The UI mockup shows a number without breakdown
- AI prompts ask for "a score" not "a score with reasoning"

**Phase relevance:** Address in Phase 1 (Foundation) — schema and AI prompt design must include breakdown fields from start.

---

### Pitfall 2: Scraping Brittleness Causing Cascading Failures

**What goes wrong:** Web scraping fails silently or catastrophically. A company website blocks the scraper, returns a CAPTCHA, or has unusual structure — and the entire analysis fails. Users see error messages or blank results, destroying confidence in the product.

**Why it happens:** Happy-path development. Developers test on 10-20 sites that work, ship it, and then discover the vast diversity of how websites block, redirect, require JavaScript, or structure content.

**Consequences:**
- 30-50% of analyses fail in production (higher than expected)
- Users hit errors on their most important leads (Murphy's Law)
- Support burden becomes unmanageable
- Reputation damage ("it never works")

**Prevention:**
- Implement the graceful degradation stack from PROJECT.md: Website -> Enrichment APIs -> Manual input
- Design for partial success: "We found company size and industry, but couldn't determine tech stack"
- Add scraping health monitoring: track success rates by site structure type
- Implement retry with different strategies (different User-Agents, Puppeteer vs Playwright, etc.)
- Never return completely empty results — always have a minimum viable analysis even with just the URL domain

**Detection (warning signs):**
- No error handling around scraping calls
- Single scraping strategy with no fallback
- No partial result schema (it's all-or-nothing)
- No monitoring for scraping success rates

**Phase relevance:** Address in Phase 2 (Scraping Infrastructure) — build fallback chain before any AI analysis. Test with adversarial sites.

---

### Pitfall 3: OpenAI Cost Explosion

**What goes wrong:** AI costs spiral out of control. A single company analysis seems cheap ($0.02-0.10), but aggressive users run bulk analyses, free tier abuse happens, and costs exceed revenue by 10x before anyone notices.

**Why it happens:**
- Underestimating token usage (scraped website content is HUGE)
- No per-user rate limiting
- Free tier abuse (users create multiple accounts)
- Prompts that are inefficient (sending full page content instead of extracted relevant sections)

**Consequences:**
- Burn rate exceeds revenue making business unsustainable
- Emergency scramble to add rate limits (breaking user expectations)
- Forced to raise prices or kill free tier (reputation damage)
- Technical debt from rushed cost controls

**Prevention:**
- Implement token counting BEFORE sending to API — estimate cost and enforce limits
- Extract relevant content before sending to GPT-4o (don't send full HTML, send structured extracted data)
- Set hard per-user rate limits at infrastructure level (not just UI)
- Implement cost tracking per analysis in database from day one
- Set cost alerts: if daily spend exceeds $X, alert immediately
- Consider caching: same company analyzed twice in 24h? Return cached result

**Detection (warning signs):**
- No token counting in codebase
- Sending raw scraped HTML to GPT-4o
- No per-user usage tracking table
- "We'll add rate limits later"
- No cost monitoring dashboard

**Phase relevance:** Address in Phase 3 (AI Integration) — token management and cost tracking must be built alongside AI calls, not retrofitted.

---

### Pitfall 4: ICP Configuration That Users Can't Complete

**What goes wrong:** The ICP setup wizard is too complex, too vague, or too intimidating. Users abandon during onboarding because they don't know how to describe their ideal customer in the format the system needs.

**Why it happens:** Developers think in data structures. "We need industry, company_size, tech_stack, pain_points as structured fields." But users think in natural language: "I sell to mid-size SaaS companies who struggle with customer churn."

**Consequences:**
- High drop-off during onboarding (50%+ abandon)
- Users complete ICP poorly, resulting in useless scoring
- Low activation rate despite signups

**Prevention:**
- Start with guided questions, not form fields: "Describe your best customer in a sentence"
- Use AI to parse natural language into structured ICP (GPT-4o can do this)
- Provide examples and templates
- Allow progressive refinement: start simple, let users add detail over time
- Show immediate value: after minimal ICP input, analyze a sample company to show it works

**Detection (warning signs):**
- ICP wizard has 10+ required fields
- No examples or templates provided
- Technical field names exposed to users
- No analytics on wizard step completion rates planned

**Phase relevance:** Address in Phase 4 (ICP System) — design wizard with user testing mindset, not developer mindset. Consider AI-assisted ICP parsing.

---

### Pitfall 5: Usage Tracking Drift (Billing Disasters)

**What goes wrong:** Usage tracking (analyses count) drifts from reality. Free tier users somehow run 50 analyses. Pro users get charged for analyses that failed. Tracking shows different numbers than actual API calls.

**Why it happens:**
- Counting analyses at wrong point (before vs after completion)
- Not handling retries correctly (retry = 2 analyses?)
- Race conditions in concurrent usage updates
- Failed analyses counted toward limits (or not counted but still cost money)

**Consequences:**
- Users complain about inaccurate limits
- Billing disputes
- Revenue leakage (giving away free analyses)
- Trust destruction
- Potential legal issues with incorrect billing

**Prevention:**
- Single source of truth: one table, one increment point
- Count on SUCCESS only (after AI returns valid result)
- Idempotent counting: analysis ID prevents double-counting
- Separate "attempted" vs "completed" vs "billed" statuses
- Reconciliation job: daily check that tracked usage matches actual API calls
- Audit log: every analysis linked to API call ID

**Detection (warning signs):**
- Multiple places in code that increment usage counter
- No analysis status field (just "analyzed" boolean)
- Usage increment before API call completes
- No reconciliation or audit planned

**Phase relevance:** Address in Phase 5 (Billing/Subscriptions) — design tracking model before implementing limits. Test with simulated failures and race conditions.

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded UX.

---

### Pitfall 6: Prompt Engineering as Afterthought

**What goes wrong:** AI prompts are written once and forgotten. They work in demos but produce inconsistent, verbose, or incorrectly formatted results in production. Different companies get wildly different quality analyses.

**Why it happens:** Prompts feel like configuration, not code. No version control, no testing, no iteration process.

**Prevention:**
- Treat prompts as code: version control, review process
- Build prompt testing harness: run same company through prompt variations, compare outputs
- Log prompts with outputs: when analysis is bad, you can see what prompt produced it
- Use structured output (JSON mode) to enforce response format
- Iterate based on real production outputs, not just test cases

**Detection (warning signs):**
- Prompts are inline strings in code
- No prompt versioning strategy
- No plan for prompt A/B testing
- Assuming GPT-4o "just works"

**Phase relevance:** Address in Phase 3 (AI Integration) — build prompt management infrastructure alongside initial integration.

---

### Pitfall 7: Dashboard Performance Cliff

**What goes wrong:** Dashboard loads fast with 10 leads, acceptably with 100 leads, and becomes unusable with 1000+ leads. Power users (exactly who you want) have the worst experience.

**Why it happens:** Initial development uses small datasets. Queries that work fine become O(n^2) nightmares with real data. No pagination, no indexing, no query optimization.

**Prevention:**
- Design with pagination from start (cursor-based, not offset)
- Add database indexes on filter fields (score, created_at, industry, icp_match)
- Implement virtual scrolling or lazy loading in UI
- Test with 10,000 rows early, not after launch
- Consider materialized views for complex dashboard stats

**Detection (warning signs):**
- `SELECT *` queries without LIMIT
- Filtering in JavaScript instead of database
- No pagination in API design
- Dashboard stats calculated on every page load

**Phase relevance:** Address in Phase 6 (Dashboard) — design queries with scale in mind. Add realistic seed data for testing.

---

### Pitfall 8: Enrichment API Rate Limits Ignored

**What goes wrong:** Enrichment APIs (Clearbit, Apollo, Hunter.io) have rate limits. Bulk analysis triggers 429 errors, analyses fail, and API keys get temporarily banned.

**Why it happens:** Single-analysis testing never hits rate limits. Production bulk usage does.

**Prevention:**
- Implement rate limiting client-side (queue with delays)
- Track rate limit headers from APIs
- Graceful degradation when enrichment fails (continue with website data only)
- Consider caching: company enrichment data doesn't change daily
- Stagger requests: don't fire 100 enrichment calls simultaneously

**Detection (warning signs):**
- No rate limiting in enrichment service
- Synchronous bulk analysis processing
- No caching layer for enrichment data
- Error handling just logs and continues

**Phase relevance:** Address in Phase 2 (Scraping/Enrichment) — build rate-aware enrichment client from start.

---

### Pitfall 9: Scraping Legal Exposure

**What goes wrong:** Aggressive scraping practices violate Terms of Service, trigger DMCA concerns, or in extreme cases lead to legal threats from scraped sites.

**Why it happens:** Focus on technical capability without legal review. "We can scrape it" doesn't mean "we should scrape it."

**Prevention:**
- Respect robots.txt
- Use reasonable request rates (not hammering servers)
- Don't scrape behind authentication
- Don't store copyrighted content verbatim (extract facts only)
- Consider using official APIs when available (even if paid)
- Terms of Service disclaimer for users about data usage
- Avoid sites with explicit anti-scraping legal warnings

**Detection (warning signs):**
- Ignoring robots.txt
- No request rate limiting
- Storing full page HTML long-term
- Scraping sites that explicitly prohibit it

**Phase relevance:** Address in Phase 2 (Scraping) — build ethical scraping practices into architecture, not as afterthought.

---

### Pitfall 10: AI Hallucination Passing as Fact

**What goes wrong:** GPT-4o confidently generates company information that is simply wrong. "Company X raised $50M Series B" when they didn't. Users make sales decisions based on hallucinated data, embarrass themselves in calls, and blame your product.

**Why it happens:** LLMs hallucinate. Period. Treating AI output as fact without verification is a fundamental error.

**Prevention:**
- Clearly label AI-generated insights as "AI-analyzed" with confidence levels
- Separate verified data (from scraping/APIs) from AI inferences
- Don't claim facts you can't source: "Based on website content, company appears to be..." not "Company is..."
- Add disclaimers: "Verify critical information before sales calls"
- Consider fact-checking layer for key claims (funding, employee count)

**Detection (warning signs):**
- UI doesn't distinguish data sources
- No confidence indicators
- AI insights presented as facts
- No disclaimers about AI limitations

**Phase relevance:** Address in Phase 3 (AI Integration) and Phase 6 (Dashboard) — confidence indicators must be first-class UI elements.

---

## Minor Pitfalls

Mistakes that cause annoyance or minor issues but are fixable.

---

### Pitfall 11: Export Format Unusability

**What goes wrong:** CSV/CRM export format looks good to developers but is unusable for actual CRM import. Field names don't match, date formats break, special characters corrupt data.

**Prevention:**
- Research actual CRM import formats (HubSpot, Salesforce CSV specs)
- Test export by actually importing into a CRM
- Handle special characters (commas in company names, UTF-8)
- Include clear headers and consistent date formats (ISO 8601)

**Phase relevance:** Address in Phase 6 (Dashboard) — test with real CRM import.

---

### Pitfall 12: Re-analysis Confusion

**What goes wrong:** Users re-analyze a company but old data persists. Or new analysis overwrites history users wanted to keep. Or re-analysis counts double against limits.

**Prevention:**
- Clear versioning: analyses have versions, users can see history
- Explicit UX: "Re-analyze will create new version and count as 1 analysis"
- Retain history by default, don't overwrite
- Analysis history visible with timestamps

**Phase relevance:** Address in Phase 3 (AI Integration) and Phase 6 (Dashboard) — data model must support multiple analyses per company.

---

### Pitfall 13: Stripe Webhook Reliability

**What goes wrong:** Subscription status drifts from Stripe reality. User cancels but still has access. User upgrades but doesn't get features. Webhook delivery fails silently.

**Prevention:**
- Idempotent webhook handlers (same event twice = same result)
- Webhook signature verification (reject forgeries)
- Log all webhook events
- Reconciliation job: daily sync with Stripe API as backup
- Handle all relevant events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed

**Phase relevance:** Address in Phase 5 (Billing) — test webhooks with Stripe CLI before launch.

---

### Pitfall 14: Demo Mode Absence

**What goes wrong:** Portfolio viewers can't see the product without signing up and completing ICP wizard. Evaluators bounce. Demo at interviews is awkward ("let me log in and set up an ICP real quick...").

**Prevention:**
- Build demo mode with pre-seeded ICP and example analyses
- One-click demo access (no signup required)
- Demo data that showcases all features
- "View as Pro user" toggle for evaluators

**Phase relevance:** Address in Phase 7 (Polish) — critical for portfolio presentation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation (Schema) | No score breakdown fields | Design breakdown columns from start |
| Scraping | Single strategy, no fallback | Build fallback chain immediately |
| Scraping | Ignore robots.txt/rate limits | Ethical scraping from day one |
| AI Integration | Cost tracking absent | Token counting + cost logging required |
| AI Integration | Inline prompts, no versioning | Prompt management system |
| AI Integration | Hallucination as fact | Confidence indicators, source separation |
| ICP System | Complex wizard, high abandonment | AI-assisted natural language ICP |
| Billing | Usage drift from reality | Single increment point, reconciliation |
| Billing | Webhook unreliability | Idempotent handlers, daily sync |
| Dashboard | Performance at scale | Pagination + indexes from start |
| Dashboard | Export format unusable | Test with real CRM import |
| Polish | No demo mode | Pre-seeded demo data |

---

## Domain-Specific Risk Matrix

| Risk Area | Likelihood | Impact | Phase to Address |
|-----------|------------|--------|------------------|
| Scraping unreliability | HIGH | HIGH | Phase 2 |
| AI cost overrun | HIGH | HIGH | Phase 3 |
| ICP wizard abandonment | MEDIUM | HIGH | Phase 4 |
| Usage tracking bugs | MEDIUM | HIGH | Phase 5 |
| AI hallucination trust loss | MEDIUM | MEDIUM | Phase 3 |
| Dashboard performance | MEDIUM | MEDIUM | Phase 6 |
| Webhook state drift | LOW | HIGH | Phase 5 |
| Export format issues | LOW | LOW | Phase 6 |

---

## Sources

**Confidence note:** This document is based on training data patterns from AI/ML product development, SaaS billing systems, and web scraping production challenges. WebSearch was unavailable for real-time verification. Key findings align with common patterns observed across similar projects but should be validated against current best practices where uncertainty exists.

Primary knowledge sources from training:
- AI product failure patterns (lead scoring, sales AI, recommendation systems)
- Web scraping production challenges (rate limits, blocks, data quality)
- OpenAI API cost management (token optimization, caching, rate limiting)
- SaaS billing edge cases (Stripe webhook handling, usage metering)
- LLM hallucination mitigation strategies
