/**
 * Statistical Validation Engine
 *
 * Pure functions for computing inter-rater reliability and classification metrics.
 * No database or server dependencies — operates on arrays of values.
 *
 * References:
 * - Cohen (1960): A coefficient of agreement for nominal scales
 * - Landis & Koch (1977): The measurement of observer agreement for categorical data
 * - McHugh (2012): Interrater reliability: the kappa statistic
 */

// ============================================
// Types
// ============================================

export type Category = 'hot' | 'warm' | 'cold'
export const CATEGORIES: Category[] = ['hot', 'warm', 'cold']

export interface ConfusionMatrix {
  matrix: number[][] // [predicted][actual] — rows = AI, cols = Expert
  labels: Category[]
  total: number
}

export interface KappaResult {
  kappa: number
  interpretation: string
  observedAgreement: number
  expectedAgreement: number
}

export interface PearsonResult {
  r: number
  pValue: number
  n: number
}

export interface ClassificationMetrics {
  precision: number
  recall: number
  f1: number
  support: number
}

export interface ExtractionFieldMetrics {
  field: string
  correct: number
  incorrect: number
  partial: number
  total: number
  accuracy: number
}

// ============================================
// Cohen's Kappa
// ============================================

/**
 * Calculate Cohen's Kappa for categorical agreement.
 * k = (Po - Pe) / (1 - Pe)
 *
 * @param ratings1 - First rater's categories (e.g., AI predictions)
 * @param ratings2 - Second rater's categories (e.g., expert ratings)
 * @returns KappaResult with kappa value and interpretation
 */
export function cohensKappa(ratings1: Category[], ratings2: Category[]): KappaResult {
  if (ratings1.length !== ratings2.length || ratings1.length === 0) {
    return { kappa: 0, interpretation: 'Insufficient data', observedAgreement: 0, expectedAgreement: 0 }
  }

  const n = ratings1.length

  // Observed agreement (Po)
  let agreements = 0
  for (let i = 0; i < n; i++) {
    if (ratings1[i] === ratings2[i]) agreements++
  }
  const po = agreements / n

  // Expected agreement (Pe)
  let pe = 0
  for (const cat of CATEGORIES) {
    const count1 = ratings1.filter(r => r === cat).length
    const count2 = ratings2.filter(r => r === cat).length
    pe += (count1 / n) * (count2 / n)
  }

  // Kappa
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe)

  return {
    kappa,
    interpretation: interpretKappa(kappa),
    observedAgreement: po,
    expectedAgreement: pe,
  }
}

/**
 * Calculate Weighted (Quadratic) Kappa for ordinal categories.
 * Uses quadratic weights: w_ij = 1 - (i-j)^2 / (k-1)^2
 */
export function weightedKappa(ratings1: Category[], ratings2: Category[]): KappaResult {
  if (ratings1.length !== ratings2.length || ratings1.length === 0) {
    return { kappa: 0, interpretation: 'Insufficient data', observedAgreement: 0, expectedAgreement: 0 }
  }

  const n = ratings1.length
  const k = CATEGORIES.length
  const catIndex = (c: Category) => CATEGORIES.indexOf(c)

  // Build weight matrix (quadratic)
  const weights: number[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => 1 - Math.pow(i - j, 2) / Math.pow(k - 1, 2))
  )

  // Observed matrix
  const observed: number[][] = Array.from({ length: k }, () => Array(k).fill(0))
  for (let i = 0; i < n; i++) {
    observed[catIndex(ratings1[i])][catIndex(ratings2[i])]++
  }

  // Expected matrix
  const row = CATEGORIES.map(c => ratings1.filter(r => r === c).length)
  const col = CATEGORIES.map(c => ratings2.filter(r => r === c).length)
  const expected: number[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => (row[i] * col[j]) / n)
  )

  // Weighted Po and Pe
  let po = 0
  let pe = 0
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      po += weights[i][j] * (observed[i][j] / n)
      pe += weights[i][j] * (expected[i][j] / n)
    }
  }

  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe)

  return {
    kappa,
    interpretation: interpretKappa(kappa),
    observedAgreement: po,
    expectedAgreement: pe,
  }
}

/**
 * Interpret Kappa value using Landis & Koch (1977) thresholds.
 */
export function interpretKappa(k: number): string {
  if (k < 0) return 'Poor (less than chance)'
  if (k < 0.21) return 'Slight'
  if (k < 0.41) return 'Fair'
  if (k < 0.61) return 'Moderate'
  if (k < 0.81) return 'Substantial'
  return 'Almost Perfect'
}

// ============================================
// Pearson Correlation
// ============================================

/**
 * Calculate Pearson correlation coefficient with approximate p-value.
 * r = cov(x,y) / (std(x) * std(y))
 */
export function pearsonCorrelation(x: number[], y: number[]): PearsonResult {
  const n = x.length
  if (n !== y.length || n < 3) {
    return { r: 0, pValue: 1, n }
  }

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    sumXY += dx * dy
    sumX2 += dx * dx
    sumY2 += dy * dy
  }

  if (sumX2 === 0 || sumY2 === 0) {
    return { r: 0, pValue: 1, n }
  }

  const r = sumXY / Math.sqrt(sumX2 * sumY2)

  // Approximate p-value using t-distribution
  const t = r * Math.sqrt((n - 2) / (1 - r * r))
  const pValue = tDistributionPValue(Math.abs(t), n - 2)

  return { r, pValue, n }
}

/**
 * Approximate two-tailed p-value for t-distribution.
 * Uses the approximation from Abramowitz and Stegun.
 */
function tDistributionPValue(t: number, df: number): number {
  // For large df, approximate with normal distribution
  if (df > 100) {
    const z = t
    return 2 * (1 - normalCDF(z))
  }

  // Beta regularized incomplete function approximation
  const x = df / (df + t * t)
  const a = df / 2
  const b = 0.5

  // Approximate using the regularized incomplete beta function
  const betaInc = incompleteBeta(x, a, b)
  return betaInc
}

function normalCDF(z: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.SQRT2

  const t = 1.0 / (1.0 + p * z)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)

  return 0.5 * (1.0 + sign * y)
}

function incompleteBeta(x: number, a: number, b: number): number {
  // Simple continued fraction approximation for I_x(a,b)
  if (x === 0) return 0
  if (x === 1) return 1

  // Use series expansion for small x
  const maxIter = 200
  const eps = 1e-10

  let sum = 0
  let term = 1

  for (let n = 0; n < maxIter; n++) {
    term *= (n === 0 ? 1 : (n - b) / n) * x
    const contrib = term / (a + n)
    sum += contrib
    if (Math.abs(contrib) < eps) break
  }

  // Beta function approximation using Stirling
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  return Math.min(1, Math.max(0, (Math.pow(x, a) * sum) / Math.exp(logBeta)))
}

function logGamma(z: number): number {
  // Lanczos approximation
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }

  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i)
  }

  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

// ============================================
// Error Metrics
// ============================================

/**
 * Mean Absolute Error: sum(|predicted - actual|) / n
 */
export function meanAbsoluteError(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length === 0) return 0

  let sum = 0
  for (let i = 0; i < predicted.length; i++) {
    sum += Math.abs(predicted[i] - actual[i])
  }
  return sum / predicted.length
}

/**
 * Root Mean Square Error: sqrt(sum((predicted - actual)^2) / n)
 */
export function rootMeanSquareError(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length === 0) return 0

  let sum = 0
  for (let i = 0; i < predicted.length; i++) {
    sum += Math.pow(predicted[i] - actual[i], 2)
  }
  return Math.sqrt(sum / predicted.length)
}

// ============================================
// Confusion Matrix & Classification Metrics
// ============================================

/**
 * Build a 3x3 confusion matrix for Hot/Warm/Cold classification.
 * Rows = AI (predicted), Columns = Expert (actual).
 */
export function buildConfusionMatrix(predicted: Category[], actual: Category[]): ConfusionMatrix {
  const matrix = Array.from({ length: 3 }, () => Array(3).fill(0))

  for (let i = 0; i < predicted.length; i++) {
    const pIdx = CATEGORIES.indexOf(predicted[i])
    const aIdx = CATEGORIES.indexOf(actual[i])
    if (pIdx !== -1 && aIdx !== -1) {
      matrix[pIdx][aIdx]++
    }
  }

  return {
    matrix,
    labels: [...CATEGORIES],
    total: predicted.length,
  }
}

/**
 * Precision for a category: TP / (TP + FP)
 */
export function precision(cm: ConfusionMatrix, category: Category): number {
  const idx = CATEGORIES.indexOf(category)
  const tp = cm.matrix[idx][idx]
  let rowSum = 0
  for (let j = 0; j < CATEGORIES.length; j++) {
    rowSum += cm.matrix[idx][j]
  }
  return rowSum === 0 ? 0 : tp / rowSum
}

/**
 * Recall for a category: TP / (TP + FN)
 */
export function recall(cm: ConfusionMatrix, category: Category): number {
  const idx = CATEGORIES.indexOf(category)
  const tp = cm.matrix[idx][idx]
  let colSum = 0
  for (let i = 0; i < CATEGORIES.length; i++) {
    colSum += cm.matrix[i][idx]
  }
  return colSum === 0 ? 0 : tp / colSum
}

/**
 * F1 Score: 2 * precision * recall / (precision + recall)
 */
export function f1Score(p: number, r: number): number {
  return p + r === 0 ? 0 : (2 * p * r) / (p + r)
}

/**
 * Overall accuracy: correct predictions / total
 */
export function accuracy(cm: ConfusionMatrix): number {
  if (cm.total === 0) return 0
  let correct = 0
  for (let i = 0; i < CATEGORIES.length; i++) {
    correct += cm.matrix[i][i]
  }
  return correct / cm.total
}

/**
 * Macro F1: unweighted mean of per-class F1 scores
 */
export function macroF1(cm: ConfusionMatrix): number {
  let sum = 0
  let count = 0
  for (const cat of CATEGORIES) {
    const p = precision(cm, cat)
    const r = recall(cm, cat)
    const f1 = f1Score(p, r)
    sum += f1
    count++
  }
  return count === 0 ? 0 : sum / count
}

/**
 * Weighted F1: support-weighted mean of per-class F1 scores
 */
export function weightedF1(cm: ConfusionMatrix): number {
  if (cm.total === 0) return 0

  let sum = 0
  for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
    const cat = CATEGORIES[catIdx]
    const p = precision(cm, cat)
    const r = recall(cm, cat)
    const f1 = f1Score(p, r)

    // Support = actual count for this category (column sum)
    let support = 0
    for (let i = 0; i < CATEGORIES.length; i++) {
      support += cm.matrix[i][catIdx]
    }
    sum += f1 * support
  }
  return sum / cm.total
}

// ============================================
// Data Extraction Metrics
// ============================================

/**
 * Calculate per-field accuracy metrics from extraction validations.
 */
export function calculateExtractionMetrics(
  validations: Array<{ fieldValidations: Record<string, { status: string }> }>
): ExtractionFieldMetrics[] {
  const fieldCounts: Record<string, { correct: number; incorrect: number; partial: number }> = {}

  for (const v of validations) {
    for (const [field, val] of Object.entries(v.fieldValidations)) {
      if (!fieldCounts[field]) {
        fieldCounts[field] = { correct: 0, incorrect: 0, partial: 0 }
      }
      if (val.status === 'correct') fieldCounts[field].correct++
      else if (val.status === 'incorrect') fieldCounts[field].incorrect++
      else if (val.status === 'partial') fieldCounts[field].partial++
    }
  }

  return Object.entries(fieldCounts).map(([field, counts]) => {
    const total = counts.correct + counts.incorrect + counts.partial
    return {
      field,
      correct: counts.correct,
      incorrect: counts.incorrect,
      partial: counts.partial,
      total,
      accuracy: total === 0 ? 0 : counts.correct / total,
    }
  })
}

// ============================================
// Score-to-Category Helper
// ============================================

/**
 * Convert a numeric score to a category.
 * Matches the getScoreLabel thresholds: >= 70 hot, >= 40 warm, < 40 cold
 */
export function scoreToCategory(score: number): Category {
  if (score >= 70) return 'hot'
  if (score >= 40) return 'warm'
  return 'cold'
}
