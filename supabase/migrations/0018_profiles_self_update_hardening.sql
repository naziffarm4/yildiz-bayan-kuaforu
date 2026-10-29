-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Profiles Self-Update Column & Trigger Hardening (G-03)
-- 0018_profiles_self_update_hardening.sql
-- ============================================================================

-- 1. Sütun bazlı UPDATE yetki kısıtlaması:
-- İstemciden (authenticated) yalnızca ad, soyad ve eposta alanları güncellenebilir.
-- rol, toplam_puan, sms_dogrulandi ve telefon alanları doğrudan güncellenemez.
REVOKE UPDATE ON public.profiles FROM anon;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (ad, soyad, eposta) ON public.profiles TO authenticated;

-- 2. Tetikleyici sertleştirmesi (Derinlemesine Savunma / Defense in Depth):
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    public.is_admin()
    OR current_user IN ('service_role', 'postgres', 'supabase_admin')
    OR COALESCE(auth.role(), '') = 'service_role'
  ) THEN
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
      RAISE EXCEPTION 'Yetkisiz rol değişikliği: Rolünüzü değiştiremezsiniz.';
    END IF;

    IF NEW.toplam_puan IS DISTINCT FROM OLD.toplam_puan THEN
      RAISE EXCEPTION 'Yetkisiz puan değişikliği: Sadakat puanı doğrudan güncellenemez.';
    END IF;

    IF NEW.sms_dogrulandi IS DISTINCT FROM OLD.sms_dogrulandi THEN
      RAISE EXCEPTION 'Yetkisiz doğrulama durumu değişikliği: SMS doğrulama durumu doğrudan güncellenemez.';
    END IF;

    IF NEW.telefon IS DISTINCT FROM OLD.telefon THEN
      RAISE EXCEPTION 'Telefon numarası doğrudan değiştirilemez.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();
