'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UrlInput } from '@/components/analyze/url-input';
import { ExtractionProgress } from '@/components/analyze/extraction-progress';
import { ManualInputForm } from '@/components/analyze/manual-input-form';
import type { ExtractionResult } from '@/lib/extraction/fallback-chain';
import type { PartialCompanyData, ManualCompanyInput } from '@/lib/validations/company';
import { ArrowLeft, Building2 } from 'lucide-react';

type ViewState =
  | { type: 'input' }
  | { type: 'extracting'; url: string }
  | { type: 'manual'; partialData: PartialCompanyData; missingFields: string[] }
  | { type: 'result'; data: PartialCompanyData; sources: string[] };

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
      setView({
        type: 'result',
        data: result.data,
        sources: result.sources,
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

    setView({
      type: 'result',
      data: mergedData,
      sources: ['manual'],
    });
  }

  function handleBack() {
    setView({ type: 'input' });
  }

  function handleEditResult() {
    if (view.type === 'result') {
      setView({
        type: 'manual',
        partialData: view.data,
        missingFields: [],
      });
    }
  }

  function handleProceedToAnalysis() {
    if (view.type === 'result') {
      // TODO: In Phase 4, this will navigate to analysis with the company data
      // For now, just log and show success
      console.log('Proceeding to analysis with:', view.data);
      alert('Company data ready! Analysis feature coming in Phase 4.');
    }
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

      {view.type === 'result' && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Data extracted from {view.sources.join(' and ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company info display */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Company Name
                </label>
                <p className="text-lg font-semibold">{view.data.name || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Industry
                  </label>
                  <p>{view.data.industry || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Size
                  </label>
                  <p>{view.data.employeeCount || '-'}</p>
                </div>
              </div>

              {view.data.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-sm">{view.data.description}</p>
                </div>
              )}

              {view.data.location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Location
                  </label>
                  <p>{view.data.location}</p>
                </div>
              )}

              {view.data.techStack && view.data.techStack.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tech Stack
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {view.data.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-muted rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleEditResult}>
                Edit
              </Button>
              <Button onClick={handleProceedToAnalysis} className="flex-1">
                Continue to Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
