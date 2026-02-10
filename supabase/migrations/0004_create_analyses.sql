-- Migration: Create analyses table
-- Phase: 04-ai-analysis
-- Stores AI-generated lead analysis results

CREATE TABLE IF NOT EXISTS "analyses" (
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_analyses_lead_score ON analyses(lead_score);

-- Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_analyses_updated_at();
