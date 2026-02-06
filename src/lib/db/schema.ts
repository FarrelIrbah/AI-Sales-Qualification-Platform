import { pgTable, uuid, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core'
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

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Type exports for analyses
export type Analysis = typeof analyses.$inferSelect
export type NewAnalysis = typeof analyses.$inferInsert
