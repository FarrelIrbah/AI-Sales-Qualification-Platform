# Phase 6 Context: AI Validation

## User Decision

Full in-app validation framework — not a standalone script. The validation UI is integrated into the application as a `/validation` route accessible from the main navigation.

## Academic Foundation

| Paper | Contribution |
|-------|-------------|
| Cohen (1960) | Cohen's Kappa for inter-rater reliability |
| Landis & Koch (1977) | Interpretation thresholds for Kappa values |
| McHugh (2012) | Interrater reliability: the kappa statistic |
| Zheng et al. (2023) | AI validation methodology patterns |

## Statistical Methods

| Method | Why Chosen |
|--------|-----------|
| Cohen's Kappa | Standard for categorical agreement (Hot/Warm/Cold) |
| Weighted Kappa | Accounts for ordinal distance between categories |
| Pearson Correlation | Measures linear relationship between numeric scores |
| Confusion Matrix | Visual representation of classification accuracy |
| Precision/Recall/F1 | Per-category classification performance |
| MAE/RMSE | Quantifies numeric score differences |

## Minimum Requirements

- 10 analyses rated by experts
- 3+ independent expert raters
- Blind rating mode available to reduce bias

## Architecture Decisions

- No `validation_metrics` table — metrics computed on-the-fly in server components
- Expert ratings use UNIQUE(analysis_id, expert_name) for upsert behavior
- Blind mode hides AI scores during rating to reduce anchoring bias
- Duration timer auto-tracked in the rating form
