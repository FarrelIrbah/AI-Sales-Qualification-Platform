-- ============================================
-- Migration 6: Expert ratings table
-- ============================================
-- Requires: 0001 (profiles), 0004 (analyses)

CREATE TABLE IF NOT EXISTS public.expert_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Expert info
  expert_name TEXT NOT NULL,
  expert_role TEXT,

  -- Scores (same dimensions as AI)
  lead_score INTEGER NOT NULL CHECK (lead_score >= 0 AND lead_score <= 100),
  icp_match_percentage INTEGER NOT NULL CHECK (icp_match_percentage >= 0 AND icp_match_percentage <= 100),
  category TEXT NOT NULL CHECK (category IN ('hot', 'warm', 'cold')),

  -- Component scores as JSONB [{name, score, reasoning}]
  component_scores JSONB NOT NULL,

  -- Rating metadata
  blind_rating BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  rating_duration_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One rating per expert per analysis
  UNIQUE(analysis_id, expert_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expert_ratings_analysis_id ON public.expert_ratings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_expert_ratings_user_id ON public.expert_ratings(user_id);

-- RLS
ALTER TABLE public.expert_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expert ratings"
  ON public.expert_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expert ratings"
  ON public.expert_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expert ratings"
  ON public.expert_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expert ratings"
  ON public.expert_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses function from migration 0001)
DROP TRIGGER IF EXISTS update_expert_ratings_updated_at ON public.expert_ratings;
CREATE TRIGGER update_expert_ratings_updated_at
  BEFORE UPDATE ON public.expert_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
