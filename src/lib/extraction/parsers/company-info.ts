import type { CheerioAPI } from 'cheerio'
import type { PartialCompanyData } from '@/lib/validations/company'
import { extractDomain } from '../scraper'

/**
 * Company Info Parser
 *
 * Extracts structured company information from HTML using Cheerio.
 * Tries multiple sources: JSON-LD, Open Graph, meta tags, and content.
 */

/**
 * Extract company information from parsed HTML
 *
 * Extraction priority:
 * 1. JSON-LD structured data (most reliable)
 * 2. Open Graph meta tags
 * 3. Standard meta tags
 * 4. Page content heuristics
 *
 * @param $ - Cheerio instance with loaded HTML
 * @param url - Original URL (for domain extraction)
 * @returns Partial company data with extracted fields
 */
export function extractCompanyInfo(
  $: CheerioAPI,
  url: string
): PartialCompanyData {
  const info: PartialCompanyData = {
    domain: extractDomain(url),
  }

  // Try JSON-LD structured data first (highest quality)
  const jsonLdData = extractJsonLd($)
  if (jsonLdData) {
    Object.assign(info, jsonLdData)
  }

  // Extract name from multiple sources, don't overwrite JSON-LD
  if (!info.name) {
    info.name =
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="application-name"]').attr('content') ||
      extractNameFromTitle($('title').text()) ||
      capitalizeFirstLetter(info.domain.split('.')[0])
  }

  // Extract description
  if (!info.description) {
    info.description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('[itemprop="description"]').first().text().trim() ||
      extractFirstParagraph($)
  }

  // Extract logo URL
  if (!info.logoUrl) {
    info.logoUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      undefined

    // Make logo URL absolute if relative
    if (info.logoUrl && !info.logoUrl.startsWith('http')) {
      try {
        const baseUrl = new URL(url)
        info.logoUrl = new URL(info.logoUrl, baseUrl.origin).href
      } catch {
        info.logoUrl = undefined
      }
    }
  }

  // Extract social links
  if (!info.linkedIn) {
    const linkedInLink = $('a[href*="linkedin.com/company"]').first().attr('href')
    if (linkedInLink) {
      info.linkedIn = linkedInLink
    }
  }

  if (!info.twitter) {
    const twitterLink =
      $('a[href*="twitter.com/"]').first().attr('href') ||
      $('a[href*="x.com/"]').first().attr('href')
    if (twitterLink) {
      info.twitter = twitterLink
    }
  }

  return info
}

/**
 * Extract JSON-LD Organization/Corporation data
 */
function extractJsonLd($: CheerioAPI): Partial<PartialCompanyData> | null {
  const data: Partial<PartialCompanyData> = {}
  let found = false

  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return // Only process first valid Organization

    try {
      const jsonText = $(el).html()
      if (!jsonText) return

      const json = JSON.parse(jsonText)
      const entities = Array.isArray(json) ? json : [json]

      for (const entity of entities) {
        if (
          entity['@type'] === 'Organization' ||
          entity['@type'] === 'Corporation' ||
          entity['@type'] === 'LocalBusiness'
        ) {
          if (entity.name) data.name = entity.name
          if (entity.description) data.description = entity.description
          if (entity.industry) data.industry = entity.industry

          // Founded year from founding date
          if (entity.foundingDate) {
            const year = entity.foundingDate.split('-')[0]
            if (year && /^\d{4}$/.test(year)) {
              data.foundedYear = year
            }
          }

          // Employee count
          if (entity.numberOfEmployees) {
            const count =
              entity.numberOfEmployees.value || entity.numberOfEmployees
            if (typeof count === 'number') {
              data.employeeCount = formatEmployeeCount(count)
            } else if (typeof count === 'string') {
              data.employeeCount = count
            }
          }

          // Address/location
          if (entity.address) {
            if (typeof entity.address === 'string') {
              data.location = entity.address
            } else if (entity.address.addressLocality) {
              const parts = [
                entity.address.addressLocality,
                entity.address.addressCountry,
              ].filter(Boolean)
              data.location = parts.join(', ')
            }
          }

          // Logo
          if (entity.logo) {
            const logo = typeof entity.logo === 'string' ? entity.logo : entity.logo.url
            if (logo) data.logoUrl = logo
          }

          found = true
          break
        }
      }
    } catch {
      // Invalid JSON-LD, continue to next script tag
    }
  })

  return found ? data : null
}

/**
 * Extract contact information (emails and phones) from page content
 *
 * @param $ - Cheerio instance with loaded HTML
 * @returns Object with arrays of emails and phones
 */
export function extractContactInfo($: CheerioAPI): {
  emails: string[]
  phones: string[]
} {
  const bodyText = $('body').text()

  // Email regex - standard email pattern
  const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g
  const rawEmails = bodyText.match(emailRegex) || []

  // Filter out example/placeholder emails and deduplicate
  const emails = [...new Set(rawEmails)]
    .filter(
      (email) =>
        !email.includes('example') &&
        !email.includes('test') &&
        !email.includes('placeholder') &&
        !email.endsWith('.png') &&
        !email.endsWith('.jpg') &&
        !email.endsWith('.svg')
    )
    .slice(0, 5)

  // Phone regex - various formats
  const phoneRegex = /[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,}/g
  const rawPhones = bodyText.match(phoneRegex) || []

  // Clean and deduplicate phones
  const phones = [...new Set(rawPhones)]
    .map((phone) => phone.replace(/\s+/g, ' ').trim())
    .filter((phone) => phone.length >= 10 && phone.length <= 20) // Filter out noise
    .slice(0, 5)

  return { emails, phones }
}

/**
 * Extract company name from page title
 * Handles formats like "Company | Tagline" or "Company - About Us"
 */
function extractNameFromTitle(title: string): string | undefined {
  if (!title) return undefined

  // Common separators in titles
  const separators = ['|', '-', ':', '...']

  for (const sep of separators) {
    if (title.includes(sep)) {
      const part = title.split(sep)[0].trim()
      if (part && part.length > 1 && part.length < 50) {
        return part
      }
    }
  }

  // If no separator, use the whole title if reasonable length
  const trimmed = title.trim()
  if (trimmed.length > 1 && trimmed.length < 50) {
    return trimmed
  }

  return undefined
}

/**
 * Extract first meaningful paragraph from page
 */
function extractFirstParagraph($: CheerioAPI): string | undefined {
  let description: string | undefined

  $('p').each((_, el) => {
    if (description) return

    const text = $(el).text().trim()
    // Look for paragraphs that are description-like (50-500 chars)
    if (text.length >= 50 && text.length <= 500) {
      description = text
    }
  })

  return description
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

/**
 * Capitalize first letter of string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
