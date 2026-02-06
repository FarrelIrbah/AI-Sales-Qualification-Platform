import { geminiFlash } from '@/lib/ai'
import { analysisResultSchema, type AnalysisResult } from '@/lib/analysis/schemas'
import type { PartialCompanyData } from '@/lib/validations/company'
import type { IcpProfile } from '@/lib/db/schema'

/**
 * Lead Analyzer AI Module
 *
 * Analyzes company data against user's ICP to generate:
 * - Lead score (0-100) with component breakdown
 * - Company insights (summary, strengths, concerns)
 * - Personalized pitch angles
 * - Predicted objections with responses
 */

const ANALYSIS_SYSTEM_PROMPT = `You are an expert B2B sales analyst who evaluates lead quality and generates sales intelligence.

Given:
- Target company data (extracted from their website)
- User's ICP profile (their ideal customer criteria, value props, and common objections)

Generate a comprehensive lead analysis including:

1. LEAD SCORE (0-100): Overall qualification score
   - 70-100 = Strong Fit (green)
   - 40-69 = Moderate Fit (yellow)
   - 0-39 = Weak Fit (red)

2. ICP MATCH PERCENTAGE (0-100): How closely company matches ideal criteria

3. COMPONENT SCORES: Score each dimension 0-100 with reasoning:
   - Industry Fit: How well their industry matches target industries
   - Size Fit: How well their company size matches ideal sizes
   - Tech Fit: Overlap between their tech stack and required technologies
   - Need Signals: Indicators they need what user sells
   - Location Fit: Geographic alignment with target locations
   - Growth Signals: Signs of growth/budget (hiring, funding, expansion)

4. COMPANY INSIGHTS:
   - summary: 1-2 sentence interpretive commentary
   - strengths: 2-4 positive signals for this lead
   - concerns: 1-3 potential issues or gaps

5. PITCH ANGLES (2-3 distinct approaches):
   Each with headline hook + explanation + why it works for THIS company

6. PREDICTED OBJECTIONS (1-4) with recommended responses:
   Based on company profile vs user's known objections

CRITICAL RULES:
- Only reference information provided in company data - do NOT invent details
- If data is sparse, acknowledge uncertainty and provide best estimates
- Scores must be integers 0-100
- Each component score MUST include reasoning
- Be professional and direct - like a sales coach
- Weights for component scores should sum to approximately 1.0

Respond ONLY with valid JSON matching this exact structure:
{
  "leadScore": number,
  "icpMatchPercentage": number,
  "componentScores": [
    { "name": "Industry Fit", "score": number, "weight": 0.2, "reasoning": "string" },
    { "name": "Size Fit", "score": number, "weight": 0.15, "reasoning": "string" },
    { "name": "Tech Fit", "score": number, "weight": 0.2, "reasoning": "string" },
    { "name": "Need Signals", "score": number, "weight": 0.2, "reasoning": "string" },
    { "name": "Location Fit", "score": number, "weight": 0.1, "reasoning": "string" },
    { "name": "Growth Signals", "score": number, "weight": 0.15, "reasoning": "string" }
  ],
  "insights": {
    "summary": "string",
    "strengths": ["string"],
    "concerns": ["string"]
  },
  "pitchAngles": [
    { "headline": "string", "explanation": "string", "whyItWorks": "string" }
  ],
  "objections": [
    { "objection": "string", "likelihood": "high"|"medium"|"low", "recommendedResponse": "string" }
  ]
}`

/**
 * Helper to extract JSON from Gemini response
 * Handles markdown code blocks and plain JSON
 */
function extractJson(text: string): unknown {
  // Try to find JSON in the response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0]
    return JSON.parse(jsonStr.trim())
  }

  // Try parsing the whole response as JSON
  return JSON.parse(text.trim())
}

/**
 * Format company data for the AI prompt
 */
function formatCompanyData(data: PartialCompanyData): string {
  const lines: string[] = []

  if (data.name) lines.push(`Company Name: ${data.name}`)
  if (data.domain) lines.push(`Website: ${data.domain}`)
  if (data.description) lines.push(`Description: ${data.description}`)
  if (data.industry) lines.push(`Industry: ${data.industry}`)
  if (data.employeeCount) lines.push(`Company Size: ${data.employeeCount} employees`)
  if (data.location) lines.push(`Location: ${data.location}`)
  if (data.foundedYear) lines.push(`Founded: ${data.foundedYear}`)
  if (data.techStack && data.techStack.length > 0) {
    lines.push(`Tech Stack: ${data.techStack.join(', ')}`)
  }

  return lines.join('\n')
}

/**
 * Format ICP profile for the AI prompt
 */
function formatIcpProfile(icp: IcpProfile): string {
  const lines: string[] = []

  // Company info
  lines.push('=== YOUR COMPANY ===')
  lines.push(`Product/Service: ${icp.productDescription}`)
  lines.push(`Industry: ${icp.industry}`)
  lines.push(`Company Size: ${icp.companySize}`)
  lines.push(`Target Market: ${icp.targetMarket}`)

  // Target criteria
  lines.push('\n=== IDEAL CUSTOMER CRITERIA ===')
  const criteria = icp.targetCriteria
  if (criteria.idealCompanySizes.length > 0) {
    lines.push(`Ideal Company Sizes: ${criteria.idealCompanySizes.join(', ')}`)
  }
  if (criteria.targetIndustries.length > 0) {
    lines.push(`Target Industries: ${criteria.targetIndustries.join(', ')}`)
  }
  if (criteria.targetLocations.length > 0) {
    lines.push(`Target Locations: ${criteria.targetLocations.join(', ')}`)
  }
  if (criteria.techRequirements.length > 0) {
    lines.push(`Tech Requirements: ${criteria.techRequirements.join(', ')}`)
  }
  if (criteria.budgetRange) {
    const budget = criteria.budgetRange
    if (budget.min || budget.max) {
      const range = `$${budget.min || 0} - $${budget.max || 'unlimited'}`
      lines.push(`Budget Range: ${range}`)
    }
  }

  // Value propositions
  if (icp.valuePropositions.length > 0) {
    lines.push('\n=== VALUE PROPOSITIONS ===')
    icp.valuePropositions.forEach((vp, i) => {
      lines.push(`${i + 1}. ${vp.headline}`)
      lines.push(`   ${vp.description}`)
      if (vp.differentiators.length > 0) {
        lines.push(`   Differentiators: ${vp.differentiators.join(', ')}`)
      }
    })
  }

  // Common objections
  if (icp.commonObjections.length > 0) {
    lines.push('\n=== COMMON OBJECTIONS YOU FACE ===')
    icp.commonObjections.forEach((obj, i) => {
      lines.push(`${i + 1}. "${obj.objection}"`)
      if (obj.suggestedResponse) {
        lines.push(`   Suggested Response: ${obj.suggestedResponse}`)
      }
    })
  }

  return lines.join('\n')
}

/**
 * Analyze a lead against user's ICP using Gemini AI
 *
 * @param companyData - Extracted company data (partial is ok)
 * @param icpProfile - User's ICP profile from database
 * @returns AnalysisResult or null if AI fails
 */
export async function analyzeLeadWithAI(
  companyData: PartialCompanyData,
  icpProfile: IcpProfile
): Promise<AnalysisResult | null> {
  try {
    const companyContext = formatCompanyData(companyData)
    const icpContext = formatIcpProfile(icpProfile)

    const userPrompt = `Analyze this company as a potential lead:

=== TARGET COMPANY DATA ===
${companyContext}

=== USER'S ICP PROFILE ===
${icpContext}

Generate a comprehensive lead analysis with scores, insights, pitch angles, and predicted objections.`

    const result = await geminiFlash.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 2048, // Prevent cost explosion
        temperature: 0.7, // Balance creativity and consistency
      },
    })

    const response = result.response.text()
    const parsed = extractJson(response)

    // Validate with Zod schema
    const validated = analysisResultSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
    }

    console.error('Analysis validation failed:', validated.error.issues)
    return null
  } catch (error) {
    console.error('Failed to analyze lead:', error)
    return null
  }
}
