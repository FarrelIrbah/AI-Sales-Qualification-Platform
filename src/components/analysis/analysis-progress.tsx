'use client'

import { useState, useEffect, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import type { PartialCompanyData } from '@/lib/validations/company'
import type { AnalysisResult } from '@/lib/analysis/schemas'

interface AnalysisStep {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
}

export interface AnalysisProgressResult {
  analysisId: string
  companyId: string
  analysis: AnalysisResult
}

interface AnalysisProgressProps {
  companyData: PartialCompanyData
  url: string
  onComplete: (result: AnalysisProgressResult) => void
  onError: (error: string) => void
}

export function AnalysisProgress({
  companyData,
  url,
  onComplete,
  onError,
}: AnalysisProgressProps) {
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { name: 'Analyzing company data', status: 'pending' },
    { name: 'Scoring against ICP', status: 'pending' },
    { name: 'Generating pitches', status: 'pending' },
    { name: 'Predicting objections', status: 'pending' },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const updateStep = useCallback(
    (index: number, status: AnalysisStep['status']) => {
      setSteps((prev) =>
        prev.map((step, i) => (i === index ? { ...step, status } : step))
      )
    },
    []
  )

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    async function runAnalysis() {
      try {
        // Step 1: Analyzing company data
        updateStep(0, 'running')
        setCurrentStep(0)

        // Small delay to show step animation
        await new Promise((r) => setTimeout(r, 400))
        if (!mounted) return
        updateStep(0, 'success')

        // Step 2: Scoring against ICP (actual API call happens here)
        updateStep(1, 'running')
        setCurrentStep(1)

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyData, url }),
          signal: controller.signal,
        })

        if (!mounted) return

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || result.error || 'Analysis failed')
        }

        // Step 2 complete
        updateStep(1, 'success')

        // Step 3: Generating pitches
        updateStep(2, 'running')
        setCurrentStep(2)
        await new Promise((r) => setTimeout(r, 300))
        if (!mounted) return
        updateStep(2, 'success')

        // Step 4: Predicting objections
        updateStep(3, 'running')
        setCurrentStep(3)
        await new Promise((r) => setTimeout(r, 300))
        if (!mounted) return
        updateStep(3, 'success')

        // Complete
        onComplete({
          analysisId: result.analysisId,
          companyId: result.companyId,
          analysis: result.analysis,
        })
      } catch (err) {
        if (!mounted) return

        if (err instanceof Error && err.name === 'AbortError') {
          return // User cancelled
        }

        console.error('Analysis error:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to analyze company'
        setError(errorMessage)
        onError(errorMessage)
      }
    }

    runAnalysis()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [companyData, url, onComplete, onError, updateStep])

  const progress = ((currentStep + 1) / steps.length) * 100

  const StepIcon = ({ status }: { status: AnalysisStep['status'] }) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <span className="h-4 w-4 rounded-full border border-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-opacity ${
                  step.status === 'pending' ? 'opacity-50' : ''
                }`}
              >
                <StepIcon status={step.status} />
                <span
                  className={
                    step.status === 'running'
                      ? 'text-primary font-medium'
                      : step.status === 'success'
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
