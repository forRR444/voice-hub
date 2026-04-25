-- =====================================================
-- Widget Public Endpoint: SECURITY DEFINER RPC
-- 公開GETエンドポイント (/api/widgets/[widgetId]) が
-- SERVICE_ROLE_KEY を使わず anon key で動作するための関数
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_widget_public_data(p_widget_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_widget RECORD;
  v_subscription_status TEXT;
  v_testimonials jsonb;
  v_max_items INT;
BEGIN
  SELECT id, workspace_id, type, theme, filter_min_rating, only_featured
    INTO v_widget
    FROM public.widgets
   WHERE id = p_widget_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT subscription_status
    INTO v_subscription_status
    FROM public.workspaces
   WHERE id = v_widget.workspace_id;

  v_max_items := COALESCE((v_widget.theme->>'maxItems')::INT, 10);

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
    INTO v_testimonials
  FROM (
    SELECT id, name, title, company, avatar_url, rating, content,
           before_story, is_featured, submitted_at
      FROM public.testimonials
     WHERE workspace_id = v_widget.workspace_id
       AND status = 'approved'
       AND source NOT IN ('sample', 'guide')
       AND rating >= COALESCE(v_widget.filter_min_rating, 1)
       AND (NOT v_widget.only_featured OR is_featured = true)
     ORDER BY submitted_at DESC
     LIMIT v_max_items
  ) t;

  RETURN jsonb_build_object(
    'widget', jsonb_build_object(
      'id', v_widget.id,
      'type', v_widget.type,
      'theme', v_widget.theme,
      'filter_min_rating', v_widget.filter_min_rating,
      'only_featured', v_widget.only_featured
    ),
    'subscription_status', v_subscription_status,
    'testimonials', v_testimonials
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_widget_public_data(UUID) TO anon, authenticated;
