# Phase 2: ICP & Onboarding - Research

**Researched:** 2026-01-25
**Domain:** AI-powered natural language parsing, multi-step wizard UI, structured data extraction
**Confidence:** HIGH

## Summary

This research covers the ICP (Ideal Customer Profile) onboarding system for LeadQual, focusing on two core challenges: (1) building a multi-step wizard that captures ICP data with minimal friction, and (2) using AI to parse natural language descriptions into structured ICP fields.

**Key findings:**
1. **Vercel AI SDK 6.x** has deprecated `generateObject` in favor of `generateText` with `Output.object()` - this is the new pattern for structured output
2. **Multi-step forms** should use per-step validation with react-hook-form + Zod, with progress indicators to reduce abandonment (90% of users churn without strong onboarding)
3. **Natural language first** approach aligns with UX best practices - users describe their ICP freely, AI extracts structured fields, user reviews/edits
4. **ICP data structure** should capture: company info (what they sell), target criteria (ideal customer firmographics), value propositions, and common objections
5. **JSONB columns** in PostgreSQL (via Drizzle) work well for semi-structured ICP data that may evolve

**Primary recommendation:** Use a 4-step wizard (Company Info -> Target Criteria -> Value Props -> Objections) with an AI-powered "describe your customer" option on each step. Parse natural language with AI SDK 6's `generateText` + `Output.object()` using Zod schemas.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | 6.0.x | Vercel AI SDK core | Unified API for structured output, streaming, multi-provider |
| `@ai-sdk/openai` | 3.0.x | OpenAI provider | GPT-4o integration with 100% structured output reliability |
| `react-hook-form` | 7.x | Form state management | Already in project, supports multi-step patterns |
| `zod` | 4.x | Schema validation | Already in project, works with AI SDK Output.object() |
| `drizzle-orm` | 0.45.x | Database ORM | Already in project, supports JSONB for flexible ICP data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand` | 5.x | Lightweight state | Optional for cross-step state (react-hook-form may suffice) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand for wizard state | FormProvider from react-hook-form | FormProvider simpler for form data, Zustand better for complex UI state |
| JSONB for ICP fields | Separate normalized tables | JSONB simpler, normalized better for querying individual fields |
| Single-form wizard | Multi-form per step | Single form with step validation is cleaner for this use case |

**Installation:**
```bash
# AI SDK (new packages needed)
npm install ai @ai-sdk/openai

# Already installed from Phase 1
# react-hook-form, zod, @hookform/resolvers, drizzle-orm
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (protected)/
│   │   ├── onboarding/
│   │   │   └── page.tsx              # Wizard container
│   │   └── settings/
│   │       └── icp/
│   │           └── page.tsx          # ICP editor (post-onboarding)
│   └── api/
│       └── icp/
│           ├── parse/
│           │   └── route.ts          # AI parsing endpoint
│           └── route.ts              # ICP CRUD
├── components/
│   ├── onboarding/
│   │   ├── icp-wizard.tsx            # Main wizard component
│   │   ├── steps/
│   │   │   ├── company-info-step.tsx
│   │   │   ├── target-criteria-step.tsx
│   │   │   ├── value-props-step.tsx
│   │   │   └── objections-step.tsx
│   │   └── ai-input.tsx              # Natural language input with AI parsing
│   └── ui/
│       └── progress.tsx              # Progress indicator (shadcn)
├── lib/
│   ├── ai/
│   │   ├── index.ts                  # AI client setup
│   │   └── prompts/
│   │       └── icp-parser.ts         # ICP parsing prompts
│   └── validations/
│       └── icp.ts                    # Zod schemas for ICP
└── lib/db/
    └── schema.ts                     # Add ICP table
```

### Pattern 1: AI SDK 6 Structured Output with Zod
**What:** Parse natural language to structured ICP using new AI SDK 6 pattern
**When to use:** Any AI-to-structured-data conversion
**Example:**
```typescript
// Source: AI SDK 6 documentation - Generating Structured Data
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const icpCompanySchema = z.object({
  productDescription: z.string().describe('What the company sells or provides'),
  industry: z.string().describe('The industry they operate in'),
  companySize: z.enum(['solo', 'small', 'medium', 'large', 'enterprise'])
    .describe('Company size category'),
  targetMarket: z.enum(['b2b', 'b2c', 'both']).describe('Target market type'),
});

export async function parseCompanyInfo(naturalLanguageInput: string) {
  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({
      schema: icpCompanySchema,
    }),
    system: `You are an expert at extracting structured business information from natural language descriptions.
Extract the company's product/service, industry, size, and target market from the user's description.
If information is not provided, make reasonable inferences based on context.`,
    prompt: naturalLanguageInput,
  });

  return output;
}
```

### Pattern 2: Multi-Step Wizard with Per-Step Validation
**What:** Wizard with independent step validation using react-hook-form
**When to use:** Multi-step onboarding flows
**Example:**
```typescript
// Source: React Hook Form Advanced Usage + shadcn patterns
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Each step has its own schema
const stepSchemas = {
  1: companyInfoSchema,
  2: targetCriteriaSchema,
  3: valuePropsSchema,
  4: objectionsSchema,
};

// Combined schema for full form
const fullIcpSchema = companyInfoSchema
  .merge(targetCriteriaSchema)
  .merge(valuePropsSchema)
  .merge(objectionsSchema);

export function IcpWizard() {
  const [step, setStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(fullIcpSchema),
    mode: 'onChange',
    defaultValues: {
      // All fields with defaults
    },
  });

  const validateCurrentStep = async () => {
    const currentSchema = stepSchemas[step];
    const currentFields = Object.keys(currentSchema.shape);
    const isValid = await form.trigger(currentFields);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && step < 4) {
      setStep(step + 1);
    }
  };

  return (
    <FormProvider {...form}>
      <ProgressIndicator current={step} total={4} />
      {step === 1 && <CompanyInfoStep />}
      {step === 2 && <TargetCriteriaStep />}
      {step === 3 && <ValuePropsStep />}
      {step === 4 && <ObjectionsStep />}
      <WizardNavigation
        onBack={() => setStep(s => s - 1)}
        onNext={handleNext}
        isLastStep={step === 4}
      />
    </FormProvider>
  );
}
```

### Pattern 3: Natural Language Input with AI Enhancement
**What:** Textarea with "AI Parse" button that extracts structured fields
**When to use:** Any step where user can describe in natural language
**Example:**
```typescript
// AI-enhanced input component
import { useState, useTransition } from 'react';
import { useFormContext } from 'react-hook-form';

interface AiInputProps {
  fieldMappings: Record<string, string>; // AI output field -> form field
  parseAction: (input: string) => Promise<Record<string, any>>;
  placeholder: string;
}

export function AiInput({ fieldMappings, parseAction, placeholder }: AiInputProps) {
  const [naturalInput, setNaturalInput] = useState('');
  const [isParsing, startParsing] = useTransition();
  const { setValue } = useFormContext();

  const handleParse = () => {
    startParsing(async () => {
      const parsed = await parseAction(naturalInput);

      // Map AI output to form fields
      Object.entries(fieldMappings).forEach(([aiField, formField]) => {
        if (parsed[aiField]) {
          setValue(formField, parsed[aiField], { shouldValidate: true });
        }
      });
    });
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={naturalInput}
        onChange={(e) => setNaturalInput(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
      <Button
        type="button"
        onClick={handleParse}
        disabled={isParsing || !naturalInput.trim()}
      >
        {isParsing ? 'Parsing...' : 'Extract with AI'}
      </Button>
    </div>
  );
}
```

### Pattern 4: ICP Database Schema with JSONB
**What:** ICP table with typed JSONB columns for flexible structure
**When to use:** Semi-structured data that may evolve
**Example:**
```typescript
// Source: Drizzle ORM PostgreSQL column types
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Type definitions for JSONB columns
interface TargetCriteria {
  companySizes: string[];
  industries: string[];
  locations: string[];
  techRequirements: string[];
  budgetRange?: { min: number; max: number };
}

interface ValueProposition {
  headline: string;
  description: string;
  differentiators: string[];
}

interface Objection {
  objection: string;
  response: string;
}

export const icpProfiles = pgTable('icp_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

  // Company info (flat fields for common queries)
  productDescription: text('product_description').notNull(),
  industry: text('industry').notNull(),
  companySize: text('company_size').notNull(),
  targetMarket: text('target_market').notNull(),

  // Complex nested data as JSONB
  targetCriteria: jsonb('target_criteria').$type<TargetCriteria>().notNull(),
  valuePropositions: jsonb('value_propositions').$type<ValueProposition[]>().notNull(),
  commonObjections: jsonb('common_objections').$type<Objection[]>().notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type IcpProfile = typeof icpProfiles.$inferSelect;
export type NewIcpProfile = typeof icpProfiles.$inferInsert;
```

### Pattern 5: Server Action for ICP Parsing
**What:** Server action that calls AI SDK for parsing
**When to use:** Secure AI calls from client components
**Example:**
```typescript
// lib/icp/actions.ts
'use server';

import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { targetCriteriaSchema } from '@/lib/validations/icp';

export async function parseTargetCriteria(input: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({
      schema: targetCriteriaSchema,
    }),
    system: `Extract ideal customer criteria from the description.
Focus on: company sizes, industries, locations, technology requirements.
Return structured data matching the schema.`,
    prompt: input,
  });

  return output;
}
```

### Anti-Patterns to Avoid
- **Asking everything upfront:** Split into digestible steps, validate per step
- **Skipping AI extraction review:** Always let users edit AI-extracted fields before saving
- **Blocking on AI failures:** Have graceful fallback to manual input if AI parsing fails
- **Storing raw natural language only:** Parse and store structured data for querying
- **Not showing progress:** Always show wizard progress (step X of Y)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Natural language parsing | Regex/keyword extraction | AI SDK + GPT-4o structured output | Handles variations, context, inference |
| Form state across steps | Custom useState management | react-hook-form FormProvider | Built-in validation, error handling |
| Step validation | Manual field checks | Zod schema + form.trigger() | Type-safe, declarative, consistent |
| Progress indicator | Custom div/CSS | shadcn Progress component | Accessible, styled consistently |
| JSON schema validation | Manual type guards | Zod with .$type<T>() | Runtime + compile-time safety |

**Key insight:** AI-powered extraction looks complex but AI SDK 6 makes it straightforward. The complexity is in UX - letting users see and correct AI output.

## Common Pitfalls

### Pitfall 1: Wizard Abandonment from Too Many Steps
**What goes wrong:** Users drop off mid-wizard (90% churn rate without good onboarding)
**Why it happens:** Too many steps, unclear progress, required fields for optional info
**How to avoid:**
- Keep to 4-5 steps maximum
- Show clear progress indicator
- Allow "Skip for now" on non-critical fields
- Provide natural language shortcut to fill multiple fields at once
**Warning signs:** Analytics showing drop-off at specific steps

### Pitfall 2: AI Extraction Without Review
**What goes wrong:** Users distrust or get frustrated with AI that "puts words in their mouth"
**Why it happens:** Auto-populating fields without user confirmation
**How to avoid:**
- Always show AI-extracted values in editable fields
- Highlight fields that were AI-populated
- Allow easy clearing/reset of AI suggestions
- Show confidence or "AI suggested" indicators
**Warning signs:** Users clearing AI fields or reporting inaccurate extractions

### Pitfall 3: Blocking on AI Failures
**What goes wrong:** Wizard becomes unusable when OpenAI API is slow/down
**Why it happens:** No fallback for AI parsing failures
**How to avoid:**
- Make AI parsing optional ("Describe in natural language OR fill manually")
- Add timeout with fallback to manual input
- Queue failed parses for retry
- Show graceful error: "AI couldn't parse - please fill manually"
**Warning signs:** Error spikes correlating with OpenAI outages

### Pitfall 4: Losing Progress on Navigation
**What goes wrong:** Users lose entered data when navigating back or browser refresh
**Why it happens:** Not persisting form state
**How to avoid:**
- Save to localStorage on step change
- Or save draft to database on step completion
- Restore on page load
**Warning signs:** Support tickets about lost progress

### Pitfall 5: Overly Rigid Schema
**What goes wrong:** Users can't express their ICP because fields are too constrained
**Why it happens:** Fixed enum values that don't match user's domain
**How to avoid:**
- Allow "Other" option with free text
- Use flexible fields (text arrays vs enums) where appropriate
- JSONB allows schema evolution without migrations
**Warning signs:** Users selecting "Other" frequently

### Pitfall 6: Token Cost Explosion
**What goes wrong:** AI costs spiral with long user inputs or multiple parse attempts
**Why it happens:** No input length limits, retries on partial failures
**How to avoid:**
- Limit input textarea to reasonable length (1000-2000 chars)
- Use GPT-4o-mini for simple extractions (cheaper)
- Track token usage per user (for future billing)
- Cache identical inputs
**Warning signs:** Monthly OpenAI bill spikes

## Code Examples

Verified patterns from official sources:

### Zod Schemas for ICP Data
```typescript
// Source: Zod documentation + ICP best practices
// lib/validations/icp.ts
import { z } from 'zod';

export const companyInfoSchema = z.object({
  productDescription: z.string()
    .min(10, 'Please describe what you sell in at least 10 characters')
    .max(500, 'Keep it under 500 characters'),
  industry: z.string().min(2, 'Please specify your industry'),
  companySize: z.enum(['solo', 'small', 'medium', 'large', 'enterprise'], {
    errorMap: () => ({ message: 'Please select your company size' }),
  }),
  targetMarket: z.enum(['b2b', 'b2c', 'both'], {
    errorMap: () => ({ message: 'Please select your target market' }),
  }),
});

export const targetCriteriaSchema = z.object({
  idealCompanySizes: z.array(z.string()).min(1, 'Select at least one company size'),
  targetIndustries: z.array(z.string()).min(1, 'Add at least one target industry'),
  targetLocations: z.array(z.string()).default([]),
  techRequirements: z.array(z.string()).default([]),
  budgetRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
});

export const valuePropsSchema = z.object({
  valuePropositions: z.array(z.object({
    headline: z.string().min(5, 'Headline too short'),
    description: z.string().min(20, 'Add more detail'),
    differentiators: z.array(z.string()),
  })).min(1, 'Add at least one value proposition'),
});

export const objectionsSchema = z.object({
  commonObjections: z.array(z.object({
    objection: z.string().min(10, 'Describe the objection'),
    suggestedResponse: z.string().optional(),
  })).default([]),
});

export const fullIcpSchema = companyInfoSchema
  .merge(targetCriteriaSchema)
  .merge(valuePropsSchema)
  .merge(objectionsSchema);

export type IcpFormData = z.infer<typeof fullIcpSchema>;
```

### OpenAI Provider Setup
```typescript
// Source: AI SDK OpenAI Provider documentation
// lib/ai/index.ts
import { createOpenAI } from '@ai-sdk/openai';

// Create OpenAI provider with custom configuration
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Optional: configure base URL for Azure OpenAI
  // baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
});

// Export configured models
export const gpt4o = openai('gpt-4o');
export const gpt4oMini = openai('gpt-4o-mini'); // Cheaper for simple extractions
```

### Complete ICP Parsing with AI SDK 6
```typescript
// Source: AI SDK 6 documentation - Generating Structured Data
// lib/ai/prompts/icp-parser.ts
import { generateText, Output } from 'ai';
import { gpt4o } from '@/lib/ai';
import { targetCriteriaSchema } from '@/lib/validations/icp';

const SYSTEM_PROMPT = `You are an expert B2B sales analyst who helps companies define their Ideal Customer Profile (ICP).

Given a natural language description of a company's ideal customer, extract structured information.

Guidelines:
- For company sizes, use: solo (1), small (2-50), medium (51-200), large (201-1000), enterprise (1000+)
- For industries, use standard industry names (SaaS, Healthcare, Finance, etc.)
- For locations, use region/country names or "Global" for worldwide
- For tech requirements, list specific technologies or categories (e.g., "Salesforce", "AWS", "Modern data stack")
- If budget info is mentioned, extract min/max values in USD

Be helpful and make reasonable inferences when information is implicit.`;

export async function parseTargetCriteriaFromNL(naturalLanguage: string) {
  const { output, usage } = await generateText({
    model: gpt4o,
    output: Output.object({
      schema: targetCriteriaSchema,
    }),
    system: SYSTEM_PROMPT,
    prompt: `Extract ideal customer criteria from this description:

"${naturalLanguage}"

Return structured target criteria.`,
  });

  // Log token usage for cost tracking
  console.log(`ICP parse tokens: ${usage.totalTokens}`);

  return output;
}
```

### Streaming Object for Real-time Feedback
```typescript
// Source: AI SDK 6 documentation - Streaming Structured Data
// For cases where you want to show partial results as AI processes
import { streamText, Output } from 'ai';
import { gpt4o } from '@/lib/ai';

export async function streamIcpParsing(input: string) {
  const { partialOutputStream } = streamText({
    model: gpt4o,
    output: Output.object({
      schema: targetCriteriaSchema,
    }),
    prompt: input,
  });

  // Yields partial objects as they're generated
  for await (const partial of partialOutputStream) {
    console.log('Partial:', partial);
    // Send to client via SSE or WebSocket
  }
}
```

### Progress Component (shadcn style)
```typescript
// components/ui/progress.tsx
// Source: shadcn/ui progress component pattern
import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Step indicator variant
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                i < currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : i === currentStep
                  ? 'border-primary text-primary'
                  : 'border-muted text-muted-foreground'
              )}
            >
              {i + 1}
            </div>
            {stepLabels?.[i] && (
              <span className="mt-1 text-xs text-muted-foreground">
                {stepLabels[i]}
              </span>
            )}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 mx-2',
                i < currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject` | `generateText` + `Output.object()` | AI SDK 6 (Dec 2025) | Unified API, tool loops + structured output |
| `streamObject` | `streamText` + `Output.object()` | AI SDK 6 (Dec 2025) | Access via `partialOutputStream` |
| `response_format` (OpenAI) | AI SDK handles automatically | AI SDK 6 | SDK abstracts provider differences |
| Custom wizard state | react-hook-form FormProvider | Stable | Simpler validation, less boilerplate |
| Separate tables for ICP parts | JSONB columns with typed inference | Stable | Flexible schema, fewer migrations |

**Deprecated/outdated:**
- `generateObject` / `streamObject`: Deprecated in AI SDK 6, use `generateText`/`streamText` with `output` parameter
- `@vercel/ai-utils`: Merged into main `ai` package
- Raw OpenAI `response_format` usage: AI SDK abstracts this

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal ICP field granularity**
   - What we know: Research shows 3-5 key characteristics are sufficient for most ICPs
   - What's unclear: Whether to allow unlimited industries/sizes or constrain to common ones
   - Recommendation: Start with text arrays, add enum constraints based on usage patterns

2. **AI model selection (GPT-4o vs GPT-4o-mini)**
   - What we know: GPT-4o has 100% structured output accuracy, 4o-mini is ~10x cheaper
   - What's unclear: Whether simpler extractions can use mini without quality loss
   - Recommendation: Use GPT-4o for Phase 2, benchmark 4o-mini in Phase 4

3. **Draft persistence strategy**
   - What we know: Should persist incomplete wizards to prevent data loss
   - What's unclear: localStorage vs database drafts for partial ICP
   - Recommendation: Use localStorage for simplicity in v1, migrate to DB drafts if abandonment is high

## Sources

### Primary (HIGH confidence)
- [AI SDK 6 Documentation - Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - New Output.object() pattern
- [AI SDK Migration Guide 6.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) - Deprecated generateObject
- [AI SDK OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai) - GPT-4o configuration
- [React Hook Form Advanced Usage](https://react-hook-form.com/advanced-usage) - Multi-step patterns
- [Drizzle ORM PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) - JSONB usage

### Secondary (MEDIUM confidence)
- [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs) - 100% reliability with GPT-4o
- [Gartner ICP Framework](https://www.gartner.com/en/articles/the-framework-for-ideal-customer-profile-development) - ICP data structure
- [SaaS Onboarding UX Best Practices](https://www.designstudiouiux.com/blog/saas-onboarding-ux/) - 90% churn without onboarding
- [User Onboarding Statistics](https://userguiding.com/blog/user-onboarding-statistics) - Progress bars, completion rates

### Tertiary (LOW confidence)
- Community patterns for shadcn multi-step forms - No official component yet
- Natural language to structured data UX - Emerging pattern, best practices evolving

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official AI SDK 6 docs, packages verified on npm
- Architecture: HIGH - Established patterns for wizards + AI SDK integration
- Pitfalls: MEDIUM - Based on general UX research, not LeadQual-specific data

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - AI SDK is stable but actively evolving)
