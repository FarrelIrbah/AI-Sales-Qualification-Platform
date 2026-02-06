'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UrlInput } from '@/components/analyze/url-input';
import { ExtractionProgress } from '@/components/analyze/extraction-progress';
import { ManualInputForm } from '@/components/analyze/manual-input-form';
import { AnalysisProgress, type AnalysisProgressResult } from '@/components/analysis/analysis-progress';
import { LeadScoreCard } from '@/components/analysis/lead-score-card';
import { ScoreBreakdown } from '@/components/analysis/score-breakdown';
import { CompanyInsights } from '@/components/analysis/company-insights';
import { PitchAngles } from '@/components/analysis/pitch-angles';
import { ObjectionCards } from '@/components/analysis/objection-cards';
import type { ExtractionResult } from '@/lib/extraction/fallback-chain';
import type { PartialCompanyData, ManualCompanyInput } from '@/lib/validations/company';
import type { AnalysisResult } from '@/lib/analysis/schemas';
import { ArrowLeft, Building2 } from 'lucide-react';

type ViewState =
  | { type: 'input' }
  | { type: 'extracting'; url: string }
  | { type: 'manual'; partialData: PartialCompanyData; missingFields: string[] }
  | { type: 'analyzing'; companyData: PartialCompanyData; url: string }
  | { type: 'result'; analysisId: string; analysis: AnalysisResult; companyData: PartialCompanyData };

export default function AnalyzePage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ type: 'input' });

  function handleUrlSubmit(url: string) {
    setView({ type: 'extracting', url });
  }

  function handleExtractionComplete(result: ExtractionResult) {
    if (result.needsManualInput) {
      setView({
        type: 'manual',
        partialData: result.data,
        missingFields: result.missingFields,
      });
    } else {
      // Auto-start analysis after successful extraction
      setView({
        type: 'analyzing',
        companyData: result.data,
        url: result.data.domain ? `https://${result.data.domain}` : '',
      });
    }
  }

  function handleExtractionError(
    partialData: PartialCompanyData,
    missingFields: string[]
  ) {
    setView({ type: 'manual', partialData, missingFields });
  }

  function handleManualClick() {
    setView({ type: 'manual', partialData: {}, missingFields: ['name', 'industry'] });
  }

  function handleManualSubmit(data: ManualCompanyInput) {
    // Merge manual input with any partial extraction data
    const mergedData: PartialCompanyData =
      view.type === 'manual'
        ? { ...view.partialData, ...data }
        : { ...data };

    // Auto-start analysis after manual input
    setView({
      type: 'analyzing',
      companyData: mergedData,
      url: mergedData.domain ? `https://${mergedData.domain}` : '',
    });
  }

  function handleBack() {
    setView({ type: 'input' });
  }

  function handleAnalysisComplete(result: AnalysisProgressResult) {
    setView({
      type: 'result',
      analysisId: result.analysisId,
      analysis: result.analysis,
      companyData: view.type === 'analyzing' ? view.companyData : {},
    });
  }

  function handleAnalysisError(error: string) {
    // On analysis error, go back to manual input with current data
    const currentData = view.type === 'analyzing' ? view.companyData : {};
    setView({
      type: 'manual',
      partialData: currentData,
      missingFields: [],
    });
    // Error is already logged by AnalysisProgress
    console.error('Analysis failed:', error);
  }

  function handleAnalyzeAnother() {
    setView({ type: 'input' });
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analyze a Company</h1>
            <p className="text-muted-foreground">
              Enter a company URL to extract their information
            </p>
          </div>
        </div>
      </div>

      {view.type === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Company URL</CardTitle>
            <CardDescription>
              We&apos;ll extract company information from their website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInput
              onSubmit={handleUrlSubmit}
              onManualClick={handleManualClick}
            />
          </CardContent>
        </Card>
      )}

      {view.type === 'extracting' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracting Company Data</CardTitle>
              <CardDescription className="truncate">
                {view.url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExtractionProgress
                url={view.url}
                onComplete={handleExtractionComplete}
                onError={handleExtractionError}
              />
            </CardContent>
          </Card>

          <Button variant="outline" onClick={handleBack} className="w-full">
            Cancel
          </Button>
        </div>
      )}

      {view.type === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
              {view.missingFields.length > 0
                ? 'Please complete the missing information'
                : 'Review and edit the company information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManualInputForm
              initialData={view.partialData}
              missingFields={view.missingFields}
              onSubmit={handleManualSubmit}
              onBack={handleBack}
            />
          </CardContent>
        </Card>
      )}

      {view.type === 'analyzing' && (
        <Card>
          <CardHeader>
            <CardTitle>Analyzing Lead</CardTitle>
            <CardDescription>
              Generating personalized recommendations based on your ICP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisProgress
              companyData={view.companyData}
              url={view.url}
              onComplete={handleAnalysisComplete}
              onError={handleAnalysisError}
            />
          </CardContent>
        </Card>
      )}

      {view.type === 'result' && (
        <div className="space-y-6">
          {/* Lead Score Card */}
          <LeadScoreCard
            score={view.analysis.leadScore}
            icpMatchPercentage={view.analysis.icpMatchPercentage}
            companyName={view.companyData.name || 'Unknown Company'}
          />

          {/* Score Breakdown */}
          <ScoreBreakdown
            componentScores={view.analysis.componentScores}
            icpMatchPercentage={view.analysis.icpMatchPercentage}
          />

          {/* Company Insights */}
          <CompanyInsights
            insights={view.analysis.insights}
            companyData={view.companyData}
          />

          {/* Pitch Angles */}
          <PitchAngles pitchAngles={view.analysis.pitchAngles} />

          {/* Objections */}
          <ObjectionCards objections={view.analysis.objections} />

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleAnalyzeAnother} className="flex-1">
              Analyze Another
            </Button>
            <Button onClick={() => router.push('/dashboard')} className="flex-1">
              View Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
