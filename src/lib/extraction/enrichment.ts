import { z } from 'zod'

/**
 * Hunter.io Enrichment Client
 *
 * Uses Hunter.io Domain Search API to enrich company data.
 * Gracefully degrades when API key is not configured or credits exhausted.
 */

// Hunter.io API response schema
const hunterResponseSchema = z.object({
  data: z
    .object({
      name: z.string().nullish(),
      description: z.string().nullish(),
      industry: z.string().nullish(),
      employees_count: z.number().nullish(),
      country: z.string().nullish(),
      city: z.string().nullish(),
      technologies: z.array(z.string()).nullish(),
      linkedin: z.string().nullish(),
      twitter: z.string().nullish(),
    })
    .nullable(),
})

/**
 * Enriched company data from Hunter.io API
 */
export interface EnrichedCompanyData {
  name?: string
  description?: string
  industry?: string
  employeeCount?: string
  location?: string
  techStack?: string[]
  linkedIn?: string
  twitter?: string
}

/**
 * Enrich company data using Hunter.io Domain Search API
 *
 * Returns null in these cases (graceful degradation):
 * - HUNTER_API_KEY not configured
 * - API credits exhausted (402 response)
 * - API error or timeout
 * - No data found for domain
 *
 * @param domain - Company domain (e.g., "stripe.com")
 * @returns Enriched company data or null
 */
export async function enrichCompany(
  domain: string
): Promise<EnrichedCompanyData | null> {
  const apiKey = process.env.HUNTER_API_KEY

  // Graceful degradation when API key not configured
  if (!apiKey) {
    console.warn(
      'Hunter.io API key not configured. Set HUNTER_API_KEY in environment variables.'
    )
    return null
  }

  const url = `https://api.hunter.io/v2/companies/find?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    // Handle specific error codes
    if (!response.ok) {
      if (response.status === 402) {
        console.warn('Hunter.io API: credits exhausted')
      } else if (response.status === 401) {
        console.warn('Hunter.io API: invalid API key')
      } else if (response.status === 404) {
        // No data found for domain - not an error
        return null
      } else {
        console.warn(`Hunter.io API error: ${response.status}`)
      }
      return null
    }

    const json = await response.json()

    // Validate response with Zod
    const parsed = hunterResponseSchema.safeParse(json)
    if (!parsed.success) {
      console.warn('Hunter.io API: unexpected response format')
      return null
    }

    // No data in response
    if (!parsed.data.data) {
      return null
    }

    const { data } = parsed.data

    // Transform Hunter.io response to our format
    const enriched: EnrichedCompanyData = {}

    if (data.name) enriched.name = data.name
    if (data.description) enriched.description = data.description
    if (data.industry) enriched.industry = data.industry

    // Convert employee count to range string
    if (data.employees_count) {
      enriched.employeeCount = formatEmployeeCount(data.employees_count)
    }

    // Format location from city + country
    if (data.city || data.country) {
      const parts = [data.city, data.country].filter(Boolean)
      if (parts.length > 0) {
        enriched.location = parts.join(', ')
      }
    }

    // Tech stack
    if (data.technologies && data.technologies.length > 0) {
      enriched.techStack = data.technologies
    }

    // Social links
    if (data.linkedin) enriched.linkedIn = data.linkedin
    if (data.twitter) enriched.twitter = data.twitter

    return enriched
  } catch (error) {
    // Handle network errors, timeouts, etc.
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.warn('Hunter.io API: request timed out')
      } else {
        console.warn(`Hunter.io API error: ${error.message}`)
      }
    }
    return null
  }
}

/**
 * Format numeric employee count into range string
 */
function formatEmployeeCount(count: number): string {
  if (count <= 10) return '1-10'
  if (count <= 50) return '11-50'
  if (count <= 200) return '51-200'
  if (count <= 500) return '201-500'
  if (count <= 1000) return '501-1000'
  return '1000+'
}
