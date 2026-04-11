-- =====================================================
-- Salon Pages & Links
-- =====================================================
-- 既存のポリシー/テーブルがある場合は先に削除
DROP POLICY IF EXISTS "Owner can manage salon pages" ON salon_pages;
DROP POLICY IF EXISTS "Anyone can view published salon pages" ON salon_pages;
DROP POLICY IF EXISTS "Owner can manage salon page links" ON salon_page_links;
DROP POLICY IF EXISTS "Anyone can view links of published salon pages" ON salon_page_links;
DROP TABLE IF EXISTS salon_page_links;
DROP TABLE IF EXISTS salon_pages;

CREATE TABLE salon_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  salon_name TEXT NOT NULL DEFAULT '',
  tagline TEXT DEFAULT '' CHECK (char_length(tagline) <= 100),
  logo_url TEXT,
  theme TEXT NOT NULL DEFAULT 'natural'
    CHECK (theme IN ('natural', 'modern', 'elegant')),
  accent_color TEXT NOT NULL DEFAULT '#C4A882',
  cover_image_url TEXT,
  cover_image_position INTEGER NOT NULL DEFAULT 50,
  review_layout TEXT NOT NULL DEFAULT 'card'
    CHECK (review_layout IN ('list', 'grid', 'card', 'wall')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE salon_page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_page_id UUID NOT NULL REFERENCES salon_pages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'none'
    CHECK (icon IN ('line', 'instagram', 'phone', 'mail', 'map', 'web', 'none')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_salon_pages_workspace ON salon_pages(workspace_id);
CREATE INDEX idx_salon_pages_slug ON salon_pages(slug);
CREATE INDEX idx_salon_page_links_page ON salon_page_links(salon_page_id);

-- =====================================================
-- RLS: salon_pages
-- =====================================================
ALTER TABLE salon_pages ENABLE ROW LEVEL SECURITY;

-- オーナー: SELECT
CREATE POLICY "Owner can view own salon pages"
  ON salon_pages FOR SELECT
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- オーナー: INSERT
CREATE POLICY "Owner can create salon pages"
  ON salon_pages FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- オーナー: UPDATE
CREATE POLICY "Owner can update own salon pages"
  ON salon_pages FOR UPDATE
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- オーナー: DELETE
CREATE POLICY "Owner can delete own salon pages"
  ON salon_pages FOR DELETE
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- 公開ページ: 誰でも閲覧可
CREATE POLICY "Anyone can view published salon pages"
  ON salon_pages FOR SELECT
  USING (is_published = true);

-- =====================================================
-- RLS: salon_page_links
-- =====================================================
ALTER TABLE salon_page_links ENABLE ROW LEVEL SECURITY;

-- オーナー: SELECT
CREATE POLICY "Owner can view own salon page links"
  ON salon_page_links FOR SELECT
  USING (
    salon_page_id IN (
      SELECT sp.id FROM salon_pages sp
      JOIN workspaces w ON sp.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

-- オーナー: INSERT
CREATE POLICY "Owner can create salon page links"
  ON salon_page_links FOR INSERT
  WITH CHECK (
    salon_page_id IN (
      SELECT sp.id FROM salon_pages sp
      JOIN workspaces w ON sp.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

-- オーナー: UPDATE
CREATE POLICY "Owner can update own salon page links"
  ON salon_page_links FOR UPDATE
  USING (
    salon_page_id IN (
      SELECT sp.id FROM salon_pages sp
      JOIN workspaces w ON sp.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

-- オーナー: DELETE
CREATE POLICY "Owner can delete own salon page links"
  ON salon_page_links FOR DELETE
  USING (
    salon_page_id IN (
      SELECT sp.id FROM salon_pages sp
      JOIN workspaces w ON sp.workspace_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

-- 公開ページのリンク: 誰でも閲覧可
CREATE POLICY "Anyone can view links of published salon pages"
  ON salon_page_links FOR SELECT
  USING (
    salon_page_id IN (
      SELECT id FROM salon_pages WHERE is_published = true
    )
  );

-- =====================================================
-- Table-level grants
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON salon_pages TO authenticated;
GRANT SELECT ON salon_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON salon_page_links TO authenticated;
GRANT SELECT ON salon_page_links TO anon;
