# Roadmap: LeadQual

**Created:** 2026-01-23
**Depth:** Standard (5-8 phases)
**Coverage:** 32/32 v1 requirements mapped

## Overview

LeadQual transforms sales qualification through ICP-personalized scoring. This roadmap delivers six phases: Foundation establishes auth and database; ICP & Onboarding enables personalized profiles; Data Extraction handles reliable company data retrieval; AI Analysis produces scores and recommendations; Dashboard provides lead management; Billing & Polish adds monetization and production readiness. Each phase builds on previous dependencies to deliver a complete product.

---

## Phase 1: Foundation

**Goal:** Users can securely access their accounts and the application has a functional UI shell.

**Dependencies:** None (starting point)

**Requirements:**
- AUTH-01: User can create account with email and password
- AUTH-02: User session persists across browser refresh
- AUTH-03: User can reset password via email link
- AUTH-04: User can sign in with Google OAuth

**Success Criteria:**
1. User can create account with email/password and is redirected to onboarding
2. User can sign in with Google OAuth and is redirected to onboarding
3. User session persists across browser refresh without re-login
4. User can request password reset and receive email with reset link
5. Unauthenticated users are redirected to login page when accessing protected routes

**Plans:** 5 plans

Plans:
- [x] 01-01-PLAN.md - Project scaffolding (Next.js + Supabase + shadcn)
- [x] 01-02-PLAN.md - Database schema (profiles table, RLS, triggers)
- [x] 01-03-PLAN.md - Auth server actions and route handlers
- [x] 01-04-PLAN.md - Auth UI pages (login, signup, password reset)
- [x] 01-05-PLAN.md - Protected routes and auth integration testing

---

## Phase 2: ICP & Onboarding

**Goal:** Users can define their ideal customer profile through natural conversation, enabling personalized analysis.

**Dependencies:** Phase 1 (Auth must exist for user-owned ICPs)

**Requirements:**
- ICP-01: User completes ICP setup wizard during onboarding
- ICP-02: ICP wizard captures company info (what they sell, industry, size)
- ICP-03: ICP wizard captures target criteria (ideal company size, industries, tech requirements)
- ICP-04: ICP wizard captures value propositions (key benefits/differentiators)
- ICP-05: ICP wizard captures common objections (typical pushbacks they face)
- ICP-06: User can describe ideal customer in natural language, AI parses into structured ICP
- ICP-07: User can edit ICP anytime in settings

**Success Criteria:**
1. New user is taken through ICP wizard after first login
2. User can describe ideal customer in plain English and see AI-extracted structured fields
3. User can review and edit extracted ICP fields before saving
4. User can access ICP settings and modify any field after initial setup
5. Existing ICP data persists and loads correctly when user returns

**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md - Database schema + Zod validations + AI SDK setup
- [x] 02-02-PLAN.md - ICP Wizard UI (steps 1-2: Company Info + Target Criteria)
- [x] 02-03-PLAN.md - ICP Wizard UI (steps 3-4: Value Props + Objections) + API
- [x] 02-04-PLAN.md - Onboarding integration + Settings page + verification

---

## Phase 3: Data Extraction

**Goal:** System reliably retrieves company data from any URL, gracefully handling failures.

**Dependencies:** Phase 2 (ICP must exist for analysis to be meaningful)

**Requirements:**
- DATA-01: User can input company URL for analysis
- DATA-02: System scrapes company website for data (industry, size, location, tech stack)
- DATA-03: System falls back to enrichment APIs when website scraping fails or returns incomplete data
- DATA-04: System offers manual input form when all automated extraction fails
- DATA-05: System always returns something actionable, never a blank failure

**Success Criteria:**
1. User can paste company URL and initiate data extraction
2. System extracts company info from website within 30 seconds
3. When website scraping fails, system falls back to enrichment API without user intervention
4. When all automated methods fail, user sees manual input form pre-filled with any partial data
5. User always receives some company data to proceed with analysis (never blank failure)

**Plans:** 4 plans

Plans:
- [ ] 03-01-PLAN.md - Company schemas + scraper + enrichment client
- [ ] 03-02-PLAN.md - Fallback chain orchestrator + API endpoint
- [ ] 03-03-PLAN.md - Extraction UI components (URL input, progress, manual form)
- [ ] 03-04-PLAN.md - Analyze page integration + verification

---

## Phase 4: AI Analysis

**Goal:** System generates personalized lead scores, pitch recommendations, and objection predictions based on user's ICP.

**Dependencies:** Phase 3 (Data extraction must provide company data for analysis)

**Requirements:**
- ANLZ-01: System generates lead score (1-100) for analyzed company
- ANLZ-02: Lead score includes breakdown showing component scores (industry fit, size fit, tech fit, need signals)
- ANLZ-03: System calculates ICP match percentage based on weighted criteria comparison
- ANLZ-04: System extracts and displays company insights (industry, size, location, tech stack, description)
- ANLZ-05: System generates personalized pitch angles based on user's value props + target company context
- ANLZ-06: System predicts potential objections based on company profile vs user's common objections
- ANLZ-07: System generates objection handling recommendations for predicted objections

**Success Criteria:**
1. User sees lead score (1-100) with breakdown showing component scores after analysis completes
2. User sees ICP match percentage with explanation of matching/mismatching criteria
3. User sees extracted company insights (industry, size, location, tech stack)
4. User sees 2-3 personalized pitch angles tailored to their value props and target company
5. User sees predicted objections with recommended handling strategies

---

## Phase 5: Dashboard

**Goal:** Users can view, filter, and manage all analyzed leads in one place.

**Dependencies:** Phase 4 (Analysis results must exist to display in dashboard)

**Requirements:**
- DASH-01: User can view list of all analyzed leads sorted by score
- DASH-02: User can click lead to view full analysis detail (score, breakdown, insights, pitches, objections)
- DASH-03: User can filter leads by score range (hot/warm/cold)
- DASH-04: User can filter leads by ICP match percentage
- DASH-05: User can filter leads by industry
- DASH-06: User can filter leads by analysis date
- DASH-07: User can export lead data as CSV
- DASH-08: User can copy lead analysis to clipboard in CRM-friendly format
- DASH-09: User can archive leads to remove from active list
- DASH-10: User can re-analyze a lead to refresh data

**Success Criteria:**
1. User sees all analyzed leads in a list sorted by score (highest first)
2. User can click any lead to view full analysis including score breakdown, pitch angles, and objections
3. User can filter leads by score range, ICP match %, industry, and date - filters combine correctly
4. User can export filtered leads as CSV and copy individual lead analysis to clipboard
5. User can archive leads (removing from active view) and re-analyze stale leads

---

## Phase 6: Billing & Polish

**Goal:** Users can subscribe, usage is tracked, and the application is production-ready with demo mode.

**Dependencies:** Phase 5 (Dashboard must work to gate features and show usage)

**Requirements:**
- BILL-01: Free tier allows 10 lead analyses per month
- BILL-02: Pro tier ($29-49/month) allows 100 lead analyses per month
- BILL-03: System tracks analysis count per user per billing period
- BILL-04: User can view their usage (analyses used / limit)
- BILL-05: System shows warning when user reaches 80% of limit
- BILL-06: System blocks analysis with upgrade prompt when user reaches 100% of limit
- BILL-07: User can upgrade from free to pro tier via Stripe checkout
- BILL-08: User can manage subscription (cancel, view invoices) via Stripe portal
- BILL-09: Usage count resets on billing cycle (via Stripe webhook)

**Success Criteria:**
1. Free users can perform up to 10 analyses per month; blocked at limit with upgrade prompt
2. User sees current usage (X/Y analyses used) in header or settings
3. User sees warning banner when approaching 80% of limit
4. User can upgrade to Pro via Stripe checkout and immediately access increased limits
5. User can manage subscription (cancel, view invoices) through Stripe customer portal

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1. Foundation | Complete | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 100% |
| 2. ICP & Onboarding | Complete | ICP-01 through ICP-07 | 100% |
| 3. Data Extraction | Planned | DATA-01 through DATA-05 | 0% |
| 4. AI Analysis | Pending | ANLZ-01 through ANLZ-07 | 0% |
| 5. Dashboard | Pending | DASH-01 through DASH-10 | 0% |
| 6. Billing & Polish | Pending | BILL-01 through BILL-09 | 0% |

**Overall:** 11/32 requirements complete (34.4%)

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| ICP-01 | Phase 2 | Complete |
| ICP-02 | Phase 2 | Complete |
| ICP-03 | Phase 2 | Complete |
| ICP-04 | Phase 2 | Complete |
| ICP-05 | Phase 2 | Complete |
| ICP-06 | Phase 2 | Complete |
| ICP-07 | Phase 2 | Complete |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| DATA-05 | Phase 3 | Pending |
| ANLZ-01 | Phase 4 | Pending |
| ANLZ-02 | Phase 4 | Pending |
| ANLZ-03 | Phase 4 | Pending |
| ANLZ-04 | Phase 4 | Pending |
| ANLZ-05 | Phase 4 | Pending |
| ANLZ-06 | Phase 4 | Pending |
| ANLZ-07 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| DASH-06 | Phase 5 | Pending |
| DASH-07 | Phase 5 | Pending |
| DASH-08 | Phase 5 | Pending |
| DASH-09 | Phase 5 | Pending |
| DASH-10 | Phase 5 | Pending |
| BILL-01 | Phase 6 | Pending |
| BILL-02 | Phase 6 | Pending |
| BILL-03 | Phase 6 | Pending |
| BILL-04 | Phase 6 | Pending |
| BILL-05 | Phase 6 | Pending |
| BILL-06 | Phase 6 | Pending |
| BILL-07 | Phase 6 | Pending |
| BILL-08 | Phase 6 | Pending |
| BILL-09 | Phase 6 | Pending |

**Coverage:** 32/32 requirements mapped (100%)

---

*Roadmap created: 2026-01-23*
*Last updated: 2026-01-26*
