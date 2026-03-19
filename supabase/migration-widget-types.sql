-- =====================================================
-- ウィジェットタイプ追加マイグレーション
-- SupabaseのSQL Editorで実行してください
-- =====================================================

ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('carousel', 'grid', 'marquee', 'list', 'single', 'wall', 'badge'));
