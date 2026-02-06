'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getScoreLabel } from '@/lib/analysis/schemas'

interface LeadScoreCardProps {
  score: number
  icpMatchPercentage: number
  companyName?: string
}

/**
 * Get color class based on score threshold
 * Green >= 70, Yellow >= 40, Red < 40
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

/**
 * Get background color for ICP badge based on score
 */
function getIcpBadgeColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

export function LeadScoreCard({
  score,
  icpMatchPercentage,
  companyName,
}: LeadScoreCardProps) {
  const scoreLabel = getScoreLabel(score)
  const scoreColor = getScoreColor(score)
  const icpBadgeColor = getIcpBadgeColor(icpMatchPercentage)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {companyName ? `Lead Score: ${companyName}` : 'Lead Score'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Main Score Display */}
          <div className="text-center">
            <span className={`text-6xl font-bold ${scoreColor}`}>{score}</span>
            <p className="text-sm text-muted-foreground mt-1">out of 100</p>
          </div>

          {/* Score Label */}
          <div className={`text-xl font-semibold ${scoreColor}`}>
            {scoreLabel}
          </div>

          {/* ICP Match Badge */}
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${icpBadgeColor}`}
          >
            <span className="mr-1">ICP Match:</span>
            <span className="font-bold">{icpMatchPercentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
