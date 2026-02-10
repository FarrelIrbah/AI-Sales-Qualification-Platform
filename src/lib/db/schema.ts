import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, unique } from 'drizzle-orm/pg-core'
import type {
  ComponentScore,
  PitchAngle,
  PredictedObjection,
  CompanyInsights,
} from '@/lib/analysis/schemas'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Type exports for use throughout the app
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

// JSONB column types for ICP profiles
export interface TargetCriteria {
  idealCompanySizes: string[]
  targetIndustries: string[]
  targetLocations: string[]
  techRequirements: string[]
  budgetRange?: { min?: number; max?: number }
}

export interface ValueProposition {
  headline: string
  description: string
  differentiators: string[]
}

export interface Objection {
  objection: string
  suggestedResponse?: string
}

export const icpProfiles = pgTable('icp_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Company info (flat fields for common queries)
  productDescription: text('product_description').notNull(),
  industry: text('industry').notNull(),
  companySize: text('company_size').notNull(), // solo/small/medium/large/enterprise
  targetMarket: text('target_market').notNull(), // b2b/b2c/both

  // Complex nested data as JSONB
  targetCriteria: jsonb('target_criteria').$type<TargetCriteria>().notNull(),
  valuePropositions: jsonb('value_propositions').$type<ValueProposition[]>().notNull(),
  commonObjections: jsonb('common_objections').$type<Objection[]>().notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Type exports for ICP profiles
export type IcpProfile = typeof icpProfiles.$inferSelect
export type NewIcpProfile = typeof icpProfiles.$inferInsert

// Companies table - stores extracted company data
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Identifiers
  domain: text('domain').notNull(),
  url: text('url').notNull(),

  // Core data
  name: text('name').notNull(),
  description: text('description'),
  industry: text('industry'),
  employeeCount: text('employee_count'),
  location: text('location'),
  foundedYear: text('founded_year'),

  // Arrays as JSONB
  techStack: jsonb('tech_stack').$type<string[]>().default([]),
  emails: jsonb('emails').$type<string[]>().default([]),
  phones: jsonb('phones').$type<string[]>().default([]),

  // Social/meta
  linkedIn: text('linkedin'),
  twitter: text('twitter'),
  logoUrl: text('logo_url'),

  // Extraction metadata
  extractionSources: jsonb('extraction_sources').$type<string[]>().default([]),
  extractionConfidence: text('extraction_confidence'), // high/medium/low

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Type exports for companies
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert

// Analyses table - stores AI-generated lead analysis results
export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  icpProfileId: uuid('icp_profile_id')
    .notNull()
    .references(() => icpProfiles.id, { onDelete: 'cascade' }),

  // Core scores (flat for querying/filtering in Phase 5)
  leadScore: integer('lead_score').notNull(),
  icpMatchPercentage: integer('icp_match_percentage').notNull(),

  // Complex nested data as JSONB
  componentScores: jsonb('component_scores').$type<ComponentScore[]>().notNull(),
  insights: jsonb('insights').$type<CompanyInsights>().notNull(),
  pitchAngles: jsonb('pitch_angles').$type<PitchAngle[]>().notNull(),
  objections: jsonb('objections').$type<PredictedObjection[]>().notNull(),

  // Dashboard management
  isArchived: boolean('is_archived').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Type exports for analyses
export type Analysis = typeof analyses.$inferSelect
export type NewAnalysis = typeof analyses.$inferInsert

// Expert component score type for validation ratings
export interface ExpertComponentScore {
  name: string
  score: number
  reasoning: string
}

// Expert ratings table - stores expert evaluations of AI analyses
export const expertRatings = pgTable('expert_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Expert info
  expertName: text('expert_name').notNull(),
  expertRole: text('expert_role'),

  // Scores (same dimensions as AI)
  leadScore: integer('lead_score').notNull(),
  icpMatchPercentage: integer('icp_match_percentage').notNull(),
  category: text('category').notNull(), // hot/warm/cold

  // Component scores as JSONB
  componentScores: jsonb('component_scores').$type<ExpertComponentScore[]>().notNull(),

  // Rating metadata
  blindRating: boolean('blind_rating').default(false).notNull(),
  notes: text('notes'),
  ratingDurationSeconds: integer('rating_duration_seconds'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.analysisId, table.expertName),
])

export type ExpertRating = typeof expertRatings.$inferSelect
export type NewExpertRating = typeof expertRatings.$inferInsert

// Field validation status
export interface FieldValidation {
  status: 'correct' | 'incorrect' | 'partial'
  correctedValue?: string
  notes?: string
}

// Data extraction validations table
export const dataExtractionValidations = pgTable('data_extraction_validations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),

  // Expert info
  expertName: text('expert_name').notNull(),

  // Per-field validations as JSONB
  fieldValidations: jsonb('field_validations').$type<Record<string, FieldValidation>>().notNull(),

  // Overall assessment
  overallAccuracy: text('overall_accuracy'), // high/medium/low
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.companyId, table.expertName),
])

export type DataExtractionValidation = typeof dataExtractionValidations.$inferSelect
export type NewDataExtractionValidation = typeof dataExtractionValidations.$inferInsert
