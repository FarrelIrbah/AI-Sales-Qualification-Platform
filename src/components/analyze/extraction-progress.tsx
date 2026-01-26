'use client';

import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { ExtractionResult } from '@/lib/extraction/fallback-chain';
import type { PartialCompanyData } from '@/lib/validations/company';

interface ExtractionStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
}

interface ExtractionProgressProps {
  url: string;
  onComplete: (result: ExtractionResult) => void;
  onError: (partialData: PartialCompanyData, missingFields: string[]) => void;
}

export function ExtractionProgress({
  url,
  onComplete,
  onError,
}: ExtractionProgressProps) {
  const [steps, setSteps] = useState<ExtractionStep[]>([
    { name: 'Fetching website', status: 'pending' },
    { name: 'Extracting company info', status: 'pending' },
    { name: 'Enriching data', status: 'pending' },
    { name: 'Finalizing', status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const updateStep = useCallback((index: number, status: ExtractionStep['status']) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function runExtraction() {
      try {
        // Step 1: Fetching website (simulated stage)
        updateStep(0, 'running');
        setCurrentStep(0);

        // Small delay to show step animation
        await new Promise((r) => setTimeout(r, 500));
        if (!mounted) return;
        updateStep(0, 'success');

        // Step 2: Extracting (actual API call happens here)
        updateStep(1, 'running');
        setCurrentStep(1);

        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        if (!mounted) return;

        const result: ExtractionResult = await response.json();

        // Step 2 complete
        updateStep(1, result.sources.includes('scrape') ? 'success' : 'skipped');

        // Step 3: Enriching (show based on result)
        updateStep(2, 'running');
        setCurrentStep(2);
        await new Promise((r) => setTimeout(r, 300));
        if (!mounted) return;

        updateStep(
          2,
          result.sources.includes('enrichment')
            ? 'success'
            : result.sources.includes('scrape')
            ? 'skipped'
            : 'failed'
        );

        // Step 4: Finalizing
        updateStep(3, 'running');
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 300));
        if (!mounted) return;
        updateStep(3, 'success');

        // Complete
        if (result.needsManualInput) {
          onError(result.data, result.missingFields);
        } else {
          onComplete(result);
        }
      } catch (err) {
        if (!mounted) return;

        if (err instanceof Error && err.name === 'AbortError') {
          return; // User cancelled
        }

        console.error('Extraction error:', err);
        setError('Failed to extract company data');

        // Always provide fallback
        onError({}, ['name', 'industry', 'description']);
      }
    }

    runExtraction();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [url, onComplete, onError, updateStep]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const StepIcon = ({ status }: { status: ExtractionStep['status'] }) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <span className="h-4 w-4 text-muted-foreground">-</span>;
      default:
        return <span className="h-4 w-4 rounded-full border border-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-opacity ${
                  step.status === 'pending' ? 'opacity-50' : ''
                }`}
              >
                <StepIcon status={step.status} />
                <span
                  className={
                    step.status === 'running'
                      ? 'text-primary font-medium'
                      : step.status === 'success'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
