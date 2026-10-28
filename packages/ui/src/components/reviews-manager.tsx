import React, { useState } from "react";
import type { CustomerReview } from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";

export interface ReviewsManagerProps {
  reviews: CustomerReview[];
  onAddReview: (review: Omit<CustomerReview, "id" | "tarih"> & { tarih?: string }) => void;
  onDeleteReview: (id: string) => void;
  googleRating?: number;
  googleReviewCount?: number;
  lastGoogleSyncAt?: string;
  onSyncGoogleReviews?: () => Promise<void>;
}

const SERVICE_OPTIONS = [
  "Tasarım Saç Kesimi",
  "Klasik & Hacimli Fön",
  "Dip Boya & Parlaklık",
  "Renklendirme & Balyaj",
  "Keratin Botoksu & Bakım",
  "Haute Couture Gelin Saçı",
  "Medikal Manikür & Kalıcı Oje",
  "Spa Pedikür & El Bakımı",
  "İpek Kirpik & Kaş Laminasyonu",
  "Genel Salon Deneyimi",
];

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  reviews,
  onAddReview,
  onDeleteReview,
  googleRating,
  googleReviewCount,
  lastGoogleSyncAt,
  onSyncGoogleReviews,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterSource, setFilterSource] = useState<"Tümü" | "Google" | "Salon">("Tümü");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [commentText, setCommentText] = useState("");
  const [source, setSource] = useState<"Google" | "Salon">("Salon");
  const [serviceType, setServiceType] = useState<string>("Tasarım Saç Kesimi");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");

  const handleSync = async () => {
    if (!onSyncGoogleReviews) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      await onSyncGoogleReviews();
      setSyncStatus("Google verileri başarıyla senkronize edildi ✅");
    } catch {
      setSyncStatus("Senkronizasyon sırasında hata oluştu.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + curr.puan, 0) / reviews.length).toFixed(1)
      : "5.0";

  const googleCount = reviews.filter((r) => r.kaynak === "Google").length;
  const verifiedGoogleCount = reviews.filter((r) => r.kaynak === "Google" && r.googleReviewUrl).length;
  const salonCount = reviews.filter((r) => r.kaynak === "Salon").length;

  const filteredReviews =
    filterSource === "Tümü"
      ? reviews
      : reviews.filter((r) => r.kaynak === filterSource);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const todayStr = new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());

    onAddReview({
      musteriAdi: customerName.trim(),
      puan: rating,
      yorum: commentText.trim() || "",
      kaynak: source,
      hizmetTuru: serviceType,
      tarih: todayStr,
      googleReviewUrl:
        source === "Google" && googleReviewUrl.trim() ? googleReviewUrl.trim() : undefined,
    });

    // Reset Form
    setCustomerName("");
    setCommentText("");
    setRating(5);
    setGoogleReviewUrl("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-gold block">
            Sosyal Kanıt &amp; Geri Bildirim
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
            Müşteri Yorumları &amp; Vitrin Yönetimi
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Google Haritalar ve salondan gelen doğrulanmış misafir değerlendirmelerini yönetin.
          </p>
        </div>

        <Button
          variant={isAdding ? "outline" : "primary"}
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs shrink-0 font-bold"
        >
          {isAdding ? "✕ Formu Kapat" : "+ Yeni Yorum Ekle"}
        </Button>
      </div>

      {/* Google Canlı Puan & Senkronizasyon Durum Kartı */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-white via-bg-secondary to-white border-accent-gold/40 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-border shadow-2xs flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-bold text-text-primary">
                  Google Canlı Puan: {googleRating ?? 4.9} ★ ({googleReviewCount ?? 14} Değerlendirme)
                </span>
                <Badge variant="gold">Canlı Entegre</Badge>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Son Senkronizasyon:{" "}
                <span className="font-semibold text-text-primary">
                  {lastGoogleSyncAt
                    ? new Intl.DateTimeFormat("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(lastGoogleSyncAt))
                    : "Bugün (Otomatik)"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncStatus && (
              <span className="text-xs font-semibold text-emerald-800 animate-fadeIn">
                {syncStatus}
              </span>
            )}
            {onSyncGoogleReviews && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="text-xs font-bold border-accent-gold/60 hover:bg-bg-secondary shrink-0"
              >
                {isSyncing ? "Senkronize Ediliyor..." : "Google Verilerini Şimdi Güncelle"}
              </Button>
            )}
          </div>
        </div>

        {/* Doğrulanmış Google Yorum Linkleri Hızlı Erişim */}
        {verifiedGoogleCount > 0 && (
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-text-secondary">
              Doğrulanmış Orijinal Google Yorumları ({verifiedGoogleCount}):
            </span>
            {reviews
              .filter((r) => r.kaynak === "Google" && r.googleReviewUrl)
              .map((r) => (
                <a
                  key={r.id}
                  href={r.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-accent-gold/40 text-[11px] font-medium text-text-primary hover:border-accent-gold hover:bg-accent-gold/10 transition-colors shadow-2xs"
                  title={`${r.musteriAdi} - Orijinal Google Yorumunu İncele`}
                >
                  <svg className="w-3 h-3 text-accent-gold" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{r.musteriAdi}</span>
                  <span className="text-accent-gold text-[10px]">↗</span>
                </a>
              ))}
          </div>
        )}
      </Card>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-text-secondary block font-medium">Genel Salon Puanı</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-serif text-2xl font-bold text-text-primary">{averageRating}</span>
              <span className="text-accent-gold text-lg">★</span>
              <span className="text-xs text-text-secondary">/ 5.0</span>
            </div>
          </div>
          <Badge variant="gold">Mükemmel</Badge>
        </Card>

        <Card className="p-4 bg-white border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-text-secondary block font-medium">Toplam Değerlendirme</span>
            <span className="font-serif text-2xl font-bold text-text-primary block mt-0.5">
              {reviews.length} Yorum
            </span>
          </div>
          <span className="text-xs text-text-secondary">Canlı Vitrin</span>
        </Card>

        <Card className="p-4 bg-white border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-text-secondary block font-medium">Kaynak Dağılımı</span>
            <div className="flex flex-col gap-0.5 text-xs font-semibold mt-1">
              <span className="text-emerald-700">
                📍 Google: {googleCount} ({verifiedGoogleCount} Doğrulanmış Link)
              </span>
              <span className="text-accent-gold">✂️ Salon: {salonCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Yeni Yorum Ekleme Formu */}
      {isAdding && (
        <Card className="p-6 bg-white border-accent-gold/40 shadow-sm animate-fadeIn">
          <div className="mb-4 pb-3 border-b border-border/70 flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-text-primary">
              + Yeni Müşteri Yorumu Ekle
            </h3>
            <span className="text-xs text-text-secondary">
              Eklenen yorum ana sayfa misafir deneyimlerinde yayınlanır
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Müşteri Adı &amp; Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Örn: Aslıhan Yılmaz"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Puan (Yıldız) *
                </label>
                <div className="flex items-center gap-1.5 h-9">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-125 focus:outline-none ${
                        star <= rating ? "text-accent-gold" : "text-gray-300"
                      }`}
                      aria-label={`${star} Yıldız`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-text-primary ml-2">
                    {rating} / 5 Yıldız
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Yorum Kaynağı *
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as "Google" | "Salon")}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                >
                  <option value="Salon">Salon Misafir Defteri</option>
                  <option value="Google">Google İşletme / Haritalar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Alınan Hizmet Türü
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              >
                {SERVICE_OPTIONS.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>

            {source === "Google" && (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Google Orijinal Yorum Bağlantısı (URL)
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="Örn: https://share.google/Ecq4YeYWcyOD1XNDn"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
                <span className="text-[10px] text-text-secondary mt-1 block">
                  Misafirlerin vitrinde doğrudan tıklayıp Google üzerinde doğrulaması için bağlantı (opsiyonel)
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Müşteri Değerlendirme &amp; Deneyim Metni
                <span className="text-[10px] text-text-secondary font-normal ml-1">
                  (Google metinsiz puanlamalar için boş bırakılabilir)
                </span>
              </label>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Örn: Salonun hijyeni, ikramları ve Elif Hanım'ın balyajdaki ustalığı harikaydı... (İsteğe bağlı)"
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                İptal
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                ✓ Yorumu Kaydet &amp; Yayınla
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Kaynak Filtre Butonları */}
      <div className="flex items-center gap-2">
        {(["Tümü", "Google", "Salon"] as const).map((src) => {
          const isActive = filterSource === src;
          const count =
            src === "Tümü"
              ? reviews.length
              : reviews.filter((r) => r.kaynak === src).length;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-text-primary text-white shadow-xs"
                  : "bg-white border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              <span>{src}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-accent-gold text-white" : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Yorumlar Listesi */}
      {filteredReviews.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-2 border-border">
          <span className="text-3xl block mb-2">💬</span>
          <h4 className="font-serif text-base font-bold text-text-primary">
            Henüz yorum bulunmuyor
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            Yeni bir müşteri deneyimi eklemek için yukarıdaki formu kullanabilirsiniz.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <Card
              key={rev.id}
              className="p-5 bg-white border-border shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                {/* Üst Satır: Puan & Kaynak Rozeti */}
                <div className="flex items-center justify-between">
                  <div className="flex text-accent-gold gap-0.5 text-sm" aria-label={`${rev.puan} Yıldız`}>
                    {Array.from({ length: rev.puan }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.hizmetTuru && (
                      <Badge variant="gray" className="text-[10px]">
                        {rev.hizmetTuru}
                      </Badge>
                    )}
                    <Badge variant={rev.kaynak === "Google" ? "pink" : "gold"}>
                      {rev.kaynak}
                    </Badge>
                  </div>
                </div>

                {/* Yorum Metni */}
                <p className="text-xs sm:text-sm text-text-secondary italic leading-relaxed">
                  &ldquo;{rev.yorum}&rdquo;
                </p>

                {/* Google Doğrulanmış Link Bilgisi */}
                {rev.kaynak === "Google" && (
                  <div className="mt-2 pt-2 border-t border-dashed border-border/80 flex items-center justify-between gap-2 text-xs">
                    {rev.googleReviewUrl ? (
                      <>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            ✓ Doğrulanmış Google Linki
                          </span>
                          <span className="text-[10px] text-text-secondary truncate font-mono">
                            {rev.googleReviewUrl}
                          </span>
                        </div>
                        <a
                          href={rev.googleReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-gold hover:text-accent-gold/80 transition-colors shrink-0"
                        >
                          <span>Google&apos;da Aç</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </>
                    ) : (
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ℹ Doğrudan bağlantı atanmamış
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Alt Satır: Müşteri Bilgisi & Sil Butonu */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-serif font-bold text-text-primary block">
                    {rev.musteriAdi}
                  </span>
                  <span className="text-[11px] text-text-secondary">{rev.tarih}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`"${rev.musteriAdi}" tarafından yapılan yorumu silmek istediğinize emin misiniz?`)) {
                      onDeleteReview(rev.id);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Sil</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
