"use client"

import * as React from "react"
import { useForm, FormProvider } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { fullIcpSchema, type FullIcpInput, type FullIcpOutput } from "@/lib/validations/icp"
import { StepIndicator } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  parseValuePropsAction,
  parseObjectionsAction,
} from "@/lib/icp/actions"

// Step components
import { CompanyInfoStep } from "./steps/company-info-step"
import { TargetCriteriaStep } from "./steps/target-criteria-step"
import { ValuePropsStep } from "./steps/value-props-step"
import { ObjectionsStep } from "./steps/objections-step"

const STEP_LABELS = ["Your Company", "Target Customers", "Value Props", "Objections"]
const TOTAL_STEPS = 4

// Fields to validate for each step
const STEP_FIELDS: Record<number, (keyof FullIcpInput)[]> = {
  1: ["productDescription", "industry", "companySize", "targetMarket"],
  2: ["idealCompanySizes", "targetIndustries", "targetLocations", "techRequirements", "budgetRange"],
  3: ["valuePropositions"],
  4: ["commonObjections"],
}

export type IcpWizardMode = "onboarding" | "settings"

interface IcpWizardProps {
  mode?: IcpWizardMode
  initialData?: Partial<FullIcpInput>
  onSuccess?: () => void
}

export function IcpWizard({ mode = "onboarding", initialData, onSuccess }: IcpWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isAiParsing, setIsAiParsing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [aiError, setAiError] = React.useState<string | null>(null)

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
      ...initialData,
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
      setAiError(null) // Clear AI error when navigating
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setAiError(null) // Clear AI error when navigating
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleFormSubmit = async (data: FullIcpInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save ICP")
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Navigate based on mode
      if (mode === "onboarding") {
        router.push("/dashboard")
        router.refresh()
      } else {
        // In settings mode, just refresh to show updated data
        router.refresh()
      }
    } catch (err) {
      console.error("Failed to submit ICP:", err)
      setError(err instanceof Error ? err.message : "Failed to save ICP")
    } finally {
      setIsSubmitting(false)
    }
  }

  // AI parsing handlers for Steps 3 and 4
  const handleValuePropsAiParse = async (input: string) => {
    setIsAiParsing(true)
    setAiError(null)
    try {
      const result = await parseValuePropsAction(input)
      if (result?.valuePropositions) {
        form.setValue("valuePropositions", result.valuePropositions)
      } else {
        setAiError("AI service unavailable. Please add value propositions manually below.")
      }
    } catch (err) {
      console.error('AI parsing error:', err)
      setAiError("AI service unavailable. Please add value propositions manually below.")
    } finally {
      setIsAiParsing(false)
    }
  }

  const handleObjectionsAiParse = async (input: string) => {
    setIsAiParsing(true)
    setAiError(null)
    try {
      const result = await parseObjectionsAction(input)
      if (result?.commonObjections) {
        form.setValue("commonObjections", result.commonObjections)
      } else {
        setAiError("AI service unavailable. Please add objections manually below.")
      }
    } catch (err) {
      console.error('AI parsing error:', err)
      setAiError("AI service unavailable. Please add objections manually below.")
    } finally {
      setIsAiParsing(false)
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
            {/* Error messages */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            {aiError && (
              <div className="p-3 text-sm text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30 rounded-md">
                {aiError}
              </div>
            )}

            {/* Step content */}
            <div className="min-h-[300px]">
              {currentStep === 1 && <CompanyInfoStep />}
              {currentStep === 2 && <TargetCriteriaStep />}
              {currentStep === 3 && (
                <ValuePropsStep
                  onAiParse={handleValuePropsAiParse}
                  isAiParsing={isAiParsing}
                />
              )}
              {currentStep === 4 && (
                <ObjectionsStep
                  onAiParse={handleObjectionsAiParse}
                  isAiParsing={isAiParsing}
                />
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

              <div className="flex gap-2">
                {/* In settings mode, allow saving from any step */}
                {mode === "settings" && currentStep < TOTAL_STEPS && (
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                )}

                {currentStep < TOTAL_STEPS ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : mode === "onboarding"
                        ? "Complete Setup"
                        : "Save Changes"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
}
