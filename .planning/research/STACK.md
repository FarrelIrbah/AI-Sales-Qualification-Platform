# Technology Stack

**Project:** AI Sales Qualification Platform
**Researched:** 2026-01-22
**Overall Confidence:** MEDIUM (limited external verification available)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.x (latest) | Full-stack React framework | Verified current via official docs. App Router provides Server Components for AI processing, Route Handlers for API, built-in caching for scraping results. User's preferred choice is solid. | HIGH |
| React | 19.x | UI library | Bundled with Next.js 16. Server Components reduce client bundle, Suspense for loading states during AI analysis. | HIGH |
| TypeScript | 5.x | Type safety | Essential for complex AI response schemas, lead scoring logic, and API contracts. Non-negotiable for production SaaS. | HIGH |

### Styling & UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | Verified v4.1 current via official docs. New architecture is faster, CSS-first configuration. Perfect for rapid dashboard development. | HIGH |
| shadcn/ui | latest | Component library | Not a package but copy-paste components. Radix primitives under the hood. Ideal for dashboards, forms, data tables. Highly customizable for lead scoring UI. | MEDIUM |
| Radix UI | latest | Accessible primitives | shadcn/ui dependency. Handles accessibility for modals, dropdowns, tooltips in ICP wizard and filters. | MEDIUM |
| Lucide React | latest | Icons | shadcn/ui default. Consistent icon set for dashboard UI. | MEDIUM |

### Database & ORM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase | latest | PostgreSQL + Auth + Realtime | User preference. Managed PostgreSQL with Row Level Security for multi-tenant lead data. Built-in auth simplifies implementation. Realtime for live scraping status. | MEDIUM |
| Drizzle ORM | latest | Type-safe database queries | Lightweight, SQL-like syntax, excellent TypeScript inference. Better edge runtime support than Prisma. Generates migrations, works well with Supabase. | MEDIUM |
| Zod | 3.x | Schema validation | Validate AI responses, form inputs, API payloads. Runtime type safety for lead scoring schemas. | MEDIUM |

**Why Drizzle over Prisma:**
- Drizzle has smaller bundle size (important for serverless/edge)
- SQL-like syntax more intuitive for complex queries (filtering leads, aggregations)
- Better support for Supabase's PostgreSQL features
- No binary engine (simpler deployment)

**Why NOT raw Supabase client only:**
- Drizzle provides type-safe query building
- Better migration tooling
- Easier to unit test queries

### AI & LLM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| OpenAI API | latest | LLM for analysis | User preference (GPT-4o). Strong structured output via function calling. Good for company analysis, ICP matching, pitch generation. | MEDIUM |
| Vercel AI SDK | 4.x | LLM integration | Streaming responses for AI analysis progress. Provider-agnostic (can switch models). Built-in tools, structured output helpers. | MEDIUM |
| tiktoken | latest | Token counting | Estimate costs before API calls. Essential for usage-based billing accuracy. | LOW |

**Why Vercel AI SDK:**
- Streaming UI for long AI analysis (5-15s responses)
- Built-in retry logic with exponential backoff
- Structured output with Zod schema validation
- Provider switching if OpenAI has issues

**Alternative: Anthropic Claude**
- Claude 3.5 Sonnet competitive for structured analysis
- May be better for nuanced company context understanding
- Vercel AI SDK supports both, making switching trivial

### Web Scraping

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Playwright | latest | Browser automation | More reliable than Puppeteer for modern SPAs. Better auto-waiting. Handles JavaScript-heavy company websites. | MEDIUM |
| Cheerio | latest | HTML parsing | Fast parsing for simple static pages. Use before spawning browser. | MEDIUM |

**Scraping Strategy (Graceful Degradation):**
1. **Cheerio first** - Fast, cheap for static sites
2. **Playwright fallback** - For JS-rendered content
3. **Enrichment APIs** - When scraping fails (see below)
4. **Manual input** - Last resort with guided form

**Why Playwright over Puppeteer:**
- Better auto-waiting (fewer flaky scrapes)
- Multi-browser support (can use Firefox if Chrome blocked)
- More active development
- Built-in request interception for blocking ads/trackers

### Data Enrichment (Fallback APIs)

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Clearbit | Company data enrichment | Industry-standard, good coverage. Fallback when scraping fails. | LOW |
| Apollo.io API | Company/contact data | Alternative to Clearbit. Good for sales context. | LOW |
| Hunter.io | Email patterns | Useful for identifying company structure. | LOW |

**Note:** These are paid services. Implement as optional fallbacks with user-provided API keys or metered usage.

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Auth | built-in | User authentication | Included with Supabase. OAuth (Google, Microsoft), magic links, password. Row Level Security integration. | MEDIUM |
| @supabase/ssr | latest | Server-side auth | Cookie-based sessions for Next.js App Router. Required for server components. | MEDIUM |

**Why NOT NextAuth.js/Auth.js:**
- Supabase Auth already included
- Tighter RLS integration
- One less dependency
- Built-in user management UI

### Payments

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Stripe | latest | Subscriptions + usage billing | Industry standard. Native usage-based billing support. Webhooks for subscription events. | MEDIUM |
| stripe (npm) | latest | Server-side SDK | Webhook verification, customer/subscription management. | MEDIUM |
| @stripe/stripe-js | latest | Client-side | Checkout/pricing table embeds. | MEDIUM |

**Usage-Based Billing Approach:**
- Stripe Metered Billing for AI analysis credits
- Report usage via Stripe Usage Records API
- Tiered pricing: Base subscription + per-lead overage

### State Management & Data Fetching

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Query | 5.x | Server state management | Caching, background refetching, optimistic updates for lead list. Better than raw fetch. | MEDIUM |
| Zustand | 4.x | Client state | Lightweight store for ICP wizard state, filter preferences. Simpler than Redux. | MEDIUM |
| nuqs | latest | URL state | Type-safe URL search params for dashboard filters. Shareable filtered views. | LOW |

**Why NOT React Context for everything:**
- TanStack Query handles server state properly (caching, invalidation)
- Zustand is minimal for client-only state
- Separation of concerns

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Hook Form | 7.x | Form management | Performant forms for ICP wizard, lead input, settings. Uncontrolled by default. | MEDIUM |
| @hookform/resolvers | latest | Validation integration | Connect Zod schemas to forms. Single source of truth for validation. | MEDIUM |
| Zod | 3.x | Schema validation | Shared between forms, API, and AI response validation. | MEDIUM |

### File Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Storage | built-in | File storage | Company logos, exported reports. Included with Supabase. | MEDIUM |
| Papaparse | latest | CSV parsing | Import/export leads in bulk. | LOW |
| xlsx | latest | Excel export | Enterprise users expect Excel exports. | LOW |

### Monitoring & Analytics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Sentry | latest | Error tracking | Catch scraping failures, AI errors in production. Essential for reliability. | MEDIUM |
| Vercel Analytics | built-in | Usage analytics | If deploying on Vercel. Simple, privacy-focused. | LOW |
| PostHog | latest | Product analytics | Self-hostable alternative. Feature flags, session replay for debugging UX. | LOW |

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 9.x | Linting | Flat config in v9. Catch errors early. | MEDIUM |
| Prettier | 3.x | Code formatting | Consistent formatting. | MEDIUM |
| Vitest | latest | Unit testing | Fast, Vite-based. Better DX than Jest for modern TypeScript. | MEDIUM |
| Playwright Test | latest | E2E testing | Same as scraping tool. Test critical flows. | MEDIUM |

### Infrastructure

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Vercel | Hosting | Native Next.js support. Edge functions for scraping. Automatic preview deploys. | MEDIUM |
| Supabase (managed) | Database hosting | Already using. Managed PostgreSQL, backups, scaling. | MEDIUM |
| Upstash Redis | Rate limiting + caching | Serverless Redis. Rate limit scraping, cache AI responses. | LOW |

**Alternative to Vercel: Railway/Render**
- If need persistent containers for scraping (Playwright)
- Vercel functions have timeout limits (30s hobby, 60s pro)
- Long scraping jobs may need background workers

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Framework | Next.js 16 | Remix | Next.js has better Vercel integration, larger ecosystem |
| ORM | Drizzle | Prisma | Prisma has larger bundle, binary engine complicates deployment |
| Styling | Tailwind + shadcn | MUI/Chakra | More opinionated, harder to customize for unique dashboard |
| AI SDK | Vercel AI SDK | LangChain.js | LangChain overkill for this use case, Vercel AI SDK simpler |
| Scraping | Playwright | Puppeteer | Playwright more reliable, better maintained |
| State | TanStack Query + Zustand | Redux Toolkit | Simpler, less boilerplate for this scale |
| Auth | Supabase Auth | NextAuth.js | Supabase Auth included, tighter RLS integration |
| Forms | React Hook Form | Formik | React Hook Form more performant, better TypeScript |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| **Prisma** | Bundle size too large for edge/serverless. Binary engine deployment issues. |
| **Redux** | Overkill for this scale. TanStack Query + Zustand simpler. |
| **LangChain.js** | Heavy abstraction not needed. Vercel AI SDK sufficient for direct LLM calls. |
| **tRPC** | Next.js Route Handlers + Zod sufficient. tRPC adds complexity for simple API. |
| **MongoDB** | PostgreSQL better for relational lead/ICP data. Supabase provides managed PostgreSQL. |
| **Firebase** | Supabase preferred for PostgreSQL, better RLS, open source. |
| **Axios** | Native fetch is sufficient. One less dependency. |
| **Moment.js** | Deprecated. Use date-fns or native Intl API. |
| **Puppeteer** | Playwright more reliable and actively maintained. |

## Installation

```bash
# Create Next.js project
npx create-next-app@latest ai-sales-qualification --typescript --tailwind --eslint --app --src-dir

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres zod

# AI
npm install ai openai tiktoken

# UI
npx shadcn@latest init
npm install @tanstack/react-query zustand react-hook-form @hookform/resolvers

# Scraping
npm install playwright cheerio

# Payments
npm install stripe @stripe/stripe-js

# Utilities
npm install date-fns clsx tailwind-merge

# Dev dependencies
npm install -D drizzle-kit @types/node vitest @vitejs/plugin-react
npx playwright install chromium
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional: Enrichment APIs
CLEARBIT_API_KEY=
APOLLO_API_KEY=

# Optional: Monitoring
SENTRY_DSN=
```

## Project Structure (Recommended)

```
src/
├── app/
│   ├── (auth)/           # Auth routes (login, register)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── leads/
│   │   ├── icp/
│   │   └── settings/
│   ├── api/
│   │   ├── leads/
│   │   ├── scrape/
│   │   ├── analyze/
│   │   └── webhooks/
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn components
│   ├── leads/            # Lead-specific components
│   ├── icp/              # ICP wizard components
│   └── dashboard/        # Dashboard layout components
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── ai/               # AI/LLM utilities
│   ├── scraping/         # Scraping logic
│   └── stripe/           # Stripe utilities
├── db/
│   ├── schema.ts         # Drizzle schema
│   └── migrations/       # Drizzle migrations
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

## Sources & Confidence Notes

### Verified (HIGH Confidence)
- Next.js 16.1.4 current version (verified via official docs fetch)
- Tailwind CSS v4.1 current (verified via official docs fetch)
- App Router features (verified via official docs fetch)

### From Training Data (MEDIUM Confidence)
- Supabase, Drizzle, Zod recommendations based on training data (May 2025 cutoff)
- Vercel AI SDK, TanStack Query, React Hook Form based on training data
- Versions may have minor updates; use `latest` or verify before install

### Ecosystem Knowledge (LOW Confidence)
- Enrichment API recommendations (Clearbit, Apollo) based on industry knowledge
- nuqs, Upstash Redis are newer tools; verify current state
- PostHog features may have evolved

## Roadmap Implications

1. **Phase 1 (Foundation):** Next.js + Supabase + Auth + Tailwind/shadcn
   - Lowest risk, well-documented stack

2. **Phase 2 (Core Features):** Scraping + AI integration
   - Needs graceful degradation architecture upfront
   - Playwright timeout handling critical

3. **Phase 3 (Monetization):** Stripe usage-based billing
   - Complex, defer until core features stable
   - Need accurate usage tracking first

4. **Phase 4 (Polish):** Analytics, exports, optimizations
   - Lower priority, can iterate

## Open Questions for Later Research

- Playwright on serverless: May need dedicated worker for long-running scrapes
- Supabase Edge Functions vs Vercel Edge Runtime for scraping
- AI cost optimization (caching, prompt compression)
- Multi-tenant data isolation patterns with Supabase RLS
