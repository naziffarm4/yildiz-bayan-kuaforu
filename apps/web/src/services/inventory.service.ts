import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@yildiz/types';

export type InventoryRow = Database['public']['Tables']['inventory']['Row'];
export type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
export type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];

export type SupplierRow = Database['public']['Tables']['suppliers']['Row'];
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export class InventoryService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // --- STOK METOTLARI ---
  async getAllInventory(): Promise<InventoryRow[]> {
    const { data, error } = await this.client
      .from('inventory')
      .select('*')
      .order('urun_adi', { ascending: true });

    if (error) {
      throw new Error(`Stok listesi getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getCriticalInventory(): Promise<InventoryRow[]> {
    const all = await this.getAllInventory();
    return all.filter((item) => item.miktar <= item.kritik_seviye);
  }

  async createInventoryItem(input: InventoryInsert): Promise<InventoryRow> {
    const { data, error } = await this.client
      .from('inventory')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Stok kalemi eklenemedi: ${error.message}`);
    }

    return data;
  }

  async updateInventoryItem(id: string, input: InventoryUpdate): Promise<InventoryRow> {
    const { data, error } = await this.client
      .from('inventory')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Stok kalemi güncellenemedi: ${error.message}`);
    }

    return data;
  }

  // --- TEDARİKÇİ METOTLARI ---
  async getAllSuppliers(): Promise<SupplierRow[]> {
    const { data, error } = await this.client
      .from('suppliers')
      .select('*')
      .order('firma_adi', { ascending: true });

    if (error) {
      throw new Error(`Tedarikçi listesi getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async createSupplier(input: SupplierInsert): Promise<SupplierRow> {
    const { data, error } = await this.client
      .from('suppliers')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Tedarikçi eklenemedi: ${error.message}`);
    }

    return data;
  }

  async updateSupplier(id: string, input: SupplierUpdate): Promise<SupplierRow> {
    const { data, error } = await this.client
      .from('suppliers')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Tedarikçi güncellenemedi: ${error.message}`);
    }

    return data;
  }
}
