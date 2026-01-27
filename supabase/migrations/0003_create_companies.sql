-- Companies table for storing extracted company data
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for user queries
CREATE INDEX idx_companies_user_id ON companies(user_id);

-- Index for domain lookups (check if company already analyzed)
CREATE INDEX idx_companies_domain ON companies(domain);

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Users can only see their own companies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own companies
CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own companies
CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();
