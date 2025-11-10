-- User profiles table for onboarding data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location JSONB NOT NULL,
  demographics JSONB,
  economic JSONB,
  education_skills JSONB,
  constraints JSONB,
  goals JSONB,
  consent JSONB NOT NULL
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts only (no read access)
CREATE POLICY "anon_can_insert_profiles"
  ON public.user_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);
