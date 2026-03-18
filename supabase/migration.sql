-- =====================================================
-- VoiceHub Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- ワークスペース
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 収集フォーム
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'お客様の声をお聞かせください',
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_color TEXT DEFAULT '#635BFF',
  logo_url TEXT,
  thank_you_message TEXT DEFAULT 'ご回答ありがとうございました！',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- テスティモニアル
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  form_id UUID REFERENCES forms(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  before_story TEXT,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT false,
  permission_granted BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'form',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ウィジェット設定
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'carousel'
    CHECK (type IN ('carousel', 'grid', 'list', 'single')),
  theme JSONB NOT NULL DEFAULT '{
    "mode": "light",
    "brandColor": "#635BFF",
    "showRating": true,
    "showAvatar": true,
    "showDate": false,
    "maxItems": 10,
    "autoplay": true
  }'::jsonb,
  filter_min_rating INTEGER DEFAULT 1,
  only_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- タグ
CREATE TABLE testimonial_tags (
  testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (testimonial_id, tag)
);

-- インデックス
CREATE INDEX idx_testimonials_workspace ON testimonials(workspace_id);
CREATE INDEX idx_testimonials_status ON testimonials(workspace_id, status);
CREATE INDEX idx_widgets_workspace ON widgets(workspace_id);
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_workspaces_stripe ON workspaces(stripe_customer_id);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_tags ENABLE ROW LEVEL SECURITY;

-- Workspaces: owner only
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id);

-- Forms: owner can manage, anon can view (for public form)
CREATE POLICY "Owner can manage forms"
  ON forms FOR ALL
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view forms by slug"
  ON forms FOR SELECT
  USING (true);

-- Testimonials: owner can manage, anon can insert (form submission) and view approved
CREATE POLICY "Owner can manage testimonials"
  ON testimonials FOR ALL
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can submit testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view approved testimonials"
  ON testimonials FOR SELECT
  USING (status = 'approved');

-- Widgets: owner can manage, anon can view (for widget rendering)
CREATE POLICY "Owner can manage widgets"
  ON widgets FOR ALL
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view widgets"
  ON widgets FOR SELECT
  USING (true);

-- Tags: owner can manage, anon can view (for widget rendering)
CREATE POLICY "Owner can manage tags"
  ON testimonial_tags FOR ALL
  USING (
    testimonial_id IN (
      SELECT t.id FROM testimonials t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view tags of approved testimonials"
  ON testimonial_tags FOR SELECT
  USING (
    testimonial_id IN (
      SELECT id FROM testimonials WHERE status = 'approved'
    )
  );

-- =====================================================
-- Storage bucket for avatars
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- =====================================================
-- Function: auto-create workspace on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.workspaces (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'マイワークスペース'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
