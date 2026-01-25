"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AiInput } from "@/components/onboarding/ai-input"
import { parseCompanyInfoAction } from "@/lib/icp/actions"
import type { FullIcpInput } from "@/lib/validations/icp"

const COMPANY_SIZES = [
  { value: "solo", label: "Solo (1 person)" },
  { value: "small", label: "Small (2-50 employees)" },
  { value: "medium", label: "Medium (51-200 employees)" },
  { value: "large", label: "Large (201-1000 employees)" },
  { value: "enterprise", label: "Enterprise (1000+ employees)" },
] as const

const TARGET_MARKETS = [
  { value: "b2b", label: "B2B (Business-to-Business)" },
  { value: "b2c", label: "B2C (Business-to-Consumer)" },
  { value: "both", label: "Both B2B and B2C" },
] as const

// Field mappings for AI parsing
const FIELD_MAPPINGS = {
  productDescription: "productDescription",
  industry: "industry",
  companySize: "companySize",
  targetMarket: "targetMarket",
} as const

export function CompanyInfoStep() {
  const form = useFormContext<FullIcpInput>()

  return (
    <div className="space-y-6">
      {/* AI Input section */}
      <AiInput<FullIcpInput>
        placeholder="Describe your company in a few sentences... For example: 'We're a small SaaS startup that sells project management software to other businesses. We have about 20 employees and focus on helping tech teams collaborate better.'"
        parseAction={parseCompanyInfoAction}
        fieldMappings={FIELD_MAPPINGS}
      />

      {/* Manual form fields */}
      <div className="space-y-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Or fill in the details manually:
        </p>

        <FormField
          control={form.control}
          name="productDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What do you sell?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your product or service..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <FormControl>
                <Input placeholder="e.g., SaaS, Healthcare, Fintech" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Size</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetMarket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Market</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TARGET_MARKETS.map((market) => (
                      <SelectItem key={market.value} value={market.value}>
                        {market.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
