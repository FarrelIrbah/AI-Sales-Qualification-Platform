import * as cheerio from 'cheerio'

/**
 * Website Scraper Foundation
 *
 * Provides HTML fetching and SPA detection.
 * Uses native fetch + Cheerio for static content parsing.
 * Playwright integration for JavaScript-heavy sites comes in a later plan.
 */

// Realistic User-Agent for web scraping
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Fetch raw HTML from a URL with timeout and proper headers
 *
 * @param url - The URL to fetch
 * @returns Raw HTML string
 * @throws Error if request fails or times out
 */
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.text()
}

/**
 * Detect if a page likely requires JavaScript rendering
 *
 * Checks for common SPA indicators that suggest static HTML
 * won't have meaningful content.
 *
 * @param html - Raw HTML string to analyze
 * @returns true if the page likely needs browser rendering
 */
export function needsJavaScript(html: string): boolean {
  // Common SPA framework indicators
  const spaIndicators = [
    'id="__next"', // Next.js
    'id="root"', // React CRA
    'ng-app', // Angular
    'data-reactroot', // React
    '<noscript>', // JS-dependent content indicator
  ]

  // Check for SPA framework markers in HTML
  const hasSpaIndicator = spaIndicators.some((indicator) =>
    html.includes(indicator)
  )

  // Check if body has very little text content (likely JS-rendered)
  const $ = cheerio.load(html)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  // If body text is less than 100 characters, likely needs JS to render
  const hasMinimalContent = bodyText.length < 100

  // Return true if we see SPA indicators AND minimal content
  // Having SPA indicators alone doesn't mean content isn't server-rendered
  return hasSpaIndicator && hasMinimalContent
}

/**
 * Extract domain from URL, removing www prefix
 *
 * @param url - Full URL string
 * @returns Clean domain string
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    // If URL parsing fails, try to extract domain pattern
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/]+)/)
    return match?.[1]?.replace(/^www\./, '') || url
  }
}
