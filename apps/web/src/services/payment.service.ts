import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@yildiz/types';

export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type LoyaltyLedgerInsert = Database['public']['Tables']['loyalty_ledger']['Insert'];

export class PaymentService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAllPayments(): Promise<PaymentRow[]> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .order('olusturulma_tarihi', { ascending: false });

    if (error) {
      throw new Error(`Ödeme kayıtları getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async getPaymentsByCustomer(customerId: string): Promise<PaymentRow[]> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('musteri_id', customerId)
      .order('olusturulma_tarihi', { ascending: false });

    if (error) {
      throw new Error(`Müşteri ödemeleri getirilemedi: ${error.message}`);
    }

    return data ?? [];
  }

  async recordPayment(paymentInput: PaymentInsert, earnedPoints: number = 0): Promise<PaymentRow> {
    const { data: payment, error: paymentError } = await this.client
      .from('payments')
      .insert(paymentInput)
      .select('*')
      .single();

    if (paymentError) {
      throw new Error(`Ödeme kaydı oluşturulamadı: ${paymentError.message}`);
    }

    // Puan kazanımı varsa ledger'a ve profil toplamına işle
    if (earnedPoints > 0 && payment.musteri_id) {
      const ledgerEntry: LoyaltyLedgerInsert = {
        musteri_id: payment.musteri_id,
        puan: earnedPoints,
        islem_tipi: 'KAZANIM',
        payment_id: payment.id,
      };

      await this.client.from('loyalty_ledger').insert(ledgerEntry);
    }

    return payment;
  }
}
