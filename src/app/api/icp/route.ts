import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { icpProfiles, profiles } from '@/lib/db/schema'
import { fullIcpSchema } from '@/lib/validations/icp'
import { eq } from 'drizzle-orm'

/**
 * GET /api/icp
 * Returns the current user's ICP profile, or null if none exists
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [icp] = await db
      .select()
      .from(icpProfiles)
      .where(eq(icpProfiles.userId, user.id))
      .limit(1)

    return NextResponse.json({ data: icp || null })
  } catch (error) {
    console.error('GET /api/icp error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ICP profile' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/icp
 * Creates or updates the current user's ICP profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const parsed = fullIcpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      productDescription,
      industry,
      companySize,
      targetMarket,
      idealCompanySizes,
      targetIndustries,
      targetLocations,
      techRequirements,
      budgetRange,
      valuePropositions,
      commonObjections,
    } = parsed.data

    // Check if ICP already exists for this user
    const [existingIcp] = await db
      .select({ id: icpProfiles.id })
      .from(icpProfiles)
      .where(eq(icpProfiles.userId, user.id))
      .limit(1)

    const targetCriteria = {
      idealCompanySizes,
      targetIndustries,
      targetLocations,
      techRequirements,
      budgetRange,
    }

    let icp

    if (existingIcp) {
      // Update existing ICP
      const [updated] = await db
        .update(icpProfiles)
        .set({
          productDescription,
          industry,
          companySize,
          targetMarket,
          targetCriteria,
          valuePropositions,
          commonObjections,
          updatedAt: new Date(),
        })
        .where(eq(icpProfiles.id, existingIcp.id))
        .returning()

      icp = updated
    } else {
      // Create new ICP
      const [created] = await db
        .insert(icpProfiles)
        .values({
          userId: user.id,
          productDescription,
          industry,
          companySize,
          targetMarket,
          targetCriteria,
          valuePropositions,
          commonObjections,
        })
        .returning()

      icp = created
    }

    // Update onboarding status
    await db
      .update(profiles)
      .set({
        hasCompletedOnboarding: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id))

    return NextResponse.json({ data: icp })
  } catch (error) {
    console.error('POST /api/icp error:', error)
    return NextResponse.json(
      { error: 'Failed to save ICP profile' },
      { status: 500 }
    )
  }
}
