'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { analyses, companies, type Analysis, type Company } from '@/lib/db/schema'
import { eq, and, gte, lte, desc, asc, count, sql } from 'drizzle-orm'

/**
 * Dashboard Query Functions
 *
 * Server-side query functions for the dashboard.
 * All queries require authentication and filter by user ownership.
 */

export interface DashboardFilters {
  scoreMin?: number
  scoreMax?: number
  icpMatchMin?: number
  icpMatchMax?: number
  industry?: string
  dateFrom?: string
  dateTo?: string
  showArchived?: boolean
  sortBy?: 'score' | 'icpMatch' | 'date' | 'name'
  sortDir?: 'asc' | 'desc'
}

export interface DashboardLead {
  analysis: Analysis
  company: Company
}

/**
 * Get dashboard leads with filtering and sorting
 *
 * @param filters - Filter and sort options
 * @returns Array of analysis+company pairs
 */
export async function getDashboardLeads(
  filters: DashboardFilters = {}
): Promise<DashboardLead[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Build WHERE conditions
    const conditions = [eq(analyses.userId, user.id)]

    // Archived filter (default: hide archived)
    if (!filters.showArchived) {
      conditions.push(eq(analyses.isArchived, false))
    }

    // Score range filters
    if (filters.scoreMin !== undefined) {
      conditions.push(gte(analyses.leadScore, filters.scoreMin))
    }
    if (filters.scoreMax !== undefined) {
      conditions.push(lte(analyses.leadScore, filters.scoreMax))
    }

    // ICP match range filters
    if (filters.icpMatchMin !== undefined) {
      conditions.push(gte(analyses.icpMatchPercentage, filters.icpMatchMin))
    }
    if (filters.icpMatchMax !== undefined) {
      conditions.push(lte(analyses.icpMatchPercentage, filters.icpMatchMax))
    }

    // Industry filter (exact match)
    if (filters.industry) {
      conditions.push(eq(companies.industry, filters.industry))
    }

    // Date range filters
    if (filters.dateFrom) {
      conditions.push(gte(analyses.createdAt, new Date(filters.dateFrom)))
    }
    if (filters.dateTo) {
      conditions.push(lte(analyses.createdAt, new Date(filters.dateTo)))
    }

    // Build sort order
    const sortColumn = (() => {
      switch (filters.sortBy) {
        case 'score':
          return analyses.leadScore
        case 'icpMatch':
          return analyses.icpMatchPercentage
        case 'date':
          return analyses.createdAt
        case 'name':
          return companies.name
        default:
          return analyses.leadScore
      }
    })()

    const sortDirection = filters.sortDir === 'asc' ? asc : desc
    const primarySort = sortDirection(sortColumn)

    // Default tiebreaker: most recent first
    const secondarySort = desc(analyses.createdAt)

    // Execute query
    const results = await db
      .select({
        analysis: analyses,
        company: companies,
      })
      .from(analyses)
      .innerJoin(companies, eq(analyses.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(primarySort, secondarySort)

    return results
  } catch (error) {
    console.error('getDashboardLeads error:', error)
    return []
  }
}

/**
 * Get count of leads matching filters
 *
 * @param filters - Filter options (same as getDashboardLeads)
 * @returns Count of matching leads
 */
export async function getDashboardLeadCount(
  filters: DashboardFilters = {}
): Promise<number> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return 0
    }

    // Build WHERE conditions (same logic as getDashboardLeads)
    const conditions = [eq(analyses.userId, user.id)]

    if (!filters.showArchived) {
      conditions.push(eq(analyses.isArchived, false))
    }

    if (filters.scoreMin !== undefined) {
      conditions.push(gte(analyses.leadScore, filters.scoreMin))
    }
    if (filters.scoreMax !== undefined) {
      conditions.push(lte(analyses.leadScore, filters.scoreMax))
    }

    if (filters.icpMatchMin !== undefined) {
      conditions.push(gte(analyses.icpMatchPercentage, filters.icpMatchMin))
    }
    if (filters.icpMatchMax !== undefined) {
      conditions.push(lte(analyses.icpMatchPercentage, filters.icpMatchMax))
    }

    if (filters.industry) {
      conditions.push(eq(companies.industry, filters.industry))
    }

    if (filters.dateFrom) {
      conditions.push(gte(analyses.createdAt, new Date(filters.dateFrom)))
    }
    if (filters.dateTo) {
      conditions.push(lte(analyses.createdAt, new Date(filters.dateTo)))
    }

    // Execute count query
    const [result] = await db
      .select({ count: count() })
      .from(analyses)
      .innerJoin(companies, eq(analyses.companyId, companies.id))
      .where(and(...conditions))

    return result?.count ?? 0
  } catch (error) {
    console.error('getDashboardLeadCount error:', error)
    return 0
  }
}

/**
 * Get distinct industries for filter dropdown
 *
 * @returns Sorted array of industry names
 */
export async function getIndustryOptions(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Get distinct industries from companies that have analyses
    const results = await db
      .selectDistinct({ industry: companies.industry })
      .from(companies)
      .innerJoin(analyses, eq(analyses.companyId, companies.id))
      .where(eq(analyses.userId, user.id))

    // Filter out nulls and sort alphabetically
    const industries = results
      .map((r) => r.industry)
      .filter((industry): industry is string => industry !== null && industry !== '')
      .sort()

    return industries
  } catch (error) {
    console.error('getIndustryOptions error:', error)
    return []
  }
}

/**
 * Archive a lead (hide from dashboard)
 *
 * @param analysisId - ID of the analysis to archive
 * @returns Success status
 */
export async function archiveLead(
  analysisId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update analysis, verify ownership
    const result = await db
      .update(analyses)
      .set({ isArchived: true })
      .where(and(eq(analyses.id, analysisId), eq(analyses.userId, user.id)))
      .returning({ id: analyses.id })

    if (result.length === 0) {
      return { success: false, error: 'Analysis not found or unauthorized' }
    }

    return { success: true }
  } catch (error) {
    console.error('archiveLead error:', error)
    return { success: false, error: 'Failed to archive lead' }
  }
}

/**
 * Unarchive a lead (restore to dashboard)
 *
 * @param analysisId - ID of the analysis to unarchive
 * @returns Success status
 */
export async function unarchiveLead(
  analysisId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update analysis, verify ownership
    const result = await db
      .update(analyses)
      .set({ isArchived: false })
      .where(and(eq(analyses.id, analysisId), eq(analyses.userId, user.id)))
      .returning({ id: analyses.id })

    if (result.length === 0) {
      return { success: false, error: 'Analysis not found or unauthorized' }
    }

    return { success: true }
  } catch (error) {
    console.error('unarchiveLead error:', error)
    return { success: false, error: 'Failed to unarchive lead' }
  }
}
