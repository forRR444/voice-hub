-- =====================================================
-- カスタム質問フィールド対応マイグレーション
-- SupabaseのSQL Editorで実行してください
-- =====================================================

-- テスティモニアルにカスタムフィールド用のJSONBカラムを追加
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
