import { getAnalysesForValidation, getDataExtractionValidations, computeValidationMetrics } from '@/lib/validation/actions'
import { ValidationTabs } from './_components/validation-tabs'

export default async function ValidationPage() {
  const [analysesForValidation, extractionValidations, metrics] = await Promise.all([
    getAnalysesForValidation(),
    getDataExtractionValidations(),
    computeValidationMetrics(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Validation</h1>
        <p className="text-muted-foreground mt-1">
          Validate AI-generated scores against expert human judgment for scientific reliability assessment.
        </p>
      </div>

      <ValidationTabs
        analyses={analysesForValidation}
        extractionValidations={extractionValidations}
        metrics={metrics}
      />
    </div>
  )
}
