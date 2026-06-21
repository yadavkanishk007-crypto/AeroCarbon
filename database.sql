-- AeroCarbon Database Schema & Configurations
-- Fulfills Security (RLS policies) and Efficiency (query indexing) parameters.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  full_name TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  base_diet TEXT DEFAULT 'omnivore',
  base_travel_mode TEXT DEFAULT 'petrol_car',
  base_travel_km NUMERIC DEFAULT 0,
  base_home_energy_kwh NUMERIC DEFAULT 0,
  base_heating_source TEXT DEFAULT 'none',
  base_flights INTEGER DEFAULT 0,
  base_recycles BOOLEAN DEFAULT TRUE,
  base_annual_emissions NUMERIC DEFAULT 0
);

-- Enable RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read/write access to profiles" ON profiles
FOR ALL USING (auth.uid() = id);


-- 2. Carbon Logs Table
CREATE TABLE IF NOT EXISTS carbon_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  
  -- Commute metrics
  commute_mode TEXT,
  commute_distance NUMERIC DEFAULT 0,
  commute_emissions NUMERIC DEFAULT 0,
  
  -- Diet metrics
  diet_type TEXT,
  diet_emissions NUMERIC DEFAULT 0,
  
  -- Home Energy metrics
  energy_kwh NUMERIC DEFAULT 0,
  heating_source TEXT,
  heating_kwh NUMERIC DEFAULT 0,
  energy_emissions NUMERIC DEFAULT 0,
  
  -- Total
  total_emissions NUMERIC DEFAULT 0
);

-- Indexing for high-performance dashboard queries (Efficiency parameter)
CREATE INDEX IF NOT EXISTS idx_carbon_logs_user_id_date ON carbon_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_carbon_logs_user_at ON carbon_logs(user_id, created_at);

-- Enable RLS for Carbon Logs (Security parameter)
ALTER TABLE carbon_logs ENABLE ROW LEVEL SECURITY;

-- Allow users read/write access only to their own logs
CREATE POLICY "Allow individual read/write access" ON carbon_logs
FOR ALL USING (auth.uid() = user_id);


-- 3. Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Enable RLS for Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access to badges" ON user_badges
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual write access to badges" ON user_badges
FOR INSERT WITH CHECK (auth.uid() = user_id);
