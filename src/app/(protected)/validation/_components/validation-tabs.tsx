'use client'

import { useState } from 'react'
import { AnalysisList } from './analysis-list'
import { DataExtractionForm } from './data-extraction-form'
import { ValidationReport } from './validation-report'
import type { AnalysisForValidation, ValidationMetrics } from '@/lib/validation/actions'
import type { DataExtractionValidation } from '@/lib/db/schema'

type Tab = 'ratings' | 'extraction' | 'report'

interface ValidationTabsProps {
  analyses: AnalysisForValidation[]
  extractionValidations: DataExtractionValidation[]
  metrics: ValidationMetrics
}

export function ValidationTabs({ analyses, extractionValidations, metrics }: ValidationTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ratings')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ratings', label: 'Expert Ratings' },
    { id: 'extraction', label: 'Data Extraction' },
    { id: 'report', label: 'Validation Report' },
  ]

  return (
    <div>
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'ratings' && <AnalysisList analyses={analyses} />}
      {activeTab === 'extraction' && (
        <DataExtractionForm
          analyses={analyses}
          existingValidations={extractionValidations}
        />
      )}
      {activeTab === 'report' && <ValidationReport metrics={metrics} />}
    </div>
  )
}
