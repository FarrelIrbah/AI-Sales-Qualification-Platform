-- Create ICP profiles table
CREATE TABLE IF NOT EXISTS public.icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Company info (flat fields for common queries)
  product_description TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL, -- solo/small/medium/large/enterprise
  target_market TEXT NOT NULL, -- b2b/b2c/both

  -- Complex nested data as JSONB
  target_criteria JSONB NOT NULL,
  value_propositions JSONB NOT NULL,
  common_objections JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user lookups (each user has one ICP)
CREATE UNIQUE INDEX IF NOT EXISTS icp_profiles_user_id_idx ON public.icp_profiles(user_id);

-- Enable RLS
ALTER TABLE public.icp_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own ICP profile
CREATE POLICY "Users can view own ICP profile"
  ON public.icp_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ICP profile"
  ON public.icp_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ICP profile"
  ON public.icp_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ICP profile"
  ON public.icp_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_icp_profiles_updated_at ON public.icp_profiles;
CREATE TRIGGER update_icp_profiles_updated_at
  BEFORE UPDATE ON public.icp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
