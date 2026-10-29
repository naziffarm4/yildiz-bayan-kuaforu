-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Gallery Like RPC Security Patch (YN-1)
-- 0022_gallery_like_security_patch.sql
-- ============================================================================

-- Eski 3 parametreli fonksiyonu kaldır (p_user_id dışarıdan alınarak sahtelenebiliyordu)
DROP FUNCTION IF EXISTS public.toggle_gallery_like(UUID, UUID, TEXT);

-- Yalnızca oturum açmış kullanıcının kendi auth.uid() kimliğiyle işlem yapabilen atomik RPC
CREATE OR REPLACE FUNCTION public.toggle_gallery_like(
  p_gallery_id UUID,
  p_action TEXT DEFAULT 'like'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_new_count INTEGER;
  v_changed INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Giriş yapılması zorunludur.';
  END IF;

  IF p_action = 'unlike' THEN
    DELETE FROM public.gallery_likes
    WHERE gallery_item_id = p_gallery_id AND user_id = v_uid;
    GET DIAGNOSTICS v_changed = ROW_COUNT;

    IF v_changed > 0 THEN
      UPDATE public.gallery_items
      SET begeni_sayisi = GREATEST(0, COALESCE(begeni_sayisi, 0) - 1)
      WHERE id = p_gallery_id
      RETURNING begeni_sayisi INTO v_new_count;
    END IF;
  ELSE
    INSERT INTO public.gallery_likes (gallery_item_id, user_id)
    VALUES (p_gallery_id, v_uid)
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

REVOKE EXECUTE ON FUNCTION public.toggle_gallery_like(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_gallery_like(UUID, TEXT) TO authenticated, service_role;
