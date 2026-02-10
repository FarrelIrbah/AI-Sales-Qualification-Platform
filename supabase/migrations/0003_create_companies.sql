-- ============================================
-- Migration 3: Companies table
-- ============================================
-- Requires: 0001 (profiles)

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Identifiers
  domain TEXT NOT NULL,
  url TEXT NOT NULL,

  -- Core data
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  employee_count TEXT,
  location TEXT,
  founded_year TEXT,

  -- Arrays as JSONB
  tech_stack JSONB DEFAULT '[]'::JSONB,
  emails JSONB DEFAULT '[]'::JSONB,
  phones JSONB DEFAULT '[]'::JSONB,

  -- Social/meta
  linkedin TEXT,
  twitter TEXT,
  logo_url TEXT,

  -- Extraction metadata
  extraction_sources JSONB DEFAULT '[]'::JSONB,
  extraction_confidence TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger (reuses function from migration 0001)
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
