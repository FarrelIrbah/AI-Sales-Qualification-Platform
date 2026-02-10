'use client'

import { useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import type { DashboardLead } from '@/lib/dashboard/queries'
import { LeadCard } from './lead-card'
import { LeadDetail } from './lead-detail'

interface LeadGridProps {
  leads: DashboardLead[]
}

export function LeadGrid({ leads }: LeadGridProps) {
  // Track which card is currently expanded (only one at a time)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Toggle expand/collapse for a card
  const handleToggleExpand = (analysisId: string) => {
    setExpandedId((current) => (current === analysisId ? null : analysisId))
  }

  // Handle card action menu (placeholder for plan 03)
  const handleAction = (action: string, analysisId: string) => {
    console.log('Card action:', action, analysisId)
    // Plan 03 will implement action menu
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const isExpanded = expandedId === lead.analysis.id

        return (
          <div key={lead.analysis.id}>
            {/* Lead card */}
            <LeadCard
              analysis={lead.analysis}
              company={lead.company}
              isExpanded={isExpanded}
              onToggleExpand={() => handleToggleExpand(lead.analysis.id)}
              onAction={handleAction}
            />

            {/* Expanded detail section with Collapsible animation */}
            <Collapsible.Root open={isExpanded}>
              <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                <LeadDetail analysis={lead.analysis} company={lead.company} />
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        )
      })}
    </div>
  )
}
