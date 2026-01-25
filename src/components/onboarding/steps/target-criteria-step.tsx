"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AiInput } from "@/components/onboarding/ai-input"
import { TagInput } from "@/components/onboarding/tag-input"
import { parseTargetCriteriaAction } from "@/lib/icp/actions"
import type { FullIcpInput } from "@/lib/validations/icp"
import { cn } from "@/lib/utils"

const COMPANY_SIZES = [
  { id: "solo", label: "Solo (1)" },
  { id: "small", label: "Small (2-50)" },
  { id: "medium", label: "Medium (51-200)" },
  { id: "large", label: "Large (201-1000)" },
  { id: "enterprise", label: "Enterprise (1000+)" },
] as const

// Field mappings for AI parsing
const FIELD_MAPPINGS = {
  idealCompanySizes: "idealCompanySizes",
  targetIndustries: "targetIndustries",
  targetLocations: "targetLocations",
  techRequirements: "techRequirements",
  budgetRange: "budgetRange",
} as const

export function TargetCriteriaStep() {
  const form = useFormContext<FullIcpInput>()

  return (
    <div className="space-y-6">
      {/* AI Input section */}
      <AiInput<FullIcpInput>
        placeholder="Describe your ideal customer... For example: 'We target mid-sized tech companies, especially SaaS and fintech startups with 50-500 employees. They use modern tools like Slack and AWS, and typically have budgets of $10k-50k per year.'"
        parseAction={parseTargetCriteriaAction}
        fieldMappings={FIELD_MAPPINGS}
      />

      {/* Manual form fields */}
      <div className="space-y-6 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Or specify the criteria manually:
        </p>

        {/* Company Sizes - Checkbox group */}
        <FormField
          control={form.control}
          name="idealCompanySizes"
          render={() => (
            <FormItem>
              <FormLabel>Ideal Customer Company Sizes</FormLabel>
              <FormDescription>
                Select all company sizes you want to target
              </FormDescription>
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                {COMPANY_SIZES.map((size) => (
                  <FormField
                    key={size.id}
                    control={form.control}
                    name="idealCompanySizes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={size.id}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(size.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value ?? []), size.id])
                                  : field.onChange(
                                      (field.value ?? []).filter(
                                        (value: string) => value !== size.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {size.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Industries - Tag Input */}
        <FormField
          control={form.control}
          name="targetIndustries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Industries</FormLabel>
              <FormDescription>
                Industries your ideal customers operate in
              </FormDescription>
              <FormControl>
                <TagInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g., SaaS, Healthcare, Fintech"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Locations - Tag Input */}
        <FormField
          control={form.control}
          name="targetLocations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Locations (Optional)</FormLabel>
              <FormDescription>
                Geographic regions or countries
              </FormDescription>
              <FormControl>
                <TagInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g., USA, Europe, APAC"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tech Requirements - Tag Input */}
        <FormField
          control={form.control}
          name="techRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technology Requirements (Optional)</FormLabel>
              <FormDescription>
                Tools or technologies your ideal customers use
              </FormDescription>
              <FormControl>
                <TagInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g., Salesforce, AWS, Shopify"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Budget Range - Optional */}
        <FormField
          control={form.control}
          name="budgetRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Range (Optional)</FormLabel>
              <FormDescription>
                Expected annual budget of ideal customers (USD)
              </FormDescription>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="Min"
                    className="w-28"
                    value={field.value?.min ?? ""}
                    onChange={(e) =>
                      field.onChange({
                        ...field.value,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="w-28"
                    value={field.value?.max ?? ""}
                    onChange={(e) =>
                      field.onChange({
                        ...field.value,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
