"use client"

import * as React from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { fullIcpSchema, type FullIcpInput, type FullIcpOutput } from "@/lib/validations/icp"
import { StepIndicator } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Step components will be imported once created
// import { CompanyInfoStep } from "./steps/company-info-step"
// import { TargetCriteriaStep } from "./steps/target-criteria-step"
// import { ValuePropsStep } from "./steps/value-props-step"
// import { ObjectionsStep } from "./steps/objections-step"

const STEP_LABELS = ["Your Company", "Target Customers", "Value Props", "Objections"]
const TOTAL_STEPS = 4

// Fields to validate for each step
const STEP_FIELDS: Record<number, (keyof FullIcpInput)[]> = {
  1: ["productDescription", "industry", "companySize", "targetMarket"],
  2: ["idealCompanySizes", "targetIndustries", "targetLocations", "techRequirements", "budgetRange"],
  3: ["valuePropositions"],
  4: ["commonObjections"],
}

interface IcpWizardProps {
  onSubmit?: (data: FullIcpOutput) => Promise<void>
  defaultValues?: Partial<FullIcpInput>
}

export function IcpWizard({ onSubmit, defaultValues }: IcpWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FullIcpInput>({
    resolver: zodResolver(fullIcpSchema),
    defaultValues: {
      // Step 1: Company Info
      productDescription: "",
      industry: "",
      companySize: undefined,
      targetMarket: undefined,
      // Step 2: Target Criteria
      idealCompanySizes: [],
      targetIndustries: [],
      targetLocations: [],
      techRequirements: [],
      budgetRange: undefined,
      // Step 3: Value Propositions
      valuePropositions: [],
      // Step 4: Common Objections
      commonObjections: [],
      ...defaultValues,
    },
    mode: "onChange",
  })

  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = STEP_FIELDS[currentStep]
    if (!fields) return true

    const result = await form.trigger(fields)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleFormSubmit = async (data: FullIcpInput) => {
    if (!onSubmit) return

    setIsSubmitting(true)
    try {
      // Zod applies defaults during validation, so data is FullIcpOutput at runtime
      await onSubmit(data as unknown as FullIcpOutput)
    } catch (error) {
      console.error("Failed to submit ICP:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Tell us about your company"
      case 2:
        return "Define your ideal customer"
      case 3:
        return "What value do you provide?"
      case 4:
        return "Common objections you face"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Help us understand what you sell and who you are."
      case 2:
        return "Describe the companies that are the best fit for your product."
      case 3:
        return "What makes your solution valuable to customers?"
      case 4:
        return "What pushback do you typically encounter in sales conversations?"
      default:
        return ""
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              stepLabels={STEP_LABELS}
            />
            <div className="pt-4">
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step content placeholder - will render step components */}
            <div className="min-h-[300px]">
              {currentStep === 1 && (
                <div className="text-muted-foreground text-sm">
                  Company info step will render here
                </div>
              )}
              {currentStep === 2 && (
                <div className="text-muted-foreground text-sm">
                  Target criteria step will render here
                </div>
              )}
              {currentStep === 3 && (
                <div className="text-muted-foreground text-sm">
                  Value props step will render here
                </div>
              )}
              {currentStep === 4 && (
                <div className="text-muted-foreground text-sm">
                  Objections step will render here
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              {currentStep < TOTAL_STEPS ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
}
