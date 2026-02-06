'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { analyses, companies, icpProfiles, type Analysis } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { AnalysisResult } from '@/lib/analysis/schemas'

/**
 * Analysis Server Actions
 *
 * Server-side actions for creating and retrieving lead analyses.
 * All actions require authentication and verify ownership.
 */

/**
 * Create a new analysis record in the database
 *
 * @param companyId - ID of the company being analyzed
 * @param icpProfileId - ID of the user's ICP profile used for analysis
 * @param result - The AI-generated analysis result
 * @returns Object with success status and analysisId or error message
 */
export async function createAnalysis(
  companyId: string,
  icpProfileId: string,
  result: AnalysisResult
): Promise<{ success: true; analysisId: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify the company belongs to this user
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.userId, user.id)))

    if (!company) {
      return { success: false, error: 'Company not found or unauthorized' }
    }

    // Verify the ICP profile belongs to this user
    const [icp] = await db
      .select({ id: icpProfiles.id })
      .from(icpProfiles)
      .where(and(eq(icpProfiles.id, icpProfileId), eq(icpProfiles.userId, user.id)))

    if (!icp) {
      return { success: false, error: 'ICP profile not found or unauthorized' }
    }

    // Insert the analysis
    const [newAnalysis] = await db
      .insert(analyses)
      .values({
        userId: user.id,
        companyId,
        icpProfileId,
        leadScore: Math.round(result.leadScore),
        icpMatchPercentage: Math.round(result.icpMatchPercentage),
        componentScores: result.componentScores,
        insights: result.insights,
        pitchAngles: result.pitchAngles,
        objections: result.objections,
      })
      .returning({ id: analyses.id })

    return { success: true, analysisId: newAnalysis.id }
  } catch (error) {
    console.error('createAnalysis error:', error)
    return { success: false, error: 'Failed to save analysis' }
  }
}

/**
 * Retrieve an analysis by ID
 *
 * @param analysisId - The analysis ID to retrieve
 * @returns The analysis record or null if not found/unauthorized
 */
export async function getAnalysis(analysisId: string): Promise<Analysis | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get analysis, verify ownership
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(and(eq(analyses.id, analysisId), eq(analyses.userId, user.id)))

    return analysis || null
  } catch (error) {
    console.error('getAnalysis error:', error)
    return null
  }
}

/**
 * Get all analyses for a specific company
 *
 * @param companyId - The company ID to get analyses for
 * @returns Array of analysis records, ordered by creation date (newest first)
 */
export async function getAnalysesForCompany(companyId: string): Promise<Analysis[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Get all analyses for this company, verify ownership
    const results = await db
      .select()
      .from(analyses)
      .where(and(eq(analyses.companyId, companyId), eq(analyses.userId, user.id)))
      .orderBy(desc(analyses.createdAt))

    return results
  } catch (error) {
    console.error('getAnalysesForCompany error:', error)
    return []
  }
}

/**
 * Get the user's ICP profile
 *
 * @returns The user's ICP profile or null if not found
 */
export async function getUserIcpProfile() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const [icpProfile] = await db
      .select()
      .from(icpProfiles)
      .where(eq(icpProfiles.userId, user.id))

    return icpProfile || null
  } catch (error) {
    console.error('getUserIcpProfile error:', error)
    return null
  }
}
