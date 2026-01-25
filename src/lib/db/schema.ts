import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'

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
