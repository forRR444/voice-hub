-- =====================================================
-- Security Hardening Migration
-- Supabase advisor の WARN を解消する
-- =====================================================
-- 適用先: supabase project ritkedehykpiqhyebgei
-- 関連: SECURITY.md（手動対応事項）
-- =====================================================

-- -----------------------------------------------------
-- 1. testimonials INSERT ポリシー強化
--   旧: WITH CHECK (true) で anon が任意の workspace_id /
--       status='approved' で偽口コミ投入可能だった。
--   新: 必ず status='pending' で投稿、form_id 必須、
--       form_id から逆引きした workspace_id と一致を強制、
--       is_featured を立てさせない。
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Anyone can submit testimonials" ON public.testimonials;

CREATE POLICY "Anyone can submit testimonials"
  ON public.testimonials FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND COALESCE(is_featured, false) = false
    AND form_id IS NOT NULL
    AND source = 'form'
    AND EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = testimonials.form_id
        AND f.workspace_id = testimonials.workspace_id
    )
  );

-- -----------------------------------------------------
-- 2. SECURITY DEFINER 関数の search_path 固定
--   advisor lint: function_search_path_mutable
-- -----------------------------------------------------

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.published_salon_workspace_ids()
  SET search_path = public, pg_temp;

-- -----------------------------------------------------
-- 3. handle_new_user の EXECUTE 権限縮小
--   トリガー関数なので RPC 経由で叩かれる必要は無い。
--   anon / authenticated / PUBLIC から EXECUTE を剥奪。
--   トリガーは関数所有者権限で動くので影響なし。
-- -----------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- -----------------------------------------------------
-- 4. rls_auto_enable の EXECUTE 権限縮小
--   イベントトリガー関数なので RPC 経由で叩かれる必要は無い。
-- -----------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- -----------------------------------------------------
-- 5. avatars バケットの listing 公開を停止
--   public バケットは CDN 経由でオブジェクト URL が読める
--   ため、storage.objects への SELECT ポリシーを残す
--   必要が無い。残すと一覧列挙されてしまう。
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- -----------------------------------------------------
-- 6. published_salon_workspace_ids / get_widget_public_data
--   anon EXECUTE は意図的に維持（公開ページ・ウィジェット
--   レンダリングで必要）。advisor 警告は許容する。
-- -----------------------------------------------------

-- -----------------------------------------------------
-- 注: Auth leaked password protection は Supabase
-- ダッシュボードの Auth 設定なので SQL では変更不可。
-- SECURITY.md に手順を記載。
-- -----------------------------------------------------
