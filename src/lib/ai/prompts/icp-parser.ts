import { geminiFlash } from '@/lib/ai'
import {
  companyInfoSchema,
  targetCriteriaSchema,
  valuePropsSchema,
  objectionsSchema,
  type CompanyInfoInput,
  type TargetCriteriaInput,
  type ValuePropsInput,
  type ObjectionsInput,
} from '@/lib/validations/icp'

// System prompts for each ICP section
const COMPANY_INFO_SYSTEM = `You are an expert business analyst who extracts structured company information from natural language descriptions.

Your task is to identify:
- What the company sells or provides (their main product or service)
- What industry they operate in
- Their company size category: solo (1 person), small (2-50), medium (51-200), large (201-1000), enterprise (1000+)
- Their target market: B2B (business-to-business), B2C (business-to-consumer), or both

Be helpful and make reasonable inferences when information is implicit. If size or market type isn't stated, infer from context clues.

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "productDescription": "string describing what they sell",
  "industry": "string for industry",
  "companySize": "solo" | "small" | "medium" | "large" | "enterprise",
  "targetMarket": "b2b" | "b2c" | "both"
}`

const TARGET_CRITERIA_SYSTEM = `You are an expert B2B sales analyst who helps companies define their Ideal Customer Profile (ICP).

Given a natural language description of a company's ideal customer, extract structured information about:
- Company sizes of ideal customers (e.g., small, medium, large, enterprise)
- Industries that ideal customers operate in (e.g., SaaS, Healthcare, Finance, Manufacturing)
- Geographic regions or countries where ideal customers are located
- Technologies or tools that ideal customers typically use (e.g., Salesforce, AWS, Shopify)
- Expected budget range if mentioned (in USD)

Be helpful and make reasonable inferences. If the user mentions "tech companies", include common tech industries. If they mention "enterprise", that's a company size hint.

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "idealCompanySizes": ["array", "of", "sizes"],
  "targetIndustries": ["array", "of", "industries"],
  "targetLocations": ["array", "of", "locations"],
  "techRequirements": ["array", "of", "technologies"],
  "budgetRange": { "min": number or null, "max": number or null } or null
}`

const VALUE_PROPS_SYSTEM = `You are an expert marketing strategist who extracts value propositions from natural language descriptions.

Your task is to identify clear value propositions with:
- A concise headline (5-10 words summarizing the benefit)
- A detailed description explaining the value provided
- Differentiators that make this unique compared to competitors

Look for benefits, outcomes, and unique selling points. Transform features into benefits (e.g., "AI-powered" becomes "Save hours of manual work").

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "valuePropositions": [
    {
      "headline": "concise benefit headline",
      "description": "detailed description of value",
      "differentiators": ["what", "makes", "it", "unique"]
    }
  ]
}`

const OBJECTIONS_SYSTEM = `You are an experienced sales professional who understands common objections in B2B sales.

Given a description of challenges or pushback a company faces, extract:
- The objection or concern (what prospects actually say or think)
- A suggested response or counter-argument (if provided or if you can infer a good response)

Common objection categories include: price concerns, timing issues, competitor comparisons, status quo preference, authority/decision-making, and trust/credibility concerns.

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "commonObjections": [
    {
      "objection": "the objection text",
      "suggestedResponse": "optional response text or null"
    }
  ]
}`

/**
 * Helper to extract JSON from Gemini response
 */
function extractJson(text: string): unknown {
  // Try to find JSON in the response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                    text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0]
    return JSON.parse(jsonStr.trim())
  }

  // Try parsing the whole response as JSON
  return JSON.parse(text.trim())
}

/**
 * Parse company info from natural language input
 */
export async function parseCompanyInfo(
  input: string
): Promise<CompanyInfoInput | null> {
  try {
    const result = await geminiFlash.generateContent([
      { text: COMPANY_INFO_SYSTEM },
      { text: `Extract company information from this description:\n\n"${input}"` }
    ])

    const response = result.response.text()
    const parsed = extractJson(response)

    // Validate with zod schema
    const validated = companyInfoSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
    }

    console.error('Validation failed:', validated.error)
    return null
  } catch (error) {
    console.error('Failed to parse company info:', error)
    return null
  }
}

/**
 * Parse target criteria from natural language input
 */
export async function parseTargetCriteria(
  input: string
): Promise<TargetCriteriaInput | null> {
  try {
    const result = await geminiFlash.generateContent([
      { text: TARGET_CRITERIA_SYSTEM },
      { text: `Extract ideal customer criteria from this description:\n\n"${input}"` }
    ])

    const response = result.response.text()
    const parsed = extractJson(response)

    // Validate with zod schema
    const validated = targetCriteriaSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
    }

    console.error('Validation failed:', validated.error)
    return null
  } catch (error) {
    console.error('Failed to parse target criteria:', error)
    return null
  }
}

/**
 * Parse value propositions from natural language input
 */
export async function parseValueProps(
  input: string
): Promise<ValuePropsInput | null> {
  try {
    const result = await geminiFlash.generateContent([
      { text: VALUE_PROPS_SYSTEM },
      { text: `Extract value propositions from this description:\n\n"${input}"` }
    ])

    const response = result.response.text()
    const parsed = extractJson(response)

    // Validate with zod schema
    const validated = valuePropsSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
    }

    console.error('Validation failed:', validated.error)
    return null
  } catch (error) {
    console.error('Failed to parse value props:', error)
    return null
  }
}

/**
 * Parse common objections from natural language input
 */
export async function parseObjections(
  input: string
): Promise<ObjectionsInput | null> {
  try {
    const result = await geminiFlash.generateContent([
      { text: OBJECTIONS_SYSTEM },
      { text: `Extract common objections from this description:\n\n"${input}"` }
    ])

    const response = result.response.text()
    const parsed = extractJson(response)

    // Validate with zod schema
    const validated = objectionsSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
    }

    console.error('Validation failed:', validated.error)
    return null
  } catch (error) {
    console.error('Failed to parse objections:', error)
    return null
  }
}
