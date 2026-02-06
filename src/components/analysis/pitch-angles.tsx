'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PitchAngle } from '@/lib/analysis/schemas'

interface PitchAnglesProps {
  pitchAngles: PitchAngle[]
}

/**
 * PitchAngles - Displays recommended pitch approaches for the prospect
 *
 * Each pitch shows:
 * - Bold headline hook
 * - Explanation paragraph
 * - "Why it works" section
 */
export function PitchAngles({ pitchAngles }: PitchAnglesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pitch Angles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pitchAngles.map((pitch, index) => (
          <PitchCard key={index} pitch={pitch} />
        ))}
      </CardContent>
    </Card>
  )
}

interface PitchCardProps {
  pitch: PitchAngle
}

function PitchCard({ pitch }: PitchCardProps) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      {/* Headline */}
      <h4 className="font-semibold text-base">{pitch.headline}</h4>

      {/* Explanation */}
      <p className="text-sm text-muted-foreground">{pitch.explanation}</p>

      {/* Why it works */}
      <div className="pt-2 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Why it works
        </p>
        <p className="text-sm">{pitch.whyItWorks}</p>
      </div>
    </div>
  )
}

export default PitchAngles
