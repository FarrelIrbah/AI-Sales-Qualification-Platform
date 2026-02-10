import https from 'https'

/**
 * Hunter.io Enrichment Client
 *
 * Uses Hunter.io Domain Search API to enrich company data.
 * Gracefully degrades when API key is not configured or credits exhausted.
 */

// Hunter.io response data shape (loosely typed — API fields vary)
interface HunterCompanyData {
  name?: string | null
  description?: string | null
  industry?: string | null
  category?: string | null
  employees_count?: number | null
  size?: string | null
  country?: string | null
  city?: string | null
  technologies?: string[] | null
  linkedin?: string | null
  twitter?: string | null
}

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
 * Make HTTPS request using native Node.js module (more reliable on Windows)
 */
function httpsGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => resolve({ status: res.statusCode || 0, body }))
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timed out'))
    })
  })
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
    const { status, body } = await httpsGet(url)

    // Handle specific error codes
    if (status !== 200) {
      if (status === 402) {
        console.warn('Hunter.io API: credits exhausted')
      } else if (status === 401) {
        console.warn('Hunter.io API: invalid API key')
      } else if (status === 404) {
        // No data found for domain - not an error
        return null
      } else {
        console.warn(`Hunter.io API error: ${status}`)
      }
      return null
    }

    const json = JSON.parse(body)

    // Extract data field — Hunter.io wraps response in { data: {...} }
    const data: HunterCompanyData | null | undefined =
      json && typeof json === 'object' ? json.data : null

    if (!data || typeof data !== 'object') {
      return null
    }

    // Transform Hunter.io response to our format
    const enriched: EnrichedCompanyData = {}

    if (data.name) enriched.name = data.name
    if (data.description) enriched.description = data.description
    // Hunter.io uses both "industry" and "category" depending on endpoint
    if (data.industry) enriched.industry = data.industry
    else if (data.category) enriched.industry = data.category

    // Convert employee count to range string (handle both number and string)
    if (data.employees_count && typeof data.employees_count === 'number') {
      enriched.employeeCount = formatEmployeeCount(data.employees_count)
    } else if (data.size && typeof data.size === 'string') {
      enriched.employeeCount = data.size
    }

    // Format location from city + country
    if (data.city || data.country) {
      const parts = [data.city, data.country].filter(Boolean)
      if (parts.length > 0) {
        enriched.location = parts.join(', ')
      }
    }

    // Tech stack
    if (data.technologies && Array.isArray(data.technologies) && data.technologies.length > 0) {
      enriched.techStack = data.technologies
    }

    // Social links
    if (data.linkedin) enriched.linkedIn = data.linkedin
    if (data.twitter) enriched.twitter = data.twitter

    return enriched
  } catch (error) {
    // Handle network errors, timeouts, etc.
    if (error instanceof Error) {
      console.warn(`Hunter.io API error: ${error.message}`)
    } else {
      console.warn('Hunter.io API: unknown error', error)
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
