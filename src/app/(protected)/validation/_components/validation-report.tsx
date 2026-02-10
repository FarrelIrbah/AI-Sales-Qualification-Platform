import type { ValidationMetrics } from '@/lib/validation/actions'
import { MetricCard } from './metric-card'
import { ConfusionMatrix } from './confusion-matrix'

interface ValidationReportProps {
  metrics: ValidationMetrics
}

export function ValidationReport({ metrics }: ValidationReportProps) {
  const { sampleInfo } = metrics
  const hasMinimumData = sampleInfo.ratedAnalyses >= 10 && sampleInfo.uniqueExperts.length >= 3

  return (
    <div className="space-y-8">
      {/* Minimum requirements notice */}
      {!hasMinimumData && sampleInfo.totalRatings > 0 && (
        <div className="border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 text-sm">
          <p className="font-medium">Minimum requirements not yet met</p>
          <p className="text-muted-foreground mt-1">
            For statistically meaningful results: {sampleInfo.ratedAnalyses}/10 analyses rated,{' '}
            {sampleInfo.uniqueExperts.length}/3 expert raters.
            Results below are preliminary.
          </p>
        </div>
      )}

      {/* 1. Sample Info */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Sample Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Analyses" value={sampleInfo.totalAnalyses} />
          <MetricCard label="Expert Ratings" value={sampleInfo.totalRatings} />
          <MetricCard label="Unique Experts" value={sampleInfo.uniqueExperts.length} />
          <MetricCard label="Blind Ratings" value={sampleInfo.blindRatingCount} />
        </div>
        {sampleInfo.uniqueExperts.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Experts: {sampleInfo.uniqueExperts.join(', ')}
          </p>
        )}
      </section>

      {sampleInfo.totalRatings === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No expert ratings submitted yet.</p>
          <p className="text-sm mt-1">
            Switch to the Expert Ratings tab to start validating AI scores.
          </p>
        </div>
      )}

      {/* 2. Inter-Rater Reliability */}
      {metrics.interRaterReliability && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Inter-Rater Reliability</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Cohen's Kappa"
              value={metrics.interRaterReliability.cohensKappa.kappa}
              detail={metrics.interRaterReliability.cohensKappa.interpretation}
              highlight
            />
            <MetricCard
              label="Weighted Kappa"
              value={metrics.interRaterReliability.weightedKappa.kappa}
              detail={metrics.interRaterReliability.weightedKappa.interpretation}
              highlight
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MetricCard
              label="Observed Agreement"
              value={metrics.interRaterReliability.cohensKappa.observedAgreement}
              detail="Proportion of actual agreements"
            />
            <MetricCard
              label="Expected Agreement"
              value={metrics.interRaterReliability.cohensKappa.expectedAgreement}
              detail="Proportion expected by chance"
            />
          </div>
        </section>
      )}

      {/* 3. Correlation Analysis */}
      {metrics.correlation && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Correlation Analysis</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Lead Score (Pearson r)"
              value={metrics.correlation.leadScore.r}
              detail={`p = ${metrics.correlation.leadScore.pValue.toFixed(4)}, n = ${metrics.correlation.leadScore.n}`}
              highlight
            />
            <MetricCard
              label="ICP Match (Pearson r)"
              value={metrics.correlation.icpMatch.r}
              detail={`p = ${metrics.correlation.icpMatch.pValue.toFixed(4)}, n = ${metrics.correlation.icpMatch.n}`}
              highlight
            />
          </div>
        </section>
      )}

      {/* 4. Error Metrics */}
      {metrics.errorMetrics && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Error Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Lead Score MAE"
              value={metrics.errorMetrics.leadScoreMAE}
              detail="Mean Absolute Error"
            />
            <MetricCard
              label="Lead Score RMSE"
              value={metrics.errorMetrics.leadScoreRMSE}
              detail="Root Mean Square Error"
            />
            <MetricCard
              label="ICP Match MAE"
              value={metrics.errorMetrics.icpMatchMAE}
              detail="Mean Absolute Error"
            />
            <MetricCard
              label="ICP Match RMSE"
              value={metrics.errorMetrics.icpMatchRMSE}
              detail="Root Mean Square Error"
            />
          </div>
        </section>
      )}

      {/* 5. Confusion Matrix */}
      {metrics.confusionMatrix && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Confusion Matrix</h3>
          <div className="border rounded-lg p-4">
            <ConfusionMatrix matrix={metrics.confusionMatrix} />
          </div>
        </section>
      )}

      {/* 6. Classification Metrics */}
      {metrics.classificationMetrics && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Classification Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Precision</th>
                  <th className="p-2 text-right">Recall</th>
                  <th className="p-2 text-right">F1</th>
                  <th className="p-2 text-right">Support</th>
                </tr>
              </thead>
              <tbody>
                {(['hot', 'warm', 'cold'] as const).map(cat => {
                  const m = metrics.classificationMetrics!.perCategory[cat]
                  return (
                    <tr key={cat} className="border-b">
                      <td className="p-2 font-medium capitalize">{cat}</td>
                      <td className="p-2 text-right font-mono">{m.precision.toFixed(3)}</td>
                      <td className="p-2 text-right font-mono">{m.recall.toFixed(3)}</td>
                      <td className="p-2 text-right font-mono">{m.f1.toFixed(3)}</td>
                      <td className="p-2 text-right">{m.support}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="p-2">Overall</td>
                  <td className="p-2 text-right font-mono">{metrics.classificationMetrics.accuracy.toFixed(3)}</td>
                  <td className="p-2 text-right font-mono">-</td>
                  <td className="p-2 text-right font-mono">
                    {metrics.classificationMetrics.macroF1.toFixed(3)} (macro)
                  </td>
                  <td className="p-2 text-right">
                    {metrics.classificationMetrics.weightedF1.toFixed(3)} (weighted)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* 7. Component Analysis */}
      {metrics.componentAnalysis && metrics.componentAnalysis.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Component Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Component</th>
                  <th className="p-2 text-right">Pearson r</th>
                  <th className="p-2 text-right">p-value</th>
                  <th className="p-2 text-right">MAE</th>
                  <th className="p-2 text-right">n</th>
                </tr>
              </thead>
              <tbody>
                {metrics.componentAnalysis.map(comp => (
                  <tr key={comp.name} className="border-b">
                    <td className="p-2">{comp.name}</td>
                    <td className="p-2 text-right font-mono">{comp.pearson.r.toFixed(3)}</td>
                    <td className="p-2 text-right font-mono">{comp.pearson.pValue.toFixed(4)}</td>
                    <td className="p-2 text-right font-mono">{comp.mae.toFixed(1)}</td>
                    <td className="p-2 text-right">{comp.pearson.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 8. Data Extraction Accuracy */}
      {metrics.extractionMetrics && metrics.extractionMetrics.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Data Extraction Accuracy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Field</th>
                  <th className="p-2 text-right">Correct</th>
                  <th className="p-2 text-right">Partial</th>
                  <th className="p-2 text-right">Incorrect</th>
                  <th className="p-2 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {metrics.extractionMetrics.map(field => (
                  <tr key={field.field} className="border-b">
                    <td className="p-2 capitalize">{field.field}</td>
                    <td className="p-2 text-right">{field.correct}</td>
                    <td className="p-2 text-right">{field.partial}</td>
                    <td className="p-2 text-right">{field.incorrect}</td>
                    <td className="p-2 text-right font-mono">{(field.accuracy * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 9. Interpretation Guide */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Interpretation Guide</h3>
        <div className="border rounded-lg p-4 text-sm space-y-3">
          <div>
            <p className="font-medium">Cohen's Kappa (Landis & Koch, 1977)</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-1.5 text-left">Kappa Range</th>
                    <th className="p-1.5 text-left">Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['< 0.00', 'Poor (less than chance agreement)'],
                    ['0.00 - 0.20', 'Slight agreement'],
                    ['0.21 - 0.40', 'Fair agreement'],
                    ['0.41 - 0.60', 'Moderate agreement'],
                    ['0.61 - 0.80', 'Substantial agreement'],
                    ['0.81 - 1.00', 'Almost perfect agreement'],
                  ].map(([range, interp]) => (
                    <tr key={range} className="border-b last:border-0">
                      <td className="p-1.5 font-mono">{range}</td>
                      <td className="p-1.5">{interp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="font-medium">Pearson Correlation (r)</p>
            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
              <li>|r| &lt; 0.3: Weak correlation</li>
              <li>0.3 &le; |r| &lt; 0.7: Moderate correlation</li>
              <li>|r| &ge; 0.7: Strong correlation</li>
              <li>p &lt; 0.05 indicates statistical significance</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">MAE / RMSE</p>
            <p className="text-muted-foreground">
              On a 0-100 scale: MAE &lt; 10 is excellent, 10-20 is good, &gt; 20 indicates significant disagreement.
              RMSE penalizes large errors more heavily than MAE.
            </p>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2">
            References: Cohen, J. (1960). A coefficient of agreement for nominal scales.
            Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data.
            McHugh, M. L. (2012). Interrater reliability: the kappa statistic.
          </div>
        </div>
      </section>
    </div>
  )
}
