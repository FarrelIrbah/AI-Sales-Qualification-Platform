'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as Collapsible from '@radix-ui/react-collapsible'
import type { Analysis, Company } from '@/lib/db/schema'
import { getScoreLabel } from '@/lib/analysis/schemas'
import { ScoreBreakdown } from '@/components/analysis/score-breakdown'
import { CompanyInsights } from '@/components/analysis/company-insights'
import { PitchAngles } from '@/components/analysis/pitch-angles'
import { ObjectionCards } from '@/components/analysis/objection-cards'

interface LeadDetailProps {
  analysis: Analysis
  company: Company
}

/**
 * Get color class based on score threshold
 * Green >= 70, Yellow >= 40, Red < 40
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * LeadDetail - Expanded detail panel with full analysis sections
 *
 * Layout:
 * - Key metrics bar at top (score, ICP match, industry, size, date)
 * - Collapsible sections below: Score Breakdown, Company Insights, Pitch Angles, Objections
 */
export function LeadDetail({ analysis, company }: LeadDetailProps) {
  // Track which sections are expanded (all collapsed by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    scoreBreakdown: false,
    companyInsights: false,
    pitchAngles: false,
    objections: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const scoreColor = getScoreColor(analysis.leadScore)
  const scoreLabel = getScoreLabel(analysis.leadScore)

  return (
    <div className="mt-4 border rounded-lg bg-muted/50 overflow-hidden">
      {/* Key metrics bar */}
      <div className="p-6 border-b bg-background/50">
        <div className="flex flex-wrap items-center gap-6">
          {/* Lead Score - large and prominent */}
          <div className="flex items-center gap-3">
            <div className={cn('px-4 py-2 rounded-lg font-bold text-lg', scoreColor)}>
              {analysis.leadScore} / 100
            </div>
            <span className="text-sm text-muted-foreground">{scoreLabel}</span>
          </div>

          {/* ICP Match */}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">ICP Match</span>
            <span className="text-sm font-semibold">{analysis.icpMatchPercentage}%</span>
          </div>

          {/* Industry */}
          {company.industry && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Industry</span>
              <span className="text-sm font-medium">{company.industry}</span>
            </div>
          )}

          {/* Company Size */}
          {company.employeeCount && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Company Size</span>
              <span className="text-sm font-medium">{company.employeeCount}</span>
            </div>
          )}

          {/* Date Analyzed */}
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Date Analyzed</span>
            <span className="text-sm font-medium">{formatDate(analysis.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Collapsible sections */}
      <div className="divide-y">
        {/* Score Breakdown Section */}
        <Collapsible.Root
          open={expandedSections.scoreBreakdown}
          onOpenChange={() => toggleSection('scoreBreakdown')}
        >
          <Collapsible.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="font-semibold">Score Breakdown</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                expandedSections.scoreBreakdown && 'rotate-180'
              )}
            />
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
            <div className="px-6 pb-6">
              <ScoreBreakdown
                componentScores={analysis.componentScores}
                icpMatchPercentage={analysis.icpMatchPercentage}
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Company Insights Section */}
        <Collapsible.Root
          open={expandedSections.companyInsights}
          onOpenChange={() => toggleSection('companyInsights')}
        >
          <Collapsible.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="font-semibold">Company Insights</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                expandedSections.companyInsights && 'rotate-180'
              )}
            />
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
            <div className="px-6 pb-6">
              <CompanyInsights
                insights={analysis.insights}
                companyData={{
                  name: company.name,
                  domain: company.domain,
                  industry: company.industry ?? undefined,
                  employeeCount: company.employeeCount ?? undefined,
                  location: company.location ?? undefined,
                  foundedYear: company.foundedYear ?? undefined,
                  techStack: company.techStack ?? undefined,
                }}
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Pitch Angles Section */}
        <Collapsible.Root
          open={expandedSections.pitchAngles}
          onOpenChange={() => toggleSection('pitchAngles')}
        >
          <Collapsible.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="font-semibold">Pitch Angles</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                expandedSections.pitchAngles && 'rotate-180'
              )}
            />
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
            <div className="px-6 pb-6">
              <PitchAngles pitchAngles={analysis.pitchAngles} />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Objections & Responses Section */}
        <Collapsible.Root
          open={expandedSections.objections}
          onOpenChange={() => toggleSection('objections')}
        >
          <Collapsible.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="font-semibold">Objections & Responses</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                expandedSections.objections && 'rotate-180'
              )}
            />
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
            <div className="px-6 pb-6">
              <ObjectionCards objections={analysis.objections} />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  )
}
