-- ============================================
-- Migration 4: Analyses table
-- ============================================
-- Requires: 0001 (profiles), 0002 (icp_profiles), 0003 (companies)

CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  icp_profile_id UUID NOT NULL REFERENCES public.icp_profiles(id) ON DELETE CASCADE,

  -- Core scores (flat integers for querying/filtering)
  lead_score INTEGER NOT NULL,
  icp_match_percentage INTEGER NOT NULL,

  -- Complex nested data as JSONB
  component_scores JSONB NOT NULL,
  insights JSONB NOT NULL,
  pitch_angles JSONB NOT NULL,
  objections JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON public.analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_analyses_lead_score ON public.analyses(lead_score);

-- RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses function from migration 0001)
DROP TRIGGER IF EXISTS update_analyses_updated_at ON public.analyses;
CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
