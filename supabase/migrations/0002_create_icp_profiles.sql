-- ============================================
-- Migration 2: ICP Profiles table
-- ============================================
-- Requires: 0001 (profiles)

CREATE TABLE IF NOT EXISTS public.icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Company info
  product_description TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL,
  target_market TEXT NOT NULL,

  -- Complex nested data as JSONB
  target_criteria JSONB NOT NULL,
  value_propositions JSONB NOT NULL,
  common_objections JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One ICP per user (unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS icp_profiles_user_id_idx ON public.icp_profiles(user_id);

-- RLS
ALTER TABLE public.icp_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ICP profile"
  ON public.icp_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ICP profile"
  ON public.icp_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ICP profile"
  ON public.icp_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ICP profile"
  ON public.icp_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Updated_at trigger (reuses function from migration 0001)
DROP TRIGGER IF EXISTS update_icp_profiles_updated_at ON public.icp_profiles;
CREATE TRIGGER update_icp_profiles_updated_at
  BEFORE UPDATE ON public.icp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
