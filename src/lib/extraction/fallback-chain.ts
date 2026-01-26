import * as cheerio from 'cheerio'
import type { PartialCompanyData } from '@/lib/validations/company'
import { fetchHtml } from './scraper'
import { extractCompanyInfo, extractContactInfo } from './parsers/company-info'
import { enrichCompany } from './enrichment'

/**
 * Extraction Fallback Chain Orchestrator
 *
 * Implements the fallback chain pattern:
 * 1. Scrape website (Cheerio)
 * 2. Enrich with API (Hunter.io) for missing fields
 * 3. Return partial data with missing fields list
 *
 * Never throws - always returns actionable ExtractionResult.
 */

/**
 * Result of company data extraction
 */
export interface ExtractionResult {
  /** Extracted company data (may be partial) */
  data: PartialCompanyData
  /** Sources that contributed data */
  sources: ('scrape' | 'enrichment' | 'manual')[]
  /** Confidence level based on data completeness */
  confidence: 'high' | 'medium' | 'low'
  /** Whether manual input is needed for core fields */
  needsManualInput: boolean
  /** List of core fields that are still missing */
  missingFields: string[]
}

// Core fields that should be filled for a complete extraction
const CORE_FIELDS = ['name', 'industry', 'description'] as const

/**
 * Extract company data from a URL using fallback chain
 *
 * Flow:
 * 1. Parse domain from URL
 * 2. Try scraping first (fast, most reliable)
 * 3. Enrich with API for missing fields
 * 4. Calculate confidence and return result
 *
 * @param url - Company website URL to extract from
 * @returns ExtractionResult with data and metadata
 */
export async function extractCompanyData(url: string): Promise<ExtractionResult> {
  // Parse domain from URL
  const domain = new URL(url).hostname.replace('www.', '')
  let data: PartialCompanyData = { domain }
  const sources: ExtractionResult['sources'] = []

  // Tier 1: Try scraping first
  try {
    const html = await fetchHtml(url)
    const $ = cheerio.load(html)
    const scraped = extractCompanyInfo($, url)
    const contacts = extractContactInfo($)

    if (scraped) {
      data = { ...data, ...scraped, ...contacts }
      sources.push('scrape')
    }
  } catch (error) {
    console.error('Scraping failed:', error instanceof Error ? error.message : error)
    // Continue to fallback - don't rethrow
  }

  // Tier 2: Enrich with API if scraping incomplete
  const missingAfterScrape = getMissingFields(data)
  if (missingAfterScrape.length > 0) {
    try {
      const enriched = await enrichCompany(domain)
      if (enriched) {
        // Only fill missing fields, don't overwrite scraped data
        for (const field of missingAfterScrape) {
          const key = field as keyof typeof enriched
          if (enriched[key] !== undefined) {
            ;(data as Record<string, unknown>)[key] = enriched[key]
          }
        }
        sources.push('enrichment')
      }
    } catch (error) {
      console.error('Enrichment failed:', error instanceof Error ? error.message : error)
      // Continue with partial data - don't rethrow
    }
  }

  // Calculate final state
  const missingFields = getMissingFields(data)
  const needsManualInput = missingFields.length > 0
  const confidence = calculateConfidence(data, sources)

  return {
    data,
    sources,
    confidence,
    needsManualInput,
    missingFields,
  }
}

/**
 * Get list of core fields that are missing from data
 */
function getMissingFields(data: PartialCompanyData): string[] {
  return CORE_FIELDS.filter((field) => !data[field])
}

/**
 * Calculate confidence level based on data completeness and sources
 *
 * - High: 5+ fields filled AND scraped data (most reliable)
 * - Medium: 3+ fields filled
 * - Low: Less than 3 fields
 */
function calculateConfidence(
  data: PartialCompanyData,
  sources: ExtractionResult['sources']
): 'high' | 'medium' | 'low' {
  const filledFields = Object.keys(data).filter((k) => {
    const value = data[k as keyof PartialCompanyData]
    return value !== undefined && value !== null && value !== ''
  })

  // High: 5+ fields filled AND scraped data (most reliable)
  if (filledFields.length >= 5 && sources.includes('scrape')) return 'high'

  // Medium: 3+ fields filled
  if (filledFields.length >= 3) return 'medium'

  // Low: Less than 3 fields
  return 'low'
}
