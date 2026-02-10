'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardLead } from '@/lib/dashboard/queries'
import { leadsToCSV, downloadCSV } from '@/lib/dashboard/utils'

interface ExportAllButtonProps {
  leads: DashboardLead[]
}

/**
 * ExportAllButton - Client component to handle CSV export
 *
 * Exports all currently displayed leads (respects filters)
 */
export function ExportAllButton({ leads }: ExportAllButtonProps) {
  const handleExport = () => {
    if (leads.length === 0) return

    const csv = leadsToCSV(leads)
    const filename = `leadqual-export-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csv, filename)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={leads.length === 0}
    >
      <Download className="h-4 w-4 mr-1" />
      Export {leads.length > 0 ? `(${leads.length})` : 'All'}
    </Button>
  )
}
