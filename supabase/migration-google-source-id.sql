-- Google口コミの重複インポート防止
-- source_id: Googleのレビューリソース名（例: places/xxx/reviews/yyy）を保存
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS source_id TEXT;

-- workspace_id + source_id のユニーク制約（source_idがNULLの場合は除外）
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_unique_source
  ON testimonials (workspace_id, source_id)
  WHERE source_id IS NOT NULL;
