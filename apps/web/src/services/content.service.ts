import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@yildiz/types';

export type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row'];
export type SiteSettingsUpdate = Database['public']['Tables']['site_settings']['Update'];

export type GalleryRow = Database['public']['Tables']['gallery_items']['Row'];
export type GalleryRowWithCounts = GalleryRow & {
  gallery_comments?: Array<{ count: number }>;
};
export type GalleryInsert = Database['public']['Tables']['gallery_items']['Insert'];
export type GalleryUpdate = Database['public']['Tables']['gallery_items']['Update'];

export type ReviewRow = Database['public']['Tables']['customer_reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['customer_reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['customer_reviews']['Update'];

export class ContentService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // --- SİTE AYARLARI ---
  async getSiteSettings(): Promise<SiteSettingsRow | null> {
    const { data, error } = await this.client
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Site ayarları getirilemedi: ${error.message}`);
    }

    return data;
  }

  async updateSiteSettings(input: SiteSettingsUpdate): Promise<SiteSettingsRow> {
    let targetId = input.id;
    if (!targetId) {
      const current = await this.getSiteSettings();
      if (current) {
        targetId = current.id;
      }
    }

    if (!targetId) {
      const { data, error } = await this.client
        .from('site_settings')
        .insert(input)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Site ayarları kaydedilemedi: ${error.message}`);
      }

      return data;
    }

    const { data, error } = await this.client
      .from('site_settings')
      .update(input)
      .eq('id', targetId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Site ayarları güncellenemedi: ${error.message}`);
    }

    return data;
  }

  // --- GALERİ ---
  async getGalleryItems(): Promise<GalleryRowWithCounts[]> {
    const { data, error } = await this.client
      .from('gallery_items')
      .select('*, gallery_comments(count)')
      .order('sira', { ascending: true });

    if (error) {
      throw new Error(`Galeri öğeleri getirilemedi: ${error.message}`);
    }

    return (data as unknown as GalleryRowWithCounts[]) ?? [];
  }

  async createGalleryItem(input: GalleryInsert): Promise<GalleryRow> {
    const { data, error } = await this.client
      .from('gallery_items')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Galeri öğesi eklenemedi: ${error.message}`);
    }

    return data;
  }

  async deleteGalleryItem(id: string): Promise<void> {
    const { error } = await this.client
      .from('gallery_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Galeri öğesi silinemedi: ${error.message}`);
    }
  }

  // --- YORUMLAR ---
  async getActiveReviews(): Promise<ReviewRow[]> {
    const { data, error } = await this.client
      .from('customer_reviews')
      .select('*')
      .eq('aktif', true)
      .order('olusturulma_tarihi', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Onaylı yorumlar getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getAllReviews(): Promise<ReviewRow[]> {
    const { data, error } = await this.client
      .from('customer_reviews')
      .select('*')
      .order('olusturulma_tarihi', { ascending: false });

    if (error) {
      throw new Error(`Tüm yorumlar getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async submitReview(input: ReviewInsert): Promise<ReviewRow> {
    const isAktif = input.aktif ?? true;

    if (!isAktif) {
      const { error } = await this.client
        .from('customer_reviews')
        .insert({ ...input, aktif: false });

      if (error) {
        throw new Error(`Yorum iletilemedi: ${error.message}`);
      }

      return {
        id: input.id || 'temp-id',
        musteri_adi: input.musteri_adi,
        yorum: input.yorum ?? null,
        puan: input.puan,
        hizmet_turu: input.hizmet_turu,
        aktif: false,
        olusturulma_tarihi: new Date().toISOString(),
        google_review_url: input.google_review_url ?? null,
      };
    }

    const { data, error } = await this.client
      .from('customer_reviews')
      .insert({ ...input, aktif: true })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Yorum iletilemedi: ${error.message}`);
    }

    return data;
  }

  async deleteReview(id: string): Promise<void> {
    const { error } = await this.client
      .from('customer_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Yorum silinemedi: ${error.message}`);
    }
  }

  async updateReviewStatus(id: string, aktif: boolean): Promise<ReviewRow> {
    const { data, error } = await this.client
      .from('customer_reviews')
      .update({ aktif })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Yorum durumu güncellenemedi: ${error.message}`);
    }

    return data;
  }
}
