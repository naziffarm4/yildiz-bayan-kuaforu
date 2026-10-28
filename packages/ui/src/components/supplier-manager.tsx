import React, { useState } from "react";
import type { SupplierItem } from "@yildiz/types";
import { generateSafeUUID } from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";

export interface SupplierManagerProps {
  suppliers: SupplierItem[];
  onAddSupplier: (supplier: SupplierItem) => void;
  onDeleteSupplier?: (id: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
  suppliers,
  onAddSupplier,
  onDeleteSupplier,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState("");
  const [address, setAddress] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !phone.trim()) return;

    const newSupplier: SupplierItem = {
      id: generateSafeUUID(),
      firmaAdi: companyName.trim(),
      yetkiliKisi: contactPerson.trim() || "Satış Temsilcisi",
      telefon: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      eposta: email.trim() || undefined,
      kategoriler: categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      adres: address.trim() || undefined,
    };

    onAddSupplier(newSupplier);
    setCompanyName("");
    setContactPerson("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setCategories("");
    setAddress("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text-primary">
            Tedarikçiler &amp; Malzeme Siparişi
          </h1>
          <p className="text-xs text-text-secondary">
            Boya, açıcı ve salon sarf malzemesi sağlayan yetkili distribütörler ve doğrudan sipariş hatları.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? "✕ Vazgeç" : "+ Yeni Tedarikçi Ekle"}
        </Button>
      </div>

      {/* Yeni Tedarikçi Formu */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 bg-white rounded-xl border border-border shadow-xs space-y-4 max-w-2xl"
        >
          <h3 className="font-serif font-bold text-sm text-text-primary">
            Yeni Tedarikçi Firma Tanımla
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Firma Adı *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Örn: L'Oréal Profesyonel"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Yetkili Kişi
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Örn: Ahmet Bey"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Telefon *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0212 XXX XX XX"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                WhatsApp Sipariş Hattı
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Ürün Kategorileri (Virgülle ayırın)
              </label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="Boya, Açıcı, Bakım"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siparis@firma.com"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary"
              />
            </div>
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
              Tedarikçiyi Kaydet ✓
            </Button>
          </div>
        </form>
      )}

      {/* Tedarikçiler Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map((supplier) => {
          const defaultOrderMsg = encodeURIComponent(
            `Merhaba ${supplier.firmaAdi}, Yıldız Bayan Kuaförü salonumuz için malzeme siparişi vermek istiyoruz. Güncel stok ve fiyat listenizi iletebilir misiniz?`,
          );

          return (
            <Card
              key={supplier.id}
              className="p-5 bg-white border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-accent-gold/60 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-serif font-bold text-base text-text-primary">
                    {supplier.firmaAdi}
                  </h3>
                  <Badge variant="gold">Aktif Tedarikçi</Badge>
                </div>

                <p className="text-xs text-text-secondary">
                  Yetkili: <strong className="text-text-primary">{supplier.yetkiliKisi}</strong>
                </p>

                {supplier.kategoriler.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {supplier.kategoriler.map((c: string, i: number) => (
                      <Badge key={i} variant="gray" className="text-[10px]">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                {supplier.adres && (
                  <p className="text-[11px] text-text-secondary mt-2.5 line-clamp-1">
                    📍 {supplier.adres}
                  </p>
                )}
              </div>

              {/* Hızlı Aksiyon Butonları (WhatsApp & Telefon) */}
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, "")}?text=${defaultOrderMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>💬 WhatsApp Sipariş</span>
                </a>

                <a
                  href={`tel:${supplier.telefon.replace(/\s+/g, "")}`}
                  className="py-2 px-3 rounded-lg border border-border bg-bg-secondary text-text-primary hover:bg-border-main text-xs font-semibold transition-colors"
                  title="Telefonla Ara"
                >
                  📞 Ara
                </a>

                {onDeleteSupplier && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${supplier.firmaAdi}" tedarikçi kaydını silmek istediğinize emin misiniz?`)) {
                        onDeleteSupplier(supplier.id);
                      }
                    }}
                    className="py-2 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors"
                    title="Tedarikçiyi Sil"
                  >
                    🗑️ Sil
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
