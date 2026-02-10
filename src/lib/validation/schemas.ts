import { z } from 'zod'

/**
 * Validation Schemas
 *
 * Zod schemas for expert rating and data extraction validation input.
 */

// Expert component score input
export const expertComponentScoreSchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(100),
  reasoning: z.string().min(1),
})

// Expert rating input
export const createExpertRatingSchema = z.object({
  analysisId: z.string().uuid(),
  expertName: z.string().min(1, 'Expert name is required'),
  expertRole: z.string().optional(),
  leadScore: z.number().min(0).max(100),
  icpMatchPercentage: z.number().min(0).max(100),
  category: z.enum(['hot', 'warm', 'cold']),
  componentScores: z.array(expertComponentScoreSchema).min(1),
  blindRating: z.boolean().default(false),
  notes: z.string().optional(),
  ratingDurationSeconds: z.number().int().positive().optional(),
})

export type CreateExpertRatingInput = z.infer<typeof createExpertRatingSchema>

// Field validation input
export const fieldValidationSchema = z.object({
  status: z.enum(['correct', 'incorrect', 'partial']),
  correctedValue: z.string().optional(),
  notes: z.string().optional(),
})

// Data extraction validation input
export const createExtractionValidationSchema = z.object({
  companyId: z.string().uuid(),
  expertName: z.string().min(1, 'Expert name is required'),
  fieldValidations: z.record(z.string(), fieldValidationSchema),
  overallAccuracy: z.enum(['high', 'medium', 'low']).optional(),
  notes: z.string().optional(),
})

export type CreateExtractionValidationInput = z.infer<typeof createExtractionValidationSchema>
