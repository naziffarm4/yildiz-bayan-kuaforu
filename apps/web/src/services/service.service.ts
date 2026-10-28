import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@yildiz/types';

export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export class ServiceService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getActiveServices(): Promise<ServiceRow[]> {
    const { data, error } = await this.client
      .from('services')
      .select('*')
      .eq('aktif', true)
      .order('sira', { ascending: true })
      .order('ad', { ascending: true });

    if (error) {
      throw new Error(`Aktif hizmetler getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getAllServices(): Promise<ServiceRow[]> {
    const { data, error } = await this.client
      .from('services')
      .select('*')
      .order('kategori', { ascending: true })
      .order('ad', { ascending: true });

    if (error) {
      throw new Error(`Hizmet listesi getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getServiceById(id: string): Promise<ServiceRow | null> {
    const { data, error } = await this.client
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Hizmet detayı getirilemedi: ${error.message}`);
    }

    return data;
  }

  async createService(input: ServiceInsert): Promise<ServiceRow> {
    const { data, error } = await this.client
      .from('services')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Hizmet eklenemedi: ${error.message}`);
    }

    return data;
  }

  async updateService(id: string, input: ServiceUpdate): Promise<ServiceRow> {
    const { data, error } = await this.client
      .from('services')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Hizmet güncellenemedi: ${error.message}`);
    }

    return data;
  }

  /**
   * Şartname Bölüm 11: Hizmetlerde silme yoktur, sadece pasife alma vardır.
   */
  async deactivateService(id: string): Promise<ServiceRow> {
    return this.updateService(id, { aktif: false });
  }
}
