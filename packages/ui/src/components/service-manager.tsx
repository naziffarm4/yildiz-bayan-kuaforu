"use client";

import React, { useState } from "react";
import type { ServiceItem } from "@yildiz/types";
import { generateSafeUUID } from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";

export interface ServiceManagerProps {
  services: ServiceItem[];
  onToggleServiceActive: (serviceId: string) => void;
  onAddService: (newService: ServiceItem) => void;
  onDeleteService?: (serviceId: string) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({
  services,
  onToggleServiceActive,
  onAddService,
  onDeleteService,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Saç Tasarımı");
  const [duration, setDuration] = useState<number>(45);
  const [price, setPrice] = useState<number>(500);
  const [desc, setDesc] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newService: ServiceItem = {
      id: generateSafeUUID(),
      ad: name.trim(),
      kategori: category,
      tahminiSureDakika: duration,
      fiyat: price,
      aktif: true,
      aciklama: desc.trim() || undefined,
    };

    onAddService(newService);
    setName("");
    setDesc("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">
            Hizmet &amp; Fiyat Yönetimi
          </h1>
          <p className="text-xs text-text-secondary">
            Salonumuzun sunduğu kuaförlük hizmetleri, süreleri ve ücretleri.
            <span className="font-semibold text-accent-gold ml-1">
              (Şartname Kuralı: Hizmet silme yoktur, sadece pasife alma vardır.)
            </span>
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? "✕ Vazgeç" : "+ Yeni Hizmet Tanımla"}
        </Button>
      </div>

      {/* Yeni Hizmet Ekleme Formu */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-white rounded-xl border border-border shadow-xs space-y-4 max-w-2xl"
        >
          <h3 className="font-serif font-bold text-sm text-text-primary">
            Yeni Hizmet Tanımla
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Hizmet Adı *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Brezilya Fönü"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Kategori *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              >
                <option value="Saç Tasarımı">Saç Tasarımı</option>
                <option value="Renklendirme">Renklendirme</option>
                <option value="Bakım & Tedavi">Bakım &amp; Tedavi</option>
                <option value="Özel Gün">Özel Gün</option>
                <option value="El & Ayak Bakımı">El &amp; Ayak Bakımı</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Tahmini Süre (Dakika) *
              </label>
              <input
                type="number"
                min={15}
                step={5}
                required
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Hizmet Fiyatı (₺) *
              </label>
              <input
                type="number"
                min={50}
                step={50}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Açıklama
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Hizmet detayları ve kullanılan ürünler"
              className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsAdding(false)}
            >
              İptal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Hizmeti Kaydet ✓
            </Button>
          </div>
        </form>
      )}

      {/* MOBİL HİZMET KARTLARI (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {services.length === 0 ? (
          <div className="p-8 text-center text-text-secondary bg-white rounded-xl border border-border text-xs">
            Henüz tanımlanmış bir hizmet bulunmuyor.
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={`p-4 bg-white rounded-xl border border-border shadow-xs space-y-3 transition-opacity ${
                !service.aktif ? "opacity-60 bg-gray-50/50" : ""
              }`}
            >
              {/* Üst Kısım: Hizmet Adı, Kategori rozeti, Durum rozeti */}
              <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-text-primary leading-snug">
                    {service.ad}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="gray">{service.kategori}</Badge>
                  </div>
                </div>

                <div>
                  {service.aktif ? (
                    <Badge variant="green">Aktif</Badge>
                  ) : (
                    <Badge variant="pink">Pasif</Badge>
                  )}
                </div>
              </div>

              {/* Orta Kısım: Süre ("45 dk") ve Fiyat ("500 ₺") bilgileri */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-secondary border border-border/60 text-xs">
                <div>
                  <span className="text-text-secondary block text-[11px] font-medium">Süre:</span>
                  <span className="font-semibold text-text-primary">⏱️ {service.tahminiSureDakika} dk</span>
                </div>
                <div className="text-right">
                  <span className="text-text-secondary block text-[11px] font-medium">Ücret:</span>
                  <span className="font-serif font-bold text-base text-accent-gold">
                    {service.fiyat.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              </div>

              {/* Açıklama Metni */}
              {service.aciklama && (
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 px-1">
                  {service.aciklama}
                </p>
              )}

              {/* Altta: Tek dokunuşla çalışan "Pasife Al / Aktifleştir" durum butonu ve Sil */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleServiceActive(service.id)}
                  className={`flex-1 h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs ${
                    service.aktif
                      ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {service.aktif ? "⏸️ Pasife Al" : "▶️ Yeniden Aktifleştir"}
                </button>
                {onDeleteService && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${service.ad}" hizmetini tamamen silmek istediğinize emin misiniz?`)) {
                        onDeleteService(service.id);
                      }
                    }}
                    className="h-11 px-3.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200"
                    title="Hizmeti Sil"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MASAÜSTÜ HİZMETLER TABLOSU (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-secondary text-text-secondary font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Hizmet Adı</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tahmini Süre</th>
                <th className="py-3 px-4">Ücret</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">Aksiyon (Pasife Al)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => (
                <tr
                  key={service.id}
                  className={`hover:bg-bg-secondary/60 ${!service.aktif ? "opacity-60 bg-gray-50/50" : ""}`}
                >
                  <td className="py-3.5 px-4 font-semibold text-text-primary">
                    {service.ad}
                    {service.aciklama && (
                      <span className="text-[11px] text-text-secondary block font-normal truncate max-w-sm">
                        {service.aciklama}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="gray">{service.kategori}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-text-primary">
                    {service.tahminiSureDakika} dk
                  </td>
                  <td className="py-3.5 px-4 font-bold text-text-primary">
                    {service.fiyat.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="py-3.5 px-4">
                    {service.aktif ? (
                      <Badge variant="green">Aktif</Badge>
                    ) : (
                      <Badge variant="pink">Pasif</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onToggleServiceActive(service.id)}
                      className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                        service.aktif
                          ? "text-red-700 hover:bg-red-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {service.aktif ? "Pasife Al" : "Yeniden Aktifleştir"}
                    </button>
                    {onDeleteService && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`"${service.ad}" hizmetini tamamen silmek istediğinize emin misiniz?`)) {
                            onDeleteService(service.id);
                          }
                        }}
                        className="text-xs font-semibold px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        title="Hizmeti Sil"
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
