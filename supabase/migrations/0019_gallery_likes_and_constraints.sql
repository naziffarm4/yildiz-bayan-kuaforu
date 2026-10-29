-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Gallery Likes Table & Atomic Counter Hardening (G-05)
-- 0019_gallery_likes_and_constraints.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gallery_likes (
  gallery_item_id UUID NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  olusturulma_tarihi TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  PRIMARY KEY (gallery_item_id, user_id)
);

ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_likes_select_own_or_staff" ON public.gallery_likes;
CREATE POLICY "gallery_likes_select_own_or_staff"
ON public.gallery_likes FOR SELECT
USING (auth.uid() = user_id OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "gallery_likes_insert_own" ON public.gallery_likes;
CREATE POLICY "gallery_likes_insert_own"
ON public.gallery_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gallery_likes_delete_own" ON public.gallery_likes;
CREATE POLICY "gallery_likes_delete_own"
ON public.gallery_likes FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

GRANT SELECT, INSERT, DELETE ON public.gallery_likes TO authenticated;
GRANT ALL ON public.gallery_likes TO service_role;

CREATE OR REPLACE FUNCTION public.toggle_gallery_like(
  p_gallery_id UUID,
  p_user_id UUID,
  p_action TEXT DEFAULT 'like'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_count INTEGER;
  v_changed INTEGER := 0;
BEGIN
  IF p_action = 'unlike' THEN
    DELETE FROM public.gallery_likes
    WHERE gallery_item_id = p_gallery_id AND user_id = p_user_id;
    GET DIAGNOSTICS v_changed = ROW_COUNT;

    IF v_changed > 0 THEN
      UPDATE public.gallery_items
      SET begeni_sayisi = GREATEST(0, COALESCE(begeni_sayisi, 0) - 1)
      WHERE id = p_gallery_id
      RETURNING begeni_sayisi INTO v_new_count;
    END IF;
  ELSE
    INSERT INTO public.gallery_likes (gallery_item_id, user_id)
    VALUES (p_gallery_id, p_user_id)
    ON CONFLICT (gallery_item_id, user_id) DO NOTHING;
    GET DIAGNOSTICS v_changed = ROW_COUNT;

    IF v_changed > 0 THEN
      UPDATE public.gallery_items
      SET begeni_sayisi = COALESCE(begeni_sayisi, 0) + 1
      WHERE id = p_gallery_id
      RETURNING begeni_sayisi INTO v_new_count;
    END IF;
  END IF;

  IF v_new_count IS NULL THEN
    SELECT COALESCE(begeni_sayisi, 0) INTO v_new_count
    FROM public.gallery_items
    WHERE id = p_gallery_id;
  END IF;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_gallery_like(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_gallery_like(UUID, UUID, TEXT) TO authenticated, service_role;
