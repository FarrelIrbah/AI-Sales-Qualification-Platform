-- ============================================
-- Migration 7: Data extraction validations table
-- ============================================
-- Requires: 0001 (profiles), 0003 (companies)

CREATE TABLE IF NOT EXISTS public.data_extraction_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Expert info
  expert_name TEXT NOT NULL,

  -- Per-field validations as JSONB {fieldName: {status, correctedValue?, notes?}}
  field_validations JSONB NOT NULL,

  -- Overall assessment
  overall_accuracy TEXT CHECK (overall_accuracy IN ('high', 'medium', 'low')),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One validation per expert per company
  UNIQUE(company_id, expert_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_extraction_validations_company_id ON public.data_extraction_validations(company_id);
CREATE INDEX IF NOT EXISTS idx_extraction_validations_user_id ON public.data_extraction_validations(user_id);

-- RLS
ALTER TABLE public.data_extraction_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extraction validations"
  ON public.data_extraction_validations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extraction validations"
  ON public.data_extraction_validations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extraction validations"
  ON public.data_extraction_validations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own extraction validations"
  ON public.data_extraction_validations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses function from migration 0001)
DROP TRIGGER IF EXISTS update_extraction_validations_updated_at ON public.data_extraction_validations;
CREATE TRIGGER update_extraction_validations_updated_at
  BEFORE UPDATE ON public.data_extraction_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
