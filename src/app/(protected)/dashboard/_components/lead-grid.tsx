'use client'

import type { DashboardLead } from '@/lib/dashboard/queries'

interface LeadGridProps {
  leads: DashboardLead[]
}

// Placeholder - will be implemented in Task 2
export function LeadGrid({ leads }: LeadGridProps) {
  return <div>Lead grid component - Task 2 ({leads.length} leads)</div>
}
