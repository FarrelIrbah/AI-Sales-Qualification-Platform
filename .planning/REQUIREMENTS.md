# Requirements: LeadQual

**Defined:** 2026-01-22
**Core Value:** Two different users analyzing the same company get completely different, actionable recommendations based on their unique ICP.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User can sign in with Google OAuth

### ICP System

- [x] **ICP-01**: User completes ICP setup wizard during onboarding
- [x] **ICP-02**: ICP wizard captures company info (what they sell, industry, size)
- [x] **ICP-03**: ICP wizard captures target criteria (ideal company size, industries, tech requirements)
- [x] **ICP-04**: ICP wizard captures value propositions (key benefits/differentiators)
- [x] **ICP-05**: ICP wizard captures common objections (typical pushbacks they face)
- [x] **ICP-06**: User can describe ideal customer in natural language, AI parses into structured ICP
- [x] **ICP-07**: User can edit ICP anytime in settings

### Data Extraction

- [ ] **DATA-01**: User can input company URL for analysis
- [ ] **DATA-02**: System scrapes company website for data (industry, size, location, tech stack)
- [ ] **DATA-03**: System falls back to enrichment APIs when website scraping fails or returns incomplete data
- [ ] **DATA-04**: System offers manual input form when all automated extraction fails
- [ ] **DATA-05**: System always returns something actionable, never a blank failure

### AI Analysis

- [ ] **ANLZ-01**: System generates lead score (1-100) for analyzed company
- [ ] **ANLZ-02**: Lead score includes breakdown showing component scores (industry fit, size fit, tech fit, need signals)
- [ ] **ANLZ-03**: System calculates ICP match percentage based on weighted criteria comparison
- [ ] **ANLZ-04**: System extracts and displays company insights (industry, size, location, tech stack, description)
- [ ] **ANLZ-05**: System generates personalized pitch angles based on user's value props + target company context
- [ ] **ANLZ-06**: System predicts potential objections based on company profile vs user's common objections
- [ ] **ANLZ-07**: System generates objection handling recommendations for predicted objections

### Dashboard

- [ ] **DASH-01**: User can view list of all analyzed leads sorted by score
- [ ] **DASH-02**: User can click lead to view full analysis detail (score, breakdown, insights, pitches, objections)
- [ ] **DASH-03**: User can filter leads by score range (hot/warm/cold)
- [ ] **DASH-04**: User can filter leads by ICP match percentage
- [ ] **DASH-05**: User can filter leads by industry
- [ ] **DASH-06**: User can filter leads by analysis date
- [ ] **DASH-07**: User can export lead data as CSV
- [ ] **DASH-08**: User can copy lead analysis to clipboard in CRM-friendly format
- [ ] **DASH-09**: User can archive leads to remove from active list
- [ ] **DASH-10**: User can re-analyze a lead to refresh data

### Billing

- [ ] **BILL-01**: Free tier allows 10 lead analyses per month
- [ ] **BILL-02**: Pro tier ($29-49/month) allows 100 lead analyses per month
- [ ] **BILL-03**: System tracks analysis count per user per billing period
- [ ] **BILL-04**: User can view their usage (analyses used / limit)
- [ ] **BILL-05**: System shows warning when user reaches 80% of limit
- [ ] **BILL-06**: System blocks analysis with upgrade prompt when user reaches 100% of limit
- [ ] **BILL-07**: User can upgrade from free to pro tier via Stripe checkout
- [ ] **BILL-08**: User can manage subscription (cancel, view invoices) via Stripe portal
- [ ] **BILL-09**: Usage count resets on billing cycle (via Stripe webhook)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-V2-01**: User receives email verification after signup
- **AUTH-V2-02**: User can sign in with magic link (passwordless)

### ICP System

- **ICP-V2-01**: User can create multiple ICP profiles for different products/segments
- **ICP-V2-02**: User can customize scoring weights for ICP criteria
- **ICP-V2-03**: User can switch active ICP when analyzing leads

### Data Extraction

- **DATA-V2-01**: System shows confidence indicators on data (freshness, reliability)
- **DATA-V2-02**: System detects funding/growth signals (recent funding, hiring trends)

### Dashboard

- **DASH-V2-01**: Dashboard shows quick stats (leads analyzed this week, average score, top industries)
- **DASH-V2-02**: User can bulk select leads for export or archive
- **DASH-V2-03**: User can search leads by company name

### Team Features

- **TEAM-V2-01**: Team workspace with shared lead pool
- **TEAM-V2-02**: Team member roles and permissions
- **TEAM-V2-03**: Shared analysis count across team
- **TEAM-V2-04**: Team analytics dashboard

### Integrations

- **INTG-V2-01**: Direct Salesforce integration (push leads)
- **INTG-V2-02**: Direct HubSpot integration (push leads)
- **INTG-V2-03**: LinkedIn Sales Navigator integration (with user's license)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time LinkedIn scraping | High risk of blocks, ToS violations, unreliable |
| Automated outreach sending | Not core competency, deliverability nightmare |
| Contact database/list purchase | Commoditized, not differentiated value |
| CRM replacement features | Compete with Salesforce/HubSpot is losing battle |
| Real-time alerts/notifications | Infrastructure complexity, unclear value for MVP |
| Custom AI model training | Expensive, GPT-4o with good prompting is sufficient |
| Mobile native app | Web-first, mobile-responsive is enough for v1 |
| Social media analysis | Data access restrictions, questionable signal value |
| Intent data integration | Expensive third-party data, defer until validated |
| Industry-specific scoring models | Requires user validation, default weights work for most |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 - Foundation | Complete |
| AUTH-02 | Phase 1 - Foundation | Complete |
| AUTH-03 | Phase 1 - Foundation | Complete |
| AUTH-04 | Phase 1 - Foundation | Complete |
| ICP-01 | Phase 2 - ICP & Onboarding | Complete |
| ICP-02 | Phase 2 - ICP & Onboarding | Complete |
| ICP-03 | Phase 2 - ICP & Onboarding | Complete |
| ICP-04 | Phase 2 - ICP & Onboarding | Complete |
| ICP-05 | Phase 2 - ICP & Onboarding | Complete |
| ICP-06 | Phase 2 - ICP & Onboarding | Complete |
| ICP-07 | Phase 2 - ICP & Onboarding | Complete |
| DATA-01 | Phase 3 - Data Extraction | Pending |
| DATA-02 | Phase 3 - Data Extraction | Pending |
| DATA-03 | Phase 3 - Data Extraction | Pending |
| DATA-04 | Phase 3 - Data Extraction | Pending |
| DATA-05 | Phase 3 - Data Extraction | Pending |
| ANLZ-01 | Phase 4 - AI Analysis | Pending |
| ANLZ-02 | Phase 4 - AI Analysis | Pending |
| ANLZ-03 | Phase 4 - AI Analysis | Pending |
| ANLZ-04 | Phase 4 - AI Analysis | Pending |
| ANLZ-05 | Phase 4 - AI Analysis | Pending |
| ANLZ-06 | Phase 4 - AI Analysis | Pending |
| ANLZ-07 | Phase 4 - AI Analysis | Pending |
| DASH-01 | Phase 5 - Dashboard | Pending |
| DASH-02 | Phase 5 - Dashboard | Pending |
| DASH-03 | Phase 5 - Dashboard | Pending |
| DASH-04 | Phase 5 - Dashboard | Pending |
| DASH-05 | Phase 5 - Dashboard | Pending |
| DASH-06 | Phase 5 - Dashboard | Pending |
| DASH-07 | Phase 5 - Dashboard | Pending |
| DASH-08 | Phase 5 - Dashboard | Pending |
| DASH-09 | Phase 5 - Dashboard | Pending |
| DASH-10 | Phase 5 - Dashboard | Pending |
| BILL-01 | Phase 6 - Billing & Polish | Pending |
| BILL-02 | Phase 6 - Billing & Polish | Pending |
| BILL-03 | Phase 6 - Billing & Polish | Pending |
| BILL-04 | Phase 6 - Billing & Polish | Pending |
| BILL-05 | Phase 6 - Billing & Polish | Pending |
| BILL-06 | Phase 6 - Billing & Polish | Pending |
| BILL-07 | Phase 6 - Billing & Polish | Pending |
| BILL-08 | Phase 6 - Billing & Polish | Pending |
| BILL-09 | Phase 6 - Billing & Polish | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-26 after Phase 2 completion*
