import { z } from 'zod'

/**
 * Analysis Validation Schemas
 *
 * These schemas define the structure for AI-generated lead analysis results.
 * Used for validating AI output and typing database storage.
 */

// Individual component score (e.g., "Industry Fit", "Size Fit")
export const componentScoreSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe(
      'Component name (e.g., "Industry Fit", "Size Fit", "Tech Fit", "Need Signals", "Location Fit", "Growth Signals")'
    ),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('Score from 0-100 indicating fit for this component'),
  weight: z
    .number()
    .min(0)
    .max(1)
    .describe('Weight for weighted average calculation (0-1)'),
  reasoning: z
    .string()
    .min(1)
    .describe('AI explanation for why this score was given'),
})

// Pitch recommendation
export const pitchAngleSchema = z.object({
  headline: z
    .string()
    .min(5)
    .max(100)
    .describe('Bold hook headline, 5-10 words'),
  explanation: z
    .string()
    .min(20)
    .describe('2-3 sentences explaining the pitch angle'),
  whyItWorks: z
    .string()
    .min(10)
    .describe('Why this angle resonates with the target company'),
})

// Predicted objection with recommended response
export const predictedObjectionSchema = z.object({
  objection: z.string().min(5).describe('The likely pushback from the prospect'),
  likelihood: z
    .enum(['high', 'medium', 'low'])
    .describe('How likely this objection is to come up'),
  recommendedResponse: z
    .string()
    .min(10)
    .describe('How to handle this objection effectively'),
})

// AI commentary on the company
export const companyInsightsSchema = z.object({
  summary: z
    .string()
    .min(10)
    .describe(
      'Interpretive commentary on the company (e.g., "Fast-growing fintech with modern stack")'
    ),
  strengths: z
    .array(z.string())
    .min(1)
    .describe('Positive signals about this lead'),
  concerns: z.array(z.string()).describe('Potential issues or red flags'),
})

// Complete analysis output from AI
export const analysisResultSchema = z.object({
  leadScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall lead score from 0-100'),
  icpMatchPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('How well the company matches the ICP (0-100)'),
  componentScores: z
    .array(componentScoreSchema)
    .min(4)
    .max(6)
    .describe('Individual component scores that make up the lead score'),
  insights: companyInsightsSchema.describe('AI commentary on the company'),
  pitchAngles: z
    .array(pitchAngleSchema)
    .min(2)
    .max(3)
    .describe('Recommended pitch angles for this prospect'),
  objections: z
    .array(predictedObjectionSchema)
    .min(1)
    .max(4)
    .describe('Predicted objections with recommended responses'),
})

// Type exports
export type ComponentScore = z.infer<typeof componentScoreSchema>
export type PitchAngle = z.infer<typeof pitchAngleSchema>
export type PredictedObjection = z.infer<typeof predictedObjectionSchema>
export type CompanyInsights = z.infer<typeof companyInsightsSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>

/**
 * Get a human-readable label for a score
 * @param score - Score from 0-100
 * @returns "Strong Fit", "Moderate Fit", or "Weak Fit"
 */
export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Strong Fit'
  if (score >= 40) return 'Moderate Fit'
  return 'Weak Fit'
}
