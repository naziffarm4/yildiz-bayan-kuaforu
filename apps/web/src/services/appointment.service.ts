import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, AppointmentStatus } from '@yildiz/types';

export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export class AppointmentService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAppointmentsByCustomer(customerId: string): Promise<AppointmentRow[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('musteri_id', customerId)
      .order('tarih_saat', { ascending: false });

    if (error) {
      throw new Error(`Müşteri randevuları getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getAllAppointments(): Promise<AppointmentRow[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .order('tarih_saat', { ascending: false });

    if (error) {
      throw new Error(`Randevular getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getAppointmentById(id: string): Promise<AppointmentRow | null> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Randevu detayı getirilemedi: ${error.message}`);
    }

    return data;
  }

  async createAppointment(input: AppointmentInsert): Promise<AppointmentRow> {
    const { data, error } = await this.client
      .from('appointments')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Randevu oluşturulamadı: ${error.message}`);
    }

    return data;
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    approvedById?: string
  ): Promise<AppointmentRow> {
    const updatePayload: AppointmentUpdate = { durum: status };
    if (approvedById) {
      updatePayload.onaylayan_id = approvedById;
    }

    const { data, error } = await this.client
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Randevu durumu güncellenemedi: ${error.message}`);
    }

    return data;
  }

  async updateAppointment(id: string, input: AppointmentUpdate): Promise<AppointmentRow> {
    const { data, error } = await this.client
      .from('appointments')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Randevu güncellenemedi: ${error.message}`);
    }

    return data;
  }
}
