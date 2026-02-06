import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { companies, icpProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { analyzeLeadWithAI } from '@/lib/ai/prompts/lead-analyzer'
import { createAnalysis } from '@/lib/analysis/actions'
import type { PartialCompanyData } from '@/lib/validations/company'

// Allow up to 60s for AI analysis
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * POST /api/analyze
 *
 * Run AI analysis on company data against user's ICP.
 * Creates company record if not exists, runs AI analysis, saves result.
 *
 * Request body:
 * - companyData: PartialCompanyData - Extracted company data
 * - companyId?: string - Optional existing company ID
 * - url: string - Original URL (for saving company)
 *
 * Response on success (200):
 * - analysisId: string - ID of saved analysis
 * - analysis: AnalysisResult - The AI-generated analysis
 *
 * Response on error:
 * - 401: Not authenticated
 * - 400: No ICP profile (user needs to complete onboarding)
 * - 500: AI analysis failed
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Parse request body
    const body = await request.json()
    const { companyData, companyId, url } = body as {
      companyData: PartialCompanyData
      companyId?: string
      url: string
    }

    if (!companyData || !url) {
      return NextResponse.json(
        { error: 'companyData and url are required' },
        { status: 400 }
      )
    }

    // Step 3: Get user's ICP profile (required for analysis)
    const [icpProfile] = await db
      .select()
      .from(icpProfiles)
      .where(eq(icpProfiles.userId, user.id))

    if (!icpProfile) {
      return NextResponse.json(
        {
          error: 'ICP profile not found',
          message:
            'Please complete onboarding to set up your ICP before analyzing leads.',
        },
        { status: 400 }
      )
    }

    // Step 4: Save company if not already saved
    let resolvedCompanyId = companyId

    if (!resolvedCompanyId) {
      // Extract domain from URL
      let domain: string
      try {
        const urlObj = new URL(url)
        domain = urlObj.hostname.replace(/^www\./, '')
      } catch {
        domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      }

      // Create company record
      const [newCompany] = await db
        .insert(companies)
        .values({
          userId: user.id,
          domain,
          url,
          name: companyData.name || domain,
          description: companyData.description,
          industry: companyData.industry,
          employeeCount: companyData.employeeCount,
          location: companyData.location,
          foundedYear: companyData.foundedYear,
          techStack: companyData.techStack || [],
          emails: companyData.emails || [],
          phones: companyData.phones || [],
          linkedIn: companyData.linkedIn,
          twitter: companyData.twitter,
          logoUrl: companyData.logoUrl,
          extractionSources: ['website'],
          extractionConfidence: 'medium',
        })
        .returning({ id: companies.id })

      resolvedCompanyId = newCompany.id
    }

    // Step 5: Run AI analysis
    const analysisResult = await analyzeLeadWithAI(companyData, icpProfile)

    if (!analysisResult) {
      return NextResponse.json(
        {
          error: 'AI analysis failed',
          message: 'The AI was unable to generate an analysis. Please try again.',
        },
        { status: 500 }
      )
    }

    // Step 6: Save analysis to database
    const saveResult = await createAnalysis(
      resolvedCompanyId,
      icpProfile.id,
      analysisResult
    )

    if (!saveResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to save analysis',
          message: saveResult.error,
        },
        { status: 500 }
      )
    }

    // Step 7: Return analysis result
    return NextResponse.json({
      analysisId: saveResult.analysisId,
      companyId: resolvedCompanyId,
      analysis: analysisResult,
    })
  } catch (error) {
    console.error('POST /api/analyze error:', error)
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
