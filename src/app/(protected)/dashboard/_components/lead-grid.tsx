'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as Collapsible from '@radix-ui/react-collapsible'
import type { DashboardLead } from '@/lib/dashboard/queries'
import { archiveLead, unarchiveLead } from '@/lib/dashboard/queries'
import { leadToClipboardText, copyToClipboard, leadsToCSV, downloadCSV } from '@/lib/dashboard/utils'
import { LeadCard } from './lead-card'
import { LeadDetail } from './lead-detail'

interface LeadGridProps {
  leads: DashboardLead[]
}

export function LeadGrid({ leads }: LeadGridProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Track which card is currently expanded (only one at a time)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Toast message state for feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Auto-dismiss toast after 3 seconds
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Toggle expand/collapse for a card
  const handleToggleExpand = (analysisId: string) => {
    setExpandedId((current) => (current === analysisId ? null : analysisId))
  }

  // Archive handler
  const handleArchive = (id: string) => {
    startTransition(async () => {
      const result = await archiveLead(id)
      if (result.success) {
        showToast('Lead archived', 'success')
        router.refresh()
      } else {
        showToast(result.error, 'error')
      }
    })
  }

  // Unarchive handler
  const handleUnarchive = (id: string) => {
    startTransition(async () => {
      const result = await unarchiveLead(id)
      if (result.success) {
        showToast('Lead restored', 'success')
        router.refresh()
      } else {
        showToast(result.error, 'error')
      }
    })
  }

  // Re-analyze handler
  const handleReanalyze = (domain: string) => {
    router.push(`/analyze?url=https://${domain}`)
  }

  // Copy to clipboard handler
  const handleCopyToClipboard = async (lead: DashboardLead) => {
    const text = leadToClipboardText(lead)
    const result = await copyToClipboard(text)
    if (result.success) {
      showToast('Copied to clipboard', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  // Export CSV handler
  const handleExportCSV = (lead: DashboardLead) => {
    const csv = leadsToCSV([lead])
    const filename = `${lead.company.domain}-analysis.csv`
    downloadCSV(csv, filename)
    showToast('CSV exported', 'success')
  }

  return (
    <>
      {/* Toast message at top of grid */}
      {toast && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

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
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onReanalyze={handleReanalyze}
                onCopyToClipboard={handleCopyToClipboard}
                onExportCSV={handleExportCSV}
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
    </>
  )
}
