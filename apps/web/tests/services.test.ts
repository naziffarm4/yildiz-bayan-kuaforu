import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@yildiz/types';
import {
  ServiceService,
  AppointmentService,
  PaymentService,
  InventoryService,
  ContentService,
} from '../src/services';

describe('Supabase Data Services (Faz 3)', () => {
  it('ServiceService aktif hizmetleri başarıyla filtreler ve getirir', async () => {
    const mockServices = [
      { id: 'a1010000-0000-4000-8000-000000000001', ad: 'Saç Kesimi', kategori: 'Saç', tahmini_sure_dakika: 45, fiyat: 350, aktif: true, aciklama: null, olusturulma_tarihi: '2026-10-22' },
    ];

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockServices, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new ServiceService(mockClient);
    const result = await service.getActiveServices();

    expect(result).toHaveLength(1);
    expect(result[0].ad).toBe('Saç Kesimi');
    expect(mockClient.from).toHaveBeenCalledWith('services');
  });

  it('AppointmentService randevu durumu günceller', async () => {
    const mockUpdatedAppointment = {
      id: 'app-uuid-1',
      durum: 'Onaylandı',
      onaylayan_id: 'staff-uuid-1',
    };

    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedAppointment, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new AppointmentService(mockClient);
    const result = await service.updateAppointmentStatus('app-uuid-1', 'Onaylandı', 'staff-uuid-1');

    expect(result.durum).toBe('Onaylandı');
    expect(result.onaylayan_id).toBe('staff-uuid-1');
  });

  it('PaymentService ödeme kaydeder ve puan kazanımını ledger tablosuna ekler', async () => {
    const mockPayment = {
      id: 'pay-uuid-1',
      musteri_id: 'cust-uuid-1',
      islemi_yapan_calisan_id: 'staff-uuid-1',
      toplam_tutar: 500,
      odenen_tutar: 500,
    };

    const insertLedgerMock = vi.fn().mockResolvedValue({ data: null, error: null });

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'payments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockPayment, error: null }),
              }),
            }),
          };
        }
        if (table === 'loyalty_ledger') {
          return {
            insert: insertLedgerMock,
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new PaymentService(mockClient);
    const payment = await service.recordPayment(
      {
        musteri_id: 'cust-uuid-1',
        islemi_yapan_calisan_id: 'staff-uuid-1',
        toplam_tutar: 500,
        odenen_tutar: 500,
        hizmet_adlari: ['Boya'],
        odeme_yontemi: 'Nakit',
      },
      50 // 500 TL = 50 puan
    );

    expect(payment.id).toBe('pay-uuid-1');
    expect(insertLedgerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        musteri_id: 'cust-uuid-1',
        puan: 50,
        islem_tipi: 'KAZANIM',
      })
    );
  });

  it('InventoryService kritik stok filtrelemesini doğru yapar', async () => {
    const mockStock = [
      { id: 'inv-uuid-1', urun_adi: 'Şampuan', miktar: 2, kritik_seviye: 5, birim: 'Adet', kategori: 'Bakım', supplier_id: null, olusturulma_tarihi: '2026-10-22' },
      { id: 'inv-uuid-2', urun_adi: 'Saç Kremi', miktar: 10, kritik_seviye: 3, birim: 'Adet', kategori: 'Bakım', supplier_id: null, olusturulma_tarihi: '2026-10-22' },
    ];

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockStock, error: null }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new InventoryService(mockClient);
    const critical = await service.getCriticalInventory();

    expect(critical).toHaveLength(1);
    expect(critical[0].urun_adi).toBe('Şampuan');
  });

  it("ContentService yeni yorumu pasif (aktif: false) olarak select('*') yapmadan guvenle kaydeder", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new ContentService(mockClient);
    const result = await service.submitReview({
      musteri_adi: 'Ayşe',
      yorum: 'Harika',
      puan: 5,
      hizmet_turu: 'Kesim',
      aktif: false,
    });

    expect(result.aktif).toBe(false);
    expect(result.musteri_adi).toBe('Ayşe');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aktif: false,
      })
    );
  });

  it('ContentService admin yorumunu aktif (aktif: true) olarak kaydeder ve select("*").single() döner', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'rev-uuid-1',
            musteri_adi: 'Fatma',
            yorum: 'Muhteşem saç kesimi',
            puan: 5,
            hizmet_turu: 'Tasarım Kesim',
            aktif: true,
            olusturulma_tarihi: '2026-10-25',
            google_review_url: null,
          },
          error: null,
        }),
      }),
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new ContentService(mockClient);
    const result = await service.submitReview({
      musteri_adi: 'Fatma',
      yorum: 'Muhteşem saç kesimi',
      puan: 5,
      hizmet_turu: 'Tasarım Kesim',
      aktif: true,
    });

    expect(result.aktif).toBe(true);
    expect(result.id).toBe('rev-uuid-1');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aktif: true,
      })
    );
  });

  it('ContentService deleteReview ile yorumu başarıyla siler', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        delete: deleteMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new ContentService(mockClient);
    await expect(service.deleteReview('rev-uuid-1')).resolves.not.toThrow();
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'rev-uuid-1');
  });

  it('ContentService getActiveReviews son 5 onaylı yorumu DESC sırasında çeker', async () => {
    const mockReviews = [
      { id: '1', musteri_adi: 'A', yorum: 'Harika', puan: 5, hizmet_turu: 'Fön', aktif: true, olusturulma_tarihi: '2026-10-25' },
      { id: '2', musteri_adi: 'B', yorum: 'Güzel', puan: 5, hizmet_turu: 'Kesim', aktif: true, olusturulma_tarihi: '2026-10-24' },
    ];

    const limitMock = vi.fn().mockResolvedValue({ data: mockReviews, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const mockClient = {
      from: vi.fn().mockReturnValue({ select: selectMock }),
    } as unknown as SupabaseClient<Database>;

    const service = new ContentService(mockClient);
    const result = await service.getActiveReviews();

    expect(result).toHaveLength(2);
    expect(eqMock).toHaveBeenCalledWith('aktif', true);
    expect(orderMock).toHaveBeenCalledWith('olusturulma_tarihi', { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(5);
  });

  it('ContentService getSiteSettings limit(1).maybeSingle() ile tek kaydı çeker (.eq id=1 kaldırılmıştır)', async () => {
    const mockSettings = {
      id: 'settings-uuid-1234',
      salon_adi: 'YILDIZ BAYAN KUAFÖRÜ',
      slogan: 'Zarif Dokunuşlar',
      telefon: '05551234567',
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockSettings, error: null });
    const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ limit: limitMock });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: selectMock,
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new ContentService(mockClient);
    const settings = await service.getSiteSettings();

    expect(settings?.id).toBe('settings-uuid-1234');
    expect(mockClient.from).toHaveBeenCalledWith('site_settings');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(limitMock).toHaveBeenCalledWith(1);
    expect(maybeSingleMock).toHaveBeenCalled();
  });

  it('ContentService updateSiteSettings id belirtilmemişse mevcut ID yi bularak günceller', async () => {
    const existingSettings = {
      id: 'auto-uuid-existing',
      salon_adi: 'YILDIZ BAYAN KUAFÖRÜ',
    };

    const updatedSettings = {
      id: 'auto-uuid-existing',
      salon_adi: 'YENİ SALON ADI',
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: existingSettings, error: null });
    const singleMock = vi.fn().mockResolvedValue({ data: updatedSettings, error: null });
    const eqMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: singleMock,
      }),
    });
    const updateMock = vi.fn().mockReturnValue({
      eq: eqMock,
    });

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: maybeSingleMock,
              }),
            }),
            update: updateMock,
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new ContentService(mockClient);
    const result = await service.updateSiteSettings({ salon_adi: 'YENİ SALON ADI' });

    expect(result.salon_adi).toBe('YENİ SALON ADI');
    expect(updateMock).toHaveBeenCalledWith({ salon_adi: 'YENİ SALON ADI' });
    expect(eqMock).toHaveBeenCalledWith('id', 'auto-uuid-existing');
  });
});
