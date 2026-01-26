import { z } from 'zod'

/**
 * Company Data Validation Schemas
 *
 * These schemas define the structure for extracted company data.
 * Used for both validation and AI-assisted extraction (via .describe()).
 */

// Full company data schema - all fields for complete company profiles
export const companyDataSchema = z.object({
  // Core fields (always required)
  name: z
    .string()
    .min(1, 'Company name is required')
    .describe('The official company name'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .describe('The company domain without protocol (e.g., stripe.com)'),

  // Descriptive fields
  description: z
    .string()
    .optional()
    .describe('A brief description of what the company does'),
  industry: z
    .string()
    .optional()
    .describe('The primary industry the company operates in (e.g., SaaS, Healthcare, Finance)'),

  // Firmographics
  employeeCount: z
    .string()
    .optional()
    .describe('Employee count range (e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+")'),
  location: z
    .string()
    .optional()
    .describe('Company headquarters location (e.g., "San Francisco, USA")'),
  foundedYear: z
    .string()
    .optional()
    .describe('Year the company was founded (e.g., "2010")'),

  // Tech stack
  techStack: z
    .array(z.string())
    .default([])
    .describe('Technologies and tools the company uses'),

  // Contact information
  emails: z
    .array(z.string().email())
    .default([])
    .describe('Contact email addresses found on the website'),
  phones: z
    .array(z.string())
    .default([])
    .describe('Contact phone numbers found on the website'),

  // Social links
  linkedIn: z
    .string()
    .url()
    .optional()
    .describe('LinkedIn company page URL'),
  twitter: z
    .string()
    .optional()
    .describe('Twitter/X handle or URL'),

  // Metadata
  logoUrl: z
    .string()
    .url()
    .optional()
    .describe('URL to the company logo image'),
})

// Partial company data - all fields optional except domain (for extraction progress)
export const partialCompanyDataSchema = z.object({
  name: z.string().optional(),
  domain: z.string().min(1),
  description: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  location: z.string().optional(),
  foundedYear: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  emails: z.array(z.string().email()).optional(),
  phones: z.array(z.string()).optional(),
  linkedIn: z.string().url().optional(),
  twitter: z.string().optional(),
  logoUrl: z.string().url().optional(),
})

// Manual company input - core fields for user entry
export const manualCompanyInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .describe('The company name'),
  industry: z
    .string()
    .min(1, 'Industry is required')
    .describe('The industry the company operates in'),
  description: z
    .string()
    .optional()
    .describe('Brief description of the company'),
  employeeCount: z
    .string()
    .optional()
    .describe('Employee count range'),
  location: z
    .string()
    .optional()
    .describe('Company location'),
})

// Type exports
export type CompanyData = z.infer<typeof companyDataSchema>
export type PartialCompanyData = Partial<CompanyData>
export type ManualCompanyInput = z.infer<typeof manualCompanyInputSchema>

// Helper function to get required fields that are missing
export function getMissingRequiredFields(data: PartialCompanyData): string[] {
  const required = ['name', 'industry', 'description'] as const
  return required.filter((field) => !data[field])
}
