'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import {
  analyses,
  companies,
  expertRatings,
  dataExtractionValidations,
  type ExpertRating,
  type DataExtractionValidation,
} from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import {
  createExpertRatingSchema,
  createExtractionValidationSchema,
  type CreateExpertRatingInput,
  type CreateExtractionValidationInput,
} from './schemas'
import {
  cohensKappa,
  weightedKappa,
  pearsonCorrelation,
  meanAbsoluteError,
  rootMeanSquareError,
  buildConfusionMatrix,
  precision,
  recall,
  f1Score,
  accuracy,
  macroF1,
  weightedF1,
  calculateExtractionMetrics,
  scoreToCategory,
  CATEGORIES,
  type Category,
  type KappaResult,
  type PearsonResult,
  type ConfusionMatrix,
  type ClassificationMetrics,
  type ExtractionFieldMetrics,
} from './statistics'

/**
 * Validation Server Actions
 *
 * Server-side actions for expert ratings, extraction validations,
 * and metric computation. All actions require authentication.
 */

// ============================================
// Expert Ratings
// ============================================

export async function createExpertRating(
  input: CreateExpertRatingInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createExpertRatingSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const data = parsed.data

    // Verify analysis belongs to user
    const [analysis] = await db
      .select({ id: analyses.id })
      .from(analyses)
      .where(and(eq(analyses.id, data.analysisId), eq(analyses.userId, user.id)))

    if (!analysis) {
      return { success: false, error: 'Analysis not found or unauthorized' }
    }

    // Upsert (insert or update on conflict)
    const [result] = await db
      .insert(expertRatings)
      .values({
        analysisId: data.analysisId,
        userId: user.id,
        expertName: data.expertName,
        expertRole: data.expertRole,
        leadScore: data.leadScore,
        icpMatchPercentage: data.icpMatchPercentage,
        category: data.category,
        componentScores: data.componentScores,
        blindRating: data.blindRating,
        notes: data.notes,
        ratingDurationSeconds: data.ratingDurationSeconds,
      })
      .onConflictDoUpdate({
        target: [expertRatings.analysisId, expertRatings.expertName],
        set: {
          expertRole: data.expertRole,
          leadScore: data.leadScore,
          icpMatchPercentage: data.icpMatchPercentage,
          category: data.category,
          componentScores: data.componentScores,
          blindRating: data.blindRating,
          notes: data.notes,
          ratingDurationSeconds: data.ratingDurationSeconds,
        },
      })
      .returning({ id: expertRatings.id })

    return { success: true, id: result.id }
  } catch (error) {
    console.error('createExpertRating error:', error)
    return { success: false, error: 'Failed to save expert rating' }
  }
}

export async function getExpertRatings(): Promise<ExpertRating[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    return await db
      .select()
      .from(expertRatings)
      .where(eq(expertRatings.userId, user.id))
      .orderBy(desc(expertRatings.createdAt))
  } catch (error) {
    console.error('getExpertRatings error:', error)
    return []
  }
}

// ============================================
// Data Extraction Validations
// ============================================

export async function createDataExtractionValidation(
  input: CreateExtractionValidationInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = createExtractionValidationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const data = parsed.data

    // Verify company belongs to user
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(and(eq(companies.id, data.companyId), eq(companies.userId, user.id)))

    if (!company) {
      return { success: false, error: 'Company not found or unauthorized' }
    }

    const [result] = await db
      .insert(dataExtractionValidations)
      .values({
        companyId: data.companyId,
        userId: user.id,
        expertName: data.expertName,
        fieldValidations: data.fieldValidations,
        overallAccuracy: data.overallAccuracy,
        notes: data.notes,
      })
      .onConflictDoUpdate({
        target: [dataExtractionValidations.companyId, dataExtractionValidations.expertName],
        set: {
          fieldValidations: data.fieldValidations,
          overallAccuracy: data.overallAccuracy,
          notes: data.notes,
        },
      })
      .returning({ id: dataExtractionValidations.id })

    return { success: true, id: result.id }
  } catch (error) {
    console.error('createDataExtractionValidation error:', error)
    return { success: false, error: 'Failed to save extraction validation' }
  }
}

export async function getDataExtractionValidations(): Promise<DataExtractionValidation[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    return await db
      .select()
      .from(dataExtractionValidations)
      .where(eq(dataExtractionValidations.userId, user.id))
      .orderBy(desc(dataExtractionValidations.createdAt))
  } catch (error) {
    console.error('getDataExtractionValidations error:', error)
    return []
  }
}

// ============================================
// Analyses for Validation
// ============================================

export interface AnalysisForValidation {
  id: string
  leadScore: number
  icpMatchPercentage: number
  componentScores: Array<{ name: string; score: number; weight: number; reasoning: string }>
  createdAt: Date
  company: {
    id: string
    name: string
    domain: string
    industry: string | null
    description: string | null
    employeeCount: string | null
    location: string | null
    techStack: string[] | null
  }
  expertRatings: ExpertRating[]
}

export async function getAnalysesForValidation(): Promise<AnalysisForValidation[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get all non-archived analyses with companies
    const analysisRows = await db
      .select({
        id: analyses.id,
        leadScore: analyses.leadScore,
        icpMatchPercentage: analyses.icpMatchPercentage,
        componentScores: analyses.componentScores,
        createdAt: analyses.createdAt,
        companyId: companies.id,
        companyName: companies.name,
        companyDomain: companies.domain,
        companyIndustry: companies.industry,
        companyDescription: companies.description,
        companyEmployeeCount: companies.employeeCount,
        companyLocation: companies.location,
        companyTechStack: companies.techStack,
      })
      .from(analyses)
      .innerJoin(companies, eq(analyses.companyId, companies.id))
      .where(and(eq(analyses.userId, user.id), eq(analyses.isArchived, false)))
      .orderBy(desc(analyses.createdAt))

    // Get all expert ratings for these analyses
    const allRatings = await db
      .select()
      .from(expertRatings)
      .where(eq(expertRatings.userId, user.id))

    const ratingsMap = new Map<string, ExpertRating[]>()
    for (const r of allRatings) {
      const existing = ratingsMap.get(r.analysisId) || []
      existing.push(r)
      ratingsMap.set(r.analysisId, existing)
    }

    return analysisRows.map(row => ({
      id: row.id,
      leadScore: row.leadScore,
      icpMatchPercentage: row.icpMatchPercentage,
      componentScores: row.componentScores as Array<{ name: string; score: number; weight: number; reasoning: string }>,
      createdAt: row.createdAt,
      company: {
        id: row.companyId,
        name: row.companyName,
        domain: row.companyDomain,
        industry: row.companyIndustry,
        description: row.companyDescription,
        employeeCount: row.companyEmployeeCount,
        location: row.companyLocation,
        techStack: row.companyTechStack,
      },
      expertRatings: ratingsMap.get(row.id) || [],
    }))
  } catch (error) {
    console.error('getAnalysesForValidation error:', error)
    return []
  }
}

// ============================================
// Validation Metrics Computation
// ============================================

export interface ValidationMetrics {
  sampleInfo: {
    totalAnalyses: number
    totalRatings: number
    uniqueExperts: string[]
    blindRatingCount: number
    ratedAnalyses: number
  }
  interRaterReliability: {
    cohensKappa: KappaResult
    weightedKappa: KappaResult
  } | null
  correlation: {
    leadScore: PearsonResult
    icpMatch: PearsonResult
  } | null
  errorMetrics: {
    leadScoreMAE: number
    leadScoreRMSE: number
    icpMatchMAE: number
    icpMatchRMSE: number
  } | null
  confusionMatrix: ConfusionMatrix | null
  classificationMetrics: {
    perCategory: Record<Category, ClassificationMetrics>
    accuracy: number
    macroF1: number
    weightedF1: number
  } | null
  componentAnalysis: Array<{
    name: string
    pearson: PearsonResult
    mae: number
  }> | null
  extractionMetrics: ExtractionFieldMetrics[] | null
}

export async function computeValidationMetrics(): Promise<ValidationMetrics> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emptyMetrics: ValidationMetrics = {
    sampleInfo: {
      totalAnalyses: 0,
      totalRatings: 0,
      uniqueExperts: [],
      blindRatingCount: 0,
      ratedAnalyses: 0,
    },
    interRaterReliability: null,
    correlation: null,
    errorMetrics: null,
    confusionMatrix: null,
    classificationMetrics: null,
    componentAnalysis: null,
    extractionMetrics: null,
  }

  if (!user) return emptyMetrics

  // Fetch all analyses and ratings
  const allAnalyses = await db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, user.id))

  const allRatings = await db
    .select()
    .from(expertRatings)
    .where(eq(expertRatings.userId, user.id))

  const allExtractionValidations = await db
    .select()
    .from(dataExtractionValidations)
    .where(eq(dataExtractionValidations.userId, user.id))

  // Build analysis map
  const analysisMap = new Map(allAnalyses.map(a => [a.id, a]))

  // Sample info
  const uniqueExperts = [...new Set(allRatings.map(r => r.expertName))]
  const ratedAnalysisIds = new Set(allRatings.map(r => r.analysisId))

  const sampleInfo = {
    totalAnalyses: allAnalyses.length,
    totalRatings: allRatings.length,
    uniqueExperts,
    blindRatingCount: allRatings.filter(r => r.blindRating).length,
    ratedAnalyses: ratedAnalysisIds.size,
  }

  if (allRatings.length === 0) {
    return { ...emptyMetrics, sampleInfo }
  }

  // Build paired arrays: AI scores vs expert scores
  // For analyses with multiple expert ratings, pair each rating with the AI score
  const aiLeadScores: number[] = []
  const expertLeadScores: number[] = []
  const aiIcpScores: number[] = []
  const expertIcpScores: number[] = []
  const aiCategories: Category[] = []
  const expertCategories: Category[] = []

  for (const rating of allRatings) {
    const analysis = analysisMap.get(rating.analysisId)
    if (!analysis) continue

    aiLeadScores.push(analysis.leadScore)
    expertLeadScores.push(rating.leadScore)
    aiIcpScores.push(analysis.icpMatchPercentage)
    expertIcpScores.push(rating.icpMatchPercentage)
    aiCategories.push(scoreToCategory(analysis.leadScore))
    expertCategories.push(rating.category as Category)
  }

  // Inter-rater reliability
  const interRaterReliability = aiCategories.length >= 2
    ? {
        cohensKappa: cohensKappa(aiCategories, expertCategories),
        weightedKappa: weightedKappa(aiCategories, expertCategories),
      }
    : null

  // Correlation
  const correlation = aiLeadScores.length >= 3
    ? {
        leadScore: pearsonCorrelation(aiLeadScores, expertLeadScores),
        icpMatch: pearsonCorrelation(aiIcpScores, expertIcpScores),
      }
    : null

  // Error metrics
  const errorMetrics = aiLeadScores.length >= 1
    ? {
        leadScoreMAE: meanAbsoluteError(aiLeadScores, expertLeadScores),
        leadScoreRMSE: rootMeanSquareError(aiLeadScores, expertLeadScores),
        icpMatchMAE: meanAbsoluteError(aiIcpScores, expertIcpScores),
        icpMatchRMSE: rootMeanSquareError(aiIcpScores, expertIcpScores),
      }
    : null

  // Confusion matrix
  const cm = aiCategories.length >= 1
    ? buildConfusionMatrix(aiCategories, expertCategories)
    : null

  // Classification metrics
  const classMetrics = cm
    ? {
        perCategory: Object.fromEntries(
          CATEGORIES.map(cat => {
            const p = precision(cm, cat)
            const r = recall(cm, cat)
            return [cat, { precision: p, recall: r, f1: f1Score(p, r), support: 0 }]
          })
        ) as Record<Category, ClassificationMetrics>,
        accuracy: accuracy(cm),
        macroF1: macroF1(cm),
        weightedF1: weightedF1(cm),
      }
    : null

  // Compute support for each category
  if (classMetrics && cm) {
    for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
      const cat = CATEGORIES[catIdx]
      let support = 0
      for (let i = 0; i < CATEGORIES.length; i++) {
        support += cm.matrix[i][catIdx]
      }
      classMetrics.perCategory[cat].support = support
    }
  }

  // Component analysis
  let componentAnalysis: ValidationMetrics['componentAnalysis'] = null
  if (allRatings.length >= 3) {
    const componentNames = new Set<string>()
    for (const rating of allRatings) {
      const scores = rating.componentScores as Array<{ name: string; score: number }>
      for (const s of scores) componentNames.add(s.name)
    }

    componentAnalysis = []
    for (const name of componentNames) {
      const aiScores: number[] = []
      const expScores: number[] = []

      for (const rating of allRatings) {
        const analysis = analysisMap.get(rating.analysisId)
        if (!analysis) continue

        const aiComponent = (analysis.componentScores as Array<{ name: string; score: number }>)
          .find(c => c.name === name)
        const expComponent = (rating.componentScores as Array<{ name: string; score: number }>)
          .find(c => c.name === name)

        if (aiComponent && expComponent) {
          aiScores.push(aiComponent.score)
          expScores.push(expComponent.score)
        }
      }

      if (aiScores.length >= 3) {
        componentAnalysis.push({
          name,
          pearson: pearsonCorrelation(aiScores, expScores),
          mae: meanAbsoluteError(aiScores, expScores),
        })
      }
    }
  }

  // Extraction metrics
  const extractionMetrics = allExtractionValidations.length > 0
    ? calculateExtractionMetrics(
        allExtractionValidations.map(v => ({
          fieldValidations: v.fieldValidations as Record<string, { status: string }>,
        }))
      )
    : null

  return {
    sampleInfo,
    interRaterReliability,
    correlation,
    errorMetrics,
    confusionMatrix: cm,
    classificationMetrics: classMetrics,
    componentAnalysis,
    extractionMetrics,
  }
}
