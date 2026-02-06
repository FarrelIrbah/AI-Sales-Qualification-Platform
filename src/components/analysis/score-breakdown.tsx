'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComponentScore } from '@/lib/analysis/schemas'

interface ScoreBreakdownProps {
  componentScores: ComponentScore[]
  icpMatchPercentage: number
}

/**
 * ScoreBreakdown - Displays component scores as expandable horizontal bars
 *
 * Each score shows:
 * - Name and percentage
 * - Colored bar (green >= 70, yellow >= 40, red < 40)
 * - Expandable reasoning section
 */
export function ScoreBreakdown({
  componentScores,
  icpMatchPercentage,
}: ScoreBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Score Breakdown</span>
          <span className="text-sm font-normal text-muted-foreground">
            ICP Match: {icpMatchPercentage}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {componentScores.map((score, index) => (
          <ScoreBar key={index} score={score} />
        ))}
      </CardContent>
    </Card>
  )
}

interface ScoreBarProps {
  score: ComponentScore
}

function ScoreBar({ score }: ScoreBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getBarColor = (value: number): string => {
    if (value >= 70) return 'bg-green-500'
    if (value >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTextColor = (value: number): string => {
    if (value >= 70) return 'text-green-600'
    if (value >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{score.name}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </div>
          <span className={cn('text-sm font-semibold', getTextColor(score.score))}>
            {score.score}%
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', getBarColor(score.score))}
            style={{ width: `${score.score}%` }}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="pl-4 border-l-2 border-muted">
          <p className="text-sm text-muted-foreground">{score.reasoning}</p>
        </div>
      )}
    </div>
  )
}

export default ScoreBreakdown
