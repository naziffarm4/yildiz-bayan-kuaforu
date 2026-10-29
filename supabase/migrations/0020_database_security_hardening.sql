-- ============================================================================
-- YILDIZ BAYAN KUAFÖRÜ - Database Security Hardening (G-11)
-- 0020_database_security_hardening.sql
-- ============================================================================

-- 1. SECURITY DEFINER fonksiyonlarında search_path sabitlemesi (SET search_path = '')
ALTER FUNCTION public.get_auth_user_role() SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.is_staff_or_admin() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.enforce_customer_appointment_constraints() SET search_path = '';
ALTER FUNCTION public.expire_pending_appointments() SET search_path = '';
ALTER FUNCTION public.prevent_self_role_escalation() SET search_path = '';
ALTER FUNCTION public.toggle_gallery_like(UUID, UUID, TEXT) SET search_path = '';

-- 2. Çift uygulama çözümü: expire_pending_appointments yalnızca service_role tarafından çağrılabilir
-- (Çalışma saatlerini dikkate alan asıl mantık /api/cron/expire-appointments rotasındadır)
REVOKE ALL ON FUNCTION public.expire_pending_appointments() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_appointments() TO service_role;

-- 3. En Az Ayrıcalık (Least Privilege) Yetki Sıkılaştırması
-- 0003_fix_permissions.sql içindeki aşırı GRANT ALL yetkilerini geri al
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM PUBLIC, anon, authenticated;

-- anon rolü için yalnızca herkese açık vitrin tablolarında SELECT yetkisi
GRANT SELECT ON
  public.services,
  public.gallery_items,
  public.gallery_comments,
  public.site_settings,
  public.customer_reviews
TO anon;

-- authenticated rolü için RLS politikalarıyla korunan tablo yetkileri (TRUNCATE/REFERENCES/TRIGGER hariç)
GRANT SELECT ON
  public.profiles,
  public.staff_details,
  public.customer_notes,
  public.services,
  public.appointments,
  public.suppliers,
  public.inventory,
  public.payments,
  public.loyalty_ledger,
  public.site_settings,
  public.gallery_items,
  public.gallery_comments,
  public.gallery_likes,
  public.customer_reviews
TO authenticated;

GRANT INSERT ON
  public.profiles,
  public.appointments,
  public.gallery_comments,
  public.gallery_likes,
  public.customer_reviews
TO authenticated;

GRANT UPDATE (ad, soyad, eposta) ON public.profiles TO authenticated;
GRANT UPDATE ON public.appointments TO authenticated;
GRANT DELETE ON public.gallery_likes TO authenticated;

-- Personel ve Admin RLS politikalarının doğrudan oturumla çalışabilmesi için gereken DML yetkileri
GRANT INSERT, UPDATE, DELETE ON
  public.services,
  public.gallery_items,
  public.gallery_comments,
  public.customer_reviews,
  public.site_settings,
  public.suppliers,
  public.inventory,
  public.payments,
  public.loyalty_ledger,
  public.customer_notes,
  public.staff_details,
  public.appointments
TO authenticated;

-- TRUNCATE, REFERENCES ve TRIGGER yetkilerinin kesin olarak kapalı kalmasını garanti et
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
