'use client'

import { useState } from 'react'
import { ExpertRatingForm } from './expert-rating-form'
import type { AnalysisForValidation } from '@/lib/validation/actions'

interface AnalysisListProps {
  analyses: AnalysisForValidation[]
}

export function AnalysisList({ analyses }: AnalysisListProps) {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [blindMode, setBlindMode] = useState(false)

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId)

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No analyses available for validation.</p>
        <p className="text-sm mt-1">Analyze some leads first, then return here to validate the AI scores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} available for expert rating
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={blindMode}
            onChange={e => setBlindMode(e.target.checked)}
            className="rounded border-input"
          />
          Blind rating mode
        </label>
      </div>

      {selectedAnalysis ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedAnalysisId(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to list
          </button>
          <ExpertRatingForm analysis={selectedAnalysis} blindMode={blindMode} />
        </div>
      ) : (
        <div className="space-y-2">
          {analyses.map(analysis => (
            <button
              key={analysis.id}
              onClick={() => setSelectedAnalysisId(analysis.id)}
              className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{analysis.company.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.company.domain}
                    {analysis.company.industry && ` · ${analysis.company.industry}`}
                  </p>
                </div>
                <div className="text-right">
                  {!blindMode && (
                    <p className="text-sm">
                      AI Score: <span className="font-medium">{analysis.leadScore}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {analysis.expertRatings.length} expert {analysis.expertRatings.length === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>
              </div>
              {analysis.expertRatings.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {analysis.expertRatings.map(r => (
                    <span key={r.id} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {r.expertName}{r.blindRating ? ' (blind)' : ''}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
