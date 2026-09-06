-- ============================================================================
-- AutoMail AI - Database Schema
-- ============================================================================
-- Security: All tables have Row Level Security (RLS) enabled
-- Users can only access their own data
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Stores user profile information linked to Supabase Auth
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- VAULT_KEYS TABLE
-- ============================================================================
-- Stores encrypted API keys and credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS vault_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g., 'openai', 'resend', 'gmail'
  key_name TEXT NOT NULL, -- User-friendly name
  encrypted_value JSONB NOT NULL, -- Stores {iv, data, salt} from crypto.ts
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional provider-specific data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE vault_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vault_keys
CREATE POLICY "Users can view their own keys"
  ON vault_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keys"
  ON vault_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keys"
  ON vault_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keys"
  ON vault_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_keys_user_id ON vault_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_keys_provider ON vault_keys(provider);
CREATE INDEX IF NOT EXISTS idx_vault_keys_active ON vault_keys(is_active) WHERE is_active = true;

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
-- Stores contact information for email campaigns
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT, -- e.g., 'manual', 'csv_import', 'api'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);

-- Unique constraint: one email per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email);

-- ============================================================================
-- AUTOMATIONS TABLE
-- ============================================================================
-- Stores email automation workflows and campaigns
-- ============================================================================

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  
  -- Workflow configuration
  trigger_type TEXT NOT NULL, -- e.g., 'manual', 'scheduled', 'event'
  workflow_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Email template
  email_template JSONB NOT NULL DEFAULT '{}'::jsonb, -- {subject, body, variables}
  
  -- API keys used
  email_provider_key_id UUID REFERENCES vault_keys(id) ON DELETE SET NULL,
  ai_provider_key_id UUID REFERENCES vault_keys(id) ON DELETE SET NULL,
  
  -- Statistics
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automations
CREATE POLICY "Users can view their own automations"
  ON automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automations"
  ON automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
  ON automations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
  ON automations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_scheduled ON automations(scheduled_at) WHERE status = 'active';

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Automatically update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_keys_updated_at
  BEFORE UPDATE ON vault_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SENDER_IDENTITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sender_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sender_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sender identities"
  ON sender_identities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sender identities"
  ON sender_identities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sender identities"
  ON sender_identities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sender identities"
  ON sender_identities FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sender_identities_user_id ON sender_identities(user_id);

-- ============================================================================
-- WEBHOOK_KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook keys"
  ON webhook_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook keys"
  ON webhook_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook keys"
  ON webhook_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook keys"
  ON webhook_keys FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_keys_user_id ON webhook_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_keys_hash ON webhook_keys(key_hash);

-- ============================================================================
-- EMAIL_TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- ============================================================================
-- TAGS & CONTACT_TAGS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact tags"
  ON contact_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tags.contact_id AND contacts.user_id = auth.uid()));

CREATE POLICY "Users can insert contact tags"
  ON contact_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tags.contact_id AND contacts.user_id = auth.uid()));

CREATE POLICY "Users can delete contact tags"
  ON contact_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tags.contact_id AND contacts.user_id = auth.uid()));

-- ============================================================================
-- CUSTOM_FIELD_DEFINITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage custom field definitions"
  ON custom_field_definitions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATION_QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  execute_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their automation queue"
  ON automation_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM automations WHERE automations.id = automation_queue.automation_id AND automations.user_id = auth.uid()));

CREATE POLICY "Users can insert their automation queue"
  ON automation_queue FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM automations WHERE automations.id = automation_queue.automation_id AND automations.user_id = auth.uid()));

CREATE POLICY "Users can update their automation queue"
  ON automation_queue FOR UPDATE
  USING (EXISTS (SELECT 1 FROM automations WHERE automations.id = automation_queue.automation_id AND automations.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_automation_queue_status_exec ON automation_queue(status, execute_at);
CREATE INDEX IF NOT EXISTS idx_automation_queue_auto_id ON automation_queue(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_contact_id ON automation_queue(contact_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Atomic queue claim function for Cron runner
CREATE OR REPLACE FUNCTION claim_automation_jobs(batch_size INT)
RETURNS SETOF automation_queue AS $$
BEGIN
  RETURN QUERY
  UPDATE automation_queue
  SET status = 'processing',
      updated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM automation_queue
    WHERE status = 'pending'
      AND (execute_at IS NULL OR execute_at <= NOW())
    ORDER BY execute_at ASC NULLS FIRST, created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Function to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profile information linked to Supabase Auth';
COMMENT ON TABLE vault_keys IS 'Encrypted API keys and credentials storage';
COMMENT ON TABLE contacts IS 'Contact database for email campaigns';
COMMENT ON TABLE automations IS 'Email automation workflows and campaigns';
COMMENT ON TABLE sender_identities IS 'Verified sender names and email identities';
COMMENT ON TABLE webhook_keys IS 'Hashed API keys for incoming webhook ingest';
COMMENT ON TABLE email_templates IS 'User saved visual email templates and blocks';
COMMENT ON TABLE automation_queue IS 'Background execution queue for automation workflows';

