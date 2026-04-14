-- =====================================================
-- salon_pages: HP充実フィールド追加
-- =====================================================

ALTER TABLE salon_pages
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL
    CHECK (char_length(description) <= 2000),
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL
    CHECK (char_length(address) <= 200),
  ADD COLUMN IF NOT EXISTS google_map_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closed_days TEXT DEFAULT NULL
    CHECK (char_length(closed_days) <= 100),
  ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT NULL;

-- google_map_url は https のみ許可
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'salon_pages_google_map_url_check'
  ) THEN
    ALTER TABLE salon_pages
      ADD CONSTRAINT salon_pages_google_map_url_check
        CHECK (google_map_url IS NULL OR google_map_url ~ '^https://');
  END IF;
END $$;

COMMENT ON COLUMN salon_pages.description IS 'サロン紹介文（最大2000文字）';
COMMENT ON COLUMN salon_pages.address IS '住所テキスト（最大200文字）';
COMMENT ON COLUMN salon_pages.google_map_url IS 'GoogleマップURL';
COMMENT ON COLUMN salon_pages.business_hours IS '営業時間 {text: string}';
COMMENT ON COLUMN salon_pages.closed_days IS '定休日テキスト（最大100文字）';
COMMENT ON COLUMN salon_pages.menu_items IS 'メニュー/料金一覧 [{name, price, description}]';
