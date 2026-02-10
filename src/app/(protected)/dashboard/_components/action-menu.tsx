'use client'

import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Copy, Download, RefreshCw, Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Analysis, Company } from '@/lib/db/schema'

interface ActionMenuProps {
  analysisId: string
  isArchived: boolean
  lead: { analysis: Analysis; company: Company }
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onReanalyze: (companyDomain: string) => void
  onCopyToClipboard: (lead: { analysis: Analysis; company: Company }) => void
  onExportCSV: (lead: { analysis: Analysis; company: Company }) => void
}

/**
 * ActionMenu - Three-dot menu with lead actions
 *
 * Actions:
 * - Copy to Clipboard (CRM-friendly text)
 * - Export as CSV (single lead)
 * - Re-analyze (navigate to /analyze with pre-filled URL)
 * - Archive/Unarchive (hide from or restore to dashboard)
 */
export function ActionMenu({
  analysisId,
  isArchived,
  lead,
  onArchive,
  onUnarchive,
  onReanalyze,
  onCopyToClipboard,
  onExportCSV,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Menu trigger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="h-8 w-8"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 min-w-[200px] rounded-md border bg-popover p-1 shadow-md">
          {/* Copy to Clipboard */}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation()
              handleAction(() => onCopyToClipboard(lead))
            }}
          >
            <Copy className="h-4 w-4" />
            <span>Copy to Clipboard</span>
          </button>

          {/* Export as CSV */}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation()
              handleAction(() => onExportCSV(lead))
            }}
          >
            <Download className="h-4 w-4" />
            <span>Export as CSV</span>
          </button>

          {/* Separator */}
          <div className="h-px bg-border my-1" />

          {/* Re-analyze */}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-left"
            onClick={(e) => {
              e.stopPropagation()
              handleAction(() => onReanalyze(lead.company.domain))
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Re-analyze</span>
          </button>

          {/* Archive / Unarchive */}
          {isArchived ? (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-left"
              onClick={(e) => {
                e.stopPropagation()
                handleAction(() => onUnarchive(analysisId))
              }}
            >
              <ArchiveRestore className="h-4 w-4" />
              <span>Unarchive</span>
            </button>
          ) : (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-left"
              onClick={(e) => {
                e.stopPropagation()
                handleAction(() => onArchive(analysisId))
              }}
            >
              <Archive className="h-4 w-4" />
              <span>Archive</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
