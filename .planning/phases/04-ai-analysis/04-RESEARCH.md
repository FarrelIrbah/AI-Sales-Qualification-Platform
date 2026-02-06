# Phase 4: AI Analysis - Research

**Researched:** 2026-02-06
**Domain:** AI-powered lead scoring and sales intelligence generation
**Confidence:** HIGH

## Summary

This phase implements AI-driven lead analysis using Google Gemini to generate lead scores, pitch recommendations, and objection predictions. The research covers the Gemini API for structured output, database schema design for analysis results, and UI patterns for displaying expandable score breakdowns.

**Critical finding:** The project currently uses `@google/generative-ai` which is **deprecated**. Google recommends migrating to `@google/genai` (unified SDK). However, for Phase 4 scope, the existing SDK can continue to work with structured output via manual JSON parsing (already implemented in `icp-parser.ts`). Migration to the new SDK is recommended but can be deferred.

The existing pattern of using Gemini Flash with prompt-based JSON generation and Zod validation is sound and should be extended for analysis features. Zod v4 (already in project at v4.3.6) supports native `z.toJSONSchema()` which can be used with Gemini's structured output mode for guaranteed schema compliance.

**Primary recommendation:** Extend the existing AI pattern (`geminiFlash.generateContent` + JSON extraction + Zod validation) for analysis. Use a single comprehensive prompt that generates all analysis data in one call to minimize token costs and latency.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/generative-ai | ^0.21.0 | AI text generation | Already in project, works with Gemini 2.0 Flash |
| zod | ^4.3.6 | Schema validation | Already in project, native JSON Schema support |
| drizzle-orm | ^0.45.1 | Database ORM | Already in project, JSONB support with type inference |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-collapsible | latest | Expandable UI sections | For expandable score component details |
| lucide-react | ^0.562.0 | Icons | Already in project, for score indicators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @google/generative-ai | @google/genai | New unified SDK, but requires migration effort - defer |
| Single prompt | Multi-prompt pipeline | Multiple calls = more latency + tokens, avoid |
| JSONB scores | Separate tables | Over-normalized, JSONB is fine for nested analysis data |

**Installation:**
```bash
npx shadcn@latest add collapsible
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── ai/
│   │   ├── index.ts                    # Gemini client (existing)
│   │   └── prompts/
│   │       ├── icp-parser.ts           # Existing ICP parsing
│   │       └── lead-analyzer.ts        # NEW: Lead analysis prompts
│   └── analysis/
│       ├── actions.ts                  # Server actions for analysis
│       ├── schemas.ts                  # Zod schemas for analysis results
│       └── scoring.ts                  # Score calculation helpers
├── components/
│   └── analysis/
│       ├── analysis-progress.tsx       # Progress indicator during analysis
│       ├── lead-score-card.tsx         # Main score display
│       ├── score-breakdown.tsx         # Expandable component scores
│       ├── company-insights.tsx        # Extracted data + AI commentary
│       ├── pitch-angles.tsx            # Pitch recommendations
│       └── objection-cards.tsx         # Objection predictions + responses
└── app/
    └── (protected)/
        └── analyze/
            └── page.tsx                # Extend existing page with analysis view
```

### Pattern 1: Single-Prompt Comprehensive Analysis
**What:** Generate all analysis data (scores, pitches, objections) in a single AI call
**When to use:** Always - minimizes token costs and latency
**Example:**
```typescript
// Source: Project pattern from src/lib/ai/prompts/icp-parser.ts
const ANALYSIS_SYSTEM_PROMPT = `You are an expert B2B sales analyst...

Given:
- Target company data (extracted from their website)
- User's ICP profile (their ideal customer criteria and value props)

Generate a comprehensive lead analysis with:
1. Overall lead score (1-100)
2. Component scores with reasoning
3. ICP match percentage
4. Company insights commentary
5. Personalized pitch angles
6. Predicted objections with handling strategies

Respond ONLY with valid JSON matching this structure:
{...schema...}`;

const result = await geminiFlash.generateContent([
  { text: ANALYSIS_SYSTEM_PROMPT },
  { text: `Analyze this lead:\n\nCompany: ${JSON.stringify(companyData)}\n\nICP: ${JSON.stringify(icpProfile)}` }
]);
```

### Pattern 2: Discriminated Union ViewState (Existing Pattern)
**What:** Type-safe view state management for multi-step flows
**When to use:** The analyze page already uses this - extend for analysis states
**Example:**
```typescript
// Source: src/app/(protected)/analyze/page.tsx (extend existing)
type ViewState =
  | { type: 'input' }
  | { type: 'extracting'; url: string }
  | { type: 'manual'; partialData: PartialCompanyData; missingFields: string[] }
  | { type: 'analyzing'; companyData: PartialCompanyData }  // NEW
  | { type: 'result'; analysis: AnalysisResult }            // NEW
```

### Pattern 3: JSONB with TypeScript Types for Analysis Results
**What:** Store complex nested analysis data in JSONB columns with full type safety
**When to use:** Analysis results have nested structures (component scores, pitches, objections)
**Example:**
```typescript
// Source: Drizzle ORM pattern from existing schema
export interface AnalysisResult {
  leadScore: number;
  icpMatchPercentage: number;
  componentScores: ComponentScore[];
  insights: CompanyInsights;
  pitchAngles: PitchAngle[];
  objections: PredictedObjection[];
}

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  icpProfileId: uuid('icp_profile_id').references(() => icpProfiles.id),

  // Core scores (flat for querying)
  leadScore: integer('lead_score').notNull(),
  icpMatchPercentage: integer('icp_match_percentage').notNull(),

  // Complex nested data as JSONB
  componentScores: jsonb('component_scores').$type<ComponentScore[]>().notNull(),
  insights: jsonb('insights').$type<CompanyInsights>().notNull(),
  pitchAngles: jsonb('pitch_angles').$type<PitchAngle[]>().notNull(),
  objections: jsonb('objections').$type<PredictedObjection[]>().notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Anti-Patterns to Avoid
- **Multiple AI calls for one analysis:** Don't split scoring, pitches, and objections into separate calls - wastes tokens and increases latency
- **Storing scores in separate tables:** Over-normalization for data that's always accessed together
- **Client-side AI calls:** Always call Gemini from server actions to protect API keys
- **Unbounded output:** Always specify max tokens to prevent cost explosions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expandable sections | Custom toggle state | shadcn Collapsible | Accessible, animated, keyboard support |
| Progress indicators | Custom step tracker | Existing ExtractionProgress pattern | Already proven pattern in codebase |
| JSON extraction from AI | Regex parsing | Existing extractJson() helper | Handles markdown code blocks, edge cases |
| Schema validation | Manual checks | Zod .safeParse() | Type-safe, detailed error messages |
| Score color coding | Hardcoded conditionals | cn() utility with conditional classes | Already used throughout codebase |

**Key insight:** The existing codebase has established patterns for AI integration, progress tracking, and validation. Extend rather than reinvent.

## Common Pitfalls

### Pitfall 1: Token Cost Explosion
**What goes wrong:** Costs spiral when sending large prompts or generating verbose outputs
**Why it happens:** No token limits, verbose prompts, or multiple calls per analysis
**How to avoid:**
- Set `maxOutputTokens` to reasonable limit (2048 is plenty for structured output)
- Use concise prompts - the AI doesn't need lengthy explanations
- Single comprehensive call instead of multiple smaller calls
- Log token usage for monitoring
**Warning signs:** Token counts exceeding 3000 per analysis

### Pitfall 2: Score Without Explanation (Project-Identified)
**What goes wrong:** Users see a number but don't trust it or understand why
**Why it happens:** AI generates score but not the reasoning
**How to avoid:**
- Prompt must require reasoning for EACH component score
- UI must show component breakdown with expandable details
- Include "why this score" in the prompt output schema
**Warning signs:** Component scores without reasoning fields populated

### Pitfall 3: Inconsistent Score Ranges
**What goes wrong:** Some component scores use 0-100, others use 0-10 or qualitative terms
**Why it happens:** Prompt doesn't clearly specify output format
**How to avoid:**
- Explicitly define all score ranges in prompt: "Score from 0 to 100 where..."
- Validate ranges in Zod schema with `.min(0).max(100)`
- Normalize any qualitative assessments to numeric
**Warning signs:** Scores outside expected ranges in testing

### Pitfall 4: Empty/Sparse Company Data
**What goes wrong:** Analysis quality degrades when extraction found little data
**Why it happens:** Not all websites yield rich company data
**How to avoid:**
- Prompt should instruct AI to: "If data is sparse, acknowledge uncertainty and provide best estimates with lower confidence"
- Include confidence indicator in output
- UI should show warning when extraction was low-confidence
**Warning signs:** Generic pitches that don't reference specific company attributes

### Pitfall 5: AI Hallucinating Company Details
**What goes wrong:** AI invents company details not present in extracted data
**Why it happens:** LLMs fill gaps creatively when data is missing
**How to avoid:**
- Prompt explicitly: "Only reference information provided in the company data. Do not invent or assume details."
- Structure output to clearly separate "extracted facts" from "AI analysis"
**Warning signs:** Specific numbers, names, or facts that don't appear in input data

## Code Examples

Verified patterns from official sources and existing codebase:

### Analysis Zod Schema
```typescript
// Source: Pattern from src/lib/validations/icp.ts
import { z } from 'zod';

export const componentScoreSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  reasoning: z.string(),
});

export const pitchAngleSchema = z.object({
  headline: z.string(),
  explanation: z.string(),
  whyItWorks: z.string(),
});

export const predictedObjectionSchema = z.object({
  objection: z.string(),
  likelihood: z.enum(['high', 'medium', 'low']),
  recommendedResponse: z.string(),
});

export const analysisResultSchema = z.object({
  leadScore: z.number().min(0).max(100),
  icpMatchPercentage: z.number().min(0).max(100),
  componentScores: z.array(componentScoreSchema),
  insightsSummary: z.string(),
  pitchAngles: z.array(pitchAngleSchema).min(2).max(3),
  objections: z.array(predictedObjectionSchema).min(1).max(4),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
```

### AI Call with JSON Extraction
```typescript
// Source: Pattern from src/lib/ai/prompts/icp-parser.ts
import { geminiFlash } from '@/lib/ai';
import { analysisResultSchema } from './schemas';

function extractJson(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                    text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr.trim());
  }
  return JSON.parse(text.trim());
}

export async function analyzeLeadWithAI(
  companyData: CompanyData,
  icpProfile: IcpProfile
): Promise<AnalysisResult | null> {
  try {
    const result = await geminiFlash.generateContent([
      { text: ANALYSIS_SYSTEM_PROMPT },
      { text: buildAnalysisPrompt(companyData, icpProfile) }
    ]);

    const response = result.response.text();
    const parsed = extractJson(response);
    const validated = analysisResultSchema.safeParse(parsed);

    if (validated.success) {
      return validated.data;
    }
    console.error('Validation failed:', validated.error);
    return null;
  } catch (error) {
    console.error('Analysis failed:', error);
    return null;
  }
}
```

### Expandable Score Component
```typescript
// Source: shadcn/ui Collapsible component
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ScoreBarProps {
  name: string;
  score: number;
  reasoning: string;
}

export function ScoreBar({ name, score, reasoning }: ScoreBarProps) {
  const [open, setOpen] = useState(false);

  const colorClass = score >= 70
    ? 'bg-green-500'
    : score >= 40
    ? 'bg-yellow-500'
    : 'bg-red-500';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-2">
          <span className="font-medium">{name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm">{score}%</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              open && "rotate-180"
            )} />
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", colorClass)}
            style={{ width: `${score}%` }}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4 text-sm text-muted-foreground">
        {reasoning}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Score Color Thresholds
```typescript
// Recommended thresholds (Claude's discretion area)
export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Strong Fit';
  if (score >= 40) return 'Moderate Fit';
  return 'Weak Fit';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @google/generative-ai | @google/genai (unified SDK) | 2025 | New SDK recommended, old still works |
| zod-to-json-schema | z.toJSONSchema() native | Zod v4 | Built-in JSON Schema conversion |
| Multiple AI calls | Single comprehensive prompt | Best practice | Lower cost, faster response |
| Manual JSON parsing | Structured output mode | Gemini 2.0+ | Guaranteed schema compliance |

**Deprecated/outdated:**
- `@google/generative-ai`: Deprecated, migrate to `@google/genai` (can defer, still works)
- `zod-to-json-schema` library: Unnecessary with Zod v4's native `z.toJSONSchema()`

## Open Questions

Things that couldn't be fully resolved:

1. **Gemini 2.0 Flash structured output reliability**
   - What we know: Structured output mode exists and works with JSON Schema
   - What's unclear: Whether to use native structured output (`responseSchema`) or continue with prompt + validation approach
   - Recommendation: Continue with existing prompt + Zod validation pattern (proven in codebase) - structured output mode can be adopted later if validation failures are frequent

2. **Optimal component score weights**
   - What we know: 5-6 components decided: Industry fit, Size fit, Tech fit, Need signals, Location fit, Growth signals
   - What's unclear: Default weights when not all data is available
   - Recommendation: Equal weights (1/N) as default, let AI adjust based on data availability and explain in reasoning

3. **Token usage monitoring**
   - What we know: Gemini API returns usage metadata with token counts
   - What's unclear: Best way to aggregate and display costs to users
   - Recommendation: Log token counts per analysis in database for monitoring, defer user-facing cost display

## Sources

### Primary (HIGH confidence)
- Official Gemini API migration guide: https://ai.google.dev/gemini-api/docs/migrate
- Existing codebase patterns: `src/lib/ai/prompts/icp-parser.ts`, `src/lib/db/schema.ts`
- shadcn/ui Collapsible: https://ui.shadcn.com/docs/components/collapsible
- Google AI structured output docs: https://ai.google.dev/gemini-api/docs/structured-output

### Secondary (MEDIUM confidence)
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing (Gemini 2.0 Flash is free tier for standard usage)
- Drizzle JSONB patterns: https://orm.drizzle.team/docs/column-types/pg

### Tertiary (LOW confidence)
- Lead scoring best practices: Various articles (patterns vary widely, use judgment)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture: HIGH - Extending proven patterns from codebase
- Pitfalls: HIGH - Based on project-identified risks + common AI integration issues

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - stable domain, Gemini API may update)
