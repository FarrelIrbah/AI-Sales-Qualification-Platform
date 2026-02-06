'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PredictedObjection } from '@/lib/analysis/schemas'

interface ObjectionCardsProps {
  objections: PredictedObjection[]
}

/**
 * ObjectionCards - Displays predicted objections with recommended responses
 *
 * Each objection shows:
 * - Objection text with likelihood badge (high=red, medium=yellow, low=green)
 * - Recommended response visible immediately (not collapsed)
 */
export function ObjectionCards({ objections }: ObjectionCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicted Objections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {objections.map((objection, index) => (
          <ObjectionCard key={index} objection={objection} />
        ))}
      </CardContent>
    </Card>
  )
}

interface ObjectionCardProps {
  objection: PredictedObjection
}

function ObjectionCard({ objection }: ObjectionCardProps) {
  const getLikelihoodStyles = (
    likelihood: 'high' | 'medium' | 'low'
  ): { className: string; label: string } => {
    switch (likelihood) {
      case 'high':
        return {
          className: 'bg-red-100 text-red-700 border-red-200',
          label: 'High',
        }
      case 'medium':
        return {
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          label: 'Medium',
        }
      case 'low':
        return {
          className: 'bg-green-100 text-green-700 border-green-200',
          label: 'Low',
        }
    }
  }

  const likelihoodStyles = getLikelihoodStyles(objection.likelihood)

  return (
    <div className="p-4 border rounded-lg space-y-3">
      {/* Objection with likelihood badge */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium flex-1">{objection.objection}</p>
        <Badge
          variant="outline"
          className={cn('shrink-0', likelihoodStyles.className)}
        >
          {likelihoodStyles.label}
        </Badge>
      </div>

      {/* Response */}
      <div className="pt-2 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Recommended Response
        </p>
        <p className="text-sm text-muted-foreground">
          {objection.recommendedResponse}
        </p>
      </div>
    </div>
  )
}

export default ObjectionCards
