import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDashboardLeads, getIndustryOptions, type DashboardFilters } from '@/lib/dashboard/queries'
import { FilterBar } from './_components/filter-bar'
import { LeadGrid } from './_components/lead-grid'
import { Plus } from 'lucide-react'

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Await searchParams (Next.js 16 async searchParams)
  const params = await searchParams

  // Parse searchParams into filters
  const filters: DashboardFilters = {}

  // Score range mapping
  const scoreRange = typeof params.scoreRange === 'string' ? params.scoreRange : ''
  if (scoreRange === 'hot') {
    filters.scoreMin = 70
    filters.scoreMax = 100
  } else if (scoreRange === 'warm') {
    filters.scoreMin = 40
    filters.scoreMax = 69
  } else if (scoreRange === 'cold') {
    filters.scoreMin = 0
    filters.scoreMax = 39
  }

  // ICP match range
  if (params.icpMin && typeof params.icpMin === 'string') {
    filters.icpMatchMin = parseInt(params.icpMin)
  }
  if (params.icpMax && typeof params.icpMax === 'string') {
    filters.icpMatchMax = parseInt(params.icpMax)
  }

  // Industry filter
  if (params.industry && typeof params.industry === 'string' && params.industry !== '') {
    filters.industry = params.industry
  }

  // Date range
  if (params.dateFrom && typeof params.dateFrom === 'string' && params.dateFrom !== '') {
    filters.dateFrom = params.dateFrom
  }
  if (params.dateTo && typeof params.dateTo === 'string' && params.dateTo !== '') {
    filters.dateTo = params.dateTo
  }

  // Sort
  if (params.sortBy && typeof params.sortBy === 'string') {
    filters.sortBy = params.sortBy as 'score' | 'icpMatch' | 'date' | 'name'
  }
  if (params.sortDir && typeof params.sortDir === 'string') {
    filters.sortDir = params.sortDir as 'asc' | 'desc'
  }

  // Show archived
  if (params.showArchived === 'true') {
    filters.showArchived = true
  }

  // Fetch data in parallel
  const [leads, industries] = await Promise.all([
    getDashboardLeads(filters),
    getIndustryOptions(),
  ])

  const hasLeads = leads.length > 0
  const hasFilters = Object.keys(params).length > 0

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/analyze">
            <Plus className="h-4 w-4 mr-2" />
            Analyze New Lead
          </Link>
        </Button>
      </div>

      {/* No leads at all - show onboarding CTA */}
      {!hasLeads && !hasFilters && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6">
            <svg
              className="w-24 h-24 text-muted-foreground mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">No leads analyzed yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start by analyzing your first lead. Enter a company domain and we'll provide personalized insights based on your ICP.
          </p>
          <Button size="lg" asChild>
            <Link href="/analyze">
              <Plus className="h-5 w-5 mr-2" />
              Analyze Your First Lead
            </Link>
          </Button>
        </div>
      )}

      {/* Has leads or filters - show filter bar and grid */}
      {(hasLeads || hasFilters) && (
        <>
          <FilterBar industries={industries} totalCount={leads.length} leads={leads} />

          {/* No results after filtering */}
          {!hasLeads && hasFilters && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6">
                <svg
                  className="w-20 h-20 text-muted-foreground mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">No leads match your filters</h2>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or clearing them to see all leads.
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Clear filters</Link>
              </Button>
            </div>
          )}

          {/* Lead grid with Suspense */}
          {hasLeads && (
            <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading leads...</div>}>
              <LeadGrid leads={leads} />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}
