'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDataExtractionValidation } from '@/lib/validation/actions'
import type { AnalysisForValidation } from '@/lib/validation/actions'
import type { DataExtractionValidation } from '@/lib/db/schema'

const EXTRACTION_FIELDS = [
  { key: 'name', label: 'Company Name' },
  { key: 'industry', label: 'Industry' },
  { key: 'description', label: 'Description' },
  { key: 'employeeCount', label: 'Employee Count' },
  { key: 'location', label: 'Location' },
  { key: 'techStack', label: 'Tech Stack' },
] as const

type ValidationStatus = 'correct' | 'incorrect' | 'partial'

interface DataExtractionFormProps {
  analyses: AnalysisForValidation[]
  existingValidations: DataExtractionValidation[]
}

export function DataExtractionForm({ analyses, existingValidations }: DataExtractionFormProps) {
  const router = useRouter()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [expertName, setExpertName] = useState('')
  const [fieldValidations, setFieldValidations] = useState<Record<string, { status: ValidationStatus; correctedValue: string; notes: string }>>({})
  const [overallAccuracy, setOverallAccuracy] = useState<'high' | 'medium' | 'low' | ''>('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Deduplicate companies from analyses
  const companiesMap = new Map<string, AnalysisForValidation['company']>()
  for (const a of analyses) {
    if (!companiesMap.has(a.company.id)) {
      companiesMap.set(a.company.id, a.company)
    }
  }
  const companies = Array.from(companiesMap.values())

  const selectedCompany = selectedCompanyId ? companiesMap.get(selectedCompanyId) : null
  const existingForCompany = selectedCompanyId
    ? existingValidations.filter(v => v.companyId === selectedCompanyId)
    : []

  const initFieldValidations = (company: AnalysisForValidation['company']) => {
    const validations: Record<string, { status: ValidationStatus; correctedValue: string; notes: string }> = {}
    for (const field of EXTRACTION_FIELDS) {
      validations[field.key] = { status: 'correct', correctedValue: '', notes: '' }
    }
    setFieldValidations(validations)
  }

  const selectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId)
    const company = companiesMap.get(companyId)
    if (company) initFieldValidations(company)
    setSuccess(false)
    setError(null)
  }

  const getFieldValue = (company: AnalysisForValidation['company'], fieldKey: string): string => {
    switch (fieldKey) {
      case 'name': return company.name
      case 'industry': return company.industry || '(not extracted)'
      case 'description': return company.description || '(not extracted)'
      case 'employeeCount': return company.employeeCount || '(not extracted)'
      case 'location': return company.location || '(not extracted)'
      case 'techStack': return company.techStack?.join(', ') || '(not extracted)'
      default: return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompanyId || !expertName.trim()) {
      setError('Please select a company and enter expert name')
      return
    }

    setSubmitting(true)
    setError(null)

    const cleanedValidations: Record<string, { status: ValidationStatus; correctedValue?: string; notes?: string }> = {}
    for (const [key, val] of Object.entries(fieldValidations)) {
      cleanedValidations[key] = {
        status: val.status,
        ...(val.correctedValue.trim() && { correctedValue: val.correctedValue.trim() }),
        ...(val.notes.trim() && { notes: val.notes.trim() }),
      }
    }

    const result = await createDataExtractionValidation({
      companyId: selectedCompanyId,
      expertName: expertName.trim(),
      fieldValidations: cleanedValidations,
      overallAccuracy: overallAccuracy || undefined,
      notes: formNotes.trim() || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      setSuccess(true)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No companies available for extraction validation.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!selectedCompanyId ? (
        <>
          <p className="text-sm text-muted-foreground">
            Select a company to validate its extracted data fields.
          </p>
          <div className="space-y-2">
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => selectCompany(company.id)}
                className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-muted-foreground">
                  {company.domain}
                  {company.industry && ` · ${company.industry}`}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedCompanyId(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to companies
          </button>

          {existingForCompany.length > 0 && (
            <div className="text-xs text-muted-foreground border-b pb-2">
              Existing validations: {existingForCompany.map(v => v.expertName).join(', ')}
            </div>
          )}

          {success ? (
            <div className="border rounded-lg p-6 text-center space-y-2">
              <p className="font-medium text-green-600">Extraction validation submitted.</p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setExpertName('')
                  if (selectedCompany) initFieldValidations(selectedCompany)
                  setOverallAccuracy('')
                  setFormNotes('')
                }}
                className="text-sm underline text-muted-foreground hover:text-foreground"
              >
                Submit another validation
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Field Validations</h4>
                {EXTRACTION_FIELDS.map(field => (
                  <div key={field.key} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{field.label}</span>
                    </div>
                    <p className="text-sm bg-muted/50 px-3 py-2 rounded">
                      {selectedCompany ? getFieldValue(selectedCompany, field.key) : ''}
                    </p>
                    <div className="flex gap-4">
                      {(['correct', 'incorrect', 'partial'] as const).map(status => (
                        <label key={status} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="radio"
                            name={`field-${field.key}`}
                            checked={fieldValidations[field.key]?.status === status}
                            onChange={() => setFieldValidations(prev => ({
                              ...prev,
                              [field.key]: { ...prev[field.key], status },
                            }))}
                          />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </label>
                      ))}
                    </div>
                    {fieldValidations[field.key]?.status !== 'correct' && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Corrected value (optional)"
                          value={fieldValidations[field.key]?.correctedValue || ''}
                          onChange={e => setFieldValidations(prev => ({
                            ...prev,
                            [field.key]: { ...prev[field.key], correctedValue: e.target.value },
                          }))}
                          className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={fieldValidations[field.key]?.notes || ''}
                          onChange={e => setFieldValidations(prev => ({
                            ...prev,
                            [field.key]: { ...prev[field.key], notes: e.target.value },
                          }))}
                          className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Overall Accuracy</label>
                <select
                  value={overallAccuracy}
                  onChange={e => setOverallAccuracy(e.target.value as 'high' | 'medium' | 'low' | '')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="">Select...</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Additional observations..."
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Extraction Validation'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
