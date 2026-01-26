import { NextRequest, NextResponse } from 'next/server'
import { extractCompanyData } from '@/lib/extraction/fallback-chain'
import { createClient } from '@/lib/supabase/server'

// Vercel Fluid Compute config - allow up to 60s for extraction
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * POST /api/extract
 *
 * Extract company data from a URL using the fallback chain.
 * Requires authentication.
 *
 * Request body:
 * - url: string (required) - Company website URL
 *
 * Response:
 * - ExtractionResult with data, sources, confidence, needsManualInput, missingFields
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid http or https URL.' },
        { status: 400 }
      )
    }

    // Run extraction
    const result = await extractCompanyData(url)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extraction error:', error)

    // Even on error, return something actionable
    return NextResponse.json(
      {
        data: {},
        sources: [],
        confidence: 'low',
        needsManualInput: true,
        missingFields: ['name', 'industry', 'description'],
        error: 'Extraction failed. Please enter company details manually.',
      },
      { status: 200 } // Return 200 since we're providing fallback
    )
  }
}

/**
 * Validate URL format - must be http or https
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
