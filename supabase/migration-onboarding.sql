-- =====================================================
-- VoiceHub オンボーディング対応マイグレーション
-- SupabaseのSQL Editorで実行してください
-- =====================================================

-- workspacesテーブルにオンボーディング完了フラグを追加
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 既存ユーザー（フォームを持っている人）はオンボーディング完了済みとする
UPDATE workspaces SET onboarding_completed = true
WHERE id IN (SELECT DISTINCT workspace_id FROM forms);
