'use client'

import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, ArrowUpDown } from 'lucide-react'

interface FilterBarProps {
  industries: string[]
  totalCount: number
}

export function FilterBar({ industries, totalCount }: FilterBarProps) {
  // Score range filter
  const [scoreRange, setScoreRange] = useQueryState('scoreRange', parseAsString.withDefault(''))

  // ICP match range filters
  const [icpMin, setIcpMin] = useQueryState('icpMin', parseAsInteger)
  const [icpMax, setIcpMax] = useQueryState('icpMax', parseAsInteger)

  // Industry filter
  const [industry, setIndustry] = useQueryState('industry', parseAsString.withDefault(''))

  // Date range filters
  const [dateFrom, setDateFrom] = useQueryState('dateFrom', parseAsString.withDefault(''))
  const [dateTo, setDateTo] = useQueryState('dateTo', parseAsString.withDefault(''))

  // Sort controls
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('score'))
  const [sortDir, setSortDir] = useQueryState('sortDir', parseAsString.withDefault('desc'))

  // Count active filters
  const activeFilterCount = [
    scoreRange !== '',
    icpMin !== null,
    icpMax !== null,
    industry !== '',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length

  // Clear all filters
  const clearFilters = () => {
    setScoreRange('')
    setIcpMin(null)
    setIcpMax(null)
    setIndustry('')
    setDateFrom('')
    setDateTo('')
  }

  // Toggle sort direction
  const toggleSortDir = () => {
    setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="space-y-4 mb-6 p-4 border rounded-lg bg-card">
      {/* Row 1: Score range quick-select toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">Score:</span>
        <Button
          variant={scoreRange === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScoreRange('')}
        >
          All
        </Button>
        <Button
          variant={scoreRange === 'hot' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScoreRange('hot')}
          className={scoreRange === 'hot' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950'}
        >
          Hot (70-100)
        </Button>
        <Button
          variant={scoreRange === 'warm' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScoreRange('warm')}
          className={scoreRange === 'warm' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950'}
        >
          Warm (40-69)
        </Button>
        <Button
          variant={scoreRange === 'cold' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScoreRange('cold')}
          className={scoreRange === 'cold' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950'}
        >
          Cold (0-39)
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {activeFilterCount > 0 && (
            <>
              <Badge variant="secondary">{activeFilterCount} active</Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            </>
          )}
          <span className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'lead' : 'leads'}
          </span>
        </div>
      </div>

      {/* Row 2: Detailed filters and sort */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Industry dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="industry-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Industry:
          </label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="industry-filter" className="w-[200px]">
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ICP match range */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            ICP Match:
          </label>
          <input
            type="number"
            placeholder="Min %"
            value={icpMin ?? ''}
            onChange={(e) => setIcpMin(e.target.value ? parseInt(e.target.value) : null)}
            className="w-20 h-9 px-3 py-2 border border-input rounded-md text-sm"
            min="0"
            max="100"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="Max %"
            value={icpMax ?? ''}
            onChange={(e) => setIcpMax(e.target.value ? parseInt(e.target.value) : null)}
            className="w-20 h-9 px-3 py-2 border border-input rounded-md text-sm"
            min="0"
            max="100"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Date:
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-3 py-2 border border-input rounded-md text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-3 py-2 border border-input rounded-md text-sm"
          />
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Sort by:
          </label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="icpMatch">ICP Match</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortDir}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </span>
        </div>
      </div>
    </div>
  )
}
