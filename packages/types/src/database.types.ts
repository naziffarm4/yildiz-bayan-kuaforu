export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'Admin' | 'Calisan' | 'Musteri';
export type AppointmentStatus =
  | 'Beklemede'
  | 'Onaylandı'
  | 'Tamamlandı'
  | 'İptal Edildi'
  | 'Gelmedi'
  | 'Süresi Doldu';
export type AppointmentSource = 'Web' | 'Telefon' | 'WhatsApp' | 'İşletmeye Geldi';
export type PaymentMethod = 'Nakit' | 'Kart' | 'Havale_EFT' | 'Veresiye';
export type LoyaltyTransactionType = 'KAZANIM' | 'HARCAMA' | 'İADE' | 'DUZELTME';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          ad: string;
          soyad: string;
          telefon: string;
          eposta: string | null;
          rol: UserRole;
          toplam_puan: number;
          sms_dogrulandi: boolean;
          olusturulma_tarihi: string;
        };
        Insert: {
          id: string;
          ad: string;
          soyad: string;
          telefon: string;
          eposta?: string | null;
          rol?: UserRole;
          toplam_puan?: number;
          sms_dogrulandi?: boolean;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          ad?: string;
          soyad?: string;
          telefon?: string;
          eposta?: string | null;
          rol?: UserRole;
          toplam_puan?: number;
          sms_dogrulandi?: boolean;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      staff_details: {
        Row: {
          profile_id: string;
          unvan: string;
          komisyon_orani: number;
          izinli: boolean;
          yetkinlik_hizmet_idleri: string[];
        };
        Insert: {
          profile_id: string;
          unvan: string;
          komisyon_orani?: number;
          izinli?: boolean;
          yetkinlik_hizmet_idleri?: string[];
        };
        Update: {
          profile_id?: string;
          unvan?: string;
          komisyon_orani?: number;
          izinli?: boolean;
          yetkinlik_hizmet_idleri?: string[];
        };
        Relationships: [];
      };
      customer_notes: {
        Row: {
          profile_id: string;
          alerji_notu: string | null;
          boya_formulu: string | null;
        };
        Insert: {
          profile_id: string;
          alerji_notu?: string | null;
          boya_formulu?: string | null;
        };
        Update: {
          profile_id?: string;
          alerji_notu?: string | null;
          boya_formulu?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          ad: string;
          kategori: string;
          tahmini_sure_dakika: number;
          fiyat: number;
          aktif: boolean;
          aciklama: string | null;
          olusturulma_tarihi: string;
          gorsel_url?: string | null;
          detay?: string | null;
          sira?: number | null;
        };
        Insert: {
          id?: string;
          ad: string;
          kategori: string;
          tahmini_sure_dakika: number;
          fiyat: number;
          aktif?: boolean;
          aciklama?: string | null;
          olusturulma_tarihi?: string;
          gorsel_url?: string | null;
          detay?: string | null;
          sira?: number | null;
        };
        Update: {
          id?: string;
          ad?: string;
          kategori?: string;
          tahmini_sure_dakika?: number;
          fiyat?: number;
          aktif?: boolean;
          aciklama?: string | null;
          olusturulma_tarihi?: string;
          gorsel_url?: string | null;
          detay?: string | null;
          sira?: number | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          musteri_id: string | null;
          musteri_ad_soyad: string;
          musteri_telefon: string;
          hizmet_idleri: string[];
          calisan_idleri: string[];
          tarih_saat: string;
          toplam_sure_dakika: number;
          durum: AppointmentStatus;
          kaynak: AppointmentSource;
          notlar: string | null;
          onaylayan_id: string | null;
          olusturulma_tarihi: string;
          kvkk_onay_tarihi?: string | null;
          idempotency_key?: string | null;
        };
        Insert: {
          id?: string;
          musteri_id?: string | null;
          musteri_ad_soyad: string;
          musteri_telefon: string;
          hizmet_idleri: string[];
          calisan_idleri: string[];
          tarih_saat: string;
          toplam_sure_dakika: number;
          durum?: AppointmentStatus;
          kaynak?: AppointmentSource;
          notlar?: string | null;
          onaylayan_id?: string | null;
          olusturulma_tarihi?: string;
          kvkk_onay_tarihi?: string | null;
          idempotency_key?: string | null;
        };
        Update: {
          id?: string;
          musteri_id?: string | null;
          musteri_ad_soyad?: string;
          musteri_telefon?: string;
          hizmet_idleri?: string[];
          calisan_idleri?: string[];
          tarih_saat?: string;
          toplam_sure_dakika?: number;
          durum?: AppointmentStatus;
          kaynak?: AppointmentSource;
          notlar?: string | null;
          onaylayan_id?: string | null;
          olusturulma_tarihi?: string;
          kvkk_onay_tarihi?: string | null;
          idempotency_key?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          firma_adi: string;
          yetkili_kisi: string;
          telefon: string;
          whatsapp: string | null;
          eposta: string | null;
          kategoriler: string[];
          adres: string | null;
          olusturulma_tarihi: string;
        };
        Insert: {
          id?: string;
          firma_adi: string;
          yetkili_kisi: string;
          telefon: string;
          whatsapp?: string | null;
          eposta?: string | null;
          kategoriler?: string[];
          adres?: string | null;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          firma_adi?: string;
          yetkili_kisi?: string;
          telefon?: string;
          whatsapp?: string | null;
          eposta?: string | null;
          kategoriler?: string[];
          adres?: string | null;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          urun_adi: string;
          kategori: string;
          miktar: number;
          birim: string;
          kritik_seviye: number;
          supplier_id: string | null;
          olusturulma_tarihi: string;
        };
        Insert: {
          id?: string;
          urun_adi: string;
          kategori: string;
          miktar?: number;
          birim: string;
          kritik_seviye?: number;
          supplier_id?: string | null;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          urun_adi?: string;
          kategori?: string;
          miktar?: number;
          birim?: string;
          kritik_seviye?: number;
          supplier_id?: string | null;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          randevu_id: string | null;
          musteri_id: string | null;
          islemi_yapan_calisan_id: string;
          hizmet_adlari: string[];
          toplam_tutar: number;
          odenen_tutar: number;
          indirim_tutari: number;
          kullanilan_puan: number;
          odeme_yontemi: PaymentMethod;
          bahsis_tutari: number;
          veresiye: boolean;
          gizli_not: string | null;
          iade_tarihi: string | null;
          iade_eden_id: string | null;
          iade_tutari: number;
          olusturulma_tarihi: string;
        };
        Insert: {
          id?: string;
          randevu_id?: string | null;
          musteri_id?: string | null;
          islemi_yapan_calisan_id: string;
          hizmet_adlari?: string[];
          toplam_tutar: number;
          odenen_tutar: number;
          indirim_tutari?: number;
          kullanilan_puan?: number;
          odeme_yontemi?: PaymentMethod;
          bahsis_tutari?: number;
          veresiye?: boolean;
          gizli_not?: string | null;
          iade_tarihi?: string | null;
          iade_eden_id?: string | null;
          iade_tutari?: number;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          randevu_id?: string | null;
          musteri_id?: string | null;
          islemi_yapan_calisan_id?: string;
          hizmet_adlari?: string[];
          toplam_tutar?: number;
          odenen_tutar?: number;
          indirim_tutari?: number;
          kullanilan_puan?: number;
          odeme_yontemi?: PaymentMethod;
          bahsis_tutari?: number;
          veresiye?: boolean;
          gizli_not?: string | null;
          iade_tarihi?: string | null;
          iade_eden_id?: string | null;
          iade_tutari?: number;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      loyalty_ledger: {
        Row: {
          id: string;
          musteri_id: string;
          puan: number;
          islem_tipi: LoyaltyTransactionType;
          payment_id: string | null;
          olusturulma_tarihi: string;
        };
        Insert: {
          id?: string;
          musteri_id: string;
          puan: number;
          islem_tipi: LoyaltyTransactionType;
          payment_id?: string | null;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          musteri_id?: string;
          puan?: number;
          islem_tipi?: LoyaltyTransactionType;
          payment_id?: string | null;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          salon_adi: string;
          slogan: string;
          adres: string;
          google_maps_url: string;
          telefon: string;
          whatsapp: string;
          instagram: string;
          tiktok: string;
          facebook: string;
          calisma_saatleri: Json;
          tampon_sure_dakika: number;
          blokaj_sure_dakika: number;
          hero_baslik: string;
          hero_aciklama: string;
          kampanya_metni: string;
          hakkimizda_hikaye: string;
          sayfa_metinleri?: Json;
        };
        Insert: {
          id?: string;
          salon_adi?: string;
          slogan?: string;
          adres?: string;
          google_maps_url?: string;
          telefon?: string;
          whatsapp?: string;
          instagram?: string;
          tiktok?: string;
          facebook?: string;
          calisma_saatleri?: Json;
          tampon_sure_dakika?: number;
          blokaj_sure_dakika?: number;
          hero_baslik?: string;
          hero_aciklama?: string;
          kampanya_metni?: string;
          hakkimizda_hikaye?: string;
          sayfa_metinleri?: Json;
        };
        Update: {
          id?: string;
          salon_adi?: string;
          slogan?: string;
          adres?: string;
          google_maps_url?: string;
          telefon?: string;
          whatsapp?: string;
          instagram?: string;
          tiktok?: string;
          facebook?: string;
          calisma_saatleri?: Json;
          tampon_sure_dakika?: number;
          blokaj_sure_dakika?: number;
          hero_baslik?: string;
          hero_aciklama?: string;
          kampanya_metni?: string;
          hakkimizda_hikaye?: string;
          sayfa_metinleri?: Json;
        };
        Relationships: [];
      };
      gallery_items: {
        Row: {
          id: string;
          url: string;
          baslik: string;
          kategori: string;
          sira: number;
          olusturulma_tarihi: string;
          medya_turu?: string;
          kapak_url?: string | null;
          aciklama?: string | null;
          stilist?: string | null;
          begeni_sayisi?: number;
        };
        Insert: {
          id?: string;
          url: string;
          baslik: string;
          kategori: string;
          sira?: number;
          olusturulma_tarihi?: string;
          medya_turu?: string;
          kapak_url?: string | null;
          aciklama?: string | null;
          stilist?: string | null;
          begeni_sayisi?: number;
        };
        Update: {
          id?: string;
          url?: string;
          baslik?: string;
          kategori?: string;
          sira?: number;
          olusturulma_tarihi?: string;
          medya_turu?: string;
          kapak_url?: string | null;
          aciklama?: string | null;
          stilist?: string | null;
          begeni_sayisi?: number;
        };
        Relationships: [];
      };
      gallery_comments: {
        Row: {
          id: string;
          gallery_item_id: string;
          musteri_adi: string;
          yorum: string;
          aktif: boolean;
          olusturulma_tarihi: string;
        };
        Insert: {
          id?: string;
          gallery_item_id: string;
          musteri_adi: string;
          yorum: string;
          aktif?: boolean;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          gallery_item_id?: string;
          musteri_adi?: string;
          yorum?: string;
          aktif?: boolean;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      gallery_likes: {
        Row: {
          gallery_item_id: string;
          user_id: string;
          olusturulma_tarihi: string;
        };
        Insert: {
          gallery_item_id: string;
          user_id: string;
          olusturulma_tarihi?: string;
        };
        Update: {
          gallery_item_id?: string;
          user_id?: string;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
      customer_reviews: {
        Row: {
          id: string;
          musteri_adi: string;
          yorum: string | null;
          puan: number;
          hizmet_turu: string;
          aktif: boolean;
          olusturulma_tarihi: string;
          google_review_url?: string | null;
          randevu_id?: string | null;
          kaynak?: string;
        };
        Insert: {
          id?: string;
          musteri_adi: string;
          yorum?: string | null;
          puan: number;
          hizmet_turu: string;
          aktif?: boolean;
          olusturulma_tarihi?: string;
          google_review_url?: string | null;
          randevu_id?: string | null;
          kaynak?: string;
        };
        Update: {
          id?: string;
          musteri_adi?: string;
          yorum?: string | null;
          puan?: number;
          hizmet_turu?: string;
          aktif?: boolean;
          olusturulma_tarihi?: string;
          google_review_url?: string | null;
          randevu_id?: string | null;
          kaynak?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_refunds: {
        Row: {
          id: string;
          payment_id: string;
          iade_tutari: number;
          iptal_edilen_bahsis: number;
          geri_alinan_puan: number;
          iade_edilen_puan: number;
          iade_eden_id: string | null;
          sebep: string | null;
          olusturulma_tarihi: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          iade_tutari: number;
          iptal_edilen_bahsis?: number;
          geri_alinan_puan?: number;
          iade_edilen_puan?: number;
          iade_eden_id?: string | null;
          sebep?: string | null;
          olusturulma_tarihi?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          iade_tutari?: number;
          iptal_edilen_bahsis?: number;
          geri_alinan_puan?: number;
          iade_edilen_puan?: number;
          iade_eden_id?: string | null;
          sebep?: string | null;
          olusturulma_tarihi?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      toggle_gallery_like: {
        Args: {
          p_gallery_id: string;
          p_action?: string;
        };
        Returns: number;
      };
      cancel_my_appointment: {
        Args: {
          p_appointment_id: string;
        };
        Returns: boolean;
      };
      record_payment_transaction: {
        Args: {
          p_id: string;
          p_randevu_id: string | null;
          p_musteri_id: string | null;
          p_islemi_yapan_calisan_id: string;
          p_hizmet_adlari: string[];
          p_toplam_tutar: number;
          p_odenen_tutar: number;
          p_indirim_tutari: number;
          p_kullanilan_puan: number;
          p_kazanilan_puan: number;
          p_odeme_yontemi: PaymentMethod;
          p_bahsis_tutari: number;
          p_veresiye: boolean;
          p_gizli_not: string | null;
        };
        Returns: Json;
      };
      settle_or_refund_payment: {
        Args: {
          p_payment_id: string;
          p_action: string;
          p_odeme_yontemi?: PaymentMethod;
          p_actor_id?: string | null;
          p_earned_points?: number | null;
          p_sebep?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
      appointment_source: AppointmentSource;
      payment_method: PaymentMethod;
      loyalty_transaction_type: LoyaltyTransactionType;
    };
    CompositeTypes: Record<string, never>;
  };
}
