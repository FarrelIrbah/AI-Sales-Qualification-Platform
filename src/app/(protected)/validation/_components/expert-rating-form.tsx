'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createExpertRating } from '@/lib/validation/actions'
import { scoreToCategory } from '@/lib/validation/statistics'
import type { AnalysisForValidation } from '@/lib/validation/actions'

interface ExpertRatingFormProps {
  analysis: AnalysisForValidation
  blindMode: boolean
}

export function ExpertRatingForm({ analysis, blindMode }: ExpertRatingFormProps) {
  const router = useRouter()
  const [expertName, setExpertName] = useState('')
  const [expertRole, setExpertRole] = useState('')
  const [leadScore, setLeadScore] = useState(50)
  const [icpMatch, setIcpMatch] = useState(50)
  const [componentScores, setComponentScores] = useState<Array<{ name: string; score: number; reasoning: string }>>(
    analysis.componentScores.map(c => ({ name: c.name, score: 50, reasoning: '' }))
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Duration timer
  const startTimeRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const category = scoreToCategory(leadScore)

  const updateComponentScore = (index: number, field: 'score' | 'reasoning', value: number | string) => {
    setComponentScores(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expertName.trim()) {
      setError('Expert name is required')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await createExpertRating({
      analysisId: analysis.id,
      expertName: expertName.trim(),
      expertRole: expertRole.trim() || undefined,
      leadScore,
      icpMatchPercentage: icpMatch,
      category,
      componentScores: componentScores.map(c => ({
        name: c.name,
        score: c.score,
        reasoning: c.reasoning || 'No reasoning provided',
      })),
      blindRating: blindMode,
      notes: notes.trim() || undefined,
      ratingDurationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
    })

    setSubmitting(false)

    if (result.success) {
      setSuccess(true)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  if (success) {
    return (
      <div className="border rounded-lg p-6 text-center space-y-2">
        <p className="font-medium text-green-600">Rating submitted successfully.</p>
        <p className="text-sm text-muted-foreground">
          Expert: {expertName} | Score: {leadScore} | Category: {category} | Duration: {elapsed}s
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setExpertName('')
            setExpertRole('')
            setLeadScore(50)
            setIcpMatch(50)
            setComponentScores(analysis.componentScores.map(c => ({ name: c.name, score: 50, reasoning: '' })))
            setNotes('')
            startTimeRef.current = Date.now()
          }}
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          Submit another rating for this analysis
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Info */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium">{analysis.company.name}</h3>
        <p className="text-sm text-muted-foreground">
          {analysis.company.domain}
          {analysis.company.industry && ` · ${analysis.company.industry}`}
          {analysis.company.employeeCount && ` · ${analysis.company.employeeCount} employees`}
        </p>
        {analysis.company.description && (
          <p className="text-sm mt-2">{analysis.company.description}</p>
        )}
        {!blindMode && (
          <div className="mt-3 pt-3 border-t text-sm">
            <p>AI Lead Score: <span className="font-medium">{analysis.leadScore}</span></p>
            <p>AI ICP Match: <span className="font-medium">{analysis.icpMatchPercentage}%</span></p>
            <p>AI Category: <span className="font-medium">{scoreToCategory(analysis.leadScore)}</span></p>
          </div>
        )}
      </div>

      {/* Expert Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Expert Name *</label>
          <input
            type="text"
            value={expertName}
            onChange={e => setExpertName(e.target.value)}
            placeholder="e.g., Dr. Smith"
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role (optional)</label>
          <input
            type="text"
            value={expertRole}
            onChange={e => setExpertRole(e.target.value)}
            placeholder="e.g., Sales Manager"
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
      </div>

      {/* Lead Score */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">Lead Score</label>
          <span className="text-sm font-mono">{leadScore} ({category})</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={leadScore}
          onChange={e => setLeadScore(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 (Cold)</span>
          <span>40 (Warm)</span>
          <span>70 (Hot)</span>
          <span>100</span>
        </div>
      </div>

      {/* ICP Match */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">ICP Match Percentage</label>
          <span className="text-sm font-mono">{icpMatch}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={icpMatch}
          onChange={e => setIcpMatch(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Component Scores */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Component Scores</h4>
        {componentScores.map((comp, idx) => (
          <div key={comp.name} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{comp.name}</span>
              <span className="text-sm font-mono">{comp.score}</span>
            </div>
            {!blindMode && (
              <p className="text-xs text-muted-foreground">
                AI score: {analysis.componentScores[idx]?.score ?? 'N/A'}
              </p>
            )}
            <input
              type="range"
              min={0}
              max={100}
              value={comp.score}
              onChange={e => updateComponentScore(idx, 'score', Number(e.target.value))}
              className="w-full"
            />
            <textarea
              value={comp.reasoning}
              onChange={e => updateComponentScore(idx, 'reasoning', e.target.value)}
              placeholder="Reasoning for this score..."
              className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
              rows={2}
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional observations about this analysis..."
          className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
          rows={3}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Duration: {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
        <span>{blindMode ? 'Blind rating' : 'Open rating'}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Expert Rating'}
      </button>
    </form>
  )
}
