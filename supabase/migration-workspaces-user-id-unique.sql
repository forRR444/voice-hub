-- =====================================================
-- workspaces.user_id に UNIQUE 制約を追加
-- 1 ユーザー = 1 ワークスペースの不変条件を DB レベルで保証する
-- 既存データに重複がある場合は中止（手動で重複解消後に再実行）
-- handle_new_user() trigger も冪等化（ON CONFLICT DO NOTHING）
-- =====================================================

-- Step 1: 既存データの重複検出（重複があれば中止）
DO $$
DECLARE
  duplicate_count int;
BEGIN
  SELECT COUNT(*) INTO duplicate_count FROM (
    SELECT user_id FROM public.workspaces GROUP BY user_id HAVING COUNT(*) > 1
  ) s;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'workspaces.user_id に % 件の重複が見つかりました。重複を解消してから再実行してください。',
      duplicate_count;
  END IF;
END $$;

-- Step 2: UNIQUE 制約追加（既存があれば一旦削除して再作成）
ALTER TABLE public.workspaces DROP CONSTRAINT IF EXISTS workspaces_user_id_unique;
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_user_id_unique UNIQUE (user_id);

-- Step 3: 重複インデックス削除（UNIQUE 制約が等価なインデックスを自動生成するため）
DROP INDEX IF EXISTS public.idx_workspaces_user;

-- Step 4: handle_new_user() trigger を冪等化
-- auth.users 再 INSERT 時のレースで signup がブロックされないように
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.workspaces (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'マイワークスペース'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
