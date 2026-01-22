# Architecture Patterns

**Domain:** AI Sales Qualification SaaS Platform
**Researched:** 2026-01-22
**Confidence:** MEDIUM (based on established patterns; WebSearch unavailable for latest trends)

## Recommended Architecture

### Overview

A **modular monolith** architecture using Next.js 15 App Router is recommended for this project. This approach provides:

- Simpler deployment (single Vercel deployment)
- Shared types between frontend and backend
- Fast iteration for portfolio/MVP stage
- Clear upgrade path to microservices if needed

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|   Browser/UI     |---->|   Next.js App     |---->|   External APIs  |
|   (React)        |     |   (API Routes)    |     |   (OpenAI, etc)  |
|                  |     |                   |     |                  |
+------------------+     +--------+----------+     +------------------+
                                  |
                                  v
                         +--------+----------+
                         |                   |
                         |     Supabase      |
                         |  (PostgreSQL +    |
                         |   Auth + Storage) |
                         |                   |
                         +-------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Boundary Type |
|-----------|---------------|-------------------|---------------|
| **UI Layer** | User interactions, forms, dashboards | API Routes only | Page/Component boundary |
| **API Routes** | Request handling, auth validation, orchestration | Services, Supabase, External APIs | Route handlers |
| **Auth Service** | User authentication, session management | Supabase Auth, API Routes | Module boundary |
| **ICP Service** | ICP CRUD, validation, matching logic | Database, Analysis Service | Module boundary |
| **Scraping Service** | Web scraping, data extraction | External websites, Enrichment APIs | Module boundary |
| **Analysis Service** | AI orchestration, prompt building, result parsing | OpenAI API, Scraping Service | Module boundary |
| **Scoring Service** | Lead scoring algorithm, ICP matching calculation | Analysis results, ICP data | Module boundary |
| **Billing Service** | Stripe integration, usage tracking, limit enforcement | Stripe API, Database | Module boundary |
| **Database Layer** | Data persistence, queries | Supabase PostgreSQL | ORM/Query boundary |

## Detailed Component Design

### 1. UI Layer (Next.js App Router)

**Structure:**
```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── onboarding/
│       └── page.tsx          # ICP Wizard
├── (dashboard)/
│   ├── layout.tsx            # Protected layout with sidebar
│   ├── page.tsx              # Main dashboard
│   ├── leads/
│   │   └── [id]/page.tsx     # Lead detail view
│   ├── analyze/page.tsx      # New analysis form
│   └── settings/
│       ├── icp/page.tsx      # ICP management
│       ├── billing/page.tsx  # Subscription management
│       └── profile/page.tsx
├── api/                       # API Routes
└── components/
    ├── ui/                    # shadcn/ui components
    ├── forms/                 # Form components
    ├── dashboard/             # Dashboard-specific
    └── analysis/              # Analysis display
```

**Key Patterns:**
- Server Components for data fetching where possible
- Client Components for interactive elements (forms, filters)
- Suspense boundaries for loading states
- Error boundaries for graceful failures

### 2. API Routes Layer

**Structure:**
```
app/api/
├── auth/
│   └── callback/route.ts     # Supabase auth callback
├── icp/
│   ├── route.ts              # GET list, POST create
│   └── [id]/route.ts         # GET, PUT, DELETE single
├── analyze/
│   ├── route.ts              # POST: trigger analysis
│   └── [id]/
│       ├── route.ts          # GET analysis status/result
│       └── retry/route.ts    # POST: re-analyze
├── leads/
│   ├── route.ts              # GET list with filters
│   ├── [id]/route.ts         # GET, DELETE single
│   ├── export/route.ts       # POST: bulk export
│   └── archive/route.ts      # POST: bulk archive
├── billing/
│   ├── usage/route.ts        # GET current usage
│   ├── checkout/route.ts     # POST: create checkout
│   └── portal/route.ts       # POST: billing portal
└── webhooks/
    └── stripe/route.ts       # Stripe webhooks
```

**Key Patterns:**
- All routes validate auth via Supabase session
- Usage limits checked before expensive operations
- Consistent error response format
- Request validation with Zod schemas

### 3. Services Layer

Each service is a module with clear input/output contracts.

#### Auth Service
```typescript
// lib/services/auth.ts
export const authService = {
  getCurrentUser(): Promise<User | null>
  requireAuth(): Promise<User>  // throws if not authenticated
  getUserTier(): Promise<'free' | 'pro'>
}
```

#### ICP Service
```typescript
// lib/services/icp.ts
export const icpService = {
  create(userId: string, data: ICPInput): Promise<ICP>
  update(id: string, data: Partial<ICPInput>): Promise<ICP>
  delete(id: string): Promise<void>
  getAll(userId: string): Promise<ICP[]>
  getDefault(userId: string): Promise<ICP | null>
}
```

#### Scraping Service
```typescript
// lib/services/scraping.ts
export const scrapingService = {
  scrapeCompany(url: string): Promise<ScrapedData>
  // Internally handles:
  // 1. Website scraping (Playwright)
  // 2. Enrichment API fallback (Clearbit/Apollo)
  // 3. Partial result assembly
  // 4. Confidence scoring
}
```

#### Analysis Service
```typescript
// lib/services/analysis.ts
export const analysisService = {
  analyze(
    scrapedData: ScrapedData,
    icp: ICP,
    tier: 'free' | 'pro'
  ): Promise<AnalysisResult>
  // Builds prompt, calls OpenAI, parses response
  // Filters output based on tier
}
```

#### Scoring Service
```typescript
// lib/services/scoring.ts
export const scoringService = {
  calculateScore(analysis: AnalysisResult, icp: ICP): LeadScore
  // Weighted scoring algorithm
  // Returns score 1-100 with breakdown
}
```

#### Billing Service
```typescript
// lib/services/billing.ts
export const billingService = {
  getUsage(userId: string): Promise<Usage>
  checkLimit(userId: string): Promise<LimitStatus>
  incrementUsage(userId: string): Promise<void>
  createCheckout(userId: string): Promise<string>  // returns URL
  handleWebhook(event: Stripe.Event): Promise<void>
}
```

### 4. Database Schema

**Core Tables:**

```sql
-- Users (managed by Supabase Auth, extended)
create table user_profiles (
  id uuid primary key references auth.users(id),
  company_name text,
  tier text default 'free' check (tier in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Ideal Customer Profiles
create table icps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  name text not null,
  is_default boolean default false,
  -- Target criteria
  target_industries text[],
  target_company_sizes text[],  -- 'startup', 'smb', 'mid-market', 'enterprise'
  target_regions text[],
  -- Value props
  value_propositions jsonb,  -- [{title, description}]
  -- Common objections
  common_objections jsonb,   -- [{objection, counter}]
  -- Additional context
  additional_context text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Analyzed Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  icp_id uuid references icps(id) on delete set null,
  -- Company info
  company_url text not null,
  company_name text,
  company_domain text,
  -- Scraped data
  scraped_data jsonb,
  scrape_confidence integer,  -- 0-100
  -- Analysis results
  analysis_result jsonb,
  -- Scores
  lead_score integer,         -- 1-100
  icp_match_percentage integer,  -- 0-100
  -- Extracted insights
  company_size text,
  industry text,
  tech_stack text[],
  funding_info text,
  -- Status
  status text default 'active' check (status in ('active', 'archived')),
  analyzed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Usage Tracking
create table usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  analyses_count integer default 0,
  constraint unique_user_period unique (user_id, period_start)
);

-- Indexes
create index idx_leads_user_id on leads(user_id);
create index idx_leads_status on leads(status);
create index idx_leads_score on leads(lead_score desc);
create index idx_icps_user_id on icps(user_id);
create index idx_usage_user_period on usage_records(user_id, period_start);
```

**Row Level Security (RLS):**

```sql
-- Users can only access their own data
alter table user_profiles enable row level security;
create policy "Users can view own profile"
  on user_profiles for select using (auth.uid() = id);

alter table icps enable row level security;
create policy "Users can manage own ICPs"
  on icps for all using (auth.uid() = user_id);

alter table leads enable row level security;
create policy "Users can manage own leads"
  on leads for all using (auth.uid() = user_id);
```

## Data Flow

### Analysis Flow (Primary Flow)

```
1. User submits URL
   │
   ├─► API validates auth + checks usage limit
   │   └─► If at limit → Return upgrade CTA
   │
   ├─► Scraping Service: Extract company data
   │   ├─► Try: Website scraping (Playwright)
   │   │   └─► Partial success → Continue with available data
   │   ├─► Fallback: Enrichment APIs (Clearbit/Apollo)
   │   │   └─► Merge additional data
   │   └─► Always: Calculate confidence score
   │
   ├─► Analysis Service: AI Processing
   │   ├─► Build prompt with ICP context
   │   ├─► Call OpenAI GPT-4o
   │   ├─► Parse structured response
   │   └─► Filter based on tier (free = basic only)
   │
   ├─► Scoring Service: Calculate scores
   │   ├─► Lead score (1-100)
   │   └─► ICP match percentage
   │
   ├─► Database: Store result
   │   └─► leads table + increment usage
   │
   └─► Return: Complete analysis to UI
```

### Authentication Flow

```
1. User clicks Sign Up / Login
   │
   ├─► Supabase Auth handles OAuth/Email
   │
   ├─► On first login:
   │   └─► Create user_profile record
   │
   └─► Redirect:
       ├─► No ICP exists → Onboarding wizard
       └─► ICP exists → Dashboard
```

### Billing Flow

```
1. User clicks "Upgrade to Pro"
   │
   ├─► billingService.createCheckout()
   │   └─► Creates Stripe Checkout Session
   │
   ├─► User completes payment on Stripe
   │
   ├─► Stripe sends webhook
   │   └─► /api/webhooks/stripe
   │
   └─► billingService.handleWebhook()
       ├─► Update user_profiles.tier = 'pro'
       └─► Store subscription_id
```

## Patterns to Follow

### Pattern 1: Graceful Degradation in Scraping

**What:** Never fail completely when scraping. Always return something actionable.

**When:** Any scraping operation.

**Example:**
```typescript
async function scrapeCompany(url: string): Promise<ScrapedData> {
  const result: ScrapedData = {
    source: 'none',
    confidence: 0,
    data: {}
  };

  // Try website scraping
  try {
    const websiteData = await scrapeWebsite(url);
    result.data = { ...result.data, ...websiteData };
    result.source = 'website';
    result.confidence = calculateConfidence(websiteData);
  } catch (error) {
    logError('Website scrape failed', { url, error });
    // Continue to fallback, don't throw
  }

  // Enrich with APIs if needed
  if (result.confidence < 70) {
    try {
      const enrichedData = await enrichWithAPIs(url);
      result.data = { ...result.data, ...enrichedData };
      result.source = result.confidence > 0 ? 'hybrid' : 'enrichment';
      result.confidence = Math.min(100, result.confidence + 30);
    } catch (error) {
      logError('Enrichment failed', { url, error });
    }
  }

  // Always return something
  if (result.confidence === 0) {
    result.source = 'manual_required';
    result.data = { url, domain: extractDomain(url) };
    result.confidence = 10;
  }

  return result;
}
```

### Pattern 2: Tier-Based Response Filtering

**What:** Same AI call for all tiers, filter response based on user tier.

**When:** Analysis endpoint returns data.

**Example:**
```typescript
function filterAnalysisForTier(
  analysis: FullAnalysis,
  tier: 'free' | 'pro'
): FilteredAnalysis {
  const base = {
    companyOverview: analysis.companyOverview,
    leadScore: analysis.leadScore,
    icpMatchPercentage: analysis.icpMatchPercentage,
    keyInsights: analysis.keyInsights.slice(0, 3), // Limited for free
  };

  if (tier === 'free') {
    return {
      ...base,
      pitchAngles: null,        // Pro only
      objectionHandling: null,   // Pro only
      detailedBreakdown: null,   // Pro only
      upgradePrompt: 'Upgrade to Pro for pitch angles and objection handling'
    };
  }

  return {
    ...base,
    pitchAngles: analysis.pitchAngles,
    objectionHandling: analysis.objectionHandling,
    detailedBreakdown: analysis.detailedBreakdown,
    upgradePrompt: null
  };
}
```

### Pattern 3: Usage Limit Enforcement

**What:** Check and enforce usage limits before expensive operations.

**When:** Before any analysis (API cost incurred).

**Example:**
```typescript
async function checkAndIncrementUsage(userId: string): Promise<LimitStatus> {
  const user = await getUserWithProfile(userId);
  const limit = user.tier === 'pro' ? 100 : 10;

  const usage = await getOrCreateUsageRecord(userId);

  if (usage.analyses_count >= limit) {
    return {
      allowed: false,
      current: usage.analyses_count,
      limit,
      message: 'Monthly limit reached',
      upgradeUrl: user.tier === 'free' ? '/settings/billing' : null
    };
  }

  // Warning at 80%
  const warningThreshold = Math.floor(limit * 0.8);

  await incrementUsage(userId);

  return {
    allowed: true,
    current: usage.analyses_count + 1,
    limit,
    warning: usage.analyses_count >= warningThreshold,
    message: usage.analyses_count >= warningThreshold
      ? `You've used ${usage.analyses_count + 1} of ${limit} analyses this month`
      : null
  };
}
```

### Pattern 4: Structured AI Output

**What:** Use structured output format with OpenAI to ensure parseable responses.

**When:** All OpenAI API calls.

**Example:**
```typescript
const analysisSchema = z.object({
  companyOverview: z.string(),
  industry: z.string(),
  companySize: z.enum(['startup', 'smb', 'mid-market', 'enterprise']),
  techStack: z.array(z.string()),
  leadScore: z.number().min(1).max(100),
  scoreBreakdown: z.object({
    industryFit: z.number().min(0).max(25),
    sizeFit: z.number().min(0).max(25),
    techFit: z.number().min(0).max(25),
    needSignals: z.number().min(0).max(25),
  }),
  keyInsights: z.array(z.string()),
  pitchAngles: z.array(z.object({
    angle: z.string(),
    rationale: z.string(),
  })),
  objections: z.array(z.object({
    objection: z.string(),
    response: z.string(),
  })),
});

async function analyzeWithAI(data: ScrapedData, icp: ICP): Promise<Analysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(icp) },
      { role: 'user', content: buildUserPrompt(data) }
    ],
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return analysisSchema.parse(parsed);
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Database Access from Components

**What:** Calling Supabase directly from React components.

**Why bad:**
- Bypasses auth validation
- No usage limit checks
- Inconsistent error handling
- Hard to test and maintain

**Instead:** Always go through API routes which enforce auth and business logic.

### Anti-Pattern 2: Synchronous Scraping in Request

**What:** Making the user wait for full scraping + analysis in a single request.

**Why bad:**
- Requests timeout (Vercel has 10s limit on Hobby, 60s on Pro)
- Poor UX for slow scrapes
- No retry capability

**Instead:** For complex scraping scenarios, consider:
- Quick initial response with partial data
- Background job for enrichment (if using Pro Vercel plan)
- Or: Aggressive timeouts with partial results

**Note:** For this project (portfolio MVP), synchronous is acceptable if:
- Implement aggressive timeouts (8s max)
- Return partial results on timeout
- Scraping targets are typically fast (<5s)

### Anti-Pattern 3: Storing Raw AI Responses

**What:** Storing the entire AI response blob without parsing.

**Why bad:**
- Can't query or filter by fields
- Schema changes break old data
- Wastes storage on unused fields

**Instead:** Parse and normalize into database columns. Store raw response in separate `raw_response` column only for debugging/auditing.

### Anti-Pattern 4: Hardcoded Tier Logic Everywhere

**What:** Checking `tier === 'pro'` scattered throughout codebase.

**Why bad:**
- Hard to change pricing/features
- Inconsistent enforcement
- Missed checks cause bugs

**Instead:** Centralize in billingService:
```typescript
const featureAccess = {
  pitchAngles: (tier: Tier) => tier === 'pro',
  multipleICPs: (tier: Tier) => tier === 'pro',
  unlimitedHistory: (tier: Tier) => tier === 'pro',
  csvExport: (tier: Tier) => tier === 'pro',
};

export function canAccess(feature: keyof typeof featureAccess, tier: Tier) {
  return featureAccess[feature](tier);
}
```

## Build Order (Dependency Graph)

Based on component dependencies, recommended build sequence:

```
Phase 1: Foundation
├── Database schema + Supabase setup
├── Auth flow (login, signup, session)
└── Basic UI shell (layout, navigation)
    │
    │ These have no dependencies, can be parallel
    │
    v
Phase 2: Core Domain
├── ICP Service + onboarding wizard
│   └── Depends on: Auth, Database
├── User profile management
│   └── Depends on: Auth, Database
    │
    v
Phase 3: Analysis Pipeline
├── Scraping Service (website + fallbacks)
│   └── Depends on: nothing (standalone)
├── Analysis Service (OpenAI integration)
│   └── Depends on: Scraping Service
├── Scoring Service
│   └── Depends on: Analysis Service, ICP Service
├── Analysis API endpoint
│   └── Depends on: All above services
    │
    v
Phase 4: Dashboard
├── Lead list view
│   └── Depends on: Database (leads table)
├── Lead detail view
│   └── Depends on: Analysis results structure
├── Filtering + sorting
│   └── Depends on: Lead list
├── Quick stats
│   └── Depends on: Lead list
    │
    v
Phase 5: Monetization
├── Billing Service (Stripe integration)
│   └── Depends on: User profiles
├── Usage tracking
│   └── Depends on: Billing, Analysis API
├── Feature gating
│   └── Depends on: Billing Service
└── Upgrade flows
    └── Depends on: Billing Service, UI
```

### Critical Path

The longest dependency chain:

```
Auth → ICP → Scraping → Analysis → Scoring → Lead Display → Billing
```

**Implication:** Start auth and scraping exploration early (they're on the critical path).

### Parallelization Opportunities

Can be built in parallel:
- UI components (while services are built)
- Scraping service (no dependencies)
- Database schema design (no dependencies)

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **API Rate Limits** | No issue | May hit OpenAI limits | Need queue + rate limiting |
| **Scraping** | Direct scraping OK | Need proxy rotation | Dedicated scraping infra |
| **Database** | Supabase free tier | Supabase Pro | Need caching layer, read replicas |
| **Response Time** | Synchronous OK | Add caching | Background jobs + webhooks |
| **Cost** | ~$50/mo | ~$500/mo | Need cost optimization |

**For this MVP (100-1000 users):**
- Current architecture is sufficient
- Focus on getting it working correctly first
- Add caching if response times become an issue
- Monitor OpenAI costs closely

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Modular monolith | Fast iteration, simple deployment, clear upgrade path |
| Rendering | Server Components default | Better performance, less client JS |
| State | Server state via React Query | Caching, revalidation, loading states |
| Scraping | Playwright | Handles dynamic sites, good reliability |
| AI | OpenAI GPT-4o | Best quality for analysis, structured output support |
| Database | Supabase PostgreSQL | Integrated auth, RLS, good DX |
| Payments | Stripe | Industry standard, good docs |

## Sources

**Confidence Note:** This architecture is based on established patterns for Next.js SaaS applications and AI-powered analysis systems. WebSearch was unavailable for verification of latest 2026 patterns. Key architectural decisions align with:

- Next.js App Router documentation patterns
- Supabase recommended security patterns (RLS)
- OpenAI structured output best practices
- Standard SaaS billing patterns

**Areas to verify during implementation:**
- Next.js 15 specific API route patterns (may have changed)
- OpenAI structured output exact API (verify against latest docs)
- Stripe webhook handling (verify current best practices)
