'use client'

import { Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CompanyInsights as CompanyInsightsType } from '@/lib/analysis/schemas'
import type { PartialCompanyData } from '@/lib/validations/company'

interface CompanyInsightsProps {
  insights: CompanyInsightsType
  companyData: PartialCompanyData
}

/**
 * CompanyInsights - Displays AI commentary on the analyzed company
 *
 * Shows:
 * - AI summary at the top
 * - Extracted facts grid (industry, size, location, tech stack badges)
 * - Strengths with green checkmarks
 * - Concerns with yellow warnings
 */
export function CompanyInsights({ insights, companyData }: CompanyInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">{insights.summary}</p>
        </div>

        {/* Extracted Facts Grid */}
        <div className="grid grid-cols-2 gap-4">
          {companyData.industry && (
            <FactItem label="Industry" value={companyData.industry} />
          )}
          {companyData.employeeCount && (
            <FactItem label="Company Size" value={companyData.employeeCount} />
          )}
          {companyData.location && (
            <FactItem label="Location" value={companyData.location} />
          )}
          {companyData.foundedYear && (
            <FactItem label="Founded" value={companyData.foundedYear} />
          )}
        </div>

        {/* Tech Stack Badges */}
        {companyData.techStack && companyData.techStack.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {companyData.techStack.map((tech, index) => (
                <Badge key={index} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Strengths</p>
            <ul className="space-y-2">
              {insights.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {insights.concerns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Concerns</p>
            <ul className="space-y-2">
              {insights.concerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface FactItemProps {
  label: string
  value: string
}

function FactItem({ label, value }: FactItemProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

export default CompanyInsights
