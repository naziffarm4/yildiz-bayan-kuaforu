"use client";

import React, { useState } from "react";
import type { StockItem, SupplierItem } from "@yildiz/types";
import { generateSafeUUID } from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";

export interface StockManagerProps {
  stockItems: StockItem[];
  onUpdateStockQuantity: (id: string, delta: number) => void;
  onAddStockItem: (newItem: StockItem) => void;
  onDeleteStockItem?: (id: string) => void;
  suppliers?: SupplierItem[];
}

export const StockManager: React.FC<StockManagerProps> = ({
  stockItems,
  onUpdateStockQuantity,
  onAddStockItem,
  onDeleteStockItem,
  suppliers = [],
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Boya & Oksidan");
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState("Adet");
  const [criticalLevel, setCriticalLevel] = useState<number>(5);
  const [supplier, setSupplier] = useState("");

  // Sipariş Modalı State'i
  const [orderingItem, setOrderingItem] = useState<StockItem | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: StockItem = {
      id: generateSafeUUID(),
      urunAdi: name.trim(),
      kategori: category,
      miktar: quantity,
      birim: unit,
      kritikSeviye: criticalLevel,
      tedarikci: supplier.trim() || "Genel Tedarikçi",
    };

    onAddStockItem(newItem);
    setName("");
    setSupplier("");
    setIsAdding(false);
  };

  // İlgili tedarikçiyi bul veya varsayılan ata
  const matchedSupplier =
    orderingItem && suppliers.length > 0
      ? suppliers.find((s) => s.firmaAdi.toLowerCase().includes(orderingItem.tedarikci.toLowerCase())) ?? suppliers[0]
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">
            Stok &amp; Sarf Malzeme Takibi
          </h1>
          <p className="text-xs text-text-secondary">
            Boya, açıcı, bakım kürleri ve sarf malzemelerin anlık miktarları ve kritik stok uyarıları.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? "✕ Vazgeç" : "+ Yeni Ürün Ekle"}
        </Button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-white rounded-xl border border-border shadow-xs space-y-4 max-w-2xl"
        >
          <h3 className="font-serif font-bold text-sm text-text-primary">
            Yeni Stok Ürünü Tanımla
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Ürün Adı *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Schwarzkopf Igora Boya 6.0"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              >
                <option value="Boya & Oksidan">Boya &amp; Oksidan</option>
                <option value="Bakım & Tedavi">Bakım &amp; Tedavi</option>
                <option value="Açıcı & Röfle">Açıcı &amp; Röfle</option>
                <option value="Tırnak & Bakım">Tırnak &amp; Bakım</option>
                <option value="Şampuan & Yağ">Şampuan &amp; Yağ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Başlangıç Miktarı
              </label>
              <input
                type="number"
                min={0}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Birim
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Adet / Şişe / Kutu"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Kritik Uyarı Eşiği
              </label>
              <input
                type="number"
                min={1}
                required
                value={criticalLevel}
                onChange={(e) => setCriticalLevel(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Tedarikçi Firma
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Örn: Henkel Türkiye, Doğan Kozmetik"
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
              Ürünü Kaydet ✓
            </Button>
          </div>
        </form>
      )}

      {/* MOBİL STOK KARTLARI (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {stockItems.map((item) => {
          const isCritical = item.miktar <= item.kritikSeviye;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border bg-white shadow-xs space-y-3 ${
                isCritical ? "border-red-300 bg-red-50/10" : "border-border"
              }`}
            >
              {/* Üst Bilgi: Ürün Adı & Durum Rozeti */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-sm text-text-primary leading-snug">
                    {item.urunAdi}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Badge variant="gray">{item.kategori}</Badge>
                    <span>•</span>
                    <span className="truncate max-w-[140px]">{item.tedarikci}</span>
                  </div>
                </div>

                <div>
                  {isCritical ? (
                    <Badge variant="pink" className="bg-red-50 text-red-700 border-red-200 font-bold">
                      ⚠️ Kritik Seviye!
                    </Badge>
                  ) : (
                    <Badge variant="green">Yeterli</Badge>
                  )}
                </div>
              </div>

              {/* Alt Bilgi: Mevcut Miktar & Hızlı Aksiyonlar */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase block font-semibold">
                    Stok / Kritik: {item.kritikSeviye} {item.birim}
                  </span>
                  <span className="font-serif font-bold text-base text-text-primary">
                    {item.miktar} <span className="text-xs font-normal text-text-secondary">{item.birim}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOrderingItem(item)}
                    className="text-xs h-10 px-3 text-accent-gold border-accent-gold/40 hover:bg-accent-gold/10 font-bold flex items-center gap-1.5"
                  >
                    💬 Sipariş Et
                  </Button>

                  {/* Büyük Dokunmatik Butonlar (h-10 w-10) */}
                  <button
                    type="button"
                    onClick={() => onUpdateStockQuantity(item.id, -1)}
                    disabled={item.miktar <= 0}
                    className="h-10 w-10 rounded-lg border border-border bg-bg-secondary text-text-primary hover:bg-border-main disabled:opacity-30 text-lg font-bold flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                    aria-label={`${item.urunAdi} 1 birim azalt`}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStockQuantity(item.id, 1)}
                    className="h-10 w-10 rounded-lg border border-primary/40 bg-primary text-white hover:bg-primary-hover text-lg font-bold flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                    aria-label={`${item.urunAdi} 1 birim artır`}
                  >
                    +
                  </button>
                  {onDeleteStockItem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`"${item.urunAdi}" stok kaydını tamamen silmek istediğinize emin misiniz?`)) {
                          onDeleteStockItem(item.id);
                        }
                      }}
                      className="h-10 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MASAÜSTÜ STOK LİSTESİ TABLOSU (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-secondary text-text-secondary font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Ürün Adı</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Mevcut Miktar</th>
                <th className="py-3 px-4">Kritik Eşik</th>
                <th className="py-3 px-4">Tedarikçi</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stockItems.map((item) => {
                const isCritical = item.miktar <= item.kritikSeviye;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-bg-secondary/60 ${isCritical ? "bg-red-50/20" : ""}`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {item.urunAdi}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="gray">{item.kategori}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      {item.miktar} {item.birim}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">
                      {item.kritikSeviye} {item.birim}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">
                      {item.tedarikci}
                    </td>
                    <td className="py-3.5 px-4">
                      {isCritical ? (
                        <Badge variant="pink">⚠️ Kritik Seviye!</Badge>
                      ) : (
                        <Badge variant="green">Yeterli</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderingItem(item)}
                        className="text-xs h-7 px-2.5 text-accent-gold border-accent-gold/40 hover:bg-accent-gold/10"
                      >
                        📦 Sipariş Et
                      </Button>

                      <button
                        type="button"
                        onClick={() => onUpdateStockQuantity(item.id, -1)}
                        disabled={item.miktar <= 0}
                        className="w-7 h-7 inline-flex items-center justify-center rounded border border-border bg-bg-secondary text-text-primary hover:bg-border-main disabled:opacity-30"
                        title="1 Birim Kullan / Düşür"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStockQuantity(item.id, 1)}
                        className="w-7 h-7 inline-flex items-center justify-center rounded border border-border bg-bg-secondary text-text-primary hover:bg-border-main"
                        title="1 Birim Ekle"
                      >
                        +
                      </button>
                      {onDeleteStockItem && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`"${item.urunAdi}" stok kaydını tamamen silmek istediğinize emin misiniz?`)) {
                              onDeleteStockItem(item.id);
                            }
                          }}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title="Stok Kalemini Sil"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SİPARİŞ VERME MODALI */}
      {orderingItem && matchedSupplier && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setOrderingItem(null)}
        >
          <div
            className="bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-3 sm:mx-auto max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent-gold block">
                  Tedarikçi Sipariş Hattı
                </span>
                <h3 className="font-serif text-lg font-bold text-text-primary mt-0.5">
                  {orderingItem.urunAdi}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderingItem(null)}
                className="p-1 rounded-full text-text-secondary hover:text-text-primary text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Ürün & Stok Durumu Özeti */}
            <div className="p-3.5 rounded-xl bg-white border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Mevcut Stok:</span>
                <span className="font-bold text-text-primary">
                  {orderingItem.miktar} {orderingItem.birim}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Kritik Eşik:</span>
                <span className="font-bold text-red-600">
                  {orderingItem.kritikSeviye} {orderingItem.birim}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Yetkili Tedarikçi:</span>
                <span className="font-bold text-text-primary">{matchedSupplier.firmaAdi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Yetkili Kişi:</span>
                <span className="font-medium text-text-primary">{matchedSupplier.yetkiliKisi}</span>
              </div>
            </div>

            {/* Sipariş Aksiyon Butonları */}
            <div className="space-y-2.5">
              <a
                href={`https://wa.me/${matchedSupplier.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Merhaba ${matchedSupplier.firmaAdi}, Yıldız Bayan Kuaförü salonumuz için ${orderingItem.urunAdi} ürününden sipariş vermek istiyoruz. Mevcut stok ve teslimat sürenizi iletebilir misiniz?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>💬 WhatsApp ile Sipariş Ver</span>
              </a>

              <a
                href={`tel:${matchedSupplier.telefon.replace(/\s+/g, "")}`}
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-white text-text-primary hover:bg-bg-secondary text-xs font-bold text-center flex items-center justify-center gap-2 shadow-2xs transition-colors"
              >
                <span>📞 Tedarikçiyi Telefonla Ara ({matchedSupplier.telefon})</span>
              </a>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setOrderingItem(null)}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
