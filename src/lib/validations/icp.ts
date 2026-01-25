import { z } from 'zod'

// Step 1: Company Info Schema
export const companyInfoSchema = z.object({
  productDescription: z
    .string()
    .min(10, 'Please describe what you sell in at least 10 characters')
    .max(500, 'Keep it under 500 characters')
    .describe('What the company sells or provides - their main product or service'),
  industry: z
    .string()
    .min(2, 'Please specify your industry')
    .describe('The industry the company operates in'),
  companySize: z
    .enum(['solo', 'small', 'medium', 'large', 'enterprise'], {
      message: 'Please select your company size',
    })
    .describe('Company size category: solo (1), small (2-50), medium (51-200), large (201-1000), enterprise (1000+)'),
  targetMarket: z
    .enum(['b2b', 'b2c', 'both'], {
      message: 'Please select your target market',
    })
    .describe('Target market type: B2B (business-to-business), B2C (business-to-consumer), or both'),
})

// Step 2: Target Criteria Schema
export const targetCriteriaSchema = z.object({
  idealCompanySizes: z
    .array(z.string())
    .min(1, 'Select at least one company size')
    .describe('Company sizes of ideal customers (e.g., small, medium, enterprise)'),
  targetIndustries: z
    .array(z.string())
    .min(1, 'Add at least one target industry')
    .describe('Industries that ideal customers operate in (e.g., SaaS, Healthcare, Finance)'),
  targetLocations: z
    .array(z.string())
    .default([])
    .describe('Geographic regions or countries where ideal customers are located'),
  techRequirements: z
    .array(z.string())
    .default([])
    .describe('Technologies or tools that ideal customers use (e.g., Salesforce, AWS)'),
  budgetRange: z
    .object({
      min: z.number().optional().describe('Minimum budget in USD'),
      max: z.number().optional().describe('Maximum budget in USD'),
    })
    .optional()
    .describe('Expected budget range of ideal customers'),
})

// Step 3: Value Propositions Schema
export const valuePropsSchema = z.object({
  valuePropositions: z
    .array(
      z.object({
        headline: z
          .string()
          .min(5, 'Headline too short')
          .describe('A concise headline summarizing the value proposition'),
        description: z
          .string()
          .min(20, 'Add more detail')
          .describe('Detailed description of the value provided'),
        differentiators: z
          .array(z.string())
          .describe('What makes this value proposition unique compared to competitors'),
      })
    )
    .min(1, 'Add at least one value proposition')
    .describe('Key value propositions that resonate with ideal customers'),
})

// Step 4: Objections Schema
export const objectionsSchema = z.object({
  commonObjections: z
    .array(
      z.object({
        objection: z
          .string()
          .min(10, 'Describe the objection')
          .describe('A common objection or pushback from prospects'),
        suggestedResponse: z
          .string()
          .optional()
          .describe('Suggested response or counter-argument to the objection'),
      })
    )
    .default([])
    .describe('Common objections or pushbacks faced during sales conversations'),
})

// Full ICP Schema (all steps merged)
export const fullIcpSchema = companyInfoSchema
  .merge(targetCriteriaSchema)
  .merge(valuePropsSchema)
  .merge(objectionsSchema)

// Type exports - Output types (after validation/transform)
export type CompanyInfoOutput = z.output<typeof companyInfoSchema>
export type TargetCriteriaOutput = z.output<typeof targetCriteriaSchema>
export type ValuePropsOutput = z.output<typeof valuePropsSchema>
export type ObjectionsOutput = z.output<typeof objectionsSchema>
export type FullIcpOutput = z.output<typeof fullIcpSchema>

// Input types - for form defaults (before defaults are applied)
export type CompanyInfoInput = z.input<typeof companyInfoSchema>
export type TargetCriteriaInput = z.input<typeof targetCriteriaSchema>
export type ValuePropsInput = z.input<typeof valuePropsSchema>
export type ObjectionsInput = z.input<typeof objectionsSchema>
export type FullIcpInput = z.input<typeof fullIcpSchema>
