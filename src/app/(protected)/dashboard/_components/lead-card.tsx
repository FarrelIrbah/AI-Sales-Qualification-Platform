'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getScoreLabel } from '@/lib/analysis/schemas'
import type { Analysis, Company } from '@/lib/db/schema'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LeadCardProps {
  analysis: Analysis
  company: Company
  isExpanded: boolean
  onToggleExpand: () => void
  onAction: (action: string, analysisId: string) => void
}

/**
 * Get color class based on score threshold
 * Green >= 70, Yellow >= 40, Red < 40
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 dark:text-green-400'
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Get background color for ICP badge based on percentage
 */
function getIcpBadgeColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

/**
 * Format date as relative or YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`

  return date.toISOString().split('T')[0]
}

export function LeadCard({
  analysis,
  company,
  isExpanded,
  onToggleExpand,
  onAction,
}: LeadCardProps) {
  const scoreColor = getScoreColor(analysis.leadScore)
  const icpBadgeColor = getIcpBadgeColor(analysis.icpMatchPercentage)
  const scoreLabel = getScoreLabel(analysis.leadScore)

  // Get top pitch angle headline (first one)
  const topPitchHeadline = analysis.pitchAngles[0]?.headline || 'No pitch angle available'

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
        isExpanded ? 'border-primary' : ''
      }`}
    >
      <CardContent className="p-6" onClick={onToggleExpand}>
        {/* Three-dot menu in top-right corner */}
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onAction('menu', analysis.id)
            }}
            className="h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Main card layout - responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-start">
          {/* Left section: Score */}
          <div className="flex flex-col items-center min-w-[100px]">
            <span className={`text-5xl font-bold ${scoreColor}`}>
              {analysis.leadScore}
            </span>
            <span className={`text-sm font-medium mt-1 ${scoreColor}`}>
              {scoreLabel}
            </span>
          </div>

          {/* Middle section: Company info */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold truncate">{company.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {company.industry && (
                  <Badge variant="secondary">{company.industry}</Badge>
                )}
                {company.employeeCount && (
                  <span className="text-sm text-muted-foreground">
                    {company.employeeCount} employees
                  </span>
                )}
                {company.location && (
                  <span className="text-sm text-muted-foreground">
                    {company.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right section: ICP match, pitch, date */}
          <div className="flex flex-col items-end gap-3 min-w-[200px]">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${icpBadgeColor}`}>
              ICP Match: {analysis.icpMatchPercentage}%
            </div>

            <div className="text-sm italic text-muted-foreground text-right line-clamp-2 max-w-[250px]">
              "{topPitchHeadline}"
            </div>

            <div className="text-xs text-muted-foreground">
              {formatDate(analysis.createdAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
