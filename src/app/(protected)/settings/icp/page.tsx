import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { icpProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IcpWizard } from '@/components/onboarding/icp-wizard'
import type { FullIcpInput } from '@/lib/validations/icp'
import type { IcpProfile } from '@/lib/db/schema'

/**
 * Transform database ICP profile to form data format.
 * Handles the transformation from JSONB nested structure to flat form fields.
 */
function transformToFormData(icp: IcpProfile): Partial<FullIcpInput> {
  return {
    // Step 1: Company Info
    productDescription: icp.productDescription,
    industry: icp.industry,
    companySize: icp.companySize as FullIcpInput['companySize'],
    targetMarket: icp.targetMarket as FullIcpInput['targetMarket'],

    // Step 2: Target Criteria (from JSONB)
    idealCompanySizes: icp.targetCriteria.idealCompanySizes,
    targetIndustries: icp.targetCriteria.targetIndustries,
    targetLocations: icp.targetCriteria.targetLocations,
    techRequirements: icp.targetCriteria.techRequirements,
    budgetRange: icp.targetCriteria.budgetRange,

    // Step 3: Value Propositions (from JSONB)
    valuePropositions: icp.valuePropositions,

    // Step 4: Common Objections (from JSONB)
    commonObjections: icp.commonObjections,
  }
}

export default async function IcpSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing ICP for this user
  const [existingIcp] = await db
    .select()
    .from(icpProfiles)
    .where(eq(icpProfiles.userId, user.id))
    .limit(1)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ideal Customer Profile</h1>
        <p className="text-muted-foreground mt-2">
          Update your ICP to improve lead scoring accuracy.
        </p>
      </div>

      <IcpWizard
        mode="settings"
        initialData={existingIcp ? transformToFormData(existingIcp) : undefined}
      />
    </div>
  )
}
