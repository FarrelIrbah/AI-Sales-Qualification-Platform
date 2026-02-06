-- Migration: Create analyses table
-- Phase: 04-ai-analysis
-- Stores AI-generated lead analysis results

CREATE TABLE "analyses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "icp_profile_id" uuid NOT NULL,
  "lead_score" integer NOT NULL,
  "icp_match_percentage" integer NOT NULL,
  "component_scores" jsonb NOT NULL,
  "insights" jsonb NOT NULL,
  "pitch_angles" jsonb NOT NULL,
  "objections" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign key constraints with cascade delete
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "analyses" ADD CONSTRAINT "analyses_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "analyses" ADD CONSTRAINT "analyses_icp_profile_id_icp_profiles_id_fk"
  FOREIGN KEY ("icp_profile_id") REFERENCES "public"."icp_profiles"("id") ON DELETE cascade ON UPDATE no action;
